'use client';
import { useState, useRef, useEffect } from 'react';

const COLORS = ['#FF6B35','#6C63FF','#00C9A7','#FF4E8C','#F7B731','#FF5252','#7C4DFF','#26A69A'];
const TAGS = ['comida','vida','esporte','estilo de vida','rotina','superpoderes','trabalho','tecnologia','entretenimento','outro'];

const EMOJI_CATEGORIES = [
  { label: '😀 Rostos', emojis: ['😀','😂','🥹','😍','🤩','😎','🥸','🤔','😏','😴','🤯','🥳','😢','😡','🤮','🤑','👻','💀','🤖','👽'] },
  { label: '🙌 Gestos', emojis: ['👍','👎','👏','🙌','🤝','🤜','💪','🦾','🖐️','✌️','🤞','🫶','❤️','🔥','⚡','✨','💥','🎯','🏆','🎖️'] },
  { label: '🐶 Animais', emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐵','🦄','🐲','🦋','🐬','🦅'] },
  { label: '🍕 Comida', emojis: ['🍕','🍔','🌮','🍣','🍜','🍩','🎂','🍦','🧁','🍿','🥗','🍱','🥩','🍗','🥐','🍺','🧃','☕','🧋','🍹'] },
  { label: '⚽ Esportes', emojis: ['⚽','🏀','🏈','⚾','🎾','🏐','🏉','🎱','🏓','🥊','🏋️','🤸','🧗','🏊','🚴','🛹','🤿','🎿','🏇','🧘'] },
  { label: '🚀 Objetos', emojis: ['🚀','✈️','🚗','🏠','💻','📱','🎮','🎸','🎬','📸','💰','💎','🔑','🗝️','🧲','🔭','🎭','🎨','📚','🏆'] },
  { label: '🌍 Lugares', emojis: ['🌍','🏖️','🏔️','🌆','🌴','🗼','🗽','🏰','🌋','🏝️','🌊','🌈','❄️','🌺','🌸','🌻','🌙','⭐','🌞','🌤️'] },
  { label: '💡 Símbolos', emojis: ['💡','❓','❗','✅','❌','⚠️','🔴','🟢','🔵','⭐','💫','🔮','♾️','🎲','🃏','🀄','🧩','🔣','📊','📈'] },
];

function EmojiPicker({ value, onChange }: { value: string; onChange: (e: string) => void }) {
  const [open, setOpen] = useState(false);
  const [cat, setCat] = useState(0);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = search
    ? EMOJI_CATEGORIES.flatMap(c => c.emojis).filter(e => e.includes(search))
    : EMOJI_CATEGORIES[cat].emojis;

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-14 h-12 rounded-xl border-2 flex items-center justify-center text-2xl transition-all hover:scale-105"
        style={{
          background: open ? 'rgba(108,99,255,0.15)' : 'rgba(255,255,255,0.05)',
          borderColor: open ? '#6C63FF' : 'rgba(255,255,255,0.1)',
        }}
        title="Escolher emoji"
      >
        {value}
      </button>

      {open && (
        <div
          className="absolute left-0 top-14 z-50 rounded-2xl border shadow-2xl"
          style={{ background: '#1A1A24', borderColor: 'rgba(255,255,255,0.12)', width: 280 }}
        >
          <div className="p-3 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
            <input
              className="w-full rounded-xl px-3 py-2 text-sm text-white outline-none border"
              style={{ background: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)' }}
              placeholder="🔍 Buscar emoji..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
          {!search && (
            <div className="flex overflow-x-auto gap-1 p-2 border-b" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              {EMOJI_CATEGORIES.map((c, i) => (
                <button
                  key={i}
                  onClick={() => setCat(i)}
                  className="shrink-0 px-2 py-1 rounded-lg text-xs font-bold transition-all"
                  style={{
                    background: cat === i ? 'rgba(108,99,255,0.3)' : 'transparent',
                    color: cat === i ? '#6C63FF' : 'rgba(255,255,255,0.4)',
                  }}
                >
                  {c.label.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
          <div className="grid grid-cols-8 gap-0.5 p-3" style={{ maxHeight: 180, overflowY: 'auto' }}>
            {filtered.map((e, i) => (
              <button
                key={i}
                onClick={() => { onChange(e); setOpen(false); setSearch(''); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-lg transition-all hover:scale-125"
                style={{ background: value === e ? 'rgba(108,99,255,0.3)' : 'transparent' }}
              >
                {e}
              </button>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-8 text-center py-4 text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
                Nenhum emoji encontrado
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CreatePollModal({ onClose, onCreate }: {
  onClose: () => void;
  onCreate: (data: any) => Promise<void>;
}) {
  const [q, setQ] = useState('');
  const [eA, setEA] = useState('🅰️');
  const [lA, setLA] = useState('');
  const [sA, setSA] = useState('');
  const [eB, setEB] = useState('🅱️');
  const [lB, setLB] = useState('');
  const [sB, setSB] = useState('');
  const [tag, setTag] = useState('outro');
  const [color, setColor] = useState(COLORS[0]);
  const [loading, setLoading] = useState(false);

  const valid = q.trim() && lA.trim() && lB.trim();

  const submit = async () => {
    if (!valid || loading) return;
    setLoading(true);
    await onCreate({
      question: q, tag, color,
      optionA: { emoji: eA, label: lA, sublabel: sA },
      optionB: { emoji: eB, label: lB, sublabel: sB },
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-2xl p-6 border"
        style={{ background: '#13131A', borderColor: 'rgba(255,255,255,0.1)', maxHeight: '90vh', overflowY: 'auto' }}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
            CRIAR ENQUETE
          </h2>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center text-white/50 hover:text-white transition-colors" style={{ background: 'rgba(255,255,255,0.07)' }}>✕</button>
        </div>

        {/* Question */}
        <label className="block text-xs font-bold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>PERGUNTA</label>
        <input
          className="w-full rounded-xl p-3 text-sm text-white mb-4 outline-none border transition-colors"
          style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
          placeholder="Ex: Você preferiria..."
          value={q} onChange={e => setQ(e.target.value)}
        />

        {/* Options */}
        {[
          { label: 'OPÇÃO A', e: eA, setE: setEA, l: lA, setL: setLA, s: sA, setS: setSA },
          { label: 'OPÇÃO B', e: eB, setE: setEB, l: lB, setL: setLB, s: sB, setS: setSB },
        ].map(opt => (
          <div key={opt.label} className="mb-4">
            <label className="block text-xs font-bold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>{opt.label}</label>
            <div className="flex gap-2 mb-2 items-start">
              <EmojiPicker value={opt.e} onChange={opt.setE} />
              <input className="flex-1 rounded-xl p-3 text-sm text-white outline-none border" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }} placeholder="Texto principal" value={opt.l} onChange={e => opt.setL(e.target.value)} />
            </div>
            <input className="w-full rounded-xl p-3 text-sm text-white outline-none border" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }} placeholder="Subtexto (opcional)" value={opt.s} onChange={e => opt.setS(e.target.value)} />
          </div>
        ))}

        {/* Tag */}
        <label className="block text-xs font-bold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>CATEGORIA</label>
        <div className="flex flex-wrap gap-2 mb-4">
          {TAGS.map(t => (
            <button key={t} onClick={() => setTag(t)} className="px-3 py-1 rounded-full text-xs font-bold border transition-all" style={{ borderColor: tag === t ? color : 'rgba(255,255,255,0.1)', background: tag === t ? color + '22' : 'transparent', color: tag === t ? color : 'rgba(255,255,255,0.4)' }}>{t}</button>
          ))}
        </div>

        {/* Color */}
        <label className="block text-xs font-bold tracking-widest mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>COR</label>
        <div className="flex gap-2 mb-6">
          {COLORS.map(c => (
            <button key={c} onClick={() => setColor(c)} className="w-8 h-8 rounded-full border-2 transition-transform" style={{ background: c, borderColor: color === c ? 'white' : 'transparent', transform: color === c ? 'scale(1.2)' : 'scale(1)' }} />
          ))}
        </div>

        <button
          onClick={submit}
          disabled={!valid || loading}
          className="w-full py-4 rounded-xl font-black text-sm tracking-widest transition-all"
          style={{ background: valid ? color : 'rgba(255,255,255,0.07)', color: valid ? 'white' : 'rgba(255,255,255,0.3)', fontFamily: 'var(--font-display)', letterSpacing: '0.1em', fontSize: '1rem' }}
        >
          {loading ? 'PUBLICANDO...' : '🚀 PUBLICAR ENQUETE'}
        </button>
      </div>
    </div>
  );
}
