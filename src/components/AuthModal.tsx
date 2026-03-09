'use client';
import { useState } from 'react';
import {
  GoogleAuthProvider, signInWithPopup, createUserWithEmailAndPassword,
  signInWithEmailAndPassword, linkWithCredential, EmailAuthProvider,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, getDocs, collection, setDoc, deleteDoc } from 'firebase/firestore';

type Mode = 'choose' | 'login' | 'register';

export default function AuthModal({ onClose, anonUid }: {
  onClose: () => void;
  anonUid?: string;
}) {
  const [mode, setMode] = useState<Mode>('choose');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const migrateVotes = async (fromUid: string, toUid: string) => {
    try {
      const snap = await getDocs(collection(db, `users/${fromUid}/votes`));
      await Promise.all(snap.docs.map(d =>
        setDoc(doc(db, `users/${toUid}/votes/${d.id}`), d.data())
      ));
      // Migrate subscriber if exists
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

  const handleGoogle = async () => {
    setLoading(true);
    setError('');
    try {
      const provider = new GoogleAuthProvider();
      if (anonUid) {
        // Try to link anonymous account with Google
        const credential = GoogleAuthProvider.credentialFromResult(
          await signInWithPopup(auth, provider)
        );
        if (credential) {
          await migrateVotes(anonUid, auth.currentUser!.uid);
        }
      } else {
        await signInWithPopup(auth, provider);
      }
      onClose();
    } catch (e: any) {
      if (e.code === 'auth/credential-already-in-use' || e.code !== 'auth/popup-closed-by-user') {
        // Already has account - just sign in normally
        try {
          const provider2 = new GoogleAuthProvider();
          const result = await signInWithPopup(auth, provider2);
          await migrateVotes(anonUid!, result.user.uid);
          onClose();
        } catch { setError('Erro ao entrar com Google.'); }
      }
    }
    setLoading(false);
  };

  const handleEmailAuth = async () => {
    if (!email || password.length < 6) {
      setError('Email válido e senha com mínimo 6 caracteres.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      let newUid: string;
      if (mode === 'register') {
        // Try to link anon account first
        if (anonUid && auth.currentUser?.isAnonymous) {
          try {
            const credential = EmailAuthProvider.credential(email, password);
            await linkWithCredential(auth.currentUser, credential);
            newUid = auth.currentUser.uid;
          } catch (linkErr: any) {
            if (linkErr.code === 'auth/email-already-in-use') {
              setError('Este email já está cadastrado. Tente fazer login.');
              setLoading(false);
              return;
            }
            const result = await createUserWithEmailAndPassword(auth, email, password);
            newUid = result.user.uid;
          }
        } else {
          const result = await createUserWithEmailAndPassword(auth, email, password);
          newUid = result.user.uid;
        }
        if (anonUid && newUid !== anonUid) await migrateVotes(anonUid, newUid);
      } else {
        const prevUid = anonUid;
        const result = await signInWithEmailAndPassword(auth, email, password);
        if (prevUid && prevUid !== result.user.uid) await migrateVotes(prevUid, result.user.uid);
      }
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

        {/* Header */}
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
              {mode === 'choose' ? 'Seus votos serão migrados' : mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
            </p>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-xs" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>✕</button>
        </div>

        {mode === 'choose' && (
          <div className="space-y-3">
            {/* Google */}
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl font-bold text-sm border transition-all hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'white' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
              Continuar com Google
            </button>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>ou</span>
              <div className="flex-1 h-px" style={{ background: 'rgba(255,255,255,0.08)' }} />
            </div>

            {/* Email options */}
            <button
              onClick={() => setMode('login')}
              className="w-full py-3.5 rounded-xl font-bold text-sm transition-all"
              style={{ background: '#6C63FF', color: 'white' }}
            >
              Entrar com email
            </button>
            <button
              onClick={() => setMode('register')}
              className="w-full py-3.5 rounded-xl font-bold text-sm border transition-all hover:bg-white/5"
              style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
            >
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
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: error ? '#FF525244' : 'rgba(255,255,255,0.1)' }}
              placeholder="Email"
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              inputMode="email"
              autoCapitalize="none"
            />
            <input
              className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border transition-all"
              style={{ background: 'rgba(255,255,255,0.05)', borderColor: error ? '#FF525244' : 'rgba(255,255,255,0.1)' }}
              placeholder="Senha (mínimo 6 caracteres)"
              type="password"
              value={password}
              onChange={e => { setPassword(e.target.value); setError(''); }}
            />
            {error && <p className="text-xs px-1" style={{ color: '#FF5252' }}>{error}</p>}
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
            <button
              onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
              className="w-full py-2 text-xs text-center"
              style={{ color: 'rgba(255,255,255,0.35)' }}
            >
              {mode === 'login' ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Entre'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
