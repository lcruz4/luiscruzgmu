import { defineConfig } from 'eslint/config';
import tseslint from 'typescript-eslint';

const ARROW_ONLY = 'Use an arrow function.';

export default defineConfig(
  { ignores: ['.next/**', 'public/**', 'next-env.d.ts'] },
  {
    files: ['**/*.{ts,tsx,js,jsx,mjs}'],
    languageOptions: { parser: tseslint.parser },
    plugins: { '@typescript-eslint': tseslint.plugin },
    rules: {
      // Unused imports, variables and args; prefix with _ to keep one on purpose
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      // Arrow functions only; class/object methods and generators are allowed.
      'no-restricted-syntax': [
        'error',
        {
          selector: 'FunctionDeclaration:not([generator=true])',
          message: ARROW_ONLY,
        },
        {
          selector:
            'FunctionExpression:not([generator=true]):not(MethodDefinition > FunctionExpression):not(Property[method=true] > FunctionExpression):not(Property[kind="get"] > FunctionExpression):not(Property[kind="set"] > FunctionExpression)',
          message: ARROW_ONLY,
        },
      ],
    },
  },
);
