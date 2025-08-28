// Subscription Service
// This service handles subscription management and payment processing

import { loadStripe } from '@stripe/stripe-js';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs 
} from 'firebase/firestore';
import { db } from '../config/firebase';
import firebaseService from './firebaseService';

// Load Stripe
let stripePromise;
const getStripe = () => {
  if (!stripePromise) {
    // Replace with your Stripe publishable key
    stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

class SubscriptionService {
  // Get available subscription plans
  async getAvailablePlans() {
    try {
      console.log('📋 Getting available subscription plans...');
      
      // Get subscription plans from Firestore (aligned with DATABASE_ARCHITECTURE_SUMMARY.md)
      const planConfigs = await firebaseService.getSubscriptionPlans();
      
      // Convert to array and filter active plans
      const plans = Object.values(planConfigs)
        .filter(plan => plan.isActive !== false)
        .map(plan => ({
          id: plan.planId || plan.id, // Use planId from schema
          name: plan.name,
          price: plan.prices?.monthly?.amount ? plan.prices.monthly.amount / 100 : 0, // Convert from cents to dollars
          period: 'month',
          features: plan.features || [],
          description: plan.description || '',
          currency: plan.prices?.monthly?.currency?.toUpperCase() || 'USD',
          limits: plan.limits || {},
          prices: plan.prices || {} // Include full pricing structure
        }));
      
      console.log('✅ Available plans retrieved:', plans.length);
      return plans;
    } catch (error) {
      console.error('❌ Error getting available plans:', error);
      // Return default plans as fallback (aligned with schema)
      return [
        {
          id: 'free',
          name: 'Free Plan',
          price: 0,
          period: 'month',
          features: ['basic_chat', 'file_analysis', 'generate_image', 'generative_ai'],
          description: 'Basic AI chat features, File Analysis, Generate Image, Generative AI',
          currency: 'USD',
          limits: {
            dailyRequests: 10,
            monthlyRequests: 300,
            maxTokensPerRequest: 1000,
            maxConversations: 5
          }
        },
        {
          id: 'pro',
          name: 'Pro Plan',
          price: 15, // $15.00 from 1500 cents
          period: 'month',
          features: ['advance_chat', 'file_analysis', 'code_analysis', 'generate_image', 'generative_ai', 'connect_tools'],
          description: 'Advance Agent Chat, File Analysis, Code Analysis, Generate Image, Generative AI, Connect Tools',
          currency: 'USD',
          limits: {
            dailyRequests: 100,
            monthlyRequests: 3000, // Fixed to match schema
            maxTokensPerRequest: 10000, // Fixed to match schema
            maxConversations: 50
          }
        },
        {
          id: 'max',
          name: 'Max Plan',
          price: 20, // $20.00 from 2000 cents
          period: 'month',
          features: ['advance_chat', 'file_analysis', 'code_analysis', 'generate_image', 'generative_ai', 'connect_tools', 'priority_support', 'cerebras_ai'],
          description: 'Advance Agent Chat, File Analysis, Code Analysis, Generate Image, Generative AI, Connect Tools, Priority Support, Cerebras AI',
          currency: 'USD',
          limits: {
            dailyRequests: -1,
            monthlyRequests: -1,
            maxTokensPerRequest: -1,
            maxConversations: -1
          }
        }
      ];
    }
  }

  // Get current user's subscription plan
  async getCurrentPlan(userId) {
    try {
      console.log('🔍 Getting current plan for user:', userId);
      
      // Get user's current plan from Firestore
      const planId = await firebaseService.getUserCurrentPlan(userId);
      
      // Get plan details
      const plans = await this.getAvailablePlans();
      const currentPlan = plans.find(plan => plan.id === planId) || plans[0]; // Default to free plan
      
      console.log('✅ Current plan retrieved:', currentPlan);
      return currentPlan;
    } catch (error) {
      console.error('❌ Error getting current plan:', error);
      // Return free plan as fallback
      return {
        id: 'free',
        name: 'Free',
        price: 0,
        period: 'month',
        features: ['10 messages per day', 'Basic models'],
        description: 'Basic AI chat features',
        currency: 'USD',
        limits: {
          dailyRequests: 10,
          monthlyRequests: 300,
          maxTokensPerRequest: 1000,
          maxConversations: 5
        }
      };
    }
  }

  // Get user's subscription (alias for getCurrentPlan for compatibility)
  async getUserSubscription(userId) {
    try {
      const currentPlan = await this.getCurrentPlan(userId);
      // Return in subscription format for compatibility with components
      return {
        planType: currentPlan.id,
        plan: currentPlan,
        status: 'active',
        startDate: new Date(),
        ...currentPlan
      };
    } catch (error) {
      console.error('❌ Error getting user subscription:', error);
      return {
        planType: 'free',
        status: 'active',
        plan: {
          id: 'free',
          name: 'Free Plan',
          price: 0
        }
      };
    }
  }

  // Get available plans (alias for getAvailablePlans for compatibility)
  async getPlans() {
    return await this.getAvailablePlans();
  }

  // Check usage limits for a user
  async checkUsageLimit(userId) {
    try {
      console.log('🔍 Checking usage limits for user:', userId);
      
      // Get user's current plan
      const currentPlan = await this.getCurrentPlan(userId);
      
      // Get usage data from usageService
      const usageData = await import('./usageService.js').then(module => 
        module.default.getDailyUsage(userId)
      );
      
      return {
        planType: currentPlan.id,
        limit: currentPlan.limits?.dailyRequests || 10,
        used: usageData?.requests?.count || 0,
        remaining: usageData?.requests?.remaining || (currentPlan.limits?.dailyRequests || 10),
        canMakeRequest: (usageData?.requests?.remaining || 0) > 0 || currentPlan.limits?.dailyRequests === -1
      };
    } catch (error) {
      console.error('❌ Error checking usage limits:', error);
      return {
        planType: 'free',
        limit: 10,
        used: 0,
        remaining: 10,
        canMakeRequest: true
      };
    }
  }

  // Update user subscription
  async updateSubscription(userId, planType) {
    try {
      console.log('📝 Updating subscription for user:', userId, 'to plan:', planType);
      
      // Update user's current plan in Firestore
      const result = await firebaseService.setUserCurrentPlan(userId, planType);
      
      if (result) {
        console.log('✅ Subscription updated successfully');
        return await this.getUserSubscription(userId);
      } else {
        throw new Error('Failed to update subscription');
      }
    } catch (error) {
      console.error('❌ Error updating subscription:', error);
      throw error;
    }
  }

  // Create a Stripe payment intent
  async createPaymentIntent(planId, userId) {
    try {
      console.log('💳 Creating payment intent for:', planId, userId);
      
      // Get plan details
      const plans = await this.getAvailablePlans();
      const selectedPlan = plans.find(plan => plan.id === planId);
      
      if (!selectedPlan) {
        throw new Error('Plan not found');
      }
      
      // Create payment intent on your server
      // This is a placeholder - you would need to implement this on your backend
      const response = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          planId: selectedPlan.id,
          amount: selectedPlan.price * 100, // Convert to cents
          currency: selectedPlan.currency || 'USD',
          userId
        }),
      });
      
      const { clientSecret } = await response.json();
      console.log('✅ Payment intent created:', clientSecret);
      
      return clientSecret;
    } catch (error) {
      console.error('❌ Error creating payment intent:', error);
      throw error;
    }
  }

  // Process plan upgrade
  async processUpgrade(userId, planId, paymentMethodId) {
    try {
      console.log('⬆️ Processing plan upgrade for:', userId, planId);
      
      // Get Stripe instance
      const stripe = await getStripe();
      
      // Create payment intent
      const clientSecret = await this.createPaymentIntent(planId, userId);
      
      // Confirm payment
      const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: paymentMethodId,
      });
      
      if (error) {
        console.error('❌ Payment failed:', error);
        throw new Error(error.message);
      }
      
      if (paymentIntent.status === 'succeeded') {
        // Update user's plan in Firestore
        const result = await firebaseService.setUserCurrentPlan(userId, planId);
        
        if (result) {
          // Update usage limits
          // This would typically be done by a backend function
          console.log('✅ Plan upgrade processed successfully');
          return { success: true, planId };
        } else {
          throw new Error('Failed to update user plan');
        }
      } else {
        throw new Error('Payment not succeeded');
      }
    } catch (error) {
      console.error('❌ Error processing upgrade:', error);
      throw error;
    }
  }

  // Get user's billing history
  async getBillingHistory(userId) {
    try {
      console.log('🧾 Getting billing history for:', userId);
      
      // Query billing transactions from Firestore
      const transactionsRef = collection(db, 'billing_transactions');
      const q = query(
        transactionsRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      
      const transactions = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || data.createdAt,
          amount: data.amount || 0,
          currency: data.currency || 'USD',
          planId: data.planId || 'free',
          status: data.status || 'unknown',
          paymentMethod: data.paymentMethod || 'unknown'
        };
      });
      
      console.log('✅ Billing history retrieved:', transactions.length);
      return transactions;
    } catch (error) {
      console.error('❌ Error getting billing history:', error);
      return [];
    }
  }

  // Cancel user's subscription
  async cancelSubscription(userId) {
    try {
      console.log('❌ Canceling subscription for:', userId);
      
      // Update user's plan to free in Firestore
      const result = await firebaseService.setUserCurrentPlan(userId, 'free');
      
      if (result) {
        console.log('✅ Subscription canceled successfully');
        return { success: true };
      } else {
        throw new Error('Failed to cancel subscription');
      }
    } catch (error) {
      console.error('❌ Error canceling subscription:', error);
      throw error;
    }
  }
}

export default new SubscriptionService();