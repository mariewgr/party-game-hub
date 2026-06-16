import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import socket from '../socket';

const TYPE_COLORS = {
  solo:      { bg: '#fef3c7', border: '#f59e0b', badge: '#f59e0b' },
  duo:       { bg: '#fff7ed', border: '#f97316', badge: '#f97316' },
  group:     { bg: '#eff6ff', border: '#3b82f6', badge: '#3b82f6' },
  challenge: { bg: '#f5f3ff', border: '#8b5cf6', badge: '#8b5cf6' },
};

export default function Picolo() {
  const { t, i18n } = useTranslation();
  const [card, setCard] = useState(null);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    socket.on('picolo:card', (incoming) => {
      setCard(incoming);
      setAnimKey((k) => k + 1);
    });
    return () => socket.off('picolo:card');
  }, []);

  function next() {
    socket.emit('picolo:next', { lang: i18n.language });
  }

  const colors = TYPE_COLORS[card?.type] ?? TYPE_COLORS.group;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      {!card && <p style={{ color: '#888' }}>Loading…</p>}

      {card && (
        <div
          key={animKey}
          style={{
            width: '100%',
            maxWidth: 420,
            minHeight: 260,
            background: colors.bg,
            border: `2px solid ${colors.border}`,
            borderRadius: 20,
            padding: '32px 28px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            boxSizing: 'border-box',
            animation: 'fadeSlide 0.25s ease',
          }}
        >
          <span style={{
            display: 'inline-block',
            alignSelf: 'flex-start',
            padding: '4px 12px',
            borderRadius: 20,
            background: colors.badge,
            color: '#fff',
            fontWeight: 700,
            fontSize: 12,
            textTransform: 'uppercase',
            letterSpacing: 1,
            marginBottom: 20,
          }}>
            {t('picolo.types.' + card.type)}
          </span>

          <p style={{
            fontSize: 22,
            fontWeight: 500,
            lineHeight: 1.5,
            margin: 0,
            flex: 1,
            display: 'flex',
            alignItems: 'center',
          }}>
            {card.text}
          </p>
        </div>
      )}

      <button
        onClick={next}
        disabled={!card}
        style={{
          marginTop: 28,
          padding: '14px 40px',
          fontSize: 18,
          fontWeight: 600,
          background: card ? (TYPE_COLORS[card.type]?.badge ?? '#555') : '#ccc',
          color: '#fff',
          border: 'none',
          borderRadius: 12,
          cursor: card ? 'pointer' : 'default',
          transition: 'background 0.2s',
        }}
      >
        {t('picolo.next')} →
      </button>

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
