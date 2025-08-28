// Utility functions for sanitizing sensitive data in logs

/**
 * Sanitize UID for logging - shows only first 3 and last 3 characters
 * @param {string} uid - User ID to sanitize
 * @returns {string} - Sanitized UID
 */
export const sanitizeUid = (uid) => {
  if (!uid || typeof uid !== 'string') return 'N/A';
  if (uid.length <= 6) return '***';
  return `${uid.substring(0, 3)}***${uid.substring(uid.length - 3)}`;
};

/**
 * Sanitize conversation count for logging
 * @param {number} count - Number of conversations
 * @returns {string} - Sanitized count
 */
export const sanitizeConversationCount = (count) => {
  if (typeof count !== 'number') return 'N/A';
  if (count === 0) return '0';
  return `${count > 5 ? '5+' : count}`;
};

/**
 * Sanitize email for logging - shows only domain with masked username
 * @param {string} email - Email to sanitize
 * @returns {string} - Sanitized email
 */
export const sanitizeEmail = (email) => {
  if (!email || typeof email !== 'string') return 'N/A';
  const parts = email.split('@');
  if (parts.length !== 2) return '***@***';
  // Always show *** for username part for complete privacy
  return `***@${parts[1]}`;
};

/**
 * Sanitize display name for logging - shows only first character
 * @param {string} displayName - Display name to sanitize
 * @returns {string} - Sanitized display name
 */
export const sanitizeDisplayName = (displayName) => {
  if (!displayName || typeof displayName !== 'string') return 'N/A';
  if (displayName.length <= 1) return '*';
  // Show only first character + * for the rest
  return `${displayName.charAt(0)}${'*'.repeat(displayName.length - 1)}`;
};

/**
 * Sanitize user data for logging
 * @param {Object} userData - User data object
 * @returns {Object} - Sanitized user data
 */
export const sanitizeUserData = (userData) => {
  if (!userData) return {};
  
  return {
    uid: userData.uid ? sanitizeUid(userData.uid) : 'N/A',
    email: userData.email ? sanitizeEmail(userData.email) : 'N/A',
    displayName: userData.displayName ? sanitizeDisplayName(userData.displayName) : 'N/A'
  };
};

/**
 * Sanitize for general logging - removes sensitive data
 * @param {any} data - Data to sanitize
 * @returns {any} - Sanitized data
 */
export const sanitizeForLog = (data) => {
  if (typeof data === 'string') {
    // Check if it looks like a UID (long alphanumeric string)
    if (data.length > 20 && /^[a-zA-Z0-9]+$/.test(data)) {
      return sanitizeUid(data);
    }
    // Check if it looks like an email
    if (data.includes('@')) {
      return sanitizeEmail(data);
    }
    return data;
  }
  
  if (typeof data === 'number') {
    return sanitizeConversationCount(data);
  }
  
  if (typeof data === 'object' && data !== null) {
    return sanitizeUserData(data);
  }
  
  return data;
};

// CommonJS exports for compatibility
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    sanitizeUid,
    sanitizeEmail,
    sanitizeDisplayName,
    sanitizeUserData,
    sanitizeConversationCount,
    sanitizeForLog
  };
}