var files = require('../fs/files');
var httpHelpers = require('../utils/http-helpers.js');
var Console = require('../console/console.js').Console;
const { exec } = require('child_process');

const EXAMPLES_REPO = 'https://github.com/meteor/examples';
const EXAMPLES_BRANCH = 'meteor-3.x';
const EXAMPLES_JSON_URL =
  `https://raw.githubusercontent.com/meteor/examples/${EXAMPLES_BRANCH}/examples.json`;

function validateExamplesData(data) {
  if (!Array.isArray(data)) {
    throw new Error('Invalid examples.json format: expected a JSON array.');
  }
  return data.filter(entry => {
    if (!entry.slug || typeof entry.slug !== 'string') {
      Console.warn(`Skipping example entry with missing slug`);
      return false;
    }
    if (!entry.repositoryUrl || typeof entry.repositoryUrl !== 'string') {
      Console.warn(`Skipping example '${entry.slug}' with missing repositoryUrl`);
      return false;
    }
    return true;
  });
}

module.exports = {
  validateExamplesData,
  EXAMPLES_REPO,
  EXAMPLES_BRANCH,
  EXAMPLES_JSON_URL
};
