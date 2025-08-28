import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../config/firebase';
import databaseSyncService from '../services/DatabaseSyncService';
import autoSyncService from '../services/AutoSyncService';

const AuthGuard = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectAttempted = useRef(false);
  const authLoggedRef = useRef(false);

  useEffect(() => {
    // รีเซ็ต redirect flag เมื่อ location เปลี่ยน (แต่ไม่รีเซ็ต authLoggedRef)
    redirectAttempted.current = false;
  }, [location.pathname]);

  useEffect(() => {
    if (!loading && !user && !redirectAttempted.current) {
      console.log('🔒 AuthGuard: No user, redirecting to login');
      redirectAttempted.current = true;
      navigate('/login', { replace: true });
    } else if (!loading && user && !authLoggedRef.current) {
      console.log('✅ AuthGuard: Firebase user authenticated, access granted');
      authLoggedRef.current = true;
      
      // เริ่ม auto sync services เมื่อ user login แล้ว (ปิดไว้ชั่วคราวเพื่อหลีกเลี่ยง permission errors)
      // setTimeout(() => {
      //   console.log('🔄 Starting auto sync services...');
      //   databaseSyncService.initialize();
      //   autoSyncService.start();
      // }, 2000);
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p className="text-gray-600">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Let the parent component handle the redirect
  }

  // ✅ Firebase user authenticated - grant access
  return children;
};

export default AuthGuard;