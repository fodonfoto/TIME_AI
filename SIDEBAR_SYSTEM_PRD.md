# Sidebar System PRD (Product Requirements Document)

## 1. ภาพรวมและวัตถุประสงค์

### ข้อมูลโปรเจกต์
- **ชื่อ**: Time AI - Sidebar Navigation System  
- **เป้าหมาย**: ระบบนำทางหลักของแอปพลิเคชัน Time AI
- **ผู้ใช้**: ผู้ใช้ Time AI ทุกระดับ
- **ปัญหาที่แก้ไข**: การจัดระเบียบเมนูนำทาง แสดงข้อมูลผู้ใช้ และการตอบสนองแบบ responsive

### ฟีเจอร์หลัก
- เมนูนำทางหลัก 5 รายการ (Dashboard, Chat, History, Agent, Settings)
- แสดงข้อมูลผู้ใช้แบบ real-time จาก Firestore
- ปุ่ม toggle สำหรับซ่อน/แสดง sidebar
- Lottie animated icons ที่ตอบสนองการ hover
- การออกแบบ responsive สำหรับ mobile และ desktop

## 2. สถาปัตยกรรมเทคนิค

### เทคโนโลยีหลัก
```
Frontend: React 18+ with Hooks
Navigation: React Router v6
Authentication: Firebase Auth + useAuth hook
Database: Firebase Cloud Firestore
Styling: CSS Variables + index.css
Icons: Lottie React animations
```

### โครงสร้างไฟล์หลัก
```
src/components/
├── Sidebar.jsx              - คอมโพเนนต์หลัก (410 บรรทัด)
├── DashboardIcon.jsx        - Lottie icon (43 บรรทัด)
├── ChatIcon.jsx             - Lottie icon (43 บรรทัด)
├── HistoryIcon.jsx          - Lottie icon (43 บรรทัด)
├── AgentIcon.jsx            - Lottie icon (45 บรรทัด)
└── SettingsIcon.jsx         - Lottie icon (44 บรรทัด)

src/assets/
├── dashboard-animation.json, chat.json, history.json,
├── agent.json, setting.json
```

## 3. Implementation หลัก

### Sidebar Component (410 บรรทัด)
```jsx
import { useRef, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth';
import DashboardIcon from './DashboardIcon'
import SettingsIcon from './SettingsIcon'
import ChatIcon from './ChatIcon'
import HistoryIcon from './HistoryIcon'
import AgentIcon from './AgentIcon'
import firebaseService from '../services/firebaseService'

// Dynamic CSS สำหรับ Lottie Icons
const iconAnimations = `
  .dashboard-icon, .chat-icon, .history-icon, .agent-icon, .settings-icon {
    filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
    opacity: 0.7;
  }
  .menu-item.active .dashboard-icon, .menu-item:hover .dashboard-icon,
  .menu-item.active .chat-icon, .menu-item:hover .chat-icon,
  .menu-item.active .history-icon, .menu-item:hover .history-icon,
  .menu-item.active .agent-icon, .menu-item:hover .agent-icon,
  .menu-item.active .settings-icon, .menu-item:hover .settings-icon {
    opacity: 1;
  }
