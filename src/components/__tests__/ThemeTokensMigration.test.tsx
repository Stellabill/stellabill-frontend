import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import BillingSettings from '../settings/BillingSettings';
import OrganizationSettings from '../settings/OrganizationSettings';
import RecentPayments from '../RecentPayments';
import UsageThisPeriod from '../UsageThisPeriod';
import PricingHeader from '../PricingHeader';
import { contrastRatio, passesAA } from '../../utils/colorContrast';

const TARGET_COMPONENT_FILES = [
  'src/components/settings/BillingSettings.tsx',
  'src/components/settings/OrganizationSettings.tsx',
  'src/components/RecentPayments.tsx',
  'src/components/UsageThisPeriod.tsx',
  'src/components/PricingHeader.tsx',
] as const;

const RAW_HEX_PATTERN = /#[0-9a-fA-F]{3,8}\b/g;

function extractThemeBlock(css: string, selectorMarker: string): Record<string, string> {
  const startIndex = css.indexOf(selectorMarker);
  if (startIndex === -1) {
    throw new Error('Could not find selector marker: ' + selectorMarker);
  }
  const openBrace = css.indexOf('{', startIndex);
  let depth = 0;
  let closeBrace = -1;

  for (let i = openBrace; i < css.length; i++) {
    if (css[i] === '{') depth++;
    if (css[i] === '}') {
      depth--;
      if (depth === 0) {
        closeBrace = i;
        break;
      }
    }
  }

  const block = css.slice(openBrace + 1, closeBrace);
  const tokens: Record<string, string> = {};
  const varRegex = /(--[a-z0-9-]+)\s*:\s*([^;]+);/gi;
  let match: RegExpExecArray | null;
  while ((match = varRegex.exec(block)) !== null) {
    tokens[match[1].trim()] = match[2].trim();
  }
  return tokens;
}

describe('Theme-aware design tokens guard', () => {
  it.each(TARGET_COMPONENT_FILES)(
    '%s contains no raw hex colour literals',
    (relativeFilePath) => {
      const fullPath = path.resolve(process.cwd(), relativeFilePath);
      const source = fs.readFileSync(fullPath, 'utf8');
      const matches = source.match(RAW_HEX_PATTERN) ?? [];
      expect(matches, 'Unexpected raw hex values in ' + relativeFilePath + ': ' + matches.join(', ')).toEqual([]);
    },
  );

  it('all target components reference CSS custom property design tokens', () => {
    for (const relativeFilePath of TARGET_COMPONENT_FILES) {
      const fullPath = path.resolve(process.cwd(), relativeFilePath);
      const source = fs.readFileSync(fullPath, 'utf8');
      expect(source).toContain('var(--color-');
    }
  });
});

