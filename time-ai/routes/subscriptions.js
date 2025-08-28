import express from 'express';
import subscriptionService from '../src/services/subscriptionService.js';

const router = express.Router();

// Get all available plans
router.get('/plans', async (req, res) => {
  try {
    const plans = await subscriptionService.getPlans();
    res.json({ success: true, data: plans });
  } catch (error) {
    console.error('Error fetching plans:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get user's current subscription
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const subscription = await subscriptionService.getUserSubscription(userId);
    res.json({ success: true, data: subscription });
  } catch (error) {
    console.error('Error fetching user subscription:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Update user subscription
router.put('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { planType } = req.body;
    
    if (!planType) {
      return res.status(400).json({ success: false, error: 'Plan type is required' });
    }
    
    const subscription = await subscriptionService.updateSubscription(userId, planType);
    res.json({ success: true, data: subscription });
  } catch (error) {
    console.error('Error updating subscription:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Check usage limits
router.get('/usage/:userId/check', async (req, res) => {
  try {
    const { userId } = req.params;
    const usageInfo = await subscriptionService.checkUsageLimit(userId);
    res.json({ success: true, data: usageInfo });
  } catch (error) {
    console.error('Error checking usage limit:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Track usage (increment)
router.post('/usage/:userId/track', async (req, res) => {
  try {
    const { userId } = req.params;
    await subscriptionService.trackUsage(userId);
    res.json({ success: true, message: 'Usage tracked successfully' });
  } catch (error) {
    console.error('Error tracking usage:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get usage history
router.get('/usage/:userId/history', async (req, res) => {
  try {
    const { userId } = req.params;
    const { days = 7 } = req.query;
    const history = await subscriptionService.getUsageHistory(userId, parseInt(days));
    res.json({ success: true, data: history });
  } catch (error) {
    console.error('Error fetching usage history:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;