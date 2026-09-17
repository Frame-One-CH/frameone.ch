import js from '@eslint/js';
import prettier from 'eslint-config-prettier';

export default [
  {
    ignores: ['dist/**', '.parcel-cache/**', 'static/**'],
  },
  js.configs.recommended,
  {
    // Parcel already fails the build on undefined identifiers, and the rule
    // would otherwise need a full map of browser and Node globals to stay quiet.
    rules: {
      'no-undef': 'off',
    },
  },
  {
    files: ['src/js/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      'no-unused-vars': [
        'error',
        {
          args: 'after-used',
          argsIgnorePattern: '^_',
          caughtErrors: 'none',
        },
      ],
    },
  },
  {
    files: ['**/*.config.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
    },
  },
  prettier,
];
