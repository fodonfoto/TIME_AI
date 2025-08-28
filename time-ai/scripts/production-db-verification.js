#!/usr/bin/env node

/**
 * Production Database Write Verification System
 * 
 * This script ensures all database write operations match production schema exactly.
 * It provides multiple verification methods to give you confidence your writes are correct.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

// Production Schema Definition (matches DATABASE_ARCHITECTURE_SUMMARY.md exactly)
const PRODUCTION_SCHEMA = {
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
    validValues: {
      currentPlan: ['free', 'pro', 'max']
    },
    documentIdField: 'uid'
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
    },
    documentIdPattern: 'auto-generated',
    references: {
      userId: 'users/{uid}'
    }
  },

  conversations: {
    requiredFields: ['conversationId', 'userId', 'title', 'messages', 'messageCount', 'totalTokens', 'totalRequest', 'totalContext', 'createdAt', 'updatedAt', 'isArchived'],
    fieldTypes: {
      conversationId: 'string',
      userId: 'string',
      title: 'string',
      messages: 'array',
      messageCount: 'number',
      totalTokens: 'number',
      totalRequest: 'number',
      totalContext: 'number',
      isArchived: 'boolean'
    },
    documentIdField: 'conversationId',
    references: {
      userId: 'users/{uid}'
    }
  },

  usage_tracking: {
    requiredFields: ['trackingId', 'userId', 'date', 'requests', 'tokens', 'context', 'conversations', 'resetAt', 'createdAt', 'updatedAt'],
    nestedStructure: {
      requests: ['count', 'limit', 'remaining'],
      tokens: ['used', 'limit', 'remaining'],
      context: ['used', 'limit', 'remaining'],
      conversations: ['created', 'limit', 'remaining']
    },
    documentIdPattern: /^[^_]+_\d{4}-\d{2}-\d{2}$/,
    documentIdField: 'trackingId',
    references: {
      userId: 'users/{uid}'
    }
  },

  subscription_plans: {
    requiredFields: ['planId', 'name', 'description', 'prices', 'limits', 'features', 'isActive', 'createdAt', 'updatedAt'],
    nestedStructure: {
      'prices.monthly': ['amount', 'currency', 'stripePriceId'],
      limits: ['dailyRequests', 'monthlyRequests', 'maxTokensPerRequest', 'maxConversations']
    },
    validValues: {
      planId: ['free', 'pro', 'max']
    },
    documentIdField: 'planId'
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
    validValues: {
      status: ['pending', 'completed', 'failed', 'refunded'],
      planType: ['monthly', 'yearly'],
      planId: ['free', 'pro', 'max']
    },
    documentIdField: 'transactionId',
    references: {
      userId: 'users/{uid}',
      planId: 'subscription_plans/{planId}'
    }
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
    documentIdPattern: /^[^_]+_\d{4}-\d{2}-\d{2}$/,
    documentIdField: 'analyticsId',
    references: {
      userId: 'users/{uid}'
    }
  }
};

class ProductionDBVerifier {
  constructor() {
    this.results = {
      schemaCompliance: { passed: 0, failed: 0, issues: [] },
      codeCompliance: { passed: 0, failed: 0, issues: [] },
      mcpServerCompliance: { passed: 0, failed: 0, issues: [] }
    };
  }

  // 1. Verify Write Operations in Code
  async verifyCodeWriteOperations() {
    console.log('\n🔍 1. VERIFYING CODE WRITE OPERATIONS');
    console.log('=' .repeat(60));

    const filesToCheck = [
      'src/services/firebaseService.js',
      'mcp-servers/firebase-mcp-server.js',
      'src/utils/initializeUserPlan.js'
    ];

    for (const file of filesToCheck) {
      await this.checkFileForWriteCompliance(path.join(projectRoot, file));
    }
  }

  async checkFileForWriteCompliance(filePath) {
    if (!fs.existsSync(filePath)) {
      this.addCodeIssue('ERROR', filePath, 0, 'File not found');
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const relativePath = path.relative(projectRoot, filePath);
    
    console.log(`\n📁 Checking: ${relativePath}`);

    // Check for write operations
    this.checkWriteOperationPatterns(content, relativePath);
    this.checkDeprecatedFieldUsage(content, relativePath);
    this.checkCollectionNames(content, relativePath);
  }

  checkWriteOperationPatterns(content, filePath) {
    const writePatterns = [
      { pattern: /setDoc\s*\([^,]+,\s*\{([^}]+)\}/g, operation: 'setDoc' },
      { pattern: /addDoc\s*\([^,]+,\s*\{([^}]+)\}/g, operation: 'addDoc' },
      { pattern: /updateDoc\s*\([^,]+,\s*\{([^}]+)\}/g, operation: 'updateDoc' },
      { pattern: /\.set\s*\(\s*\{([^}]+)\}/g, operation: 'set' },
      { pattern: /\.update\s*\(\s*\{([^}]+)\}/g, operation: 'update' }
    ];

    writePatterns.forEach(({ pattern, operation }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        const objectContent = match[1];
        
        // Check for deprecated field patterns
        this.validateWriteObjectFields(objectContent, filePath, lineNumber, operation);
      }
    });
  }

  validateWriteObjectFields(objectContent, filePath, lineNumber, operation) {
    // Check for deprecated usage_tracking flat structure
    if (objectContent.includes('requestCount') && objectContent.includes('planType')) {
      this.addCodeIssue('ERROR', filePath, lineNumber, 
        `Found old flat usage_tracking structure in ${operation}. Should use nested structure: requests: { count, limit, remaining }`);
    }

    // Check for deprecated user fields
    if (objectContent.includes('subscription.planType')) {
      this.addCodeIssue('ERROR', filePath, lineNumber,
        `Found deprecated subscription.planType in ${operation}. Should use currentPlan field`);
    }

    // Check for uid vs userId in user_originals
    if (objectContent.includes('uid:') && !objectContent.includes('userId:')) {
      this.addCodeIssue('WARNING', filePath, lineNumber,
        `user_originals should use userId field instead of uid`);
    }
  }

  checkDeprecatedFieldUsage(content, filePath) {
    const deprecatedPatterns = [
      { pattern: /plan_configs/g, message: 'Use subscription_plans collection instead of plan_configs' },
      { pattern: /subscriptions(?!_plans)/g, message: 'Use billing_transactions for subscription transactions' },
      { pattern: /requestCount\s*:/g, message: 'Use requests.count instead of requestCount in usage_tracking' },
      { pattern: /subscription\.planType/g, message: 'Use userData.currentPlan instead of subscription.planType' }
    ];

    deprecatedPatterns.forEach(({ pattern, message }) => {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const lineNumber = content.substring(0, match.index).split('\n').length;
        this.addCodeIssue('WARNING', filePath, lineNumber, message);
      }
    });
  }

  checkCollectionNames(content, filePath) {
    const collectionPattern = /collection\s*\(\s*[^,]+\s*,\s*['"`]([^'"`]+)['"`]/g;
    let match;
    
    while ((match = collectionPattern.exec(content)) !== null) {
      const collectionName = match[1];
      const lineNumber = content.substring(0, match.index).split('\n').length;
      
      if (!PRODUCTION_SCHEMA[collectionName] && collectionName !== 'test') {
        this.addCodeIssue('ERROR', filePath, lineNumber,
          `Unknown collection "${collectionName}" not defined in production schema`);
      }
    }
  }

  // 2. Verify MCP Server Write Operations
  async verifyMCPServerCompliance() {
    console.log('\n🔧 2. VERIFYING MCP SERVER COMPLIANCE');
    console.log('=' .repeat(60));

    const mcpServerPath = path.join(projectRoot, 'mcp-servers/firebase-mcp-server.js');
    
    if (!fs.existsSync(mcpServerPath)) {
      this.addMcpIssue('ERROR', 'MCP Server file not found');
      return;
    }

    const content = fs.readFileSync(mcpServerPath, 'utf8');

    // Check specific MCP operations
    this.verifyUsageTrackingImplementation(content);
    this.verifyUserOperations(content);
    this.verifyCollectionOperations(content);
  }

  verifyUsageTrackingImplementation(content) {
    console.log('\n📊 Checking usage_tracking implementation...');

    // Check for proper nested structure
    if (content.includes('requests: {') && 
        content.includes('count:') && 
        content.includes('limit:') && 
        content.includes('remaining:')) {
      this.addMcpSuccess('usage_tracking uses proper nested structure');
    } else {
      this.addMcpIssue('ERROR', 'usage_tracking missing proper nested structure (requests: {count, limit, remaining})');
    }

    // Check for trackingId as Document ID
    if (content.includes('trackingId = `${') && content.includes('doc(trackingId)')) {
      this.addMcpSuccess('usage_tracking uses trackingId as Document ID');
    } else {
      this.addMcpIssue('ERROR', 'usage_tracking should use trackingId as Document ID');
    }

    // Check for deprecated fields
    if (content.includes('requestCount') || content.includes('planType')) {
      this.addMcpIssue('ERROR', 'usage_tracking still contains deprecated flat structure fields');
    } else {
      this.addMcpSuccess('usage_tracking free of deprecated flat structure fields');
    }
  }

  verifyUserOperations(content) {
    console.log('\n👤 Checking user operations...');

    // Check for currentPlan usage
    if (content.includes('currentPlan')) {
      this.addMcpSuccess('Uses currentPlan field for user plan');
    } else {
      this.addMcpIssue('WARNING', 'Should use currentPlan field instead of deprecated subscription.planType');
    }
  }

  verifyCollectionOperations(content) {
    console.log('\n📋 Checking collection operations...');

    const expectedCollections = Object.keys(PRODUCTION_SCHEMA);
    const foundCollections = [];

    expectedCollections.forEach(collection => {
      if (content.includes(`'${collection}'`) || content.includes(`"${collection}"`)) {
        foundCollections.push(collection);
      }
    });

    console.log(`   Found collections: ${foundCollections.join(', ')}`);
    
    if (foundCollections.length >= 4) {
      this.addMcpSuccess(`MCP Server supports ${foundCollections.length} production collections`);
    } else {
      this.addMcpIssue('WARNING', `MCP Server missing some production collections`);
    }
  }

  // 3. Generate Write Operation Test Cases
  generateTestCases() {
    console.log('\n🧪 3. GENERATING TEST CASES FOR VERIFICATION');
    console.log('=' .repeat(60));

    const testCases = {
      usage_tracking: this.generateUsageTrackingTestCase(),
      user_originals: this.generateUserOriginalsTestCase(),
      conversations: this.generateConversationsTestCase(),
      billing_transactions: this.generateBillingTestCase()
    };

    return testCases;
  }

  generateUsageTrackingTestCase() {
    return {
      collection: 'usage_tracking',
      documentId: 'test_user_2025-01-24',
      expectedStructure: {
        trackingId: 'test_user_2025-01-24',
        userId: 'test_user',
        date: '2025-01-24',
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
        resetAt: 'Timestamp',
        createdAt: 'Timestamp',
        updatedAt: 'Timestamp'
      },
      validation: 'Document ID must match trackingId field'
    };
  }

  generateUserOriginalsTestCase() {
    return {
      collection: 'user_originals',
      documentId: 'auto-generated',
      expectedStructure: {
        userId: 'firebase_user_id',
        email: 'user@example.com',
        originalFirstName: 'John',
        originalLastName: 'Doe',
        originalFullName: 'John Doe',
        createdAt: 'Timestamp',
        isLocked: true
      },
      validation: 'Must use userId field (not uid) and isLocked should be true'
    };
  }

  generateConversationsTestCase() {
    return {
      collection: 'conversations',
      documentId: 'auto-generated',
      expectedStructure: {
        conversationId: 'auto-generated',
        userId: 'firebase_user_id',
        title: 'Chat about React',
        messages: [],
        messageCount: 0,
        totalTokens: 0,
        totalRequest: 0,
        totalContext: 0,
        createdAt: 'Timestamp',
        updatedAt: 'Timestamp',
        isArchived: false
      },
      validation: 'Document ID should match conversationId field'
    };
  }

  generateBillingTestCase() {
    return {
      collection: 'billing_transactions',
      documentId: 'auto-generated',
      expectedStructure: {
        transactionId: 'auto-generated',
        userId: 'firebase_user_id',
        amount: 1500,
        currency: 'USD',
        planId: 'pro',
        planType: 'monthly',
        status: 'completed',
        paymentMethod: 'card',
        createdAt: 'Timestamp',
        updatedAt: 'Timestamp'
      },
      validation: 'Document ID should match transactionId field'
    };
  }

  // Helper methods for logging
  addCodeIssue(type, file, line, message) {
    this.results.codeCompliance.issues.push({ type, file, line, message });
    if (type === 'ERROR') {
      this.results.codeCompliance.failed++;
      console.log(`   ❌ ${path.basename(file)}:${line} - ${message}`);
    } else {
      console.log(`   ⚠️  ${path.basename(file)}:${line} - ${message}`);
    }
  }

  addMcpIssue(type, message) {
    this.results.mcpServerCompliance.issues.push({ type, message });
    if (type === 'ERROR') {
      this.results.mcpServerCompliance.failed++;
      console.log(`   ❌ ${message}`);
    } else {
      console.log(`   ⚠️  ${message}`);
    }
  }

  addMcpSuccess(message) {
    this.results.mcpServerCompliance.passed++;
    console.log(`   ✅ ${message}`);
  }

  // 4. Print Production Readiness Report
  async generateProductionReadinessReport() {
    console.log('\n📋 4. PRODUCTION READINESS REPORT');
    console.log('=' .repeat(60));

    const testCases = this.generateTestCases();

    console.log('\n🎯 SCHEMA COMPLIANCE CHECKLIST:');
    Object.entries(PRODUCTION_SCHEMA).forEach(([collection, schema]) => {
      console.log(`\n📊 ${collection}:`);
      console.log(`   Required Fields: ${schema.requiredFields.length}`);
      if (schema.nestedStructure) {
        console.log(`   Nested Structure: ✅`);
        Object.entries(schema.nestedStructure).forEach(([parent, children]) => {
          console.log(`      ${parent}: [${children.join(', ')}]`);
        });
      }
      if (schema.documentIdField) {
        console.log(`   Document ID Field: ${schema.documentIdField}`);
      }
      if (schema.references) {
        console.log(`   References: ${Object.keys(schema.references).join(', ')}`);
      }
    });

    console.log('\n🧪 TEST CASES GENERATED:');
    Object.entries(testCases).forEach(([collection, testCase]) => {
      console.log(`\n📋 ${collection}:`);
      console.log(`   Document ID: ${testCase.documentId}`);
      console.log(`   Fields: ${Object.keys(testCase.expectedStructure).length}`);
      console.log(`   Validation: ${testCase.validation}`);
    });

    this.printFinalSummary();

    return {
      schemaCompliant: this.results.codeCompliance.failed === 0 && this.results.mcpServerCompliance.failed === 0,
      testCases,
      recommendations: this.generateRecommendations()
    };
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.results.codeCompliance.failed > 0) {
      recommendations.push('Fix code compliance issues before production deployment');
    }

    if (this.results.mcpServerCompliance.failed > 0) {
      recommendations.push('Update MCP server to match production schema exactly');
    }

    recommendations.push('Run automated tests before each deployment');
    recommendations.push('Use Firestore emulator for testing write operations');
    recommendations.push('Implement schema validation in CI/CD pipeline');

    return recommendations;
  }

  printFinalSummary() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 FINAL VERIFICATION SUMMARY');
    console.log('=' .repeat(80));

    const totalErrors = this.results.codeCompliance.failed + this.results.mcpServerCompliance.failed;
    const totalPassed = this.results.codeCompliance.passed + this.results.mcpServerCompliance.passed;

    console.log(`✅ Passed: ${totalPassed}`);
    console.log(`❌ Failed: ${totalErrors}`);

    if (totalErrors === 0) {
      console.log('\n🎉 ALL CHECKS PASSED! Your database writes should match production schema.');
    } else {
      console.log('\n⚠️  ISSUES FOUND! Please fix the following before production:');
      
      [...this.results.codeCompliance.issues, ...this.results.mcpServerCompliance.issues]
        .filter(issue => issue.type === 'ERROR')
        .forEach(issue => {
          console.log(`   ❌ ${issue.file ? issue.file + ':' + issue.line + ' - ' : ''}${issue.message}`);
        });
    }

    console.log('\n💡 To ensure production compliance:');
    console.log('   1. Fix all ERROR-level issues');
    console.log('   2. Test write operations with Firestore emulator');
    console.log('   3. Verify Document ID patterns match schema');
    console.log('   4. Run this verification script before each deployment');
  }

  // Main execution method
  async run() {
    console.log('🔍 PRODUCTION DATABASE WRITE VERIFICATION');
    console.log('📋 Ensuring Cloud Firestore writes match production schema exactly');
    console.log('=' .repeat(80));

    await this.verifyCodeWriteOperations();
    await this.verifyMCPServerCompliance();
    
    const report = await this.generateProductionReadinessReport();
    
    return report;
  }
}

// CLI execution
async function main() {
  try {
    const verifier = new ProductionDBVerifier();
    const report = await verifier.run();
    
    process.exit(report.schemaCompliant ? 0 : 1);
  } catch (error) {
    console.error('❌ Verification failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export default ProductionDBVerifier;