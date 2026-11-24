import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, devices } from 'playwright/test';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const hasBuiltDist = fs.existsSync(path.join(dirname, 'dist', 'index.html'));
const PORT = Number(process.env.PLAYWRIGHT_PORT || 4173);
const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || `http://127.0.0.1:${PORT}`;
const serverCommand = hasBuiltDist
  ? `npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`
  : `npx vite build && npx vite preview --host 127.0.0.1 --port ${PORT} --strictPort`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: serverCommand,
    url: BASE_URL,
    reuseExistingServer: !process.env.CI,
    timeout: 180 * 1000,
  },
});
