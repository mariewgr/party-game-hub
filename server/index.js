import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import 'dotenv/config';

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
// Truth or Dare prompts
// ---------------------------------------------------------------------------

const PROMPTS = {
  truth: {
    en: [
      'What is the most embarrassing thing you have ever done?',
      'Have you ever lied to get out of trouble? What was the lie?',
      'What is your biggest fear?',
      'What is the most childish thing you still do?',
      'Have you ever cheated on a test or game?',
      'What is the worst gift you have ever received?',
      'Have you ever blamed someone else for something you did?',
      'What is the most ridiculous thing you have ever cried about?',
      'What is a secret you have never told anyone in this room?',
      'Have you ever pretended to be sick to avoid something?',
      'What is the strangest dream you have ever had?',
      'Who in this room would you trade lives with for a day?',
      'What is the most embarrassing song on your playlist?',
      'Have you ever stalked someone on social media for over an hour?',
      'What is the pettiest thing you have ever done to get revenge?',
      'What is something you pretend to like but actually hate?',
      'What is your most irrational fear?',
      'Have you ever sent a text to the wrong person?',
      'What is the biggest lie you have told this week?',
      'What is one thing you would never want your parents to find out?',
    ],
    fr: [
      'Quelle est la chose la plus embarrassante que tu aies jamais faite ?',
      'As-tu déjà menti pour éviter des ennuis ? C'était quoi ?',
      'Quelle est ta plus grande peur ?',
      'Quelle est la chose la plus puérile que tu fasses encore ?',
      'As-tu déjà triché à un examen ou à un jeu ?',
      'Quel est le pire cadeau que tu aies jamais reçu ?',
      'As-tu déjà accusé quelqu'un d'autre pour quelque chose que tu avais fait ?',
      'Pour quelle raison la plus ridicule as-tu déjà pleuré ?',
      'Quel est un secret que tu n'as jamais dit à personne dans cette pièce ?',
      'As-tu déjà fait semblant d'être malade pour éviter quelque chose ?',
      'Quel est le rêve le plus étrange que tu aies jamais fait ?',
      'Qui dans cette pièce échangerais-tu ta vie pour une journée ?',
      'Quelle est la chanson la plus embarrassante dans ta playlist ?',
      'As-tu déjà stalké quelqu'un sur les réseaux sociaux pendant plus d'une heure ?',
      'Quelle est la chose la plus mesquine que tu aies faite par vengeance ?',
      'Quelle est une chose que tu fais semblant d'aimer mais que tu détestes en fait ?',
      'Quelle est ta peur la plus irrationnelle ?',
      'As-tu déjà envoyé un message à la mauvaise personne ?',
      'Quel est le plus grand mensonge que tu aies dit cette semaine ?',
      'Quelle est une chose que tu ne voudrais jamais que tes parents découvrent ?',
    ],
  },
  dare: {
    en: [
      'Do your best impression of someone in this room.',
      'Text someone in your contacts "I think about you sometimes" without context.',
      'Let someone in the room post anything they want on your social media.',
      'Speak in an accent for the next 3 rounds.',
      'Do 20 push-ups right now.',
      'Call a family member and sing them Happy Birthday, even if it is not their birthday.',
      'Let the group read your last 5 texts out loud.',
      'Eat a spoonful of the spiciest condiment available.',
      'Do your best catwalk across the room.',
      'Say something nice about every person in the room.',
      'Do an impression of your favorite celebrity for 30 seconds.',
      'Let someone draw on your face with a marker.',
      'Talk in a whisper for the next 2 rounds.',
      'Show the most embarrassing photo on your phone.',
      'Serenade the person to your left.',
      'Do the worm — or attempt to.',
      'Keep a straight face while everyone tries to make you laugh for 1 minute.',
      'Post an awkward selfie to your Instagram story right now.',
      'Swap an item of clothing with the person next to you for the next round.',
      'Pretend to be a dog for the next 2 minutes.',
    ],
    fr: [
      'Imite quelqu'un dans cette pièce.',
      'Envoie "Je pense à toi parfois" à quelqu'un dans tes contacts, sans contexte.',
      'Laisse quelqu'un dans le groupe poster ce qu'il veut sur tes réseaux sociaux.',
      'Parle avec un accent pendant les 3 prochains tours.',
      'Fais 20 pompes maintenant.',
      'Appelle un membre de ta famille et chante-lui Joyeux Anniversaire, même si ce n'est pas son anniversaire.',
      'Laisse le groupe lire tes 5 derniers messages à voix haute.',
      'Mange une cuillère du condiment le plus épicé disponible.',
      'Fais ton plus beau défilé de mode à travers la pièce.',
      'Dis quelque chose de gentil sur chaque personne dans la pièce.',
      'Imite ta célébrité préférée pendant 30 secondes.',
      'Laisse quelqu'un dessiner sur ton visage avec un marqueur.',
      'Parle en chuchotant pendant les 2 prochains tours.',
      'Montre la photo la plus embarrassante de ton téléphone.',
      'Fais une sérénade à la personne à ta gauche.',
      'Fais le ver de terre — ou tente de le faire.',
      'Garde ton sérieux pendant que tout le monde essaie de te faire rire pendant 1 minute.',
      'Poste un selfie gênant sur ton Instagram story maintenant.',
      'Échange un vêtement avec la personne à côté de toi pour le prochain tour.',
      'Fais semblant d'être un chien pendant les 2 prochaines minutes.',
    ],
  },
};

