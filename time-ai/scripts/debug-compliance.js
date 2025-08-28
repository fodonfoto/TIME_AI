#!/usr/bin/env node

/**
 * Debug Compliance Check - หาสาเหตุที่ไม่ผ่าน
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.join(__dirname, '..');

console.log('🔍 Debug การตรวจสอบ Production Database Compliance');
console.log('=' .repeat(70));

const mcpPath = path.join(projectRoot, 'mcp-servers/firebase-mcp-server.js');
if (fs.existsSync(mcpPath)) {
    const content = fs.readFileSync(mcpPath, 'utf8');
    
    console.log('\n🔧 Debug Firebase MCP Server:');
    
    // ตรวจสอบ deprecated patterns อย่างละเอียด
    const lines = content.split('\n').filter(line => !line.trim().startsWith('//'));
    const codeOnly = lines.join('\n');
    
    console.log('\n📋 ตรวจสอบ deprecated patterns:');
    
    // ตรวจสอบ subscription.planType
    if (codeOnly.includes('subscription.planType')) {
        console.log('   ❌ พบ subscription.planType ใน code');
        const matchingLines = content.split('\n').map((line, index) => {
            if (line.includes('subscription.planType') && !line.trim().startsWith('//')) {
                return `Line ${index + 1}: ${line.trim()}`;
            }
            return null;
        }).filter(Boolean);
        matchingLines.forEach(line => console.log(`      ${line}`));
    } else {
        console.log('   ✅ ไม่พบ subscription.planType ใน code');
    }
    
    // ตรวจสอบ requestCount ||
    if (codeOnly.includes('requestCount ||')) {
        console.log('   ❌ พบ requestCount || ใน code');
        const matchingLines = content.split('\n').map((line, index) => {
            if (line.includes('requestCount ||') && !line.trim().startsWith('//')) {
                return `Line ${index + 1}: ${line.trim()}`;
            }
            return null;
        }).filter(Boolean);
        matchingLines.forEach(line => console.log(`      ${line}`));
    } else {
        console.log('   ✅ ไม่พบ requestCount || ใน code');
    }
    
    // ตรวจสอบคำอื่นๆ ที่เป็น deprecated
    const deprecatedPatterns = ['requestCount', 'planType'];
    deprecatedPatterns.forEach(pattern => {
        const regex = new RegExp(`\\b${pattern}\\s*[:|=]`, 'g');
        const matches = [];
        content.split('\n').forEach((line, index) => {
            if (regex.test(line) && !line.trim().startsWith('//')) {
                matches.push(`Line ${index + 1}: ${line.trim()}`);
            }
        });
        
        if (matches.length > 0) {
            console.log(`   ⚠️  พบ ${pattern} patterns:`);
            matches.forEach(match => console.log(`      ${match}`));
        }
    });
    
    console.log('\n📊 สรุป Debug:');
    const hasSubscriptionPlanType = codeOnly.includes('subscription.planType');
    const hasRequestCountFallback = codeOnly.includes('requestCount ||');
    
    console.log(`   subscription.planType: ${hasSubscriptionPlanType ? '❌ มี' : '✅ ไม่มี'}`);
    console.log(`   requestCount ||: ${hasRequestCountFallback ? '❌ มี' : '✅ ไม่มี'}`);
    
    if (!hasSubscriptionPlanType && !hasRequestCountFallback) {
        console.log('\n🎉 ไม่พบ deprecated patterns แล้ว! ควรผ่านการตรวจสอบ');
    } else {
        console.log('\n⚠️  ยังพบ deprecated patterns - ต้องแก้ไข');
    }
    
} else {
    console.log('❌ ไม่พบไฟล์ Firebase MCP Server');
}