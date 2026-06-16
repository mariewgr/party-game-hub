import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Picolo from '../games/Picolo.jsx';

vi.mock('../../socket', () => ({
  default: { on: vi.fn(), off: vi.fn(), emit: vi.fn() },
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (k) => k,
    i18n: { language: 'en', changeLanguage: vi.fn() },
  }),
}));

describe('Picolo component', () => {
  it('renders the card text from initialState', () => {
    render(
      <Picolo
        initialState={{ type: 'solo', en: 'Test card EN', fr: 'Test card FR' }}
      />
    );
    expect(screen.getByText('Test card EN')).toBeInTheDocument();
  });

  it('renders the next button', () => {
    render(
      <Picolo
        initialState={{ type: 'solo', en: 'Test card EN', fr: 'Test card FR' }}
      />
    );
    expect(screen.getByRole('button')).toBeInTheDocument();
  });
});
