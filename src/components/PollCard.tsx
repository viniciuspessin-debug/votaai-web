'use client';
import { useState } from 'react';

function fmt(n: number) {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
  return String(n);
}

export default function PollCard({ poll, onVote, userVote }: {
  poll: any;
  onVote: (id: string, choice: string) => void;
  userVote?: string;
}) {
  const [hovering, setHovering] = useState<string | null>(null);
  const voted = !!userVote;
  const total = (poll.votesA || 0) + (poll.votesB || 0);
  const pctA = total > 0 ? Math.round((poll.votesA / total) * 100) : 50;
  const pctB = 100 - pctA;

  const options = [
    { key: 'A', data: poll.optionA, pct: pctA, votes: poll.votesA || 0 },
    { key: 'B', data: poll.optionB, pct: pctB, votes: poll.votesB || 0 },
  ];

  return (
    <div
      className="relative rounded-2xl p-6 mb-4 border transition-all duration-300"
      style={{
        background: 'rgba(255,255,255,0.03)',
        borderColor: voted ? poll.color + '33' : 'rgba(255,255,255,0.07)',
        animationFillMode: 'both',
      }}
    >
      {/* Polêmica do Dia banner */}
      {poll.hotOfDay && (
        <div
          className="flex items-center gap-2 px-4 py-2 rounded-xl mb-3 text-xs font-black tracking-widest"
          style={{
            background: 'linear-gradient(90deg, #FF4E8C22, #FF6B3522)',
            border: '1px solid #FF4E8C44',
          }}
        >
          <span className="text-base animate-pulse">🔥</span>
          <span style={{ background: 'linear-gradient(90deg, #FF4E8C, #FF6B35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            POLÊMICA DO DIA
          </span>
        </div>
      )}

      {/* Tag */}
      <div className="flex items-center gap-2 mb-4">
        <div
          className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-widest uppercase border"
          style={{ color: poll.color, borderColor: poll.color + '44', background: poll.color + '11' }}
        >
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: poll.color }} />
          {poll.tag}
        </div>
        {voted && (
          <span className="ml-auto text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            {fmt(total)} votos
          </span>
        )}
      </div>

      {/* Question */}
      <p className="text-sm mb-5" style={{ color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-body)' }}>
        {poll.question}
      </p>

      {/* Options */}
      <div className="space-y-3">
        {options.map(({ key, data, pct, votes }) => {
          const isWinner = voted && pct > 50;
          const isUserVote = userVote === key;
          const isLoser = voted && !isUserVote;

          return (
            <button
              key={key}
              onClick={() => !voted && onVote(poll.id, key)}
              onMouseEnter={() => !voted && setHovering(key)}
              onMouseLeave={() => setHovering(null)}
              disabled={voted}
              className="relative w-full flex items-center gap-4 p-4 rounded-xl border-2 overflow-hidden transition-all duration-300 text-left"
              style={{
                borderColor: isUserVote ? poll.color : hovering === key ? poll.color + '66' : 'rgba(255,255,255,0.08)',
                background: isUserVote ? poll.color + '15' : hovering === key ? poll.color + '08' : 'rgba(255,255,255,0.03)',
                opacity: isLoser ? 0.4 : 1,
                cursor: voted ? 'default' : 'pointer',
              }}
            >
              {/* Progress bar */}
              {voted && (
                <div
                  className="absolute inset-y-0 left-0 transition-all duration-700"
                  style={{
                    width: `${pct}%`,
                    background: isUserVote ? poll.color + '20' : 'rgba(255,255,255,0.03)',
                  }}
                />
              )}

              <span className="relative text-3xl">{data.emoji}</span>

              <div className="relative flex-1 min-w-0">
                <div className="font-bold text-white text-sm truncate">{data.label}</div>
                {data.sublabel && (
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{data.sublabel}</div>
                )}
              </div>

              {voted ? (
                <div className="relative text-right shrink-0">
                  <div className="text-xl font-black" style={{ color: isUserVote ? poll.color : 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
                    {pct}%
                  </div>
                  <div className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>{fmt(votes)}</div>
                </div>
              ) : (
                <div
                  className="relative w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.3)' }}
                >
                  {key}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Share footer */}
      {voted && (
        <div className="mt-4 pt-4 flex items-center justify-between border-t" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          <span className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            {userVote === 'A' ? poll.optionA.emoji : poll.optionB.emoji} Você votou em {userVote === 'A' ? poll.optionA.label : poll.optionB.label}
          </span>
          <button
            onClick={() => {
              const text = `${poll.question}\n${poll.optionA.emoji} ${poll.optionA.label} (${pctA}%) vs ${poll.optionB.emoji} ${poll.optionB.label} (${pctB}%)\n\nVote no VotaAí! 🗳️\nhttps://votaai.app`;
              if (navigator.share) navigator.share({ text });
              else navigator.clipboard.writeText(text);
            }}
            className="text-xs px-3 py-1.5 rounded-lg border transition-colors"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)' }}
          >
            📤 Compartilhar
          </button>
        </div>
      )}
    </div>
  );
}
