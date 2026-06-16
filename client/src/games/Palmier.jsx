import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import socket from '../socket';

const SUIT_COLOR = { '♥': '#e53e3e', '♦': '#e53e3e', '♣': '#1a202c', '♠': '#1a202c', '★': '#7c3aed' };

export default function Palmier() {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState(null);   // { remaining, activeRules, currentCard: null }
  const [drawnCard, setDrawnCard] = useState(null); // { card, rule }
  const [kingInput, setKingInput] = useState('');
  const [kingPending, setKingPending] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const kingRef = useRef(null);

  useEffect(() => {
    socket.on('palmier:state', (s) => setState(s));

    socket.on('palmier:card', ({ card, rule, remaining, activeRules }) => {
      setDrawnCard({ card, rule });
      setState((prev) => ({ ...prev, remaining, activeRules }));
      setAnimKey((k) => k + 1);
      if (card.value === 'K') {
        setKingPending(true);
        setKingInput('');
        setTimeout(() => kingRef.current?.focus(), 100);
      } else {
        setKingPending(false);
      }
    });

    socket.on('palmier:rules-updated', ({ activeRules }) => {
      setState((prev) => ({ ...prev, activeRules }));
      setKingPending(false);
    });

    return () => {
      socket.off('palmier:state');
      socket.off('palmier:card');
      socket.off('palmier:rules-updated');
    };
  }, []);

  function draw() {
    socket.emit('palmier:draw', { lang: i18n.language });
  }

  function submitKingRule() {
    if (!kingInput.trim()) return;
    socket.emit('palmier:set-king-rule', { text: kingInput.trim() });
  }

  const isEmpty = state?.remaining === 0;
  const suitColor = drawnCard ? SUIT_COLOR[drawnCard.card.suit] : '#555';

  return (
    <div style={{ maxWidth: 420, margin: '0 auto' }}>

      {/* Active rules banner */}
      {state?.activeRules?.length > 0 && (
        <div style={{ marginBottom: 20, padding: '12px 16px', background: '#fefce8', border: '1px solid #fde047', borderRadius: 10 }}>
          <p style={{ fontWeight: 700, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: '#854d0e', marginBottom: 8 }}>
            {t('palmier.activeRules')}
          </p>
          {state.activeRules.map((r, i) => (
            <div key={i} style={{ marginBottom: i < state.activeRules.length - 1 ? 6 : 0 }}>
              <span style={{ fontWeight: 600, fontSize: 14 }}>{r.title}: </span>
              <span style={{ fontSize: 14, color: '#555' }}>{r.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* King rule input */}
      {kingPending && (
        <div style={{ marginBottom: 20, padding: '14px 16px', background: '#fdf4ff', border: '1px solid #d946ef', borderRadius: 10 }}>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>👑 {drawnCard?.rule?.title}</p>
          <div style={{ display: 'flex', gap: 8 }}>
            <input
              ref={kingRef}
              value={kingInput}
              onChange={(e) => setKingInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submitKingRule()}
              placeholder={t('palmier.kingRulePlaceholder')}
              style={{ flex: 1, padding: 8, fontSize: 15, borderRadius: 6, border: '1px solid #d946ef' }}
            />
            <button onClick={submitKingRule} style={{ padding: '8px 14px', background: '#d946ef', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }}>
              {t('palmier.kingRuleSubmit')}
            </button>
          </div>
        </div>
      )}

      {/* Current card */}
      {drawnCard && (
        <div
          key={animKey}
          style={{
            background: '#fff',
            border: `3px solid ${suitColor}`,
            borderRadius: 20,
            padding: '28px 24px',
            marginBottom: 20,
            animation: 'cardFlip 0.3s ease',
          }}
        >
          {/* Card header: suit + value */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
            <span style={{ fontSize: 48, fontWeight: 900, color: suitColor, lineHeight: 1 }}>
              {drawnCard.card.value}
            </span>
            <span style={{ fontSize: 32, color: suitColor, lineHeight: 1 }}>
              {drawnCard.card.suit}
            </span>
          </div>

          <p style={{ fontWeight: 700, fontSize: 18, marginBottom: 6 }}>
            {drawnCard.rule.title}
          </p>
          <p style={{ fontSize: 16, color: '#444', lineHeight: 1.5, margin: 0 }}>
            {drawnCard.rule.text}
          </p>
        </div>
      )}

      {/* Draw button */}
      <button
        onClick={draw}
        disabled={isEmpty || !state}
        style={{
          width: '100%',
          padding: '16px',
          fontSize: 18,
          fontWeight: 700,
          background: isEmpty ? '#e5e7eb' : '#1a202c',
          color: isEmpty ? '#9ca3af' : '#fff',
          border: 'none',
          borderRadius: 12,
          cursor: isEmpty ? 'default' : 'pointer',
          marginBottom: 10,
          letterSpacing: 0.5,
        }}
      >
        {isEmpty ? t('palmier.deckEmpty') : t('palmier.draw')}
      </button>

      {state && (
        <p style={{ textAlign: 'center', color: '#888', fontSize: 13 }}>
          {t('palmier.remaining', { count: state.remaining })}
        </p>
      )}

      <style>{`
        @keyframes cardFlip {
          from { opacity: 0; transform: rotateY(40deg) scale(0.95); }
          to   { opacity: 1; transform: rotateY(0deg) scale(1); }
        }
      `}</style>
    </div>
  );
}
