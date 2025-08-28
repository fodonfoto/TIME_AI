import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { getUserUsage, getUsageHistory, getCurrentPeriodInfo } from '../utils/usageTracker';
import firebaseService from '../services/firebaseService';

const Dashboard = () => {
  const { user } = useAuth();
  const [usageData, setUsageData] = useState({
    dailyUsage: 0,
    dailyLimit: 10,
    planName: 'Free Plan'
  });
  const [chartData, setChartData] = useState([]);
  const [periodInfo, setPeriodInfo] = useState(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.uid) {
      loadUsageData();

    }
  }, [user]);

  const loadUsageData = async () => {
    try {
      setLoading(true);
      
      const [currentUsage, history, currentPeriodInfo] = await Promise.all([
        getUserUsage(user.uid),
        getUsageHistory(user.uid, 30),
        getCurrentPeriodInfo(user.uid)
      ]);
      
      setUsageData(currentUsage);
      setChartData(history);
      setPeriodInfo(currentPeriodInfo);
      
    } catch (error) {
      console.error('Error loading usage data:', error);
      
      setUsageData({
        dailyUsage: 0,
        dailyLimit: 10,
        planName: 'Free Plan'
      });
      
      const fallbackData = [];
      const today = new Date();
      
      for (let i = 29; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        
        fallbackData.push({
          date: date.toISOString().split('T')[0],
          count: 0,
          displayDate: date.toLocaleDateString('en-US', { 
            day: '2-digit', 
            month: 'short' 
          })
        });
      }
      
      setChartData(fallbackData);
    } finally {
      setLoading(false);
    }
  };



  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const date = new Date(data.date);
      
      return (
        <div style={{
          backgroundColor: 'var(--bg-secondary)',
          color: 'var(--text-primary)',
          padding: '12px',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
        }}>
          <p style={{ margin: '0 0 8px 0', fontWeight: 'bold', color: 'var(--text-primary)' }}>
            {data.displayDate}
          </p>
          {data.period && (
            <p style={{ margin: '4px 0', color: 'var(--text-secondary)', fontSize: '12px' }}>
              Period {data.period}, Day {data.dayInPeriod}
            </p>
          )}
          <p style={{ margin: '4px 0', color: 'var(--text-secondary)' }}>
            Date: {date.toLocaleDateString('en-US', { 
              day: 'numeric', 
              month: 'long', 
              year: 'numeric' 
            })}
          </p>
          <p style={{ margin: '4px 0', color: 'var(--text-primary)' }}>
            Requests: <strong style={{ color: '#10A37F' }}>{data.count}/{usageData.dailyLimit}</strong>
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="dashboard">
        <div className="dashboard-header">
          <h2>Loading data...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Usage Statistics</h2>
      </div>
      
      <div className="dashboard-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: '1fr', 
        gap: '20px',
        marginTop: '20px',
        width: '100%',
        maxWidth: '100%'
      }}>
        <div className="dashboard-card" style={{ 
          width: '100%',
          backgroundColor: 'var(--bg-secondary)', 
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>
            Number of Requests {periodInfo ? 
              `(Period ${periodInfo.period} - ${periodInfo.totalDaysInPeriod} days)` : 
              chartData.length > 1 ? `(${chartData.length} days)` : '(Today)'
            }
          </h3>
          {periodInfo && (
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
              📅 Period {periodInfo.period}: {periodInfo.periodStartDate.toLocaleDateString('th-TH')} - {periodInfo.periodEndDate.toLocaleDateString('th-TH')} 
              (Day {periodInfo.dayInPeriod}/30)
            </p>
          )}
          <div style={{ height: '400px', width: '100%', marginTop: '20px' }}>
            <style>
              {`
                .recharts-cartesian-grid line:hover {
                  stroke: var(--border) !important;
                }
                .recharts-cartesian-grid {
                  pointer-events: none;
                }
                .recharts-bar-rectangle:hover {
                  fill: #10A37F !important;
                }
                .recharts-wrapper {
                  background: transparent !important;
                }
                .recharts-wrapper:hover {
                  background: transparent !important;
                }
              `}
            </style>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                margin={{
                  top: 20,
                  right: 30,
                  left: 20,
                  bottom: 5,
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis 
                  dataKey="displayDate" 
                  tick={{ fill: 'var(--text-secondary)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={{ stroke: 'var(--border)' }}
                  label={{ 
                    value: 'Date', 
                    position: 'insideBottomRight', 
                    offset: -5,
                    style: { fill: 'var(--text-secondary)' }
                  }}
                />
                <YAxis 
                  domain={[0, usageData.dailyLimit]}
                  tickCount={usageData.dailyLimit + 1}
                  tick={{ fill: 'var(--text-secondary)' }}
                  axisLine={{ stroke: 'var(--border)' }}
                  tickLine={{ stroke: 'var(--border)' }}
                  label={{ 
                    value: `Requests (Max ${usageData.dailyLimit}/day)`, 
                    angle: -90, 
                    position: 'insideLeft',
                    style: { textAnchor: 'middle', fill: 'var(--text-secondary)' }
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend 
                  wrapperStyle={{ color: 'var(--text-primary)' }}
                />
                <Bar 
                  dataKey="count" 
                  name={`Requests (Max ${usageData.dailyLimit}/day)`}
                  fill="#10A37F"
                  radius={[4, 4, 0, 0]}
                  isAnimationActive={false}
                  style={{
                    cursor: 'default',
                    outline: 'none'
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        <div className="dashboard-card" style={{
          width: '100%',
          backgroundColor: 'var(--bg-secondary)',
          padding: '20px',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '16px' }}>Current Status</h3>
          <div style={{ marginTop: '20px' }}>
            <div style={{ 
              padding: '15px', 
              backgroundColor: 'rgba(16, 163, 127, 0.1)', 
              borderRadius: '8px',
              marginBottom: '15px',
              border: '1px solid rgba(16, 163, 127, 0.2)'
            }}>
              <h4 style={{ margin: '0 0 10px 0', color: '#10A37F', fontWeight: '600' }}>Current Plan</h4>
              <p style={{ margin: '5px 0', color: 'var(--text-primary)' }}>📦 {usageData.planName}</p>
              <p style={{ margin: '5px 0', color: 'var(--text-primary)' }}>📊 {usageData.dailyUsage}/{usageData.dailyLimit} requests today</p>
              <p style={{ margin: '5px 0', color: 'var(--text-primary)' }}>
                🔋 {Math.max(0, usageData.dailyLimit - usageData.dailyUsage)} requests remaining
              </p>
            </div>
            
            <div style={{ 
              padding: '15px', 
              backgroundColor: usageData.dailyUsage >= usageData.dailyLimit 
                ? 'rgba(239, 68, 68, 0.1)' 
                : 'rgba(16, 163, 127, 0.1)', 
              borderRadius: '8px',
              marginBottom: '15px',
              border: usageData.dailyUsage >= usageData.dailyLimit 
                ? '1px solid rgba(239, 68, 68, 0.2)' 
                : '1px solid rgba(16, 163, 127, 0.2)'
            }}>
              <h4 style={{ 
                margin: '0 0 10px 0', 
                color: usageData.dailyUsage >= usageData.dailyLimit ? '#ef4444' : '#10A37F',
                fontWeight: '600'
              }}>
                {usageData.dailyUsage >= usageData.dailyLimit ? '⚠️ Daily Limit Reached' : '✅ Ready to Use'}
              </h4>
              <p style={{ margin: '0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                {usageData.dailyUsage >= usageData.dailyLimit 
                  ? 'You have reached your daily request limit' 
                  : 'You can use the service normally'
                }
              </p>
            </div>
          </div>
        </div>
        

        

      </div>
    </div>
  );
};

export default Dashboard;