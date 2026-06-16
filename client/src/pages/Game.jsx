import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import socket from '../socket';
import TruthOrDare from '../games/TruthOrDare';
import NeverHaveIEver from '../games/NeverHaveIEver';
import Picolo from '../games/Picolo';
import Palmier from '../games/Palmier';

export default function Game() {
  const { roomCode } = useParams();
  const { state } = useLocation();
  const { t } = useTranslation();

  const [players, setPlayers] = useState(state?.players ?? []);

  useEffect(() => {
    // Keep player list in sync if someone disconnects mid-game
    socket.on('room:updated', (room) => setPlayers(room.players));
    return () => socket.off('room:updated');
  }, []);

  const gameId = state?.game;

  return (
    <main style={{ maxWidth: 700, margin: '40px auto', padding: '0 16px', fontFamily: 'sans-serif' }}>
      <h1 style={{ marginBottom: 4 }}>
        {gameId ? t('games.' + gameId, { defaultValue: gameId }) : 'Game'}
      </h1>
      <p style={{ color: '#888', marginBottom: 32 }}>{t('game.room')} <strong>{roomCode}</strong></p>

      {gameId === 'truth-or-dare' && (
        <TruthOrDare players={players} />
      )}

      {gameId === 'never-have-i-ever' && (
        <NeverHaveIEver players={players} />
      )}

      {gameId === 'picolo' && (
        <Picolo />
      )}

      {gameId === 'palmier' && (
        <Palmier />
      )}

      {!['truth-or-dare', 'never-have-i-ever', 'picolo', 'palmier'].includes(gameId) && (
        <p>{t('game.comingSoon')}</p>
      )}
    </main>
  );
}
