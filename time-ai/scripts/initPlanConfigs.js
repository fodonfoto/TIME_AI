// Initialize Plan Configs Script
// This script initializes the plan_configs collection in Firestore according to the PRD

const { initializeApp } = require('firebase/app');
const { getFirestore, doc, setDoc, serverTimestamp } = require('firebase/firestore');

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

// Define the plan configurations according to PRD
const planConfigs = {
  free: {
    planId: "free",
    name: "Free Plan",
    description: "Basic AI chat features, File Analysis, Generate Image, Generative AI",
    price: 0,
    currency: "USD",
    limits: {
      dailyRequests: 10,
      monthlyRequests: 300,
      maxTokensPerRequest: 1000,
      maxConversations: 5,
      features: ["basic_chat", "file_analysis", "generate_image", "generative_ai"]
    },
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  pro: {
    planId: "pro",
    name: "Pro Plan",
    description: "Advance Agent Chat, File Analysis, Code Analysis, Generate Image, Generative AI, Connect Tools",
    price: 10,
    currency: "USD",
    limits: {
      dailyRequests: 100,
      monthlyRequests: 300,
      maxTokensPerRequest: 1000,
      maxConversations: 50,
      features: ["advance_chat", "file_analysis", "code_analysis", "generate_image", "generative_ai", "connect_tools"]
    },
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  },
  max: {
    planId: "max",
    name: "Max Plan",
    description: "Advance Agent Chat, File Analysis, Code Analysis, Generate Image, Generative AI, Connect Tools, Priority Support, Cerebras AI",
    price: 18,
    currency: "USD",
    limits: {
      dailyRequests: -1,
      monthlyRequests: -1,
      maxTokensPerRequest: -1,
      maxConversations: -1,
      features: ["advance_chat", "file_analysis", "code_analysis", "generate_image", "generative_ai", "connect_tools", "priority_support", "cerebras_ai"]
    },
    isActive: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
};

// Function to update plan configs
async function updatePlanConfigs() {
  try {
    console.log('🔧 Initializing plan configs...');
    
    for (const [planId, planData] of Object.entries(planConfigs)) {
      const planRef = doc(db, 'plan_configs', planId);
      await setDoc(planRef, planData);
      console.log(`✅ Plan config ${planId} initialized`);
    }
    
    console.log('🎉 All plan configs initialized successfully');
  } catch (error) {
    console.error('❌ Error initializing plan configs:', error);
    process.exit(1);
  }
}

// Run the initialization
updatePlanConfigs();