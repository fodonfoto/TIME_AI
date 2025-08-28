import { db, auth } from '../config/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';

/**
 * ฟังก์ชันสำหรับ debug Firebase issues
 */

// ทดสอบ Firebase Rules และ Permissions
export const testFirebaseRules = async () => {
  console.log('🔍 Testing Firebase Rules and Permissions...');
  
  try {
    // ตรวจสอบ authentication status
    const user = auth.currentUser;
    console.log('👤 Current user:', user ? {
      uid: user.uid,
      isAnonymous: user.isAnonymous,
      email: user.email
    } : 'No user');

    // ถ้าไม่มี user ให้ sign in anonymously
    if (!user) {
      console.log('🔐 Signing in anonymously...');
      await signInAnonymously(auth);
      console.log('✅ Anonymous sign in successful');
    }

    // ทดสอบ write permission ด้วย test document
    const testDocRef = doc(db, 'test_permissions', 'test_' + Date.now());
    console.log('📝 Testing write permission...');
    
    await setDoc(testDocRef, {
      message: 'Test write permission',
      timestamp: serverTimestamp(),
      userId: auth.currentUser?.uid || 'anonymous'
    });
    
    console.log('✅ Write permission test successful');

    // ทดสอบ read permission
    console.log('📖 Testing read permission...');
    const docSnap = await getDoc(testDocRef);
    
    if (docSnap.exists()) {
      console.log('✅ Read permission test successful');
      console.log('📄 Document data:', docSnap.data());
    } else {
      console.log('❌ Document not found after write');
    }

    return {
      success: true,
      user: auth.currentUser ? {
        uid: auth.currentUser.uid,
        isAnonymous: auth.currentUser.isAnonymous
      } : null,
      message: '✅ Firebase rules test passed'
    };

  } catch (error) {
    console.error('❌ Firebase rules test failed:', error);
    
    // วิเคราะห์ error codes
    let errorAnalysis = 'Unknown error';
    if (error.code === 'permission-denied') {
      errorAnalysis = 'Permission denied - check Firebase Security Rules';
    } else if (error.code === 'unauthenticated') {
      errorAnalysis = 'User not authenticated';
    } else if (error.code === 'unavailable') {
      errorAnalysis = 'Firebase service unavailable';
    }

    return {
      success: false,
      error: error.message,
      errorCode: error.code,
      errorAnalysis,
      message: '❌ Firebase rules test failed'
    };
  }
};

// ทดสอบ nested collections permissions
export const testNestedCollectionPermissions = async () => {
  console.log('🔍 Testing nested collection permissions...');
  
  try {
    const testUserId = 'test_user_' + Date.now();
    
    // ทดสอบ users collection
    const userRef = doc(db, 'users', testUserId);
    await setDoc(userRef, {
      email: 'test@example.com',
      createdAt: serverTimestamp()
    });
    console.log('✅ Users collection write successful');

    // ทดสอบ nested subcollection
    const planConfigRef = doc(collection(userRef, 'plan_configs'), 'current_plan');
    await setDoc(planConfigRef, {
      planName: 'Test Plan',
      createdAt: serverTimestamp()
    });
    console.log('✅ Nested subcollection write successful');

    return {
      success: true,
      testUserId,
      message: '✅ Nested collection permissions test passed'
    };

  } catch (error) {
    console.error('❌ Nested collection permissions test failed:', error);
    return {
      success: false,
      error: error.message,
      errorCode: error.code,
      message: '❌ Nested collection permissions test failed'
    };
  }
};

// รวมการทดสอบทั้งหมด
export const runFirebaseDebugTests = async () => {
  console.log('🚀 Running Firebase Debug Tests...');
  
  const results = {
    rulesTest: await testFirebaseRules(),
    nestedCollectionTest: await testNestedCollectionPermissions()
  };
  
  console.log('📊 Debug Test Results:', results);
  return results;
};