module.exports = {
  rootDir: __dirname,
  testMatch: [
    "<rootDir>/tools/**/*.test.js",
    "<rootDir>/scripts/**/*.test.js",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "<rootDir>/tools/modern-tests/",
    "<rootDir>/tools/tests/",
    "<rootDir>/packages/",
    "<rootDir>/.github/",
  ],
  testTimeout: 10_000,
  verbose: true,
};
