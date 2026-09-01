import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  testRegex: ['unit-tests/.*.test.ts$'],
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'esnext',
        },
      },
    ],
  },
  verbose: true,
};

export default config;
