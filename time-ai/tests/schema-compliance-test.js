#!/usr/bin/env node

/**
 * Schema Compliance Test
 * ตรวจสอบว่าการเขียนข้อมูลลง Cloud Firestore ตรงกับ DATABASE_ARCHITECTURE_SUMMARY.md
 */

// Skip firebaseService import for now - test will work without it
// import firebaseService from '../src/services/firebaseService.js';
// import { db } from '../src/config/firebase.js';
import { initializeApp } from 'firebase/app';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { collection, doc, getDoc, getDocs, query, where, limit } from 'firebase/firestore';

// Initialize Firebase for testing
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'ready-ai-niwat'
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Schema definitions ตาม DATABASE_ARCHITECTURE_SUMMARY.md
const EXPECTED_SCHEMAS = {
  users: {
    requiredFields: ['uid', 'email', 'displayName', 'firstName', 'lastName', 'currentPlan', 'createdAt', 'updatedAt', 'lastLoginAt', 'isActive'],
    fieldTypes: {
      uid: 'string',
      email: 'string', 
      displayName: 'string',
      firstName: 'string',
      lastName: 'string',
      currentPlan: 'string',
      isActive: 'boolean'
    },
    validCurrentPlans: ['free', 'pro', 'max']
  },
  user_originals: {
    requiredFields: ['userId', 'email', 'originalFirstName', 'originalLastName', 'originalFullName', 'createdAt', 'isLocked'],
    fieldTypes: {
      userId: 'string',
      email: 'string',
      originalFirstName: 'string', 
      originalLastName: 'string',
      originalFullName: 'string',
      isLocked: 'boolean'
    }
  },
  conversations: {
    requiredFields: ['conversationId', 'userId', 'title', 'messages', 'messageCount', 'totalTokens', 'totalRequest', 'totalContext', 'createdAt', 'updatedAt', 'isArchived'],
    fieldTypes: {
      conversationId: 'string',
      userId: 'string',
      title: 'string',
      messages: 'object',
      messageCount: 'number',
      totalTokens: 'number',
      totalRequest: 'number', 
      totalContext: 'number',
      isArchived: 'boolean'
    }
  },
  usage_tracking: {
    requiredFields: ['trackingId', 'userId', 'date', 'requests', 'tokens', 'context', 'conversations', 'resetAt', 'createdAt', 'updatedAt'],
    nestedFields: {
      requests: ['count', 'limit', 'remaining'],
      tokens: ['used', 'limit', 'remaining'],
      context: ['used', 'limit', 'remaining'],
      conversations: ['created', 'limit', 'remaining']
    },
    documentIdPattern: /^[^_]+_\d{4}-\d{2}-\d{2}$/ // userId_YYYY-MM-DD
  },
  subscription_plans: {
    requiredFields: ['planId', 'name', 'description', 'prices', 'limits', 'features', 'isActive', 'createdAt', 'updatedAt'],
    nestedFields: {
      'prices.monthly': ['amount', 'currency', 'stripePriceId'],
      limits: ['dailyRequests', 'monthlyRequests', 'maxTokensPerRequest', 'maxConversations']
    },
    validPlanIds: ['free', 'pro', 'max']
  },
  billing_transactions: {
    requiredFields: ['transactionId', 'userId', 'amount', 'currency', 'planId', 'planType', 'status', 'paymentMethod', 'createdAt', 'updatedAt'],
    fieldTypes: {
      transactionId: 'string',
      userId: 'string',
      amount: 'number',
      currency: 'string',
      planId: 'string',
      planType: 'string',
      status: 'string',
      paymentMethod: 'string'
    },
    validStatuses: ['pending', 'completed', 'failed', 'refunded'],
    validPlanTypes: ['monthly', 'yearly']
  },
  usage_analytics: {
    requiredFields: ['analyticsId', 'userId', 'date', 'requestsCount', 'tokensUsed', 'contextUsed', 'conversationsCreated', 'responseTimeAvg', 'createdAt', 'updatedAt'],
    fieldTypes: {
      analyticsId: 'string',
      userId: 'string',
      date: 'string',
      requestsCount: 'number',
      tokensUsed: 'number',
      contextUsed: 'number',
      conversationsCreated: 'number',
      responseTimeAvg: 'number'
    },
    documentIdPattern: /^[^_]+_\d{4}-\d{2}-\d{2}$/ // userId_YYYY-MM-DD
  }
};