function randomPrompt(choice, lang) {
  const list = PROMPTS[choice][lang] ?? PROMPTS[choice]['en'];
  return list[Math.floor(Math.random() * list.length)];
}

// ---------------------------------------------------------------------------
// Never Have I Ever statements
// ---------------------------------------------------------------------------

const NHIE_STATEMENTS = {
  en: [
    '…gone skinny dipping.',
    '…lied about my age.',
    '…cried during a movie.',
    '…eaten an entire pizza by myself.',
    '…slept through an alarm and been late.',
    '…forgotten someone\'s name right after being introduced.',
    '…accidentally called a teacher "mom" or "dad".',
    '…eaten food that fell on the floor.',
    '…ghosted someone.',
    '…pretended not to see someone in public to avoid them.',
    '…snuck out of the house at night.',
    '…stayed awake for more than 24 hours.',
    '…talked to myself out loud in an empty room.',
    '…laughed so hard I couldn\'t breathe.',
    '…sent an embarrassing message to the wrong person.',
    '…fallen asleep on public transport and missed my stop.',
    '…gone a full day without checking my phone.',
    '…pretended to enjoy a gift I hated.',
    '…walked into a glass door.',
    '…re-gifted a present someone gave me.',
    '…faked being sick to skip something.',
    '…sung at the top of my lungs in the car.',
    '…bought something I\'ve never used.',
    '…waved back at someone who wasn\'t waving at me.',
  ],
  fr: [
    '…fait du nudisme.',
    '…menti sur mon âge.',
    '…pleuré devant un film.',
    '…mangé une pizza entière tout seul·e.',
    '…dormi à travers mon réveil et été en retard.',
    '…oublié le prénom de quelqu\'un juste après avoir été présenté·e.',
    '…appelé accidentellement un·e prof "maman" ou "papa".',
    '…mangé de la nourriture tombée par terre.',
    '…ghosté quelqu\'un.',
    '…fait semblant de ne pas voir quelqu\'un en public pour l\'éviter.',
    '…escapé de chez moi la nuit.',
    '…resté·e éveillé·e plus de 24 heures.',
    '…parlé à voix haute tout·e seul·e dans une pièce.',
    '…ri tellement fort que je n\'arrivais plus à respirer.',
    '…envoyé un message embarrassant à la mauvaise personne.',
    '…dormi dans les transports et raté mon arrêt.',
    '…passé une journée entière sans regarder mon téléphone.',
    '…fait semblant d\'aimer un cadeau qui ne me plaisait pas.',
    '…marché dans une porte en verre.',
    '…re-offert un cadeau qu\'on m\'avait offert.',
    '…simulé une maladie pour éviter quelque chose.',
    '…chanté à pleins poumons dans la voiture.',
    '…acheté quelque chose que je n\'ai jamais utilisé.',
    '…salué quelqu\'un qui ne me saluait pas.',
  ],
};

// ---------------------------------------------------------------------------
// Picolo cards
// ---------------------------------------------------------------------------

