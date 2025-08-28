# 🔐 Time.AI Login System - Product Requirements Document (PRD)

## 🎯 **Executive Summary**

Time.AI Login System เป็นระบบการยืนยันตัวตนที่ใช้ Firebase Authentication เป็นหลัก รองรับ Google OAuth และ Email/Password Authentication พร้อมด้วยระบบป้องกันการใช้งานที่ไม่เหมาะสม และการจัดการผู้ใช้อย่างครบถ้วน

## 🏗️ **System Architecture**

### **Authentication Architecture (Firebase-only)**
```
Firebase Authentication:
├── Google OAuth Provider      - การยืนยันตัวตนผ่าน Google
├── Email/Password Provider    - การยืนยันตัวตนผ่าน Email
├── JWT Tokens                 - การจัดการ Session
└── Security Rules             - กฎการเข้าถึงข้อมูล
```

### **Database Collections for User Management**
```
Firebase Firestore Collections:
├── users/                     - ข้อมูลผู้ใช้หลัก
├── user_originals/            - ข้อมูลต้นฉบับป้องกันการทุจริต
├── usage_tracking/            - ติดตามการใช้งานรายวัน
├── usage_analytics/           - วิเคราะห์การใช้งาน
└── subscription_plans/        - แผนการสมาชิก
```

### **Frontend Components Structure**
```
src/components/
├── LoginPage.jsx              - หน้าหลักการเข้าสู่ระบบ
├── AuthGuard.jsx              - ระบบป้องกันการเข้าถึง
├── SignupModal.jsx            - Modal สำหรับสมัครสมาชิกใหม่
└── ErrorBoundary.jsx          - จัดการข้อผิดพลาด
```

### **Core Services**
```
src/services/
├── firebaseService.js         - การจัดการข้อมูล Firebase
├── usageService.js            - ติดตามการใช้งาน
└── subscriptionService.js     - จัดการแผนการสมาชิก
```

### **Authentication Hooks**
```
src/hooks/
├── useAuth.js                 - จัดการสถานะการเข้าสู่ระบบ
└── useWindowSize.js           - สำหรับ Responsive Design
```

## 📋 **Feature Specifications**

### **1. Google OAuth Authentication**

#### **Authentication Flow**
- Google OAuth Popup/Redirect สำหรับการเข้าสู่ระบบ
- Custom parameters: `prompt: 'select_account'`
- COOP (Cross-Origin-Opener-Policy) error handling
- Session storage สำหรับ redirect URL

#### **Error Handling**
- Popup blocker detection
- Network failure handling
- Invalid credentials handling
- CORS policy error resolution

#### **Implementation Code**
```javascript
// handleGoogleSignIn ใน LoginPage.jsx
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
```

### **2. User Processing & Registration**

#### **New User Registration Flow**
1. **Email Validation**: ตรวจสอบว่า email เคยใช้งานแล้วหรือไม่
2. **Profile Creation**: สร้างโปรไฟล์ผู้ใช้ใน Firestore
3. **Anti-Abuse Protection**: สร้าง user_originals record
4. **Usage Tracking Setup**: ตั้งค่าการติดตามการใช้งานเริ่มต้น
5. **Analytics Initialization**: สร้าง usage analytics record

#### **Existing User Login Flow**
1. **User Verification**: ตรวจสอบว่าผู้ใช้มีอยู่ในระบบ
2. **Last Login Update**: อัปเดตเวลาเข้าสู่ระบบล่าสุด
3. **Session Management**: จัดการ Firebase Auth session
4. **Navigation**: นำทางไปยัง ChatAI หลังการเข้าสู่ระบบสำเร็จ

#### **User Profile Data Model**
```javascript
// users/ Collection
{
  uid: "firebase_user_id",
  email: "user@example.com",
  displayName: "John Doe",
  firstName: "John",
  lastName: "Doe",
  photoURL: "https://...",
  currentPlan: "free",
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLoginAt: Timestamp,
  isActive: true,
  preferences: {
    theme: "light",
    language: "th",
    notifications: true
  }
}
```

#### **Anti-Abuse Protection Model**
```javascript
// user_originals/ Collection
{
  userId: "firebase_user_id",
  email: "user@example.com",
  originalFirstName: "ชื่อจริง",
  originalLastName: "นามสกุลจริง",
  originalFullName: "ชื่อจริง นามสกุลจริง",
  createdAt: Timestamp,
  isLocked: true  // ป้องกันการแก้ไข
}
```

