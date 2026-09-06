/**
 * Flat-config ESLint config (eslint 9+). Migrated from `.eslintrc.json` per
 * jwilleke/geohazardwatch#43.
 */

const js = require('@eslint/js');
const globals = require('globals');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

const sharedRules = {
  'no-console': 'off',
  quotes: ['error', 'single', { avoidEscape: true }],
  semi: ['error', 'always'],
  indent: ['error', 2],
  'comma-dangle': ['error', 'never'],
  'object-curly-spacing': ['error', 'always'],
  'arrow-spacing': 'error',
  'keyword-spacing': 'error'
};

module.exports = [
  js.configs.recommended,
  {
    files: ['addons/**/*.ts'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: { ...globals.node, ...globals.es2022 }
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: {
      ...sharedRules,
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }]
    }
  }
];
