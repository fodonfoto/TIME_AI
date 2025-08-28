# 🔒 Production Database Write Compliance Checklist

## ✅ How to Ensure Your Firestore Writes Match Production

This checklist ensures your Cloud Firestore database write operations exactly match your production schema as defined in `DATABASE_ARCHITECTURE_SUMMARY.md`.

### 🎯 **Quick Verification Steps**

#### 1. **Run Automated Verification Scripts**
```bash
# Check schema compliance
cd time-ai
node tests/schema-compliance-test.js

# Check write operations in code
node tests/write-operations-checker.js

# Full production verification
node scripts/production-db-verification.js
```

#### 2. **Test with Firebase Emulator**
```bash
# Start Firebase emulator
firebase emulators:start --only firestore

# Run write operation tests
node scripts/firestore-write-testing.js
```

---

### 📊 **Critical Schema Compliance Points**

#### ⭐ **usage_tracking Collection** (Most Critical)
```javascript
// ✅ CORRECT - Nested Structure (Production Schema)
{
  trackingId: "userId_YYYY-MM-DD",  // Document ID must match this field
  userId: "firebase_user_id",
  date: "2025-01-24",
  requests: {
    count: 8,
    limit: 10,
    remaining: 2
  },
  tokens: {
    used: 1250,
    limit: 10000,
    remaining: 8750
  },
  context: {
    used: 1250,
    limit: 10000,
    remaining: 8750
  },
  conversations: {
    created: 2,
    limit: 5,
    remaining: 3
  },
  resetAt: Timestamp,
  createdAt: Timestamp,
  updatedAt: Timestamp
}

// ❌ WRONG - Flat Structure (Deprecated)
{
  userId: "user",
  date: "2025-01-24",
  requestCount: 8,        // ❌ Should be requests.count
  planType: "free"        // ❌ Should be currentPlan in users collection
}
```

#### 👤 **user_originals Collection**
```javascript
// ✅ CORRECT
{
  userId: "firebase_user_id",     // ✅ Use userId (not uid)
  email: "user@example.com",
  originalFirstName: "John",      // ✅ Specific field names
  originalLastName: "Doe",
  originalFullName: "John Doe",
  createdAt: Timestamp,
  isLocked: true                  // ✅ Must be true for anti-abuse
}

// ❌ WRONG
{
  uid: "firebase_user_id",        // ❌ Should be userId
  firstName: "John",              // ❌ Should be originalFirstName
  locked: false                   // ❌ Should be isLocked: true
}
```

#### 👥 **users Collection**
```javascript
// ✅ CORRECT
{
  uid: "firebase_user_id",        // Document ID
  email: "user@example.com", 
  displayName: "John Doe",
  firstName: "John",
  lastName: "Doe",
  currentPlan: "free",            // ✅ Use currentPlan
  createdAt: Timestamp,
  updatedAt: Timestamp,
  lastLoginAt: Timestamp,
  isActive: true
}

// ❌ WRONG
{
  subscription: {
    planType: "free"              // ❌ Should be currentPlan field directly
  },
  dailyUsage: 5,                  // ❌ Use usage_tracking collection instead
  active: true                    // ❌ Should be isActive
}
```

---

### 🔧 **Firebase MCP Server Verification**

#### **Critical MCP Server Checks:**

1. **Usage Tracking Implementation**
   ```javascript
   // ✅ Check for nested structure in MCP server
   requests: { count, limit, remaining }
   tokens: { used, limit, remaining }
   context: { used, limit, remaining }
   conversations: { created, limit, remaining }
   ```

2. **Document ID Patterns**
   ```javascript
   // ✅ CORRECT patterns
   usage_tracking: `${userId}_${date}`
   user_originals: auto-generated
   conversations: auto-generated (matches conversationId field)
   ```

3. **Field Name Consistency**
   ```javascript
   // ✅ Use currentPlan (not subscription.planType)
   // ✅ Use userId (not uid in user_originals)
   // ✅ Use nested objects (not flat structure)
   ```

---

### 🧪 **Testing Strategy**

#### **Before Each Deployment:**

1. **Run All Verification Scripts**
   ```bash
   # Schema compliance
   node tests/schema-compliance-test.js
   
   # Code compliance  
   node tests/write-operations-checker.js
   
   # Production verification
   node scripts/production-db-verification.js
   ```

2. **Test with Emulator**
   ```bash
   firebase emulators:start --only firestore
   node scripts/firestore-write-testing.js
   ```

3. **Manual Verification Points**
   - [ ] Document IDs match their internal field values
   - [ ] Nested structures used (not flat)
   - [ ] Correct field names (userId not uid, currentPlan not planType)
   - [ ] All required fields present
   - [ ] Valid enum values used

#### **CI/CD Integration**
```bash
# Add to your deployment pipeline
npm run test:schema-compliance
npm run test:write-operations
npm run test:production-verification
```

---

### 🚨 **Common Mistakes to Avoid**

1. **❌ Using deprecated flat structure in usage_tracking**
   ```javascript
   // DON'T DO THIS
   { requestCount: 5, planType: "free" }
   ```

2. **❌ Wrong field names**
   ```javascript
   // DON'T DO THIS
   { uid: "user" }  // Should be userId in user_originals
   { subscription: { planType: "free" } }  // Should be currentPlan
   ```

3. **❌ Inconsistent Document IDs**
   ```javascript
   // DON'T DO THIS - Document ID doesn't match internal field
   doc('usage_tracking', 'random_id').set({
     trackingId: 'user_2025-01-24'  // Should match Document ID
   })
   ```

4. **❌ Missing nested structures**
   ```javascript
   // DON'T DO THIS
   { dailyRequests: 10 }  // Should be limits: { dailyRequests: 10 }
   ```

---

### ✅ **Production Readiness Checklist**

- [ ] All automated tests pass (0 errors)
- [ ] Firebase MCP server uses correct schema
- [ ] Emulator testing successful
- [ ] Document ID patterns correct
- [ ] Nested structures implemented
- [ ] Deprecated fields removed
- [ ] Field names match schema exactly
- [ ] All collections follow production schema

### 🎯 **Quick Confidence Check**

Run this one-liner to verify everything:
```bash
node scripts/production-db-verification.js && echo "✅ Production Ready!" || echo "❌ Fix issues first"
```

---

### 📞 **When You Can Be Confident**

You can be confident your writes match production when:

1. ✅ **All verification scripts pass with 0 errors**
2. ✅ **Emulator tests complete successfully**  
3. ✅ **Manual checklist items verified**
4. ✅ **Document structures match DATABASE_ARCHITECTURE_SUMMARY.md exactly**

**Remember**: The key is consistency between your write operations and the schema defined in `DATABASE_ARCHITECTURE_SUMMARY.md`. When all verification scripts pass, your database writes will match production exactly.