import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  where,
  onSnapshot,
  getDoc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { sanitizeUid, sanitizeConversationCount, sanitizeUserData } from '../utils/logSanitizer';

class FirebaseService {
  constructor() {
    this.statusLogged = false;
  }

  // Check if Firebase is properly initialized
  isFirebaseReady() {
    const ready = db !== undefined;
    if (!this.statusLogged) {
      console.log('🔥 Firebase สถานะ:', ready ? '✅ พร้อมใช้งาน' : '❌ ยังไม่พร้อม');
      this.statusLogged = true;
    }
    return ready;
  }

  // Get current authenticated user
  getCurrentUser() {
    // In a real application, this would return the Firebase Auth user
    // For now, we'll return mock data for testing
    return {
      uid: 'mock-user-id',
      email: 'mock@example.com',
      displayName: 'Mock User'
    };
  }

  // Test Firestore connection
  async testFirestoreConnection() {
    try {
      console.log('🧪 ทดสอบการเชื่อมต่อ Firestore...');
      
      if (!this.isFirebaseReady()) {
        throw new Error('Firebase not initialized');
      }

      // Try to write a test document
      const testData = {
        test: true,
        timestamp: new Date(),
        message: 'ทดสอบการเชื่อมต่อ'
      };
      
      const docRef = await addDoc(collection(db, 'test'), testData);
      console.log('✅ เชื่อมต่อ Firestore สำเร็จ!', { docId: docRef.id });
      
      // Clean up test document
      await deleteDoc(doc(db, 'test', docRef.id));
      console.log('ลบข้อมูลทดสอบแล้ว');
      
      return true;
    } catch (error) {
      console.error('❌ ไม่สามารถเชื่อมต่อ Firestore:', error);
      return false;
    }
  }

  // Chat History Operations
  // Aligned with 'conversations' collection schema from PRD
  async saveChatHistory(userId, chatData) {
    try {
      console.log('💾 Firebase Service: เริ่มบันทึกข้อมูลการสนทนา...', { userId, title: chatData.title });
      
      if (!this.isFirebaseReady()) {
        throw new Error('Firebase not initialized');
      }
      
      const preparedMessages = (chatData.messages || []).map(msg => ({
        id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: String(msg.role || 'user'),
        content: String(msg.content || ''),
        timestamp: msg.timestamp || serverTimestamp(),
        tokens: msg.tokens || 0,
        request: msg.request || 0,
        context: msg.context || 0,
        agent: msg.agent || null
      }));
      
      const dataToSave = {
        userId: String(userId),
        title: String(chatData.title || 'การสนทนาใหม่'),
        messages: preparedMessages,
        messageCount: preparedMessages.length,
        totalTokens: preparedMessages.reduce((sum, msg) => sum + (msg.tokens || 0), 0),
        totalRequest: preparedMessages.reduce((sum, msg) => sum + (msg.request || 0), 0),
        totalContext: preparedMessages.reduce((sum, msg) => sum + (msg.context || 0), 0),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        isArchived: false
      };
      
      const docRef = await addDoc(collection(db, 'conversations'), dataToSave);
      
      console.log('✅ Firebase Service: บันทึกการสนทนาสำเร็จ!', { docId: docRef.id });
      return docRef.id;
    } catch (error) {
      console.error('❌ Firebase Service: เกิดข้อผิดพลาดในการบันทึกการสนทนา:', error);
      throw error;
    }
  }

  async getChatHistory(userId) {
    try {
      console.log('📂 Firebase Service: โหลดประวัติการสนทนา...');
      
      if (!this.isFirebaseReady()) {
        console.warn('Firebase not ready, returning empty history');
        return [];
      }
      
      if (!userId) {
        console.warn('No userId provided, returning empty history');
        return [];
      }
      
      const q = query(
        collection(db, 'conversations'),
        where('userId', '==', userId)
      );
      
      const querySnapshot = await getDocs(q);
      const chats = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('📊 พบข้อมูลประวัติการสนทนา:', sanitizeConversationCount(chats.length), 'รายการ');
      
      return chats.sort((a, b) => {
        const aTime = a.updatedAt?.toDate?.() || new Date(a.updatedAt || 0);
        const bTime = b.updatedAt?.toDate?.() || new Date(b.updatedAt || 0);
        return bTime - aTime;
      });
      
    } catch (error) {
      console.error('❌ Firebase Service: เกิดข้อผิดพลาดในการโหลดข้อมูล:', error);
      return [];
    }
  }

