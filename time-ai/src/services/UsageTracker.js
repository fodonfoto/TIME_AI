// Firebase-only implementation - Supabase integration removed
// import SupabaseService from './SupabaseService.js';

class UsageTracker {
  constructor() {
    this.requestStartTimes = new Map();
  }

  startRequest(requestId) {
    this.requestStartTimes.set(requestId, Date.now());
  }

  async trackRequest(requestId, requestData) {
    try {
      const startTime = this.requestStartTimes.get(requestId);
      const responseTime = startTime ? Date.now() - startTime : 0;
      
      console.log('📊 Firebase-only: Usage tracking logged locally:', {
        type: requestData.type || 'api_call',
        endpoint: requestData.endpoint,
        tokens: requestData.tokens || 0,
        responseTime,
        userId: requestData.userId
      });

      this.requestStartTimes.delete(requestId);
      return { success: true };
    } catch (error) {
      console.error('Error tracking request:', error);
      this.requestStartTimes.delete(requestId);
      return { success: false, error: error.message };
    }
  }

  async incrementUserRequests(firebase_uid) {
    try {
      console.log('📊 Firebase-only: Request increment logged for user:', firebase_uid);
      return { success: true, data: { requests_used: 1 } };
    } catch (error) {
      console.error('Error incrementing user requests:', error);
      return { success: false, error: error.message };
    }
  }

  middleware() {
    return (req, res, next) => {
      // Firebase-only: Simplified middleware
      req.requestId = Math.random().toString(36).substring(7);
      req.usageTracker = this;
      
      const originalSend = res.send;
      res.send = function(data) {
        try {
          console.log('📊 Firebase-only: Request completed for:', req.path);
        } catch (error) {
          console.error('Error in usage tracking middleware:', error);
        }
        
        originalSend.call(this, data);
      };

      next();
    };
  }

  async getUserUsageStats(firebase_uid, days = 30) {
    try {
      console.log('📊 Firebase-only: Usage stats requested for:', firebase_uid);
      
      // Return mock data for Firebase-only implementation
      const stats = {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        totalTokens: 0,
        dailyData: []
      };

      return { success: true, data: stats };
    } catch (error) {
      console.error('Error getting usage stats:', error);
      return { success: false, error: error.message };
    }
  }
}

export default new UsageTracker();