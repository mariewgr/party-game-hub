import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import socket from '../socket';

const GAMES = [
  { id: 'truth-or-dare',    emoji: '🎯' },
  { id: 'never-have-i-ever', emoji: '✋' },
  { id: 'picolo',           emoji: '🍺' },
  { id: 'palmier',          emoji: '🃏' },
  { id: 'most-likely-to',   emoji: '👆' },
];

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [playerName, setPlayerName] = useState(() => localStorage.getItem('playerName') ?? '');
  const [roomCode, setRoomCode] = useState('');
  const [selectedGame, setSelectedGame] = useState(GAMES[0].id);
  const [error, setError] = useState('');

  function connect() {
    if (!socket.connected) socket.connect();
  }

  function createRoom() {
    if (!playerName.trim()) return setError(t('errors.enterName'));
    setError('');
    connect();
    socket.emit('room:create', { playerName: playerName.trim(), game: selectedGame }, ({ code, room, error }) => {
      if (error) return setError(error);
      navigate(`/lobby/${code}`, { state: { playerName: playerName.trim(), isHost: true, room } });
    });
  }

  function joinRoom() {
    if (!playerName.trim()) return setError(t('errors.enterName'));
    if (!roomCode.trim()) return setError(t('errors.enterRoomCode'));
    setError('');
    connect();
    socket.emit('room:join', { roomCode: roomCode.trim().toUpperCase(), playerName: playerName.trim() }, ({ room, error }) => {
      if (error) return setError(error);
      navigate(`/lobby/${roomCode.trim().toUpperCase()}`, { state: { playerName: playerName.trim(), isHost: false } });
    });
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 16px 48px' }}>

      {/* Hero */}
      <div style={{ textAlign: 'center', marginBottom: 36 }}>
        <div style={{ fontSize: 56, marginBottom: 12 }}>🎉</div>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#1e1b4b', letterSpacing: -0.5, marginBottom: 6 }}>
          Party Game Hub
        </h1>
        <p style={{ color: '#7c3aed', fontWeight: 500, fontSize: 15 }}>
          {t('home.tagline', { defaultValue: 'Play together, one phone' })}
        </p>
      </div>

      {/* Name input (shared) */}
      <div style={{ width: '100%', maxWidth: 400, marginBottom: 24 }}>
        <input
          placeholder={t('yourName')}
          value={playerName}
          onChange={(e) => { setPlayerName(e.target.value); localStorage.setItem('playerName', e.target.value); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && createRoom()}
          style={inputStyle}
        />
        {error && (
          <p style={{ color: '#dc2626', fontSize: 13, marginTop: 6, fontWeight: 500 }}>{error}</p>
        )}
      </div>

      {/* Create Room card */}
      <div style={{ ...card, width: '100%', maxWidth: 400, marginBottom: 16 }}>
        <h2 style={sectionTitle}>{t('createRoom.heading')}</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {GAMES.map((g) => (
            <label
              key={g.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                borderRadius: 10,
                border: `2px solid ${selectedGame === g.id ? '#7c3aed' : '#e5e7eb'}`,
                background: selectedGame === g.id ? '#f5f3ff' : '#fff',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <input
                type="radio"
                name="game"
                value={g.id}
                checked={selectedGame === g.id}
                onChange={() => setSelectedGame(g.id)}
                style={{ accentColor: '#7c3aed', width: 16, height: 16 }}
              />
              <span style={{ fontSize: 20 }}>{g.emoji}</span>
              <span style={{ fontWeight: selectedGame === g.id ? 600 : 400, color: selectedGame === g.id ? '#4c1d95' : '#374151', fontSize: 15 }}>
                {t('games.' + g.id)}
              </span>
            </label>
          ))}
        </div>

        <button onClick={createRoom} style={{ ...primaryBtn, marginTop: 20 }}>
          {t('createRoom.button')}
        </button>
      </div>

      {/* Divider */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%', maxWidth: 400, marginBottom: 16 }}>
        <div style={{ flex: 1, height: 1, background: '#ddd6fe' }} />
        <span style={{ color: '#a78bfa', fontSize: 13, fontWeight: 600 }}>OR</span>
        <div style={{ flex: 1, height: 1, background: '#ddd6fe' }} />
      </div>

      {/* Join Room card */}
      <div style={{ ...card, width: '100%', maxWidth: 400 }}>
        <h2 style={sectionTitle}>{t('joinRoom.heading')}</h2>
        <input
          placeholder={t('joinRoom.roomCode')}
          value={roomCode}
          onChange={(e) => { setRoomCode(e.target.value.toUpperCase()); setError(''); }}
          onKeyDown={(e) => e.key === 'Enter' && joinRoom()}
          style={{ ...inputStyle, textTransform: 'uppercase', letterSpacing: 4, textAlign: 'center', fontSize: 20, fontWeight: 700 }}
          maxLength={6}
        />
        <button onClick={joinRoom} style={{ ...secondaryBtn, marginTop: 12 }}>
          {t('joinRoom.button')}
        </button>
      </div>
    </div>
  );
}

const card = {
  background: '#fff',
  borderRadius: 16,
  padding: '24px 20px',
  boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(124,58,237,0.08)',
};

const sectionTitle = {
  fontSize: 17,
  fontWeight: 700,
  color: '#1e1b4b',
  marginBottom: 16,
};

const inputStyle = {
  width: '100%',
  padding: '13px 16px',
  fontSize: 16,
  borderRadius: 10,
  border: '2px solid #e5e7eb',
  outline: 'none',
  color: '#1e1b4b',
  background: '#fff',
  transition: 'border-color 0.15s',
};

const primaryBtn = {
  width: '100%',
  padding: '14px',
  fontSize: 16,
  fontWeight: 700,
  background: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  letterSpacing: 0.3,
  boxShadow: '0 4px 12px rgba(124,58,237,0.3)',
};

const secondaryBtn = {
  width: '100%',
  padding: '14px',
  fontSize: 16,
  fontWeight: 700,
  background: '#fff',
  color: '#7c3aed',
  border: '2px solid #7c3aed',
  borderRadius: 10,
  letterSpacing: 0.3,
};
