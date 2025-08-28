import { useState, useEffect } from 'react';
import { 
  signInAnonymously, 
  onAuthStateChanged,
  signInWithRedirect,
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from '../config/firebase';
import { resetLoginPageFlags } from '../components/LoginPage';

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    }, (error) => {
      console.error('Auth state change error:', error);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInAnonymous = async () => {
    try {
      await signInAnonymously(auth);
    } catch (error) {
      console.error('Anonymous sign in failed:', error);
    }
  };

  const signInWithGoogle = async () => {
    try {
      console.log('🚀 Starting Google sign in with redirect...');
      
      // ใช้วิธี redirect แทน popup เพื่อหลีกเลี่ยงปัญหา COOP
      const provider = new GoogleAuthProvider();
      
      // ตั้งค่า provider
      provider.setCustomParameters({
        prompt: 'select_account',
        // ระบุว่าให้กลับมาหน้าเดิมหลังล็อกอินเสร็จ
        redirect_uri: window.location.origin + window.location.pathname
      });
      
      // เก็บ URL ปัจจุบันไว้สำหรับกลับมาหลังจาก redirect
      sessionStorage.setItem('preAuthUrl', window.location.href);
      
      // ใช้ redirect method ซึ่งไม่มีปัญหา COOP
      await signInWithRedirect(auth, provider);
      
      // หลังจากนี้จะถูก redirect ไปยังหน้า Google OAuth
      return null;
      
    } catch (error) {
      console.error('❌ Google sign in failed:', error);
      
      // ล้าง session ที่เก็บไว้ในกรณีเกิดข้อผิดพลาด
      sessionStorage.removeItem('preAuthUrl');
      
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('🚪 Starting logout...');
      await firebaseSignOut(auth);
      resetLoginPageFlags(); // Reset login page flags for clean state
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Sign out failed:', error);
    }
  };

  return {
    user,
    loading,
    signInAnonymous,
    signInWithGoogle,
    signOut
  };
};