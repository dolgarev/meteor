// Helper functions for Rspack integration
const files = require('../fs/files');
const path = require('path');
const { getMeteorConfig } = require("./meteor-config");

const config = getMeteorConfig();

// Derive the METEOR_LOCAL_DIR suffix the same way packages/rspack/lib/constants.js does,
// so reset cleans the correct directories when running multiple instances.
const meteorLocalDirName = process.env.METEOR_LOCAL_DIR
  ? path.basename(process.env.METEOR_LOCAL_DIR.replace(/\\/g, '/'))
  : '';
const localDirSuffix = meteorLocalDirName ? `-${meteorLocalDirName}` : '';

// Get the build context from environment variable or use default "_build"
const rspackBuildContext = config?.buildContext || process.env.RSPACK_BUILD_CONTEXT || `_build${localDirSuffix}`;

// Get the assets context from environment variable or use default "build-assets"
const rspackAssetsContext = config?.assetsContext || process.env.RSPACK_ASSETS_CONTEXT || `build-assets${localDirSuffix}`;

// Get the bundles context from environment variable or use default "build-chunks"
const rspackChunksContext = config?.chunksContext || process.env.RSPACK_CHUNKS_CONTEXT || `build-chunks${localDirSuffix}`;

// Cache the regex pattern for performance
const rspackFilePattern = new RegExp(`^${rspackBuildContext}\\/.*\\/[^\\/]*-rspack\\.js$`);

// Export the variables for use in other files
exports.rspackBuildContext = rspackBuildContext;
exports.rspackAssetsContext = rspackAssetsContext;
exports.rspackChunksContext = rspackChunksContext;
exports.rspackFilePattern = rspackFilePattern;

// Function to check if a file is a Rspack output file
exports.isRspackOutputFile = function(filePath) {
  return rspackFilePattern.test(filePath);
};

// Function to get the rspack resources contexts
exports.getRspackResourcesContexts = function() {
  return [
    rspackAssetsContext,
    rspackChunksContext
  ];
};

// Function to get the rspack app contexts for cleanup.
// Always includes the default paths (_build, build-assets, build-chunks) to
// prevent regressions, plus suffixed paths when METEOR_LOCAL_DIR is set.
exports.getRspackAppContexts = function(appDir) {
  const contexts = [
    files.pathJoin(appDir, "node_modules", ".cache", "rspack"),
  ];

  // Always include defaults
  const defaults = ['_build', 'build-assets', 'build-chunks'];
  for (const name of defaults) {
    contexts.push(files.pathJoin(appDir, name));
    contexts.push(files.pathJoin(appDir, `public/${name}`));
    contexts.push(files.pathJoin(appDir, `private/${name}`));
  }

  // When METEOR_LOCAL_DIR is set, also include suffixed paths
  if (localDirSuffix) {
    const suffixed = defaults.map(name => `${name}${localDirSuffix}`);
    for (const name of suffixed) {
      contexts.push(files.pathJoin(appDir, name));
      contexts.push(files.pathJoin(appDir, `public/${name}`));
      contexts.push(files.pathJoin(appDir, `private/${name}`));
    }
  }

  return contexts;
};
