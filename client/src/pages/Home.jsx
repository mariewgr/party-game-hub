import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import socket from '../socket';

const GAMES = [
  { id: 'truth-or-dare' },
  { id: 'never-have-i-ever' },
  { id: 'picolo' },
  { id: 'palmier' },
];

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [playerName, setPlayerName] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [selectedGame, setSelectedGame] = useState(GAMES[0].id);
  const [error, setError] = useState('');

  function connect() {
    if (!socket.connected) socket.connect();
  }

  function createRoom() {
    if (!playerName.trim()) return setError(t('errors.enterName'));
    connect();
    socket.emit('room:create', { playerName: playerName.trim(), game: selectedGame }, ({ code, error }) => {
      if (error) return setError(error);
      navigate(`/lobby/${code}`, { state: { playerName: playerName.trim(), isHost: true } });
    });
  }

  function joinRoom() {
    if (!playerName.trim()) return setError(t('errors.enterName'));
    if (!roomCode.trim()) return setError(t('errors.enterRoomCode'));
    connect();
    socket.emit('room:join', { roomCode: roomCode.trim().toUpperCase(), playerName: playerName.trim() }, ({ room, error }) => {
      if (error) return setError(error);
      navigate(`/lobby/${roomCode.trim().toUpperCase()}`, { state: { playerName: playerName.trim(), isHost: false } });
    });
  }

  return (
    <main style={{ maxWidth: 400, margin: '80px auto', padding: '0 16px', fontFamily: 'sans-serif' }}>
      <h1>{t('appTitle')}</h1>

      <input
        placeholder={t('yourName')}
        value={playerName}
        onChange={(e) => setPlayerName(e.target.value)}
        style={{ display: 'block', width: '100%', marginBottom: 12, padding: 8, fontSize: 16 }}
      />

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <section>
        <h2>{t('createRoom.heading')}</h2>
        <select
          value={selectedGame}
          onChange={(e) => setSelectedGame(e.target.value)}
          style={{ width: '100%', padding: 8, marginBottom: 12, fontSize: 16 }}
        >
          {GAMES.map((g) => (
            <option key={g.id} value={g.id}>{t('games.' + g.id)}</option>
          ))}
        </select>
        <button onClick={createRoom} style={{ width: '100%', padding: 10, fontSize: 16 }}>
          {t('createRoom.button')}
        </button>
      </section>

      <hr style={{ margin: '24px 0' }} />

      <section>
        <h2>{t('joinRoom.heading')}</h2>
        <input
          placeholder={t('joinRoom.roomCode')}
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          style={{ display: 'block', width: '100%', marginBottom: 12, padding: 8, fontSize: 16, textTransform: 'uppercase' }}
        />
        <button onClick={joinRoom} style={{ width: '100%', padding: 10, fontSize: 16 }}>
          {t('joinRoom.button')}
        </button>
      </section>
    </main>
  );
}
