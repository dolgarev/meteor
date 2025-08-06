const execa = require('execa');
const waitOn = require('wait-on');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const rimraf = require('rimraf');

/**
 * Kills any process running on the specified port
 * @param {number} port - The port to kill processes on
 * @returns {Promise<void>}
 */
async function killProcessByPort(port) {
  try {
    // Different commands based on OS
    const command = process.platform === 'win32' 
      ? `FOR /F "tokens=5" %a in ('netstat -ano ^| find "LISTENING" ^| find ":${port}"') do taskkill /F /PID %a`
      : `lsof -i :${port} -t | xargs -r kill -9`;

    console.log(`Killing process on port ${port}...`);
    try {
      // Use { reject: false } to prevent execa from throwing on non-zero exit codes
      const result = await execa.command(command, { shell: true, reject: false });
      if (result.failed) {
        // It's okay if this fails because there might not be a process on that port
        console.log(`No process found on port ${port} or command returned non-zero exit code`);
      } else {
        console.log(`Successfully killed process on port ${port}`);
      }
    } catch (err) {
      // This catch block will only be reached for operational errors, not for command failures
      console.log(`Error executing kill command: ${err.message}`);
    }
    console.log(`Successfully ensured no process is running on port ${port}`);
  } catch (error) {
    // This should never be reached with the inner try/catch, but keeping as a safety net
    console.error(`Error killing process on port ${port}:`, error);
  }
}

// Get the absolute path to the meteor executable
const REPO_ROOT = path.resolve(__dirname, '../..');
console.log('REPO_ROOT:', REPO_ROOT);
const METEOR_EXECUTABLE = path.join(REPO_ROOT, 'meteor');
console.log('METEOR_EXECUTABLE:', METEOR_EXECUTABLE);

/**
 * Helper function to run a Meteor app in a temporary directory
 * Uses fs-extra for file operations
 * @param {string} appName - Name of the app in the apps directory
 * @param {number} port - Port to run the app on
 * @returns {Object} - Object containing the meteor process and temp directory path
 */
async function runMeteorApp(appName, port) {
  // Create a unique temporary directory
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const tempDir = path.join(os.tmpdir(), `${appName}-${randomSuffix}`);

  // Source app directory
  const sourceAppDir = path.join(__dirname, 'apps', appName);
  console.log(`Source app directory: ${sourceAppDir}`);
  console.log(`Temporary directory: ${tempDir}`);

  try {
    // Create the destination directory if it doesn't exist
    if (!fs.existsSync(tempDir)) {
      await fs.mkdir(tempDir, { recursive: true });
    }

    // Use fs-extra's copy method with recursive option
    await fs.copy(sourceAppDir, tempDir, { 
      dereference: true,
      preserveTimestamps: true,
      overwrite: true
    });
    console.log(`Copied app to temporary directory: ${tempDir}`);
  } catch (err) {
    console.error('Error during copy:', err);
  }

  // Run npm install in the temporary directory
  console.log('Running npm install...');
  await execa('npm', ['install'], {
    cwd: tempDir,
    stdio: 'inherit',
    shell: true,
  });

  // Start Meteor CLI in dev mode
  console.log(`Starting Meteor app on port ${port}...`);
  const meteorProcess = execa(METEOR_EXECUTABLE, ['run', '--port', port.toString()], {
    cwd: tempDir,
    stdio: 'inherit',
  });

  // Wait for server to be up
  console.log(`Waiting for app to be available on port ${port}...`);
  await waitOn({ 
    resources: [`http-get://localhost:${port}`], 
    timeout: 60000
  });

  return { meteorProcess, tempDir };
}

describe('rspack build and serve', () => {
  let meteorProcess;
  let tempDir;
  const PORT = 3100;

  beforeAll(async () => {
    // Run the react app using our helper
    const result = await runMeteorApp('react', PORT);
    meteorProcess = result.meteorProcess;
    tempDir = result.tempDir;
  });

  afterAll(async () => {
    // Kill the meteor process
    if (meteorProcess) {
      try {
        await meteorProcess.kill('SIGKILL');
      } catch (err) {
        console.log(`Error killing meteor process: ${err.message}`);
      }
    }

    // Ensure any process on the port is killed
    await killProcessByPort(PORT);

    // Clean up the temporary directory
    if (tempDir) {
      try {
        // First try synchronous rimraf
        rimraf.sync(tempDir, { disableGlob: true, maxRetries: 5, retryDelay: 500 });
        console.log(`Removed temporary directory: ${tempDir}`);
      } catch (err) {
        console.log(`Sync removal failed, trying async removal: ${err}`);
      }
    }
  });

  test('loads and has correct content', async () => {
    // Navigate to the app
    await page.goto(`http://localhost:${PORT}`);

    // Check the title
    const title = await page.title();
    expect(title).toMatch(/Meteor React/);

    // // Check for static content
    const h1Text = await page.$eval('h1', el => el.textContent);
    expect(h1Text).toMatch(/Welcome to Meteor!/);
  });
});
