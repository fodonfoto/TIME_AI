import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc, 
  increment,
  serverTimestamp 
} from 'firebase/firestore';

import { db } from '../config/firebase';

// ดึงข้อมูล usage ของ user จาก Firestore
export const getUserUsage = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const planConfigsRef = doc(userRef, 'plan_configs', 'current_plan');
    
    const planDoc = await getDoc(planConfigsRef);
    
    if (planDoc.exists()) {
      const data = planDoc.data();
      const today = new Date().toISOString().split('T')[0];
      
      // ถ้าวันใหม่ ให้ reset usage
      if (data.lastResetDate !== today) {
        await updateDoc(planConfigsRef, {
          dailyUsage: 0,
          lastResetDate: today,
          updatedAt: serverTimestamp()
        });
        
        return {
          dailyUsage: 0,
          dailyLimit: data.dailyLimit || 10, // Changed from 5 to 10 to match PRD
          planName: data.planName || 'Free Plan',
          lastResetDate: today,
          firstUsageDate: data.firstUsageDate
        };
      }
      
      return {
        dailyUsage: data.dailyUsage || 0,
        dailyLimit: data.dailyLimit || 10, // Changed from 5 to 10 to match PRD
        planName: data.planName || 'Free Plan',
        lastResetDate: data.lastResetDate,
        firstUsageDate: data.firstUsageDate
      };
    }
    
    // ถ้าไม่มีข้อมูล ให้สร้างใหม่
    const today = new Date().toISOString().split('T')[0];
    const defaultPlan = {
      planName: 'Free Plan',
      dailyLimit: 10, // Changed from 5 to 10 to match PRD
      dailyUsage: 0,
      lastResetDate: today,
      firstUsageDate: today,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    await setDoc(planConfigsRef, defaultPlan);
    
    return {
      dailyUsage: 0,
      dailyLimit: 10, // Changed from 5 to 10 to match PRD
      planName: 'Free Plan',
      lastResetDate: defaultPlan.lastResetDate,
      firstUsageDate: defaultPlan.firstUsageDate
    };
    
  } catch (error) {
    console.error('Error getting user usage:', error);
    return {
      dailyUsage: 0,
      dailyLimit: 10, // Changed from 5 to 10 to match PRD
      planName: 'Free Plan',
      lastResetDate: new Date().toISOString().split('T')[0],
      firstUsageDate: new Date().toISOString().split('T')[0]
    };
  }
};

// บันทึกการใช้งาน request
export const recordUsage = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const planConfigsRef = doc(userRef, 'plan_configs', 'current_plan');
    
    const today = new Date().toISOString().split('T')[0];
    
    // ตรวจสอบว่ามี firstUsageDate หรือยัง
    const planDoc = await getDoc(planConfigsRef);
    const updateData = {
      dailyUsage: increment(1),
      lastResetDate: today,
      updatedAt: serverTimestamp()
    };
    
    // ถ้าไม่มี firstUsageDate ให้เพิ่ม
    if (!planDoc.exists() || !planDoc.data().firstUsageDate) {
      updateData.firstUsageDate = today;
    }
    
    // อัปเดต usage
    await updateDoc(planConfigsRef, updateData);
    
    // บันทึกประวัติการใช้งานรายวัน
    await recordDailyUsageHistory(userId, today);
    
    return true;
  } catch (error) {
    console.error('Error recording usage:', error);
    return false;
  }
};

