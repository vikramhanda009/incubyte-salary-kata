module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  // Match both .ts and .js test files under tests/
  testMatch: ['**/tests/**/?(*.)+(spec|test).[tj]s'],
  transform: {
    '^.+\\.ts$': 'ts-jest'
  },
  clearMocks: true,
  verbose: true,
  // Prevents open handle warnings — jest won't force exit if teardown is clean
  forceExit: false,
  detectOpenHandles: true,
  roots: ['<rootDir>/src', '<rootDir>/tests']
};
