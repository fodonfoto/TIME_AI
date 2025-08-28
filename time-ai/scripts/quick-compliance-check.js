#!/usr/bin/env node

/**
 * Quick Compliance Check - ตรวจสอบโค้ดเร็วๆ ไม่ต้องใช้ Firebase connection
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔍 การตรวจสอบ Production Database Compliance แบบรวดเร็ว');
console.log('=' .repeat(70));

let passed = 0;
let failed = 0;

// 1. ตรวจสอบ Firebase MCP Server
console.log('\n🔧 1. ตรวจสอบ Firebase MCP Server');
const mcpPath = path.join(projectRoot, 'mcp-servers/firebase-mcp-server.js');
if (fs.existsSync(mcpPath)) {
    const content = fs.readFileSync(mcpPath, 'utf8');
    
    // ตรวจสอบ usage_tracking nested structure
    if (content.includes('requests: {') && content.includes('tokens: {') && content.includes('context: {')) {
        console.log('   ✅ usage_tracking ใช้ nested structure ถูกต้อง');
        passed++;
    } else {
        console.log('   ❌ usage_tracking ไม่ใช้ nested structure');
        failed++;
    }
    
    // ตรวจสอบ trackingId as Document ID
    if (content.includes('trackingId = `${') && content.includes('.doc(trackingId)')) {
        console.log('   ✅ trackingId ใช้เป็น Document ID ถูกต้อง');
        passed++;
    } else {
        console.log('   ❌ trackingId ไม่ได้ใช้เป็น Document ID');
        failed++;
    }
    
    // ตรวจสอบไม่มี deprecated patterns (กรองคอมเมนต์ออกทั้งหมด)
    const lines = content.split('\n').map(line => {
        // ลบ single-line comments ออก
        const commentIndex = line.indexOf('//');
        if (commentIndex !== -1) {
            return line.substring(0, commentIndex);
        }
        return line;
    });
    const codeOnly = lines.join('\n');
    const hasDeprecatedPatterns = codeOnly.includes('subscription.planType');
    if (!hasDeprecatedPatterns) {
        console.log('   ✅ ไม่มี deprecated patterns ใน production code');
        passed++;
    } else {
        console.log('   ❌ ยังมี deprecated patterns ใน code');
        failed++;
    }
    
    // ตรวจสอบ currentPlan usage
    if (content.includes('currentPlan')) {
        console.log('   ✅ ใช้ currentPlan field ถูกต้อง');
        passed++;
    } else {
        console.log('   ⚠️  ควรใช้ currentPlan แทน subscription.planType');
    }
    
    // ตรวจสอบ user_originals
    if (content.includes('userId: userId') && content.includes('isLocked: true')) {
        console.log('   ✅ user_originals ใช้ userId และ isLocked ถูกต้อง');
        passed++;
    } else {
        console.log('   ❌ user_originals schema ไม่ถูกต้อง');
        failed++;
    }
    
} else {
    console.log('   ❌ ไม่พบไฟล์ Firebase MCP Server');
    failed++;
}

// 2. ตรวจสอบ firebaseService.js
console.log('\n🔥 2. ตรวจสอบ firebaseService.js');
const servicePath = path.join(projectRoot, 'src/services/firebaseService.js');
if (fs.existsSync(servicePath)) {
    const content = fs.readFileSync(servicePath, 'utf8');
    
    // ตรวจสอบไม่มี deprecated patterns
    if (!content.includes('subscription.planType') && !content.includes('requestCount')) {
        console.log('   ✅ ไม่มี deprecated patterns');
        passed++;
    } else {
        console.log('   ❌ ยังมี deprecated patterns');
        failed++;
    }
    
    // ตรวจสอบ collection names
    const validCollections = ['users', 'user_originals', 'conversations', 'usage_tracking', 'subscription_plans', 'billing_transactions', 'usage_analytics'];
    let hasValidCollections = false;
    validCollections.forEach(collection => {
        if (content.includes(`'${collection}'`)) {
            hasValidCollections = true;
        }
    });
    
    if (hasValidCollections) {
        console.log('   ✅ ใช้ collection names ที่ถูกต้อง');
        passed++;
    } else {
        console.log('   ❌ collection names ไม่ถูกต้อง');
        failed++;
    }
    
} else {
    console.log('   ⚠️  ไม่พบไฟล์ firebaseService.js');
}

// 3. ตรวจสอบ DATABASE_ARCHITECTURE_SUMMARY.md
console.log('\n📋 3. ตรวจสอบ DATABASE_ARCHITECTURE_SUMMARY.md');
const dbSummaryPath = path.join(projectRoot, '../DATABASE_ARCHITECTURE_SUMMARY.md');
if (fs.existsSync(dbSummaryPath)) {
    const content = fs.readFileSync(dbSummaryPath, 'utf8');
    
    // ตรวจสอบ usage_tracking schema
    if (content.includes('requests: {') && content.includes('count:') && content.includes('limit:')) {
        console.log('   ✅ usage_tracking schema มี nested structure');
        passed++;
    } else {
        console.log('   ❌ usage_tracking schema ไม่ถูกต้อง');
        failed++;
    }
    
    // ตรวจสอบ user_originals schema
    if (content.includes('userId:') && content.includes('isLocked:')) {
        console.log('   ✅ user_originals schema ถูกต้อง');
        passed++;
    } else {
        console.log('   ❌ user_originals schema ไม่ถูกต้อง');
        failed++;
    }
    
} else {
    console.log('   ❌ ไม่พบไฟล์ DATABASE_ARCHITECTURE_SUMMARY.md');
    failed++;
}

// 4. สรุปผล
console.log('\n' + '='.repeat(70));
console.log('📊 สรุปผลการตรวจสอบแบบรวดเร็ว');
console.log('=' .repeat(70));
console.log(`✅ ผ่าน: ${passed}`);
console.log(`❌ ไม่ผ่าน: ${failed}`);

if (failed === 0) {
    console.log('\n🎉 ยินดีด้วย! ทุกอย่างตรงกับ Production Schema แล้ว!');
    console.log('คุณสามารถมั่นใจได้ว่าการเขียนข้อมูลจะตรงกับ production');
} else {
    console.log('\n⚠️  มีจุดที่ต้องแก้ไข กรุณาตรวจสอบข้อผิดพลาดด้านบน');
}

console.log('\n💡 ขั้นตอนต่อไป:');
console.log('   1. แก้ไขจุดที่ไม่ผ่านการตรวจสอบ (ถ้ามี)');
console.log('   2. ทดสอบด้วย Firebase emulator');
console.log('   3. Deploy ได้เลย!');

process.exit(failed === 0 ? 0 : 1);