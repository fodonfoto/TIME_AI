import { db } from '../config/firebase';
// Firebase-only implementation - Supabase integration removed
// import supabase from '../config/supabase';

class UserSyncService {
  constructor() {
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
  }

  async syncUser(uid) {
    console.log('🔥 Firebase-only: User data already synced in Firebase for:', uid);
    
    try {
      // Verify user exists in Firebase
      const userDoc = await db.collection('users').doc(uid).get();
      
      if (!userDoc.exists) {
        throw new Error('User not found in Firebase');
      }
      
      console.log('✅ User verified in Firebase:', userDoc.data().email);
      return { success: true, data: userDoc.data(), action: 'verified' };
    } catch (error) {
      console.error('❌ Error verifying user in Firebase:', error);
      throw error;
    }
  }

  async _performSync(uid) {
    console.log('🔥 Firebase-only: No external sync needed for user:', uid);
    
    // Just verify the user exists in Firebase
    const userDoc = await db.collection('users').doc(uid).get();
    
    if (!userDoc.exists) {
      throw new Error('User data not found in Firebase');
    }

    return {
      success: true,
      data: userDoc.data(),
      message: 'Firebase-only architecture - no external sync required'
    };
  }

  async _verifySync(uid) {
    console.log('🔥 Firebase-only: Verifying user data in Firebase for:', uid);
    
    const firestoreData = await db.collection('users').doc(uid).get();

    if (!firestoreData.exists) {
      throw new Error('Verification failed: User not found in Firebase');
    }

    return {
      uid,
      email: firestoreData.data().email,
      firstName: firestoreData.data().firstName || '',
      lastName: firestoreData.data().lastName || '',
      plan: firestoreData.data().currentPlan || 'free',
      lastLogin: new Date().toISOString(),
      isVerified: true,
      message: 'Firebase-only verification successful'
    };
  }
}

const userSyncService = new UserSyncService();
export default userSyncService;
