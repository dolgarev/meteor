const fs = require('fs');
const path = require('path');
const { createIgnoreFoldersRegex, getMeteorIgnoreEntries } = require("./ignore.js");

/**
 * Generates eager test files dynamically
 * @param {Object} options - Options for generating the test file
 * @param {boolean} options.isAppTest - Whether this is an app test
 * @param {string} options.projectDir - The project directory
 * @returns {string} The path to the generated file
 */
const generateEagerTestFile = ({ isAppTest, projectDir }) => {
  const distDir = path.resolve(projectDir, ".meteor/local/test");
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }

  const ignoredFolders = getMeteorIgnoreEntries(projectDir, {
    foldersOnly: true,
  });
  const excludeFoldersRegex = createIgnoreFoldersRegex([
    "node_modules",
    ".meteor",
    "_build",
    ...ignoredFolders,
  ]);

  const filename = isAppTest ? "eager-app-tests.mjs" : "eager-tests.mjs";
  const filePath = path.resolve(distDir, filename);
  const regExp = isAppTest
    ? "/\\.app-(?:test|spec)s?\\.[^.]+$/"
    : "/\\.(?:test|spec)s?\\.[^.]+$/";

  const content = `{
  const ctx = import.meta.webpackContext('/', {
    recursive: true,
    regExp: ${regExp},
    exclude: ${excludeFoldersRegex.toString()},
    mode: 'eager',
  });
  ctx.keys().forEach(ctx);
}`;

  fs.writeFileSync(filePath, content);
  return filePath;
};

module.exports = {
  generateEagerTestFile,
};
