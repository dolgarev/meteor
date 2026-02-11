Package.describe({
  summary: "Helpers for managing modern tools in Meteor",
  version: '1.0.0',
  devOnly: true,
});

Package.onUse(function (api) {
  api.use('ecmascript', ['client', 'server']);

  api.mainModule('tools-core.js', 'server');
});

Package.onTest(function (api) {
  api.use(['ecmascript', 'tinytest']);
  api.use('tools-core');

  // Add test files for each lib/ module
  // This structure allows easy addition of tests for other lib/ categories
  api.addFiles([
    'tests/meteor_tests.js',
    // Add more test files here as needed:
    // 'tests/process_tests.js',
    // 'tests/npm_tests.js',
    // 'tests/git_tests.js',
    // 'tests/global-state_tests.js',
    // 'tests/ignore_tests.js',
    // 'tests/log_tests.js',
    // 'tests/string_tests.js',
  ], 'server');
});