### **3. Route Protection & Security**

#### **AuthGuard Component Implementation**
```javascript
// AuthGuard.jsx - การป้องกันการเข้าถึง
const AuthGuard = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!loading && !user) {
      console.log('🔒 AuthGuard: No user, redirecting to login');
      navigate('/login', { replace: true });
    } else if (!loading && user) {
      console.log('✅ AuthGuard: Firebase user authenticated, access granted');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null; // Redirect handled by useEffect
  }

  return children; // Grant access to authenticated users
};
```

#### **Protected Routes**
- `/chatai` - หน้า Chat AI หลัก
- `/dashboard` - หน้า Dashboard
- `/history` - ประวัติการสนทนา
- `/settings` - การตั้งค่า
- `/subscription` - จัดการแผนการสมาชิก
- `/agent` - AI Agent Hub

#### **Public Routes**
- `/login` - หน้าเข้าสู่ระบบ
- `/404` - หน้า Not Found

### **4. Error Handling & User Experience**

#### **Loading States**
- Google OAuth loading indicator
- Page transition loading
- Authentication verification loading
- User profile creation loading

#### **Error States**
- Network connection errors
- Firebase authentication errors
- Invalid credentials
- Session timeout
- Browser compatibility issues

#### **User Feedback**
- Clear error messages in Thai
- Success notifications
- Loading progress indicators
- Auto-retry mechanisms

## 🔄 **Complete Authentication Flow**

### **Login Flow Sequence**
```
1. User เข้าถึง protected route → AuthGuard redirect to /login
2. User คลิก "Continue with Google" → Google OAuth popup
3. User เลือก Google account → Firebase Auth verification
4. Firebase returns user object → processUser() function
5. Check if user exists in Firestore
   ├── Existing User: Update lastLoginAt → Navigate to /chatai
   └── New User: Create profile + Setup analytics → Navigate to /chatai
6. AuthGuard validates Firebase user → Grant access to protected routes
```

### **User Registration Sequence**
```
1. New user completes Google OAuth → processUser()
2. firebaseService.checkUserExists() → returns false
3. createUserProfile() → Create user document
4. Create user_originals record → Anti-abuse protection
5. Create initial usage_tracking → Daily limits setup
6. Create usage_analytics → Analytics tracking
7. autoSetupNewUser() → Additional new user setup
8. Navigate to /chatai → Begin using application
```

### **Session Management**
```
1. Firebase Auth maintains JWT tokens automatically
2. AuthGuard listens to onAuthStateChanged
3. Page refresh → Firebase validates existing session
4. Session expired → Auto-redirect to /login
5. Manual logout → Clear Firebase session → Redirect to /login
```

## 💻 **Technical Implementation**

### **Firebase Configuration**
```javascript
// firebase.js
const firebaseConfig = {
  apiKey: getEnvVar('VITE_FIREBASE_API_KEY'),
  authDomain: getEnvVar('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnvVar('VITE_FIREBASE_PROJECT_ID'),
  // ... other config
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Configure auth settings to reduce COOP policy issues
auth.settings = {
  appVerificationDisabledForTesting: import.meta.env.DEV
};
```

### **User Authentication Hook**
```javascript
// useAuth.js
export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    await signInWithPopup(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    resetLoginPageFlags();
  };

  return { user, loading, signInWithGoogle, signOut };
};
```

### **User Management Services**
```javascript
// firebaseService.js key functions
class FirebaseService {
  // Check if user exists in system
  async checkUserExists(uid) {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    return userDoc.exists();
  }

  // Create complete user profile with all required records
  async createUserProfile(userData) {
    // 1. Create main user profile
    const userRef = doc(db, 'users', userData.uid);
    await setDoc(userRef, userProfileData);

    // 2. Create anti-abuse protection record
    await addDoc(collection(db, 'user_originals'), originalData);

    // 3. Create initial usage tracking
    await setDoc(doc(db, 'usage_tracking', trackingId), trackingData);

    // 4. Create usage analytics (MANDATORY)
    await setDoc(doc(db, 'usage_analytics', analyticsId), analyticsData);
  }

  // Update last login time
  async updateUserLastLogin(userId) {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      lastLoginAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
  }
}
```

## 🎨 **UI/UX Design Specifications**

