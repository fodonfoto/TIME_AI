// Update Firestore Users Structure Script
// This script updates all user documents to match the PRD structure
// and updates the PRD documentation to match the actual structure

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, updateDoc, doc } = require('firebase/firestore');

// Load environment variables
require('dotenv').config();

// Firebase configuration
const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to update user documents to match PRD structure
async function updateUserDocuments() {
  try {
    console.log('🔄 Starting user document update...');
    
    // Get all user documents
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    console.log(`Found ${usersSnapshot.size} user documents to update`);
    
    let updatedCount = 0;
    
    // Process each user document
    for (const userDoc of usersSnapshot.docs) {
      const userData = userDoc.data();
      const updates = {};
      
      // Check if document has preferences field
      if (userData.preferences) {
        console.log(`User ${userDoc.id} has preferences field - will remove in PRD update`);
        // We'll remove this in the documentation update
      }
      
      // Check if document has uid field (duplicate of document ID)
      if (userData.uid) {
        // Remove the duplicate uid field
        updates.uid = undefined;
        console.log(`Will remove duplicate uid field from user ${userDoc.id}`);
      }
      
      // Apply updates if needed
      if (Object.keys(updates).length > 0) {
        const userRef = doc(db, 'users', userDoc.id);
        await updateDoc(userRef, updates);
        updatedCount++;
        console.log(`✅ Updated user ${userDoc.id}`);
      }
    }
    
    console.log(`🎉 Updated ${updatedCount} user documents`);
    return true;
  } catch (error) {
    console.error('❌ Error updating user documents:', error);
    return false;
  }
}

