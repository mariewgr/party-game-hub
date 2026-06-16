import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import socket from '../socket';

const SUIT_COLOR = { '♥': '#e53e3e', '♦': '#e53e3e', '♣': '#1a202c', '♠': '#1a202c', '★': '#7c3aed' };

const ALL_RULES = [
  { value: 'A',     en: { title: 'Waterfall',           text: 'Everyone starts drinking at the same time. No one can stop until the person to their right stops.' },
                    fr: { title: 'Cascade',              text: 'Tout le monde commence à boire en même temps. Personne ne peut s\'arrêter tant que la personne à sa droite ne s\'est pas arrêtée.' } },
  { value: '2',     en: { title: 'Give 2',               text: 'Give 2 sips to whoever you choose.' },
                    fr: { title: 'Donne 2',              text: 'Donne 2 gorgées à qui tu veux.' } },
  { value: '3',     en: { title: 'Give 3',               text: 'Give 3 sips to whoever you choose.' },
                    fr: { title: 'Donne 3',              text: 'Donne 3 gorgées à qui tu veux.' } },
  { value: '4',     en: { title: 'Four to the Floor',    text: 'Everyone points to the ground. The last person to do so drinks.' },
                    fr: { title: 'Quatre au sol',        text: 'Tout le monde pointe le sol. Le dernier à le faire boit.' } },
  { value: '5',     en: { title: 'Five to the Sky',      text: 'Everyone points to the ceiling. The last person to do so drinks.' },
                    fr: { title: 'Cinq au ciel',         text: 'Tout le monde pointe le plafond. Le dernier à le faire boit.' } },
  { value: '6',     en: { title: 'Suitcase',             text: 'Say "In my suitcase I put [item]". Go around — whoever forgets an item drinks.' },
                    fr: { title: 'La valise',            text: 'Dis "Dans ma valise j\'ai mis [objet]". Faites le tour — celui qui oublie un objet boit.' } },
  { value: '7',     en: { title: 'Question Master',      text: 'Anyone who answers your questions must drink. Lasts until the next 7.' },
                    fr: { title: 'Maître des questions', text: 'Quiconque répond à tes questions doit boire. Dure jusqu\'au prochain 7.' }, persistent: true },
  { value: '8',     en: { title: 'Give 8',               text: 'Give out 8 sips, split however you like.' },
                    fr: { title: 'Donne 8',              text: 'Distribue 8 gorgées comme tu veux.' } },
  { value: '9',     en: { title: 'Never Have I Ever',    text: 'Say something you\'ve never done. Anyone who HAS done it drinks.' },
                    fr: { title: 'Je n\'ai jamais',      text: 'Dis quelque chose que tu n\'as jamais fait. Ceux qui l\'ont fait boivent.' } },
  { value: '10',    en: { title: 'Freeze Master',        text: 'You can freeze at any moment. Last to stop moving drinks. Lasts until the next 10.' },
                    fr: { title: 'Maître du freeze',     text: 'Tu peux te figer à tout moment. Le dernier à s\'arrêter boit. Dure jusqu\'au prochain 10.' }, persistent: true },
  { value: 'J',     en: { title: 'Category',             text: 'Name a category. Go around — whoever can\'t think of one drinks.' },
                    fr: { title: 'Catégorie',            text: 'Choisis une catégorie. Faites le tour — celui qui ne trouve pas boit.' } },
  { value: 'Q',     en: { title: 'Everyone Drinks',      text: 'À la tienne! Everyone drinks.' },
                    fr: { title: 'Tout le monde boit',   text: 'À la tienne ! Tout le monde boit.' } },
  { value: 'K',     en: { title: 'Make a Rule',          text: 'Invent a rule that applies for the rest of the game.' },
                    fr: { title: 'Invente une règle',    text: 'Invente une règle qui s\'applique pour le reste de la partie.' }, persistent: true },
  { value: 'JOKER', en: { title: 'Wild Card',            text: 'Your call! Make up any challenge for the group.' },
                    fr: { title: 'Joker',                text: 'À toi de décider ! Invente n\'importe quel défi pour le groupe.' } },
];