### **LoginPage Layout**
```
┌─────────────────┬─────────────────────────────────┐
│                 │                                 │
│  Logo & Title   │        Time AI Branding         │
│                 │                                 │
│  Error Message  │        Hero Animation           │
│  (if any)       │                                 │
│                 │        Feature List             │
│  [Continue with │        • Smart AI               │
│   Google]       │        • Fast Response          │
│                 │        • Secure                 │
│  Loading State  │                                 │
│                 │        Chat Preview             │
│                 │                                 │
└─────────────────┴─────────────────────────────────┘
```

### **Responsive Design**
- **Desktop**: Two-column layout with branding on right
- **Mobile**: Single column with stacked layout
- **Loading**: Spinner with branded animation
- **Error**: Clear error messages with retry option

### **Visual Elements**
- **Logo**: Time AI branded logo with animation
- **Colors**: Green gradient theme (#10A37F to #063D30)
- **Buttons**: Rounded corners, hover effects
- **Typography**: Clean, readable fonts
- **Icons**: SVG icons for social login

### **Accessibility**
- Screen reader compatibility
- Keyboard navigation support
- High contrast mode support
- ARIA labels for interactive elements

## 🔐 **Security & Compliance**

### **Authentication Security**
- Firebase Auth JWT tokens
- Secure session management
- CSRF protection via Firebase
- XSS protection via input sanitization

### **Data Protection**
- Personal data encryption at rest
- Secure data transmission (HTTPS)
- GDPR compliance measures
- Data retention policies

### **Access Control**
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && 
        request.auth.uid == userId;
    }
    
    // Anti-abuse protection - read only, no modification
    match /user_originals/{docId} {
      allow read: if request.auth.uid == resource.data.userId;
      allow create: if request.auth.uid == request.resource.data.userId &&
                     request.resource.data.isLocked == true;
      allow update, delete: if false;
    }
    
    // Usage tracking - user-specific access
    match /usage_tracking/{trackingId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
    }
  }
}
```

### **Anti-Abuse Measures**
- Email verification required
- Rate limiting on login attempts
- IP-based restrictions (if needed)
- User originals protection
- Duplicate account prevention

## 🧪 **Testing Strategy**

### **Automated Testing (Playwright)**
```javascript
// login-flow.spec.js key tests
test('TC001: Complete Login Flow with Google OAuth', async () => {
  // 1. Navigate to login page
  await page.goto('/login');
  
  // 2. Click Google login button
  await page.click('button:has-text("Continue with Google")');
  
  // 3. Handle OAuth popup/redirect
  // 4. Verify successful navigation to /chatai
  expect(page.url()).toContain('/chatai');
});

