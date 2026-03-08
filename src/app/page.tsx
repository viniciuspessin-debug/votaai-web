'use client';
import { useState, useEffect, useCallback } from 'react';
import PollCard from '@/components/PollCard';
import CreatePollModal from '@/components/CreatePollModal';
import CityMap from '@/components/CityMap';
import { subscribeToPolls, getUserVotes, castVote, createPoll, seedPolls, ensureAuth, signInWithGoogle } from '@/lib/polls';
import { auth, db } from '@/lib/firebase';
import WhatsAppModal from '@/components/WhatsAppModal';
import { doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';

function fmt(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export default function Home() {
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

  // Auth
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (!u) {
        const user = await ensureAuth();
        setUser(user);
      } else {
        setUser(u);
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

  // User votes
  useEffect(() => {
    if (!user) return;
    getUserVotes(user.uid).then(setVotes);
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
    await castVote(id, choice, user.uid, city || undefined);
    // Show WhatsApp modal after first vote if not subscribed
    if (Object.keys(votes).length === 0) {
      const sub = await getDoc(doc(db, 'subscribers', user.uid));
      if (!sub.exists()) setTimeout(() => setShowWhatsApp(true), 1500);
    }
  }, [user, votes, streak, city]);

  const handleCreate = async (data: any) => {
    if (!user) return;
    await createPoll({ ...data, userId: user.uid });
    showNotif('🎉 Enquete publicada!');
  };

  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      showNotif('✅ Login feito com sucesso!');
    } catch (e) {
      showNotif('❌ Erro ao fazer login');
    }
  };

  const trending = [...polls].sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0));
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
      <div className="max-w-6xl mx-auto flex min-h-screen" style={{ overflowX: 'hidden', width: '100%' }}>

        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-64 p-6 sticky top-0 h-screen border-r" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <div className="mb-10">
            <h1 className="text-4xl text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>VOTAAI</h1>
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
              <button onClick={handleGoogleLogin} className="w-full py-3 rounded-xl text-sm font-bold border transition-all hover:bg-white/5" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                🔗 Entrar com Google
              </button>
            ) : (
              <div className="px-3 py-2 rounded-xl text-xs" style={{ background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>
                👤 {user?.displayName || user?.email || 'Anônimo'}
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 px-4 py-6 pb-24 md:pb-6" style={{ minWidth: 0, width: '100%', maxWidth: 576, boxSizing: 'border-box', margin: '0 auto' }}>

          {/* Mobile header */}
          <div className="flex items-center justify-between mb-6 md:hidden">
            <div>
              <h1 className="text-3xl text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>VOTAAI</h1>
              {votedCount > 0 && <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>{votedCount} votos • 🔥 {streak}</p>}
            </div>
            <div className="flex gap-2 items-center">
              {streak >= 3 && <span className="text-sm font-bold px-3 py-1 rounded-full" style={{ background: '#FF6B3520', color: '#FF6B35' }}>🔥{streak}</span>}
              <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl text-sm font-black text-white" style={{ background: '#6C63FF' }}>+ Criar</button>
            </div>
          </div>

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
                  <div key={poll.id} style={{ animationDelay: `${i * 0.05}s` }} className="animate-fade-up">
                    <PollCard poll={poll} onVote={handleVote} userVote={votes[poll.id]} />
                    {votes[poll.id] && (
                      <button
                        onClick={() => setShowCity(showCity === poll.id ? null : poll.id)}
                        className="w-full text-xs py-2 mb-4 -mt-2 rounded-b-xl border-x border-b transition-colors text-center"
                        style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.02)' }}
                      >
                        🗺️ {showCity === poll.id ? 'Esconder' : 'Ver'} resultado por cidade
                      </button>
                    )}
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
                return (
                  <div key={poll.id} className="flex gap-4 p-5 rounded-2xl mb-3 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: poll.color + '22' }}>
                    <span className="text-2xl font-black shrink-0" style={{ color: i < 3 ? mColors[i] : 'rgba(255,255,255,0.2)', fontFamily: 'var(--font-display)' }}>
                      {i < 3 ? medals[i] : `#${i+1}`}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{poll.optionA?.emoji} {poll.optionA?.label} <span style={{ color: 'rgba(255,255,255,0.3)' }}>vs</span> {poll.optionB?.emoji} {poll.optionB?.label}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                          <div className="h-full rounded-full" style={{ width: `${pctA}%`, background: poll.color }} />
                        </div>
                        <span className="text-xs font-bold shrink-0" style={{ color: poll.color }}>{pctA}%</span>
                      </div>
                      <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{fmt(total)} votos</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* PERFIL */}
          {tab === 'perfil' && (
            <div>
              <div className="rounded-2xl p-6 mb-4 text-center border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: '#6C63FF33' }}>
                <div className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl border-2" style={{ background: '#6C63FF22', borderColor: '#6C63FF' }}>
                  {isAnon ? '🗳️' : '😎'}
                </div>
                <p className="font-black text-white text-lg">{user?.displayName || (isAnon ? 'Votante Anônimo' : user?.email)}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{city ? `📍 ${city}` : 'Localização desconhecida'}</p>
                {isAnon && (
                  <button onClick={handleGoogleLogin} className="mt-4 px-5 py-2 rounded-xl text-sm font-bold border" style={{ borderColor: '#6C63FF66', color: '#6C63FF' }}>
                    🔗 Conectar Google
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { label: 'Votos dados', value: votedCount, emoji: '🗳️', color: '#6C63FF' },
                  { label: 'Streak atual', value: `${streak}🔥`, emoji: '⚡', color: '#FF6B35' },
                  { label: 'Enquetes', value: polls.length, emoji: '📋', color: '#00C9A7' },
                  { label: 'Cidade', value: city || '?', emoji: '📍', color: '#FF4E8C' },
                ].map(stat => (
                  <div key={stat.label} className="p-4 rounded-2xl text-center border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: stat.color + '33' }}>
                    <div className="text-2xl mb-2">{stat.emoji}</div>
                    <div className="text-xl font-black" style={{ color: stat.color, fontFamily: 'var(--font-display)' }}>{stat.value}</div>
                    <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{stat.label}</div>
                  </div>
                ))}
              </div>

              {votedCount > 0 && (
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

      {showCreate && <CreatePollModal onClose={() => setShowCreate(false)} onCreate={handleCreate} />}
    </div>
  );
}
