import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import socket from '../socket';

export default function MostLikelyTo({ players, initialState }) {
  const { t, i18n } = useTranslation();
  const [statement, setStatement] = useState(initialState?.statement ?? null);
  const [animKey, setAnimKey] = useState(0);

  useEffect(() => {
    socket.on('mlt:turn', ({ statement }) => {
      setStatement(statement);
      setAnimKey((k) => k + 1);
    });
    return () => socket.off('mlt:turn');
  }, []);

  function next() {
    socket.emit('mlt:next');
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>

      {!statement && <p style={{ color: '#888' }}>Loading…</p>}

      {statement && (
        <>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#7c3aed', marginBottom: 10 }}>
            {t('mlt.mostLikelyTo')}
          </p>

          {/* Statement card */}
          <div
            key={animKey}
            style={{
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
              borderRadius: 20,
              padding: '36px 28px',
              marginBottom: 24,
              animation: 'fadeSlide 0.25s ease',
            }}
          >
            <p style={{ fontSize: 26, fontWeight: 700, color: '#fff', lineHeight: 1.4, margin: 0 }}>
              {statement[i18n.language] ?? statement.en}
            </p>
          </div>

          {/* Instruction */}
          <p style={{ fontSize: 14, color: '#6b7280', marginBottom: 24, textAlign: 'center', lineHeight: 1.5 }}>
            👉 {t('mlt.instruction')}
          </p>

          {/* Player chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 28, justifyContent: 'center' }}>
            {players.map((p, i) => (
              <span
                key={p.id}
                style={{
                  padding: '8px 16px',
                  borderRadius: 20,
                  background: CHIP_COLORS[i % CHIP_COLORS.length],
                  color: '#fff',
                  fontWeight: 600,
                  fontSize: 14,
                }}
              >
                {p.name}
              </span>
            ))}
          </div>

          <button
            onClick={next}
            style={{
              width: '100%',
              padding: '14px',
              fontSize: 17,
              fontWeight: 700,
              background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
            }}
          >
            {t('mlt.next')} →
          </button>
        </>
      )}

      <style>{`
        @keyframes fadeSlide {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

const CHIP_COLORS = ['#7c3aed', '#db2777', '#0891b2', '#059669', '#d97706', '#dc2626', '#4f46e5', '#0f766e'];
