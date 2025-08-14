import {
  waitForMeteorOutput,
} from "./helpers";
import { testMeteorBundler, testMeteorRspackBundler } from './test-helpers';

describe('Babel App Bundling /', () => {
  describe('Meteor Bundler /', testMeteorBundler({
    appName: 'babel',
    port: 3121
  }));

  describe('Meteor+Rspack Bundler /', testMeteorRspackBundler({
    appName: 'babel',
    port: 3122,
    filePaths: { 
      client: 'client/main.jsx', 
      server: 'server/main.js',
      test: 'tests/main.js'
    },
    customAssertions: {
      afterRun: async ({ result }) => {
      },
      afterRunRebuildClient: async ({ allConsoleLogs }) => {
        // Check for HMR output as enabled by default
        await waitForMeteorOutput(allConsoleLogs, /.*HMR.*Updated modules:*/);
      },
      afterRunProduction: async ({ result }) => {
      },
      afterRunProductionRebuildClient: async ({ allConsoleLogs }) => {
        // Check for HMR to not be enabled in production-like mode
        await waitForMeteorOutput(allConsoleLogs, /.*HMR.*Updated modules:*/, { negate: true });
      },
      afterTest: async ({ result }) => {
      },
      afterTestOnce: async ({ result }) => {
      },
      afterBuild: async ({ result }) => {
      },
    }
  }));
});
