import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  testEnvironmentOptions: { globalsCleanup: 'off' },
  testRegex: ['tests_unit/.*.test.ts$', 'tests_node/.*.test.ts$'],
  testTimeout: 120_000,
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'esnext',
          allowImportingTsExtensions: false,
        },
      },
    ],
  },
  verbose: true,
};

export default config;
