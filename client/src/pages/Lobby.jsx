import { useEffect, useRef, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import socket from '../socket';

const GAME_EMOJI = {
  'truth-or-dare': '🎯',
  'never-have-i-ever': '✋',
  'picolo': '🍺',
  'palmier': '🃏',
};

function initials(name) {
  return name.trim().split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

const AVATAR_COLORS = ['#7c3aed', '#db2777', '#0891b2', '#059669', '#d97706', '#dc2626'];

export default function Lobby() {
  const { roomCode } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [room, setRoom] = useState(state?.room ?? null);
  const [newName, setNewName] = useState('');
  const inputRef = useRef(null);

  const isHost = state?.isHost;

  useEffect(() => {
    socket.on('room:updated', setRoom);
    socket.on('game:started', ({ game, players, initialState }) => {
      navigate(`/game/${roomCode}`, { state: { ...state, game, players, initialState } });
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
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 16px 48px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Game badge */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>{GAME_EMOJI[gameId] ?? '🎮'}</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: '#1e1b4b', letterSpacing: -0.3, marginBottom: 4 }}>
            {gameId ? t('games.' + gameId) : '…'}
          </h1>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            background: '#ede9fe',
            borderRadius: 20,
            padding: '4px 14px',
          }}>
            <span style={{ fontSize: 12, color: '#6d28d9', fontWeight: 600, letterSpacing: 1 }}>
              {t('lobby.roomCode')}
            </span>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#4c1d95', letterSpacing: 3 }}>
              {roomCode}
            </span>
          </div>
        </div>

        {/* Players */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px', marginBottom: 16, boxShadow: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(124,58,237,0.07)' }}>
          <p style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#7c3aed', marginBottom: 14 }}>
            {t('lobby.players')} · {players.length}
          </p>

          {players.length === 0 && (
            <p style={{ color: '#9ca3af', fontSize: 14, textAlign: 'center', padding: '8px 0' }}>…</p>
          )}

          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {players.map((p, i) => (
              <li
                key={p.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '10px 12px',
                  borderRadius: 10,
                  background: '#f9f7ff',
                }}
              >
                {/* Avatar */}
                <div style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: 13,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {initials(p.name)}
                </div>
                <span style={{ flex: 1, fontWeight: 500, fontSize: 15, color: '#1e1b4b' }}>
                  {p.name}
                </span>
                {p.id === room?.hostId && (
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#7c3aed', background: '#ede9fe', borderRadius: 20, padding: '2px 10px', letterSpacing: 0.5 }}>
                    {t('lobby.host')}
                  </span>
                )}
                {isHost && p.id !== socket.id && (
                  <button
                    onClick={() => removePlayer(p.id)}
                    style={{ background: 'none', border: 'none', color: '#d1d5db', fontSize: 20, lineHeight: 1, padding: 0, width: 28, height: 28 }}
                  >
                    ×
                  </button>
                )}
              </li>
            ))}
          </ul>

          {/* Add player input */}
          {isHost && (
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <input
                ref={inputRef}
                placeholder={t('lobby.playerNamePlaceholder')}
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addPlayer()}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  fontSize: 14,
                  borderRadius: 8,
                  border: '2px solid #e5e7eb',
                  outline: 'none',
                  color: '#1e1b4b',
                }}
              />
              <button
                onClick={addPlayer}
                style={{
                  padding: '10px 16px',
                  fontSize: 14,
                  fontWeight: 600,
                  background: '#7c3aed',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  whiteSpace: 'nowrap',
                }}
              >
                {t('lobby.addPlayer')}
              </button>
            </div>
          )}
        </div>

        {/* Start / waiting */}
        {isHost ? (
          <>
            <button
              onClick={startGame}
              disabled={!canStart}
              style={{
                width: '100%',
                padding: '16px',
                fontSize: 17,
                fontWeight: 700,
                background: canStart
                  ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)'
                  : '#e5e7eb',
                color: canStart ? '#fff' : '#9ca3af',
                border: 'none',
                borderRadius: 12,
                letterSpacing: 0.3,
                boxShadow: canStart ? '0 4px 12px rgba(124,58,237,0.3)' : 'none',
                transition: 'all 0.2s',
              }}
            >
              {t('lobby.startGame')}
            </button>
            {!canStart && (
              <p style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center', marginTop: 8 }}>
                {t('lobby.needMorePlayers')}
              </p>
            )}
          </>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px', background: '#fff', borderRadius: 12, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
            <p style={{ color: '#6b7280', fontSize: 14 }}>{t('lobby.waiting')}</p>
          </div>
        )}
      </div>
    </div>
  );
}
