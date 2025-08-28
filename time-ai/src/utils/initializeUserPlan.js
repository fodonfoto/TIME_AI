import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase'; // Fixed import path to match project structure

// เริ่มต้น user plan สำหรับ user ใหม่
export const initializeUserPlan = async (userId, email) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (userDoc.exists()) {
      const userData = userDoc.data();
      
      // ถ้ายังไม่มี plan fields ให้เพิ่มเข้าไป
      if (!userData.currentPlan) {
        await updateDoc(userRef, {
          currentPlan: 'free', // default เป็น free plan
          dailyUsage: 0,
          lastUsageDate: null,
          updatedAt: new Date()
        });
        console.log('✅ เพิ่ม plan fields ให้ user เรียบร้อย');
      }
    } else {
      // สร้าง user document ใหม่
      await setDoc(userRef, {
        email: email,
        currentPlan: 'free',
        dailyUsage: 0,
        lastUsageDate: null,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log('✅ สร้าง user document ใหม่เรียบร้อย');
    }
    
    return true;
  } catch (error) {
    console.error('Error initializing user plan:', error);
    throw error;
  }
};

// อัปเดต user plan เป็น plan ใดๆ
export const setUserPlan = async (userId, planType) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // ตรวจสอบว่า plan type ถูกต้องหรือไม่
    const validPlans = ['free', 'pro', 'max']; // Updated to match current schema: free, pro, max
    if (!validPlans.includes(planType.toLowerCase())) {
      throw new Error(`Invalid plan type: ${planType}. Valid plans: ${validPlans.join(', ')}`);
    }
    
    await updateDoc(userRef, {
      currentPlan: planType.toLowerCase(),
      dailyUsage: 0, // reset usage เมื่อเปลี่ยน plan
      lastUsageDate: null,
      updatedAt: new Date()
    });
    
    console.log(`✅ อัปเดต user ${userId} เป็น ${planType} plan สำเร็จ`);
    return true;
  } catch (error) {
    console.error('Error setting user plan:', error);
    throw error;
  }
};

// ดึงรายชื่อ users ทั้งหมดพร้อม plan info
export const getAllUsersWithPlans = async () => {
  try {
    const { collection, getDocs } = await import('firebase/firestore');
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const users = [];
    snapshot.forEach((doc) => {
      const userData = doc.data();
      users.push({
        id: doc.id,
        email: userData.email,
        currentPlan: userData.currentPlan || 'free',
        dailyUsage: userData.dailyUsage || 0,
        lastUsageDate: userData.lastUsageDate,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt
      });
    });
    
    return users;
  } catch (error) {
    console.error('Error getting all users with plans:', error);
    throw error;
  }
};