`;

// Inject CSS
if (typeof document !== 'undefined' && !document.querySelector('#icon-animations')) {
  const style = document.createElement('style')
  style.id = 'icon-animations'
  style.textContent = iconAnimations
  document.head.appendChild(style)
}

function Sidebar({ isOpen, onToggle, onNewChat, chatHistory = [] }) {
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Active View Detection
  const getActiveView = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path === '/chatai') return 'chat';
    if (path === '/history') return 'history';
    if (path === '/agent') return 'agent';
    if (path === '/settings') return 'settings';
    return 'dashboard';
  };
  
  // State Management
  const activeView = getActiveView();
  const [hoveredItem, setHoveredItem] = useState(null);
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  
  // Load Firestore User Profile
  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      if (user?.uid) {
        try {
          const profile = await firebaseService.getUserProfile(user.uid);
          if (isMounted) setUserProfile(profile);
        } catch (error) {
          console.error('Failed to load user profile:', error);
          if (isMounted) setUserProfile(null);
        }
      } else {
        if (isMounted) setUserProfile(null);
      }
    };
    loadProfile();
    return () => { isMounted = false; };
  }, [user?.uid]);
  
  // User Profile Utility Functions
  const getUserInitials = () => {
    if (!user && !userProfile) return 'GU';
    let displayName = userProfile?.displayName || user?.displayName;
    if (displayName) {
      return displayName.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    const email = userProfile?.email || user?.email;
    return email ? email.substring(0, 2).toUpperCase() : 'GU';
  };
  
  const getUserName = () => {
    if (!user && !userProfile) return 'Guest User';
    if (userProfile?.displayName) return userProfile.displayName;
    if (user?.displayName) return user.displayName;
    const email = userProfile?.email || user?.email;
    return email ? email.split('@')[0] : 'User';
  };
  
  const getUserEmail = () => {
    return userProfile?.email || user?.email || 'user@example.com';
  };

  // Close Sidebar on Outside Click (Mobile)
  useEffect(() => {
    function handleClickOutside(event) {
      if (window.innerWidth <= 768 && isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onToggle();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onToggle]);

  return (
    <div>
      {/* Mobile Toggle Button */}
      <button className="mobile-toggle-btn" onClick={onToggle}
        style={{ position: 'fixed', top: '10px', left: '10px', zIndex: 101, background: 'var(--brand-gradient)', border: 'none', color: 'white', width: '44px', height: '44px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(0,0,0,0.2)', fontSize: '28px', lineHeight: 1 }}>
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Desktop Toggle Button */}
      <div className={`desktop-toggle-container ${isOpen ? 'open' : 'closed'}`}
        style={{ position: 'fixed', top: '10px', left: isOpen ? '270px' : '10px', zIndex: 101, transition: 'left 0.3s ease-in-out' }}>
        <button className="desktop-toggle-btn" onClick={onToggle}
          style={{ background: 'var(--brand-gradient)', border: 'none', color: 'white', width: '40px', height: '40px', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: '0 2px 5px rgba(6, 61, 48, 0.3)', transition: 'all 0.2s ease-in-out' }}>
          {isOpen ? '◀' : '▶'}
        </button>
      </div>

      {/* Main Sidebar */}
      <div ref={sidebarRef} className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-header-top" style={{ padding: '16px' }}>
            <h2>Time AI</h2>
            <button className="mobile-close-btn" onClick={onToggle}
              style={{ background: 'none', border: 'none', color: 'var(--text-primary)', fontSize: '28px', cursor: 'pointer', padding: '8px', display: 'none', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '4px', marginLeft: 'auto', lineHeight: 1 }}>
              ✕
            </button>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className="sidebar-menu">
          <div className="menu-section">
            <div className={`menu-item ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => navigate('/dashboard')} onMouseEnter={() => setHoveredItem('dashboard')} onMouseLeave={() => setHoveredItem(null)} style={{ cursor: 'pointer' }}>
              <DashboardIcon width={20} height={20} isParentHovered={hoveredItem === 'dashboard'} />
              <span>Dashboard</span>
            </div>
            <div className={`menu-item ${activeView === 'chat' ? 'active' : ''}`}
              onClick={() => navigate('/chatai')} onMouseEnter={() => setHoveredItem('chat')} onMouseLeave={() => setHoveredItem(null)} style={{ cursor: 'pointer' }}>
              <ChatIcon width={20} height={20} isParentHovered={hoveredItem === 'chat'} />
              <span>Chat</span>
            </div>
            <div className={`menu-item ${activeView === 'history' ? 'active' : ''}`}
              onClick={() => navigate('/history')} onMouseEnter={() => setHoveredItem('history')} onMouseLeave={() => setHoveredItem(null)} style={{ cursor: 'pointer' }}>
              <HistoryIcon width={20} height={20} isParentHovered={hoveredItem === 'history'} />
              <span>History</span>
            </div>
            <div className={`menu-item ${activeView === 'agent' ? 'active' : ''}`}
              onClick={() => navigate('/agent')} onMouseEnter={() => setHoveredItem('agent')} onMouseLeave={() => setHoveredItem(null)} style={{ cursor: 'pointer' }}>
              <AgentIcon width={20} height={20} isParentHovered={hoveredItem === 'agent'} />
              <span>Agent</span>
            </div>
            <div className={`menu-item ${activeView === 'settings' ? 'active' : ''}`}
              onClick={() => navigate('/settings')} onMouseEnter={() => setHoveredItem('settings')} onMouseLeave={() => setHoveredItem(null)} style={{ cursor: 'pointer' }}>
              <SettingsIcon width={20} height={20} isParentHovered={hoveredItem === 'settings'} />
              <span>Settings</span>
            </div>
          </div>
        </div>

        {/* User Profile */}
        <div className="user-profile">
          <div className="user-avatar">
            <div className="avatar-initials">{getUserInitials()}</div>
          </div>
          <div className="user-info">
            <div className="user-name">{getUserName()}</div>
            <div className="user-email">{getUserEmail()}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar;
