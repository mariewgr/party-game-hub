import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import MostLikelyTo from '../games/MostLikelyTo.jsx';

vi.mock('../../socket', () => ({
  default: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k) => k,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

const players = [
  { id: '1', name: 'Alice' },
  { id: '2', name: 'Bob' },
];

const initialState = {
  statement: {
    en: 'forget their birthday',
    fr: 'oublier son anniversaire',
  },
};

describe('MostLikelyTo component', () => {
  it('renders the statement text', () => {
    render(<MostLikelyTo players={players} initialState={initialState} />);
    expect(screen.getByText('forget their birthday')).toBeInTheDocument();
  });

  it('renders all player names', () => {
    render(<MostLikelyTo players={players} initialState={initialState} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });
});