class SchemaComplianceTest {
  constructor() {
    this.results = {
      passed: 0,
      failed: 0,
      warnings: 0,
      details: []
    };
  }

  // ตรวจสอบ field ที่จำเป็น
  checkRequiredFields(collectionName, document, schema) {
    const missing = [];
    const data = document.data();
    
    for (const field of schema.requiredFields) {
      if (!(field in data) || data[field] === null || data[field] === undefined) {
        missing.push(field);
      }
    }
    
    if (missing.length > 0) {
      this.logError(collectionName, document.id, `Missing required fields: ${missing.join(', ')}`);
      return false;
    }
    
    return true;
  }

  // ตรวจสอบ nested fields
  checkNestedFields(collectionName, document, schema) {
    if (!schema.nestedFields) return true;
    
    const data = document.data();
    let isValid = true;
    
    for (const [parentField, requiredSubFields] of Object.entries(schema.nestedFields)) {
      const fieldPath = parentField.split('.');
      let currentData = data;
      
      // Navigate to nested field
      for (const pathSegment of fieldPath) {
        if (!currentData || typeof currentData !== 'object' || !(pathSegment in currentData)) {
          this.logError(collectionName, document.id, `Missing nested field: ${parentField}`);
          isValid = false;
          break;
        }
        currentData = currentData[pathSegment];
      }
      
      if (currentData && typeof currentData === 'object') {
        for (const subField of requiredSubFields) {
          if (!(subField in currentData)) {
            this.logError(collectionName, document.id, `Missing nested field: ${parentField}.${subField}`);
            isValid = false;
          }
        }
      }
    }
    
    return isValid;
  }

  // ตรวจสอบรูปแบบ Document ID
  checkDocumentIdPattern(collectionName, document, schema) {
    if (!schema.documentIdPattern) return true;
    
    if (!schema.documentIdPattern.test(document.id)) {
      this.logError(collectionName, document.id, `Document ID doesn't match expected pattern: ${schema.documentIdPattern}`);
      return false;
    }
    
    return true;
  }

  // ตรวจสอบค่าที่ valid
  checkValidValues(collectionName, document, schema) {
    const data = document.data();
    let isValid = true;
    
    // ตรวจสอบ currentPlan ใน users collection
    if (collectionName === 'users' && data.currentPlan) {
      if (!schema.validCurrentPlans.includes(data.currentPlan)) {
        this.logError(collectionName, document.id, `Invalid currentPlan: ${data.currentPlan}. Valid values: ${schema.validCurrentPlans.join(', ')}`);
        isValid = false;
      }
    }
    
    // ตรวจสอบ planId ใน subscription_plans collection
    if (collectionName === 'subscription_plans' && data.planId) {
      if (!schema.validPlanIds.includes(data.planId)) {
        this.logError(collectionName, document.id, `Invalid planId: ${data.planId}. Valid values: ${schema.validPlanIds.join(', ')}`);
        isValid = false;
      }
    }
    
    // ตรวจสอบ status ใน billing_transactions collection
    if (collectionName === 'billing_transactions' && data.status) {
      if (!schema.validStatuses.includes(data.status)) {
        this.logError(collectionName, document.id, `Invalid status: ${data.status}. Valid values: ${schema.validStatuses.join(', ')}`);
        isValid = false;
      }
    }
    
    return isValid;
  }

  // ตรวจสอบว่า Document ID ตรงกับ field ภายใน (เช่น analyticsId)
  checkDocumentIdFieldMatch(collectionName, document) {
    const data = document.data();
    let isValid = true;
    
    // ตรวจสอบ usage_analytics
    if (collectionName === 'usage_analytics') {
      if (data.analyticsId !== document.id) {
        this.logError(collectionName, document.id, `analyticsId field (${data.analyticsId}) doesn't match Document ID (${document.id})`);
        isValid = false;
      }
    }
    
    // ตรวจสอบ usage_tracking
    if (collectionName === 'usage_tracking') {
      if (data.trackingId !== document.id) {
        this.logError(collectionName, document.id, `trackingId field (${data.trackingId}) doesn't match Document ID (${document.id})`);
        isValid = false;
      }
    }
    
    // ตรวจสอบ billing_transactions
    if (collectionName === 'billing_transactions') {
      if (data.transactionId !== document.id) {
        this.logError(collectionName, document.id, `transactionId field (${data.transactionId}) doesn't match Document ID (${document.id})`);
        isValid = false;
      }
    }
    
    return isValid;
  }

