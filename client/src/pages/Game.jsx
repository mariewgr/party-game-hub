import { useLocation, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import socket from '../socket';
import TruthOrDare from '../games/TruthOrDare';
import NeverHaveIEver from '../games/NeverHaveIEver';
import Picolo from '../games/Picolo';
import Palmier from '../games/Palmier';
import MostLikelyTo from '../games/MostLikelyTo';

const GAME_EMOJI = {
  'truth-or-dare': '🎯',
  'never-have-i-ever': '✋',
  'picolo': '🍺',
  'palmier': '🃏',
  'most-likely-to': '👆',
};

export default function Game() {
  const { roomCode } = useParams();
  const { state } = useLocation();
  const { t } = useTranslation();

  const [players, setPlayers] = useState(state?.players ?? []);
  const initialState = state?.initialState ?? {};

  useEffect(() => {
    socket.on('room:updated', (room) => setPlayers(room.players));
    return () => socket.off('room:updated');
  }, []);

  const gameId = state?.game;

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      {/* Game header */}
      <div style={{
        background: '#fff',
        borderBottom: '1px solid #ede9fe',
        padding: '14px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: 10,
      }}>
        <span style={{ fontSize: 24 }}>{GAME_EMOJI[gameId] ?? '🎮'}</span>
        <div>
          <p style={{ fontWeight: 700, fontSize: 16, color: '#1e1b4b', lineHeight: 1.2 }}>
            {gameId ? t('games.' + gameId, { defaultValue: gameId }) : 'Game'}
          </p>
          <p style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600, letterSpacing: 1 }}>
            {t('game.room')} {roomCode}
          </p>
        </div>
      </div>

      {/* Game content */}
      <div style={{ flex: 1, padding: '24px 16px 48px' }}>
        {gameId === 'truth-or-dare' && (
          <TruthOrDare players={players} initialState={initialState.tod} />
        )}
        {gameId === 'never-have-i-ever' && (
          <NeverHaveIEver players={players} initialState={initialState.nhie} />
        )}
        {gameId === 'picolo' && (
          <Picolo initialState={initialState.picolo} />
        )}
        {gameId === 'palmier' && (
          <Palmier initialState={initialState.palmier} />
        )}
        {gameId === 'most-likely-to' && (
          <MostLikelyTo players={players} initialState={initialState.mlt} />
        )}
        {!['truth-or-dare', 'never-have-i-ever', 'picolo', 'palmier', 'most-likely-to'].includes(gameId) && (
          <p style={{ color: '#9ca3af', textAlign: 'center' }}>{t('game.comingSoon')}</p>
        )}
      </div>
    </div>
  );
}
