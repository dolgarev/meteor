import {
  killProcessByPort,
  cleanupTempDir,
  killMeteorProcess,
  createMeteorApp,
  runMeteorApp,
} from "./helpers";
import { testMeteorBundler, testMeteorRspackBundler } from './test-helpers';
import fs from 'fs-extra';
import path from 'path';
import { assertMeteorReactApp } from "./assertions";

describe('React App Bundling /', () => {
  describe('Meteor Creator /', () => {
    const PORT = 3100;

    beforeAll(async () => {
      // Ensure any process on the port is killed
      await killProcessByPort(PORT);
    });

    test('"meteor create" / should create a new Meteor react app', async () => {
      // Create a new Meteor app with --react example
      const result = await createMeteorApp('react', 'react');
      const newAppTempDir = result.tempDir;
      const newAppMeteorProcess = result.meteorProcess;

      // Wait for the process to complete
      await newAppMeteorProcess;

      // Check if the app directory exists
      const appDirExists = await fs.pathExists(newAppTempDir);
      expect(appDirExists).toBe(true);

      // Check if package.json exists and contains react
      const packageJsonPath = path.join(newAppTempDir, 'package.json');
      const packageJsonExists = await fs.pathExists(packageJsonPath);
      expect(packageJsonExists).toBe(true);

      const packageJson = await fs.readJson(packageJsonPath);
      expect(packageJson.dependencies).toHaveProperty('react');
      expect(packageJson.dependencies).toHaveProperty('react-dom');

      // Run the newly created app
      let runAppProcess = (await runMeteorApp(newAppTempDir, PORT))?.meteorProcess;

      // Assert that the Meteor React app is running correctly
      await assertMeteorReactApp(PORT);

      // Kill the meteor processes
      await killMeteorProcess(runAppProcess);
      if (newAppMeteorProcess) {
        await killMeteorProcess(newAppMeteorProcess);
      }

      // Ensure any process on the port is killed
      await killProcessByPort(PORT);

      // Clean up the temporary directory
      await cleanupTempDir(newAppTempDir);
    });
  });

  describe('Meteor Bundler /', testMeteorBundler({
    appName: 'react',
    port: 3101
  }));

  describe('Meteor+Rspack Bundler /', testMeteorRspackBundler({
    appName: 'react',
    port: 3102,
    filePaths: { 
      client: 'client/main.jsx', 
      server: 'server/main.js',
      test: 'tests/main.js'
    },
  }));
});