// {P1} and {P2} are replaced with random player names before sending
const PICOLO_CARDS = [
  // --- solo ---
  { type: 'solo', en: '{P1} must do their best impression of someone in this room.', fr: '{P1} doit imiter quelqu\'un dans cette pièce.' },
  { type: 'solo', en: '{P1} has to speak in a funny accent until the next card.', fr: '{P1} doit parler avec un accent ridicule jusqu\'à la prochaine carte.' },
  { type: 'solo', en: '{P1} must show the last photo on their camera roll to everyone.', fr: '{P1} doit montrer la dernière photo de son téléphone à tout le monde.' },
  { type: 'solo', en: '{P1} has to say something genuinely nice about every person here.', fr: '{P1} doit dire quelque chose de sincèrement gentil sur chaque personne ici.' },
  { type: 'solo', en: '{P1} must do 10 jumping jacks right now.', fr: '{P1} doit faire 10 sauts en étoile maintenant.' },
  { type: 'solo', en: '{P1} has to text someone "thinking of you 😊" with no context.', fr: '{P1} doit envoyer "je pense à toi 😊" à quelqu\'un sans explication.' },
  { type: 'solo', en: '{P1} must tell their most embarrassing story.', fr: '{P1} doit raconter son histoire la plus embarrassante.' },
  { type: 'solo', en: '{P1} has to let the person on their left post anything as their status.', fr: '{P1} laisse la personne à sa gauche poster n\'importe quoi comme statut.' },
  { type: 'solo', en: '{P1} must sing the chorus of the last song they listened to.', fr: '{P1} doit chanter le refrain de la dernière chanson qu\'il/elle a écoutée.' },
  { type: 'solo', en: '{P1} has to do a 30-second stand-up comedy routine. Right now.', fr: '{P1} doit faire 30 secondes de stand-up. Maintenant.' },
  { type: 'solo', en: '{P1} must reveal their most embarrassing search history item.', fr: '{P1} doit révéler la recherche la plus embarrassante de son historique.' },
  { type: 'solo', en: '{P1} has to call a family member and say "I just wanted to say I love you" then hang up.', fr: '{P1} doit appeler un membre de sa famille, dire "je voulais juste dire que je t\'aime" et raccrocher.' },
  // --- duo ---
  { type: 'duo', en: '{P1} and {P2} stare into each other\'s eyes for 30 seconds without laughing.', fr: '{P1} et {P2} se regardent dans les yeux pendant 30 secondes sans rire.' },
  { type: 'duo', en: '{P1} must compliment {P2} as poetically as possible.', fr: '{P1} doit faire un compliment le plus poétique possible à {P2}.' },
  { type: 'duo', en: '{P1} has to tell {P2} their honest first impression of them.', fr: '{P1} doit dire à {P2} sa vraie première impression.' },
  { type: 'duo', en: '{P1} must describe {P2} using only three words. {P2} can\'t react.', fr: '{P1} doit décrire {P2} en seulement trois mots. {P2} ne peut pas réagir.' },
  { type: 'duo', en: '{P1} has to let {P2} go through their phone for 30 seconds.', fr: '{P1} laisse {P2} fouiller dans son téléphone pendant 30 secondes.' },
  { type: 'duo', en: '{P1} and {P2} swap one item of clothing for the next 3 cards.', fr: '{P1} et {P2} échangent un vêtement pour les 3 prochaines cartes.' },
  { type: 'duo', en: '{P1} must roast {P2} in 30 seconds. {P2} has to take it silently.', fr: '{P1} doit "roast" {P2} en 30 secondes. {P2} doit l\'accepter en silence.' },
  { type: 'duo', en: '{P1} and {P2} have to agree on one embarrassing song they both know and perform the chorus together.', fr: '{P1} et {P2} choisissent une chanson embarrassante qu\'ils connaissent tous les deux et chantent le refrain ensemble.' },
  // --- group ---
  { type: 'group', en: 'Everyone points to the person they\'d most want stranded on a desert island with.', fr: 'Tout le monde désigne la personne avec qui il voudrait le plus être naufragé·e sur une île déserte.' },
  { type: 'group', en: 'Everyone votes for who is most likely to become famous. The winner takes a bow.', fr: 'Tout le monde vote pour qui est le plus susceptible de devenir célèbre. Le gagnant s\'incline.' },
  { type: 'group', en: 'Go around the circle — each person says one word to build a story together.', fr: 'Tour de table — chacun dit un mot pour construire une histoire ensemble.' },
  { type: 'group', en: 'Everyone does their best celebrity impression at the same time. Vote for the worst.', fr: 'Tout le monde imite une célébrité en même temps. Vote pour le pire.' },
  { type: 'group', en: 'On the count of 3, everyone points to the person they find the most charismatic.', fr: 'Au compte de 3, tout le monde désigne la personne la plus charismatique.' },
  { type: 'group', en: 'Everyone votes for the person most likely to end up on a reality TV show.', fr: 'Tout le monde vote pour qui est le plus susceptible de finir dans une émission de téléréalité.' },
  { type: 'group', en: 'Everyone points to who they think is the best dancer. That person must prove it.', fr: 'Tout le monde désigne le meilleur danseur/la meilleure danseuse. Cette personne doit le prouver.' },
  // --- challenge ---
  { type: 'challenge', en: 'Until the next card, no one is allowed to say "I" or "me". Losers must confess something.', fr: 'Jusqu\'à la prochaine carte, personne n\'a le droit de dire "je" ou "moi". Les perdants doivent avouer quelque chose.' },
  { type: 'challenge', en: 'The next person to look at their phone must show everyone what they were doing.', fr: 'La prochaine personne à regarder son téléphone doit montrer ce qu\'elle faisait à tout le monde.' },
  { type: 'challenge', en: 'The last person to put their hand on their head right now must answer a question from the group.', fr: 'La dernière personne à mettre sa main sur sa tête doit répondre à une question du groupe.' },
  { type: 'challenge', en: 'Everyone must whisper for the next 2 cards. Anyone who speaks normally loses.', fr: 'Tout le monde doit chuchoter pendant les 2 prochaines cartes. Celui qui parle normalement perd.' },
  { type: 'challenge', en: 'From now until the next card, everyone must refer to themselves in the third person.', fr: 'Jusqu\'à la prochaine carte, tout le monde doit parler de soi à la troisième personne.' },
  { type: 'challenge', en: 'The first person to speak after this card is read aloud loses and must do a dare chosen by the group.', fr: 'La première personne à parler après la lecture de cette carte perd et doit faire un gage choisi par le groupe.' },
  { type: 'challenge', en: 'Until the next card, everyone must end every sentence with "…and that\'s the tea."', fr: 'Jusqu\'à la prochaine carte, tout le monde doit terminer chaque phrase par "…et c\'est tout."' },
];

