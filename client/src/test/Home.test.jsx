import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Home from '../pages/Home.jsx';

// jsdom in vitest may not wire localStorage on globalThis — ensure it's available
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; },
  };
})();
Object.defineProperty(globalThis, 'localStorage', { value: localStorageMock, writable: true });

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
}));

vi.mock('../../socket', () => ({
  default: { on: vi.fn(), off: vi.fn(), emit: vi.fn(), connected: false, connect: vi.fn() },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k) => k,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

describe('Home page', () => {
  beforeEach(() => {
    localStorageMock.clear();
  });

  it('renders the name input', () => {
    render(<Home />);
    expect(screen.getByPlaceholderText('yourName')).toBeInTheDocument();
  });

  it('renders all 5 game options', () => {
    render(<Home />);
    const gameIds = ['truth-or-dare', 'never-have-i-ever', 'picolo', 'palmier', 'most-likely-to'];
    for (const id of gameIds) {
      // Each game renders a radio input with value = game id
      expect(screen.getByDisplayValue(id)).toBeInTheDocument();
    }
  });

  it('renders the Create Room button', () => {
    render(<Home />);
    expect(screen.getByText('createRoom.button')).toBeInTheDocument();
  });

  it('shows an error when clicking Create Room with no name entered', () => {
    render(<Home />);
    // Clear localStorage so name is empty
    localStorage.clear();
    const button = screen.getByText('createRoom.button');
    fireEvent.click(button);
    // The t() mock returns the key, so the error key is 'errors.enterName'
    expect(screen.getByText('errors.enterName')).toBeInTheDocument();
  });
});
