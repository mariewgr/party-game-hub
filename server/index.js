import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';
import {
  randomPrompt,
  randomStatement,
  randomMLTStatement,
  drawPicoloCard,
  buildDeck,
  getCardRule,
} from './game-utils.js';

const app = express();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/health', (_req, res) => res.json({ status: 'ok' }));

// ---------------------------------------------------------------------------
// Room state
// ---------------------------------------------------------------------------

const rooms = {};

function generateRoomCode() {
  return Math.random().toString(36).slice(2, 6).toUpperCase();
}

// ---------------------------------------------------------------------------
// Socket handlers
// ---------------------------------------------------------------------------

io.on('connection', (socket) => {
  console.log('connected:', socket.id);

  socket.on('room:create', ({ playerName, game }, callback) => {
    const code = generateRoomCode();
    rooms[code] = {
      hostId: socket.id,
      game,
      players: [{ id: socket.id, name: playerName }],
      state: 'lobby',
    };
    socket.join(code);
    socket.data.roomCode = code;
    callback({ code, room: rooms[code] });
    console.log(`Room ${code} created by ${playerName}`);
  });

  socket.on('room:join', ({ roomCode, playerName }, callback) => {
    const room = rooms[roomCode];
    if (!room) return callback({ error: 'Room not found' });
    if (room.state !== 'lobby') return callback({ error: 'Game already started' });

    room.players.push({ id: socket.id, name: playerName });
    socket.join(roomCode);
    socket.data.roomCode = roomCode;

    io.to(roomCode).emit('room:updated', room);
    callback({ room });
    console.log(`${playerName} joined room ${roomCode}`);
  });

  socket.on('room:add-player', ({ playerName }, callback) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return callback?.({ error: 'Room not found' });
    if (room.state !== 'lobby') return callback?.({ error: 'Game already started' });
    if (room.hostId !== socket.id) return callback?.({ error: 'Not authorized' });

    const id = Math.random().toString(36).slice(2, 10);
    room.players.push({ id, name: playerName });
    io.to(code).emit('room:updated', room);
    callback?.({ ok: true });
  });

  socket.on('room:remove-player', ({ playerId }, callback) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room) return callback?.({ error: 'Room not found' });
    if (room.state !== 'lobby') return callback?.({ error: 'Game already started' });
    if (room.hostId !== socket.id) return callback?.({ error: 'Not authorized' });
    if (playerId === socket.id) return callback?.({ error: 'Cannot remove yourself' });

    room.players = room.players.filter((p) => p.id !== playerId);
    io.to(code).emit('room:updated', room);
    callback?.({ ok: true });
  });

  socket.on('game:start', ({ lang } = {}, callback) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room || room.hostId !== socket.id) return callback?.({ error: 'Not authorized' });

    room.state = 'playing';

    let initialState = null;

    if (room.game === 'truth-or-dare') {
      room.tod = { turnIndex: 0, phase: 'choosing' };
      initialState = { tod: { currentPlayer: room.players[0], turnIndex: 0 } };
    }

    if (room.game === 'palmier') {
      room.palmier = { deck: buildDeck(), activeRules: [], lang: lang || 'en' };
      initialState = { palmier: { remaining: room.palmier.deck.length, activeRules: [], currentCard: null } };
    }

    if (room.game === 'picolo') {
      const usedIndices = new Set();
      const card = drawPicoloCard(room.players, usedIndices);
      room.picolo = { usedIndices };
      initialState = { picolo: card };
    }

    if (room.game === 'never-have-i-ever') {
      const usedIndices = new Set();
      const statement = randomStatement(usedIndices);
      room.nhie = { turnIndex: 0, statement, usedIndices };
      initialState = { nhie: { currentPlayer: room.players[0], statement } };
    }

    if (room.game === 'most-likely-to') {
      const usedIndices = new Set();
      const statement = randomMLTStatement(usedIndices);
      room.mlt = { statement, usedIndices };
      initialState = { mlt: { statement } };
    }

    // Bundle initial game state into game:started so the client has it before navigating
    io.to(code).emit('game:started', { game: room.game, players: room.players, initialState });

    callback?.({ ok: true });
  });

  // Palmier
  socket.on('palmier:draw', ({ lang } = {}, callback) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room?.palmier) return callback?.({ error: 'No game in progress' });
    if (room.palmier.deck.length === 0) return callback?.({ error: 'Deck is empty' });

    const card = room.palmier.deck.pop();
    const rule = getCardRule(card.value);

    if (rule.persistent) {
      if (card.value === 'K') {
        // King rule: bilingual title, user-typed text (set later via palmier:set-king-rule)
        room.palmier.activeRules.push({ cardValue: 'K', en: { title: rule.en.title, text: '…' }, fr: { title: rule.fr.title, text: '…' }, isKing: true });
      } else {
        room.palmier.activeRules = room.palmier.activeRules.filter((r) => r.cardValue !== card.value);
        room.palmier.activeRules.push({ cardValue: card.value, en: rule.en, fr: rule.fr });
      }
    }

    io.to(code).emit('palmier:card', { card, rule, remaining: room.palmier.deck.length, activeRules: room.palmier.activeRules });
    callback?.({ ok: true });
  });

  socket.on('palmier:set-king-rule', ({ text } = {}, callback) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room?.palmier) return callback?.({ error: 'No game in progress' });

    const idx = [...room.palmier.activeRules].reverse().findIndex((r) => r.cardValue === 'K' && r.isKing);
    if (idx !== -1) {
      const realIdx = room.palmier.activeRules.length - 1 - idx;
      // King rule text is user-typed, same in both languages
      room.palmier.activeRules[realIdx].en.text = text;
      room.palmier.activeRules[realIdx].fr.text = text;
    }

    io.to(code).emit('palmier:rules-updated', { activeRules: room.palmier.activeRules });
    callback?.({ ok: true });
  });

  // Picolo
  socket.on('picolo:next', ({ lang } = {}, callback) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room?.picolo) return callback?.({ error: 'No game in progress' });

    const card = drawPicoloCard(room.players, room.picolo.usedIndices);
    io.to(code).emit('picolo:card', card);
    callback?.({ ok: true });
  });

  // Truth or Dare
  socket.on('tod:choose', ({ choice, lang }, callback) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room?.tod) return callback?.({ error: 'No game in progress' });
    if (room.tod.phase !== 'choosing') return callback?.({ error: 'Already chosen' });

    const currentPlayer = room.players[room.tod.turnIndex];
    const prompt = randomPrompt(choice);
    room.tod.phase = 'prompt';
    room.tod.choice = choice;
    room.tod.prompt = prompt;

    io.to(code).emit('tod:prompt', { currentPlayer, choice, prompt });
    callback?.({ ok: true });
  });

  socket.on('tod:next', (callback) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room?.tod) return callback?.({ error: 'No game in progress' });

    room.tod.turnIndex = (room.tod.turnIndex + 1) % room.players.length;
    room.tod.phase = 'choosing';
    room.tod.choice = null;
    room.tod.prompt = null;

    io.to(code).emit('tod:turn', { currentPlayer: room.players[room.tod.turnIndex], turnIndex: room.tod.turnIndex });
    callback?.({ ok: true });
  });

  // Never Have I Ever
  socket.on('nhie:next', ({ lang } = {}, callback) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room?.nhie) return callback?.({ error: 'No game in progress' });

    room.nhie.turnIndex = (room.nhie.turnIndex + 1) % room.players.length;
    room.nhie.statement = randomStatement(room.nhie.usedIndices);

    io.to(code).emit('nhie:turn', { currentPlayer: room.players[room.nhie.turnIndex], statement: room.nhie.statement });
    callback?.({ ok: true });
  });

  // Most Likely To
  socket.on('mlt:next', (_, callback) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room?.mlt) return callback?.({ error: 'No game in progress' });

    room.mlt.statement = randomMLTStatement(room.mlt.usedIndices);
    io.to(code).emit('mlt:turn', { statement: room.mlt.statement });
    callback?.({ ok: true });
  });

  socket.on('disconnect', () => {
    const code = socket.data.roomCode;
    if (!code || !rooms[code]) return;

    const room = rooms[code];
    const disconnectedIndex = room.players.findIndex((p) => p.id === socket.id);
    room.players = room.players.filter((p) => p.id !== socket.id);

    if (room.players.length === 0) {
      delete rooms[code];
      console.log(`Room ${code} deleted (empty)`);
      return;
    }

    if (room.hostId === socket.id) room.hostId = room.players[0].id;

    if (room.tod && room.tod.turnIndex >= disconnectedIndex) {
      room.tod.turnIndex = Math.max(0, room.tod.turnIndex - 1);
    }
    if (room.tod && room.players.length > 0) {
      room.tod.turnIndex = room.tod.turnIndex % room.players.length;
      room.tod.phase = 'choosing';
      io.to(code).emit('tod:turn', { currentPlayer: room.players[room.tod.turnIndex], turnIndex: room.tod.turnIndex });
    }

    if (room.nhie) {
      if (room.nhie.turnIndex >= disconnectedIndex) {
        room.nhie.turnIndex = Math.max(0, room.nhie.turnIndex - 1);
      }
      room.nhie.turnIndex = room.nhie.turnIndex % room.players.length;
    }

    io.to(code).emit('room:updated', room);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
