// Path validation utility to prevent unauthorized access
export const validatePath = (pathname) => {
  // Define allowed paths for authenticated users
  const allowedPaths = [
    '/',
    '/chatai',
    '/dashboard', 
    '/history',
    '/settings',
    '/agent',
    '/subscription',
    '/firebase-test',
    '/database-test',
    '/chat-debug'
  ];

  // Define public paths (no authentication required)
  const publicPaths = [
    '/login',
    '/404'
  ];

  // Check if path is allowed
  const isAllowedPath = allowedPaths.includes(pathname);
  const isPublicPath = publicPaths.includes(pathname);

  return {
    isValid: isAllowedPath || isPublicPath,
    isPublic: isPublicPath,
    isProtected: isAllowedPath
  };
};

// Hook to detect unauthorized path changes
export const usePathSecurity = () => {
  const detectUnauthorizedAccess = (pathname) => {
    const validation = validatePath(pathname);
    
    if (!validation.isValid) {
      console.warn('🚨 Unauthorized path access detected:', pathname);
      return true;
    }
    
    return false;
  };

  return { detectUnauthorizedAccess };
};