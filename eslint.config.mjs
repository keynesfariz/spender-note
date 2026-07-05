import tailwindCanonicalClasses from 'eslint-plugin-tailwind-canonical-classes';
import nextVitals from 'eslint-config-next/core-web-vitals';
import { defineConfig, globalIgnores } from 'eslint/config';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  ...tailwindCanonicalClasses.configs['flat/recommended'],
  {
    rules: {
      '@typescript-eslint/no-explicit-any': 'warn',
      'tailwind-canonical-classes/tailwind-canonical-classes': [
        'warn',
        {
          cssPath: './src/app/globals.css',
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
]);

export default eslintConfig;
