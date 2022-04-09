module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  setupFiles: ['dotenv/config'],
  root: '../',
  "testMatch": ["**/*.test.ts"]
};