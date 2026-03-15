'use client';
import React from 'react';
import { useState, useEffect, useCallback, useRef } from 'react';
import PollCard from '@/components/PollCard';
import CreatePollModal from '@/components/CreatePollModal';
import CityMap from '@/components/CityMap';
import { subscribeToPolls, getUserVotes, castVote, createPoll, seedPolls, ensureAuth } from '@/lib/polls';
import { auth, db } from '@/lib/firebase';
import WhatsAppModal from '@/components/WhatsAppModal';
import AuthModal from '@/components/AuthModal';
import VotaCoin from '@/components/VotaCoin';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';

const EMAILJS_SERVICE = 'service_66uw6li';
const EMAILJS_TEMPLATE = 'template_76po9x4';
const EMAILJS_PUBKEY = 'eT0ZVOr7EfY3mr8Ty';

async function sendEmailJS(params: Record<string, string>) {
  const res = await fetch(`https://api.emailjs.com/api/v1.0/email/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      service_id: EMAILJS_SERVICE,
      template_id: EMAILJS_TEMPLATE,
      user_id: EMAILJS_PUBKEY,
      accessToken: EMAILJS_PUBKEY,
      template_params: params,
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text);
  }
  return res;
}

const TOPICS = [
  '💡 Sugestão de enquete',
  '🐛 Reportar problema',
  '💸 Dúvida sobre VotaCoins',
  '🤝 Parceria / Imprensa',
  '🔒 Privacidade / Conta',
  '💬 Outro assunto',
];

function ContatoForm({ userEmail, userName }: { userEmail: string; userName: string }) {
  const [open, setOpen] = useState(false);
  const [topic, setTopic] = useState('');
  const [message, setMessage] = useState('');
  const [step, setStep] = useState<'form' | 'sending' | 'done'>('form');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!topic || message.trim().length < 10) {
      setError('Selecione um assunto e escreva sua mensagem (mín. 10 caracteres).');
      return;
    }
    setStep('sending');
    setError('');
    try {
      const res = await fetch('/api/contato', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from_name: userName,
          user_email: userEmail,
          topic,
          message,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStep('done');
      } else {
        setError('Erro ao enviar: ' + (data.error || 'tente novamente'));
        setStep('form');
      }
    } catch (err: any) {
      console.error('EmailJS error:', err);
      setError('Erro ao enviar. Tente novamente.');
      setStep('form');
    }
  };

  const inp: React.CSSProperties = {
    width: '100%', padding: '11px 14px', borderRadius: 12,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(255,255,255,0.04)', color: 'white',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
    fontFamily: 'inherit',
  };

  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full py-3 rounded-xl text-sm font-bold border transition-all hover:bg-white/5 mb-2 flex items-center justify-center gap-2"
        style={{ borderColor: 'rgba(108,99,255,0.3)', color: '#6C63FF' }}
      >
        📨 Fale Conosco {open ? '▲' : '▼'}
      </button>

      {open && (
        <div className="rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(108,99,255,0.2)' }}>
          {step === 'done' ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-black text-white mb-1">Mensagem enviada!</p>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>Responderemos em breve. Obrigado!</p>
              <button onClick={() => { setStep('form'); setTopic(''); setMessage(''); setOpen(false); }}
                className="mt-4 px-5 py-2 rounded-xl text-xs font-bold border"
                style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}>
                Fechar
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p className="text-xs font-bold tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>ASSUNTO</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {TOPICS.map(t => (
                  <button key={t} onClick={() => { setTopic(t); setError(''); }}
                    className="text-left transition-all"
                    style={{
                      padding: '10px 14px', borderRadius: 10,
                      border: `1px solid ${topic === t ? 'rgba(108,99,255,0.5)' : 'rgba(255,255,255,0.07)'}`,
                      background: topic === t ? 'rgba(108,99,255,0.12)' : 'rgba(255,255,255,0.03)',
                      color: topic === t ? 'white' : 'rgba(255,255,255,0.5)',
                      fontSize: 13, cursor: 'pointer', fontWeight: topic === t ? 600 : 400,
                    }}>
                    {t}
                  </button>
                ))}
              </div>

              <textarea
                value={message}
                onChange={e => { setMessage(e.target.value); setError(''); }}
                placeholder="Escreva sua mensagem..."
                rows={4}
                style={{ ...inp, resize: 'none', lineHeight: 1.6, marginTop: 4 }}
              />

              {error && <p className="text-xs" style={{ color: '#FF5252' }}>{error}</p>}

              <button
                onClick={handleSubmit}
                disabled={step === 'sending'}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: topic && message.trim().length >= 10
                    ? 'linear-gradient(90deg, #6C63FF, #FF4E8C)'
                    : 'rgba(255,255,255,0.07)',
                  color: topic && message.trim().length >= 10 ? 'white' : 'rgba(255,255,255,0.3)',
                  border: 'none', cursor: 'pointer',
                }}>
                {step === 'sending' ? '⏳ Enviando...' : '📨 Enviar mensagem'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function fmt(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

function SaqueForm({ coins, email, uid, onSaque }: { coins: number; email: string; uid: string; onSaque: () => void }) {
  const [pixKey, setPixKey] = useState('');
  const [pixType, setPixType] = useState<'cpf' | 'email' | 'telefone' | 'aleatoria'>('email');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSaque = async () => {
    if (!pixKey.trim()) return;
    setSending(true);
    try {
      const { doc, setDoc, serverTimestamp, updateDoc } = await import('firebase/firestore');
      const { db } = await import('@/lib/firebase');
      // Save withdrawal request to Firestore
      const saqueId = `${uid}_${Date.now()}`;
      await setDoc(doc(db, 'saques', saqueId), {
        uid,
        email,
        coins,
        valor: parseFloat((coins * 0.01).toFixed(2)),
        pixKey: pixKey.trim(),
        pixType,
        status: 'pendente',
        requestedAt: serverTimestamp(),
      });
      // Zero out coins
      await updateDoc(doc(db, 'members', uid), { votaCoins: 0 });
      setSent(true);
      onSaque();
    } catch (e) {
      console.error('Saque error:', e);
    }
    setSending(false);
  };

  if (sent) return (
    <div className="text-center py-4">
      <div className="text-3xl mb-2">🎉</div>
      <p className="text-sm font-black text-white">Solicitação enviada!</p>
      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Você receberá R${(coins * 0.01).toFixed(2)} via PIX em até 48h úteis.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <p className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.5)' }}>
        Valor a receber: <span style={{ color: '#4ADE80' }}>R${(coins * 0.01).toFixed(2)}</span>
      </p>
      {/* PIX type selector */}
      <div className="grid grid-cols-4 gap-1">
        {(['cpf','email','telefone','aleatoria'] as const).map(t => (
          <button key={t} onClick={() => setPixType(t)}
            className="py-1.5 rounded-lg text-xs font-bold transition-all capitalize"
            style={{
              background: pixType === t ? 'rgba(34,197,94,0.2)' : 'rgba(255,255,255,0.05)',
              color: pixType === t ? '#4ADE80' : 'rgba(255,255,255,0.3)',
              border: `1px solid ${pixType === t ? 'rgba(34,197,94,0.4)' : 'transparent'}`,
            }}>
            {t === 'aleatoria' ? 'Aleat.' : t}
          </button>
        ))}
      </div>
      <input
        className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border"
        style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(34,197,94,0.3)' }}
        placeholder={
          pixType === 'cpf' ? '000.000.000-00' :
          pixType === 'email' ? 'seu@email.com' :
          pixType === 'telefone' ? '(11) 99999-9999' :
          'Chave aleatória'
        }
        value={pixKey}
        onChange={e => setPixKey(e.target.value)}
      />
      <button
        onClick={handleSaque}
        disabled={!pixKey.trim() || sending}
        className="w-full py-3 rounded-xl text-sm font-black transition-all"
        style={{
          background: pixKey.trim() ? 'linear-gradient(90deg, #22C55E, #16A34A)' : 'rgba(255,255,255,0.07)',
          color: pixKey.trim() ? 'white' : 'rgba(255,255,255,0.3)',
        }}
      >
        {sending ? '⏳ Enviando...' : '💸 Solicitar saque via PIX'}
      </button>
      <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.2)' }}>
        Seus coins serão zerados após a solicitação
      </p>
    </div>
  );
}

function HomeCore() {
  const highlightSlug = typeof window !== 'undefined' ? sessionStorage.getItem('highlightSlug') || undefined : undefined;
  const [polls, setPolls] = useState<any[]>([]);
  const [votes, setVotes] = useState<Record<string, string>>({});
  const [user, setUser] = useState<User | null>(null);
  const [tab, setTab] = useState<'feed' | 'trending' | 'perfil'>('feed');
  const [showCreate, setShowCreate] = useState(false);
  const [showCity, setShowCity] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const [notif, setNotif] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [city, setCity] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [votaCoins, setVotaCoins] = useState(0);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const pollRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const hasVotedRef = useRef(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        const user = await ensureAuth();
        setUser(user);
      } else {
        setUser(u);
        // Listen to members doc in real-time so bonus/coins update immediately
        if (!u.isAnonymous && u.email) {
          const unsubMember = onSnapshot(doc(db, 'members', u.uid), snap => {
            if (snap.exists()) {
              const data = snap.data();
              setVotaCoins(data?.votaCoins ?? 0);
              if (data?.phone) setIsSubscribed(true);
            }
          }, e => console.error('[members] onSnapshot error:', e));
          // Update last login metadata
          setDoc(doc(db, 'members', u.uid), {
            email: u.email,
            displayName: u.displayName || null,
            lastLogin: new Date().toISOString(),
          }, { merge: true }).catch(() => null);
          return unsubMember;
        }
      }
    });
    return unsub;
  }, []);

  // Geolocation
  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then(r => r.json())
      .then(d => setCity(d.city || null))
      .catch(() => null);
  }, []);

  // Polls — wait for auth before subscribing
  useEffect(() => {
    if (!user) return;
    seedPolls().catch(() => null);
    const unsub = subscribeToPolls((p) => {
      const sorted = [...p].sort((a, b) => {
        if (a.pinned && !b.pinned) return -1;
        if (!a.pinned && b.pinned) return 1;
        return 0;
      });
      setPolls(sorted);
      setLoading(false);
    });
    return unsub;
  }, [user]);

  // Scroll to highlighted poll — clear sessionStorage after scroll so votes don't re-trigger it
  useEffect(() => {
    if (!highlightSlug || polls.length === 0) return;
    const poll = polls.find(p => p.slug === highlightSlug);
    if (!poll) return;
    setHighlightedId(poll.id);
    setTimeout(() => {
      const el = pollRefs.current[poll.id];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        sessionStorage.removeItem('highlightSlug');
        setTimeout(() => setHighlightedId(null), 3000);
      }
    }, 500);
  }, [highlightSlug, polls]);

  // User votes + check subscription
  useEffect(() => {
    if (!user) return;
    getUserVotes(user.uid).then(v => {
      setVotes(v);
      if (Object.keys(v).length > 0) hasVotedRef.current = true;
    });
    getDoc(doc(db, 'subscribers', user.uid)).then(snap => {
      if (snap.exists()) setIsSubscribed(true);
    }).catch(() => null);
  }, [user]);

  const showNotif = (msg: string) => {
    setNotif(msg);
    setTimeout(() => setNotif(null), 2500);
  };

  const handleVote = useCallback(async (id: string, choice: string) => {
    if (!user || votes[id]) return;
    setVotes(v => ({ ...v, [id]: choice }));
    const ns = streak + 1;
    setStreak(ns);
    if (ns === 3) showNotif('🔥 3 seguidas! Você tá no flow!');
    else if (ns === 5) showNotif('⚡ 5 votos! Vicia fácil hein?');
    else if (ns === 10) showNotif('👑 10 votos! Rei das enquetes!');
    await castVote(id, choice, user.uid, city || undefined, user.isAnonymous);
    if (!user.isAnonymous) setVotaCoins(c => c + 1);
    // Show WhatsApp modal after first vote if not subscribed
    if (!hasVotedRef.current) {
      hasVotedRef.current = true;
      const sub = await getDoc(doc(db, 'subscribers', user.uid));
      if (!sub.exists()) setTimeout(() => setShowWhatsApp(true), 1500);
    }
  }, [user, votes, streak, city]);

  const [newPoll, setNewPoll] = useState<any>(null);
  const [profileTab, setProfileTab] = useState<'stats' | 'enquetes' | 'historico'>('stats');

  const handleCreate = async (data: any) => {
    if (!user) return;
    const ref = await createPoll({ ...data, userId: user.uid });
    setNewPoll({ ...data, id: ref.id });
  };



  const hotPoll = polls.find(p => p.hotOfDay);
  const trending = [
    ...(hotPoll ? [hotPoll] : []),
    ...[...polls]
      .filter(p => !p.hotOfDay)
      .sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0))
  ];
  const allTags = ['todos', ...Array.from(new Set(polls.map(p => p.tag).filter(Boolean)))].slice(0, 12);
  const filteredPolls = polls.filter(p => {
    const matchesTag = !activeTag || activeTag === 'todos' || p.tag === activeTag;
    const matchesSearch = !search || p.question?.toLowerCase().includes(search.toLowerCase()) ||
      p.optionA?.label?.toLowerCase().includes(search.toLowerCase()) ||
      p.optionB?.label?.toLowerCase().includes(search.toLowerCase());
    return matchesTag && matchesSearch;
  });
  const votedCount = Object.keys(votes).length;
  const isAnon = user?.isAnonymous;

  return (
    <div className="min-h-screen" style={{ background: '#07070E' }}>
      {/* Notification */}
      {notif && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white font-bold text-sm shadow-2xl animate-fade-up" style={{ background: '#6C63FF', minWidth: 200, textAlign: 'center' }}>
          {notif}
        </div>
      )}

      {/* Desktop layout */}
      <div className="max-w-6xl mx-auto flex min-h-screen" style={{ width: '100%' }}>

        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 p-6 sticky top-0 h-screen border-r" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="mb-10">
            <a href="/" className="text-4xl text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em', textDecoration: 'none' }}>VOTAAI</a>
            <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>Qual é a sua?</p>
          </div>

          <nav className="space-y-1 flex-1">
            {[
              { id: 'feed', icon: '🏠', label: 'Feed' },
              { id: 'trending', icon: '📈', label: 'Trending' },
              { id: 'perfil', icon: '👤', label: 'Perfil' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setTab(item.id as any)}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all text-left"
                style={{
                  background: tab === item.id ? 'rgba(108,99,255,0.15)' : 'transparent',
                  color: tab === item.id ? '#6C63FF' : 'rgba(255,255,255,0.5)',
                }}
              >
                <span className="text-lg">{item.icon}</span> {item.label}
              </button>
            ))}
          </nav>

          <div className="space-y-3">
            {streak >= 3 && (
              <div className="px-4 py-3 rounded-xl text-sm font-bold" style={{ background: '#FF6B3520', color: '#FF6B35' }}>
                🔥 Streak de {streak}!
              </div>
            )}
            <button
              onClick={() => setShowCreate(true)}
              className="w-full py-3 rounded-xl font-black text-sm text-white transition-all hover:opacity-90 animate-pulse-glow"
              style={{ background: '#6C63FF', fontFamily: 'var(--font-display)', letterSpacing: '0.1em', fontSize: '1rem' }}
            >
              + CRIAR
            </button>
            {isAnon ? (
              <button onClick={() => setShowAuth(true)} className="w-full py-3 rounded-xl text-sm font-bold border transition-all hover:bg-white/5" style={{ borderColor: '#6C63FF66', color: '#6C63FF' }}>
                👤 Entrar / Cadastrar
              </button>
            ) : (
              <div className="space-y-2">
                <button onClick={() => setTab('perfil')} className="w-full flex items-center justify-between px-3 py-2 rounded-xl transition-all hover:bg-white/5" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}>
                  <div className="flex items-center gap-2">
                    <VotaCoin size={18} />
                    <span className="text-sm font-black" style={{ color: '#4ADE80' }}>{votaCoins} coins</span>
                  </div>
                  <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>= R${(votaCoins * 0.01).toFixed(2)}</span>
                </button>
                <div className="px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>
                  👤 {user?.displayName || user?.email || 'Anônimo'}
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Fixed mobile header */}
        <header className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-3 md:hidden" style={{ background: 'rgba(7,7,14,0.92)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div>
            <a href="/" onClick={e => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="text-3xl text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em', textDecoration: 'none' }}>VOTAAI</a>
            {votedCount > 0 && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{votedCount} votos • 🔥 {streak}</p>}
          </div>
          <div className="flex gap-2 items-center">
            {streak >= 3 && <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: '#FF6B3520', color: '#FF6B35' }}>🔥{streak}</span>}
            {isAnon ? (
              <button onClick={() => setShowAuth(true)} className="px-3 py-2 rounded-xl text-xs font-black border" style={{ borderColor: '#6C63FF66', color: '#6C63FF' }}>Entrar</button>
            ) : (
              <div className="flex items-center gap-2">
                <button onClick={() => setTab('perfil')} className="flex items-center gap-1 px-2 py-1 rounded-full" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <VotaCoin size={16} />
                    <span className="text-xs font-black" style={{ color: '#4ADE80' }}>{votaCoins}</span>
                  </button>
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black" style={{ background: '#6C63FF22', color: '#6C63FF', border: '1px solid #6C63FF44' }}>
                  {(user?.displayName || user?.email || '?')[0].toUpperCase()}
                </div>
              </div>
            )}
            <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl text-sm font-black text-white" style={{ background: '#6C63FF' }}>+ Criar</button>
          </div>
        </header>

        {/* Main content */}
        <main className="flex-1 px-4 pt-20 pb-24 md:pt-6 md:pb-6" style={{ minWidth: 0, width: '100%', maxWidth: 576, boxSizing: 'border-box', margin: '0 auto' }}>

          {/* FEED */}
          {tab === 'feed' && (
            <div>
              {/* Search */}
              <div className="mb-3">
                <input
                  className="w-full rounded-2xl px-4 py-3 text-sm text-white outline-none border transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: search ? '#6C63FF' : 'rgba(255,255,255,0.08)' }}
                  placeholder="🔍 Buscar enquetes..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
              {/* Category filters */}
              <div className="mb-4" style={{ display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%' }}>
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag === 'todos' ? null : tag)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold border transition-all capitalize"
                    style={{
                      borderColor: (activeTag === tag || (tag === 'todos' && !activeTag)) ? '#6C63FF' : 'rgba(255,255,255,0.1)',
                      background: (activeTag === tag || (tag === 'todos' && !activeTag)) ? 'rgba(108,99,255,0.2)' : 'transparent',
                      color: (activeTag === tag || (tag === 'todos' && !activeTag)) ? '#6C63FF' : 'rgba(255,255,255,0.4)',
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {loading ? (
                <div className="space-y-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="rounded-2xl p-6 animate-pulse" style={{ background: 'rgba(255,255,255,0.03)', height: 200 }} />
                  ))}
                </div>
              ) : (
                filteredPolls.map((poll, i) => (
                  <div key={poll.id} ref={el => { pollRefs.current[poll.id] = el; }} style={{ animationDelay: `${i * 0.05}s`, transition: 'box-shadow 0.5s', borderRadius: 16, boxShadow: highlightedId === poll.id ? '0 0 0 3px #FF4E8C, 0 0 30px #FF4E8C44' : 'none' }} className="animate-fade-up">
                    <PollCard poll={poll} onVote={handleVote} userVote={votes[poll.id]} userId={user?.uid} isFirstVote={!isSubscribed && !!votes[poll.id]} onSubscribed={() => setIsSubscribed(true)} isAnon={isAnon} onShowAuth={() => setShowAuth(true)} />

                    {showCity === poll.id && (
                      <div className="rounded-2xl p-5 mb-4 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                        <p className="text-xs font-bold tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>RESULTADO POR CIDADE</p>
                        <CityMap poll={poll} color={poll.color} />
                      </div>
                    )}
                  </div>
                ))
              )}
              {!loading && filteredPolls.length === 0 && (
                <div className="text-center py-20" style={{ color: 'rgba(255,255,255,0.3)' }}>
                  {search || activeTag ? '🔍 Nenhuma enquete encontrada' : 'Nenhuma enquete ainda. Crie a primeira! 🚀'}
                </div>
              )}
            </div>
          )}

          {/* TRENDING */}
          {tab === 'trending' && (
            <div>
              <h2 className="text-3xl mb-1 text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>TRENDING</h2>
              <p className="text-xs mb-6" style={{ color: 'rgba(255,255,255,0.3)' }}>Enquetes mais votadas agora</p>
              {trending.map((poll, i) => {
                const total = poll.totalVotes || 0;
                const pctA = total > 0 ? Math.round(((poll.votesA||0) / total) * 100) : 50;
                const medals = ['🥇','🥈','🥉'];
                const mColors = ['#F7B731','#AAAAAA','#CD7F32'];
                const isHot = poll.hotOfDay && i === 0;
                const pollUrl = poll.slug ? `/p/${poll.slug}` : null;
                const CardWrapper = ({ children }: { children: React.ReactNode }) => pollUrl ? (
                  <a href={pollUrl} className="flex gap-4 p-5 rounded-2xl mb-3 border block transition-all hover:opacity-80" style={{ background: isHot ? 'rgba(255,78,140,0.07)' : 'rgba(255,255,255,0.03)', borderColor: isHot ? '#FF4E8C44' : poll.color + '22', textDecoration: 'none' }}>
                    {children}
                  </a>
                ) : (
                  <div className="flex gap-4 p-5 rounded-2xl mb-3 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: poll.color + '22' }}>
                    {children}
                  </div>
                );
                return (
                  <CardWrapper key={poll.id}>
                    <div className="flex gap-4 flex-1 min-w-0">
                      <span className="text-2xl font-black shrink-0" style={{ color: isHot ? '#FF4E8C' : i < 3 ? mColors[i] : 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-display)' }}>
                        {isHot ? '🔥' : i < 3 ? medals[i] : `#${i+1}`}
                      </span>
                      <div className="flex-1 min-w-0">
                        {isHot && <span className="text-xs font-black tracking-widest px-2 py-0.5 rounded-full mb-1 inline-block" style={{ background: '#FF4E8C22', color: '#FF4E8C' }}>POLÊMICA DO DIA</span>}
                        <p className="text-sm font-bold text-white truncate">{poll.question}</p>
                        <p className="text-xs mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>{poll.optionA?.emoji} {poll.optionA?.label} <span style={{ color: 'rgba(255,255,255,0.2)' }}>vs</span> {poll.optionB?.emoji} {poll.optionB?.label}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                            <div className="h-full rounded-full" style={{ width: `${pctA}%`, background: isHot ? '#FF4E8C' : poll.color }} />
                          </div>
                          <span className="text-xs font-bold shrink-0" style={{ color: isHot ? '#FF4E8C' : poll.color }}>{pctA}%</span>
                        </div>
                        <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{fmt(total)} votos</p>
                      </div>
                    </div>
                  </CardWrapper>
                );
              })}
            </div>
          )}

          {/* PERFIL */}
          {tab === 'perfil' && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <button onClick={() => setTab('feed')} className="text-2xl font-black text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em', background: 'none', border: 'none', cursor: 'pointer' }}>← VOTAAI</button>
              </div>
              {/* Sub-tabs */}
              {!isAnon && (
                <div className="flex gap-2 mb-5">
                  {([['stats','📊 Perfil'],['enquetes','📋 Minhas Enquetes'],['historico','🗳️ Histórico']] as const).map(([id, label]) => (
                    <button key={id} onClick={() => setProfileTab(id)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                      style={{ background: profileTab === id ? '#6C63FF' : 'rgba(255,255,255,0.05)', color: profileTab === id ? 'white' : 'rgba(255,255,255,0.4)', border: 'none', cursor: 'pointer' }}>
                      {label}
                    </button>
                  ))}
                </div>
              )}
              {/* Avatar sempre visível */}
              <div className="rounded-2xl p-6 mb-4 text-center border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: '#6C63FF33' }}>
                <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl border-2" style={{ background: '#6C63FF22', borderColor: '#6C63FF' }}>
                  {isAnon ? '🗳️' : '😎'}
                </div>
                <p className="font-black text-white text-lg">{user?.displayName || (isAnon ? 'Votante Anônimo' : user?.email)}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{city ? `📍 ${city}` : 'Localização desconhecida'}</p>
                {isAnon && (
                  <button onClick={() => setShowAuth(true)} className="mt-4 px-5 py-2 rounded-xl text-sm font-bold border" style={{ borderColor: '#6C63FF66', color: '#6C63FF' }}>
                    📧 Criar conta
                  </button>
                )}
              </div>

              {/* Aba Stats */}
              {(isAnon || profileTab === 'stats') && (
                <>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {[
                      { label: 'Votos dados', value: votedCount, emoji: '🗳️', color: '#6C63FF' },
                      { label: 'Streak atual', value: `${streak}🔥`, emoji: '⚡', color: '#FF6B35' },
                      { label: 'Enquetes criadas', value: polls.filter(p => p.createdBy === user?.uid).length, emoji: '📋', color: '#00C9A7' },
                      { label: 'Cidade', value: city || '?', emoji: '📍', color: '#FF4E8C' },
                    ].map(stat => (
                      <div key={stat.label} className="p-4 rounded-2xl text-center border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: stat.color + '33' }}>
                        <div className="text-2xl mb-2">{stat.emoji}</div>
                        <div className="text-xl font-black" style={{ color: stat.color, fontFamily: 'var(--font-display)' }}>{stat.value}</div>
                        <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* VotaCoins card */}
                  {!isAnon && (
                    <div className="rounded-2xl p-5 mb-4 border" style={{ background: 'rgba(34,197,94,0.05)', borderColor: 'rgba(34,197,94,0.2)' }}>
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <VotaCoin size={22} />
                            <p className="text-xs font-bold tracking-widest" style={{ color: '#4ADE80' }}>VOTACOINS</p>
                          </div>
                          <p className="text-3xl font-black text-white mt-1" style={{ fontFamily: 'var(--font-display)' }}>{votaCoins} <span className="text-base" style={{ color: 'rgba(255,255,255,0.4)' }}>= R${(votaCoins * 0.01).toFixed(2)}</span></p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Saque mín.</p>
                          <p className="text-sm font-black" style={{ color: '#F7B731' }}>R$20,00</p>
                        </div>
                      </div>
                      <div className="mb-3">
                        <div className="flex justify-between text-xs mb-1" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          <span>{votaCoins} coins</span>
                          <span>2.000 coins</span>
                        </div>
                        <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min((votaCoins / 2000) * 100, 100)}%`, background: 'linear-gradient(90deg, #F7B731, #FF6B35)' }} />
                        </div>
                      </div>
                      {votaCoins >= 2000 ? (
                        <SaqueForm coins={votaCoins} email={user?.email || ''} uid={user?.uid || ''} onSaque={() => {}} />
                      ) : (
                        <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          Faltam {Math.max(0, 2000 - votaCoins)} coins para sacar · Vote mais enquetes!
                        </p>
                      )}
                    </div>
                  )}

                  {/* Fale Conosco */}
                  {!isAnon && <ContatoForm userEmail={user?.email || ''} userName={user?.displayName || user?.email || 'Membro'} />}

                  <button
                    onClick={() => { signOut(auth); setTab('feed'); }}
                    className="w-full py-3 rounded-xl text-sm font-bold border mb-6 transition-all hover:bg-white/5"
                    style={{ borderColor: 'rgba(255,82,82,0.3)', color: '#FF5252' }}
                  >
                    🚪 Sair da conta
                  </button>
                </>
              )}

              {/* Aba Minhas Enquetes */}
              {!isAnon && profileTab === 'enquetes' && (() => {
                const myPolls = polls.filter(p => p.createdBy === user?.uid);
                return (
                  <div>
                    {myPolls.length === 0 ? (
                      <div className="text-center py-12">
                        <div className="text-4xl mb-3">📋</div>
                        <p className="font-bold text-white mb-1">Nenhuma enquete criada</p>
                        <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>Crie sua primeira enquete e compartilhe com amigos!</p>
                        <button onClick={() => setShowCreate(true)}
                          className="mt-4 px-5 py-2 rounded-xl text-sm font-bold"
                          style={{ background: 'linear-gradient(90deg,#6C63FF,#FF4E8C)', color: 'white', border: 'none', cursor: 'pointer' }}>
                          ➕ Criar enquete
                        </button>
                      </div>
                    ) : (
                      myPolls.map(p => {
                        const total = (p.votesA || 0) + (p.votesB || 0);
                        const pctA = total > 0 ? Math.round((p.votesA / total) * 100) : 50;
                        const shareUrl = `https://votaai.app/p/${p.slug || p.id}`;
                        return (
                          <div key={p.id} className="rounded-2xl p-4 mb-3 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                            <p className="text-sm font-bold text-white mb-3">{p.question}</p>
                            <div className="flex gap-2 text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                              <span>🗳️ {total.toLocaleString('pt-BR')} votos</span>
                              <span>·</span>
                              <span style={{ color: p.color || '#6C63FF' }}>{p.optionA?.label} {pctA}%</span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (navigator.share) {
                                    navigator.share({ title: 'VotaAí', text: p.question, url: shareUrl });
                                  } else {
                                    navigator.clipboard.writeText(shareUrl);
                                    showNotif('🔗 Link copiado!');
                                  }
                                }}
                                className="flex-1 py-2 rounded-xl text-xs font-bold"
                                style={{ background: 'rgba(108,99,255,0.15)', color: '#6C63FF', border: '1px solid rgba(108,99,255,0.3)', cursor: 'pointer' }}>
                                📤 Compartilhar
                              </button>
                              <button
                                onClick={() => {
                                  const txt = encodeURIComponent(`${p.question}

Vote e ganhe VotaCoins! 👉 ${shareUrl}`);
                                  window.open(`https://wa.me/?text=${txt}`, '_blank');
                                }}
                                className="flex-1 py-2 rounded-xl text-xs font-bold"
                                style={{ background: 'rgba(37,211,102,0.12)', color: '#25D366', border: '1px solid rgba(37,211,102,0.25)', cursor: 'pointer' }}>
                                💬 WhatsApp
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })()}

              {/* Aba Histórico */}
              {!isAnon && profileTab === 'historico' && votedCount > 0 && (
                <>
                  <p className="text-xs font-bold tracking-widest mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>HISTÓRICO DE VOTOS</p>
                  {Object.entries(votes).map(([id, choice]) => {
                    const poll = polls.find(p => p.id === id);
                    if (!poll) return null;
                    const chosen = choice === 'A' ? poll.optionA : poll.optionB;
                    return (
                      <div key={id} className="flex items-center gap-3 p-4 rounded-xl mb-2 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
                        <span className="text-2xl">{chosen?.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{chosen?.label}</p>
                          <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>{poll.question}</p>
                        </div>
                        <span className="text-xs font-black px-2 py-1 rounded-lg border" style={{ color: poll.color, borderColor: poll.color + '44', background: poll.color + '11' }}>{choice}</span>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Mobile tab bar */}
      <div className="fixed bottom-0 left-0 right-0 md:hidden flex items-center px-4 pb-safe border-t" style={{ background: 'rgba(7,7,14,0.97)', backdropFilter: 'blur(20px)', borderColor: 'rgba(255,255,255,0.07)', paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        {[
          { id: 'feed', icon: '🏠', label: 'Feed' },
          { id: 'trending', icon: '📈', label: 'Trends' },
          { id: 'perfil', icon: '👤', label: 'Perfil' },
        ].map(item => (
          <button key={item.id} onClick={() => setTab(item.id as any)} className="flex-1 flex flex-col items-center py-3 gap-1">
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-bold" style={{ color: tab === item.id ? '#6C63FF' : 'rgba(255,255,255,0.3)' }}>{item.label}</span>
          </button>
        ))}
        <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl text-sm font-black text-white ml-2" style={{ background: '#6C63FF' }}>+ Criar</button>
      </div>

      {showAuth && (
        <AuthModal onClose={() => setShowAuth(false)} anonUid={isAnon ? user?.uid : undefined} />
      )}
      {showCreate && <CreatePollModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}

      {/* Pop-up pós-criação */}
      {newPoll && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setNewPoll(null)} />
          <div className="relative w-full max-w-sm rounded-3xl p-6 border" style={{ background: '#13131A', borderColor: 'rgba(108,99,255,0.3)' }}>
            <div className="text-center mb-5">
              <div className="text-5xl mb-3">🎉</div>
              <h3 className="text-xl font-black text-white mb-1">Enquete publicada!</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>Compartilhe com seus amigos para começar a votar!</p>
            </div>
            <div className="rounded-2xl p-4 mb-5 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <p className="text-sm font-bold text-white truncate">{newPoll.question}</p>
              <p className="text-xs mt-1 font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>votaai.app/p/{newPoll.id}</p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  const url = `https://votaai.app/p/${newPoll.id}`;
                  const txt = `${newPoll.question}

Vote e ganhe VotaCoins! 👉 ${url}`;
                  if (navigator.share) {
                    navigator.share({ title: 'VotaAí', text: txt, url });
                  } else {
                    navigator.clipboard.writeText(url);
                    showNotif('🔗 Link copiado!');
                  }
                }}
                className="w-full py-3 rounded-2xl font-black text-white text-sm"
                style={{ background: 'linear-gradient(90deg, #6C63FF, #FF4E8C)' }}>
                📤 Compartilhar enquete
              </button>
              <button
                onClick={() => {
                  const url = `https://votaai.app/p/${newPoll.id}`;
                  const txt = encodeURIComponent(`${newPoll.question}

Vote e ganhe VotaCoins! 👉 ${url}`);
                  window.open(`https://wa.me/?text=${txt}`, '_blank');
                }}
                className="w-full py-3 rounded-2xl font-black text-sm"
                style={{ background: 'rgba(37,211,102,0.15)', color: '#25D366', border: '1px solid rgba(37,211,102,0.3)' }}>
                💬 Compartilhar no WhatsApp
              </button>
              <button onClick={() => setNewPoll(null)}
                className="w-full py-3 rounded-2xl text-sm font-bold"
                style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.4)' }}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Home() { return <HomeCore />; }
