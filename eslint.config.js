import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config({
  extends: [js.configs.recommended, ...tseslint.configs.recommended],
  files: ['**/*.{ts,tsx}'],
  ignores: ['dist', 'node_modules', 'coverage', '*.config.ts'],
  languageOptions: {
    ecmaVersion: 2020,
    globals: globals.browser,
  },
  plugins: {
    'react-hooks': reactHooks,
    'react-refresh': reactRefresh,
  },
  rules: {
    ...reactHooks.configs.recommended.rules,
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
    '@typescript-eslint/no-unused-vars': ['warn'],
    // ── ICU pluralization enforcement ──────────────────────────
    // Flags template literals that concatenate a count variable with a
    // noun that should use ICU MessageFormat plurals via t().
    'no-restricted-syntax': [
      'warn',
      {
        selector: 'TemplateLiteral[expressions.length>0]',
        message:
          'Avoid interpolating counts directly into template strings. ' +
          'Use ICU MessageFormat via t() instead — see docs/ICU_PLURALIZATION_GUIDE.md.',
      },
    ],
  },
});
