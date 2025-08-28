import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { format } from 'date-fns';
import firebaseService from '../services/firebaseService';
import { sanitizeForLog } from '../utils/logSanitizer';
import '../styles/index.css';

const SettingsPage = () => {
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [joinDate, setJoinDate] = useState('January 2024');
  const [planConfigs, setPlanConfigs] = useState({});
  const [currentUserPlan, setCurrentUserPlan] = useState('free');
  const [loading, setLoading] = useState(true);
  const [originalUserData, setOriginalUserData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  
  // Format user's creation date from Firestore
  useEffect(() => {
    if (userProfile?.createdAt) {
      try {
        const date = userProfile.createdAt.toDate ? userProfile.createdAt.toDate() : new Date(userProfile.createdAt);
        setJoinDate(format(date, 'dd/MM/yyyy'));
      } catch (error) {
        console.error('Error formatting join date:', error);
        setJoinDate('Unknown');
      }
    } else if (user?.metadata?.creationTime) {
      try {
        // Fallback to Firebase Auth if Firestore data not available
        const date = new Date(user.metadata.creationTime);
        setJoinDate(format(date, 'dd/MM/yyyy'));
      } catch (error) {
        console.error('Error formatting auth creation time:', error);
        setJoinDate('Unknown');
      }
    }
  }, [userProfile, user]);

  // Load plan configs, user's current plan, original data, and user profile
  useEffect(() => {
    const loadPlanData = async () => {
      try {
        setLoading(true);
        const [configs, userPlan, originalData, profile] = await Promise.all([
          firebaseService.getSubscriptionPlans(), // Use getSubscriptionPlans to match DATABASE_ARCHITECTURE_SUMMARY.md
          firebaseService.getUserCurrentPlan(user?.uid),
          firebaseService.getOriginalUserData(user?.uid),
          firebaseService.getUserProfile(user?.uid)
        ]);
        
        setPlanConfigs(configs);
        setCurrentUserPlan(userPlan);
        setOriginalUserData(originalData);
        setUserProfile(profile);
      } catch (error) {
        console.error('Error loading plan data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
      loadPlanData();
    } else {
      setLoading(false);
    }
  }, [user?.uid]);
  
  // Function to get user initials
  const getUserInitials = () => {
    if (!user) return 'GU';
    if (user.displayName) {
      return user.displayName
        .split(' ')
        .map(name => name[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);
    }
    return user.email ? user.email.substring(0, 2).toUpperCase() : 'GU';
  };
  
  // Function to get user name from Firestore
  const getUserName = () => {
    if (!user) return 'Guest User';
    // ใช้ displayName จาก Firestore ก่อน แล้วค่อย fallback ไป Firebase Auth
    return userProfile?.displayName || user.displayName || user.email?.split('@')[0] || 'User';
  };
  
  // Function to get user email from Firestore
  const getUserEmail = () => {
    if (!user) return 'guest@example.com';
    // ใช้ email จาก Firestore ก่อน แล้วค่อย fallback ไป Firebase Auth
    return userProfile?.email || user.email || 'user@example.com';
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // นำทางไปหน้า login อย่างลื่นไหล
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  // Function to render plan action button
  const renderPlanAction = (plan, isCurrentPlan) => {
    if (isCurrentPlan) {
      return (
        <div className="plan-action-container">
          <button 
            className="btn current-plan-btn"
            disabled
          >
            Your Current Plan
          </button>
        </div>
      );
    }
    
    // For other plans, show upgrade button
    return (
      <div className="plan-action-container">
        <button 
          className="btn btn-primary upgrade-btn"
          onClick={() => handleUpgrade(plan.planId)}
        >
          Upgrade to {plan.name}
        </button>
      </div>
    );
  };

  // Handle upgrade button click
  const handleUpgrade = (planId) => {
    // TODO: Implement upgrade logic
    console.log(`Upgrading to ${sanitizeForLog(planId)} plan`);
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1 className="settings-title">Settings</h1>
        <p className="settings-subtitle">Manage your account and preferences</p>
      </div>

      <div className="profile-section">
        <div className="profile-info" style={{ justifyContent: 'center', marginBottom: 0 }}>
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

      <div className="subscription-section">
        <div className="subscription-header">
          <div className="subscription-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
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
            <div className="loading-plans">
              <p>Loading plans...</p>
            </div>
          ) : (
            Object.values(planConfigs)
              .filter(plan => plan.isActive) // ใช้ isActive แทน active
              .sort((a, b) => (a.prices?.monthly?.amount || 0) - (b.prices?.monthly?.amount || 0))
              .map((plan) => {
                // Handle different plan name formats from Firebase
                const normalizedCurrentPlan = currentUserPlan?.toLowerCase();
                const isCurrentPlan = plan.planId === normalizedCurrentPlan || 
                                    plan.planId === currentUserPlan ||
                                    (plan.planId === 'free' && (normalizedCurrentPlan === 'free' || normalizedCurrentPlan === 'free plan'));

                const planColors = {
                  free: 'var(--text-secondary)',
                  pro: 'var(--accent)',
                  max: 'var(--brand-gradient)'
                };
                
                return (
                  <div key={plan.planId} className={`subscription-plan ${isCurrentPlan ? 'current' : ''}`}>
                    <div className="subscription-plan-info">
                      <div className="subscription-plan-header" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                        <h3 className="subscription-plan-name">{plan.name}</h3>
                        <span className="subscription-plan-price">
                          ${(plan.prices?.monthly?.amount || 0) / 100}/month
                        </span>
                        <span className="subscription-plan-limit">
                          {plan.limits?.dailyRequests === -1 ? 'unlimited' : `${plan.limits?.dailyRequests || 10} requests/day`}
                        </span>
                      </div>
                      <div className={`subscription-plan-features ${plan.planId}-plan`}>
                        {plan.planId === 'free' && (
                          <>
                            • Basic Agent Chat<br/>
                            • File Analysis<br/>
                            • Generate Image<br/>
                            • Generate AI
                          </>
                        )}
                        {plan.planId === 'pro' && (
                          <>
                            • Advance Agent Chat<br/>
                            • File Analysis<br/>
                            • Code Analysis<br/>
                            • Generate Image<br/>
                            • Generate AI<br/>
                            • Connect Tools
                          </>
                        )}
                        {plan.planId === 'max' && (
                          <>
                            • Advance Agent Chat<br/>
                            • File Analysis<br/>
                            • Code Analysis<br/>
                            • Generate Image<br/>
                            • Generate AI<br/>
                            • Connect Tools<br/>
                            • Priority Support<br/>
                            • Cerebras AI
                          </>
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

      {Object.keys(planConfigs).length === 0 && !loading && (
        <div className="no-plans-message">
          <p>No subscription plans available at the moment.</p>
        </div>
      )}

      <button 
        className="btn btn-danger w-full justify-center mt-8"
        onClick={() => setShowLogoutModal(true)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <polyline points="16,17 21,12 16,7" />
          <line x1="21" y1="12" x2="9" y2="12" />
        </svg>
        Logout
      </button>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>
            <div className="modal-actions">
              <button 
                className="btn btn-secondary"
                onClick={() => setShowLogoutModal(false)}
                style={{ width: '100px' }}
              >
                Cancel
              </button>
              <button 
                className="btn btn-danger"
                onClick={handleLogout}
                style={{ width: '100px' }}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;