import config from './jest.shared'

export default {
  ...config,
  moduleNameMapper: {
    '^@src/(.*)$': '<rootDir>/src/$1',
  },
  testMatch: ['<rootDir>/src/__test__/e2e/*.spec.ts'],
}