```

### Lottie Icon Components Pattern
```jsx
// Template สำหรับ Icon Components (ทั้ง 5 ตัว)
import { useRef, useEffect } from 'react'
import Lottie from 'lottie-react'
import animationData from '../assets/[icon-name].json'

const IconComponent = ({ width = 20, height = 20, isParentHovered = false }) => {
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
    <div className="[icon-class]" style={{ width, height, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'currentColor' }}>
      <Lottie lottieRef={lottieRef} animationData={animationData} loop={true} autoplay={false} style={{ width, height, filter: 'none' }} />
    </div>
  )
}

export default IconComponent
```

## 4. Firebase Integration

### User Profile Service
```javascript
// firebaseService.js - User profile methods
export const sidebarService = {
  async getUserProfile(userId) {
    try {
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      return userDoc.exists() ? userDoc.data() : null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }
};
```

## 5. CSS Implementation

### Core Styles
```css
:root {
  --text-primary: #ffffff;
  --text-secondary: #b3b3b3;
  --bg-secondary: #2d2d2d;
  --bg-tertiary: #3a3a3a;
  --border: #4a4a4a;
  --brand-gradient: linear-gradient(90deg, #10A37F 0%, #063D30 100.85%);
  --transition: all 0.2s ease;
}

.sidebar {
  width: 260px;
  background-color: var(--bg-secondary);
  color: var(--text-primary);
  display: flex;
  flex-direction: column;
  height: 100vh;
  position: fixed;
  left: 0;
  top: 0;
  z-index: 100;
  transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.sidebar.closed { transform: translateX(-100%); }

.sidebar-menu {
  flex: 1;
  overflow-y: auto;
  padding: 16px 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  color: var(--text-secondary);
  transition: var(--transition);
}

.menu-item:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
}

.menu-item.active {
  background: var(--brand-gradient);
  color: white;
  font-weight: 500;
}

.user-profile {
  display: flex;
  align-items: center;
  padding: 16px;
  background-color: var(--bg-tertiary);
  border-top: 1px solid var(--border);
  gap: 12px;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--brand-gradient);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 16px;
  box-shadow: 0 2px 8px rgba(6, 61, 48, 0.3);
}

/* Responsive Design */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    position: fixed;
    z-index: 1000;
    transform: translateX(-100%);
    transition: transform 0.3s;
  }
  
  .sidebar.open {
    transform: translateX(0);
    box-shadow: 2px 0 10px rgba(0, 0, 0, 0.5);
  }
  
  .sidebar.open .mobile-close-btn { display: flex !important; }
  .mobile-toggle-btn { display: flex !important; }
  .desktop-toggle-btn { display: none !important; }
}

@media (min-width: 769px) {
  .mobile-toggle-btn { display: none !important; }
}
```

## 6. App.jsx Integration

### Layout Configuration
```jsx
// App.jsx - Sidebar integration
import Sidebar from './components/Sidebar';

function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={
          <AuthGuard>
            <div className="app" style={{ display: 'flex', height: '100vh' }}>
              <Sidebar isOpen={isSidebarOpen} onToggle={toggleSidebar} />
              
              {/* Mobile Overlay */}
              {isSidebarOpen && window.innerWidth <= 768 && (
                <div className="sidebar-overlay" onClick={toggleSidebar}
                  style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', zIndex: 99 }} />
              )}
              
              {/* Main Content */}
              <div className="main-content"
                style={{
                  flex: 1, marginLeft: isSidebarOpen ? '260px' : '50px',
                  width: isSidebarOpen ? 'calc(100% - 260px)' : 'calc(100% - 50px)',
                  transition: 'margin-left 0.3s ease-in-out, width 0.3s ease-in-out',
                  position: 'relative', overflowY: 'auto', height: '100vh',
                  padding: '20px', boxSizing: 'border-box'
                }}>
                <Routes>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/chatai" element={<ChatAI />} />
                  <Route path="/history" element={<HistoryPage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/agent" element={<AgentPage />} />
                  <Route path="*" element={<Navigate to="/chatai" replace />} />
                </Routes>
              </div>
            </div>
          </AuthGuard>
        } />
      </Routes>
    </Router>
  );
}
```

## 7. Testing และ Validation

### Unit Tests
```javascript
// Sidebar.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Sidebar from '../Sidebar';
import { useAuth } from '../../hooks/useAuth';

