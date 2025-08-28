import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import subscriptionService from '../services/subscriptionService';

const SubscriptionPage = () => {
  const { user } = useAuth();
  const [plans, setPlans] = useState({});
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [usageInfo, setUsageInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      loadSubscriptionData();
    }
  }, [user]);

  const loadSubscriptionData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [plansData, subscriptionData, usageData] = await Promise.all([
        subscriptionService.getPlans(),
        subscriptionService.getUserSubscription(user.uid),
        subscriptionService.checkUsageLimit(user.uid)
      ]);
      
      setPlans(plansData || {});
      setCurrentSubscription(subscriptionData);
      setUsageInfo(usageData);
    } catch (error) {
      console.error('Error loading subscription data:', error);
      setError('Failed to load subscription data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePlanChange = async (planType) => {
    try {
      setUpdating(true);
      setError(null);
      await subscriptionService.updateSubscription(user.uid, planType);
      await loadSubscriptionData();
    } catch (error) {
      console.error('Error updating subscription:', error);
      setError('Failed to update subscription. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>{"Loading subscription information..."}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#f44336' }}>
        <div>{error}</div>
        <button 
          onClick={loadSubscriptionData}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {"Retry"}
        </button>
      </div>
    );
  }

  const plansArray = plans && typeof plans === 'object' ? Object.values(plans) : [];

  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ color: '#fff', marginBottom: '30px' }}>{"Subscription Plans"}</h1>
      
      {/* Current Usage */}
      {usageInfo && (
        <div style={{
          backgroundColor: '#2a2a2a',
          padding: '20px',
          borderRadius: '8px',
          marginBottom: '30px',
          border: '1px solid #444'
        }}>
          <h3 style={{ color: '#fff', marginBottom: '15px' }}>{"Current Usage"}</h3>
          <div style={{ color: '#ccc' }}>
            <p>{"Plan:"} <strong style={{ color: '#4CAF50' }}>{currentSubscription?.planType?.toUpperCase()}</strong></p>
            {usageInfo.limit === -1 ? (
              <p>{"Usage:"} <strong style={{ color: '#4CAF50' }}>{"Unlimited"}</strong></p>
            ) : (
              <p>{"Usage:"} <strong>{usageInfo.used || 0}/{usageInfo.limit}</strong> {"requests today"}</p>
            )}
            {usageInfo.remaining > 0 && usageInfo.limit !== -1 && (
              <p>{"Remaining:"} <strong style={{ color: '#4CAF50' }}>{usageInfo.remaining}</strong> {"requests"}</p>
            )}
            {usageInfo.remaining === 0 && usageInfo.limit !== -1 && (
              <p style={{ color: '#f44336' }}>{"Daily limit reached. Upgrade for more requests."}</p>
            )}
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {plansArray.map((plan) => (
          <div
            key={plan.id}
            style={{
              backgroundColor: currentSubscription?.planType === plan.id ? '#1a4d3a' : '#2a2a2a',
              border: currentSubscription?.planType === plan.id ? '2px solid #4CAF50' : '1px solid #444',
              borderRadius: '8px',
              padding: '25px',
              position: 'relative'
            }}
          >
            {currentSubscription?.planType === plan.id && (
              <div style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                backgroundColor: '#4CAF50',
                color: '#fff',
                padding: '4px 8px',
                borderRadius: '4px',
                fontSize: '12px',
                fontWeight: 'bold'
              }}>
                {"CURRENT"}
              </div>
            )}
            
            <h3 style={{ color: '#fff', marginBottom: '10px' }}>{plan.name}</h3>
            <div style={{ color: '#4CAF50', fontSize: '24px', fontWeight: 'bold', marginBottom: '15px' }}>
              ${plan.price}{"/"}{" month"}
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#ccc', marginBottom: '10px' }}>
                {"Daily Limit:"} <strong>{plan.dailyLimit === -1 ? "Unlimited" : plan.dailyLimit}</strong>
              </p>
              <ul style={{ color: '#ccc', paddingLeft: '20px' }}>
                {plan.features?.map((feature, index) => (
                  <li key={index} style={{ marginBottom: '5px' }}>{feature}</li>
                ))}
              </ul>
            </div>
            
            <button
              onClick={() => handlePlanChange(plan.id)}
              disabled={updating || currentSubscription?.planType === plan.id}
              style={{
                width: '100%',
                padding: '12px',
                backgroundColor: currentSubscription?.planType === plan.id ? '#666' : '#4CAF50',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: currentSubscription?.planType === plan.id ? 'default' : 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                opacity: updating ? 0.7 : 1
              }}
            >
              {updating ? "Updating..." : 
               currentSubscription?.planType === plan.id ? "Current Plan" : 
               plan.price === 0 ? "Downgrade" : "Upgrade"}
            </button>
          </div>
        ))}
      </div>

      {/* Usage History */}
      <div style={{
        backgroundColor: '#2a2a2a',
        padding: '20px',
        borderRadius: '8px',
        border: '1px solid #444'
      }}>
        <h3 style={{ color: '#fff', marginBottom: '15px' }}>{"Usage Statistics"}</h3>
        <p style={{ color: '#ccc' }}>
          {"Track your daily usage and monitor your subscription limits."}
        </p>
        <button
          onClick={loadSubscriptionData}
          style={{
            marginTop: '10px',
            padding: '8px 16px',
            backgroundColor: '#4CAF50',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          {"Refresh Data"}
        </button>
      </div>
    </div>
  );
};

export default SubscriptionPage;