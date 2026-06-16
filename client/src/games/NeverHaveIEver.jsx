import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import socket from '../socket';

const FINGER_EMOJI = ['', '☝️', '✌️', '🤟', '🖖', '🖐️'];

export default function NeverHaveIEver({ players }) {
  const { t, i18n } = useTranslation();
  const [nhie, setNhie] = useState(null);

  useEffect(() => {
    socket.on('nhie:turn', ({ currentPlayer, statement, fingers }) => {
      setNhie({ phase: 'voting', currentPlayer, statement, fingers, localVotes: {} });
    });

    socket.on('nhie:results', ({ currentPlayer, votes, fingers }) => {
      setNhie((prev) => ({ ...prev, phase: 'results', currentPlayer, votes, fingers }));
    });

    return () => {
      socket.off('nhie:turn');
      socket.off('nhie:results');
    };
  }, []);

  function vote(playerId, hasDone) {
    socket.emit('nhie:vote', { playerId, hasDone }, (res) => {
      if (!res?.error) {
        setNhie((prev) => ({
          ...prev,
          localVotes: { ...prev.localVotes, [playerId]: hasDone },
        }));
      }
    });
  }

  function next() {
    socket.emit('nhie:next', { lang: i18n.language });
  }

  return (
    <div style={{ display: 'flex', gap: 32, alignItems: 'flex-start', flexWrap: 'wrap' }}>
      <div style={{ flex: 1, minWidth: 260 }}>
        {!nhie && <p style={{ color: '#888' }}>Loading…</p>}

        {nhie && (
          <>
            <p style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#888', marginBottom: 8 }}>
              {t('nhie.neverHaveIEver')}
            </p>
            <p style={{ fontSize: 22, fontWeight: 600, marginBottom: 28, lineHeight: 1.4 }}>
              {nhie.statement}
            </p>
          </>
        )}

        {nhie?.phase === 'voting' && (
          <div>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {players.map((p) => {
                const voted = nhie.localVotes[p.id] !== undefined;
                const hasDone = nhie.localVotes[p.id];
                return (
                  <li
                    key={p.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 12,
                      padding: '10px 12px',
                      borderRadius: 8,
                      background: voted ? (hasDone ? '#fff0ee' : '#f0fdf4') : '#f9f9f9',
                    }}
                  >
                    <span style={{ flex: 1, fontWeight: 500 }}>{p.name}</span>
                    {voted ? (
                      <span style={{ fontSize: 20 }}>{hasDone ? '👇' : '✋'}</span>
                    ) : (
                      <>
                        <button onClick={() => vote(p.id, true)} style={smallBtn('#f7664f')}>
                          {t('nhie.iHave')}
                        </button>
                        <button onClick={() => vote(p.id, false)} style={smallBtn('#4caf50')}>
                          {t('nhie.iHavent')}
                        </button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
            <p style={{ color: '#aaa', fontSize: 13, marginTop: 8 }}>
              {t('nhie.voted', {
                count: Object.keys(nhie.localVotes).length,
                total: players.length,
              })}
            </p>
          </div>
        )}

        {nhie?.phase === 'results' && (
          <div>
            <p style={{ fontWeight: 700, marginBottom: 12 }}>{t('nhie.results')}</p>
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px' }}>
              {nhie.votes?.map(({ player, hasDone }) => (
                <li key={player.id} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 20 }}>{hasDone ? '👇' : '✋'}</span>
                  <span style={{ fontWeight: 500 }}>{player.name}</span>
                  <span style={{ color: hasDone ? '#f7664f' : '#4caf50', fontSize: 13 }}>
                    {hasDone ? t('nhie.hasDone') : t('nhie.hasnt')}
                  </span>
                </li>
              ))}
            </ul>
            <button onClick={next} style={btnStyle('#555')}>
              {t('nhie.next')}
            </button>
          </div>
        )}
      </div>

      {/* Finger count sidebar */}
      <div style={{ minWidth: 150 }}>
        <p style={{ fontWeight: 600, marginBottom: 8 }}>{t('nhie.players')}</p>
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {players.map((p) => {
            const count = nhie?.fingers?.[p.id] ?? 5;
            const isOut = count === 0;
            const isCurrent = nhie?.currentPlayer?.id === p.id;
            return (
              <li
                key={p.id}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  marginBottom: 4,
                  background: isCurrent ? '#fef3c7' : 'transparent',
                  opacity: isOut ? 0.45 : 1,
                }}
              >
                <span style={{ fontWeight: isCurrent ? 700 : 400 }}>
                  {p.name}{isCurrent && ' 🎯'}
                </span>
                <br />
                <span style={{ fontSize: 13, color: isOut ? '#f7664f' : '#555' }}>
                  {isOut
                    ? t('nhie.out')
                    : `${FINGER_EMOJI[Math.min(count, 5)]} ${count} ${t('nhie.fingers')}`}
                </span>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

function smallBtn(color) {
  return {
    padding: '6px 12px',
    fontSize: 13,
    fontWeight: 600,
    background: color,
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  };
}

function btnStyle(color) {
  return {
    padding: '12px 24px',
    fontSize: 16,
    fontWeight: 600,
    background: color,
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
  };
}