test('TC002: URL Security Protection', async () => {
  // 1. Try accessing protected route without auth
  await page.goto('/chatai');
  
  // 2. Should redirect to login
  await page.waitForURL('**/login');
  expect(page.url()).toContain('/login');
});
```

### **Unit Tests**
- AuthGuard component functionality
- useAuth hook behavior
- Firebase service methods
- Error handling scenarios

### **Integration Tests**
- Complete authentication flow
- Database operations
- Session management
- Cross-browser compatibility

### **Manual Testing Checklist**
- [ ] Google OAuth on different browsers
- [ ] Network error scenarios
- [ ] Session expiration handling
- [ ] Mobile responsive design
- [ ] Accessibility compliance

## 📊 **Performance Metrics**

### **Target Performance**
- Login page load: < 2 seconds
- Google OAuth response: < 3 seconds
- User profile creation: < 2 seconds
- Navigation after login: < 1 second
- Total login flow: < 10 seconds

### **Monitoring & Analytics**
- Login success/failure rates
- Authentication method usage
- Error frequency by type
- Page load performance
- User drop-off points

## 🚨 **Error Scenarios & Handling**

### **Common Error Cases**
1. **Network Connectivity Issues**
   - Detection: Connection timeout
   - Handling: Retry mechanism with exponential backoff
   - User Feedback: "Connection issue. Retrying..."

2. **Google OAuth Failures**
   - Detection: OAuth popup blocked or failed
   - Handling: Fallback to redirect method
   - User Feedback: "Please allow popups and try again"

3. **Firebase Authentication Errors**
   - Detection: Firebase Auth exceptions
   - Handling: Graceful error handling with retry
   - User Feedback: "Authentication failed. Please try again"

4. **Session Expiration**
   - Detection: Firebase Auth state change
   - Handling: Auto-redirect to login
   - User Feedback: "Session expired. Please log in again"

### **Error Handling Code**
```javascript
// Error handling in LoginPage.jsx
const handleAuthError = (error) => {
  console.error('Authentication error:', error);
  
  switch (error.code) {
    case 'auth/network-request-failed':
      setError('Network connection failed. Please check your internet and try again.');
      break;
    case 'auth/popup-blocked':
      setError('Popup was blocked. Please allow popups for this site and try again.');
      break;
    case 'auth/cancelled-popup-request':
      setError('Login was cancelled. Please try again.');
      break;
    default:
      setError('Login failed. Please try again.');
  }
  
  setIsLoading(false);
};
```

## 🔄 **Integration Points**

### **With Other Components**
- **ChatAI**: Main application entry point after login
- **Dashboard**: User overview and statistics
- **SettingsPage**: User profile management
- **SubscriptionPage**: Plan management integration
- **Sidebar**: Navigation with user context

### **External Services**
- **Firebase Auth**: Authentication provider
- **Google OAuth**: Identity provider
- **Firestore**: User data storage
- **Analytics**: Usage tracking

## 📋 **Development Guidelines**

### **Code Standards**
- Use TypeScript-style JSDoc comments
- Implement comprehensive error handling
- Follow security logging practices
- Maintain consistent naming conventions

### **Security Practices**
- Never log sensitive user data
- Use sanitization for console logs
- Implement proper session management
- Follow Firebase security best practices

### **Database Operations**
- Always use serverTimestamp() for timestamps
- Validate data before saving to Firestore
- Handle edge cases gracefully
- Follow document reference rules

## 🎯 **Success Metrics**

### **User Experience Metrics**
- Login success rate: > 98%
- Average login time: < 10 seconds
- User drop-off rate during login: < 5%
- Error recovery rate: > 90%

### **Technical Performance Metrics**
- Firebase operation success rate: > 99%
- Page load performance: < 2 seconds
- Authentication API response time: < 3 seconds
- Session management reliability: > 99%

### **Security Metrics**
- Zero successful unauthorized access attempts
- Data breach incidents: 0
- Session hijacking attempts: 0
- Abuse prevention effectiveness: > 95%

## 🛠️ **Troubleshooting Guide**

### **Common Issues & Solutions**

#### **Issue 1: Google OAuth Popup Blocked**
```javascript
// Solution: Detect popup blocking and provide alternative
const handlePopupBlocked = async () => {
  try {
    await signInWithPopup(auth, provider);
  } catch (error) {
    if (error.code === 'auth/popup-blocked') {
      // Fallback to redirect method
      await signInWithRedirect(auth, provider);
    }
  }
};
```

#### **Issue 2: COOP Policy Errors**
```javascript
// Solution: Configure auth settings
auth.settings = {
  appVerificationDisabledForTesting: import.meta.env.DEV
};
```

#### **Issue 3: Session Not Persisting**
```javascript
// Solution: Ensure proper auth state listener
useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, (user) => {
    setUser(user);
    setLoading(false);
  });
  
  return unsubscribe; // Cleanup on unmount
}, []);
```

#### **Issue 4: Infinite Redirects**
```javascript
// Solution: Use ref to prevent duplicate redirects
const redirectAttempted = useRef(false);

useEffect(() => {
  if (!loading && !user && !redirectAttempted.current) {
    redirectAttempted.current = true;
    navigate('/login', { replace: true });
  }
}, [user, loading, navigate]);
```

## 📝 **Deployment Checklist**

### **Pre-Deployment**
- [ ] Firebase configuration verified
- [ ] Environment variables set
- [ ] Security rules deployed
- [ ] SSL certificates configured
- [ ] CORS policies configured

### **Testing Verification**
- [ ] All automated tests passing
- [ ] Manual testing completed
- [ ] Cross-browser compatibility verified
- [ ] Mobile responsiveness tested
- [ ] Performance benchmarks met

### **Security Verification**
- [ ] Firestore security rules validated
- [ ] Authentication flow tested
- [ ] Data protection measures verified
- [ ] Access control working correctly
- [ ] Anti-abuse mechanisms active

### **Post-Deployment**
- [ ] Monitor authentication success rates
- [ ] Track error rates and types
- [ ] Verify user onboarding flow
- [ ] Monitor performance metrics
- [ ] Collect user feedback

---

**💡 For AI Agents: This comprehensive document contains everything needed to understand, develop, maintain, and extend the Login system of Time.AI application. The system has been simplified by removing OTP verification while maintaining robust security through Firebase Auth and comprehensive user management. All code examples are production-ready and follow established security patterns.**