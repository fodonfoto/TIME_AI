#!/bin/bash

echo "🚀 Time AI Database Update Script"
echo "=================================="

# ตั้งค่า environment variables
export FIREBASE_PROJECT_ID="ready-ai-niwat"
export NODE_ENV="production"

echo "📋 Step 1: อัพเดท local database files..."
node update-free-plan-limits.js

echo ""
echo "📋 Step 2: อัพเดทข้อมูลบน Cloud Firestore..."
node update-firestore-complete.js

echo ""
echo "✅ Database update completed!"
echo "📊 Summary:"
echo "   - Free Plan dailyLimit: 10 requests/day"
echo "   - Pro Plan dailyLimit: 100 requests/day" 
echo "   - Enterprise Plan dailyLimit: unlimited"
echo "   - All data synced to Cloud Firestore"