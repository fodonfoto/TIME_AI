/**
 * Database Sync Service (Disabled)
 * 
 * This service has been disabled as part of the migration to Firebase-only architecture.
 * All Supabase synchronization functionality has been removed.
 */

class DatabaseSyncService {
  constructor() {
    this.isInitialized = false;
    this.syncQueue = [];
    this.isProcessing = false;
    this.listeners = new Map();
    this.retryAttempts = new Map();
  }

  /**
   * Initialize the sync service (disabled)
   */
  async initialize() {
    console.log('ℹ️ Database Sync Service is disabled - using Firebase-only architecture');
    this.isInitialized = false;
  }

  /**
   * Sync user data (Firebase-only)
   */
  async syncUserToFirebase(userData, retryCount = 0) {
    console.log('ℹ️ Firebase-only: User data managed directly in Firebase');
    return { success: true, message: 'Firebase-only architecture' };
  }

  /**
   * Track API usage (Firebase-only)
   */
  async trackUsage(userId, requestData) {
    console.log('ℹ️ Usage tracking managed in Firebase-only architecture');
  }

  /**
   * Check rate limit (using Firebase-only logic)
   */
  async checkRateLimit(firebaseUserId) {
    // Return permissive defaults since we're not using Supabase for rate limiting
    console.log('ℹ️ Rate limiting is now handled by Firebase-only architecture');
    return {
      canMakeRequest: true,
      requestsUsed: 0,
      requestsLimit: 10,
      plan: 'free'
    };
  }

  /**
   * Update user subscription plan (Firebase-only)
   */
  async updateUserPlan(firebaseUserId, planId) {
    console.log('ℹ️ Plan updates managed in Firebase-only architecture');
    return { success: true, message: 'Firebase-only plan management' };
  }

  /**
   * Process queued sync operations (Firebase-only)
   */
  async processQueue() {
    console.log('ℹ️ Queue processing managed in Firebase-only architecture');
  }

  /**
   * Get sync status
   */
  getStatus() {
    return {
      initialized: this.isInitialized,
      queueLength: this.syncQueue.length,
      processing: this.isProcessing,
      message: 'Firebase-only architecture - all operations in Firebase'
    };
  }
}

// Create singleton instance
const databaseSyncService = new DatabaseSyncService();

export default databaseSyncService;