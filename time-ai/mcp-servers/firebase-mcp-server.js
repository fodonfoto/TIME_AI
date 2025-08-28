#!/usr/bin/env node

/**
 * Custom Firebase MCP Server
 * Provides Firebase operations through MCP protocol
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin
const projectId = process.env.FIREBASE_PROJECT_ID || 'ready-ai-niwat';
let adminApp, db;

try {
  adminApp = initializeApp({
    projectId: projectId
  });
  db = getFirestore(adminApp);
  console.error('✅ Firebase Admin initialized successfully');
} catch (error) {
  console.error('❌ Firebase Admin initialization failed:', error.message);
}

// Create MCP server
const server = new Server(
  {
    name: 'firebase-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'list_users',
        description: 'List all users in Firestore',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Maximum number of users to return',
              default: 10
            }
          }
        }
      },
      {
        name: 'delete_user',
        description: 'Delete a user by email',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'Email of user to delete',
              required: true
            }
          },
          required: ['email']
        }
      },
      {
        name: 'check_user_exists',
        description: 'Check if user exists by email',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'Email to check',
              required: true
            }
          },
          required: ['email']
        }
      },
      {
        name: 'check_name_duplicate',
        description: 'Check if name combination already exists',
        inputSchema: {
          type: 'object',
          properties: {
            firstName: {
              type: 'string',
              description: 'First name to check',
              required: true
            },
            lastName: {
              type: 'string',
              description: 'Last name to check',
              required: true
            }
          },
          required: ['firstName', 'lastName']
        }
      },
      {
        name: 'create_subscription_collections',
        description: 'Create subscription plan collections and initialize data',
        inputSchema: {
          type: 'object',
          properties: {
            initializeData: {
              type: 'boolean',
              description: 'Whether to initialize with sample data',
              default: true
            }
          }
        }
      },
      {
        name: 'update_user_plan',
        description: 'Update user subscription plan',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'User email',
              required: true
            },
            planType: {
              type: 'string',
              description: 'Plan type: free, pro, or max',
              enum: ['free', 'pro', 'max'],
              required: true
            }
          },
          required: ['email', 'planType']
        }
      },
      {
        name: 'get_user_plan',
        description: 'Get user subscription plan and usage',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'User email',
              required: true
            }
          },
          required: ['email']
        }
      },
      {
        name: 'check_usage_limit',
        description: 'Check if user can make AI request based on plan limits',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'User email',
              required: true
            }
          },
          required: ['email']
        }
      },
      {
        name: 'increment_usage',
        description: 'Increment user daily usage count',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'User email',
              required: true
            }
          },
          required: ['email']
        }
      },
      {
        name: 'reset_daily_usage',
        description: 'Reset daily usage for all users (admin function)',
        inputSchema: {
          type: 'object',
          properties: {
            date: {
              type: 'string',
              description: 'Date to reset (YYYY-MM-DD format)',
              default: 'today'
            }
          }
        }
      },
      {
        name: 'migrate_existing_users',
        description: 'Migrate existing users to default plan',
        inputSchema: {
          type: 'object',
          properties: {
            defaultPlan: {
              type: 'string',
              description: 'Default plan to assign',
              enum: ['free', 'pro', 'max'],
              default: 'free'
            }
          }
        }
      },
      {
        name: 'create_user_original',
        description: 'Create user_originals record for anti-abuse protection',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'User ID',
              required: true
            },
            email: {
              type: 'string', 
              description: 'User email',
              required: true
            },
            originalFirstName: {
              type: 'string',
              description: 'Original first name',
              required: true
            },
            originalLastName: {
              type: 'string',
              description: 'Original last name', 
              required: true
            },
            originalFullName: {
              type: 'string',
              description: 'Original full name',
              required: true
            }
          },
          required: ['userId', 'email', 'originalFirstName', 'originalLastName', 'originalFullName']
        }
      },
      {
        name: 'create_conversation',
        description: 'Create a new conversation record',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'User ID who owns the conversation',
              required: true
            },
            title: {
              type: 'string',
              description: 'Conversation title',
              required: true
            },
            messages: {
              type: 'array',
              description: 'Array of messages',
              default: []
            }
          },
          required: ['userId', 'title']
        }
      },
      {
        name: 'create_usage_analytics',
        description: 'Create usage analytics record',
        inputSchema: {
          type: 'object',
          properties: {
            userId: {
              type: 'string',
              description: 'User ID',
              required: true
            },
            date: {
              type: 'string',
              description: 'Date in YYYY-MM-DD format',
              required: true
            },
            requestsCount: {
              type: 'number',
              description: 'Number of requests made',
              default: 0
            }
          },
          required: ['userId', 'date']
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'list_users': {
        const limit = args.limit || 10;
        const usersRef = db.collection('users');
        const snapshot = await usersRef.limit(limit).get();
        
        const users = [];
        snapshot.forEach(doc => {
          const data = doc.data();
          users.push({
            id: doc.id,
            email: doc.id,
            firstName: data.firstName,
            lastName: data.lastName,
            displayName: data.displayName,
            createdAt: data.createdAt?.toDate?.()?.toISOString()
          });
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                users: users,
                count: users.length
              }, null, 2)
            }
          ]
        };
      }

      case 'delete_user': {
        const { email } = args;
        if (!email) {
          throw new Error('Email is required');
        }

        const userRef = db.collection('users').doc(email);
        const doc = await userRef.get();
        
        if (!doc.exists) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  message: 'User not found',
                  email: email
                }, null, 2)
              }
            ]
          };
        }

        await userRef.delete();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'User deleted successfully',
                email: email
              }, null, 2)
            }
          ]
        };
      }

      case 'check_user_exists': {
        const { email } = args;
        if (!email) {
          throw new Error('Email is required');
        }

        const userRef = db.collection('users').doc(email);
        const doc = await userRef.get();
        const exists = doc.exists;

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                email: email,
                exists: exists,
                userData: exists ? doc.data() : null
              }, null, 2)
            }
          ]
        };
      }

      case 'check_name_duplicate': {
        const { firstName, lastName } = args;
        if (!firstName || !lastName) {
          throw new Error('Both firstName and lastName are required');
        }

        const normalizedFirstName = firstName.trim().toLowerCase();
        const normalizedLastName = lastName.trim().toLowerCase();

        // Check using normalized fields if available
        let isDuplicate = false;
        const duplicateUsers = [];

        try {
          // Try optimized query first
          const optimizedQuery = db.collection('users')
            .where('firstNameLower', '==', normalizedFirstName)
            .where('lastNameLower', '==', normalizedLastName);
          
          const optimizedSnapshot = await optimizedQuery.get();
          
          if (!optimizedSnapshot.empty) {
            isDuplicate = true;
            optimizedSnapshot.forEach(doc => {
              duplicateUsers.push({
                id: doc.id,
                data: doc.data()
              });
            });
          }
        } catch (optimizedError) {
          // Fallback to full scan
          const usersRef = db.collection('users');
          const snapshot = await usersRef.get();
          
          snapshot.forEach(doc => {
            const userData = doc.data();
            const existingFirstName = (userData.firstName || '').trim().toLowerCase();
            const existingLastName = (userData.lastName || '').trim().toLowerCase();
            
            if (existingFirstName === normalizedFirstName && 
                existingLastName === normalizedLastName) {
              isDuplicate = true;
              duplicateUsers.push({
                id: doc.id,
                data: userData
              });
            }
          });
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                firstName: firstName,
                lastName: lastName,
                normalized: {
                  firstName: normalizedFirstName,
                  lastName: normalizedLastName
                },
                isDuplicate: isDuplicate,
                duplicateUsers: duplicateUsers
              }, null, 2)
            }
          ]
        };
      }

      case 'create_subscription_collections': {
        const { initializeData = true } = args;
        const results = [];

        try {
          // Create subscription_plans collection instead of plan_configs
          const subscriptionPlansRef = db.collection('subscription_plans');
          const subscriptionPlans = [
            {
              planId: 'free',
              name: 'Free Plan',
              description: 'Basic AI chat features, File Analysis, Generate Image, Generative AI',
              prices: {
                monthly: {
                  amount: 0,
                  currency: 'usd',
                  stripePriceId: 'price_free_monthly_xxxx'
                }
              },
              limits: {
                dailyRequests: 10,
                monthlyRequests: 300,
                maxTokensPerRequest: 1000,
                maxConversations: 5
              },
              features: ['basic_chat', 'file_analysis', 'generate_image', 'generative_ai'],
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              planId: 'pro',
              name: 'Pro Plan',
              description: 'Advance Agent Chat, File Analysis, Code Analysis, Generate Image, Generative AI, Connect Tools',
              prices: {
                monthly: {
                  amount: 1500,
                  currency: 'usd',
                  stripePriceId: 'price_pro_monthly_xxxx'
                },
                yearly: {
                  amount: 12000,
                  currency: 'usd',
                  stripePriceId: 'price_pro_yearly_yyyy'
                }
              },
              limits: {
                dailyRequests: 100,
                monthlyRequests: 3000,
                maxTokensPerRequest: 10000,
                maxConversations: 50
              },
              features: ['advance_chat', 'file_analysis', 'code_analysis', 'generate_image', 'generative_ai', 'connect_tools'],
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            },
            {
              planId: 'max',
              name: 'Max Plan',
              description: 'Advance Agent Chat, File Analysis, Code Analysis, Generate Image, Generative AI, Connect Tools, Priority Support, Cerebras AI',
              prices: {
                monthly: {
                  amount: 2000,
                  currency: 'usd',
                  stripePriceId: 'price_max_monthly_xxxx'
                },
                yearly: {
                  amount: 21600,
                  currency: 'usd',
                  stripePriceId: 'price_max_yearly_yyyy'
                }
              },
              limits: {
                dailyRequests: -1,
                monthlyRequests: -1,
                maxTokensPerRequest: -1,
                maxConversations: -1
              },
              features: ['advance_chat', 'file_analysis', 'code_analysis', 'generate_image', 'generative_ai', 'connect_tools', 'priority_support', 'cerebras_ai'],
              isActive: true,
              createdAt: new Date(),
              updatedAt: new Date()
            }
          ];

          if (initializeData) {
            for (const plan of subscriptionPlans) {
              await subscriptionPlansRef.doc(plan.planId).set(plan);
              results.push(`Created subscription plan: ${plan.name}`);
            }
          }

          // Create indexes info
          const indexesInfo = {
            collections_created: [
              'subscription_plans',
              'billing_transactions', // Changed from 'subscriptions' to align with current schema
              'usage_tracking'
            ],
            indexes_needed: [
              'users: currentPlan', // Updated to match users collection schema
              'billing_transactions: userId', // Changed from subscriptions
              'billing_transactions: status', // Changed from subscriptions
              'usage_tracking: userId + date',
              'usage_tracking: date'
            ],
            security_rules_needed: true
          };

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: 'Subscription collections structure created',
                  results: results,
                  info: indexesInfo,
                  subscriptionPlans: subscriptionPlans
                }, null, 2)
              }
            ]
          };
        } catch (error) {
          throw new Error(`Failed to create collections: ${error.message}`);
        }
      }

      case 'update_user_plan': {
        const { email, planType } = args;
        if (!email || !planType) {
          throw new Error('Email and planType are required');
        }

        if (!['free', 'pro', 'max'].includes(planType)) {
          throw new Error('Invalid plan type. Must be: free, pro, or max');
        }

        const batch = db.batch();
        const now = new Date();

        // Update user document with currentPlan (aligned with users collection schema)
        const userRef = db.collection('users').doc(email);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
          throw new Error('User not found');
        }

        batch.update(userRef, {
          currentPlan: planType, // Changed from subscription object to currentPlan field
          updatedAt: now
        });

        // Create billing transaction record (aligned with billing_transactions schema)
        const billingRef = db.collection('billing_transactions').doc();
        const transactionId = billingRef.id;
        batch.set(billingRef, {
          transactionId: transactionId, // Add transactionId field matching Document ID
          userId: email,
          amount: planType === 'free' ? 0 : (planType === 'pro' ? 1500 : 2000), // Match schema pricing (in cents)
          currency: 'USD',
          planId: planType,
          planType: 'monthly', // Default to monthly
          status: 'completed',
          paymentMethod: 'admin_update',
          stripePaymentIntentId: null,
          createdAt: now,
          updatedAt: now
        });

        await batch.commit();

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `User plan updated to ${planType}`,
                email: email,
                planType: planType,
                updatedAt: now.toISOString()
              }, null, 2)
            }
          ]
        };
      }

      case 'get_user_plan': {
        const { email } = args;
        if (!email) {
          throw new Error('Email is required');
        }

        // Get user data
        const userRef = db.collection('users').doc(email);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
          throw new Error('User not found');
        }

        const userData = userDoc.data();
        const currentPlan = userData.currentPlan || 'free'; // Changed from subscription object to currentPlan field

        // Get today's usage
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const usageRef = db.collection('usage_tracking')
          .where('userId', '==', email)
          .where('date', '==', today);
        
        const usageSnapshot = await usageRef.get();
        let todayUsage = 0;
        let usageData = null;
        
        if (!usageSnapshot.empty) {
          usageData = usageSnapshot.docs[0].data();
          // Use nested structure only (production schema)
          todayUsage = usageData.requests ? usageData.requests.count || 0 : 0;
        }

        // Get plan limits from subscription_plans collection
        const planRef = db.collection('subscription_plans').doc(currentPlan);
        const planDoc = await planRef.get();
        const planData = planDoc.exists ? planDoc.data() : null;

        const dailyLimit = planData ? planData.limits?.dailyRequests : (currentPlan === 'free' ? 10 : currentPlan === 'pro' ? 100 : -1);
        const remainingRequests = dailyLimit === -1 ? 'unlimited' : Math.max(0, dailyLimit - todayUsage);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                email: email,
                currentPlan: currentPlan, // Changed from subscription to currentPlan
                usage: {
                  today: todayUsage,
                  dailyLimit: dailyLimit,
                  remaining: remainingRequests,
                  date: today
                },
                planData: planData // Changed from planConfig to planData
              }, null, 2)
            }
          ]
        };
      }

      case 'check_usage_limit': {
        const { email } = args;
        if (!email) {
          throw new Error('Email is required');
        }

        // Get user plan
        const userRef = db.collection('users').doc(email);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
          throw new Error('User not found');
        }

        const userData = userDoc.data();
        const planType = userData.currentPlan || 'free'; // Changed from subscription.planType to currentPlan

        // Max plan has unlimited requests
        if (planType === 'max') {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  canMakeRequest: true,
                  planType: planType,
                  reason: 'Unlimited plan'
                }, null, 2)
              }
            ]
          };
        }

        // Get daily limits - Free plan defaults to 10 according to PRD
        const limits = { free: 10, pro: 100 };
        const dailyLimit = limits[planType] || 10; // Changed from 5 to 10 to match PRD

        // Check today's usage
        const today = new Date().toISOString().split('T')[0];
        const usageRef = db.collection('usage_tracking')
          .where('userId', '==', email)
          .where('date', '==', today);
        
        const usageSnapshot = await usageRef.get();
        let todayUsage = 0;
        
        if (!usageSnapshot.empty) {
          const usageData = usageSnapshot.docs[0].data();
          // Use nested structure only (production schema)
          todayUsage = usageData.requests ? usageData.requests.count || 0 : 0;
        }

        const canMakeRequest = todayUsage < dailyLimit;
        const remaining = Math.max(0, dailyLimit - todayUsage);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                canMakeRequest: canMakeRequest,
                planType: planType,
                usage: {
                  today: todayUsage,
                  limit: dailyLimit,
                  remaining: remaining
                },
                reason: canMakeRequest ? 'Within limits' : 'Daily limit exceeded'
              }, null, 2)
            }
          ]
        };
      }

      case 'increment_usage': {
        const { email } = args;
        if (!email) {
          throw new Error('Email is required');
        }

        const today = new Date().toISOString().split('T')[0];
        const now = new Date();

        // Get user plan
        const userRef = db.collection('users').doc(email);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
          throw new Error('User not found');
        }

        const userData = userDoc.data();
        const planType = userData.currentPlan || 'free'; // Changed from subscription.planType to currentPlan

        // Find or create usage document
        const usageQuery = db.collection('usage_tracking')
          .where('userId', '==', email)
          .where('date', '==', today);
        
        const usageSnapshot = await usageQuery.get();
        
        if (usageSnapshot.empty) {
          // Create new usage document with proper schema structure
          const trackingId = `${email}_${today}`;
          const usageRef = db.collection('usage_tracking').doc(trackingId); // Use trackingId as Document ID
          
          // Get plan limits for proper initialization
          const planRef = db.collection('subscription_plans').doc(planType);
          const planDoc = await planRef.get();
          const planData = planDoc.exists ? planDoc.data() : null;
          
          const dailyLimit = planData ? planData.limits?.dailyRequests : (planType === 'free' ? 10 : planType === 'pro' ? 100 : -1);
          const conversationLimit = planData ? planData.limits?.maxConversations : (planType === 'free' ? 5 : planType === 'pro' ? 50 : -1);
          
          await usageRef.set({
            trackingId: trackingId,
            userId: email,
            date: today,
            requests: {
              count: 1,
              limit: dailyLimit,
              remaining: dailyLimit === -1 ? -1 : dailyLimit - 1
            },
            tokens: {
              used: 0,
              limit: 10000,
              remaining: 10000
            },
            context: {
              used: 0,
              limit: 10000,
              remaining: 10000
            },
            conversations: {
              created: 0,
              limit: conversationLimit,
              remaining: conversationLimit === -1 ? -1 : conversationLimit
            },
            resetAt: now,
            createdAt: now,
            updatedAt: now
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: 'Usage incremented (new record)',
                  email: email,
                  date: today,
                  newCount: 1,
                  planType: planType
                }, null, 2)
              }
            ]
          };
        } else {
          // Update existing usage document with proper schema structure
          const usageDoc = usageSnapshot.docs[0];
          const currentData = usageDoc.data();
          // Use nested structure only (production schema)
          const currentCount = currentData.requests ? currentData.requests.count || 0 : 0;
          const newCount = currentCount + 1;
          
          // Get plan limits for proper remaining calculation
          const planRef = db.collection('subscription_plans').doc(planType);
          const planDoc = await planRef.get();
          const planData = planDoc.exists ? planDoc.data() : null;
          const dailyLimit = planData ? planData.limits?.dailyRequests : (planType === 'free' ? 10 : planType === 'pro' ? 100 : -1);
          
          await usageDoc.ref.update({
            'requests.count': newCount,
            'requests.limit': dailyLimit,
            'requests.remaining': dailyLimit === -1 ? -1 : Math.max(0, dailyLimit - newCount),
            updatedAt: now
          });

          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: 'Usage incremented',
                  email: email,
                  date: today,
                  previousCount: currentCount,
                  newCount: newCount,
                  planType: planType
                }, null, 2)
              }
            ]
          };
        }
      }

      case 'reset_daily_usage': {
        const { date = 'today' } = args;
        const targetDate = date === 'today' ? new Date().toISOString().split('T')[0] : date;
        
        // This is an admin function - in production, this would be a scheduled function
        const usageRef = db.collection('usage_tracking').where('date', '==', targetDate);
        const snapshot = await usageRef.get();
        
        const batch = db.batch();
        let resetCount = 0;

        snapshot.forEach(doc => {
          const data = doc.data();
          const planType = 'free'; // Default for reset, could be enhanced to get actual plan
          const dailyLimit = planType === 'free' ? 10 : planType === 'pro' ? 100 : -1;
          
          batch.update(doc.ref, {
            'requests.count': 0,
            'requests.remaining': dailyLimit === -1 ? -1 : dailyLimit,
            updatedAt: new Date()
          });
          resetCount++;
        });

        if (resetCount > 0) {
          await batch.commit();
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Daily usage reset for ${targetDate}`,
                resetCount: resetCount,
                date: targetDate
              }, null, 2)
            }
          ]
        };
      }

      case 'migrate_existing_users': {
        const { defaultPlan = 'free' } = args;
        
        if (!['free', 'pro', 'max'].includes(defaultPlan)) {
          throw new Error('Invalid default plan. Must be: free, pro, or max');
        }

        const usersRef = db.collection('users');
        const snapshot = await usersRef.get();
        
        const batch = db.batch();
        let migratedCount = 0;
        const now = new Date();

        snapshot.forEach(doc => {
          const userData = doc.data();
          
          // Only migrate users without currentPlan data
          if (!userData.currentPlan) {
            batch.update(doc.ref, {
              currentPlan: defaultPlan, // Use currentPlan field to match users collection schema
              updatedAt: now
            });
            migratedCount++;
          }
        });

        if (migratedCount > 0) {
          await batch.commit();
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Migrated ${migratedCount} users to ${defaultPlan} plan`,
                migratedCount: migratedCount,
                defaultPlan: defaultPlan,
                totalUsers: snapshot.size
              }, null, 2)
            }
          ]
        };
      }

      case 'create_user_original': {
        const { userId, email, originalFirstName, originalLastName, originalFullName } = args;
        if (!userId || !email || !originalFirstName || !originalLastName || !originalFullName) {
          throw new Error('All fields are required: userId, email, originalFirstName, originalLastName, originalFullName');
        }

        const userOriginalsRef = db.collection('user_originals').doc(); // Auto-generate Document ID to match schema
        const userOriginalsData = {
          userId: userId, // This is a field, not Document ID
          email: email,
          originalFirstName: originalFirstName,
          originalLastName: originalLastName,
          originalFullName: originalFullName,
          createdAt: new Date(),
          isLocked: true
        };

        await userOriginalsRef.set(userOriginalsData);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'User originals record created successfully',
                userId: userId,
                email: email
              }, null, 2)
            }
          ]
        };
      }

      case 'create_conversation': {
        const { userId, title, messages = [] } = args;
        if (!userId || !title) {
          throw new Error('userId and title are required');
        }

        const conversationRef = db.collection('conversations').doc();
        const now = new Date();
        
        const conversationData = {
          conversationId: conversationRef.id,
          userId: userId,
          title: title,
          messages: messages.map((msg, index) => ({
            id: msg.id || `msg_${index + 1}`,
            role: msg.role || 'user',
            content: msg.content || '',
            timestamp: msg.timestamp || now,
            tokens: msg.tokens || 0,
            request: msg.request || 0,
            context: msg.context || 0,
            agent: msg.agent || null
          })),
          messageCount: messages.length,
          totalTokens: messages.reduce((sum, msg) => sum + (msg.tokens || 0), 0),
          totalRequest: messages.reduce((sum, msg) => sum + (msg.request || 0), 0),
          totalContext: messages.reduce((sum, msg) => sum + (msg.context || 0), 0),
          createdAt: now,
          updatedAt: now,
          isArchived: false
        };

        await conversationRef.set(conversationData);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Conversation created successfully',
                conversationId: conversationRef.id,
                userId: userId,
                title: title
              }, null, 2)
            }
          ]
        };
      }

      case 'create_usage_analytics': {
        const { userId, date, requestsCount = 0 } = args;
        if (!userId || !date) {
          throw new Error('userId and date are required');
        }

        const analyticsId = `${userId}_${date}`;
        const analyticsRef = db.collection('usage_analytics').doc(analyticsId); // Use analyticsId as Document ID
        const now = new Date();
        
        const analyticsData = {
          analyticsId: analyticsId, // Add analyticsId field matching Document ID
          userId: userId,
          date: date,
          requestsCount: requestsCount,
          tokensUsed: 0,
          contextUsed: 0,
          conversationsCreated: 0,
          responseTimeAvg: 0,
          createdAt: now,
          updatedAt: now
        };

        await analyticsRef.set(analyticsData);

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Usage analytics record created successfully',
                analyticsId: analyticsId,
                userId: userId,
                date: date
              }, null, 2)
            }
          ]
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error.message,
            tool: name,
            arguments: args
          }, null, 2)
        }
      ]
    };
  }
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('🚀 Firebase MCP Server running on stdio');
}

main().catch(console.error);