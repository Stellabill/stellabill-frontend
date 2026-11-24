import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import TechBadges from './TechBadges';

describe('TechBadges', () => {
  it('renders a labelled group with accessible name "Technologies used"', () => {
    render(<TechBadges />);

    const region = screen.getByRole('region', { name: 'Technologies used' });
    expect(region).toBeInTheDocument();
  });

  it('renders the Stellar badge link pointing to https://stellar.org', () => {
    render(<TechBadges />);

    const stellarLink = screen.getByRole('link', {
      name: 'Powered by Stellar — visit stellar.org',
    });
    expect(stellarLink).toBeInTheDocument();
    expect(stellarLink).toHaveAttribute('href', 'https://stellar.org');
  });

  it('renders the Soroban badge link pointing to https://soroban.stellar.org', () => {
    render(<TechBadges />);

    const sorobanLink = screen.getByRole('link', {
      name: 'Built with Soroban — visit soroban.stellar.org',
    });
    expect(sorobanLink).toBeInTheDocument();
    expect(sorobanLink).toHaveAttribute('href', 'https://soroban.stellar.org');
  });

  it('opens both badge links in a new tab with rel containing noopener', () => {
    render(<TechBadges />);

    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(2);

    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank');
      const relTokens = link.getAttribute('rel')?.split(/\s+/) ?? [];
      expect(relTokens).toContain('noopener');
    }
  });

  it('allows keyboard tabbing through both badge links', async () => {
    const user = userEvent.setup();
    render(<TechBadges />);

    const stellarLink = screen.getByRole('link', {
      name: 'Powered by Stellar — visit stellar.org',
    });
    const sorobanLink = screen.getByRole('link', {
      name: 'Built with Soroban — visit soroban.stellar.org',
    });

    await user.tab();
    expect(stellarLink).toHaveFocus();

    await user.tab();
    expect(sorobanLink).toHaveFocus();
  });
});