  async updateChatTitle(chatId, newTitle) {
    try {
      if (!this.isFirebaseReady()) {
        throw new Error('Firebase not initialized');
      }
      
      const chatRef = doc(db, 'conversations', chatId);
      await updateDoc(chatRef, {
        title: newTitle,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error('Error updating chat title:', error);
      throw error;
    }
  }

  async updateChatMessages(chatId, updateData) {
    try {
      if (!this.isFirebaseReady()) {
        throw new Error('Firebase not initialized');
      }
      
      const sanitizedData = {};
      
      if (updateData.messages) {
        sanitizedData.messages = updateData.messages.map(msg => ({
          id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          role: String(msg.role || 'user'),
          content: String(msg.content || ''),
          timestamp: msg.timestamp || serverTimestamp(),
          tokens: msg.tokens || 0,
          request: msg.request || 0,
          context: msg.context || 0,
          agent: msg.agent || null
        }));
        
        sanitizedData.messageCount = sanitizedData.messages.length;
        sanitizedData.totalTokens = sanitizedData.messages.reduce((sum, msg) => sum + (msg.tokens || 0), 0);
        sanitizedData.totalRequest = sanitizedData.messages.reduce((sum, msg) => sum + (msg.request || 0), 0);
        sanitizedData.totalContext = sanitizedData.messages.reduce((sum, msg) => sum + (msg.context || 0), 0);
      }
      
      sanitizedData.updatedAt = serverTimestamp();
      
      const chatRef = doc(db, 'conversations', chatId);
      await updateDoc(chatRef, sanitizedData);
      console.log('✅ Firebase Service: อัปเดตข้อมูลสำเร็จ!', { chatId });
    } catch (error) {
      console.error('❌ Firebase Service: เกิดข้อผิดพลาดในการอัปเดต:', error);
      throw error;
    }
  }

  async deleteChat(chatId) {
    try {
      if (!this.isFirebaseReady()) {
        throw new Error('Firebase not initialized');
      }
      
      await deleteDoc(doc(db, 'conversations', chatId));
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  }

  // User Management Operations
  async checkUserExists(uid) {
    try {
      if (!this.isFirebaseReady()) {
        console.warn('Firebase not ready, using mock user check');
        return false;
      }
      
      const userRef = doc(db, 'users', uid);
      const userDoc = await getDoc(userRef);
      return userDoc.exists();
    } catch (error) {
      console.error('Error checking user:', error);
      return false;
    }
  }

  // Aligned with 'users' and 'usage_analytics' collection schemas from PRD
  async createUserProfile(userData) {
    try {
      if (!this.isFirebaseReady()) {
        console.warn('Firebase not ready, using mock user profile creation');
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('✅ Mock user profile created:', userData);
        return true;
      }
      
      const userRef = doc(db, 'users', userData.uid);
      
      const userProfile = {
        email: userData.email || '',
        displayName: userData.displayName || '',
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        photoURL: userData.photoURL || '',
        currentPlan: 'free',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        lastLoginAt: serverTimestamp(),
        isActive: true
      };
      
      console.log('💾 Creating user profile:', sanitizeUserData(userData));
      
      await setDoc(userRef, userProfile);

      // สร้าง user_originals record เพื่อป้องกันการสมัครซ้ำและใช้โควต้าฟรีเพิ่ม
      // Aligned with 'user_originals' collection schema from DATABASE_ARCHITECTURE_SUMMARY.md
      try {
        console.log('🔒 Creating user_originals record for anti-abuse protection...');
        
        // Check if user_originals record already exists
        const originalsQuery = query(
          collection(db, 'user_originals'),
          where('userId', '==', userData.uid)
        );
        const originalsSnapshot = await getDocs(originalsQuery);
        
        if (!originalsSnapshot.empty) {
          console.log('✅ User originals record already exists');
        } else {
          // Create user_originals record with auto-generated Document ID
          const userOriginalsData = {
            userId: userData.uid, // Changed from 'uid' to 'userId' to match schema
            email: userData.email || '',
            originalFirstName: userData.firstName || '', // Added as per schema
            originalLastName: userData.lastName || '', // Added as per schema
            originalFullName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim(), // Added as per schema
            createdAt: serverTimestamp(),
            isLocked: true // Set to true as per schema for anti-abuse protection
          };
          
          const originalsDocRef = await addDoc(collection(db, 'user_originals'), userOriginalsData);
          console.log('✅ User originals record created successfully (ID hidden for security)');
        }
      } catch (originalsError) {
        console.error('⚠️ Failed to create user_originals record:', originalsError);
      }

      // สร้าง initial usage tracking record
      try {
        console.log('📊 Creating initial usage tracking for new user...');
        const today = new Date().toISOString().split('T')[0];
        const trackingId = `${userData.uid}_${today}`;
        const trackingRef = doc(db, 'usage_tracking', trackingId);
        const initialTrackingData = {
          trackingId,
          userId: userData.uid,
          date: today,
          requests: {
            count: 0,
            limit: 10, // Free plan limit
            remaining: 10
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
            limit: 5,
            remaining: 5
          },
          resetAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };
        await setDoc(trackingRef, initialTrackingData);
        console.log('✅ Initial usage tracking created successfully.');
      } catch (trackingError) {
        console.error('⚠️ Failed to create initial usage tracking:', trackingError);
      }

      // สร้าง usage analytics (MANDATORY - จำเป็นสำหรับ analytics ที่ถูกต้อง)
      try {
        console.log('📊 Creating initial usage analytics for new user...');
        const today = new Date().toISOString().split('T')[0];
        const analyticsId = `${userData.uid}_${today}`;
        const analyticsRef = doc(db, 'usage_analytics', analyticsId); // Use analyticsId as Document ID
        const initialAnalyticsData = {
            analyticsId: analyticsId, // Add analyticsId field matching Document ID
            userId: userData.uid,
            date: today,
            requestsCount: 0,
            tokensUsed: 0,
            contextUsed: 0,
            conversationsCreated: 0,
            responseTimeAvg: 0,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        };
        
        // Try to create analytics with retry - เพิ่ม retry เป็น 5 ครั้ง
        let retryCount = 0;
        const maxRetries = 5;
        
        while (retryCount < maxRetries) {
          try {
            await setDoc(analyticsRef, initialAnalyticsData); // Use setDoc to set Document ID as analyticsId
            console.log('✅ Initial usage analytics created successfully.');
            break;
          } catch (retryError) {
            retryCount++;
            console.warn(`⚠️ Attempt ${retryCount}/${maxRetries} to create usage analytics failed:`, retryError.message);
            
            if (retryCount >= maxRetries) {
              console.error('🚨 CRITICAL: Failed to create usage_analytics after all retries');
              throw retryError; // ตอนนี้ throw error เพื่อไม่ให้ user registration สำเร็จโดยไม่มี analytics
            }
            
            // Wait before retry - เพิ่มเวลา wait
            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
          }
        }
      } catch (analyticsError) {
          console.error('❌ FAILED to create initial usage analytics:', analyticsError.message);
          console.error('🚨 This is now a CRITICAL ERROR that prevents user registration');
          throw new Error(`Failed to create usage_analytics: ${analyticsError.message}`);
      }
      
      return true;
    } catch (error) {
      console.error('Error creating user profile:', error);
      throw error;
    }
  }

  async getUserProfile(userId) {
    try {
      if (!this.isFirebaseReady() || !userId) {
        return null;
      }
      
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (userDoc.exists()) {
        return {
          id: userDoc.id,
          ...userDoc.data()
        };
      }
      
      return null;
    } catch (error) {
      console.error('❌ Error getting user profile:', error);
      return null;
    }
  }

  async getOriginalUserData(userId) {
    try {
      if (!this.isFirebaseReady() || !userId) {
        return null;
      }
      
      // Query user_originals collection by userId field (not document ID)
      const originalsQuery = query(
        collection(db, 'user_originals'),
        where('userId', '==', userId)
      );
      const originalsSnapshot = await getDocs(originalsQuery);
      
      if (!originalsSnapshot.empty) {
        const originalDoc = originalsSnapshot.docs[0];
        return {
          id: originalDoc.id,
          ...originalDoc.data()
        };
      }
      
      return await this.getUserProfile(userId);
    } catch (error) {
      console.error('❌ Error getting original user data:', error);
      return null;
    }
  }

  // Save original user data for anti-abuse protection
  // Aligned with 'user_originals' collection schema from DATABASE_ARCHITECTURE_SUMMARY.md
  async saveOriginalUserData(userId, email, firstName, lastName) {
    try {
      if (!this.isFirebaseReady()) {
        console.warn('Firebase not ready, skipping user_originals creation');
        return false;
      }

      console.log('🔒 Saving original user data for anti-abuse protection...');
      
      // Check if user_originals record already exists
      const originalsQuery = query(
        collection(db, 'user_originals'),
        where('userId', '==', userId)
      );
      const originalsSnapshot = await getDocs(originalsQuery);
      
      if (!originalsSnapshot.empty) {
        console.log('✅ User originals record already exists');
        return true;
      }

      // Create user_originals record with auto-generated Document ID
      const userOriginalsData = {
        userId: userId, // Field, not Document ID
        email: email || '',
        originalFirstName: firstName || '',
        originalLastName: lastName || '',
        originalFullName: `${firstName || ''} ${lastName || ''}`.trim() || email?.split('@')[0] || '',
        createdAt: serverTimestamp(),
        isLocked: true // Set to true as per schema for anti-abuse protection
      };
      
      const originalsDocRef = await addDoc(collection(db, 'user_originals'), userOriginalsData);
      console.log('✅ User originals record created successfully (ID hidden for security)');
      console.log('📋 Original user data saved:', sanitizeUserData({ userId, email, firstName, lastName }));
      
      return true;
    } catch (error) {
      console.error('❌ Error saving original user data:', error);
      return false;
    }
  }

  async updateUserLastLogin(userId) {
    try {
      if (!this.isFirebaseReady() || !userId) {
        return false;
      }
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        lastLoginAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Last login updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error updating last login:', error);
      return false;
    }
  }

  async setUserCurrentPlan(userId, planId) {
    try {
      if (!this.isFirebaseReady() || !userId) {
        return false;
      }
      
      console.log('💾 Setting user current plan...');
      
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        currentPlan: planId,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ User current plan updated successfully');
      return true;
    } catch (error) {
      console.error('❌ Error setting user current plan:', error);
      return false;
    }
  }

  async getUserCurrentPlan(userId) {
    try {
      if (!this.isFirebaseReady() || !userId) {
        console.log('🔍 getUserCurrentPlan: Firebase not ready or no userId:', { ready: this.isFirebaseReady(), userId });
        return 'free';
      }
      
      console.log('🔍 getUserCurrentPlan: Checking user plan...');
      
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.log('❌ getUserCurrentPlan: User document not found, returning free');
        return 'free';
      }
      
      const userData = userDoc.data();
      if (userData.currentPlan) {
        console.log('✅ getUserCurrentPlan: Found plan in user document:', userData.currentPlan);
        return userData.currentPlan;
      }
      
      return 'free';
    } catch (error) {
      console.error('❌ Error getting user current plan:', error);
      return 'free';
    }
  }

  // Real-time listener
  subscribeToChatHistory(userId, callback) {
    if (!this.isFirebaseReady()) {
      console.warn('Firebase not ready, cannot subscribe');
      callback([]);
      return () => {};
    }
    
    const q = query(
      collection(db, 'conversations'),
      where('userId', '==', userId)
    );
    
    return onSnapshot(q, (querySnapshot) => {
      const chats = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      const sortedChats = chats.sort((a, b) => {
        const aTime = a.updatedAt?.toDate?.() || new Date(a.updatedAt || 0);
        const bTime = b.updatedAt?.toDate?.() || new Date(b.updatedAt || 0);
        return bTime - aTime;
      });
      
      callback(sortedChats);
    }, (error) => {
      console.error('Error in chat history subscription:', error);
      callback([]);
    });
  }

  // Subscription and Plan Operations
  async getSubscriptionPlans() {
    try {
      if (!this.isFirebaseReady()) {
        console.warn('Firebase not ready, returning empty plan data');
        return {};
      }
      
      const plansRef = collection(db, 'subscription_plans');
      const querySnapshot = await getDocs(plansRef);
      
      const plans = {};
      querySnapshot.forEach(doc => {
        plans[doc.id] = {
          id: doc.id,
          ...doc.data()
        };
      });
      
      console.log('✅ Subscription plans loaded:', Object.keys(plans).length, 'plans');
      return plans;
    } catch (error) {
      console.error('❌ Error loading subscription plans:', error);
      return {};
    }
  }

  // Aligned with 'subscription_plans' collection schema from PRD
  async initializeSubscriptionPlans() {
    try {
      if (!this.isFirebaseReady()) {
        console.warn('Firebase not ready, skipping subscription plans initialization');
        return false;
      }
      
      console.log('🔧 Initializing subscription plans according to PRD...');
      
      const plans = {
        free: {
          planId: "free",
          name: "Free Plan",
          description: "Basic AI chat features, File Analysis, Generate Image, Generative AI",
          prices: {
            monthly: { amount: 0, currency: "usd", stripePriceId: "price_free_monthly_xxxx" }
          },
          limits: {
            dailyRequests: 10,
            monthlyRequests: 300,
            maxTokensPerRequest: 1000,
            maxConversations: 5
          },
          features: ["basic_chat", "file_analysis", "generate_image", "generative_ai"],
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        pro: {
          planId: "pro",
          name: "Pro Plan",
          description: "Advance Agent Chat, File Analysis, Code Analysis, Generate Image, Generative AI, Connect Tools",
          prices: {
            monthly: { amount: 1500, currency: "usd", stripePriceId: "price_pro_monthly_xxxx" },
            yearly: { amount: 12000, currency: "usd", stripePriceId: "price_pro_yearly_yyyy" }
          },
          limits: {
            dailyRequests: 100,
            monthlyRequests: 3000,
            maxTokensPerRequest: 10000,
            maxConversations: 50
          },
          features: ["advance_chat", "file_analysis", "code_analysis", "generate_image", "generative_ai", "connect_tools"],
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        },
        max: {
          planId: "max",
          name: "Max Plan",
          description: "Advance Agent Chat, File Analysis, Code Analysis, Generate Image, Generative AI, Connect Tools, Priority Support, Cerebras AI",
          prices: {
            monthly: { amount: 2000, currency: "usd", stripePriceId: "price_xxxxxxxxxxxxxx" },
            yearly: { amount: 21600, currency: "usd", stripePriceId: "price_yyyyyyyyyyyyyy" }
          },
          limits: {
            dailyRequests: -1,
            monthlyRequests: -1,
            maxTokensPerRequest: -1,
            maxConversations: -1
          },
          features: ["advance_chat", "file_analysis", "code_analysis", "generate_image", "generative_ai", "connect_tools", "priority_support", "cerebras_ai"],
          isActive: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }
      };
      
      for (const [planId, planData] of Object.entries(plans)) {
        const planRef = doc(db, 'subscription_plans', planId);
        await setDoc(planRef, planData);
        console.log(`✅ Subscription plan '${planId}' initialized/updated.`);
      }
      
      console.log('🎉 All subscription plans are aligned with PRD.');
      return true;
    } catch (error) {
      console.error('❌ Error initializing subscription plans:', error);
      return false;
    }
  }

  // Aligned with 'billing_transactions' collection schema from PRD
  async createBillingTransaction(transactionData) {
    try {
      if (!this.isFirebaseReady()) {
        throw new Error('Firebase not initialized');
      }

      console.log('💳 Creating new billing transaction...');

      const dataToSave = {
        userId: transactionData.userId,
        amount: transactionData.amount,
        currency: transactionData.currency,
        planId: transactionData.planId,
        planType: transactionData.planType, // 'monthly' or 'yearly'
        status: transactionData.status || 'completed', // 'pending', 'completed', 'failed', 'refunded'
        paymentMethod: transactionData.paymentMethod || 'card',
        stripePaymentIntentId: transactionData.stripePaymentIntentId || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      const docRef = await addDoc(collection(db, 'billing_transactions'), dataToSave);
      
      // Add transactionId field matching Document ID
      await updateDoc(docRef, {
        transactionId: docRef.id
      });
      
      console.log('✅ Billing transaction created successfully:', { transactionId: docRef.id });
      return docRef.id;
    } catch (error) {
      console.error('❌ Error creating billing transaction:', error);
      throw error;
    }
  }

  // Delete User - Deletes user and all related data from every relevant collection
  async deleteUser(userId) {
    try {
      if (!this.isFirebaseReady()) {
        throw new Error('Firebase not initialized');
      }
      
      console.log('🗑️ Starting user deletion process for:', userId);
      
      const userRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userRef);
      
      if (!userDoc.exists()) {
        console.log('❌ User not found in users collection:', userId);
        return { success: false, message: 'User not found' };
      }
      
      const userData = userDoc.data();
      console.log('👤 Found user:', sanitizeUserData(userData));
      
      const deletePromises = [];

      // Delete from 'conversations'
      const conversationsQuery = query(collection(db, 'conversations'), where('userId', '==', userId));
      const conversationsSnapshot = await getDocs(conversationsQuery);
      console.log('💬 Found conversations to delete:', conversationsSnapshot.size);
      conversationsSnapshot.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
      
      // Delete from 'usage_analytics'
      const analyticsQuery = query(collection(db, 'usage_analytics'), where('userId', '==', userId));
      const analyticsSnapshot = await getDocs(analyticsQuery);
      console.log('📊 Found analytics documents to delete:', analyticsSnapshot.size);
      analyticsSnapshot.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));

      // Delete from 'usage_tracking'
      const trackingQuery = query(collection(db, 'usage_tracking'), where('userId', '==', userId));
      const trackingSnapshot = await getDocs(trackingQuery);
      console.log('📈 Found usage tracking documents to delete:', trackingSnapshot.size);
      trackingSnapshot.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));

      // Delete from 'billing_transactions'
      const billingQuery = query(collection(db, 'billing_transactions'), where('userId', '==', userId));
      const billingSnapshot = await getDocs(billingQuery);
      console.log('💳 Found billing documents to delete:', billingSnapshot.size);
      billingSnapshot.forEach(doc => deletePromises.push(deleteDoc(doc.ref)));
      
      // Finally, delete user document
      deletePromises.push(deleteDoc(userRef));
      
      await Promise.all(deletePromises);
      
      console.log('✅ User deletion completed successfully:', userId);
      
      return {
        success: true,
        message: `ลบผู้ใช้ ${userData.displayName} (${userData.email}) และข้อมูลที่เกี่ยวข้องทั้งหมดสำเร็จ`,
        deletedData: {
          userId,
          displayName: userData.displayName,
          email: userData.email,
          conversationsDeleted: conversationsSnapshot.size,
          analyticsDeleted: analyticsSnapshot.size,
          trackingDeleted: trackingSnapshot.size,
          billingDeleted: billingSnapshot.size
        }
      };
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      return {
        success: false,
        message: `เกิดข้อผิดพลาดในการลบผู้ใช้: ${error.message}`,
        error: error.message
      };
    }
  }
  
  // Aligned with 'usage_tracking' collection schema from PRD
  async createUsageTracking(userId, date) {
    try {
      if (!this.isFirebaseReady()) {
        console.warn('Firebase not ready, skipping usage tracking creation');
        return false;
      }
      
      console.log('📊 Creating usage tracking document...');
      
      const planId = await this.getUserCurrentPlan(userId);
      const plans = await this.getSubscriptionPlans();
      const currentPlan = plans[planId] || plans['free'];
      
      const planLimits = currentPlan.limits || {
        dailyRequests: 10,
        maxConversations: 5
      };
      
      const trackingId = `${userId}_${date}`;
      
      const trackingRef = doc(db, 'usage_tracking', trackingId);
      const trackingData = {
        trackingId,
        userId,
        date,
        requests: {
          count: 0,
          limit: planLimits.dailyRequests,
          remaining: planLimits.dailyRequests
        },
        tokens: {
          used: 0,
          limit: 10000, // Default, can be adjusted based on plan
          remaining: 10000
        },
        context: {
          used: 0,
          limit: 10000, // Default, can be adjusted
          remaining: 10000
        },
        conversations: {
          created: 0,
          limit: planLimits.maxConversations,
          remaining: planLimits.maxConversations
        },
        resetAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      
      await setDoc(trackingRef, trackingData);
      console.log('✅ Usage tracking document created successfully');
      return true;
    } catch (error) {
      console.error('❌ Error creating usage tracking document:', error);
      return false;
    }
  }
  
  async getDailyUsage(userId, date) {
    try {
      if (!this.isFirebaseReady()) {
        console.warn('Firebase not ready, returning default usage data');
        return null;
      }
      
      const trackingId = `${userId}_${date}`;
      const trackingRef = doc(db, 'usage_tracking', trackingId);
      const trackingDoc = await getDoc(trackingRef);
      
      if (trackingDoc.exists()) {
        return trackingDoc.data();
      }
      
      await this.createUsageTracking(userId, date);
      const newTrackingDoc = await getDoc(trackingRef);
      return newTrackingDoc.exists() ? newTrackingDoc.data() : null;

    } catch (error) {
      console.error('❌ Error getting daily usage:', error);
      return null;
    }
  }
  
  async incrementUsage(userId, date, usageType, amount = 1) {
    try {
      if (!this.isFirebaseReady()) {
        console.warn('Firebase not ready, skipping usage increment');
        return false;
      }
      
      const trackingId = `${userId}_${date}`;
      const trackingRef = doc(db, 'usage_tracking', trackingId);
      let trackingData = await this.getDailyUsage(userId, date);

      if (!trackingData) {
        await this.createUsageTracking(userId, date);
        trackingData = await this.getDailyUsage(userId, date);
        if (!trackingData) {
            console.error('Failed to create or get tracking document after retry.');
            return false;
        }
      }
      
      const updateData = { updatedAt: serverTimestamp() };
      
      switch (usageType) {
        case 'requests':
          updateData['requests.count'] = (trackingData.requests.count || 0) + amount;
          updateData['requests.remaining'] = trackingData.requests.limit - updateData['requests.count'];
          break;
        case 'tokens':
          updateData['tokens.used'] = (trackingData.tokens.used || 0) + amount;
          updateData['tokens.remaining'] = trackingData.tokens.limit - updateData['tokens.used'];
          break;
        case 'context':
          updateData['context.used'] = (trackingData.context.used || 0) + amount;
          updateData['context.remaining'] = trackingData.context.limit - updateData['context.used'];
          break;
        case 'conversations':
          updateData['conversations.created'] = (trackingData.conversations.created || 0) + amount;
          updateData['conversations.remaining'] = trackingData.conversations.limit - updateData['conversations.created'];
          break;
        default:
          console.warn('Unknown usage type:', usageType);
          return false;
      }
      
      await updateDoc(trackingRef, updateData);
      console.log(`✅ Usage ${usageType} incremented by ${amount}`);
      return true;
    } catch (error) {
      console.error('❌ Error incrementing usage:', error);
      return false;
    }
  }
}

export default new FirebaseService();
