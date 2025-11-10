import {
  waitForMeteorOutput,
} from "./helpers";
import { testMeteorRspackBundler } from './test-helpers';

describe('Monorepo App Bundling /', () => {
  describe('Meteor+Rspack Bundler /', testMeteorRspackBundler({
    appName: 'monorepo',
    port: 3133,
    isMonorepo: true,
    filePaths: { 
      client: 'app/client/main.jsx', 
      server: 'app/server/main.js',
      test: 'app/tests/main.test.js'
    },
    checkBundleFilePaths: [
      'programs/web.browser/app/1x1.png',
      'programs/web.browser/app/images/1x1.png',
      'programs/web.browser/app/docs/text.md',
      'programs/web.browser.legacy/app/1x1.png',
      'programs/web.browser.legacy/app/images/1x1.png',
      'programs/web.browser.legacy/app/docs/text.md',
    ],
    configFile: 'rspack.config.cjs',
    customAssertions: {
      afterRunRebuildClient: async ({ allConsoleLogs }) => {
        // Check for HMR output as enabled by default
        await waitForMeteorOutput(allConsoleLogs, /.*HMR.*Updated modules:.*/);
      },
      afterRunProductionRebuildClient: async ({ allConsoleLogs }) => {
        // Check for HMR to not be enabled in production-like mode
        await waitForMeteorOutput(allConsoleLogs, /.*HMR.*Updated modules:*/, { negate: true });
      },
    }
  }));
});
