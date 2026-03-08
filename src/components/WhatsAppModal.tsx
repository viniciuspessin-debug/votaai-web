'use client';
import { useState } from 'react';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';

export default function WhatsAppModal({ userId, onClose }: {
  userId: string;
  onClose: () => void;
}) {
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const formatPhone = (v: string) => {
    const digits = v.replace(/\D/g, '').slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0,2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  };

  const handleSubmit = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 10) return;
    setLoading(true);
    await setDoc(doc(db, 'subscribers', userId), {
      phone: digits,
      name: name.trim() || null,
      userId,
      subscribedAt: serverTimestamp(),
      active: true,
    });
    setDone(true);
    setLoading(false);
    setTimeout(onClose, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-2xl p-6 border"
        style={{ background: '#13131A', borderColor: 'rgba(255,255,255,0.1)' }}
      >
        {done ? (
          <div className="text-center py-4">
            <div className="text-5xl mb-3">🎉</div>
            <p className="text-white font-black text-lg" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>CADASTRADO!</p>
            <p className="text-sm mt-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Você vai receber a Polêmica do Dia no WhatsApp!</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-2xl">🔥</span>
                  <span className="text-xs font-black tracking-widest px-2 py-0.5 rounded-full" style={{ background: 'linear-gradient(90deg, #FF4E8C22, #FF6B3522)', color: '#FF6B35', border: '1px solid #FF6B3533' }}>POLÊMICA DO DIA</span>
                </div>
                <h2 className="text-xl font-black text-white" style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
                  RECEBA NO WHATSAPP
                </h2>
                <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  Todo dia a enquete mais quente direto no seu zap 🌶️
                </p>
              </div>
              <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-xs shrink-0" style={{ background: 'rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.4)' }}>✕</button>
            </div>

            {/* Form */}
            <div className="space-y-3 mb-5">
              <input
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none border transition-all"
                style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}
                placeholder="Seu nome (opcional)"
                value={name}
                onChange={e => setName(e.target.value)}
              />
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold" style={{ color: 'rgba(255,255,255,0.4)' }}>🇧🇷 +55</span>
                <input
                  className="w-full rounded-xl pl-16 pr-4 py-3 text-sm text-white outline-none border transition-all"
                  style={{ background: 'rgba(255,255,255,0.05)', borderColor: phone.replace(/\D/g,'').length >= 10 ? '#25D366' : 'rgba(255,255,255,0.1)' }}
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={e => setPhone(formatPhone(e.target.value))}
                  inputMode="numeric"
                />
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={phone.replace(/\D/g,'').length < 10 || loading}
              className="w-full py-3.5 rounded-xl font-black text-sm text-white transition-all"
              style={{
                background: phone.replace(/\D/g,'').length >= 10 ? '#25D366' : 'rgba(255,255,255,0.07)',
                color: phone.replace(/\D/g,'').length >= 10 ? 'white' : 'rgba(255,255,255,0.3)',
                fontFamily: 'var(--font-display)',
                letterSpacing: '0.1em',
                fontSize: '1rem',
              }}
            >
              {loading ? 'SALVANDO...' : '💬 QUERO RECEBER'}
            </button>

            <p className="text-center text-xs mt-3" style={{ color: 'rgba(255,255,255,0.2)' }}>
              Sem spam. Só a polêmica do dia. Cancele quando quiser.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
