'use client';
import { useState } from 'react';
import {
  signInWithEmailAndPassword,
  linkWithCredential, EmailAuthProvider, User,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDocs, collection, setDoc, deleteDoc } from 'firebase/firestore';

type Mode = 'choose' | 'login' | 'register';

const formatPhone = (v: string) => {
  const digits = v.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
};

const WELCOME_BONUS = 50;
const SAQUE_MINIMO = 2000;

const saveMemberProfile = async (u: User | null, phone?: string, isNew?: boolean) => {
  if (!u || u.isAnonymous || !u.email) return;
  const ref = doc(db, 'members', u.uid);

  if (isNew) {
    // Create document fresh with welcome bonus as plain number
    const data: any = {
      email: u.email,
      displayName: u.displayName || null,
      provider: u.providerData?.[0]?.providerId || 'password',
      joinedAt: u.metadata?.creationTime || null,
      lastLogin: new Date().toISOString(),
      uid: u.uid,
      votaCoins: WELCOME_BONUS,
      voteCount: 0,
      welcomeBonusGranted: true,
    };
    if (phone) data.phone = phone.replace(/\D/g, '');
    await setDoc(ref, data).catch(e => console.error('members write error:', e));
  } else {
    // Existing user — just update login fields, never touch votaCoins
    const data: any = {
      email: u.email,
      displayName: u.displayName || null,
      provider: u.providerData?.[0]?.providerId || 'password',
      lastLogin: new Date().toISOString(),
      uid: u.uid,
    };
    if (phone) data.phone = phone.replace(/\D/g, '');
    await setDoc(ref, data, { merge: true }).catch(e => console.error('members write error:', e));
  }

  // Also save to subscribers if phone provided
  if (phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    await setDoc(doc(db, 'subscribers', u.uid), {
      phone: cleanPhone,
      name: u.displayName || u.email,
      userId: u.uid,
      active: true,
      joinedAt: new Date().toISOString(),
    }, { merge: true }).catch(() => null);
  }
};

const migrateVotes = async (fromUid: string, toUid: string) => {
  try {
    const snap = await getDocs(collection(db, `users/${fromUid}/votes`));
    await Promise.all(snap.docs.map(d =>
      setDoc(doc(db, `users/${toUid}/votes/${d.id}`), d.data())
    ));
    const subSnap = await getDocs(collection(db, 'subscribers'));
    const sub = subSnap.docs.find(d => d.id === fromUid);
    if (sub) {
      await setDoc(doc(db, 'subscribers', toUid), { ...sub.data(), userId: toUid });
      await deleteDoc(doc(db, 'subscribers', fromUid));
    }
  } catch (e) {
    console.error('migrate error', e);
  }
};