export default function Palmier({ initialState }) {
  const { t, i18n } = useTranslation();
  const [state, setState] = useState(initialState ?? null);
  const [drawnCard, setDrawnCard] = useState(null);
  const [kingInput, setKingInput] = useState('');
  const [kingPending, setKingPending] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const kingRef = useRef(null);

  useEffect(() => {
    socket.on('palmier:state', (s) => setState(s));

    socket.on('palmier:card', ({ card, rule, remaining, activeRules }) => {
      setDrawnCard({ card, rule });
      setState((prev) => ({ ...prev, remaining, activeRules }));
      setAnimKey((k) => k + 1);
      if (card.value === 'K') {
        setKingPending(true);
        setKingInput('');
        setTimeout(() => kingRef.current?.focus(), 100);
      } else {
        setKingPending(false);
      }
    });

    socket.on('palmier:rules-updated', ({ activeRules }) => {
      setState((prev) => ({ ...prev, activeRules }));
      setKingPending(false);
    });

    return () => {
      socket.off('palmier:state');
      socket.off('palmier:card');
      socket.off('palmier:rules-updated');
    };
  }, []);

  function draw() {
    socket.emit('palmier:draw');
  }

  function submitKingRule() {
    if (!kingInput.trim()) return;
    socket.emit('palmier:set-king-rule', { text: kingInput.trim() });
  }

  const isEmpty = state?.remaining === 0;
  const suitColor = drawnCard ? SUIT_COLOR[drawnCard.card.suit] : '#7c3aed';
  const currentValue = drawnCard?.card?.value ?? null;

  return (
    <div style={{ display: 'flex', gap: 0, alignItems: 'flex-start', maxWidth: 760, margin: '0 auto' }}>

      {/* ── Left sidebar: all rules ── */}
      <div style={{
        width: 148,
        flexShrink: 0,
        background: '#fff',
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid #ede9fe',
        marginRight: 16,
        position: 'sticky',
        top: 12,
      }}>
        <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: '#7c3aed', padding: '10px 12px 6px', borderBottom: '1px solid #ede9fe' }}>
          {t('palmier.allRules', { defaultValue: 'All rules' })}
        </p>
        {ALL_RULES.map((rule) => {
          const loc = rule[i18n.language] ?? rule.en;
          const isActive = rule.value === currentValue;
          const isPersistent = state?.activeRules?.some((r) =>
            (r[i18n.language] ?? r.en)?.title === loc.title
          );
          return (
            <div
              key={rule.value}
              style={{
                padding: '7px 12px',
                borderBottom: '1px solid #f3f0ff',
                background: isActive ? '#7c3aed' : isPersistent ? '#fef9c3' : 'transparent',
                transition: 'background 0.2s',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{
                  fontWeight: 800,
                  fontSize: 13,
                  color: isActive ? '#fff' : '#4c1d95',
                  minWidth: 20,
                }}>
                  {rule.value}
                </span>
                <span style={{
                  fontSize: 11,
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#e9d5ff' : isPersistent ? '#854d0e' : '#6b7280',
                  lineHeight: 1.3,
                }}>
                  {loc.title}
                  {rule.persistent && !isActive && (
                    <span style={{ fontSize: 9, marginLeft: 3, opacity: 0.7 }}>●</span>
                  )}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Right: current card + controls ── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Active rules banner */}
        {state?.activeRules?.length > 0 && (
          <div style={{ marginBottom: 14, padding: '10px 14px', background: '#fefce8', border: '1px solid #fde047', borderRadius: 10 }}>
            <p style={{ fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, color: '#854d0e', marginBottom: 6 }}>
              {t('palmier.activeRules')}
            </p>
            {state.activeRules.map((r, i) => {
              const loc = r[i18n.language] ?? r.en;
              return (
                <div key={i} style={{ marginBottom: i < state.activeRules.length - 1 ? 4 : 0, fontSize: 13 }}>
                  <span style={{ fontWeight: 600 }}>{loc.title}: </span>
                  <span style={{ color: '#78350f' }}>{loc.text}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* King rule input */}
        {kingPending && (
          <div style={{ marginBottom: 14, padding: '12px 14px', background: '#fdf4ff', border: '1px solid #d946ef', borderRadius: 10 }}>
            <p style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>
              👑 {(drawnCard?.rule?.[i18n.language] ?? drawnCard?.rule?.en)?.title}
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                ref={kingRef}
                value={kingInput}
                onChange={(e) => setKingInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitKingRule()}
                placeholder={t('palmier.kingRulePlaceholder')}
                style={{ flex: 1, padding: '8px 10px', fontSize: 14, borderRadius: 6, border: '1px solid #d946ef', outline: 'none' }}
              />
              <button
                onClick={submitKingRule}
                style={{ padding: '8px 12px', background: '#d946ef', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, fontSize: 13 }}
              >
                {t('palmier.kingRuleSubmit')}
              </button>
            </div>
          </div>
        )}

        {/* Current card */}
        {drawnCard ? (
          <div
            key={animKey}
            style={{
              background: '#fff',
              border: `3px solid ${suitColor}`,
              borderRadius: 16,
              padding: '24px 20px',
              marginBottom: 14,
              animation: 'cardFlip 0.3s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
              <span style={{ fontSize: 44, fontWeight: 900, color: suitColor, lineHeight: 1 }}>
                {drawnCard.card.value}
              </span>
              <span style={{ fontSize: 28, color: suitColor, lineHeight: 1 }}>
                {drawnCard.card.suit}
              </span>
            </div>
            <p style={{ fontWeight: 700, fontSize: 17, marginBottom: 4 }}>
              {(drawnCard.rule[i18n.language] ?? drawnCard.rule.en).title}
            </p>
            <p style={{ fontSize: 15, color: '#444', lineHeight: 1.5, margin: 0 }}>
              {(drawnCard.rule[i18n.language] ?? drawnCard.rule.en).text}
            </p>
          </div>
        ) : (
          <div style={{
            background: '#fff',
            border: '3px dashed #ddd6fe',
            borderRadius: 16,
            padding: '40px 20px',
            marginBottom: 14,
            textAlign: 'center',
            color: '#a78bfa',
            fontSize: 14,
          }}>
            {t('palmier.draw')} ↓
          </div>
        )}

        {/* Draw button */}
        <button
          onClick={draw}
          disabled={isEmpty || !state}
          style={{
            width: '100%',
            padding: '14px',
            fontSize: 17,
            fontWeight: 700,
            background: isEmpty ? '#e5e7eb' : 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)',
            color: isEmpty ? '#9ca3af' : '#fff',
            border: 'none',
            borderRadius: 12,
            cursor: isEmpty ? 'default' : 'pointer',
            marginBottom: 8,
            boxShadow: isEmpty ? 'none' : '0 4px 12px rgba(124,58,237,0.3)',
          }}
        >
          {isEmpty ? t('palmier.deckEmpty') : t('palmier.draw')}
        </button>

        {state && (
          <p style={{ textAlign: 'center', color: '#a78bfa', fontSize: 12, fontWeight: 500 }}>
            {t('palmier.remaining', { count: state.remaining })}
          </p>
        )}
      </div>

      <style>{`
        @keyframes cardFlip {
          from { opacity: 0; transform: rotateY(40deg) scale(0.95); }
          to   { opacity: 1; transform: rotateY(0deg) scale(1); }
        }
      `}</style>
    </div>
  );
}
