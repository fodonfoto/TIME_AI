// Usage Service
// This service handles usage tracking and limits enforcement

import firebaseService from './firebaseService';

class UsageService {
  // Get daily usage for a user
  async getDailyUsage(userId) {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('📊 Getting daily usage for:', userId, today);
      
      const usageData = await firebaseService.getDailyUsage(userId, today);
      console.log('✅ Daily usage data retrieved:', usageData);
      
      return usageData;
    } catch (error) {
      console.error('❌ Error getting daily usage:', error);
      // Return default values in case of error
      return {
        requests: { count: 0, limit: 10, remaining: 10 },
        tokens: { used: 0, limit: 10000, remaining: 10000 },
        context: { used: 0, limit: 10000, remaining: 10000 },
        conversations: { created: 0, limit: 5, remaining: 5 }
      };
    }
  }

  // Check if user has reached their limits
  async checkLimits(userId, limitType) {
    try {
      console.log('🔍 Checking limits for user:', userId, limitType);
      
      const usageData = await this.getDailyUsage(userId);
      
      switch (limitType) {
        case 'requests':
          return usageData.requests.remaining <= 0;
        case 'tokens':
          return usageData.tokens.remaining <= 0;
        case 'context':
          return usageData.context.remaining <= 0;
        case 'conversations':
          return usageData.conversations.remaining <= 0;
        default:
          console.warn('Unknown limit type:', limitType);
          return false;
      }
    } catch (error) {
      console.error('❌ Error checking limits:', error);
      return false;
    }
  }

  // Increment usage count
  async incrementUsage(userId, usageType, amount = 1) {
    try {
      const today = new Date().toISOString().split('T')[0];
      console.log('📈 Incrementing usage for:', userId, usageType, amount);
      
      const result = await firebaseService.incrementUsage(userId, today, usageType, amount);
      console.log('✅ Usage incremented:', result);
      
      return result;
    } catch (error) {
      console.error('❌ Error incrementing usage:', error);
      return false;
    }
  }

  // Get user's current plan limits
  async getUserPlanLimits(userId) {
    try {
      console.log('📋 Getting user plan limits for:', userId);
      
      // Get user's current plan
      const planId = await firebaseService.getUserCurrentPlan(userId);
      
      // Get plan limits from subscription_plans collection
      const planConfigs = await firebaseService.getSubscriptionPlans();
      const planData = planConfigs[planId] || planConfigs['free'];
      
      console.log('✅ User plan limits retrieved:', planData?.limits);
      
      return planData?.limits || {
        dailyRequests: 10,
        monthlyRequests: 300,
        maxTokensPerRequest: 1000,
        maxConversations: 5
      };
    } catch (error) {
      console.error('❌ Error getting user plan limits:', error);
      // Return free plan limits as fallback
      return {
        dailyRequests: 10,
        monthlyRequests: 300,
        maxTokensPerRequest: 1000,
        maxConversations: 5
      };
    }
  }

  // Reset daily usage (typically called by a scheduled function)
  async resetDailyUsage(userId) {
    try {
      console.log('🔄 Resetting daily usage for:', userId);
      
      const today = new Date().toISOString().split('T')[0];
      
      // Get user's plan limits
      const planLimits = await this.getUserPlanLimits(userId);
      
      // Use firebaseService to reset usage
      const result = await firebaseService.createUsageTracking(userId, today);
      
      if (result) {
        console.log('✅ Daily usage reset successfully');
        return true;
      } else {
        throw new Error('Failed to reset daily usage');
      }
    } catch (error) {
      console.error('❌ Error resetting daily usage:', error);
      return false;
    }
  }

  // Get monthly usage statistics
  async getMonthlyStats(userId, year, month) {
    try {
      console.log('📅 Getting monthly stats for:', userId, year, month);
      
      // Calculate date range
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0);
      
      // Since we don't have direct query capability through firebaseService,
      // we'll aggregate from available daily usage data
      let totalRequests = 0;
      let totalTokens = 0;
      let totalConversations = 0;
      
      // Get each day's usage for the month
      for (let day = 1; day <= endDate.getDate(); day++) {
        const date = new Date(year, month - 1, day).toISOString().split('T')[0];
        try {
          const dailyUsage = await firebaseService.getDailyUsage(userId, date);
          if (dailyUsage) {
            totalRequests += dailyUsage.requests?.count || 0;
            totalTokens += dailyUsage.tokens?.used || 0;
            totalConversations += dailyUsage.conversations?.created || 0;
          }
        } catch (dayError) {
          // Skip days with errors
          console.warn(`Warning: Failed to get usage for ${date}:`, dayError.message);
        }
      }
      
      const stats = {
        totalRequests,
        totalTokens,
        totalConversations,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };
      
      console.log('✅ Monthly stats retrieved:', stats);
      return stats;
    } catch (error) {
      console.error('❌ Error getting monthly stats:', error);
      return {
        totalRequests: 0,
        totalTokens: 0,
        totalConversations: 0,
        startDate: '',
        endDate: ''
      };
    }
  }
}

// Helper functions for backward compatibility
export const canUserMakeRequest = async (userId) => {
  try {
    const usageData = await usageService.getDailyUsage(userId);
    const hasReachedLimit = usageData.requests.remaining <= 0;
    
    return {
      canUse: !hasReachedLimit,
      currentUsage: usageData.requests.count,
      dailyLimit: usageData.requests.limit,
      remaining: usageData.requests.remaining
    };
  } catch (error) {
    console.error('Error checking user request limits:', error);
    return {
      canUse: true, // Allow usage in case of error
      currentUsage: 0,
      dailyLimit: 10,
      remaining: 10
    };
  }
};

export const recordUsage = async (userId) => {
  try {
    return await usageService.incrementUsage(userId, 'requests', 1);
  } catch (error) {
    console.error('Error recording usage:', error);
    return false;
  }
};

const usageService = new UsageService();
export default usageService;