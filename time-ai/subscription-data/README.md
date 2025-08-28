# Subscription System Setup Instructions

## Files Created:
- plan-configs.json: Plan configuration data (Free, Pro, Ultra)
- subscriptions.json: Sample subscription records
- usage-tracking.json: Sample usage tracking data
- firestore-import.json: Complete Firestore import data
- firestore.rules: Updated security rules

## Setup Steps:

### 1. Update Firestore Security Rules
Copy the content from firestore.rules and update your Firestore security rules in Firebase Console.

### 2. Import Data to Firestore
You can import the data using Firebase CLI or manually create documents:

#### Option A: Manual Creation (Recommended)
1. Go to Firebase Console > Firestore Database
2. Create collections: plan_configs, subscriptions, usage_tracking
3. Add documents using the data from the JSON files

#### Option B: Firebase CLI Import (if available)
```bash
firebase firestore:delete --all-collections
firebase firestore:import firestore-import.json
```

### 3. Plan Configurations Created:
- **Free Plan**: 5 requests/day, $0
- **Pro Plan**: 100 requests/day, $10
- **Ultra Plan**: Unlimited requests, $18

### 4. Next Steps:
1. Update existing users to have subscription plans
2. Implement usage tracking in your application
3. Add plan management UI components
4. Test the subscription system

## Database Structure:

### Collections:
- `plan_configs`: Plan definitions and limits
- `subscriptions`: User subscription records
- `usage_tracking`: Daily usage tracking per user
- `users`: Extended with subscription field

### User Document Extension:
```json
{
  "subscription": {
    "planType": "free|pro|ultra",
    "startDate": "2024-01-01T00:00:00.000Z",
    "lastUpdated": "2024-01-01T00:00:00.000Z"
  }
}
```