function drawPicoloCard(players, lang, usedIndices) {
  const available = PICOLO_CARDS.map((_, i) => i).filter((i) => !usedIndices.has(i));
  const pool = available.length > 0 ? available : PICOLO_CARDS.map((_, i) => i);
  const idx = pool[Math.floor(Math.random() * pool.length)];
  usedIndices.add(idx);
  if (usedIndices.size >= PICOLO_CARDS.length) usedIndices.clear();

  const card = PICOLO_CARDS[idx];
  const template = card[lang] ?? card['en'];

  // Pick two distinct random players for substitution
  const shuffled = [...players].sort(() => Math.random() - 0.5);
  const text = template
    .replace(/\{P1\}/g, shuffled[0]?.name ?? 'Player 1')
    .replace(/\{P2\}/g, shuffled[1]?.name ?? shuffled[0]?.name ?? 'Player 2');

  return { type: card.type, text };
}

// ---------------------------------------------------------------------------
// Palmier (Le Cercle / Circle of Death) — card rules
// ---------------------------------------------------------------------------

const CARD_RULES = {
  A: {
    en: { title: 'Waterfall', text: 'Everyone starts drinking at the same time. No one can stop until the person to their right stops.' },
    fr: { title: 'Cascade', text: 'Tout le monde commence à boire en même temps. Personne ne peut s\'arrêter tant que la personne à sa droite ne s\'est pas arrêtée.' },
  },
  2: {
    en: { title: 'Give 2', text: 'Give 2 sips to whoever you choose.' },
    fr: { title: 'Donne 2', text: 'Donne 2 gorgées à qui tu veux.' },
  },
  3: {
    en: { title: 'Give 3', text: 'Give 3 sips to whoever you choose.' },
    fr: { title: 'Donne 3', text: 'Donne 3 gorgées à qui tu veux.' },
  },
  4: {
    en: { title: 'Four to the Floor', text: 'Everyone points to the ground. The last person to do so drinks.' },
    fr: { title: 'Quatre au sol', text: 'Tout le monde pointe le sol. Le dernier à le faire boit.' },
  },
  5: {
    en: { title: 'Five to the Sky', text: 'Everyone points to the ceiling. The last person to do so drinks.' },
    fr: { title: 'Cinq au ciel', text: 'Tout le monde pointe le plafond. Le dernier à le faire boit.' },
  },
  6: {
    en: { title: 'Suitcase', text: 'Say "In my suitcase I put [item]". The next player repeats and adds one item. Keep going — whoever forgets an item drinks.' },
    fr: { title: 'La valise', text: 'Dis "Dans ma valise j\'ai mis [objet]". Le joueur suivant répète et ajoute un objet. Continuer — celui qui oublie un objet boit.' },
  },
  7: {
    en: { title: 'Question Master', text: 'You are now the Question Master. Anyone who answers one of your questions must drink. This lasts until the next 7 is drawn.' },
    fr: { title: 'Maître des questions', text: 'Tu es désormais le Maître des questions. Quiconque répond à une de tes questions doit boire. Cela dure jusqu\'au prochain 7.' },
    persistent: true,
  },
  8: {
    en: { title: 'Give 8', text: 'Give out 8 sips, split however you like between any players.' },
    fr: { title: 'Donne 8', text: 'Distribue 8 gorgées comme tu veux entre les joueurs.' },
  },
  9: {
    en: { title: 'Never Have I Ever', text: 'Say something you have never done. Anyone who HAS done it drinks.' },
    fr: { title: 'Je n\'ai jamais', text: 'Dis quelque chose que tu n\'as jamais fait. Ceux qui l\'ont fait boivent.' },
  },
  10: {
    en: { title: 'Freeze Master', text: 'You can freeze at any moment. The last person to stop moving drinks. This lasts until the next 10 is drawn.' },
    fr: { title: 'Maître du freeze', text: 'Tu peux te figer à tout moment. Le dernier à s\'arrêter de bouger boit. Cela dure jusqu\'au prochain 10.' },
    persistent: true,
  },
  J: {
    en: { title: 'Category', text: 'Name a category (brands, countries, animals…). Go around the circle — whoever can\'t think of one drinks.' },
    fr: { title: 'Catégorie', text: 'Choisis une catégorie (marques, pays, animaux…). Faites le tour — celui qui ne trouve pas boit.' },
  },
  Q: {
    en: { title: 'Everyone Drinks', text: 'À la tienne ! Everyone drinks.' },
    fr: { title: 'Tout le monde boit', text: 'À la tienne ! Tout le monde boit.' },
  },
  K: {
    en: { title: 'Make a Rule', text: 'Invent a rule that applies for the rest of the game. Everyone must follow it.' },
    fr: { title: 'Invente une règle', text: 'Invente une règle qui s\'applique pour le reste de la partie. Tout le monde doit la respecter.' },
    persistent: true,
  },
  JOKER: {
    en: { title: 'Wild Card', text: 'Your call! Make up any challenge for the group right now.' },
    fr: { title: 'Joker', text: 'À toi de décider ! Invente n\'importe quel défi pour le groupe.' },
  },
};

