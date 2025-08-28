import { useRef, useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth';
import DashboardIcon from './DashboardIcon'
import SettingsIcon from './SettingsIcon'
import ChatIcon from './ChatIcon'
import HistoryIcon from './HistoryIcon'
import AgentIcon from './AgentIcon'
import firebaseService from '../services/firebaseService'

// เพิ่ม CSS animation สำหรับ Dashboard และ Settings Lottie icons
const iconAnimations = `
  
  /* Dashboard Lottie icon color inheritance */
  .dashboard-icon {
    /* Convert gray to white text color */
    filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
    opacity: 0.7;
  }
  
  /* Active state removed as per request */
  .menu-item.active .dashboard-icon {
    opacity: 1;
    filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
  }
  
  /* When menu item is hovered, use full opacity with white color */
  .menu-item:hover .dashboard-icon {
    opacity: 1;
    filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
  }

  /* Settings Lottie icon color inheritance */
  .settings-icon {
    /* Convert gray to white text color */
    filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
    opacity: 0.7;
  }
  
  /* Active state removed as per request */
  .menu-item.active .settings-icon {
    opacity: 1;
    filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
  }
  
  /* When menu item is hovered, use full opacity with white color */
  .menu-item:hover .settings-icon {
    opacity: 1;
    filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
  }

  /* Chat Lottie icon color inheritance */
  .chat-icon {
    /* Convert gray to white text color */
    filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
    opacity: 0.7;
  }
  
  /* Active state removed as per request */
  .menu-item.active .chat-icon {
    opacity: 1;
    filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
  }
  
  /* When menu item is hovered, use full opacity with white color */
  .menu-item:hover .chat-icon {
    opacity: 1;
    filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
  }

  /* History Lottie icon color inheritance */
  .history-icon {
    /* Convert gray to white text color */
    filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
    opacity: 0.7;
  }
  
  /* Active state removed as per request */
  .menu-item.active .history-icon {
    opacity: 1;
    filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
  }
  
  /* When menu item is hovered, use full opacity with white color */
  .menu-item:hover .history-icon {
    opacity: 1;
    filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
  }

  /* Agent Lottie icon color inheritance */
  .agent-icon {
    /* Convert gray to white text color */
    filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
    opacity: 0.7;
  }
  
  /* Active state removed as per request */
  .menu-item.active .agent-icon {
    opacity: 1;
    filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
  }
  
  /* When menu item is hovered, use full opacity with white color */
  .menu-item:hover .agent-icon {
    opacity: 1;
    filter: brightness(0) saturate(100%) invert(100%) sepia(0%) saturate(0%) hue-rotate(0deg) brightness(100%) contrast(100%);
  }
`

// เพิ่ม style tag ใน head
if (typeof document !== 'undefined' && !document.querySelector('#icon-animations')) {
  const style = document.createElement('style')
  style.id = 'icon-animations'
  style.textContent = iconAnimations
  document.head.appendChild(style)
}

function Sidebar({
  isOpen,
  onToggle,
  onNewChat,
  chatHistory = []
}) {
  const sidebarRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get current active view from URL
  const getActiveView = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'dashboard';
    if (path === '/chatai') return 'chat';
    if (path === '/history') return 'history';
    if (path === '/agent') return 'agent';
    if (path === '/settings') return 'settings';
    return 'dashboard'; // default
  };
  
  const activeView = getActiveView();
  const [hoveredItem, setHoveredItem] = useState(null);
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  
  // Load Firestore user profile (mirror SettingsPage behavior)
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
    return () => {
      isMounted = false;
    };
  }, [user?.uid]);
  
  // Function to get user initials (prefer Firestore data)
  const getUserInitials = () => {
    if (!user && !userProfile) return 'GU';
    
    // Try to get name from profile first
    let displayName = userProfile?.displayName;
    if (!displayName && userProfile?.firstName && userProfile?.lastName) {
      displayName = `${userProfile.firstName} ${userProfile.lastName}`;
    }
    if (!displayName) {
      displayName = user?.displayName;
    }
    
    // Generate initials from name
    if (displayName) {
      return displayName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    
    // Fallback to email initials
    const email = userProfile?.email || user?.email;
    return email ? email.substring(0, 2).toUpperCase() : 'GU';
  };
  
  // Function to get user name (prefer Firestore data)
  const getUserName = () => {
    if (!user && !userProfile) {
      return 'Guest User';
    }
    
    if (userProfile?.displayName) {
      return userProfile.displayName;
    }
    
    if (userProfile?.firstName && userProfile?.lastName) {
      return `${userProfile.firstName} ${userProfile.lastName}`;
    }
    
    if (user?.displayName) {
      return user.displayName;
    }
    
    const email = userProfile?.email || user?.email;
    if (email) {
      return email.split('@')[0];
    }
    
    return 'User';
  };
  
  // Function to get user email (prefer Firestore data)
  const getUserEmail = () => {
    if (!user && !userProfile) return 'guest@example.com';
    return userProfile?.email || user?.email || 'user@example.com';
  };

  // ปิด Sidebar เมื่อคลิกด้านนอก
  useEffect(() => {
    function handleClickOutside(event) {
      if (window.innerWidth <= 768 && isOpen && sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        onToggle();
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onToggle]);
  // Configuration will be managed in parent component

  return (
    <div>
      {/* Toggle Button - Mobile */}
      <button
        className="mobile-toggle-btn"
        onClick={onToggle}
        style={{
          position: 'fixed',
          top: '10px',
          left: '10px',
          zIndex: 101,
          background: 'var(--brand-gradient)',
          border: 'none',
          color: 'white',
          width: '44px',
          height: '44px',
          borderRadius: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
          fontSize: '28px',
          lineHeight: 1
        }}
      >
        {isOpen ? '✕' : '☰'}
      </button>

      {/* Toggle Button - Desktop */}
      <div
        className={`desktop-toggle-container ${isOpen ? 'open' : 'closed'}`}
        style={{
          position: 'fixed',
          top: '10px',
          left: isOpen ? '270px' : '10px',
          zIndex: 101,
          transition: 'left 0.3s ease-in-out',
          willChange: 'left'
        }}
      >
        <button
          className="desktop-toggle-btn"
          onClick={onToggle}
          style={{
            background: 'var(--brand-gradient)',
            border: 'none',
            color: 'white',
            width: '40px',
            height: '40px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 5px rgba(6, 61, 48, 0.3)',
            transition: 'all 0.2s ease-in-out'
          }}
        >
          {isOpen ? '◀' : '▶'}
        </button>
      </div>

      <div ref={sidebarRef} className={`sidebar ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-header-top" style={{ padding: '16px' }}>
            <h2>Time AI</h2>
            <button
              className="mobile-close-btn"
              onClick={onToggle}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--text-primary)',
                fontSize: '28px',
                cursor: 'pointer',
                padding: '8px',
                display: 'none',
                alignItems: 'center',
                justifyContent: 'center',
                width: '44px',
                height: '44px',
                borderRadius: '4px',
                marginLeft: 'auto',
                lineHeight: 1
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div className="sidebar-menu">
          <div className="menu-section">
            <div
              className={`menu-item ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => navigate('/dashboard')}
              onMouseEnter={() => setHoveredItem('dashboard')}
              onMouseLeave={() => setHoveredItem(null)}
              style={{ cursor: 'pointer' }}
            >
              <DashboardIcon width={20} height={20} isParentHovered={hoveredItem === 'dashboard'} />
              <span>Dashboard</span>
            </div>
            <div
              className={`menu-item ${activeView === 'chat' ? 'active' : ''}`}
              onClick={() => navigate('/chatai')}
              onMouseEnter={() => setHoveredItem('chat')}
              onMouseLeave={() => setHoveredItem(null)}
              style={{ cursor: 'pointer' }}
            >
              <ChatIcon width={20} height={20} isParentHovered={hoveredItem === 'chat'} />
              <span>Chat</span>
            </div>
            <div
              className={`menu-item ${activeView === 'history' ? 'active' : ''}`}
              onClick={() => navigate('/history')}
              onMouseEnter={() => setHoveredItem('history')}
              onMouseLeave={() => setHoveredItem(null)}
              style={{ cursor: 'pointer' }}
            >
              <HistoryIcon width={20} height={20} isParentHovered={hoveredItem === 'history'} />
              <span>History</span>
            </div>
            <div 
              className={`menu-item ${activeView === 'agent' ? 'active' : ''}`}
              onClick={() => navigate('/agent')}
              onMouseEnter={() => setHoveredItem('agent')}
              onMouseLeave={() => setHoveredItem(null)}
              style={{ cursor: 'pointer' }}
            >
              <AgentIcon width={20} height={20} isParentHovered={hoveredItem === 'agent'} />
              <span>Agent</span>
            </div>
            <div
              className={`menu-item ${activeView === 'settings' ? 'active' : ''}`}
              onClick={() => navigate('/settings')}
              onMouseEnter={() => setHoveredItem('settings')}
              onMouseLeave={() => setHoveredItem(null)}
              style={{ cursor: 'pointer' }}
            >
              <SettingsIcon width={20} height={20} isParentHovered={hoveredItem === 'settings'} />
              <span>Settings</span>
            </div>

          </div>
        </div>

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

export default Sidebar