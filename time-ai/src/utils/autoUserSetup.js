import { db, auth } from '../config/firebase';
import { doc, getDoc, setDoc, collection, addDoc } from 'firebase/firestore';
import firebaseService from '../services/firebaseService';
import autoSyncService from '../services/AutoSyncService';

// Global flag to prevent duplicate setup logs
let setupInProgress = new Set();

export async function autoSetupNewUser(userId) {
  try {
    // Prevent duplicate setup for same user
    if (setupInProgress.has(userId)) {
      console.log('ℹ️ User setup already in progress, skipping...');
      return { success: true, isNewUser: false };
    }
    
    setupInProgress.add(userId);
    console.log('🔧 Setting up new user');
    
    // Get current Firebase user data
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('No authenticated user found');
    }
    
    // ตรวจสอบว่า user มีข้อมูลหรือยัง
    const userDoc = await getDoc(doc(db, 'users', userId));
    
    if (!userDoc.exists()) {
      console.log('ℹ️ New user - creating profile');
      
      // Extract name from displayName or use email
      const displayName = currentUser.displayName || currentUser.email.split('@')[0];
      const nameParts = displayName.split(' ');
      const firstName = nameParts[0] || 'User';
      const lastName = nameParts.slice(1).join(' ') || 'Name';
      
      // สร้างข้อมูล user ใหม่ใน users collection
      console.log('💾 Saving user data to database');
      const userData = {
        uid: userId,
        email: currentUser.email,
        displayName: displayName,
        firstName: firstName,
        lastName: lastName,
        photoURL: currentUser.photoURL || '',
        currentPlan: 'free',
        createdAt: new Date(),
        updatedAt: new Date(),
        // Normalized names for searching
        firstNameLower: firstName.toLowerCase(),
        lastNameLower: lastName.toLowerCase(),
        fullNameLower: displayName.toLowerCase()
      };
      
      await setDoc(doc(db, 'users', userId), userData);
      
      // Auto sync will handle Supabase sync automatically
      console.log('💾 Creating user in users collection');
      console.log('ℹ️ user_originals collection will be created by firebaseService.createUserProfile()');
      console.log('✅ All collections updated successfully');
      
      // Note: user_originals creation is now handled automatically in firebaseService.createUserProfile()
      // No need to call saveOriginalUserData() separately as it would create duplicates
      
      // Note: We no longer create plan_configs subcollection
      // The user's plan is stored in users.currentPlan field
      // Plan definitions are in subscription_plans collection
      console.log('✅ User setup completed with currentPlan field');
      
      console.log('✅ User profile created successfully');
      setupInProgress.delete(userId);
      return { success: true, isNewUser: true };
    }
    
    console.log('✅ User setup completed');
    setupInProgress.delete(userId);
    return { success: true, isNewUser: false };
  } catch (error) {
    console.error('❌ Auto setup failed:', error);
    setupInProgress.delete(userId);
    return { success: false, error: error.message };
  }
}

export async function checkUserDataCompleteness(userId) {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const planDoc = await getDoc(doc(db, 'users', userId, 'plan_configs', 'current'));
    
    return {
      hasUserData: userDoc.exists(),
      hasPlanConfig: planDoc.exists(),
      complete: userDoc.exists() && planDoc.exists()
    };
  } catch (error) {
    console.error('Error checking data completeness:', error);
    return { complete: false, error: error.message };
  }
}

export async function createDemoDataForNewUser(userId) {
  try {
    // สร้าง demo chat
    const chatRef = await addDoc(collection(db, 'users', userId, 'plan_configs', 'current', 'chats'), {
      title: 'ยินดีต้อนรับสู่ Time AI',
      messages: [
        { role: 'assistant', content: 'สวัสดี! ยินดีต้อนรับสู่ Time AI 🎉' },
        { role: 'user', content: 'สวัสดี' },
        { role: 'assistant', content: 'ฉันพร้อมช่วยเหลือคุณแล้ว มีอะไรให้ช่วยไหม?' }
      ],
      timestamp: Date.now()
    });
    
    console.log('✅ Demo data created');
    return { success: true, chatId: chatRef.id };
  } catch (error) {
    console.error('❌ Failed to create demo data:', error);
    return { success: false, error: error.message };
  }
}