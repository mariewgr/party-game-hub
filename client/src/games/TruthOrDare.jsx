import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import socket from '../socket';

export default function TruthOrDare({ players, initialState }) {
  const { t, i18n } = useTranslation();
  const [tod, setTod] = useState(
    initialState ? { phase: 'turn', currentPlayer: initialState.currentPlayer } : null
  );

  useEffect(() => {
    socket.on('tod:turn', ({ currentPlayer }) => {
      setTod({ phase: 'turn', currentPlayer });
    });

    socket.on('tod:prompt', ({ currentPlayer, choice, prompt }) => {
      setTod({ phase: 'prompt', currentPlayer, choice, prompt });
    });

    return () => {
      socket.off('tod:turn');
      socket.off('tod:prompt');
    };
  }, []);

  function choose(choice) {
    socket.emit('tod:choose', { choice, lang: i18n.language });
  }

  function next() {
    socket.emit('tod:next');
  }

  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 260 }}>
        {!tod && <p style={{ color: '#888' }}>Loading…</p>}

        {tod?.phase === 'turn' && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 12 }}>
              {t('tod.passPhone', { name: tod.currentPlayer.name })}
            </p>
            <p style={{ fontSize: 22, fontWeight: 600, marginBottom: 24 }}>{tod.currentPlayer.name}</p>
            <p style={{ marginBottom: 12 }}>{t('tod.choose')}</p>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => choose('truth')} style={btnStyle('#4f86f7')}>
                {t('tod.truth')}
              </button>
              <button onClick={() => choose('dare')} style={btnStyle('#f7664f')}>
                {t('tod.dare')}
              </button>
            </div>
          </div>
        )}

        {tod?.phase === 'prompt' && (
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 4 }}>
              {tod.currentPlayer.name}
            </p>
            <span style={badgeStyle(tod.choice)}>{t('tod.' + tod.choice)}</span>
            <p style={{ fontSize: 22, fontWeight: 500, margin: '16px 0 32px', lineHeight: 1.4 }}>
              {tod.prompt[i18n.language] ?? tod.prompt.en}
            </p>
            <button onClick={next} style={btnStyle('#555')}>
              {t('tod.next')}
            </button>
          </div>
        )}
      </div>

      {/* Player list sidebar */}
      <div style={{ minWidth: 140 }}>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>{t('tod.players')}</p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {players.map((p) => (
            <li
              key={p.id}
              style={{
                padding: '6px 10px',
                borderRadius: 6,
                marginBottom: 4,
                background: tod?.currentPlayer?.id === p.id ? '#fef3c7' : 'transparent',
                fontWeight: tod?.currentPlayer?.id === p.id ? 700 : 400,
              }}
            >
              {p.name}
              {tod?.currentPlayer?.id === p.id && ' 🎯'}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function btnStyle(color) {
  return {
    padding: '12px 28px',
    fontSize: 18,
    fontWeight: 600,
    background: color,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  };
}

function badgeStyle(choice) {
  return {
    display: 'inline-block',
    padding: '4px 14px',
    borderRadius: 20,
    background: choice === 'truth' ? '#4f86f7' : '#f7664f',
    color: '#fff',
    fontWeight: 700,
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  };
}
