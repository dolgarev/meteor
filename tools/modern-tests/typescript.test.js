import {
  waitForMeteorOutput
} from "./helpers";
import { testMeteorBundler, testMeteorRspackBundler } from './test-helpers';

describe('TypeScript App Bundling /', () => {
  describe('Meteor Bundler /', testMeteorBundler({
    appName: 'typescript',
    port: 3201
  }));

  describe('Meteor+Rspack Bundler /', testMeteorRspackBundler({
    appName: 'typescript',
    port: 3202,
    filePaths: { 
      client: 'client/main.tsx', 
      server: 'server/main.ts',
      test: 'tests/main.ts'
    },
    customAssertions: {
      afterRun: async ({ result }) => {
        await waitForMeteorOutput(
          result.outputLines,
          /.*\[Rspack Client].*No TypeScript errors found\./
        );
        await waitForMeteorOutput(
          result.outputLines,
          /.*\[Rspack Server].*No TypeScript errors found\./
        );
      },
    }
  }));
});
