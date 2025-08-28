import React, { useState, useEffect } from 'react';
import { getUserUsage } from '../utils/usageTracker';
import firebaseService from '../services/firebaseService';

const PlanStatus = ({ userId }) => {
  const [usageInfo, setUsageInfo] = useState(null);
  const [planInfo, setPlanInfo] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!userId) return;
      
      try {
        // เรียก getUserCurrentPlan เพื่อดึงข้อมูล subscription plan
        const plan = await firebaseService.getUserCurrentPlan(userId);
        setPlanInfo(plan);
        
        const info = await getUserUsage(userId);
        setUsageInfo(info);
      } catch (error) {
        console.error('Error fetching plan/usage info:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  if (loading) return <div>กำลังโหลด...</div>;
  if (!usageInfo && !planInfo) return null;

  const getUsageColor = () => {
    if (!usageInfo) return 'text-gray-600';
    const percentage = (usageInfo.dailyUsage / usageInfo.dailyLimit) * 100;
    if (percentage >= 90) return 'text-red-600';
    if (percentage >= 70) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getProgressBarColor = () => {
    if (!usageInfo) return 'bg-gray-500';
    if (usageInfo.dailyUsage >= usageInfo.dailyLimit) return 'bg-red-500';
    const percentage = (usageInfo.dailyUsage / usageInfo.dailyLimit) * 100;
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  return null;
};

export default PlanStatus;