import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import socket from '../socket';

export default function Lobby() {
  const { roomCode } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [room, setRoom] = useState(null);
  const [newName, setNewName] = useState('');
  const inputRef = useRef(null);

  const isHost = state?.isHost;

  useEffect(() => {
    socket.on('room:updated', setRoom);
    socket.on('game:started', ({ game, players }) => {
      navigate(`/game/${roomCode}`, { state: { ...state, game, players } });
    });

    return () => {
      socket.off('room:updated', setRoom);
      socket.off('game:started');
    };
  }, [roomCode, navigate, state]);

  function addPlayer() {
    const name = newName.trim();
    if (!name) return;
    socket.emit('room:add-player', { playerName: name }, (res) => {
      if (res?.error) alert(res.error);
      else {
        setNewName('');
        inputRef.current?.focus();
      }
    });
  }

  function removePlayer(playerId) {
    socket.emit('room:remove-player', { playerId });
  }

  function startGame() {
    socket.emit('game:start', { lang: i18n.language }, (res) => {
      if (res?.error) alert(res.error);
    });
  }

  const gameId = room?.game ?? state?.game;
  const players = room?.players ?? [];
  const canStart = players.length >= 2;

  return (
    <main style={{ maxWidth: 420, margin: '60px auto', padding: '0 16px', fontFamily: 'sans-serif' }}>
      <h1>{t('lobby.heading')}</h1>
      <p style={{ color: '#888', marginBottom: 4 }}>
        {t('lobby.game')} <strong>{gameId ? t('games.' + gameId, { defaultValue: gameId }) : '…'}</strong>
      </p>

      <h2 style={{ marginBottom: 8 }}>{t('lobby.players')}</h2>
      <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 16px' }}>
        {players.map((p) => (
          <li
            key={p.id}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #eee' }}
          >
            <span>
              {p.name}
              {p.id === room?.hostId && <span style={{ color: '#888', fontSize: 13 }}> {t('lobby.host')}</span>}
            </span>
            {isHost && p.id !== socket.id && (
              <button
                onClick={() => removePlayer(p.id)}
                style={{ background: 'none', border: 'none', color: '#aaa', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}
              >
                ×
              </button>
            )}
          </li>
        ))}
      </ul>

      {isHost && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
            <input
              ref={inputRef}
              placeholder={t('lobby.playerNamePlaceholder')}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
              style={{ flex: 1, padding: 8, fontSize: 16 }}
            />
            <button onClick={addPlayer} style={{ padding: '8px 16px', fontSize: 16 }}>
              {t('lobby.addPlayer')}
            </button>
          </div>

          <button
            onClick={startGame}
            disabled={!canStart}
            style={{ width: '100%', padding: 12, fontSize: 16, opacity: canStart ? 1 : 0.4, cursor: canStart ? 'pointer' : 'default' }}
          >
            {t('lobby.startGame')}
          </button>
          {!canStart && <p style={{ color: '#888', fontSize: 13, marginTop: 6 }}>{t('lobby.needMorePlayers')}</p>}
        </>
      )}
    </main>
  );
}
