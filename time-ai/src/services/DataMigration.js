import { db } from '../config/firebase.js';
// Firebase-only implementation - Supabase integration removed
// import SupabaseService from './SupabaseService.js';

class DataMigration {
  constructor() {
    this.migrationLog = [];
  }

  log(message, type = 'info') {
    const logEntry = {
      timestamp: new Date().toISOString(),
      type,
      message
    };
    this.migrationLog.push(logEntry);
    console.log(`[${type.toUpperCase()}] ${message}`);
  }

  async migrateUsersFromFirestore() {
    try {
      this.log('Firebase-only: No migration needed - all data already in Firebase');
      
      const usersSnapshot = await db.collection('users').get();
      const userCount = usersSnapshot.size;
      
      this.log(`Found ${userCount} users in Firebase - no external migration needed`);
      
      return {
        success: true,
        migratedCount: 0,
        errorCount: 0,
        message: 'Firebase-only architecture - no migration required'
      };
    } catch (error) {
      this.log(`Migration check failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }
  async migrateSubscriptionsFromFirestore() {
    try {
      this.log('Firebase-only: No subscription migration needed - data already in Firebase');
      
      const subscriptionsSnapshot = await db.collection('billing_transactions').get();
      const subscriptionCount = subscriptionsSnapshot.size;
      
      this.log(`Found ${subscriptionCount} billing transactions in Firebase - no external migration needed`);
      
      return {
        success: true,
        migrated: 0,
        errors: 0,
        message: 'Firebase-only architecture - no migration required'
      };
    } catch (error) {
      this.log(`Subscription check failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async migrateUsageTrackingFromFirestore() {
    try {
      this.log('Firebase-only: No usage tracking migration needed - data already in Firebase');
      
      const usageSnapshot = await db.collection('usage_tracking').get();
      const usageCount = usageSnapshot.size;
      
      this.log(`Found ${usageCount} usage records in Firebase - no external migration needed`);
      
      return {
        success: true,
        migrated: 0,
        errors: 0,
        message: 'Firebase-only architecture - no migration required'
      };
    } catch (error) {
      this.log(`Usage tracking check failed: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }

  async runFullMigration() {
    try {
      this.log('Firebase-only: Full migration check starting');
      
      const results = {
        users: await this.migrateUsersFromFirestore(),
        subscriptions: await this.migrateSubscriptionsFromFirestore(),
        usage: await this.migrateUsageTrackingFromFirestore()
      };

      this.log('Firebase-only: All data is already in Firebase - no migration required');
      
      return {
        success: true,
        results,
        summary: {
          totalMigrated: 0,
          totalErrors: 0,
          log: this.migrationLog,
          message: 'Firebase-only architecture - no external migration needed'
        }
      };
    } catch (error) {
      this.log(`Migration check failed: ${error.message}`, 'error');
      return { success: false, error: error.message, log: this.migrationLog };
    }
  }

  mapPlanName(firestorePlan) {
    const planMapping = {
      'free': 'free',
      'pro': 'pro',
      'ultra': 'max',
      'enterprise': 'max',
      'max': 'max'
    };
    return planMapping[firestorePlan] || 'free';
  }

  async syncUserData(firebase_uid) {
    try {
      this.log('Firebase-only: User data sync not needed - already in Firebase');
      
      // Get user from Firestore to verify existence
      const firestoreDoc = await db.collection('users').doc(firebase_uid).get();
      if (!firestoreDoc.exists) {
        return { success: false, error: 'User not found in Firestore' };
      }

      return {
        success: true,
        data: firestoreDoc.data(),
        action: 'verified',
        message: 'Firebase-only - no sync required'
      };
    } catch (error) {
      this.log(`Error checking user ${firebase_uid}: ${error.message}`, 'error');
      return { success: false, error: error.message };
    }
  }
}

export default new DataMigration();