export default function AuthModal({ onClose, anonUid }: {
  onClose: () => void;
  anonUid?: string;
}) {
  const [mode, setMode] = useState<Mode>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailAuth = async () => {
    if (!email || password.length < 6) {
      setError('Email válido e senha com mínimo 6 caracteres.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const currentUser = auth.currentUser;
      const credential = EmailAuthProvider.credential(email, password);
      let isNew = false;

      if (mode === 'register') {
        if (currentUser?.isAnonymous) {
          try {
            await linkWithCredential(currentUser, credential);
            isNew = true;
          } catch (linkErr: any) {
            if (linkErr.code === 'auth/email-already-in-use') {
              setError('Este email já está cadastrado. Tente fazer login.');
              setLoading(false);
              return;
            }
            throw linkErr;
          }
        } else {
          const { createUserWithEmailAndPassword } = await import('firebase/auth');
          await createUserWithEmailAndPassword(auth, email, password);
          isNew = true;
        }
      } else {
        const prevUid = currentUser?.isAnonymous ? anonUid : undefined;
        const result = await signInWithEmailAndPassword(auth, email, password);
        if (prevUid && prevUid !== result.user.uid) await migrateVotes(prevUid, result.user.uid);
      }
      await saveMemberProfile(auth.currentUser, phone || undefined, isNew);
      onClose();
    } catch (e: any) {
      if (e.code === 'auth/user-not-found' || e.code === 'auth/wrong-password' || e.code === 'auth/invalid-credential') {
        setError('Email ou senha incorretos.');
      } else if (e.code === 'auth/email-already-in-use') {
        setError('Email já cadastrado. Faça login.');
      } else if (e.code === 'auth/invalid-email') {
        setError('Email inválido.');
      } else {
        setError('Erro inesperado. Tente novamente.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-sm rounded-2xl p-6 border" style={{ background: '#13131A', borderColor: 'rgba(255,255,255,0.1)' }}>

        <div className="flex items-center justify-between mb-6">
          <div>
            {mode !== 'choose' && (
              <button onClick={() => { setMode('choose'); setError(''); }} className="text-xs mb-1 flex items-center gap-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                ← Voltar
              </button>
            )}
            <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
              {mode === 'choose' ? 'ENTRAR' : mode === 'login' ? 'LOGIN' : 'CADASTRO'}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>
              {mode === 'register'
                ? `🪙 Ganhe ${WELCOME_BONUS} VotaCoins de boas-vindas!`
                : mode === 'login' ? 'Entre na sua conta'
                : 'Vote e ganhe VotaCoins'}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>✕</button>
        </div>

        {mode === 'choose' && (
          <div className="space-y-3">
            {/* VotaCoins banner */}
            <div className="p-3 rounded-xl text-center mb-1" style={{ background: 'rgba(247,183,49,0.08)', border: '1px solid rgba(247,183,49,0.2)' }}>
              <p className="text-xs font-bold" style={{ color: '#F7B731' }}>🪙 Ganhe VotaCoins votando!</p>
              <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.4)' }}>1 voto = 1 VotaCoin = R$0,01 · Saque mín. R${SAQUE_MINIMO / 100}</p>
            </div>
            <button onClick={() => setMode('login')} className="w-full py-3.5 rounded-xl font-bold text-sm transition-all" style={{ background: '#6C63FF', color: 'white' }}>
              Entrar com email
            </button>
            <button onClick={() => setMode('register')} className="w-full py-3.5 rounded-xl font-bold text-sm border transition-all hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}>
              Criar conta com email
            </button>
            <button onClick={onClose} className="w-full py-2 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              Continuar sem conta
            </button>
          </div>
        )}

        {(mode === 'login' || mode === 'register') && (
          <div className="space-y-3">
            <input
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: error ? '#FF525244' : 'rgba(255,255,255,0.1)' }}
              placeholder="Email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              inputMode="email"
              autoCapitalize="none"
            />
            <input
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: error ? '#FF525244' : 'rgba(255,255,255,0.1)' }}
              placeholder="Senha (mínimo 6 caracteres)"
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
            />
            {mode === 'register' && (
              <div className="relative">
                <input
                  className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                  placeholder="(11) 99999-9999"
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  inputMode="tel"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>opcional</span>
              </div>
            )}
            {error && <p className="text-xs px-1" style={{ color: '#FF5252' }}>{error}</p>}
            {mode === 'register' && (
              <div className="px-1 py-2 rounded-xl text-xs text-center" style={{ background: 'rgba(247,183,49,0.08)', color: '#F7B731' }}>
                🪙 +{WELCOME_BONUS} VotaCoins de boas-vindas ao cadastrar!
              </div>
            )}
            <button
              onClick={handleEmailAuth}
              disabled={loading || !email || password.length < 6}
              className="w-full py-3.5 rounded-xl font-black text-sm transition-all"
              style={{
                background: email && password.length >= 6 ? '#6C63FF' : 'rgba(255,255,255,0.07)',
                color: email && password.length >= 6 ? 'white' : 'rgba(255,255,255,0.3)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.1em',
              }}
            >
              {loading ? 'AGUARDE...' : mode === 'login' ? 'ENTRAR' : 'CADASTRAR'}
            </button>
            <button onClick={() => setMode(mode === 'login' ? 'register' : 'login')} className="w-full py-2 text-xs text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
              {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