jest.mock('../../hooks/useAuth');
jest.mock('../../services/firebaseService');

const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User'
};

describe('Sidebar', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: mockUser });
  });

  test('renders navigation menu items', () => {
    render(<BrowserRouter><Sidebar isOpen={true} onToggle={jest.fn()} /></BrowserRouter>);
    
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('History')).toBeInTheDocument();
    expect(screen.getByText('Agent')).toBeInTheDocument();
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  test('displays user information', () => {
    render(<BrowserRouter><Sidebar isOpen={true} onToggle={jest.fn()} /></BrowserRouter>);
    
    expect(screen.getByText('Test User')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  test('toggle functionality works', () => {
    const mockToggle = jest.fn();
    render(<BrowserRouter><Sidebar isOpen={true} onToggle={mockToggle} /></BrowserRouter>);
    
    const toggleButton = screen.getByText('◀');
    fireEvent.click(toggleButton);
    
    expect(mockToggle).toHaveBeenCalled();
  });
});
```

## 8. Troubleshooting Guide

### ปัญหาทั่วไปและวิธีแก้ไข

#### 1. ไอคอน Lottie ไม่แสดงผล
```javascript
// ตรวจสอบไฟล์ animation JSON
import animationData from '../assets/animation.json';
console.log('Animation data:', animationData);

// ตรวจสอบ Lottie ref
useEffect(() => {
  console.log('Lottie ref:', lottieRef.current);
}, []);
```

#### 2. Sidebar ไม่ปิดบน mobile
```javascript
// ตรวจสอบ event listener
useEffect(() => {
  function handleClickOutside(event) {
    console.log('Click outside detected:', event.target);
    // implementation
  }
}, []);
```

#### 3. User profile ไม่แสดงข้อมูล
```javascript
// ตรวจสอบ Firebase connection
const loadProfile = async () => {
  try {
    const profile = await firebaseService.getUserProfile(user.uid);
    console.log('Profile loaded:', profile);
    setUserProfile(profile);
  } catch (error) {
    console.error('Profile load error:', error);
  }
};
```

## 9. Development Checklist

### ขั้นตอนการพัฒนา
- [ ] ติดตั้ง dependencies: React Router, Lottie React, Firebase
- [ ] สร้าง Sidebar component พร้อม navigation logic
- [ ] สร้าง Lottie Icon components (5 ตัว)
- [ ] เพิ่ม CSS styling และ responsive design
- [ ] Integration กับ Firebase user profiles
- [ ] ตั้งค่า routing ใน App.jsx
- [ ] เขียน unit tests และ integration tests
- [ ] ตรวจสอบ accessibility และ performance

### การใช้งานในโปรเจกต์
```jsx
// การใช้งาน Sidebar ใน App.jsx
<Sidebar 
  isOpen={isSidebarOpen}
  onToggle={toggleSidebar}
  onNewChat={handleNewChat}
  chatHistory={chatHistory}
/>
```

## 10. สรุปและเป้าหมาย

ระบบ Sidebar Navigation นี้ได้รับการออกแบบให้เป็น production-ready component ที่:
- ให้การนำทางที่ใช้งานง่ายและสวยงาม
- รองรับการใช้งานบน mobile และ desktop
- แสดงข้อมูลผู้ใช้แบบ real-time จาก Firestore
- มี Lottie animations ที่ตอบสนองและน่าสนใจ
- เข้ากันได้กับระบบ Firebase และ authentication
- ครอบคลุมด้วย unit tests และ error handling

AI agents สามารถใช้เอกสารนี้เป็น context เพื่อพัฒนา ปรับปรุง หรือแก้ไขระบบ Sidebar Navigation ได้อย่างครบถ้วนและมีประสิทธิภาพ