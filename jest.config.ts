import type { Config } from 'jest';

const config: Config = {
  projects: [
    {
      displayName: 'frontend',
      testEnvironment: 'jsdom',
      testMatch: ['<rootDir>/app/page.test.tsx'],
      transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
          tsconfig: { jsx: 'react-jsx' }
        }]
      },
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
      collectCoverageFrom: [
        'app/page.tsx',
      ],
      coverageThreshold: {
        global: {
          lines: 80,
          functions: 80,
          branches: 80,
          statements: 80,
        }
      }
    },
  ]
};

export default config;
