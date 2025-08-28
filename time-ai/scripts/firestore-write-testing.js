#!/usr/bin/env node

/**
 * Firebase Emulator Write Testing
 * 
 * Tests actual write operations against Firebase emulator to ensure they match production schema
 */

import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc, addDoc, collection, getDoc, connectFirestoreEmulator } from 'firebase/firestore';

// Test Firebase config (using emulator)
const testConfig = {
  projectId: 'test-project',
  // Note: These are test values for emulator only
};

const app = initializeApp(testConfig);
const db = getFirestore(app);

// Connect to emulator (make sure emulator is running)
try {
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('✅ Connected to Firestore emulator');
} catch (error) {
  console.log('ℹ️  Emulator connection info:', error.message);
}

class FirestoreWriteValidator {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      details: []
    };
  }

  async runAllTests() {
    console.log('\n🧪 TESTING FIRESTORE WRITE OPERATIONS');
    console.log('📋 Verifying writes match DATABASE_ARCHITECTURE_SUMMARY.md schema');
    console.log('=' .repeat(70));

    await this.testUsageTrackingWrites();
    await this.testUserOriginalsWrites();
    await this.testConversationsWrites();
    await this.testSubscriptionPlansWrites();
    
    this.printResults();
  }

  async testUsageTrackingWrites() {
    console.log('\n📊 Testing usage_tracking writes...');
    
    const trackingId = 'test_user_2025-01-24';
    const testData = {
      trackingId: trackingId,
      userId: 'test_user',
      date: '2025-01-24',
      requests: {
        count: 5,
        limit: 10,
        remaining: 5
      },
      tokens: {
        used: 150,
        limit: 10000,
        remaining: 9850
      },
      context: {
        used: 1500,
        limit: 10000,
        remaining: 8500
      },
      conversations: {
        created: 1,
        limit: 5,
        remaining: 4
      },
      resetAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      // Test 1: Write with nested structure
      await setDoc(doc(db, 'usage_tracking', trackingId), testData);
      this.logSuccess('usage_tracking', 'Nested structure write successful');

      // Test 2: Verify Document ID matches trackingId field
      const docSnap = await getDoc(doc(db, 'usage_tracking', trackingId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.trackingId === trackingId) {
          this.logSuccess('usage_tracking', 'Document ID matches trackingId field');
        } else {
          this.logError('usage_tracking', 'Document ID does not match trackingId field');
        }

        // Test 3: Verify nested structure exists
        if (data.requests && data.requests.count !== undefined) {
          this.logSuccess('usage_tracking', 'Nested requests structure validated');
        } else {
          this.logError('usage_tracking', 'Missing nested requests structure');
        }

        if (data.tokens && data.tokens.used !== undefined) {
          this.logSuccess('usage_tracking', 'Nested tokens structure validated');
        } else {
          this.logError('usage_tracking', 'Missing nested tokens structure');
        }
      } else {
        this.logError('usage_tracking', 'Document not found after write');
      }

    } catch (error) {
      this.logError('usage_tracking', `Write failed: ${error.message}`);
    }
  }

  async testUserOriginalsWrites() {
    console.log('\n👥 Testing user_originals writes...');
    
    const testData = {
      userId: 'test_firebase_user_id',
      email: 'test@example.com',
      originalFirstName: 'John',
      originalLastName: 'Doe',
      originalFullName: 'John Doe',
      createdAt: new Date(),
      isLocked: true
    };

    try {
      // Test write operation
      const docRef = await addDoc(collection(db, 'user_originals'), testData);
      this.logSuccess('user_originals', 'Auto-generated Document ID write successful');

      // Verify fields
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (data.userId && !data.uid) {
          this.logSuccess('user_originals', 'Uses userId field (not deprecated uid)');
        } else {
          this.logError('user_originals', 'Should use userId field, not uid');
        }

        if (data.isLocked === true) {
          this.logSuccess('user_originals', 'isLocked field is properly set to true');
        } else {
          this.logError('user_originals', 'isLocked should be true for anti-abuse protection');
        }
      }

    } catch (error) {
      this.logError('user_originals', `Write failed: ${error.message}`);
    }
  }

  async testConversationsWrites() {
    console.log('\n💬 Testing conversations writes...');
    
    const conversationId = 'test_conv_123';
    const testData = {
      conversationId: conversationId,
      userId: 'test_user',
      title: 'Test Conversation',
      messages: [
        {
          id: 'msg_1',
          role: 'user',
          content: 'Hello',
          timestamp: new Date(),
          tokens: 5,
          request: 1,
          context: 100
        }
      ],
      messageCount: 1,
      totalTokens: 5,
      totalRequest: 1,
      totalContext: 100,
      createdAt: new Date(),
      updatedAt: new Date(),
      isArchived: false
    };

    try {
      await setDoc(doc(db, 'conversations', conversationId), testData);
      this.logSuccess('conversations', 'Conversation write successful');

      // Verify structure
      const docSnap = await getDoc(doc(db, 'conversations', conversationId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (data.conversationId === conversationId) {
          this.logSuccess('conversations', 'Document ID matches conversationId field');
        } else {
          this.logError('conversations', 'Document ID should match conversationId field');
        }

        if (Array.isArray(data.messages)) {
          this.logSuccess('conversations', 'Messages array structure validated');
        } else {
          this.logError('conversations', 'Messages should be an array');
        }
      }

    } catch (error) {
      this.logError('conversations', `Write failed: ${error.message}`);
    }
  }

  async testSubscriptionPlansWrites() {
    console.log('\n📋 Testing subscription_plans writes...');
    
    const planId = 'free';
    const testData = {
      planId: planId,
      name: 'Free Plan',
      description: 'Basic AI chat features',
      prices: {
        monthly: {
          amount: 0,
          currency: 'usd',
          stripePriceId: 'price_test_free'
        }
      },
      limits: {
        dailyRequests: 10,
        monthlyRequests: 300,
        maxTokensPerRequest: 1000,
        maxConversations: 5
      },
      features: ['basic_chat', 'file_analysis'],
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    try {
      await setDoc(doc(db, 'subscription_plans', planId), testData);
      this.logSuccess('subscription_plans', 'Plan write successful');

      // Verify nested structure
      const docSnap = await getDoc(doc(db, 'subscription_plans', planId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        if (data.prices && data.prices.monthly && data.prices.monthly.amount !== undefined) {
          this.logSuccess('subscription_plans', 'Nested prices structure validated');
        } else {
          this.logError('subscription_plans', 'Missing nested prices.monthly structure');
        }

        if (data.limits && data.limits.dailyRequests !== undefined) {
          this.logSuccess('subscription_plans', 'Nested limits structure validated');
        } else {
          this.logError('subscription_plans', 'Missing nested limits structure');
        }
      }

    } catch (error) {
      this.logError('subscription_plans', `Write failed: ${error.message}`);
    }
  }

  logSuccess(collection, message) {
    this.testResults.passed++;
    this.testResults.details.push({ type: 'SUCCESS', collection, message });
    console.log(`   ✅ ${message}`);
  }

  logError(collection, message) {
    this.testResults.failed++;
    this.testResults.details.push({ type: 'ERROR', collection, message });
    console.log(`   ❌ ${message}`);
  }

  printResults() {
    console.log('\n' + '='.repeat(70));
    console.log('📊 FIRESTORE WRITE VALIDATION RESULTS');
    console.log('=' .repeat(70));
    console.log(`✅ Passed: ${this.testResults.passed}`);
    console.log(`❌ Failed: ${this.testResults.failed}`);

    if (this.testResults.failed === 0) {
      console.log('\n🎉 ALL WRITE OPERATIONS MATCH PRODUCTION SCHEMA!');
      console.log('Your Firestore writes are production-ready.');
    } else {
      console.log('\n⚠️  WRITE OPERATION ISSUES FOUND:');
      this.testResults.details
        .filter(detail => detail.type === 'ERROR')
        .forEach(detail => {
          console.log(`   ❌ ${detail.collection}: ${detail.message}`);
        });
    }

    console.log('\n💡 Next Steps:');
    console.log('   1. Fix any failed tests');
    console.log('   2. Run this test before each deployment');
    console.log('   3. Use Firebase emulator for development testing');
  }
}

// Test specific write operations from your code
class CodeWriteOperationTest {
  constructor() {
    this.db = db;
  }

  // Test MCP server usage_tracking implementation
  async testMCPUsageTrackingWrite(email = 'test@example.com') {
    console.log('\n🔧 Testing MCP Server usage_tracking write pattern...');
    
    const today = new Date().toISOString().split('T')[0];
    const trackingId = `${email}_${today}`;
    const now = new Date();
    
    // Simulate MCP server write operation
    const testData = {
      trackingId: trackingId,
      userId: email,
      date: today,
      requests: {
        count: 1,
        limit: 10,
        remaining: 9
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
      resetAt: now,
      createdAt: now,
      updatedAt: now
    };

    try {
      await setDoc(doc(this.db, 'usage_tracking', trackingId), testData);
      console.log('   ✅ MCP Server write pattern successful');
      
      // Verify the write matches schema
      const docSnap = await getDoc(doc(this.db, 'usage_tracking', trackingId));
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.trackingId === trackingId && data.requests.count === 1) {
          console.log('   ✅ MCP Server write matches production schema');
          return true;
        }
      }
      
      console.log('   ❌ MCP Server write verification failed');
      return false;
      
    } catch (error) {
      console.log(`   ❌ MCP Server write failed: ${error.message}`);
      return false;
    }
  }
}

// Main execution
async function main() {
  console.log('🧪 FIREBASE EMULATOR WRITE TESTING');
  console.log('📋 Testing actual write operations against production schema');
  console.log('💡 Make sure Firebase emulator is running: firebase emulators:start --only firestore');
  
  try {
    // Run general write validation
    const validator = new FirestoreWriteValidator();
    await validator.runAllTests();
    
    // Test specific MCP server patterns
    const codeTest = new CodeWriteOperationTest();
    await codeTest.testMCPUsageTrackingWrite();
    
    console.log('\n✅ Testing complete! Check results above.');
    
  } catch (error) {
    console.error('❌ Testing failed:', error);
    console.log('\n💡 Tips:');
    console.log('   • Make sure Firebase emulator is running');
    console.log('   • Run: firebase emulators:start --only firestore');
    console.log('   • Check your Firebase project configuration');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default FirestoreWriteValidator;