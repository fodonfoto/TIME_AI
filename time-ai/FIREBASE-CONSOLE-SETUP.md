# 🔥 Firebase Console Setup - Demo Users

## 📋 Step-by-Step Instructions

### 1. Go to Firebase Console
🔗 **Link**: https://console.firebase.google.com/project/ready-ai-niwat/firestore

### 2. Create Plan Configurations First

#### Collection: `plan_configs`

**Document ID: `free`**
```json
{
  "id": "free",
  "name": "Free Plan",
  "dailyLimit": 5,
  "price": 0,
  "features": ["Basic AI requests", "Limited usage"],
  "active": true,
  "createdAt": "2025-08-11T15:45:00.000Z",
  "updatedAt": "2025-08-11T15:45:00.000Z"
}
```

**Document ID: `pro`**
```json
{
  "id": "pro",
  "name": "Pro Plan",
  "dailyLimit": 100,
  "price": 10,
  "features": ["Extended AI requests", "Priority support", "Advanced features"],
  "active": true,
  "createdAt": "2025-08-11T15:45:00.000Z",
  "updatedAt": "2025-08-11T15:45:00.000Z"
}
```

**Document ID: `ultra`**
```json
{
  "id": "ultra",
  "name": "Ultra Plan",
  "dailyLimit": -1,
  "price": 18,
  "features": ["Unlimited AI requests", "Premium support", "All features", "API access"],
  "active": true,
  "createdAt": "2025-08-11T15:45:00.000Z",
  "updatedAt": "2025-08-11T15:45:00.000Z"
}
```

### 3. Create Demo Users

#### Collection: `users`

**Document ID: `demo-free@timeai.dev`**
```json
{
  "firstName": "Demo",
  "lastName": "Free",
  "displayName": "Demo Free User",
  "firstNameLower": "demo",
  "lastNameLower": "free",
  "fullNameLower": "demo free",
  "subscription": {
    "planType": "free",
    "startDate": "2025-08-11T15:45:00.000Z",
    "lastUpdated": "2025-08-11T15:45:00.000Z"
  },
  "createdAt": "2025-08-11T15:45:00.000Z",
  "updatedAt": "2025-08-11T15:45:00.000Z"
}
```

**Document ID: `demo-pro@timeai.dev`**
```json
{
  "firstName": "Demo",
  "lastName": "Pro",
  "displayName": "Demo Pro User",
  "firstNameLower": "demo",
  "lastNameLower": "pro",
  "fullNameLower": "demo pro",
  "subscription": {
    "planType": "pro",
    "startDate": "2025-08-11T15:45:00.000Z",
    "lastUpdated": "2025-08-11T15:45:00.000Z"
  },
  "createdAt": "2025-08-11T15:45:00.000Z",
  "updatedAt": "2025-08-11T15:45:00.000Z"
}
```

**Document ID: `demo-ultra@timeai.dev`**
```json
{
  "firstName": "Demo",
  "lastName": "Ultra",
  "displayName": "Demo Ultra User",
  "firstNameLower": "demo",
  "lastNameLower": "ultra",
  "fullNameLower": "demo ultra",
  "subscription": {
    "planType": "ultra",
    "startDate": "2025-08-11T15:45:00.000Z",
    "lastUpdated": "2025-08-11T15:45:00.000Z"
  },
  "createdAt": "2025-08-11T15:45:00.000Z",
  "updatedAt": "2025-08-11T15:45:00.000Z"
}
```

### 4. Create Subscriptions

#### Collection: `subscriptions`

**Document ID: `sub_demo_free` (Auto-generate ID)**
```json
{
  "userId": "demo-free@timeai.dev",
  "planType": "free",
  "startDate": "2025-08-11T15:45:00.000Z",
  "endDate": null,
  "status": "active",
  "createdAt": "2025-08-11T15:45:00.000Z",
  "updatedAt": "2025-08-11T15:45:00.000Z"
}
```

