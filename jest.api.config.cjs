module.exports = {
  ...require('./jest.config.js'),
  testMatch: ['<rootDir>/integration/**/*.live.ts'],
  testTimeout: 15000,
};
