import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import socket from '../socket';

export default function NeverHaveIEver({ players, initialState }) {
  const { t, i18n } = useTranslation();
  const [nhie, setNhie] = useState(
    initialState
      ? { currentPlayer: initialState.currentPlayer, statement: initialState.statement }
      : null
  );

  useEffect(() => {
    socket.on('nhie:turn', ({ currentPlayer, statement }) => {
      setNhie({ currentPlayer, statement });
    });

    return () => socket.off('nhie:turn');
  }, []);

  function next() {
    socket.emit('nhie:next', { lang: i18n.language });
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      {!nhie && <p style={{ color: '#888' }}>Loading…</p>}

      {nhie && (
        <>
          <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 8 }}>
            {t('nhie.neverHaveIEver')}
          </p>
          <div style={{
            background: '#f0fdf4',
            border: '2px solid #4caf50',
            borderRadius: 20,
            padding: '32px 28px',
            marginBottom: 28,
          }}>
            <p style={{ fontSize: 24, fontWeight: 600, lineHeight: 1.4, margin: 0 }}>
              {nhie.statement[i18n.language] ?? nhie.statement.en}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <span style={{ fontSize: 13, color: '#888' }}>{t('nhie.currentPlayer')} :</span>
            <span style={{ fontWeight: 700, fontSize: 15 }}>🎯 {nhie.currentPlayer.name}</span>
          </div>

          <button onClick={next} style={{
            width: '100%',
            padding: '14px',
            fontSize: 17,
            fontWeight: 700,
            background: '#4caf50',
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            cursor: 'pointer',
          }}>
            {t('nhie.next')} →
          </button>

          {/* Player list */}
          <div style={{ marginTop: 32 }}>
            <p style={{ fontWeight: 600, marginBottom: 8, fontSize: 13, textTransform: 'uppercase', letterSpacing: 1, color: '#888' }}>
              {t('nhie.players')}
            </p>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {players.map((p) => (
                <li
                  key={p.id}
                  style={{
                    padding: '6px 14px',
                    borderRadius: 20,
                    background: nhie.currentPlayer.id === p.id ? '#4caf50' : '#f3f4f6',
                    color: nhie.currentPlayer.id === p.id ? '#fff' : '#333',
                    fontWeight: nhie.currentPlayer.id === p.id ? 700 : 400,
                    fontSize: 14,
                  }}
                >
                  {p.name}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}
    </div>
  );
}
