/**
 * Capitalizes the first letter of the given string.
 *
 * @param {string} str – The input string.
 * @returns {string} – The string with its first character uppercased.
 */
export function capitalizeFirstLetter(str) {
  if (typeof str !== 'string' || str.length === 0) {
    return '';
  }
  return str.charAt(0).toUpperCase() + str.slice(1);
}