**Document ID: `sub_demo_pro` (Auto-generate ID)**
```json
{
  "userId": "demo-pro@timeai.dev",
  "planType": "pro",
  "startDate": "2025-08-11T15:45:00.000Z",
  "endDate": null,
  "status": "active",
  "createdAt": "2025-08-11T15:45:00.000Z",
  "updatedAt": "2025-08-11T15:45:00.000Z"
}
```

**Document ID: `sub_demo_ultra` (Auto-generate ID)**
```json
{
  "userId": "demo-ultra@timeai.dev",
  "planType": "ultra",
  "startDate": "2025-08-11T15:45:00.000Z",
  "endDate": null,
  "status": "active",
  "createdAt": "2025-08-11T15:45:00.000Z",
  "updatedAt": "2025-08-11T15:45:00.000Z"
}
```

### 5. Create Usage Tracking

#### Collection: `usage_tracking`

**Document ID: `usage_free_today` (Auto-generate ID)**
```json
{
  "userId": "demo-free@timeai.dev",
  "date": "2025-08-11",
  "requestCount": 3,
  "planType": "free",
  "createdAt": "2025-08-11T15:45:00.000Z",
  "updatedAt": "2025-08-11T15:45:00.000Z"
}
```

**Document ID: `usage_pro_today` (Auto-generate ID)**
```json
{
  "userId": "demo-pro@timeai.dev",
  "date": "2025-08-11",
  "requestCount": 25,
  "planType": "pro",
  "createdAt": "2025-08-11T15:45:00.000Z",
  "updatedAt": "2025-08-11T15:45:00.000Z"
}
```

**Document ID: `usage_ultra_today` (Auto-generate ID)**
```json
{
  "userId": "demo-ultra@timeai.dev",
  "date": "2025-08-11",
  "requestCount": 150,
  "planType": "ultra",
  "createdAt": "2025-08-11T15:45:00.000Z",
  "updatedAt": "2025-08-11T15:45:00.000Z"
}
```

## 🎯 Testing Scenarios

### Free Plan User (`demo-free@timeai.dev`)
- ✅ **Current**: 3/5 requests used
- ✅ **Should Allow**: 2 more requests today
- ❌ **Should Block**: After 5 total requests
- 💰 **Should Suggest**: Upgrade to Pro plan

### Pro Plan User (`demo-pro@timeai.dev`)
- ✅ **Current**: 25/100 requests used
- ✅ **Should Allow**: 75 more requests today
- ❌ **Should Block**: After 100 total requests
- 💰 **Should Suggest**: Upgrade to Ultra plan

### Ultra Plan User (`demo-ultra@timeai.dev`)
- ✅ **Current**: 150 requests used (unlimited)
- ✅ **Should Allow**: Unlimited requests
- ♾️ **Never Blocks**: No request limits
- 💎 **Premium**: Full access to all features

## 🧪 Testing Commands

After creating the data, test with your MCP server:

```bash
# Test Free Plan User
curl -X POST http://localhost:3000/mcp \
  -d '{"tool": "get_user_plan", "args": {"email": "demo-free@timeai.dev"}}'

# Test Pro Plan User
curl -X POST http://localhost:3000/mcp \
  -d '{"tool": "check_usage_limit", "args": {"email": "demo-pro@timeai.dev"}}'

# Test Ultra Plan User
curl -X POST http://localhost:3000/mcp \
  -d '{"tool": "increment_usage", "args": {"email": "demo-ultra@timeai.dev"}}'
```

## ✅ Verification Checklist

- [ ] Plan configurations created (3 documents)
- [ ] Demo users created (3 documents)
- [ ] Subscriptions created (3 documents)
- [ ] Usage tracking created (3 documents)
- [ ] Test MCP tools with demo users
- [ ] Verify usage limits work correctly
- [ ] Test plan upgrade suggestions

🎉 **Ready for testing!** Your subscription system is now set up with demo data.