describe('WCAG 2.1 AA theme contrast verification', () => {
  const tokensCssPath = path.resolve(process.cwd(), 'src/styles/tokens.css');
  const tokensCss = fs.readFileSync(tokensCssPath, 'utf8');
  const lightTokens = extractThemeBlock(tokensCss, '[data-theme="light"] {');
  const darkTokens = extractThemeBlock(tokensCss, '[data-theme="dark"] {');

  const FOREGROUND_SURFACE_PAIRS = [
    // Primary, secondary, and muted text across all theme surfaces
    ['--color-text-primary', '--color-surface-canvas'],
    ['--color-text-primary', '--color-surface-page'],
    ['--color-text-primary', '--color-surface-card'],
    ['--color-text-primary', '--color-surface-elevated'],
    ['--color-text-primary', '--color-surface-subtle'],
    ['--color-text-secondary', '--color-surface-canvas'],
    ['--color-text-secondary', '--color-surface-page'],
    ['--color-text-secondary', '--color-surface-card'],
    ['--color-text-secondary', '--color-surface-elevated'],
    ['--color-text-secondary', '--color-surface-subtle'],
    ['--color-text-muted', '--color-surface-canvas'],
    ['--color-text-muted', '--color-surface-page'],
    ['--color-text-muted', '--color-surface-card'],
    ['--color-text-muted', '--color-surface-elevated'],
    ['--color-text-muted', '--color-surface-subtle'],
    // Brand and feedback tokens on card, canvas, and elevated surfaces
    ['--color-brand-primary', '--color-surface-canvas'],
    ['--color-brand-primary', '--color-surface-card'],
    ['--color-brand-primary', '--color-surface-elevated'],
    ['--color-brand-text', '--color-surface-canvas'],
    ['--color-brand-text', '--color-surface-card'],
    ['--color-brand-text', '--color-surface-elevated'],
    ['--color-success', '--color-surface-canvas'],
    ['--color-success', '--color-surface-page'],
    ['--color-success', '--color-surface-card'],
    ['--color-success', '--color-surface-elevated'],
    ['--color-success', '--color-surface-subtle'],
    ['--color-warning', '--color-surface-canvas'],
    ['--color-warning', '--color-surface-page'],
    ['--color-warning', '--color-surface-card'],
    ['--color-warning', '--color-surface-elevated'],
    ['--color-danger', '--color-surface-canvas'],
    ['--color-danger', '--color-surface-page'],
    ['--color-danger', '--color-surface-card'],
    ['--color-danger', '--color-surface-elevated'],
    ['--color-danger', '--color-surface-subtle'],
    ['--color-info', '--color-surface-canvas'],
    ['--color-info', '--color-surface-page'],
    ['--color-info', '--color-surface-card'],
    ['--color-info', '--color-surface-elevated'],
    ['--color-info', '--color-surface-subtle'],
  ] as const;

  describe('Light theme token contrast', () => {
    it.each(FOREGROUND_SURFACE_PAIRS)(
      '%s on %s passes WCAG AA (>= 4.5:1)',
      (fgToken, surfaceToken) => {
        const fg = lightTokens[fgToken];
        const bg = lightTokens[surfaceToken];
        expect(fg, 'Missing light token ' + fgToken).toBeDefined();
        expect(bg, 'Missing light token ' + surfaceToken).toBeDefined();
        const ratio = contrastRatio(fg, bg);
        expect(ratio).not.toBeNull();
        expect(passesAA(fg, bg), fgToken + ' (' + fg + ') on ' + surfaceToken + ' (' + bg + ') ratio=' + ratio?.toFixed(2)).toBe(true);
      },
    );

    it('--color-brand-on on --color-brand-primary and --color-brand-accent passes WCAG AA', () => {
      expect(passesAA(lightTokens['--color-brand-on'], lightTokens['--color-brand-primary'])).toBe(true);
      expect(passesAA(lightTokens['--color-brand-on'], lightTokens['--color-brand-accent'])).toBe(true);
    });

    it('feedback tokens pass WCAG AA on their respective feedback backgrounds', () => {
      expect(passesAA(lightTokens['--color-success'], lightTokens['--color-success-bg'])).toBe(true);
      expect(passesAA(lightTokens['--color-warning'], lightTokens['--color-warning-bg'])).toBe(true);
      expect(passesAA(lightTokens['--color-danger'], lightTokens['--color-danger-bg'])).toBe(true);
      expect(passesAA(lightTokens['--color-info'], lightTokens['--color-info-bg'])).toBe(true);
    });
  });

  describe('Dark theme token contrast', () => {
    it.each(FOREGROUND_SURFACE_PAIRS)(
      '%s on %s passes WCAG AA (>= 4.5:1)',
      (fgToken, surfaceToken) => {
        const fg = darkTokens[fgToken];
        const bg = darkTokens[surfaceToken];
        expect(fg, 'Missing dark token ' + fgToken).toBeDefined();
        expect(bg, 'Missing dark token ' + surfaceToken).toBeDefined();
        const ratio = contrastRatio(fg, bg);
        expect(ratio).not.toBeNull();
        expect(passesAA(fg, bg), fgToken + ' (' + fg + ') on ' + surfaceToken + ' (' + bg + ') ratio=' + ratio?.toFixed(2)).toBe(true);
      },
    );

    it('--color-brand-on on --color-brand-primary and --color-brand-accent passes WCAG AA', () => {
      expect(passesAA(darkTokens['--color-brand-on'], darkTokens['--color-brand-primary'])).toBe(true);
      expect(passesAA(darkTokens['--color-brand-on'], darkTokens['--color-brand-accent'])).toBe(true);
    });
  });
});

describe('Migrated components render with design tokens in both themes', () => {
  it.each(['light', 'dark'] as const)('renders all five components under data-theme="%s"', (theme) => {
    document.documentElement.dataset.theme = theme;

    const { unmount } = render(
      <MemoryRouter>
        <PricingHeader />
        <UsageThisPeriod
          billingPeriod="Nov 1 – Nov 30, 2026"
          usage="1,240 API calls"
          estimatedCharge="12.40 USDC"
        />
        <RecentPayments subscriptionId="sub_123" />
        <OrganizationSettings />
        <BillingSettings />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: /simple, transparent pricing/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /usage this period/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /recent payments/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /organization settings/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /billing settings/i })).toBeInTheDocument();

    unmount();
  });
});
