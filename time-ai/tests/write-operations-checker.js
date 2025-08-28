#!/usr/bin/env node

/**
 * Write Operations Compliance Checker
 * ตรวจสอบว่า write operations ในโค้ดใช้ field names ที่ถูกต้องตาม DATABASE_ARCHITECTURE_SUMMARY.md
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Field mappings ตาม DATABASE_ARCHITECTURE_SUMMARY.md
const FIELD_MAPPINGS = {
  users: {
    requiredFields: ['uid', 'email', 'displayName', 'firstName', 'lastName', 'currentPlan', 'createdAt', 'updatedAt', 'lastLoginAt', 'isActive'],
    deprecatedFields: ['subscription', 'planType', 'dailyUsage', 'lastUsageDate'] // เก่าที่ไม่ควรใช้แล้ว
  },
  user_originals: {
    requiredFields: ['userId', 'email', 'originalFirstName', 'originalLastName', 'originalFullName', 'createdAt', 'isLocked'],
    deprecatedFields: ['uid'] // ใช้ userId แทน uid
  },
  conversations: {
    requiredFields: ['conversationId', 'userId', 'title', 'messages', 'messageCount', 'totalTokens', 'totalRequest', 'totalContext', 'createdAt', 'updatedAt', 'isArchived']
  },
  usage_tracking: {
    requiredFields: ['trackingId', 'userId', 'date', 'requests', 'tokens', 'context', 'conversations', 'resetAt', 'createdAt', 'updatedAt'],
    nestedStructure: {
      'requests': ['count', 'limit', 'remaining'],
      'tokens': ['used', 'limit', 'remaining'],
      'context': ['used', 'limit', 'remaining'],
      'conversations': ['created', 'limit', 'remaining']
    },
    deprecatedFields: ['requestCount', 'planType'] // เก่าที่เปลี่ยนเป็น nested structure
  },
  subscription_plans: {
    requiredFields: ['planId', 'name', 'description', 'prices', 'limits', 'features', 'isActive', 'createdAt', 'updatedAt'],
    fieldMapping: {
      'id': 'planId', // ใช้ planId แทน id
      'active': 'isActive' // ใช้ isActive แทน active
    }
  },
  billing_transactions: {
    requiredFields: ['transactionId', 'userId', 'amount', 'currency', 'planId', 'planType', 'status', 'paymentMethod', 'createdAt', 'updatedAt']
  },
  usage_analytics: {
    requiredFields: ['analyticsId', 'userId', 'date', 'requestsCount', 'tokensUsed', 'contextUsed', 'conversationsCreated', 'responseTimeAvg', 'createdAt', 'updatedAt']
  }
};

class WriteOperationsChecker {
  constructor() {
    this.issues = [];
    this.filesChecked = 0;
    this.patterns = {
      // Firestore write operations
      setDoc: /setDoc\s*\(\s*[^,]+\s*,\s*\{([^}]+)\}/g,
      addDoc: /addDoc\s*\(\s*[^,]+\s*,\s*\{([^}]+)\}/g,
      updateDoc: /updateDoc\s*\(\s*[^,]+\s*,\s*\{([^}]+)\}/g,
      
      // Collection references
      collection: /collection\s*\(\s*[^,]+\s*,\s*['"`]([^'"`]+)['"`]/g,
      doc: /doc\s*\(\s*[^,]+\s*,\s*['"`]([^'"`]+)['"`]/g
    };
  }

  // ตรวจสอบไฟล์ JavaScript/TypeScript
  async checkFile(filePath) {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const relativePath = path.relative(projectRoot, filePath);
      
      this.filesChecked++;
      console.log(`📁 กำลังตรวจสอบ: ${relativePath}`);

      // ตรวจสอบ write operations
      this.checkWriteOperations(content, relativePath);
      
      // ตรวจสอบ collection names
      this.checkCollectionNames(content, relativePath);
      
      // ตรวจสอบ deprecated fields
      this.checkDeprecatedFields(content, relativePath);

    } catch (error) {
      this.addIssue('ERROR', filePath, 0, `Cannot read file: ${error.message}`);
    }
  }

  // ตรวจสอบ write operations
  checkWriteOperations(content, filePath) {
    const lines = content.split('\n');
    
    ['setDoc', 'addDoc', 'updateDoc'].forEach(operation => {
      const pattern = this.patterns[operation];
      let match;
      
      while ((match = pattern.exec(content)) !== null) {
        const objectContent = match[1];
        const lineNumber = content.substring(0, match.index).split('\n').length;
        
        // ตรวจสอบ field names ในการ write operation
        this.checkFieldNames(objectContent, filePath, lineNumber, operation);
      }
    });
  }

  // ตรวจสอบชื่อ collection
  checkCollectionNames(content, filePath) {
    const validCollections = Object.keys(FIELD_MAPPINGS);
    const pattern = this.patterns.collection;
    let match;
    
    while ((match = pattern.exec(content)) !== null) {
      const collectionName = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      // ตรวจสอบว่าเป็น collection ที่กำหนดไว้ใน schema หรือไม่
      if (collectionName !== 'test' && !validCollections.includes(collectionName)) {
        // เช็คว่าเป็น collection เก่าที่ไม่ควรใช้แล้วหรือไม่
        const deprecatedCollections = ['plan_configs', 'subscriptions'];
        if (deprecatedCollections.includes(collectionName)) {
          this.addIssue('ERROR', filePath, lineNumber, 
            `Deprecated collection "${collectionName}" found. Use "${this.getReplacementCollection(collectionName)}" instead`);
        } else {
          this.addIssue('WARNING', filePath, lineNumber, 
            `Unknown collection "${collectionName}" not defined in DATABASE_ARCHITECTURE_SUMMARY.md`);
        }
      }
    }
  }

  // ตรวจสอบ field names
  checkFieldNames(objectContent, filePath, lineNumber, operation) {
    // Extract field names from object content
    const fieldPattern = /(\w+)\s*:/g;
    let fieldMatch;
    
    while ((fieldMatch = fieldPattern.exec(objectContent)) !== null) {
      const fieldName = fieldMatch[1];
      
      // ตรวจสอบ deprecated fields
      Object.entries(FIELD_MAPPINGS).forEach(([collection, schema]) => {
        if (schema.deprecatedFields && schema.deprecatedFields.includes(fieldName)) {
          this.addIssue('ERROR', filePath, lineNumber, 
            `Deprecated field "${fieldName}" found in ${operation}. Should use schema-compliant field for ${collection} collection`);
        }
        
        // ตรวจสอบ field mapping
        if (schema.fieldMapping && schema.fieldMapping[fieldName]) {
          this.addIssue('WARNING', filePath, lineNumber, 
            `Field "${fieldName}" should be "${schema.fieldMapping[fieldName]}" according to ${collection} schema`);
        }
      });
    }
  }

  // ตรวจสอบ deprecated fields
  checkDeprecatedFields(content, filePath) {
    const deprecatedPatterns = [
      { pattern: /subscription\.planType/g, message: 'Use userData.currentPlan instead of subscription.planType' },
      { pattern: /requestCount/g, message: 'Use requests.count instead of requestCount for usage_tracking' },
      { pattern: /plan_configs/g, message: 'Use subscription_plans collection instead of plan_configs' },
      { pattern: /\.uid\s*:/g, message: 'Use userId field instead of uid in user_originals collection' },
      { pattern: /active\s*:/g, message: 'Use isActive field instead of active in subscription_plans' }
    ];
    
    deprecatedPatterns.forEach(({ pattern, message }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        this.addIssue('WARNING', filePath, lineNumber, message);
      }
    });
  }

  // รับ collection ที่ควรใช้แทน
  getReplacementCollection(deprecated) {
    const replacements = {
      'plan_configs': 'subscription_plans',
      'subscriptions': 'billing_transactions'
    };
    return replacements[deprecated] || 'unknown';
  }

  // เพิ่ม issue
  addIssue(type, file, line, message) {
    this.issues.push({
      type,
      file: path.relative(projectRoot, file),
      line,
      message
    });
    
    const icon = type === 'ERROR' ? '❌' : type === 'WARNING' ? '⚠️' : 'ℹ️';
    console.log(`   ${icon} Line ${line}: ${message}`);
  }

  // ตรวจสอบ directory
  async checkDirectory(dirPath) {
    const items = fs.readdirSync(dirPath);
    
    for (const item of items) {
      const fullPath = path.join(dirPath, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // ข้าม directories ที่ไม่ต้องตรวจสอบ
        if (!['node_modules', '.git', 'dist', 'build', 'coverage'].includes(item)) {
          await this.checkDirectory(fullPath);
        }
      } else if (stat.isFile()) {
        // ตรวจสอบไฟล์ JavaScript/TypeScript เท่านั้น
        if (/\.(js|ts|jsx|tsx)$/.test(item) && !item.includes('.test.') && !item.includes('.spec.')) {
          await this.checkFile(fullPath);
        }
      }
    }
  }

  // รัน checker ทั้งหมด
  async run() {
    console.log('🔍 เริ่มตรวจสอบ Write Operations Compliance');
    console.log('📋 ตรวจสอบตาม DATABASE_ARCHITECTURE_SUMMARY.md\n');

    // ตรวจสอบ src และ mcp-servers directories
    const dirsToCheck = [
      path.join(projectRoot, 'src'),
      path.join(projectRoot, 'mcp-servers')
    ];

    for (const dir of dirsToCheck) {
      if (fs.existsSync(dir)) {
        console.log(`📂 กำลังตรวจสอบ directory: ${path.relative(projectRoot, dir)}`);
        await this.checkDirectory(dir);
      }
    }

    this.printSummary();
  }

  // สรุปผลการตรวจสอบ
  printSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 สรุปผลการตรวจสอบ Write Operations Compliance');
    console.log('='.repeat(80));
    
    const errors = this.issues.filter(issue => issue.type === 'ERROR');
    const warnings = this.issues.filter(issue => issue.type === 'WARNING');
    
    console.log(`📁 ไฟล์ที่ตรวจสอบ: ${this.filesChecked}`);
    console.log(`❌ Errors: ${errors.length}`);
    console.log(`⚠️ Warnings: ${warnings.length}`);
    
    if (errors.length === 0 && warnings.length === 0) {
      console.log('\n🎉 ทุก write operations ตรงกับ DATABASE_ARCHITECTURE_SUMMARY.md แล้ว!');
    } else {
      if (errors.length > 0) {
        console.log('\n❌ Errors ที่ต้องแก้ไข:');
        errors.forEach(issue => {
          console.log(`   ${issue.file}:${issue.line} - ${issue.message}`);
        });
      }
      
      if (warnings.length > 0) {
        console.log('\n⚠️ Warnings ที่ควรพิจารณา:');
        warnings.forEach(issue => {
          console.log(`   ${issue.file}:${issue.line} - ${issue.message}`);
        });
      }
    }
    
    console.log('\n💡 หมายเหตุ: ตรวจสอบ DATABASE_ARCHITECTURE_SUMMARY.md เพื่อดู schema ที่ถูกต้อง');
  }
}

// รัน checker
async function main() {
  try {
    const checker = new WriteOperationsChecker();
    await checker.run();
  } catch (error) {
    console.error('❌ Error running write operations checker:', error);
    process.exit(1);
  }
}

// เรียกใช้ถ้าไฟล์นี้ถูกรันโดยตรง
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default WriteOperationsChecker;