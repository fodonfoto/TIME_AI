/**
 * Auto Sync Service - Firebase-only implementation
 * 
 * This service has been simplified to work with Firebase-only architecture
 */

import { onSnapshot, collection, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

class AutoSyncService {
  constructor() {
    this.isActive = false;
    this.listeners = new Map();
    this.syncQueue = [];
    this.retryAttempts = new Map();
    this.failedUsers = new Set();
  }

  /**
   * Start auto sync service (Firebase-only)
   */
  async start() {
    try {
      console.log('🚀 Auto Sync Service: Starting (Firebase-only mode)...');
      
      this.isActive = true;
      this.setupListeners();
      
      console.log('✅ Auto Sync Service started successfully');
      return true;
      
    } catch (error) {
      console.error('❌ Failed to start Auto Sync Service:', error);
      return false;
    }
  }

  /**
   * Setup Firestore listeners (Firebase-only)
   */
  setupListeners() {
    console.log('🎧 Setting up Firebase listeners...');

    // Listener for users collection
    const usersRef = collection(db, 'users');
    const usersListener = onSnapshot(usersRef, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added' || change.type === 'modified') {
          console.log('🔄 User data changed in Firebase:', change.doc.data().email);
        }
      });
    }, (error) => {
      console.error('❌ Error in users listener:', error);
    });
    this.listeners.set('users', usersListener);
    console.log('✅ Users listener attached.');

    console.log('📝 All data managed in Firebase-only architecture');
  }

  /**
   * Firebase-only user management (no sync needed)
   */
  async syncUser(userData) {
    console.log('📝 Firebase-only: User data already in Firebase, no sync needed');
    return { success: true };
  }

  /**
   * Firebase-only conversation management (no sync needed)
   */
  async syncConversation(conversationData) {
    console.log('📝 Firebase-only: Conversation data already in Firebase, no sync needed');
    return { success: true };
  }

  /**
   * Queue failed sync for retry
   */
  queueRetry(type, data) {
    const retryKey = `${type}_${data.id || data.uid}`;
    const attempts = this.retryAttempts.get(retryKey) || 0;
    
    if (attempts < 3) {
      this.retryAttempts.set(retryKey, attempts + 1);
      setTimeout(() => {
        if (type === 'user') {
          this.syncUser(data);
        } else if (type === 'conversation') {
          this.syncConversation(data);
        }
      }, 5000 * (attempts + 1)); // Exponential backoff
    } else {
      console.error('❌ Max retry attempts reached for:', retryKey);
      this.retryAttempts.delete(retryKey);
    }
  }

  /**
   * Create missing user - Firebase-only (no external sync)
   */
  async createMissingUser(firebaseUserId) {
    console.log('📝 Firebase-only: User already in Firebase, no external creation needed');
    return { success: true };
  }

  /**
   * Get daily limit based on plan
   */
  getDailyLimit(planId) {
    const limits = { 'free': 10, 'pro': 100, 'max': -1 };
    return limits[planId] || 10;
  }

  /**
   * Manual sync for specific user
   */
  async forceSyncUser(firebaseUserId) {
    try {
      console.log('🔄 Force syncing user:', firebaseUserId);
      
      // Remove from failed users list for manual sync attempt
      this.failedUsers.delete(firebaseUserId);
      
      // Import firebaseService to avoid circular dependency
      const { default: firebaseService } = await import('./firebaseService');
      
      // Get user profile
      const userProfile = await firebaseService.getUserProfile(firebaseUserId);
      if (userProfile) {
        await this.syncUser(userProfile);
      }
      
      // Note: Conversations managed in Firestore only
      console.log('📝 Conversations managed in Firestore (Firebase-only architecture)');
      
      console.log('✅ Force sync completed');
      return { success: true, syncedItems: { user: 1, conversations: 'firestore-only' } };
      
    } catch (error) {
      console.error('❌ Force sync failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clear failed users list (for admin use)
   */
  clearFailedUsers() {
    console.log('🔄 Clearing failed users list...');
    this.failedUsers.clear();
  }

  /**
   * Stop auto sync service
   */
  stop() {
    this.isActive = false;
    this.listeners.forEach((unsubscribe, name) => {
      console.log(`🛑 Stopping ${name} listener...`);
      unsubscribe();
    });
    this.listeners.clear();
    console.log('🛑 Auto Sync Service stopped');
  }

  /**
   * Get sync status (Firebase-only)
   */
  getStatus() {
    return {
      active: this.isActive,
      listeners: this.listeners.size,
      queueLength: this.syncQueue.length,
      retryAttempts: Object.fromEntries(this.retryAttempts),
      failedUsers: Array.from(this.failedUsers),
      approach: 'firebase-only'
    };
  }
}

// Create singleton instance
const autoSyncService = new AutoSyncService();

// Auto-start disabled to prevent permission errors
// Call autoSyncService.start() manually when user is authenticated
// if (typeof window !== 'undefined') {
//   setTimeout(() => {
//     autoSyncService.start();
//   }, 2000);
// }

export default autoSyncService;