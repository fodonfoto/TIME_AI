# Settings System PRD (Product Requirements Document)

## 1. ภาพรวมและวัตถุประสงค์

### ข้อมูลโปรเจกต์
- **ชื่อ**: Time AI - Settings System
- **เป้าหมาย**: ระบบจัดการบัญชีผู้ใช้ การแสดงแผนสมาชิก และการออกจากระบบ
- **ผู้ใช้**: ผู้ใช้ Time AI ที่ต้องการจัดการบัญชีและเปลี่ยนแผนสมาชิก
- **ปัญหาที่แก้ไข**: การจัดการข้อมูลโปรไฟล์ แสดงแผนสมาชิก และการออกจากระบบปลอดภัย

### ฟีเจอร์หลัก
- แสดงข้อมูลโปรไฟล์ผู้ใช้ (ชื่อ, อีเมล, วันที่เข้าร่วม)
- แสดงแผนสมาชิกทั้งหมดพร้อมราคาและฟีเจอร์
- ระบุแผนปัจจุบันและปุ่ม upgrade
- Modal การออกจากระบบพร้อมยืนยัน
- Lottie animated icons และ responsive design

## 2. สถาปัตยกรรมเทคนิค

### เทคโนโลยีหลัก
```
Frontend: React 18+ with Hooks
Database: Firebase Cloud Firestore
Authentication: Firebase Auth
Styling: CSS Variables + Index.css
Date: date-fns library
Icons: Lottie React
```

### Database Schema
```javascript
// users collection
{
  uid: "firebase-user-uid",
  displayName: "User Name", 
  email: "user@example.com",
  currentPlan: "free|pro|max",
  createdAt: "timestamp"
}

// subscription_plans collection  
{
  planId: "free|pro|max",
  name: "Plan Name",
  prices: { monthly: { amount: 0, currency: "usd" } },
  limits: { dailyRequests: 10 },
  features: ["basic_chat", "file_analysis"],
  isActive: true
}
```

## 3. Implementation หลัก

