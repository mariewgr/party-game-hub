import { describe, it, expect } from 'vitest';
import {
  buildDeck,
  getCardRule,
  randomStatement,
  randomMLTStatement,
  randomPrompt,
  VALUES,
  SUITS,
} from './game-utils.js';

// ---------------------------------------------------------------------------
// buildDeck
// ---------------------------------------------------------------------------
describe('buildDeck()', () => {
  it('returns 54 cards total (52 regular + 2 jokers)', () => {
    const deck = buildDeck();
    expect(deck).toHaveLength(54);
  });

  it('contains exactly 2 jokers', () => {
    const deck = buildDeck();
    const jokers = deck.filter((c) => c.value === 'JOKER');
    expect(jokers).toHaveLength(2);
  });

  it('contains every value for every suit (52 regular cards)', () => {
    const deck = buildDeck();
    const regular = deck.filter((c) => c.value !== 'JOKER');
    expect(regular).toHaveLength(52);

    for (const suit of SUITS) {
      for (const value of VALUES) {
        const found = regular.some((c) => c.suit === suit && c.value === value);
        expect(found, `${suit}${value} should be in deck`).toBe(true);
      }
    }
  });

  it('assigns correct colors to red and black suits', () => {
    const deck = buildDeck();
    for (const card of deck) {
      if (card.suit === '♥' || card.suit === '♦') {
        expect(card.color).toBe('red');
      } else if (card.suit === '♣' || card.suit === '♠') {
        expect(card.color).toBe('black');
      }
    }
  });

  it('produces a shuffled deck (not always in insertion order)', () => {
    // Run multiple times; the chance all 3 consecutive decks are identical is negligible
    const decks = [buildDeck(), buildDeck(), buildDeck()];
    const orders = decks.map((d) => d.map((c) => `${c.suit}${c.value}`).join(','));
    const allSame = orders.every((o) => o === orders[0]);
    expect(allSame).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getCardRule
// ---------------------------------------------------------------------------
describe('getCardRule()', () => {
  it('returns en.title and fr.title for Ace', () => {
    const rule = getCardRule('A');
    expect(rule.en.title).toBeTruthy();
    expect(rule.fr.title).toBeTruthy();
  });

  it('returns en.title and fr.title for King', () => {
    const rule = getCardRule('K');
    expect(rule.en.title).toBe('Make a Rule');
    expect(rule.fr.title).toBe('Invente une règle');
  });

  it('returns en.title and fr.title for JOKER', () => {
    const rule = getCardRule('JOKER');
    expect(rule.en.title).toBe('Wild Card');
    expect(rule.fr.title).toBe('Joker');
  });

  it('marks K, 7, and 10 as persistent', () => {
    expect(getCardRule('K').persistent).toBe(true);
    expect(getCardRule('7').persistent).toBe(true);
    expect(getCardRule('10').persistent).toBe(true);
  });

  it('marks A as non-persistent', () => {
    expect(getCardRule('A').persistent).toBe(false);
  });

  it('returns a fallback for an unknown value', () => {
    const rule = getCardRule('UNKNOWN');
    expect(rule.en.title).toBe('UNKNOWN');
    expect(rule.fr.title).toBe('UNKNOWN');
    expect(rule.persistent).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// randomStatement (NHIE)
// ---------------------------------------------------------------------------
describe('randomStatement()', () => {
  it('returns an object with en and fr string properties', () => {
    const usedIndices = new Set();
    const result = randomStatement(usedIndices);
    expect(typeof result.en).toBe('string');
    expect(typeof result.fr).toBe('string');
    expect(result.en.length).toBeGreaterThan(0);
    expect(result.fr.length).toBeGreaterThan(0);
  });

  it('tracks used indices so the same statement is not repeated immediately', () => {
    const usedIndices = new Set();
    const seen = new Set();
    // Draw 10 statements — none should repeat (there are 24 total)
    for (let i = 0; i < 10; i++) {
      const { en } = randomStatement(usedIndices);
      expect(seen.has(en)).toBe(false);
      seen.add(en);
    }
  });

  it('resets used indices after all statements have been drawn', () => {
    const usedIndices = new Set();
    // Draw all 24 statements
    for (let i = 0; i < 24; i++) {
      randomStatement(usedIndices);
    }
    // After drawing all, the set should have been cleared
    expect(usedIndices.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// randomMLTStatement
// ---------------------------------------------------------------------------
describe('randomMLTStatement()', () => {
  it('returns an object with en and fr string properties', () => {
    const usedIndices = new Set();
    const result = randomMLTStatement(usedIndices);
    expect(typeof result.en).toBe('string');
    expect(typeof result.fr).toBe('string');
    expect(result.en.length).toBeGreaterThan(0);
    expect(result.fr.length).toBeGreaterThan(0);
  });

  it('tracks used indices so statements are not repeated prematurely', () => {
    const usedIndices = new Set();
    const seen = new Set();
    for (let i = 0; i < 10; i++) {
      const { en } = randomMLTStatement(usedIndices);
      expect(seen.has(en)).toBe(false);
      seen.add(en);
    }
  });

  it('resets used indices after all 30 statements have been drawn', () => {
    const usedIndices = new Set();
    for (let i = 0; i < 30; i++) {
      randomMLTStatement(usedIndices);
    }
    expect(usedIndices.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// randomPrompt
// ---------------------------------------------------------------------------
describe('randomPrompt()', () => {
  it('returns { en, fr } for truth', () => {
    const result = randomPrompt('truth');
    expect(typeof result.en).toBe('string');
    expect(typeof result.fr).toBe('string');
    expect(result.en.length).toBeGreaterThan(0);
    expect(result.fr.length).toBeGreaterThan(0);
  });

  it('returns { en, fr } for dare', () => {
    const result = randomPrompt('dare');
    expect(typeof result.en).toBe('string');
    expect(typeof result.fr).toBe('string');
    expect(result.en.length).toBeGreaterThan(0);
    expect(result.fr.length).toBeGreaterThan(0);
  });

  it('returns different prompts across multiple calls (not always the same)', () => {
    const results = new Set();
    for (let i = 0; i < 15; i++) {
      results.add(randomPrompt('truth').en);
    }
    expect(results.size).toBeGreaterThan(1);
  });
});
