import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export const updateUserToPro = async () => {
  try {
    await updateDoc(doc(db, 'users', 'researchchatgpt01@gmail.com'), {
      selectedPlan: 'Pro Plan',
      dailyUsage: 0,
      lastResetDate: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString()
    });

    console.log('✅ อัปเดต researchchatgpt01@gmail.com เป็น Pro Plan สำเร็จ!');
    return true;
  } catch (error) {
    console.error('❌ Error updating user plan:', error);
    return false;
  }
};