  // ตรวจสอบ collection แต่ละตัว
  async checkCollection(collectionName) {
    console.log(`\n📋 กำลังตรวจสอบ collection: ${collectionName}`);
    
    if (!EXPECTED_SCHEMAS[collectionName]) {
      this.logWarning(collectionName, '', 'No schema definition found');
      return;
    }
    
    try {
      const collectionRef = collection(db, collectionName);
      const snapshot = await getDocs(query(collectionRef, limit(10))); // ตรวจสอบ 10 documents แรก
      
      if (snapshot.empty) {
        this.logWarning(collectionName, '', 'Collection is empty');
        return;
      }
      
      const schema = EXPECTED_SCHEMAS[collectionName];
      let documentsChecked = 0;
      let documentsValid = 0;
      
      snapshot.forEach(document => {
        documentsChecked++;
        let isDocumentValid = true;
        
        // ตรวจสอบ required fields
        if (!this.checkRequiredFields(collectionName, document, schema)) {
          isDocumentValid = false;
        }
        
        // ตรวจสอบ nested fields
        if (!this.checkNestedFields(collectionName, document, schema)) {
          isDocumentValid = false;
        }
        
        // ตรวจสอบ Document ID pattern
        if (!this.checkDocumentIdPattern(collectionName, document, schema)) {
          isDocumentValid = false;
        }
        
        // ตรวจสอบ valid values
        if (!this.checkValidValues(collectionName, document, schema)) {
          isDocumentValid = false;
        }
        
        // ตรวจสอบ Document ID field match
        if (!this.checkDocumentIdFieldMatch(collectionName, document)) {
          isDocumentValid = false;
        }
        
        if (isDocumentValid) {
          documentsValid++;
          this.logSuccess(collectionName, document.id, 'Schema compliance passed');
        }
      });
      
      console.log(`   📊 ตรวจสอบแล้ว: ${documentsChecked} documents, ถูกต้อง: ${documentsValid}`);
      
    } catch (error) {
      this.logError(collectionName, '', `Error checking collection: ${error.message}`);
    }
  }

  // ฟังก์ชัน logging
  logSuccess(collection, docId, message) {
    this.results.passed++;
    this.results.details.push({
      type: 'SUCCESS',
      collection,
      docId,
      message
    });
    console.log(`   ✅ ${docId}: ${message}`);
  }

  logError(collection, docId, message) {
    this.results.failed++;
    this.results.details.push({
      type: 'ERROR',
      collection,
      docId,
      message
    });
    console.log(`   ❌ ${docId}: ${message}`);
  }

  logWarning(collection, docId, message) {
    this.results.warnings++;
    this.results.details.push({
      type: 'WARNING',
      collection,
      docId,
      message
    });
    console.log(`   ⚠️  ${docId}: ${message}`);
  }

  // รัน test ทั้งหมด
  async runAllTests() {
    console.log('🔍 เริ่มตรวจสอบ Schema Compliance สำหรับทุก Collections');
    console.log('📋 ตรวจสอบตาม DATABASE_ARCHITECTURE_SUMMARY.md\n');

    const collections = Object.keys(EXPECTED_SCHEMAS);
    
    for (const collectionName of collections) {
      await this.checkCollection(collectionName);
    }

    this.printSummary();
  }

  // สรุปผลการตรวจสอบ
  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 สรุปผลการตรวจสอบ Schema Compliance');
    console.log('='.repeat(80));
    console.log(`✅ ผ่าน: ${this.results.passed}`);
    console.log(`❌ ไม่ผ่าน: ${this.results.failed}`);
    console.log(`⚠️  คำเตือน: ${this.results.warnings}`);
    
    if (this.results.failed === 0) {
      console.log('\n🎉 ทุก collections ตรงกับ DATABASE_ARCHITECTURE_SUMMARY.md แล้ว!');
    } else {
      console.log('\n⚠️  มี Schema mismatches ที่ต้องแก้ไข:');
      this.results.details
        .filter(detail => detail.type === 'ERROR')
        .forEach(detail => {
          console.log(`   ❌ ${detail.collection}/${detail.docId}: ${detail.message}`);
        });
    }
  }
}

// รัน test
async function main() {
  try {
    const tester = new SchemaComplianceTest();
    await tester.runAllTests();
  } catch (error) {
    console.error('❌ Error running schema compliance test:', error);
    process.exit(1);
  }
}

// เรียกใช้ถ้าไฟล์นี้ถูกรันโดยตรง
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default SchemaComplianceTest;