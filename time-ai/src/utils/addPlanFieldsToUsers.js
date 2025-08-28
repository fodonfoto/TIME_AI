import { doc, updateDoc, collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

export const addPlanFieldsToAllUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const updatePromises = [];
    
    snapshot.forEach((userDoc) => {
      const userData = userDoc.data();
      
      // ถ้ายังไม่มี currentPlan field
      if (!userData.currentPlan) {
        const userRef = doc(db, 'users', userDoc.id);
        updatePromises.push(
          updateDoc(userRef, {
            currentPlan: 'free', // default เป็น free plan
            dailyUsage: 0,
            lastUsageDate: null,
            updatedAt: new Date()
          })
        );
      }
    });
    
    await Promise.all(updatePromises);
    console.log(`✅ เพิ่ม plan fields ให้ ${updatePromises.length} users เรียบร้อย`);
    return updatePromises.length;
  } catch (error) {
    console.error('Error adding plan fields to users:', error);
    throw error;
  }
};