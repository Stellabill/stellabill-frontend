import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const SAMPLE_ADDRESS = 'GAAZI4TCR3TY5OJHCTJC2A4QSY6CJWJH5IAJTGKIN2ER7LBNVKOCCWN7';

describe('links config', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('uses default URLs when env vars are unset', async () => {
    vi.stubEnv('VITE_SUPPORT_URL', '');
    vi.stubEnv('VITE_STELLAR_WALLETS_DOCS_URL', '');
    vi.stubEnv('VITE_DOCS_URL', '');
    vi.stubEnv('VITE_GITHUB_REPO_URL', '');
    vi.stubEnv('VITE_DEMO_URL', '');

    const links = await import('./links');

    expect(links.SUPPORT_URL).toBe(
      'https://github.com/Stellabill/stellabill-frontend/issues',
    );
    expect(links.STELLAR_WALLETS_DOCS_URL).toBe('https://docs.stellar.org/wallets');
    expect(links.DOCS_URL).toBe(
      'https://github.com/Stellabill/stellabill-frontend/tree/main/docs',
    );
    expect(links.README_URL).toBe(
      'https://github.com/Stellabill/stellabill-frontend#readme',
    );
    expect(links.GITHUB_REPO_URL).toBe(
      'https://github.com/Stellabill/stellabill-frontend',
    );
    expect(links.DEMO_URL).toBe('https://stellabill-frontend-blush.vercel.app');
  });

  it('overrides defaults when VITE_SUPPORT_URL and VITE_DOCS_URL are set', async () => {
    const customSupport = 'https://support.example.com/tickets';
    const customDocs = 'https://docs.example.com/guide';

    vi.stubEnv('VITE_SUPPORT_URL', customSupport);
    vi.stubEnv('VITE_DOCS_URL', customDocs);

    const links = await import('./links');

    expect(links.SUPPORT_URL).toBe(customSupport);
    expect(links.DOCS_URL).toBe(customDocs);
  });

  it('getExplorerAccountUrl returns a StellarExpert URL containing the address', async () => {
    const { getExplorerAccountUrl } = await import('./links');
    const url = getExplorerAccountUrl(SAMPLE_ADDRESS);

    expect(url).toContain(SAMPLE_ADDRESS);
    expect(url).toBe(
      'https://stellar.expert/explorer/public/account/' + SAMPLE_ADDRESS,
    );
  });
});