### SettingsPage Component
```jsx
// SettingsPage.jsx - Main Component (308 lines)
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import firebaseService from '../services/firebaseService';
import { sanitizeForLog } from '../utils/logSanitizer';

const SettingsPage = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [joinDate, setJoinDate] = useState('January 2024');
  const [planConfigs, setPlanConfigs] = useState({});
  const [currentUserPlan, setCurrentUserPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState(null);
  
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  // Format Join Date
  useEffect(() => {
    if (userProfile?.createdAt) {
      try {
        const date = userProfile.createdAt.toDate ? 
          userProfile.createdAt.toDate() : new Date(userProfile.createdAt);
        setJoinDate(format(date, 'dd/MM/yyyy'));
      } catch (error) {
        console.error('Error formatting join date:', error);
        setJoinDate('Unknown');
      }
    } else if (user?.metadata?.creationTime) {
      try {
        const date = new Date(user.metadata.creationTime);
        setJoinDate(format(date, 'dd/MM/yyyy'));
      } catch (error) {
        setJoinDate('Unknown');
      }
    }
  }, [userProfile, user]);

  // Load Plan Data
  useEffect(() => {
    const loadPlanData = async () => {
      try {
        setLoading(true);
        const [configs, userPlan, profile] = await Promise.all([
          firebaseService.getSubscriptionPlans(),
          firebaseService.getUserCurrentPlan(user?.uid),
          firebaseService.getUserProfile(user?.uid)
        ]);
        
        setPlanConfigs(configs);
        setCurrentUserPlan(userPlan);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error loading plan data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
      loadPlanData();
    }
  }, [user?.uid]);

  // Utility Functions
  const getUserInitials = () => {
    if (!user) return 'GU';
    if (user.displayName) {
      return user.displayName.split(' ')
        .map(name => name[0]).join('').toUpperCase().substring(0, 2);
    }
    return user.email ? user.email.substring(0, 2).toUpperCase() : 'GU';
  };

  const getUserName = () => {
    if (!user) return 'Guest User';
    return userProfile?.displayName || user.displayName || 
           user.email?.split('@')[0] || 'User';
  };

  const getUserEmail = () => {
    if (!user) return 'guest@example.com';
    return userProfile?.email || user.email || 'user@example.com';
  };

  // Event Handlers
  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleUpgrade = (planId) => {
    console.log(`Upgrading to ${sanitizeForLog(planId)} plan`);
    // TODO: Implement upgrade logic
  };

  const renderPlanAction = (plan, isCurrentPlan) => {
    if (isCurrentPlan) {
      return (
        <button className="btn current-plan-btn" disabled>
          Your Current Plan
        </button>
      );
    }
    return (
      <button className="btn btn-primary upgrade-btn" 
        onClick={() => handleUpgrade(plan.planId)}>
        Upgrade to {plan.name}
      </button>
    );
  };

  return (
    <div className="settings-page">
      {/* Header */}
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Manage your account and preferences</p>
      </div>

      {/* Profile Section */}
      <div className="profile-section">
        <div className="profile-info">
          <div className="profile-avatar">{getUserInitials()}</div>
          <div>
            <h2 className="profile-name">{getUserName()}</h2>
            <p className="profile-email">{getUserEmail()}</p>
          </div>
        </div>
        
        <div className="profile-stats">
          <div className="profile-stat-card">
            <div className="profile-stat-label">Account Status</div>
            <div className="profile-stat-value success">✓ Verified</div>
          </div>
          <div className="profile-stat-card">
            <div className="profile-stat-label">Joined</div>
            <div className="profile-stat-value">{joinDate}</div>
          </div>
        </div>
      </div>

      {/* Subscription Section */}
      <div className="subscription-section">
        <div className="subscription-header">
          <div className="subscription-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white">
              <path d="M12 2L15.09 8.26L22 9L17 14L18.18 21L12 17.77L5.82 21L7 14L2 9L8.91 8.26L12 2Z" />
            </svg>
          </div>
          <div>
            <h2 className="subscription-title">Subscription Plans</h2>
            <p className="subscription-description">Choose the plan that's right for you</p>
          </div>
        </div>

        <div className="subscription-plans">
          {loading ? (
            <div className="loading-plans"><p>Loading plans...</p></div>
          ) : (
            Object.values(planConfigs)
              .filter(plan => plan.isActive)
              .sort((a, b) => (a.prices?.monthly?.amount || 0) - (b.prices?.monthly?.amount || 0))
              .map((plan) => {
                const normalizedCurrentPlan = currentUserPlan?.toLowerCase();
                const isCurrentPlan = plan.planId === normalizedCurrentPlan || 
                                    plan.planId === currentUserPlan ||
                                    (plan.planId === 'free' && 
                                     (normalizedCurrentPlan === 'free' || normalizedCurrentPlan === 'free plan'));

                return (
                  <div key={plan.planId} className={`subscription-plan ${isCurrentPlan ? 'current' : ''}`}>
                    <div className="subscription-plan-info">
                      <div className="subscription-plan-header">
                        <h3 className="subscription-plan-name">{plan.name}</h3>
                        <span className="subscription-plan-price">
                          ${(plan.prices?.monthly?.amount || 0) / 100}/month
                        </span>
                        <span className="subscription-plan-limit">
                          {plan.limits?.dailyRequests === -1 ? 'unlimited' : 
                           `${plan.limits?.dailyRequests || 10} requests/day`}
                        </span>
                      </div>
                      <div className={`subscription-plan-features ${plan.planId}-plan`}>
                        {plan.planId === 'free' && (
                          <>• Basic Agent Chat<br/>• File Analysis<br/>• Generate Image<br/>• Generate AI</>
                        )}
                        {plan.planId === 'pro' && (
                          <>• Advance Agent Chat<br/>• File Analysis<br/>• Code Analysis<br/>• Generate Image<br/>• Generate AI<br/>• Connect Tools</>
                        )}
                        {plan.planId === 'max' && (
                          <>• All Pro features<br/>• Priority Support<br/>• Cerebras AI<br/>• Unlimited requests</>
                        )}
                      </div>
                    </div>
                    {renderPlanAction(plan, isCurrentPlan)}
                  </div>
                );
              })
          )}
        </div>
      </div>

      {/* Logout Button */}
      <button className="btn btn-danger w-full justify-center mt-8"
        onClick={() => setShowLogoutModal(true)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16,17 21,12 16,7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Logout
      </button>

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" 
                onClick={() => setShowLogoutModal(false)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleLogout}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
```