const SUITS = ['♥', '♦', '♣', '♠'];
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

function buildDeck() {
  const deck = [];
  for (const suit of SUITS) {
    for (const value of VALUES) {
      deck.push({ suit, value, color: suit === '♥' || suit === '♦' ? 'red' : 'black' });
    }
  }
  deck.push({ suit: '★', value: 'JOKER', color: 'purple' });
  deck.push({ suit: '★', value: 'JOKER', color: 'purple' });
  // Fisher-Yates shuffle
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function getCardRule(value, lang) {
  const rule = CARD_RULES[value];
  if (!rule) return { title: value, text: '' };
  const localised = rule[lang] ?? rule['en'];
  return { title: localised.title, text: localised.text, persistent: !!rule.persistent };
}

const FINGERS_START = 5;

function randomStatement(lang, usedIndices) {
  const list = NHIE_STATEMENTS[lang] ?? NHIE_STATEMENTS['en'];
  const available = list.map((_, i) => i).filter((i) => !usedIndices.has(i));
  // If all used, reset
  const pool = available.length > 0 ? available : list.map((_, i) => i);
  const idx = pool[Math.floor(Math.random() * pool.length)];
  usedIndices.add(idx);
  if (usedIndices.size >= list.length) usedIndices.clear();
  return list[idx];
}

// ---------------------------------------------------------------------------
// Room state
// ---------------------------------------------------------------------------

// rooms: { [roomCode]: { hostId, game, players: [{ id, name }], state, tod? } }
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

  // Host adds a player by name (single-phone mode — no separate device needed)
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

  // Host removes a player by id (single-phone mode)
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
    io.to(code).emit('game:started', { game: room.game, players: room.players });

    if (room.game === 'truth-or-dare') {
      room.tod = { turnIndex: 0, phase: 'choosing' };
      io.to(code).emit('tod:turn', {
        currentPlayer: room.players[0],
        turnIndex: 0,
      });
    }

    if (room.game === 'palmier') {
      room.palmier = {
        deck: buildDeck(),
        activeRules: [],   // [{ cardValue, title, text }]
        lang: lang || 'en',
      };
      io.to(code).emit('palmier:state', {
        remaining: room.palmier.deck.length,
        activeRules: [],
        currentCard: null,
      });
    }

    if (room.game === 'picolo') {
      const usedIndices = new Set();
      const card = drawPicoloCard(room.players, lang || 'en', usedIndices);
      room.picolo = { usedIndices, lang: lang || 'en' };
      io.to(code).emit('picolo:card', card);
    }

    if (room.game === 'never-have-i-ever') {
      const usedIndices = new Set();
      const fingers = Object.fromEntries(room.players.map((p) => [p.id, FINGERS_START]));
      const statement = randomStatement(lang || 'en', usedIndices);
      room.nhie = {
        turnIndex: 0,
        phase: 'voting',
        statement,
        votes: {},
        fingers,
        usedIndices,
      };
      io.to(code).emit('nhie:turn', {
        currentPlayer: room.players[0],
        statement,
        fingers,
      });
    }

    callback?.({ ok: true });
  });

  // Draw the top card from the Palmier deck
  socket.on('palmier:draw', ({ lang } = {}, callback) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room?.palmier) return callback?.({ error: 'No game in progress' });
    if (room.palmier.deck.length === 0) return callback?.({ error: 'Deck is empty' });

    const card = room.palmier.deck.pop();
    const useLang = lang || room.palmier.lang;
    const rule = getCardRule(card.value, useLang);

    // 7 and 10 replace each other when drawn again; K rules stack
    if (rule.persistent) {
      if (card.value === 'K') {
        // King rules stack — placeholder title until client sends the rule text
        room.palmier.activeRules.push({ cardValue: card.value, title: rule.title, text: '…' });
      } else {
        // Replace previous rule of same card value
        room.palmier.activeRules = room.palmier.activeRules.filter((r) => r.cardValue !== card.value);
        room.palmier.activeRules.push({ cardValue: card.value, title: rule.title, text: rule.text });
      }
    }

    io.to(code).emit('palmier:card', {
      card,
      rule,
      remaining: room.palmier.deck.length,
      activeRules: room.palmier.activeRules,
    });
    callback?.({ ok: true });
  });

  // Player submits a King rule text
  socket.on('palmier:set-king-rule', ({ text, lang } = {}, callback) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room?.palmier) return callback?.({ error: 'No game in progress' });

    // Update the most recent King rule placeholder
    const idx = [...room.palmier.activeRules].reverse().findIndex((r) => r.cardValue === 'K');
    if (idx !== -1) {
      const realIdx = room.palmier.activeRules.length - 1 - idx;
      room.palmier.activeRules[realIdx].text = text;
    }

    io.to(code).emit('palmier:rules-updated', { activeRules: room.palmier.activeRules });
    callback?.({ ok: true });
  });

  // Draw the next Picolo card
  socket.on('picolo:next', ({ lang } = {}, callback) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room?.picolo) return callback?.({ error: 'No game in progress' });

    const card = drawPicoloCard(room.players, lang || room.picolo.lang, room.picolo.usedIndices);
    io.to(code).emit('picolo:card', card);
    callback?.({ ok: true });
  });

  // Whoever holds the phone picks truth or dare for the current player
  socket.on('tod:choose', ({ choice, lang }, callback) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room?.tod) return callback?.({ error: 'No game in progress' });
    if (room.tod.phase !== 'choosing') return callback?.({ error: 'Already chosen' });

    const currentPlayer = room.players[room.tod.turnIndex];
    const prompt = randomPrompt(choice, lang || 'en');
    room.tod.phase = 'prompt';
    room.tod.choice = choice;
    room.tod.prompt = prompt;

    io.to(code).emit('tod:prompt', { currentPlayer, choice, prompt });
    callback?.({ ok: true });
  });

  // Whoever holds the phone advances to the next player
  socket.on('tod:next', (callback) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room?.tod) return callback?.({ error: 'No game in progress' });

    room.tod.turnIndex = (room.tod.turnIndex + 1) % room.players.length;
    room.tod.phase = 'choosing';
    room.tod.choice = null;
    room.tod.prompt = null;

    io.to(code).emit('tod:turn', {
      currentPlayer: room.players[room.tod.turnIndex],
      turnIndex: room.tod.turnIndex,
    });
    callback?.({ ok: true });
  });

  // Vote on behalf of a player by their id (single phone: anyone can tap for any player)
  socket.on('nhie:vote', ({ playerId, hasDone }, callback) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room?.nhie || room.nhie.phase !== 'voting') return callback?.({ error: 'Not in voting phase' });
    if (!room.players.find((p) => p.id === playerId)) return callback?.({ error: 'Player not found' });
    if (room.nhie.votes[playerId] !== undefined) return callback?.({ error: 'Already voted' });

    room.nhie.votes[playerId] = hasDone;
    if (hasDone && room.nhie.fingers[playerId] > 0) {
      room.nhie.fingers[playerId] -= 1;
    }

    const totalPlayers = room.players.length;
    const totalVotes = Object.keys(room.nhie.votes).length;

    if (totalVotes >= totalPlayers) {
      // All voted — reveal results
      room.nhie.phase = 'results';
      const votes = room.players.map((p) => ({
        player: p,
        hasDone: room.nhie.votes[p.id] ?? false,
      }));
      io.to(code).emit('nhie:results', {
        currentPlayer: room.players[room.nhie.turnIndex],
        votes,
        fingers: room.nhie.fingers,
      });
    }

    callback?.({ ok: true });
  });

  // Whoever holds the phone advances to the next statement
  socket.on('nhie:next', ({ lang } = {}, callback) => {
    const code = socket.data.roomCode;
    const room = rooms[code];
    if (!room?.nhie) return callback?.({ error: 'No game in progress' });
    if (room.nhie.phase !== 'results') return callback?.({ error: 'Not in results phase' });

    room.nhie.turnIndex = (room.nhie.turnIndex + 1) % room.players.length;
    room.nhie.phase = 'voting';
    room.nhie.votes = {};
    room.nhie.statement = randomStatement(lang || 'en', room.nhie.usedIndices);

    io.to(code).emit('nhie:turn', {
      currentPlayer: room.players[room.nhie.turnIndex],
      statement: room.nhie.statement,
      fingers: room.nhie.fingers,
    });
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

    // ToD: if it was this player's turn, reset to next
    if (room.tod && room.tod.turnIndex >= disconnectedIndex) {
      room.tod.turnIndex = Math.max(0, room.tod.turnIndex - 1);
    }
    if (room.tod && room.players.length > 0) {
      room.tod.turnIndex = room.tod.turnIndex % room.players.length;
      room.tod.phase = 'choosing';
      io.to(code).emit('tod:turn', {
        currentPlayer: room.players[room.tod.turnIndex],
        turnIndex: room.tod.turnIndex,
      });
    }

    // NHIE: remove their vote and finger count, adjust turn index
    if (room.nhie) {
      delete room.nhie.votes[socket.id];
      delete room.nhie.fingers[socket.id];
      if (room.nhie.turnIndex >= disconnectedIndex) {
        room.nhie.turnIndex = Math.max(0, room.nhie.turnIndex - 1);
      }
      room.nhie.turnIndex = room.nhie.turnIndex % room.players.length;
      // If everyone remaining has now voted, check for auto-reveal
      const totalVotes = room.players.filter((p) => room.nhie.votes[p.id] !== undefined).length;
      if (room.nhie.phase === 'voting' && totalVotes >= room.players.length) {
        room.nhie.phase = 'results';
        const votes = room.players.map((p) => ({ player: p, hasDone: room.nhie.votes[p.id] ?? false }));
        io.to(code).emit('nhie:results', {
          currentPlayer: room.players[room.nhie.turnIndex],
          votes,
          fingers: room.nhie.fingers,
        });
      }
    }

    io.to(code).emit('room:updated', room);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
