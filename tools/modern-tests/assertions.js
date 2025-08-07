/**
 * This file contains assertion helpers for testing Meteor applications.
 */

import fs from 'fs-extra';
import path from 'path';

/**
 * Helper function to assert that a Meteor React app is running correctly
 * @param {number} port - Port where the app is running
 * @returns {Promise<void>}
 */
export async function assertMeteorReactApp(port) {
  // Navigate to the app
  await page.goto(`http://localhost:${port}`);

  // Check the title
  const title = await page.title();
  expect(title).toMatch(/react/);

  // Check for static content
  const h1Text = await page.$eval('h1', el => el.textContent);
  expect(h1Text).toMatch(/Welcome to Meteor!/);
}

/**
 * Helper function to assert that a Meteor app is using Rspack
 * @param {number} port - Port where the app is running
 * @returns {Promise<void>}
 */
export async function assertRspackScriptTag(port, shoudlExist = true) {
  // Navigate to the app
  await page.goto(`http://localhost:${port}`);

  // Get all script tags
  const scriptTags = await page.$$eval('script', scripts => 
    scripts.map(script => script.getAttribute('src'))
  );

  // Check if any script tag has __rspack__ in its path
  const hasRspackScript = scriptTags.some(src => src && src.includes('__rspack__'));
  expect(hasRspackScript).toBe(shoudlExist);
}

/**
 * Helper function to assert that a single file exists and optionally contains specific content
 * @param {string} tempDir - Path to the temporary directory
 * @param {string} filePath - File path relative to tempDir
 * @param {Object} options - Additional options
 * @param {string} options.content - Content to check for
 * @param {boolean} options.exactMatch - Whether the content should be an exact match (default: false)
 * @param {number} options.timeout - Maximum time to wait in milliseconds (default: 5000)
 * @param {number} options.checkInterval - Interval between checks in milliseconds (default: 100)
 * @returns {Promise<void>}
 */
export async function assertFileExist(tempDir, filePath, options = {}) {
  const { content, exactMatch = false, timeout = 5000, checkInterval = 100 } = options;
  const fullPath = path.join(tempDir, filePath);

  const startTime = Date.now();

  // Function to check file existence and content
  const checkFile = async () => {
    // Check if file exists
    const fileExists = await fs.pathExists(fullPath);

    if (!fileExists) {
      // If file doesn't exist and we haven't exceeded the timeout, wait and retry
      if (Date.now() - startTime < timeout) {
        await new Promise(resolve => setTimeout(resolve, checkInterval));
        return checkFile();
      }
      // If we've exceeded the timeout, fail the test
      expect(fileExists).toBe(true);
      return false;
    }

    // If content check is requested
    if (content) {
      // Read the file content
      const fileContent = await fs.readFile(fullPath, 'utf8');

      if (exactMatch) {
        // Check for exact match
        if (fileContent !== content) {
          // If content doesn't match and we haven't exceeded the timeout, wait and retry
          if (Date.now() - startTime < timeout) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            return checkFile();
          }
          // If we've exceeded the timeout, fail the test
          expect(fileContent).toBe(content);
          return false;
        }
      } else {
        // Check if file includes the specified content
        if (!fileContent.includes(content)) {
          // If content doesn't include the specified content and we haven't exceeded the timeout, wait and retry
          if (Date.now() - startTime < timeout) {
            await new Promise(resolve => setTimeout(resolve, checkInterval));
            return checkFile();
          }
          // If we've exceeded the timeout, fail the test
          expect(fileContent).toContain(content);
          return false;
        }
      }
    }

    return true;
  };

  // Start checking
  await checkFile();
}
