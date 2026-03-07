'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, deleteDoc, doc, orderBy, query, updateDoc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { signInWithGoogle } from '@/lib/polls';

const ADMIN_EMAIL = 'vinicius.pessin@gmail.com';

function fmt(n: number) {
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n || 0);
}

export default function AdminPage() {
  const [user, setUser] = useState<User | null>(null);
  const [polls, setPolls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'recent' | 'popular'>('recent');
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) fetchPolls();
  }, [user]);

  const fetchPolls = async () => {
    const q = query(collection(db, 'polls'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    setPolls(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = async (id: string, question: string) => {
    if (!confirm(`Deletar enquete?\n\n"${question}"\n\nEsta ação não pode ser desfeita.`)) return;
    setDeleting(id);
    await deleteDoc(doc(db, 'polls', id));
    setPolls(p => p.filter(x => x.id !== id));
    setDeleting(null);
    showToast('🗑️ Enquete deletada!');
  };

  const handlePin = async (id: string, pinned: boolean) => {
    await updateDoc(doc(db, 'polls', id), { pinned: !pinned });
    setPolls(p => p.map(x => x.id === id ? { ...x, pinned: !pinned } : x));
    showToast(pinned ? '📌 Enquete desafixada' : '📌 Enquete fixada no topo!');
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#07070E' }}>
      <div className="text-white/40 text-sm">Carregando...</div>
    </div>
  );

  if (!user || user.email !== ADMIN_EMAIL) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#07070E' }}>
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>ACESSO RESTRITO</h1>
        <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>Essa página é exclusiva para administradores.</p>
        {user && user.email !== ADMIN_EMAIL && (
          <p className="text-xs mb-4 px-4 py-2 rounded-xl" style={{ background: 'rgba(255,82,82,0.15)', color: '#FF5252' }}>
            Logado como {user.email} — sem permissão
          </p>
        )}
        <button
          onClick={signInWithGoogle}
          className="px-6 py-3 rounded-xl font-black text-white text-sm"
          style={{ background: '#6C63FF' }}
        >
          🔗 Entrar com Google
        </button>
        <a href="/" className="block mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>← Voltar ao site</a>
      </div>
    </div>
  );

  const filtered = polls
    .filter(p => p.question?.toLowerCase().includes(search.toLowerCase()) ||
      p.optionA?.label?.toLowerCase().includes(search.toLowerCase()) ||
      p.optionB?.label?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sort === 'popular' ? (b.totalVotes || 0) - (a.totalVotes || 0) : 0);

  const totalVotes = polls.reduce((acc, p) => acc + (p.totalVotes || 0), 0);

  return (
    <div className="min-h-screen" style={{ background: '#07070E' }}>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white font-bold text-sm shadow-2xl" style={{ background: '#6C63FF' }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-3">
          <a href="/" className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>← VotaAí</a>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>
          <h1 className="text-lg font-black text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>ADMIN</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(0,201,167,0.15)', color: '#00C9A7' }}>
            ✅ {user.email}
          </span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Enquetes', value: polls.length, emoji: '📋', color: '#6C63FF' },
            { label: 'Votos totais', value: fmt(totalVotes), emoji: '🗳️', color: '#00C9A7' },
            { label: 'Fixadas', value: polls.filter(p => p.pinned).length, emoji: '📌', color: '#F7B731' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-5 border text-center" style={{ background: 'rgba(255,255,255,0.03)', borderColor: s.color + '33' }}>
              <div className="text-2xl mb-2">{s.emoji}</div>
              <div className="text-2xl font-black" style={{ color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
              <div className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="flex gap-3 mb-6">
          <input
            className="flex-1 rounded-xl px-4 py-3 text-sm text-white outline-none border"
            style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
            placeholder="🔍 Buscar enquetes..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button
            onClick={() => setSort(s => s === 'recent' ? 'popular' : 'recent')}
            className="px-4 py-3 rounded-xl text-sm font-bold border transition-all"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.03)' }}
          >
            {sort === 'recent' ? '🕐 Recentes' : '📈 Populares'}
          </button>
          <button
            onClick={fetchPolls}
            className="px-4 py-3 rounded-xl text-sm font-bold border transition-all"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.03)' }}
          >
            🔄
          </button>
        </div>

        {/* Poll list */}
        <div className="space-y-3">
          {filtered.map(poll => {
            const total = poll.totalVotes || 0;
            const pctA = total > 0 ? Math.round(((poll.votesA || 0) / total) * 100) : 50;

            return (
              <div
                key={poll.id}
                className="rounded-2xl p-5 border transition-all"
                style={{
                  background: poll.pinned ? 'rgba(247,183,49,0.05)' : 'rgba(255,255,255,0.03)',
                  borderColor: poll.pinned ? '#F7B73133' : 'rgba(255,255,255,0.07)',
                }}
              >
                <div className="flex items-start gap-4">
                  {/* Color dot */}
                  <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ background: poll.color || '#6C63FF' }} />

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {poll.pinned && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#F7B73122', color: '#F7B731' }}>📌 Fixada</span>}
                      <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>{poll.tag}</span>
                    </div>
                    <p className="text-white font-bold text-sm mb-2">{poll.question}</p>
                    <div className="flex items-center gap-3 text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                      <span>{poll.optionA?.emoji} {poll.optionA?.label}</span>
                      <span style={{ color: 'rgba(255,255,255,0.2)' }}>vs</span>
                      <span>{poll.optionB?.emoji} {poll.optionB?.label}</span>
                    </div>

                    {/* Vote bar */}
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold" style={{ color: poll.color || '#6C63FF', minWidth: 32 }}>{pctA}%</span>
                      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${pctA}%`, background: poll.color || '#6C63FF' }} />
                      </div>
                      <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.3)', minWidth: 32, textAlign: 'right' }}>{100 - pctA}%</span>
                      <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.25)' }}>{fmt(total)} votos</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => handlePin(poll.id, poll.pinned)}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                      style={{
                        borderColor: poll.pinned ? '#F7B73144' : 'rgba(255,255,255,0.1)',
                        color: poll.pinned ? '#F7B731' : 'rgba(255,255,255,0.4)',
                        background: poll.pinned ? '#F7B73111' : 'transparent',
                      }}
                    >
                      {poll.pinned ? '📌 Fixada' : '📌 Fixar'}
                    </button>
                    <button
                      onClick={() => handleDelete(poll.id, poll.question)}
                      disabled={deleting === poll.id}
                      className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
                      style={{ borderColor: '#FF525233', color: '#FF5252', background: 'rgba(255,82,82,0.07)' }}
                    >
                      {deleting === poll.id ? '...' : '🗑️ Deletar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.3)' }}>
              Nenhuma enquete encontrada
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
