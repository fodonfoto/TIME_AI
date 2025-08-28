# Design Document

## Overview

The subscription plan system will extend the existing Firebase-based architecture to include user subscription management and AI request tracking. The system will integrate with the current user authentication flow and add new collections to track subscription plans and daily usage limits.

## Architecture

### Database Schema Extensions

The system will add two new Firestore collections while extending the existing `users` collection:

1. **users** (extended) - Add subscription fields to existing user documents
2. **subscriptions** - Track subscription details and history
3. **usage_tracking** - Track daily AI request usage per user

### Data Flow

```
User Request → Authentication Check → Plan Validation → Usage Check → AI Service → Usage Update
```

## Components and Interfaces

### 1. Subscription Service (`subscriptionService.js`)

A new service class that handles all subscription-related operations:

```javascript
class SubscriptionService {
  // Plan management
  async getUserPlan(userId)
  async updateUserPlan(userId, planType)
  
  // Usage tracking
  async checkUsageLimit(userId)
  async incrementUsage(userId)
  async resetDailyUsage()
  
  // Plan validation
  async canMakeRequest(userId)
}
```

### 2. Usage Middleware

A middleware function that intercepts AI requests to enforce limits:

```javascript
const usageMiddleware = async (userId, requestHandler) => {
  const canProceed = await subscriptionService.canMakeRequest(userId);
  if (!canProceed) {
    throw new UsageLimitError();
  }
  
  const result = await requestHandler();
  await subscriptionService.incrementUsage(userId);
  return result;
}
```

### 3. Plan Management Components

- **PlanDisplay** - Shows current plan and usage
- **PlanUpgrade** - Handles plan upgrade flows
- **UsageIndicator** - Visual usage progress bar

## Data Models

### Extended User Document

```javascript
{
  // Existing fields...
  email: string,
  firstName: string,
  lastName: string,
  createdAt: timestamp,
  
  // New subscription fields
  subscription: {
    planType: 'free' | 'pro' | 'ultra',
    startDate: timestamp,
    lastUpdated: timestamp
  }
}
```

### Subscription Document

```javascript
{
  userId: string,
  planType: 'free' | 'pro' | 'ultra',
  startDate: timestamp,
  endDate: timestamp, // null for active subscriptions
  status: 'active' | 'cancelled' | 'expired',
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### Usage Tracking Document

```javascript
{
  userId: string,
  date: string, // YYYY-MM-DD format
  requestCount: number,
  planType: string, // snapshot of plan at time of usage
  createdAt: timestamp,
  updatedAt: timestamp
}
```

## Error Handling

### Custom Error Classes

```javascript
class UsageLimitError extends Error {
  constructor(planType, limit, resetTime) {
    super(`Daily limit of ${limit} requests exceeded for ${planType} plan`);
    this.planType = planType;
    this.limit = limit;
    this.resetTime = resetTime;
  }
}

class PlanNotFoundError extends Error {
  constructor(userId) {
    super(`No subscription plan found for user ${userId}`);
    this.userId = userId;
  }
}
```

### Error Response Format

```javascript
{
  error: true,
  code: 'USAGE_LIMIT_EXCEEDED',
  message: 'Daily limit exceeded',
  details: {
    planType: 'free',
    limit: 5,
    used: 5,
    resetTime: '2024-01-02T00:00:00Z'
  }
}
```

## Testing Strategy

### Unit Tests

1. **SubscriptionService Tests**
   - Plan retrieval and validation
   - Usage tracking accuracy
   - Limit enforcement logic
   - Daily reset functionality

2. **Usage Middleware Tests**
   - Request blocking for exceeded limits
   - Proper usage increment
   - Error handling scenarios

3. **Data Model Tests**
   - Document structure validation
   - Field type checking
   - Required field enforcement

### Integration Tests

1. **End-to-End Flow Tests**
   - Complete request lifecycle with usage tracking
   - Plan upgrade scenarios
   - Daily limit reset behavior

2. **Firebase Integration Tests**
   - Document creation and updates
   - Query performance
   - Transaction handling

### Performance Considerations

1. **Efficient Queries**
   - Index on `userId` and `date` for usage tracking
   - Composite index for user plan lookups
   - Minimize document reads per request

2. **Caching Strategy**
   - Cache user plan information in memory
   - Cache daily usage counts
   - Invalidate cache on plan changes

3. **Batch Operations**
   - Batch daily usage resets
   - Bulk plan updates when needed

## Security Rules Updates

Extend Firestore security rules to protect subscription data:

```javascript
// Subscription documents
match /subscriptions/{subscriptionId} {
  allow read, write: if request.auth != null && 
    request.auth.uid == resource.data.userId;
}

// Usage tracking documents  
match /usage_tracking/{usageId} {
  allow read: if request.auth != null && 
    request.auth.uid == resource.data.userId;
  allow write: if false; // Only server-side writes
}
```

## Migration Strategy

1. **Phase 1**: Add subscription fields to existing users with default 'free' plan
2. **Phase 2**: Implement usage tracking for new requests
3. **Phase 3**: Add plan management UI components
4. **Phase 4**: Implement plan upgrade functionality

## Monitoring and Analytics

1. **Usage Metrics**
   - Daily active users by plan
   - Request volume by plan type
   - Conversion rates from free to paid plans

2. **Performance Metrics**
   - Request processing time with usage checks
   - Database query performance
   - Error rates by plan type