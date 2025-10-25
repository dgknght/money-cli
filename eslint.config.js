import js from '@eslint/js';
import vitest from 'eslint-plugin-vitest';

export default [
  js.configs.recommended,
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        console: 'readonly',
        process: 'readonly',
        URL: 'readonly',
        Intl: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': 'off',
      'no-undef': 'error'
    }
  },
  {
    files: ['test/**/*.js'],
    plugins: { vitest },
    languageOptions: {
      globals: {
        ...vitest.environments.env.globals
      }
    },
    rules: {
      ...vitest.configs.recommended.rules
    }
  },
  {
    ignores: ['node_modules/**', 'coverage/**']
  }
];