// บันทึกประวัติการใช้งานรายวันสำหรับกราฟ
export const recordDailyUsageHistory = async (userId, date) => {
  try {
    const userRef = doc(db, 'users', userId);
    const usageHistoryRef = doc(userRef, 'usage_history', date);
    
    const historyDoc = await getDoc(usageHistoryRef);
    
    if (historyDoc.exists()) {
      // อัปเดตจำนวนที่มีอยู่
      await updateDoc(usageHistoryRef, {
        count: increment(1),
        updatedAt: serverTimestamp()
      });
    } else {
      // สร้างใหม่
      await setDoc(usageHistoryRef, {
        date: date,
        count: 1,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
    }
    
    return true;
  } catch (error) {
    console.error('Error recording daily usage history:', error);
    return false;
  }
};

// ดึงประวัติการใช้งานแบบ 30 วันต่อรอบตั้งแต่วันที่ join
export const getUsageHistory = async (userId, maxDays = 30) => {
  try {
    const userRef = doc(db, 'users', userId);
    
    // ดึงข้อมูล user profile เพื่อหา createdAt (วันที่ join)
    const userDoc = await getDoc(userRef);
    let joinDate = null;
    
    if (userDoc.exists() && userDoc.data().createdAt) {
      const createdAt = userDoc.data().createdAt;
      joinDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    }
    
    const history = [];
    const today = new Date();
    
    // ถ้าไม่มี joinDate ให้ใช้วันนี้เป็นจุดเริ่มต้น
    if (!joinDate) {
      joinDate = today;
    }
    
    // คำนวณจำนวนวันตั้งแต่ join จนถึงวันนี้
    const daysSinceJoin = Math.floor((today - joinDate) / (1000 * 60 * 60 * 24));
    
    // คำนวณว่าอยู่ในรอบ 30 วันที่เท่าไหร่ (เริ่มจาก 0)
    const currentPeriod = Math.floor(daysSinceJoin / 30);
    
    // คำนวณวันเริ่มต้นและสิ้นสุดของรอบปัจจุบัน
    const periodStartDate = new Date(joinDate);
    periodStartDate.setDate(periodStartDate.getDate() + (currentPeriod * 30));
    
    const periodEndDate = new Date(periodStartDate);
    periodEndDate.setDate(periodEndDate.getDate() + 29);
    
    // ถ้าวันสิ้นสุดของรอบเกินวันนี้ ให้ใช้วันนี้แทน
    const endDate = periodEndDate > today ? today : periodEndDate;
    
    // สร้างข้อมูลสำหรับรอบ 30 วันปัจจุบัน
    const currentDate = new Date(periodStartDate);
    
    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      try {
        const historyDoc = await getDoc(doc(userRef, 'usage_history', dateStr));
        const count = historyDoc.exists() ? historyDoc.data().count || 0 : 0;
        
        history.push({
          date: dateStr,
          count: count,
          displayDate: currentDate.toLocaleDateString('th-TH', { 
            day: '2-digit', 
            month: 'short' 
          }),
          period: currentPeriod + 1,
          dayInPeriod: Math.floor((currentDate - periodStartDate) / (1000 * 60 * 60 * 24)) + 1
        });
      } catch (error) {
        history.push({
          date: dateStr,
          count: 0,
          displayDate: currentDate.toLocaleDateString('th-TH', { 
            day: '2-digit', 
            month: 'short' 
          }),
          period: currentPeriod + 1,
          dayInPeriod: Math.floor((currentDate - periodStartDate) / (1000 * 60 * 60 * 24)) + 1
        });
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return history;
  } catch (error) {
    console.error('Error getting usage history:', error);
    
    // Fallback: แสดงเฉพาะวันนี้
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    return [{
      date: todayStr,
      count: 0,
      displayDate: today.toLocaleDateString('th-TH', { 
        day: '2-digit', 
        month: 'short' 
      }),
      period: 1,
      dayInPeriod: 1
    }];
  }
};

// ตรวจสอบว่า user สามารถใช้งานได้หรือไม่
export const canUserMakeRequest = async (userId) => {
  try {
    const usage = await getUserUsage(userId);
    
    return {
      canUse: usage.dailyUsage < usage.dailyLimit,
      currentUsage: usage.dailyUsage,
      dailyLimit: usage.dailyLimit,
      remaining: Math.max(0, usage.dailyLimit - usage.dailyUsage),
      planName: usage.planName
    };
  } catch (error) {
    console.error('Error checking user request permission:', error);
    return {
      canUse: false,
      currentUsage: 0,
      dailyLimit: 10, // Changed from 5 to 10 to match PRD
      remaining: 10, // Changed from 5 to 10 to match PRD
      planName: 'Free Plan'
    };
  }
};

// ดึงข้อมูลรอบการใช้งานปัจจุบัน
export const getCurrentPeriodInfo = async (userId) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists() || !userDoc.data().createdAt) {
      return {
        period: 1,
        dayInPeriod: 1,
        periodStartDate: new Date(),
        periodEndDate: new Date()
      };
    }
    
    const createdAt = userDoc.data().createdAt;
    const joinDate = createdAt.toDate ? createdAt.toDate() : new Date(createdAt);
    const today = new Date();
    
    const daysSinceJoin = Math.floor((today - joinDate) / (1000 * 60 * 60 * 24));
    const currentPeriod = Math.floor(daysSinceJoin / 30);
    const dayInPeriod = (daysSinceJoin % 30) + 1;
    
    const periodStartDate = new Date(joinDate);
    periodStartDate.setDate(periodStartDate.getDate() + (currentPeriod * 30));
    
    const periodEndDate = new Date(periodStartDate);
    periodEndDate.setDate(periodEndDate.getDate() + 29);
    
    return {
      period: currentPeriod + 1,
      dayInPeriod: dayInPeriod,
      periodStartDate: periodStartDate,
      periodEndDate: periodEndDate,
      totalDaysInPeriod: Math.min(30, Math.floor((today - periodStartDate) / (1000 * 60 * 60 * 24)) + 1)
    };
  } catch (error) {
    console.error('Error getting current period info:', error);
    return {
      period: 1,
      dayInPeriod: 1,
      periodStartDate: new Date(),
      periodEndDate: new Date(),
      totalDaysInPeriod: 1
    };
  }
};