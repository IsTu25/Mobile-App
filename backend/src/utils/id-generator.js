const crypto = require('crypto');

/**
 * Generate unique ID with prefix
 * @param {string} prefix - ID prefix (e.g., 'USR', 'SOS', 'INC', 'PS', 'RTE')
 * @returns {string} - Unique ID
 */
function generateId(prefix) {
  const timestamp = Date.now().toString(36);
  const randomStr = crypto.randomBytes(8).toString('hex');
  return `${prefix}_${timestamp}${randomStr}`;
}

module.exports = { generateId };
