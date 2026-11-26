import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const dirname = typeof __dirname !== 'undefined' ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
let storybookProjects: any[] = [];
try {
  const { storybookTest } = await import(/* @vite-ignore */ '@storybook/addon-vitest/vitest-plugin');
  const playwrightPkg = '@vitest/browser-playwright';
  const { playwright } = await import(/* @vite-ignore */ playwrightPkg);
  const { storybookTest } = await import(/* @vite-ignore */ '@storybook/addon-vitest/vitest-plugin');
  storybookProjects = [{
    extends: true,
    plugins: [
      storybookTest({
        configDir: path.join(dirname, '.storybook')
      })],
    test: {
      name: 'storybook',
      browser: {
        enabled: true,
        headless: true,
        provider: playwright(),
        instances: [{
          browser: 'chromium'
        }]
      }
    }
  }];
} catch {
  // storybook or playwright not fully installed — skip storybook test project
  // storybook addon or @vitest/browser-playwright not installed — skip storybook test project
}

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'react-icons/fa6': resolve(__dirname, './node_modules/react-icons/fa6/index.js')
    }
  },
  optimizeDeps: {
    include: ['react-icons/fa6']
  },
  test: {
    exclude: ['**/node_modules/**', '**/dist/**', 'e2e/**'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/components/**',
        'src/pages/**',
        'src/utils/**',
        'src/hooks/**',
        'src/api/**',
        'src/wallet/**',
        'src/config/**',
        'src/i18n/**',
      ],
      exclude: [
        // Test files are not product code. The new directories use .ts tests,
        // so both extensions are listed.
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        // Storybook stories are documentation/visual fixtures, not runtime code.
        '**/*.stories.tsx',
        // src/types only holds type declarations (no runtime code) and
        // src/data holds static fixture tables; neither has logic to cover.
        'src/types/**',
        'src/data/**',
        '**/*.md',
        '**/setup.ts',
        'src/vite-env.d.ts',
      ],
      thresholds: {
        lines: 65,
        functions: 67,
        branches: 85,
        statements: 65
      }
      },
    },
    projects: [{
      extends: true,
      test: {
        name: 'unit',
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./src/test/setup.ts'],
        include: ['src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
        exclude: ['**/*.api.md', 'e2e/**']
      }
    }, ...storybookProjects]
  }
});