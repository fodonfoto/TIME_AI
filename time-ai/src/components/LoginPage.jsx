import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../config/firebase';
import firebaseService from '../services/firebaseService';
import { autoSetupNewUser } from '../utils/autoUserSetup';
import { sanitizeUserData } from '../utils/logSanitizer';

// Connection checks are removed as they were causing permission errors and are not essential for the login flow.

// Global flag to prevent duplicate "Checking existing user" logs
let globalCheckUserLogged = false;

// Reset function for logout
export const resetLoginPageFlags = () => {
  globalCheckUserLogged = false;
  // Note: processingUsers is component-specific and will be cleared on unmount
};

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const authListenerSetup = useRef(false);
  const processingUsers = useRef(new Set()); // Track users being processed

  // Handle existing user on page load
  useEffect(() => {
    if (!authListenerSetup.current) {
      if (!globalCheckUserLogged) {
        console.log('🔍 Checking existing user...');
        globalCheckUserLogged = true;
      }
      authListenerSetup.current = true;
      
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        if (user && location.pathname === '/login') {
          console.log('✅ Existing user found:', sanitizeUserData(user));
          await processUser(user);
        } else if (!user) {
          console.log('ℹ️ No existing user');
          setIsLoading(false);
        }
      });
      
      return () => {
        unsubscribe();
        authListenerSetup.current = false;
        // Clear processing users set on component unmount
        processingUsers.current.clear();
        // Don't reset globalCheckUserLogged to prevent duplicate logs
      };
    }
  }, [location, navigate]);

  const processUser = async (user) => {
    if (location.pathname !== '/login') return;
    
    // Check if this user is already being processed
    if (processingUsers.current.has(user.uid)) {
      console.log('ℹ️ User processing already in progress, skipping...');
      return;
    }
    
    // Add user to processing set
    processingUsers.current.add(user.uid);
    setIsLoading(true);
    
    try {
      console.log('🔍 Checking if user exists in DB');
      // Single check - if user exists in Firestore, they're existing user
      const userExists = await firebaseService.checkUserExists(user.uid);
      
      if (userExists) {
        console.log('✅ User exists in database');
        console.log('✅ Existing user - direct login');
        
        // อัพเดท last login สำหรับ existing user
        console.log('💾 Updating last login for existing user');
        await firebaseService.updateUserLastLogin(user.uid);
        
        
        
        navigate('/chatai', { replace: true });
      } else {
        console.log('ℹ️ New user - creating profile');
        console.log('💾 Creating user profile:', sanitizeUserData(user));
        
        try {
          // สร้างข้อมูลผู้ใช้ใหม่
          const userProfile = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || user.email.split('@')[0],
            photoURL: user.photoURL || '',
            currentPlan: 'free',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            preferences: {
              theme: 'light',
              language: 'th',
              notifications: true
            },
            isActive: true
          };

          // 1. บันทึกข้อมูลผู้ใช้ใหม่ใน Firestore
          console.log('💾 Creating new user profile in Firestore...');
          await firebaseService.createUserProfile(userProfile);
          console.log('✅ User profile created in Firestore');
          
          // 2. อัปเดทเวลาล็อกอินล่าสุด
          console.log('💾 Updating last login time...');
          await firebaseService.updateUserLastLogin(user.uid);
          
          // 3. ตั้งค่าพื้นฐานเพิ่มเติมสำหรับผู้ใช้ใหม่
          console.log('⚙️ Running additional setup for new user...');
          await autoSetupNewUser(user.uid);
          console.log('📊 Additional setup for new user complete.');

        } catch (error) {
          console.error('❌ Error during new user setup:', error);
          // ยังคงให้ผู้ใช้เข้าถึงแอปได้แม้จะซิงค์ไม่สำเร็จ
          console.log('⚠️ User will still be logged in, but some features may be limited');
        }
        
        navigate('/chatai', { replace: true });
      }
    } catch (error) {
      console.error('❌ Error processing user:', error);
      setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
      // Remove user from processing set
      processingUsers.current.delete(user.uid);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setError('');
    
    try {
      console.log('🚀 Starting Google popup sign in...');
      
      const { signInWithPopup } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      const result = await signInWithPopup(auth, provider);
      console.log('✅ Popup result:', sanitizeUserData(result.user));
      await processUser(result.user);
      
    } catch (error) {
      console.error('❌ Google sign in failed:', error);
      setError('Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-left">
          <div className="login-content">
            <div className="login-logo">
              <div className="logo-circle">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M16 2L20 12H30L22 18L26 28L16 22L6 28L10 18L2 12H12L16 2Z" fill="currentColor"/>
                </svg>
              </div>
            </div>
            
            <h1 className="login-title">Create an Account</h1>
            <p className="login-subtitle">Already have an account? <span className="login-link">Log In</span></p>
            
            {error && (
              <div style={{ 
                color: 'var(--danger)', 
                background: 'rgba(239, 68, 68, 0.1)', 
                padding: '12px', 
                borderRadius: '8px', 
                marginBottom: '1rem',
                fontSize: '14px'
              }}>
                {error}
              </div>
            )}
            
            <div className="login-buttons">
              <button 
                className="login-btn google-btn"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
              >
                <svg width="20" height="20" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                {isLoading ? 'Logging in...' : 'Continue with Google'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="login-right">
          <div className="hero-content">
            <div className="time-ai-logo">
              <div className="logo-animation">
                <svg width="80" height="80" viewBox="0 0 80 80" fill="none">
                  <circle cx="40" cy="40" r="35" stroke="url(#timeGradient)" strokeWidth="3" opacity="0.3"/>
                  <circle cx="40" cy="40" r="25" fill="url(#timeGradient)" opacity="0.8"/>
                  <path d="M40 20 L40 40 L55 50" stroke="white" strokeWidth="3" strokeLinecap="round"/>
                  <defs>
                    <linearGradient id="timeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#10A37F"/>
                      <stop offset="100%" stopColor="#063D30"/>
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <h2 className="hero-title">Time AI</h2>
            <p className="hero-subtitle">Your Smartest AI Assistant</p>
            <div className="hero-mockup">
              <div className="mockup-browser">
                <div className="browser-header">
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f57' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ffbd2e' }}></div>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#28ca42' }}></div>
                  </div>
                </div>
                <div className="time-ai-preview">
                  <div className="chat-preview">
                    <div className="chat-message user-message">
                      <div className="message-bubble">Hello Time AI</div>
                    </div>
                    <div className="chat-message ai-message">
                      <div className="ai-avatar">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                          <circle cx="12" cy="12" r="10" fill="url(#aiGradient)"/>
                          <path d="M12 6 L12 12 L16 14" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                          <defs>
                            <linearGradient id="aiGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#10A37F"/>
                              <stop offset="100%" stopColor="#063D30"/>
                            </linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <div className="message-bubble">Hello! I'm ready to help you with anything - answering questions, analyzing data, or creating new ideas.</div>
                    </div>
                    <div className="typing-indicator">
                      <div className="typing-dots">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="hero-features">
              <div className="feature-item">
                <div className="feature-icon">🧠</div>
                <span>Smart AI</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <span>Fast Response</span>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🔒</div>
                <span>Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;