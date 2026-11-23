import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Landing from './Landing';
import { openExternal } from '../utils/openExternal';
import { SUPPORT_URL } from '../config/links';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../utils/openExternal', () => ({
  openExternal: vi.fn(),
}));

// The navbar owns wallet state; the landing page test only exercises the page.
vi.mock('../components/LandingNavbar', () => ({
  default: () => <nav aria-label="Landing navigation" />,
}));

const openExternalMock = vi.mocked(openExternal);

function renderLanding() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <Landing />
    </MemoryRouter>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Landing page', () => {
  // ── Copy sections ────────────────────────────────────────────────────────

  it('renders the three step headings', () => {
    renderLanding();

    expect(
      screen.getByRole('heading', { name: '1. Create a plan' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '2. Subscribe and deposit' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: '3. Automatic billing' })
    ).toBeInTheDocument();
  });

  // ── CTA navigation ───────────────────────────────────────────────────────

  it('navigates to the dashboard from the get-started button', async () => {
    const user = userEvent.setup();
    renderLanding();

    await user.click(screen.getByRole('button', { name: /^get started$/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to onboarding from the free-trial button', async () => {
    const user = userEvent.setup();
    renderLanding();

    await user.click(screen.getByRole('button', { name: /^start free trial$/i }));

    expect(mockNavigate).toHaveBeenCalledWith('/onboarding');
  });

  it('opens the support URL from the contact-sales button', async () => {
    const user = userEvent.setup();
    renderLanding();

    await user.click(screen.getByRole('button', { name: /^contact sales$/i }));

    expect(openExternalMock).toHaveBeenCalledWith(SUPPORT_URL);
  });

  // ── Landmarks ────────────────────────────────────────────────────────────

  it('renders the hero landmark inside the router', () => {
    renderLanding();

    const hero = screen.getByRole('region', {
      name: /recurring usdc billing for the stellar ecosystem/i,
    });
    expect(hero).toHaveTextContent(/infrastructure-grade subscription billing/i);
  });

  it('renders the FAQ section', () => {
    renderLanding();

    const faqHeading = screen.getByRole('heading', {
      name: /frequently asked questions/i,
    });
    expect(faqHeading.closest('section')).toHaveAttribute('id', 'faq');
  });

  it('renders the footer landmark', () => {
    renderLanding();

    expect(screen.getByRole('contentinfo')).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: /stay updated/i })
    ).toBeInTheDocument();
  });
});
