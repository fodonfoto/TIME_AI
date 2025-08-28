/**
 * Authentication Helper Utilities
 * Handles COOP policy and popup blocking issues
 */

export const detectAuthMethod = () => {
  // Check if we're in a secure context and popups are likely to work
  const isSecureContext = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
  const userAgent = navigator.userAgent.toLowerCase();
  
  // Some browsers/environments that commonly block popups
  const isLikelyBlocked = 
    userAgent.includes('chrome') && userAgent.includes('headless') ||
    userAgent.includes('phantomjs') ||
    userAgent.includes('selenium') ||
    window.navigator.webdriver;
  
  return {
    shouldUsePopup: isSecureContext && !isLikelyBlocked,
    isSecureContext,
    userAgent: userAgent.substring(0, 50) // Truncate for logging
  };
};

export const handleAuthError = (error) => {
  const errorCode = error.code;
  const errorMessage = error.message;
  
  console.error('Auth error:', { code: errorCode, message: errorMessage });
  
  switch (errorCode) {
    case 'auth/popup-blocked':
      return {
        type: 'popup-blocked',
        message: 'Popup was blocked. Please allow popups for this site or try again.',
        shouldRetry: true,
        useRedirect: true
      };
      
    case 'auth/popup-closed-by-user':
      return {
        type: 'user-cancelled',
        message: 'Sign-in was cancelled. Please try again.',
        shouldRetry: true,
        useRedirect: false
      };
      
    case 'auth/cancelled-popup-request':
      return {
        type: 'cancelled',
        message: 'Another sign-in attempt is in progress.',
        shouldRetry: false,
        useRedirect: false
      };
      
    case 'auth/network-request-failed':
      return {
        type: 'network',
        message: 'Network error. Please check your connection and try again.',
        shouldRetry: true,
        useRedirect: false
      };
      
    default:
      return {
        type: 'unknown',
        message: 'Sign-in failed. Please try again.',
        shouldRetry: true,
        useRedirect: false
      };
  }
};

export const logAuthAttempt = (method, success, error = null) => {
  const timestamp = new Date().toISOString();
  const logData = {
    timestamp,
    method,
    success,
    userAgent: navigator.userAgent.substring(0, 100),
    url: window.location.href
  };
  
  if (error) {
    logData.error = {
      code: error.code,
      message: error.message
    };
  }
  
  console.log(`🔐 Auth ${success ? 'Success' : 'Failed'}:`, logData);
};