### SettingsIcon Component
```jsx
// SettingsIcon.jsx - Lottie Animation (46 lines)
import { useRef, useEffect } from 'react'
import Lottie from 'lottie-react'
import settingsAnimation from '../assets/setting.json'

const SettingsIcon = ({ width = 20, height = 20, isParentHovered = false }) => {
  const lottieRef = useRef()

  useEffect(() => {
    if (lottieRef.current) {
      if (isParentHovered) {
        lottieRef.current.play()
      } else {
        lottieRef.current.stop()
        lottieRef.current.goToAndStop(0, true)
      }
    }
  }, [isParentHovered])

  return (
    <div className="settings-icon" style={{ width, height }}>
      <Lottie
        lottieRef={lottieRef}
        animationData={settingsAnimation}
        loop={true}
        autoplay={false}
        style={{ width, height }}
      />
    </div>
  )
}

export default SettingsIcon
```

## 4. Firebase Integration

### Service Methods
```javascript
// firebaseService.js - Settings related methods
export const settingsService = {
  // Get subscription plans
  async getSubscriptionPlans() {
    try {
      const plansSnapshot = await getDocs(collection(db, 'subscription_plans'));
      const plans = {};
      plansSnapshot.forEach(doc => {
        plans[doc.id] = { planId: doc.id, ...doc.data() };
      });
      return plans;
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
      return {};
    }
  },

  // Get user current plan
  async getUserCurrentPlan(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        return userData.currentPlan || 'free';
      }
      return 'free';
    } catch (error) {
      console.error('Error getting user current plan:', error);
      return 'free';
    }
  },

  // Set user current plan
  async setUserCurrentPlan(userId, planId) {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        currentPlan: planId,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error setting user current plan:', error);
      return false;
    }
  },

  // Get user profile
  async getUserProfile(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }
};
```

### Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /subscription_plans/{planId} {
      allow read: if request.auth != null;
      allow write: if false; // Admin only
    }
  }
}
```

## 5. CSS Implementation

### Settings Styles
```css
:root {
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --border: #e1e5e9;
  --accent: #10A37F;
  --danger: #ef4444;
  --brand-gradient: linear-gradient(135deg, #10A37F 0%, #4ade80 100%);
  --border-radius: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --transition: all 0.2s ease;
}

.settings-page {
  padding: 64px 0px;
  max-width: 1000px;
  width: 100%;
  margin: 0 auto;
  background: transparent;
}

.settings-header {
  margin-bottom: 3rem;
  text-align: center;
}

.settings-title {
  font-size: 2.5rem;
  font-weight: 700;
  background: var(--brand-gradient);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  margin-bottom: 0.5rem;
}

.profile-section {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--border);
}

.profile-info {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-md);
}

.profile-avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: var(--brand-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
}

.subscription-section {
  background: var(--bg-secondary);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-lg);
  border: 1px solid var(--border);
}

