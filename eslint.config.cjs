/** Minimal ESLint flat config to allow `npm run lint` to execute in CI/dev
 * This intentionally keeps rules minimal to avoid altering project style.
 */
module.exports = {
  ignores: ['node_modules/**', 'dist/**', 'build/**'],
  languageOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: {},
  rules: {},
};
