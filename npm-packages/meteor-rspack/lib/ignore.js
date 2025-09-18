var fs = require('fs');
var path = require('path');

// Cleans an entry from wildcard patterns (*/**)
function cleanWildcardEntry(entry) {
  // If it's an extension pattern like *.ext, skip it
  if (entry.match(/\*\.[^\/]+$/)) {
    return null;
  }

  // Handle patterns like my-folder/**/* by extracting the folder part
  if (entry.includes('/**/')) {
    const folderContext = entry.split('/**/')[0].replace(/\/+$/, '');
    if (folderContext) {
      return folderContext;
    }
  }

  // Otherwise, extract the folder context by removing the wildcard part
  if (entry.includes('*')) {
    const folderContext = entry.split('*')[0].replace(/\/+$/, '');
    if (folderContext) {
      return folderContext;
    }
    return null;
  }

  return entry;
}

/**
 * Reads the .meteorignore file from the given project directory and returns
 * the parsed entries.
 *
 * @param {string} projectDir - The project directory path
 * @param {Object} options - Options for processing ignore entries
 * @param {boolean} options.foldersOnly - If true, returns only folder entries
 * @returns {Array<string>} - Array of ignore entries
 */
const getMeteorIgnoreEntries = function (projectDir, options) {
  options = options || {};
  const foldersOnly = !!options.foldersOnly;

  const meteorIgnorePath = path.join(projectDir, '.meteorignore');

  // Check if .meteorignore file exists
  let entries = [];
  try {
    const fileContent = fs.readFileSync(meteorIgnorePath, 'utf8');

    // Process each line in the file
    entries = fileContent.split(/\r?\n/).filter(line => {
      // Skip empty lines and comments
      return line.trim() !== '' && !line.trim().startsWith('#');
    });

    // Clean all entries from wildcard patterns (*/** parts)
    entries = entries.map(entry => {
      return cleanWildcardEntry(entry);
    }).filter(entry => entry !== null);

    if (foldersOnly) {
      // Filter to include only entries that are likely to be folders
      entries = entries.filter(entry => {
        // Entries ending with / are definitely folders
        if (entry.endsWith('/')) {
          return true;
        }

        // Try to determine if it's a folder by checking if it exists
        // and is a directory
        try {
          const fullPath = path.join(projectDir, entry);
          return fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory();
        } catch (e) {
          // If we can't determine, assume it's not a folder
          return false;
        }
      });
    }

    return entries;
  } catch (e) {
    // If the file doesn't exist or can't be read, return an empty array
    return [];
  }
};

/**
 * Creates a regex pattern to ignore specified folders.
 * The pattern will match paths where the specified folders appear as complete path segments.
 * Special regex characters in folder names are automatically escaped.
 * @param {string[]} folders - Array of folder names to ignore
 * @returns {RegExp} - Regex pattern to ignore the specified folders
 */
function createIgnoreFoldersRegex(folders) {
  if (!Array.isArray(folders) || folders.length === 0) {
    throw new Error('folders must be a non-empty array');
  }

  // Escape special regex characters in folder names
  const escapedFolders = folders.map(folder => 
    folder.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  );

  // Join folder names with | for the regex pattern
  const foldersPattern = escapedFolders.join('|');

  // Create a regex that matches paths where the specified folders appear as complete path segments
  // Format: /(^|\/)(folder1|folder2|folder3)(\/|$)/
  return new RegExp(`(^|\\/)(${foldersPattern})(\\/|$)`);
}

module.exports = {
  createIgnoreFoldersRegex,
  getMeteorIgnoreEntries,
};
