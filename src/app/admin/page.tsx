'use client';
import { useState, useEffect } from 'react';
import { collection, getDocs, doc, deleteDoc, setDoc, serverTimestamp, getDoc, updateDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { signInWithGoogle } from '@/lib/polls';

const ADMIN_EMAIL = 'vinicius.pessin@gmail.com';
const DEFAULT_TAGS = ['comida','vida','esporte','estilo de vida','rotina','superpoderes','trabalho','tecnologia','entretenimento','outro'];

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
  const [sortBy, setSortBy] = useState<'order' | 'popular'>('order');
  const [toast, setToast] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'polls' | 'categories' | 'whatsapp' | 'members' | 'pagamentos'>('polls');
  const [saques, setSaques] = useState<any[]>([]);
  const [categories, setCategories] = useState<string[]>(DEFAULT_TAGS);
  const [newCat, setNewCat] = useState('');
  const [savingCat, setSavingCat] = useState(false);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
    return unsub;
  }, []);

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) {
      fetchPolls();
      fetchCategories();
      fetchSubscribers();
      fetchMembers();
      // Real-time saques listener
      const q = query(collection(db, 'saques'), orderBy('requestedAt', 'desc'));
      const unsub = onSnapshot(q, snap => setSaques(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
      return unsub;
    }
  }, [user]);

  const fetchPolls = async () => {
    const q = query(collection(db, 'polls'), orderBy('createdAt', 'desc'));
    const snap = await getDocs(q);
    const data = snap.docs.map((d, i) => ({ id: d.id, ...d.data(), _order: (d.data() as any).order ?? i }));
    setPolls(data.sort((a, b) => a._order - b._order));
  };

  const fetchCategories = async () => {
    try {
      const snap = await getDoc(doc(db, 'config', 'categories'));
      if (snap.exists()) setCategories(snap.data().list || DEFAULT_TAGS);
    } catch { setCategories(DEFAULT_TAGS); }
  };

  const fetchSubscribers = async () => {
    const snap = await getDocs(collection(db, 'subscribers'));
    setSubscribers(snap.docs.map(d => ({ id: d.id, ...d.data() })).filter((s: any) => s.active));
  };

  const fetchMembers = async () => {
    const snap = await getDocs(collection(db, 'members'));
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    setMembers(list.sort((a: any, b: any) => new Date(b.joinedAt || 0).getTime() - new Date(a.joinedAt || 0).getTime()));
  };

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(null), 3000); };

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

  const handleHotOfDay = async (id: string, current: boolean) => {
    if (!current) {
      const toRemove = polls.filter(p => p.hotOfDay && p.id !== id);
      await Promise.all(toRemove.map(p => updateDoc(doc(db, 'polls', p.id), { hotOfDay: false })));
    }
    await updateDoc(doc(db, 'polls', id), { hotOfDay: !current });
    setPolls(p => p.map(x => ({ ...x, hotOfDay: x.id === id ? !current : (!current ? false : x.hotOfDay) })));
    showToast(!current ? '🔥 Polêmica do Dia definida!' : '🔥 Selo removido');
  };

  const handleMove = async (index: number, direction: 'up' | 'down') => {
    const newPolls = [...polls];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    if (swapIndex < 0 || swapIndex >= newPolls.length) return;
    [newPolls[index], newPolls[swapIndex]] = [newPolls[swapIndex], newPolls[index]];
    setPolls(newPolls);
    await Promise.all([
      updateDoc(doc(db, 'polls', newPolls[index].id), { order: index }),
      updateDoc(doc(db, 'polls', newPolls[swapIndex].id), { order: swapIndex }),
    ]);
    showToast('↕️ Ordem atualizada!');
  };

  const handleAddCategory = async () => {
    const cat = newCat.trim().toLowerCase();
    if (!cat || categories.includes(cat)) return;
    setSavingCat(true);
    const updated = [...categories, cat];
    await setDoc(doc(db, 'config', 'categories'), { list: updated });
    setCategories(updated);
    setNewCat('');
    setSavingCat(false);
    showToast(`✅ Categoria "${cat}" criada!`);
  };

  const handleDeleteCategory = async (cat: string) => {
    if (DEFAULT_TAGS.includes(cat)) return showToast('⚠️ Não é possível deletar categorias padrão');
    const updated = categories.filter(c => c !== cat);
    await setDoc(doc(db, 'config', 'categories'), { list: updated });
    setCategories(updated);
    showToast(`🗑️ Categoria "${cat}" removida`);
  };

  const exportMembersCSV = () => {
    const csv = [
      'Email,Data de cadastro,Votos,Provedor',
      ...members.map((m: any) => `${m.email},${m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('pt-BR') : '-'},${m.voteCount},${m.provider === 'google.com' ? 'Google' : 'Email'}`)
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'membros-votaai.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#07070E' }}>
      <div className="text-white/40 text-sm">Carregando...</div>
    </div>
  );

  const isAdmin = user?.email === ADMIN_EMAIL;
  const filtered = polls
    .filter(p => p.question?.toLowerCase().includes(search.toLowerCase()) ||
      p.optionA?.label?.toLowerCase().includes(search.toLowerCase()) ||
      p.optionB?.label?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => sortBy === 'popular' ? (b.totalVotes || 0) - (a.totalVotes || 0) : (a._order - b._order));
  const totalVotes = polls.reduce((acc, p) => acc + (p.totalVotes || 0), 0);
  const hotPoll = polls.find(p => p.hotOfDay);

  return (
    <div className="min-h-screen" style={{ background: '#07070E' }}>
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-white font-bold text-sm shadow-2xl" style={{ background: '#6C63FF' }}>
          {toast}
        </div>
      )}

      <div className="border-b px-6 py-4 flex items-center justify-between" style={{ borderColor: 'rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.02)' }}>
        <div className="flex items-center gap-3">
          <a href="/" className="text-sm font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>← VotaAí</a>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>/</span>
          <h1 className="text-lg font-black text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>ADMIN</h1>
        </div>
        {isAdmin && <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(0,201,167,0.15)', color: '#00C9A7' }}>✅ {user?.email}</span>}
      </div>

      {!isAdmin ? (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center max-w-sm">
            <div className="text-6xl mb-6">🔒</div>
            <h1 className="text-2xl font-black text-white mb-2" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>ACESSO RESTRITO</h1>
            <p className="text-sm mb-8" style={{ color: 'rgba(255,255,255,0.4)' }}>Essa página é exclusiva para administradores.</p>
            {user && <p className="text-xs mb-4 px-4 py-2 rounded-xl" style={{ background: 'rgba(255,82,82,0.15)', color: '#FF5252' }}>Logado como {user.email} — sem permissão</p>}
            <button onClick={signInWithGoogle} className="px-6 py-3 rounded-xl font-black text-white text-sm" style={{ background: '#6C63FF' }}>🔗 Entrar com Google</button>
            <a href="/" className="block mt-4 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>← Voltar ao site</a>
          </div>
        </div>
      ) : (
        <div className="max-w-4xl mx-auto p-6">

          {/* Stats */}
          <div className="grid grid-cols-5 gap-4 mb-6">
            {[
              { label: 'Enquetes', value: polls.length, emoji: '📋', color: '#6C63FF' },
              { label: 'Votos totais', value: fmt(totalVotes), emoji: '🗳️', color: '#00C9A7' },
              { label: 'Membros', value: members.length, emoji: '👥', color: '#FF4E8C' },
              { label: 'Inscritos ZAP', value: subscribers.length, emoji: '💬', color: '#25D366' },
              { label: 'Saques pend.', value: saques.filter(s => s.status === 'pendente').length, emoji: '💸', color: '#F7B731' },
            ].map(s => (
              <div key={s.label} className="rounded-2xl p-4 border text-center" style={{ background: 'rgba(255,255,255,0.03)', borderColor: s.color + '33' }}>
                <div className="text-xl mb-1">{s.emoji}</div>
                <div className="text-xl font-black" style={{ color: s.color, fontFamily: 'var(--font-display)' }}>{s.value}</div>
                <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {[
              { id: 'polls', label: '📋 Enquetes' },
              { id: 'members', label: '👥 Membros' },
              { id: 'whatsapp', label: '💬 WhatsApp' },
              { id: 'categories', label: '🏷️ Categorias' },
              { id: 'pagamentos', label: '💸 Pagamentos' },
            ].map(t => (
              <button key={t.id} onClick={() => setActiveTab(t.id as any)} className="px-5 py-2.5 rounded-xl text-sm font-bold transition-all" style={{ background: activeTab === t.id ? '#6C63FF' : 'rgba(255,255,255,0.05)', color: activeTab === t.id ? 'white' : 'rgba(255,255,255,0.4)' }}>
                {t.label}
              </button>
            ))}
          </div>

          {/* POLLS TAB */}
          {activeTab === 'polls' && (
            <>
              <div className="flex gap-3 mb-6">
                <input className="flex-1 rounded-xl px-4 py-3 text-sm text-white outline-none border" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }} placeholder="🔍 Buscar enquetes..." value={search} onChange={e => setSearch(e.target.value)} />
                <button onClick={() => setSortBy(s => s === 'order' ? 'popular' : 'order')} className="px-4 py-3 rounded-xl text-sm font-bold border" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.03)' }}>
                  {sortBy === 'order' ? '↕️ Ordem' : '📈 Populares'}
                </button>
                <button onClick={fetchPolls} className="px-4 py-3 rounded-xl text-sm font-bold border" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.03)' }}>🔄</button>
              </div>
              <div className="space-y-3">
                {filtered.map((poll) => {
                  const total = poll.totalVotes || 0;
                  const pctA = total > 0 ? Math.round(((poll.votesA || 0) / total) * 100) : 50;
                  const realIndex = polls.findIndex(p => p.id === poll.id);
                  return (
                    <div key={poll.id} className="rounded-2xl p-5 border transition-all" style={{ background: poll.pinned ? 'rgba(247,183,49,0.05)' : 'rgba(255,255,255,0.03)', borderColor: poll.hotOfDay ? '#FF4E8C33' : poll.pinned ? '#F7B73133' : 'rgba(255,255,255,0.07)' }}>
                      <div className="flex items-start gap-4">
                        {sortBy === 'order' && (
                          <div className="flex flex-col gap-1 shrink-0 mt-1">
                            <button onClick={() => handleMove(realIndex, 'up')} disabled={realIndex === 0} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: realIndex === 0 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)' }}>▲</button>
                            <div className="text-center text-xs font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>{realIndex + 1}</div>
                            <button onClick={() => handleMove(realIndex, 'down')} disabled={realIndex === polls.length - 1} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ background: 'rgba(255,255,255,0.06)', color: realIndex === polls.length - 1 ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.6)' }}>▼</button>
                          </div>
                        )}
                        <div className="w-3 h-3 rounded-full mt-1.5 shrink-0" style={{ background: poll.color || '#6C63FF' }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            {poll.hotOfDay && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#FF4E8C22', color: '#FF4E8C' }}>🔥 Polêmica do Dia</span>}
                            {poll.pinned && <span className="text-xs px-2 py-0.5 rounded-full font-bold" style={{ background: '#F7B73122', color: '#F7B731' }}>📌 Fixada</span>}
                            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>{poll.tag}</span>
                          </div>
                          <p className="text-white font-bold text-sm mb-2">{poll.question}</p>
                          <div className="flex items-center gap-3 text-xs mb-3" style={{ color: 'rgba(255,255,255,0.4)' }}>
                            <span>{poll.optionA?.emoji} {poll.optionA?.label}</span>
                            <span style={{ color: 'rgba(255,255,255,0.2)' }}>vs</span>
                            <span>{poll.optionB?.emoji} {poll.optionB?.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold" style={{ color: poll.color || '#6C63FF', minWidth: 32 }}>{pctA}%</span>
                            <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.07)' }}>
                              <div className="h-full rounded-full" style={{ width: `${pctA}%`, background: poll.color || '#6C63FF' }} />
                            </div>
                            <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.3)', minWidth: 32, textAlign: 'right' }}>{100 - pctA}%</span>
                            <span className="text-xs ml-2" style={{ color: 'rgba(255,255,255,0.25)' }}>{fmt(total)} votos</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2 shrink-0">
                          <button onClick={() => handleHotOfDay(poll.id, !!poll.hotOfDay)} className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all" style={{ borderColor: poll.hotOfDay ? '#FF4E8C44' : 'rgba(255,255,255,0.1)', color: poll.hotOfDay ? '#FF4E8C' : 'rgba(255,255,255,0.4)', background: poll.hotOfDay ? '#FF4E8C11' : 'transparent' }}>
                            {poll.hotOfDay ? '🔥 Ativa' : '🔥 Setar'}
                          </button>
                          <button onClick={() => handlePin(poll.id, poll.pinned)} className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all" style={{ borderColor: poll.pinned ? '#F7B73144' : 'rgba(255,255,255,0.1)', color: poll.pinned ? '#F7B731' : 'rgba(255,255,255,0.4)', background: poll.pinned ? '#F7B73111' : 'transparent' }}>
                            {poll.pinned ? '📌 Fixada' : '📌 Fixar'}
                          </button>
                          <button onClick={() => handleDelete(poll.id, poll.question)} disabled={deleting === poll.id} className="px-3 py-1.5 rounded-lg text-xs font-bold border" style={{ borderColor: '#FF525233', color: '#FF5252', background: 'rgba(255,82,82,0.07)' }}>
                            {deleting === poll.id ? '...' : '🗑️ Deletar'}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && <div className="text-center py-16" style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhuma enquete encontrada</div>}
              </div>
            </>
          )}

          {/* MEMBERS TAB */}
          {activeTab === 'members' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-white font-black text-lg">{members.length} membros</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Usuários com conta cadastrada</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={fetchMembers} className="px-4 py-2 rounded-xl text-sm font-bold border" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.03)' }}>🔄</button>
                  <button onClick={exportMembersCSV} className="px-4 py-2 rounded-xl text-sm font-bold border" style={{ borderColor: '#00C9A733', color: '#00C9A7', background: 'rgba(0,201,167,0.07)' }}>
                    📥 Exportar CSV
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                {members.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-4 p-4 rounded-xl border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0" style={{ background: m.provider === 'google.com' ? '#4285F422' : '#6C63FF22', color: m.provider === 'google.com' ? '#4285F4' : '#6C63FF' }}>
                      {(m.email || '?')[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white truncate">{m.email}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                        {m.provider === 'google.com' ? '🔵 Google' : '📧 Email'} · {m.joinedAt ? new Date(m.joinedAt).toLocaleDateString('pt-BR') : '-'}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black" style={{ color: '#6C63FF' }}>{m.voteCount}</p>
                      <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>votos</p>
                    </div>
                  </div>
                ))}
                {members.length === 0 && <p className="text-center py-16 text-sm" style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhum membro ainda</p>}
              </div>
            </div>
          )}

          {/* WHATSAPP TAB */}
          {activeTab === 'whatsapp' && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-white font-black text-lg">{subscribers.length} inscritos</p>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Recebem a Polêmica do Dia no WhatsApp</p>
                </div>
                <button onClick={fetchSubscribers} className="px-4 py-2 rounded-xl text-sm font-bold border" style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.03)' }}>🔄</button>
              </div>
              {!hotPoll ? (
                <div className="p-4 rounded-xl mb-6 text-sm text-center" style={{ background: 'rgba(255,82,82,0.1)', color: '#FF5252', border: '1px solid #FF525233' }}>
                  ⚠️ Defina uma Polêmica do Dia antes de disparar
                </div>
              ) : (
                <div className="p-4 rounded-xl mb-6 border" style={{ background: 'rgba(247,183,49,0.05)', borderColor: '#F7B73133' }}>
                  <p className="text-xs font-bold tracking-widest mb-2" style={{ color: '#F7B731' }}>🔥 POLÊMICA DO DIA ATIVA</p>
                  <p className="text-white font-bold text-sm mb-1">{hotPoll.question}</p>
                  <p className="text-xs mb-4" style={{ color: 'rgba(255,255,255,0.4)' }}>Clique em cada contato para abrir o WhatsApp e enviar.</p>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {subscribers.map((s: any) => {
                      const msg = encodeURIComponent(`🔥 POLÊMICA DO DIA no VotaAí!\n${hotPoll.question}\nhttps://votaai.app\nResponda SAIR para cancelar`);
                      return (
                        <a key={s.id} href={`https://wa.me/55${s.phone}?text=${msg}`} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 rounded-xl border transition-all" style={{ background: 'rgba(37,211,102,0.05)', borderColor: '#25D36633' }}>
                          <div>
                            <p className="text-sm font-bold text-white">{s.name || 'Anônimo'}</p>
                            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>+55 {s.phone}</p>
                          </div>
                          <span className="text-lg">💬</span>
                        </a>
                      );
                    })}
                    {subscribers.length === 0 && <p className="text-center text-sm py-4" style={{ color: 'rgba(255,255,255,0.3)' }}>Nenhum inscrito ainda</p>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CATEGORIES TAB */}
          {activeTab === 'pagamentos' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {saques.filter(s => s.status === 'pendente').length} pendentes · {saques.filter(s => s.status === 'pago').length} pagos
                </p>
              </div>
              {saques.length === 0 && (
                <div className="text-center py-12" style={{ color: 'rgba(255,255,255,0.2)' }}>Nenhuma solicitação ainda</div>
              )}
              {saques.map(s => (
                <div key={s.id} className="rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: s.status === 'pago' ? 'rgba(34,197,94,0.2)' : s.status === 'pendente' ? 'rgba(247,183,49,0.3)' : 'rgba(255,82,82,0.2)' }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-black px-2 py-0.5 rounded-full" style={{
                          background: s.status === 'pago' ? 'rgba(34,197,94,0.15)' : s.status === 'pendente' ? 'rgba(247,183,49,0.15)' : 'rgba(255,82,82,0.15)',
                          color: s.status === 'pago' ? '#4ADE80' : s.status === 'pendente' ? '#F7B731' : '#FF5252',
                        }}>
                          {s.status === 'pago' ? '✅ PAGO' : s.status === 'pendente' ? '⏳ PENDENTE' : '❌ RECUSADO'}
                        </span>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                          {s.requestedAt?.toDate?.().toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) || '—'}
                        </span>
                      </div>
                      <p className="text-white font-bold">{s.email}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-lg font-black" style={{ color: '#F7B731' }}>R${s.valor?.toFixed(2)}</span>
                        <span className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.coins} coins</span>
                      </div>
                      <div className="mt-2 px-3 py-2 rounded-xl inline-flex items-center gap-2" style={{ background: 'rgba(255,255,255,0.05)' }}>
                        <span className="text-xs font-bold uppercase" style={{ color: 'rgba(255,255,255,0.3)' }}>{s.pixType}</span>
                        <span className="text-sm font-black text-white">{s.pixKey}</span>
                        <button onClick={() => navigator.clipboard.writeText(s.pixKey)} className="text-xs px-2 py-0.5 rounded-lg transition-all hover:bg-white/10" style={{ color: '#6C63FF' }}>copiar</button>
                      </div>
                    </div>
                    {s.status === 'pendente' && (
                      <div className="flex flex-col gap-2 shrink-0">
                        <button
                          onClick={async () => { await updateDoc(doc(db, 'saques', s.id), { status: 'pago', paidAt: serverTimestamp() }); }}
                          className="px-4 py-2 rounded-xl text-xs font-black transition-all"
                          style={{ background: 'rgba(34,197,94,0.2)', color: '#4ADE80', border: '1px solid rgba(34,197,94,0.3)' }}
                        >✅ Marcar pago</button>
                        <button
                          onClick={async () => { await updateDoc(doc(db, 'saques', s.id), { status: 'recusado' }); }}
                          className="px-4 py-2 rounded-xl text-xs font-black transition-all"
                          style={{ background: 'rgba(255,82,82,0.1)', color: '#FF5252', border: '1px solid rgba(255,82,82,0.2)' }}
                        >❌ Recusar</button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'categories' && (
            <div>
              <p className="text-sm mb-6" style={{ color: 'rgba(255,255,255,0.4)' }}>Categorias aparecem no modal de criação de enquetes. As categorias padrão não podem ser removidas.</p>
              <div className="flex gap-3 mb-6">
                <input className="flex-1 rounded-xl px-4 py-3 text-sm text-white outline-none border" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }} placeholder="Nova categoria..." value={newCat} onChange={e => setNewCat(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAddCategory()} />
                <button onClick={handleAddCategory} disabled={!newCat.trim() || savingCat} className="px-5 py-3 rounded-xl text-sm font-black transition-all" style={{ background: newCat.trim() ? '#6C63FF' : 'rgba(255,255,255,0.07)', color: newCat.trim() ? 'white' : 'rgba(255,255,255,0.3)' }}>
                  {savingCat ? '...' : '+ Adicionar'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {categories.map(cat => {
                  const isDefault = DEFAULT_TAGS.includes(cat);
                  const pollCount = polls.filter(p => p.tag === cat).length;
                  return (
                    <div key={cat} className="flex items-center justify-between p-4 rounded-xl border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.07)' }}>
                      <div>
                        <p className="text-sm font-bold text-white capitalize">{cat}</p>
                        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>{pollCount} enquete{pollCount !== 1 ? 's' : ''}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isDefault && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.3)' }}>padrão</span>}
                        {!isDefault && <button onClick={() => handleDeleteCategory(cat)} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs" style={{ background: 'rgba(255,82,82,0.1)', color: '#FF5252' }}>✕</button>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