.subscription-plan {
  background: var(--bg-primary);
  border: 2px solid var(--border);
  border-radius: var(--border-radius);
  padding: var(--spacing-lg);
  transition: var(--transition);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.subscription-plan.current {
  border-color: var(--accent);
  background: rgba(16, 163, 127, 0.05);
}

.btn {
  padding: 10px 16px;
  border-radius: var(--border-radius);
  border: none;
  cursor: pointer;
  font-weight: 500;
  transition: var(--transition);
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn-primary {
  background: var(--brand-gradient);
  color: white;
}

.btn-danger {
  background: var(--danger);
  color: white;
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-primary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 90%;
}

@media (max-width: 768px) {
  .settings-page { padding: var(--spacing-md); }
  .subscription-plan { flex-direction: column; gap: var(--spacing-md); }
}
```

## 6. Testing และ Validation

### Unit Tests
```javascript
// SettingsPage.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SettingsPage from '../SettingsPage';
import { useAuth } from '../../hooks/useAuth';
import firebaseService from '../../services/firebaseService';

jest.mock('../../hooks/useAuth');
jest.mock('../../services/firebaseService');

const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User'
};

const mockPlanConfigs = {
  free: {
    planId: 'free',
    name: 'Free Plan',
    prices: { monthly: { amount: 0 } },
    limits: { dailyRequests: 10 },
    isActive: true
  },
  pro: {
    planId: 'pro',
    name: 'Pro Plan', 
    prices: { monthly: { amount: 1500 } },
    limits: { dailyRequests: 100 },
    isActive: true
  }
};

describe('SettingsPage', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({
      user: mockUser,
      signOut: jest.fn()
    });
    
    firebaseService.getSubscriptionPlans.mockResolvedValue(mockPlanConfigs);
    firebaseService.getUserCurrentPlan.mockResolvedValue('free');
    firebaseService.getUserProfile.mockResolvedValue({
      displayName: 'Test User',
      email: 'test@example.com'
    });
  });

  test('renders user profile information', async () => {
    render(<BrowserRouter><SettingsPage /></BrowserRouter>);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  test('displays subscription plans correctly', async () => {
    render(<BrowserRouter><SettingsPage /></BrowserRouter>);
    
    await waitFor(() => {
      expect(screen.getByText('Free Plan')).toBeInTheDocument();
      expect(screen.getByText('Pro Plan')).toBeInTheDocument();
      expect(screen.getByText('$0/month')).toBeInTheDocument();
      expect(screen.getByText('$15/month')).toBeInTheDocument();
    });
  });

  test('shows current plan correctly', async () => {
    render(<BrowserRouter><SettingsPage /></BrowserRouter>);
    
    await waitFor(() => {
      const freePlanSection = screen.getByText('Free Plan').closest('.subscription-plan');
      expect(freePlanSection).toHaveClass('current');
      expect(screen.getByText('Your Current Plan')).toBeInTheDocument();
    });
  });

  test('logout modal functionality', async () => {
    const mockSignOut = jest.fn();
    useAuth.mockReturnValue({ user: mockUser, signOut: mockSignOut });
    
    render(<BrowserRouter><SettingsPage /></BrowserRouter>);
    
    fireEvent.click(screen.getByText('Logout'));
    expect(screen.getByText('Confirm Logout')).toBeInTheDocument();
    
    fireEvent.click(screen.getByRole('button', { name: 'Logout' }));
    
    await waitFor(() => {
      expect(mockSignOut).toHaveBeenCalled();
    });
  });
});
```

## 7. Troubleshooting Guide

### ปัญหาทั่วไปและวิธีแก้ไข

#### 1. แผนสมาชิกไม่แสดงผล
```javascript
// ตรวจสอบ planConfigs state และ Firebase connection
console.log('planConfigs:', planConfigs);
if (Object.keys(planConfigs).length === 0) {
  const configs = await firebaseService.getSubscriptionPlans();
  setPlanConfigs(configs);
}
```

#### 2. ข้อมูลผู้ใช้ไม่แสดง
```javascript
// เช็ค user profile loading
if (!userProfile && user?.uid) {
  const profile = await firebaseService.getUserProfile(user.uid);
  setUserProfile(profile);
}
```

#### 3. วันที่ไม่แสดงถูกต้อง
```javascript
// ตรวจสอบ date formatting
const formatDate = (timestamp) => {
  if (!timestamp) return 'Unknown';
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
  return format(date, 'dd/MM/yyyy');
};
```

## 8. Development Checklist

### ขั้นตอนการพัฒนา
- [ ] ติดตั้ง dependencies: React, Firebase, date-fns, React Router, Lottie React
- [ ] สร้าง SettingsPage component พร้อม state management
- [ ] สร้าง SettingsIcon component พร้อม Lottie animation
- [ ] Integration กับ Firebase service methods
- [ ] เพิ่ม CSS styling และ responsive design  
- [ ] Implement logout modal และ confirmation
- [ ] เขียน unit tests และ integration tests
- [ ] ตรวจสอบ accessibility และ browser compatibility

### การใช้งานในโปรเจกต์
```jsx
// App.jsx integration
import SettingsPage from './components/SettingsPage';

// Route setup
<Route path="/settings" element={<SettingsPage />} />

// Sidebar navigation
import SettingsIcon from './components/SettingsIcon';

<div className="menu-item" onClick={() => navigate('/settings')}>
  <SettingsIcon width={20} height={20} isParentHovered={hoveredItem === 'settings'} />
  <span>Settings</span>
</div>
```

## 9. สรุปและเป้าหมาย

ระบบ Settings Page นี้ได้รับการออกแบบให้เป็น production-ready component ที่:
- แสดงข้อมูลผู้ใช้และแผนสมาชิกอย่างครบถ้วน
- รองรับการเปลี่ยนแผนและการออกจากระบบ
- มี Lottie animations และ responsive design
- เข้ากันได้กับระบบ Firebase และ authentication
- ครอบคลุมด้วย unit tests และ error handling

AI agents สามารถใช้เอกสารนี้เป็น context เพื่อพัฒนา ปรับปรุง หรือแก้ไขระบบ Settings Page ได้อย่างครบถ้วนและมีประสิทธิภาพ