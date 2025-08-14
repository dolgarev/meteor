import {
  waitForMeteorOutput,
} from "./helpers";
import { testMeteorBundler, testMeteorRspackBundler } from './test-helpers';

describe('CoffeeScript App Bundling /', () => {
  describe('Meteor+Rspack Bundler /', testMeteorRspackBundler({
    appName: 'coffeescript',
    port: 3132,
    filePaths: { 
      client: 'client/main.coffee', 
      server: 'server/main.coffee',
      test: 'tests/main.coffee'
    },
    customUpdates: {
      devClient: (message) => `console.log "${message}" if Meteor.isDevelopment`,
      devServer: (message) => `console.log "${message}" if Meteor.isDevelopment`,
      prodClient: (message) => `console.log "${message}" if Meteor.isProduction`,
      prodServer: (message) => `console.log "${message}" if Meteor.isProduction`,
      test: (message) => `console.log "${message}"`
    },
    customAssertions: {
      afterRun: async ({ result }) => {
        await waitForCoffeescriptEnvs(result.outputLines);
      },
      afterRunRebuildClient: async ({ allConsoleLogs }) => {
        // Check for HMR output as enabled by default
        await waitForMeteorOutput(allConsoleLogs, /.*HMR.*Updated modules:.*/);
      },
      afterRunProduction: async ({ result }) => {
        await waitForCoffeescriptEnvs(result.outputLines);
      },
      afterRunProductionRebuildClient: async ({ allConsoleLogs }) => {
        // Check for HMR to not be enabled in production-like mode
        await waitForMeteorOutput(allConsoleLogs, /.*HMR.*Updated modules:*/, { negate: true });
      },
      afterTest: async ({ result }) => {
        await waitForCoffeescriptEnvs(result.outputLines);
      },
      afterTestOnce: async ({ result }) => {
        await waitForCoffeescriptEnvs(result.outputLines);
      },
      afterBuild: async ({ result }) => {
        await waitForCoffeescriptEnvs(result.outputLines);
      },
    }
  }));
});

/**
 * Helper function to wait for CoffeeScript environment output from both Rspack Client and Server
 * @param {string[]} outputLines - Array that will be populated with output lines
 * @param {Object} options - Options for waiting
 * @param {number} options.timeout - Maximum time to wait in milliseconds
 * @param {number} options.checkInterval - Interval between checks in milliseconds
 * @returns {Promise<void>} - A promise that resolves when coffeescript envs are enabled
 */
export async function waitForCoffeescriptEnvs(outputLines, options = {}) {
  await waitForMeteorOutput(
    outputLines,
    /.*isCoffeescriptEnabled:.*true.*/,
    options
  );
}
