/**
 * Flat-config ESLint config (eslint 9+). Migrated from `.eslintrc.json` per
 * jwilleke/geohazardwatch#43.
 *
 * The rule set is intentionally identical to the legacy config — this is a
 * mechanical translation, not a re-tightening. Bumping eslint past v8 is a
 * separate concern (the Renovate skip rule in `renovate.json` stays in place
 * until that bump is explicitly performed).
 */

const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    files: ['addons/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'commonjs',
      globals: { ...globals.node, ...globals.es2020 }
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'always'],
      indent: ['error', 2],
      'comma-dangle': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'arrow-spacing': 'error',
      'keyword-spacing': 'error'
    }
  }
];