// Function to generate updated PRD documentation
async function updatePRDDocumentation() {
  try {
    console.log('📝 Updating PRD documentation...');
    
    // Get a sample user document to understand the actual structure
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);
    
    if (usersSnapshot.empty) {
      console.log('No user documents found');
      return false;
    }
    
    // Get the first user document as sample
    const sampleUser = usersSnapshot.docs[0].data();
    
    // Generate updated PRD structure
    let updatedPRD = "# 🗄️ Time.AI Database Architecture Summary\n\n";
    updatedPRD += "## 🏗️ **Single Database Architecture Overview**\n\n";
    updatedPRD += "Time.AI uses **Firebase Firestore as the primary database** for all application features:\n\n";
    updatedPRD += "- **🔥 Firebase Firestore**: Primary database for all features (real-time, analytics, billing)\n\n";
    updatedPRD += "## 🔥 **Firebase Firestore Schema**\n\n";
    updatedPRD += "### 📊 **Collections Structure**\n\n";
    updatedPRD += "#### 👤 **users/** Collection\n";
    updatedPRD += "```javascript\n";
    updatedPRD += "{\n";
    updatedPRD += "  // Document ID is the Firebase user ID\n";
    updatedPRD += `  email: "${sampleUser.email || "user@example.com"}",
`;
    updatedPRD += `  displayName: "${sampleUser.displayName || "John Doe"}",
`;
    updatedPRD += `  firstName: "${sampleUser.firstName || "John"}",
`;
    updatedPRD += `  lastName: "${sampleUser.lastName || "Doe"}",
`;
    updatedPRD += `  photoURL: "${sampleUser.photoURL || "https://avatar-url.com"}",
`;
    updatedPRD += "  currentPlan: \"free\",                        // free, pro, max\n";
    
    // Add preferences if it exists in the sample
    if (sampleUser.preferences) {
      updatedPRD += "  preferences: {                            // User preferences\n";
      updatedPRD += "    theme: \"light\",                         // light, dark\n";
      updatedPRD += "    language: \"th\",                         // th, en\n";
      updatedPRD += "    notifications: true                     // true, false\n";
      updatedPRD += "  },\n";
    }
    
    updatedPRD += "  createdAt: Timestamp,\n";
    updatedPRD += "  updatedAt: Timestamp,\n";
    updatedPRD += "  lastLoginAt: Timestamp,\n";
    updatedPRD += "  isActive: true\n";
    updatedPRD += "}\n";
    updatedPRD += "```\n\n";
    
    // Add other collections from the original PRD
    updatedPRD += "#### 💬 **conversations/** Collection\n";
    updatedPRD += "```javascript\n";
    updatedPRD += "{\n";
    updatedPRD += "  conversationId: \"auto_generated_id\",        // Document ID\n";
    updatedPRD += "  userId: \"firebase_user_id\",                 // Reference to users\n";
    updatedPRD += "  title: \"Chat about React\",\n";
    updatedPRD += "  messages: [\n";
    updatedPRD += "    {\n";
    updatedPRD += "      id: \"msg_1\",\n";
    updatedPRD += "      role: \"user\",                           // user, assistant\n";
    updatedPRD += "      content: \"How to use React hooks?\",\n";
    updatedPRD += "      timestamp: Timestamp,\n";
    updatedPRD += "      tokens: 15,\n";
    updatedPRD += "      request: 10,\n";
    updatedPRD += "      context: 59k\n";
    updatedPRD += "    },\n";
    updatedPRD += "    {\n";
    updatedPRD += "      id: \"msg_2\", \n";
    updatedPRD += "      role: \"assistant\",\n";
    updatedPRD += "      agent: \"Coding_Agent\",\n";
    updatedPRD += "      content: \"React hooks are...\",\n";
    updatedPRD += "      timestamp: Timestamp,\n";
    updatedPRD += "      tokens: 120,\n";
    updatedPRD += "      request: 10,\n";
    updatedPRD += "      context: 59.68k\n";
    updatedPRD += "    }\n";
    updatedPRD += "  ],\n";
    updatedPRD += "  messageCount: 2,\n";
    updatedPRD += "  totalTokens: 135,\n";
    updatedPRD += "  totalRequest: 20,\n";
    updatedPRD += "  totalContext: 119k,\n";
    updatedPRD += "  createdAt: Timestamp,\n";
    updatedPRD += "  updatedAt: Timestamp,\n";
    updatedPRD += "  isArchived: false\n";
    updatedPRD += "}\n";
    updatedPRD += "```\n\n";
    
    // Add the rest of the collections from the original PRD
    updatedPRD += "#### 📋 **plan_configs/** Collection \n";
    updatedPRD += "```javascript\n";
    updatedPRD += "{\n";
    updatedPRD += "  planId: \"free\",                             // Document ID: free\n";
    updatedPRD += "  name: \"Free Plan\",\n";
    updatedPRD += "  description: \"Basic AI chat features\", \"File Analysis\", \"Generate Image\", \"Generative AI\",\n";
    updatedPRD += "  price: 0,\n";
    updatedPRD += "  currency: \"USD\",\n";
    updatedPRD += "  limits: {\n";
    updatedPRD += "    dailyRequests: 10,\n";
    updatedPRD += "    monthlyRequests: 300,\n";
    updatedPRD += "    maxTokensPerRequest: 1000,\n";
    updatedPRD += "    maxConversations: 5,\n";
    updatedPRD += "    features: [\"basic_chat\", \"file_analysis\", \"generate_image\", \"generative_ai\"]\n";
    updatedPRD += "  },\n";
    updatedPRD += "  isActive: true,\n";
    updatedPRD += "  createdAt: Timestamp,\n";
    updatedPRD += "  updatedAt: Timestamp\n";
    updatedPRD += "}\n";
    updatedPRD += "```\n\n";
    
    updatedPRD += "#### 📈 **usage_tracking/** Collection\n";
    updatedPRD += "```javascript\n";
    updatedPRD += "{\n";
    updatedPRD += "  trackingId: \"userId_YYYY-MM-DD\",           // Document ID\n";
    updatedPRD += "  userId: \"firebase_user_id\",\n";
    updatedPRD += "  date: \"2024-01-15\",\n";
    updatedPRD += "  requests: {\n";
    updatedPRD += "    count: 8,\n";
    updatedPRD += "    limit: 10,\n";
    updatedPRD += "    remaining: 2\n";
    updatedPRD += "  },\n";
    updatedPRD += "  tokens: {\n";
    updatedPRD += "    used: 1250,\n";
    updatedPRD += "    limit: 10000,\n";
    updatedPRD += "    remaining: 8750\n";
    updatedPRD += "  },\n";
    updatedPRD += "  context: {\n";
    updatedPRD += "    used: 1250,\n";
    updatedPRD += "    limit: 10000,\n";
    updatedPRD += "    remaining: 8750\n";
    updatedPRD += "  },\n";
    updatedPRD += "  conversations: {\n";
    updatedPRD += "    created: 2,\n";
    updatedPRD += "    limit: 5,\n";
    updatedPRD += "    remaining: 3\n";
    updatedPRD += "  },\n";
    updatedPRD += "  resetAt: Timestamp,                        // Daily reset time\n";
    updatedPRD += "  createdAt: Timestamp,\n";
    updatedPRD += "  updatedAt: Timestamp\n";
    updatedPRD += "}\n";
    updatedPRD += "```\n\n";
    
    updatedPRD += "#### 📋 **subscription_plans/** Collection\n";
    updatedPRD += "```javascript\n";
    updatedPRD += "{\n";
    updatedPRD += "  planId: \"free\",                             // Document ID: free\n";
    updatedPRD += "  name: \"Free Plan\",\n";
    updatedPRD += "  description: \"Basic AI chat features\", \"File Analysis\", \"Generate Image\", \"Generative AI\",\n";
    updatedPRD += "  price: 0,\n";
    updatedPRD += "  currency: \"USD\",\n";
    updatedPRD += "  limits: {\n";
    updatedPRD += "    dailyRequests: 10,\n";
    updatedPRD += "    monthlyRequests: 300,\n";
    updatedPRD += "    maxTokensPerRequest: 1000,\n";
    updatedPRD += "    maxConversations: 5,\n";
    updatedPRD += "    features: [\"basic_chat\", \"file_analysis\", \"generate_image\", \"generative_ai\"]\n";
    updatedPRD += "  },\n";
    updatedPRD += "  isActive: true,\n";
    updatedPRD += "  createdAt: Timestamp,\n";
    updatedPRD += "  updatedAt: Timestamp\n";
    updatedPRD += "}\n";
    updatedPRD += "```\n\n";
    
    updatedPRD += "#### 💳 **billing_transactions/** Collection\n";
    updatedPRD += "```javascript\n";
    updatedPRD += "{\n";
    updatedPRD += "  transactionId: \"auto_generated_id\",         // Document ID\n";
    updatedPRD += "  userId: \"firebase_user_id\",                 // Reference to users\n";
    updatedPRD += "  amount: 19.99,\n";
    updatedPRD += "  currency: \"USD\",\n";
    updatedPRD += "  planId: \"pro\",\n";
    updatedPRD += "  status: \"completed\",                        // pending, completed, failed, refunded\n";
    updatedPRD += "  paymentMethod: \"card\",\n";
    updatedPRD += "  stripePaymentIntentId: \"pi_xxx\",\n";
    updatedPRD += "  createdAt: Timestamp,\n";
    updatedPRD += "  updatedAt: Timestamp\n";
    updatedPRD += "}\n";
    updatedPRD += "```\n\n";
    
    updatedPRD += "#### 📊 **usage_analytics/** Collection\n";
    updatedPRD += "```javascript\n";
    updatedPRD += "{\n";
    updatedPRD += "  analyticsId: \"userId_YYYY-MM-DD\",           // Document ID\n";
    updatedPRD += "  userId: \"firebase_user_id\",\n";
    updatedPRD += "  date: \"2024-01-15\",\n";
    updatedPRD += "  requestsCount: 8,\n";
    updatedPRD += "  tokensUsed: 1250,\n";
    updatedPRD += "  contextUsed: 1250,\n";
    updatedPRD += "  conversationsCreated: 2,\n";
    updatedPRD += "  responseTimeAvg: 1.25,\n";
    updatedPRD += "  createdAt: Timestamp,\n";
    updatedPRD += "  updatedAt: Timestamp\n";
    updatedPRD += "}\n";
    updatedPRD += "```\n\n";
    
    // Write updated PRD to file
    const fs = require('fs');
    fs.writeFileSync('UPDATED_DATABASE_ARCHITECTURE.md', updatedPRD);
    
    console.log('✅ PRD documentation updated and saved as UPDATED_DATABASE_ARCHITECTURE.md');
    return true;
  } catch (error) {
    console.error('❌ Error updating PRD documentation:', error);
    return false;
  }
}

// Main function to run both updates
async function main() {
  console.log('🚀 Starting Firestore and PRD update process...\n');
  
  // Update user documents
  const usersUpdated = await updateUserDocuments();
  
  if (!usersUpdated) {
    console.log('❌ Failed to update user documents');
    process.exit(1);
  }
  
  // Update PRD documentation
  const prdUpdated = await updatePRDDocumentation();
  
  if (!prdUpdated) {
    console.log('❌ Failed to update PRD documentation');
    process.exit(1);
  }
  
  console.log('\n🎉 Both Firestore and PRD updates completed successfully!');
  console.log('📝 Updated PRD documentation saved as UPDATED_DATABASE_ARCHITECTURE.md');
}

// Run the script
main();