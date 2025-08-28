import { doc, getDoc, updateDoc, setDoc, increment, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

// ดึงข้อมูล plan config โดยใช้ plan name
const getPlanConfig = async (planName) => {
  try {
    const planQuery = query(
      collection(db, 'subscription_plans'),
      where('name', '==', planName)
    );
    const planSnapshot = await getDocs(planQuery);
    
    if (!planSnapshot.empty) {
      const planData = planSnapshot.docs[0].data();
      // แปลงจาก subscription_plans schema ให้เข้ากับ legacy interface
      return {
        name: planData.name,
        dailyLimit: planData.limits?.dailyRequests || 10,
        features: planData.features || ['basic_chat', 'history'],
        price: planData.prices?.monthly?.amount ? planData.prices.monthly.amount / 100 : 0 // Convert cents to dollars
      };
    }
    
    // Default free plan ถ้าไม่เจอ
    return {
      name: 'Free Plan',
      dailyLimit: 10,
      features: ['basic_chat', 'history'],
      price: 0
    };
  } catch (error) {
    console.error('Error getting plan config:', error);
    return {
      name: 'Free Plan',
      dailyLimit: 10,
      features: ['basic_chat', 'history'],
      price: 0
    };
  }
};

// ดึงข้อมูล user plan และ usage
export const getUserPlanInfo = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }
    
    const userData = userDoc.data();
    const planName = userData.selectedPlan || 'Free Plan';
    
    // ดึงข้อมูล plan config
    const planData = await getPlanConfig(planName);
    
    return {
      planName: planData.name,
      dailyLimit: planData.dailyLimit,
      features: planData.features || [],
      price: planData.price,
      dailyUsage: userData.dailyUsage || 0,
      lastUsageDate: userData.lastResetDate || userData.lastUsageDate
    };
  } catch (error) {
    console.error('Error getting user plan info:', error);
    throw error;
  }
};

// ตรวจสอบว่า user สามารถใช้งานได้หรือไม่
export const canUserChat = async (userId) => {
  try {
    const planInfo = await getUserPlanInfo(userId);
    
    // ถ้าเป็น unlimited plan (dailyLimit = -1)
    if (planInfo.dailyLimit === -1) {
      return { canChat: true, remainingChats: -1 };
    }
    
    // ตรวจสอบว่าเป็นวันใหม่หรือไม่
    const today = new Date().toDateString();
    const lastUsageDate = planInfo.lastUsageDate?.toDate?.()?.toDateString() || planInfo.lastUsageDate;
    
    let currentUsage = planInfo.dailyUsage || 0;
    
    // ถ้าเป็นวันใหม่ ให้ reset usage
    if (lastUsageDate !== today) {
      currentUsage = 0;
    }
    
    const remainingChats = planInfo.dailyLimit - currentUsage;
    const canChat = remainingChats > 0;
    
    return { canChat, remainingChats, currentUsage, dailyLimit: planInfo.dailyLimit };
  } catch (error) {
    console.error('Error checking user chat permission:', error);
    return { canChat: false, remainingChats: 0 };
  }
};

// บันทึกการใช้งาน chat
export const recordChatUsage = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const today = new Date();
    const todayString = today.toDateString();
    
    // ดึงข้อมูล user ปัจจุบัน
    const userDoc = await getDoc(userRef);
    const userData = userDoc.data() || {};
    
    const lastUsageDate = userData.lastResetDate?.toDate?.()?.toDateString() || userData.lastResetDate;
    
    // ถ้าเป็นวันใหม่ ให้ reset usage เป็น 1
    if (lastUsageDate !== todayString) {
      await updateDoc(userRef, {
        dailyUsage: 1,
        lastResetDate: todayString
      });
    } else {
      // ถ้าเป็นวันเดียวกัน ให้เพิ่ม usage
      await updateDoc(userRef, {
        dailyUsage: increment(1)
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error recording chat usage:', error);
    throw error;
  }
};

// อัปเดต user plan
export const updateUserPlan = async (userId, planName) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    await updateDoc(userRef, {
      selectedPlan: planName,
      updatedAt: new Date()
    });
    
    return true;
  } catch (error) {
    console.error('Error updating user plan:', error);
    throw error;
  }
};

// ตรวจสอบ feature access
export const hasFeatureAccess = async (userId, feature) => {
  try {
    const planInfo = await getUserPlanInfo(userId);
    return planInfo.features.includes(feature);
  } catch (error) {
    console.error('Error checking feature access:', error);
    return false;
  }
};