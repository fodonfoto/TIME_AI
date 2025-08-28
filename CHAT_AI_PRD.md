# 💬 Time.AI Chat AI - Product Requirements Document (PRD)

## 🎯 **Executive Summary**

Time.AI Chat AI เป็นหน้าหลักของแอปพลิเคชันที่ให้ผู้ใช้สามารถสนทนากับ AI ได้แบบ real-time พร้อมระบบจัดการการสนทนา usage tracking และ subscription management ที่ครบถ้วน

## 🏗️ **System Architecture**

### **Database Architecture (Firebase-only)**
```
Firebase Firestore Collections:
├── conversations/          - บันทึกการสนทนาทั้งหมด
├── users/                 - ข้อมูลผู้ใช้และ plan
├── usage_tracking/        - ติดตามการใช้งานรายวัน
├── usage_analytics/       - วิเคราะห์การใช้งาน
└── subscription_plans/    - แผนการสมาชิก
```

### **Frontend Components Structure**
```
src/components/
├── ChatAI.jsx            - หน้าหลักของ Chat AI
├── Message.jsx           - แสดงข้อความแต่ละรายการ
├── Loading.jsx           - Loading indicator
├── ChatInput.jsx         - Input field สำหรับพิมพ์
├── ChatArea.jsx          - พื้นที่แสดงการสนทนา
└── AuthGuard.jsx         - ระบบรักษาความปลอดภัย
```

### **Core Services**
```
src/services/
├── toolsService.js       - AI API integration (Puter.ai)
├── firebaseService.js    - Firestore operations
├── usageService.js       - Usage tracking & limits
└── subscriptionService.js - Plan management
```

## 📋 **Feature Specifications**

### **1. Chat Interface Features**

#### **Chat Display Area**
- แสดงข้อความในรูปแบบ conversation thread
- Auto-scroll ไปยังข้อความล่าสุดเมื่อมีข้อความใหม่
- แสดง loading indicator ขณะรอ AI response
- Welcome message สำหรับการสนทนาใหม่
- Message role: 'user' และ 'assistant'

#### **Chat Input System**
- Textarea ที่ auto-resize ตามเนื้อหา (สูงสุด 120px)
- Send button ที่ disable เมื่อไม่มีข้อความหรือกำลัง loading
- Support Enter key สำหรับส่งข้อความ (Shift+Enter สำหรับขึ้นบรรทัดใหม่)
- File upload button (ยังไม่ได้ implement เต็มรูปแบบ)

#### **New Chat Feature**
- ปุ่ม "New Chat" ที่มุมบนขวา
- เคลียร์การสนทนาปัจจุบันและเริ่มใหม่
- Reset currentChatId และ currentChatTitle

### **2. Conversation Management**

#### **Data Model - conversations/ Collection**
```javascript
{
  conversationId: "auto_generated_id",        // Document ID
  userId: "firebase_user_id",                 // Reference to users
  title: "Chat about React",
  messages: [
    {
      id: "msg_1",
      role: "user",                           // user, assistant
      content: "How to use React hooks?",
      timestamp: Timestamp,
      tokens: 15,
      request: 10,
      context: 59000
    }
  ],
  messageCount: 2,
  totalTokens: 135,
  totalRequest: 20,
  totalContext: 119000,
  createdAt: Timestamp,
  updatedAt: Timestamp,
  isArchived: false
}
```

#### **Save & Load Logic**
- บันทึกการสนทนาอัตโนมัติหลังแต่ละข้อความ
- การสนทนาใหม่: สร้าง conversation document ใหม่
- การสนทนาต่อ: อัปเดต messages array ของ conversation เดิม
- Load chat history เมื่อผู้ใช้ login

### **3. AI Integration**

#### **Puter.ai API Integration**
```javascript
// toolsService.js implementation
async sendMessageWithTools(messages, model = 'gpt-4o-mini') {
  // ตรวจสอบ Puter.js loaded
  if (typeof window.puter === 'undefined') {
    throw new Error('Puter.js not loaded');
  }
  
  // เรียก AI API
  const response = await window.puter.ai.chat(messages, {
    model,
    max_tokens: 2000
  });
  
  // แปลงผลลัพธ์เป็นรูปแบบที่ frontend ต้องการ
  return {
    choices: [{
      message: {
        content: response || 'ขออภัย ไม่สามารถสร้างคำตอบได้'
      }
    }]
  };
}
```

#### **Supported Models**
- Default: 'gpt-4o-mini'
- Configurable via selectedModel state
- Error handling สำหรับ model ที่ไม่สามารถใช้ได้

### **4. Usage Tracking & Limits**

#### **Data Model - usage_tracking/ Collection**
```javascript
{
  trackingId: "userId_YYYY-MM-DD",           // Document ID
  userId: "firebase_user_id",
  date: "2024-01-15",
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
  conversations: {
    created: 2,
    limit: 5,
    remaining: 3
  },
  resetAt: Timestamp,                        // Daily reset time
  createdAt: Timestamp,
  updatedAt: Timestamp
}
```

#### **Usage Limits by Plan**
```javascript
// Free Plan
{
  dailyRequests: 10,
  monthlyRequests: 300,
  maxTokensPerRequest: 1000,
  maxConversations: 5
}

// Pro Plan  
{
  dailyRequests: 100,
  monthlyRequests: 3000,
  maxTokensPerRequest: 10000,
  maxConversations: 50
}

// Max Plan
{
  dailyRequests: -1,        // Unlimited
  monthlyRequests: -1,      // Unlimited
  maxTokensPerRequest: -1,  // Unlimited
  maxConversations: -1      // Unlimited
}
```

#### **Usage Check Flow**
```javascript
// ก่อนส่งข้อความ
const usageCheck = await canUserMakeRequest(user.uid);
if (!usageCheck.canUse) {
  // แสดงข้อความแจ้งเตือนเกินลิมิต
  const errorMessage = { 
    role: 'assistant', 
    content: `คุณได้ใช้งานครบตามขีดจำกัดรายวันแล้ว (${usageCheck.currentUsage}/${usageCheck.dailyLimit} ครั้ง)`
  };
  return;
}

// หลังได้ response
await recordUsage(user.uid);
```

## 🔄 **Data Flow & User Journey**

### **Complete Message Flow**
```
1. User พิมพ์ข้อความ → ChatInput
2. App.jsx handleSendMessage() → ตรวจสอบ usage limits
3. toolsService.sendMessageWithTools() → ส่งไป Puter.ai
4. รับ AI response → แปลงเป็น message object
5. อัปเดต messages state → แสดงใน UI
6. บันทึกการสนทนาใน Firestore
7. อัปเดต usage tracking
8. อัปเดต chat history ใน sidebar
```

### **Authentication Flow**
```
Login → AuthGuard → Check Firebase user state → Load chat history → ChatAI ready
```

### **Error Handling Flow**
```
Error occurs → Log error → Show user-friendly message → Don't break UI
```

## 💻 **Technical Implementation**

### **State Management in App.jsx**
```javascript
const [messages, setMessages] = useState([]);
const [isLoading, setIsLoading] = useState(false);
const [chatHistory, setChatHistory] = useState([]);
const [currentChatId, setCurrentChatId] = useState(null);
const [currentChatTitle, setCurrentChatTitle] = useState('');
const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
```

### **Key Functions**
```javascript
// Send message handler
const handleSendMessage = async (message) => {
  // 1. Validate & check limits
  // 2. Add user message to state
  // 3. Send to AI API
  // 4. Add AI response to state  
  // 5. Save to Firestore
  // 6. Update usage tracking
}

// New chat handler
const handleNewChat = useCallback(() => {
  setMessages([]);
  setCurrentChatId(null);
  setCurrentChatTitle('');
}, []);

// Rename chat handler  
const handleRenameChat = useCallback(async (chatId, newTitle) => {
  await firebaseService.updateChatTitle(chatId, newTitle);
  // Update local state
}, []);

// Delete chat handler
const handleDeleteChat = useCallback(async (chatId) => {
  await firebaseService.deleteChat(chatId);
  // Update local state
}, []);
```

### **Firebase Operations**

#### **Save Chat History**
```javascript
// firebaseService.js
async saveChatHistory(userId, chatData) {
  const preparedMessages = chatData.messages.map(msg => ({
    id: msg.id || `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    role: String(msg.role || 'user'),
    content: String(msg.content || ''),
    timestamp: msg.timestamp || serverTimestamp(),
    tokens: msg.tokens || 0,
    request: msg.request || 0,
    context: msg.context || 0
  }));
  
  const dataToSave = {
    userId: String(userId),
    title: String(chatData.title || 'การสนทนาใหม่'),
    messages: preparedMessages,
    messageCount: preparedMessages.length,
    totalTokens: preparedMessages.reduce((sum, msg) => sum + (msg.tokens || 0), 0),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    isArchived: false
  };
  
  const docRef = await addDoc(collection(db, 'conversations'), dataToSave);
  return docRef.id;
}
```

#### **Update Chat Messages**
```javascript
async updateChatMessages(chatId, updateData) {
  const sanitizedData = {
    messages: updateData.messages.map(msg => ({
      id: msg.id || `msg_${Date.now()}_${Math.random()}`,
      role: String(msg.role || 'user'),
      content: String(msg.content || ''),
      timestamp: msg.timestamp || serverTimestamp(),
      tokens: msg.tokens || 0
    })),
    updatedAt: serverTimestamp()
  };
  
  const chatRef = doc(db, 'conversations', chatId);
  await updateDoc(chatRef, sanitizedData);
}
```

### **Usage Service Implementation**
```javascript
// usageService.js
export const canUserMakeRequest = async (userId) => {
  const usageData = await usageService.getDailyUsage(userId);
  const hasReachedLimit = usageData.requests.remaining <= 0;
  
  return {
    canUse: !hasReachedLimit,
    currentUsage: usageData.requests.count,
    dailyLimit: usageData.requests.limit,
    remaining: usageData.requests.remaining
  };
};

export const recordUsage = async (userId) => {
  await usageService.incrementUsage(userId, 'requests', 1);
};
```

## 🎨 **UI/UX Specifications**

### **Layout Structure**
```
┌─ Sidebar ─┬─ Chat Header (New Chat Button) ─┐
│  History  │                                 │
│  Plans    │  ┌─ Messages Area ─────────────┐ │
│  Settings │  │ Welcome Message / Messages  │ │
│           │  │ Auto-scroll                 │ │
│           │  │ Loading Indicator           │ │
│           │  └─────────────────────────────┘ │
│           │  ┌─ Chat Input ────────────────┐ │
│           │  │ [📎] Textarea    [Send →] │ │
│           │  └─────────────────────────────┘ │
└───────────┴─────────────────────────────────┘
```

### **Responsive Design**
- Mobile: Sidebar แสดงเป็น overlay
- Desktop: Sidebar แสดงอยู่ด้านซ้ายเสมอ
- Auto-hide sidebar บน mobile หลังเลือก menu

### **Loading States**
- Message loading: แสดง Loading component
- Initial load: แสดง loading spinner
- Error states: แสดงข้อความ error ที่เป็นมิตร

## 🔐 **Security & Authentication**

### **Access Control**
- ทุก route ต้องผ่าน AuthGuard component
- ตรวจสอบ Firebase Auth state
- ห้ามเข้าถึงหากไม่ได้ login

### **Data Security**
- ผู้ใช้เข้าถึงได้เฉพาะการสนทนาของตัวเอง
- Firestore Security Rules จำกัดการเข้าถึงตาม userId
- Log masking สำหรับข้อมูลสำคัญ

### **Security Rules Example**
```javascript
// Firestore Rules
match /conversations/{conversationId} {
  allow read, write: if request.auth != null && 
    resource.data.userId == request.auth.uid;
  allow create: if request.auth != null && 
    request.resource.data.userId == request.auth.uid;
}
```

## 🚀 **Performance Optimization**

### **React Performance**
- useCallback สำหรับ event handlers
- Proper key props สำหรับ message list
- State updates ที่มีประสิทธิภาพ

### **Database Performance**
- Query optimization ด้วย composite indexes
- Pagination สำหรับ chat history
- Batch operations สำหรับ multiple updates

### **Loading Optimization**
- Auto-scroll optimization
- Debounced textarea resize
- Optimistic UI updates

## 🧪 **Testing Requirements**

### **Unit Tests Needed**
- Message component rendering
- Chat input functionality
- Usage limit checking
- Firebase operations

### **Integration Tests**
- Complete message flow
- Authentication integration
- Error handling scenarios

### **E2E Tests (Playwright)**
- Login → Chat → Send message flow
- Usage limit enforcement
- Chat history management

## 📊 **Analytics & Monitoring**

### **Track These Metrics**
- Messages per session
- Response time ของ AI
- Usage limit hit rate
- Error rates
- User retention ใน Chat AI

### **Error Monitoring**
- AI API failures
- Firebase operation errors
- Authentication issues
- Usage tracking failures

## 🔄 **Integration Points**

### **With Other Components**
- **Sidebar**: Chat history navigation
- **SubscriptionPage**: Plan upgrade flow
- **SettingsPage**: User preferences
- **AuthGuard**: Authentication validation

### **External APIs**
- **Puter.ai**: AI chat responses
- **Firebase**: Authentication & database
- **Firestore**: Real-time data

## 📋 **Development Guidelines**

### **Code Standards**
- Follow existing naming conventions
- Add proper error handling
- Use TypeScript-style JSDoc comments
- Implement security logging practices

### **Database Operations**
- Always use serverTimestamp() for timestamps
- Validate data before saving
- Handle edge cases gracefully
- Follow Firestore document reference rules

### **Error Handling**
- Never expose sensitive data in logs
- Provide user-friendly error messages
- Log detailed errors for debugging
- Implement retry mechanisms where appropriate

## 🎯 **Success Metrics**

### **User Experience**
- Message response time < 3 seconds
- Zero data loss in conversations
- 99.9% uptime for chat functionality
- Seamless usage limit enforcement

### **Technical Performance**
- Firebase operation success rate > 99%
- AI API response rate > 95%
- Real-time message delivery
- Efficient memory usage

## 🛠️ **Complete Implementation Examples**

### **Full ChatAI Component Structure**
```javascript
// src/components/ChatAI.jsx
import React, { useEffect, useRef } from 'react';
import Message from './Message';
import Loading from './Loading';

const ChatAI = ({ messages, isLoading, onNewChat, onSendMessage }) => {
  const messagesEndRef = useRef(null);
  const [userMessage, setUserMessage] = React.useState('');
  const textareaRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!userMessage.trim() || isLoading) return;
    
    await onSendMessage(userMessage);
    setUserMessage('');
    
    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleTextareaChange = (e) => {
    setUserMessage(e.target.value);
    
    // Auto-resize textarea
    e.target.style.height = 'auto';
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <button onClick={onNewChat} className="new-chat-btn">
          New Chat
        </button>
      </div>
      
      <div className="messages-area">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h2>Welcome to Time.AI Chat</h2>
            <p>How can I help you today?</p>
          </div>
        ) : (
          messages.map((message) => (
            <Message 
              key={message.id} 
              role={message.role} 
              content={message.content} 
            />
          ))
        )}
        
        {isLoading && <Loading />}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSubmit} className="chat-input-form">
        <div className="input-container">
          <button type="button" className="file-upload-btn">
            📎
          </button>
          <textarea
            ref={textareaRef}
            value={userMessage}
            onChange={handleTextareaChange}
            onKeyPress={handleKeyPress}
            placeholder="Type your message here..."
            className="message-input"
            rows={1}
            disabled={isLoading}
          />
          <button 
            type="submit" 
            disabled={!userMessage.trim() || isLoading}
            className="send-btn"
          >
            Send →
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatAI;
```

### **Complete App.jsx Implementation**
```javascript
// src/App.jsx key sections
import { useState, useEffect, useCallback } from 'react';
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import firebaseService from './services/firebaseService';
import toolsService from './services/toolsService';
import { canUserMakeRequest, recordUsage } from './services/usageService';

function App() {
  const [user, setUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentChatTitle, setCurrentChatTitle] = useState('');
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');

  // Authentication listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      if (user) {
        loadChatHistory(user.uid);
      } else {
        setMessages([]);
        setChatHistory([]);
        setCurrentChatId(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const loadChatHistory = async (userId) => {
    try {
      const history = await firebaseService.getChatHistory(userId);
      setChatHistory(history);
    } catch (error) {
      console.error('Error loading chat history:', error);
    }
  };

  const handleSendMessage = async (message) => {
    if (!user || !message.trim()) return;

    setIsLoading(true);
    
    try {
      // Check usage limits
      const usageCheck = await canUserMakeRequest(user.uid);
      if (!usageCheck.canUse) {
        const errorMessage = {
          id: `msg_${Date.now()}`,
          role: 'assistant',
          content: `You've reached your daily usage limit (${usageCheck.currentUsage}/${usageCheck.dailyLimit} requests). Please upgrade your plan to continue.`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }

      // Add user message to UI
      const userMessage = {
        id: `msg_${Date.now()}_user`,
        role: 'user',
        content: message,
        timestamp: new Date()
      };
      
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);

      // Send to AI API
      const response = await toolsService.sendMessageWithTools(
        updatedMessages,
        selectedModel
      );

      // Add AI response to UI
      const aiMessage = {
        id: `msg_${Date.now()}_assistant`,
        role: 'assistant',
        content: response.choices[0].message.content,
        timestamp: new Date()
      };
      
      const finalMessages = [...updatedMessages, aiMessage];
      setMessages(finalMessages);

      // Save to Firestore
      const chatData = {
        title: currentChatTitle || generateChatTitle(message),
        messages: finalMessages
      };

      if (currentChatId) {
        await firebaseService.updateChatMessages(currentChatId, chatData);
      } else {
        const newChatId = await firebaseService.saveChatHistory(user.uid, chatData);
        setCurrentChatId(newChatId);
        setCurrentChatTitle(chatData.title);
      }

      // Record usage
      await recordUsage(user.uid);
      
      // Refresh chat history
      await loadChatHistory(user.uid);
      
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: `msg_${Date.now()}_error`,
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentChatId(null);
    setCurrentChatTitle('');
  }, []);

  const generateChatTitle = (firstMessage) => {
    return firstMessage.length > 50 
      ? firstMessage.substring(0, 50) + '...' 
      : firstMessage;
  };

  return (
    <div className="app">
      {user ? (
        <>
          <Sidebar 
            chatHistory={chatHistory}
            onSelectChat={handleSelectChat}
            onDeleteChat={handleDeleteChat}
            onRenameChat={handleRenameChat}
          />
          <ChatAI
            messages={messages}
            isLoading={isLoading}
            onNewChat={handleNewChat}
            onSendMessage={handleSendMessage}
          />
        </>
      ) : (
        <AuthGuard />
      )}
    </div>
  );
}

export default App;
```

### **Firestore Security Rules**
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Conversations - users can only access their own conversations
    match /conversations/{conversationId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Usage tracking - users can only access their own usage data
    match /usage_tracking/{trackingId} {
      allow read, write: if request.auth != null && 
        resource.data.userId == request.auth.uid;
      allow create: if request.auth != null && 
        request.resource.data.userId == request.auth.uid;
    }
    
    // Subscription plans - read-only for all authenticated users
    match /subscription_plans/{planId} {
      allow read: if request.auth != null;
    }
  }
}
```

### **CSS Styling Example**
```css
/* src/components/ChatAI.css */
.chat-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  max-width: 100%;
}

.chat-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  justify-content: flex-end;
}

.new-chat-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
}

.new-chat-btn:hover {
  background: #0056b3;
}

.messages-area {
  flex: 1;
  overflow-y: auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.welcome-message {
  text-align: center;
  color: #6b7280;
  margin-top: 2rem;
}

.chat-input-form {
  padding: 1rem;
  border-top: 1px solid #e5e5e5;
}

.input-container {
  display: flex;
  gap: 0.5rem;
  align-items: flex-end;
}

.file-upload-btn {
  background: none;
  border: 1px solid #d1d5db;
  padding: 0.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-size: 1.2rem;
}

.message-input {
  flex: 1;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  padding: 0.75rem;
  resize: none;
  font-family: inherit;
  line-height: 1.5;
  min-height: 44px;
  max-height: 120px;
}

.message-input:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
}

.send-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  min-width: 80px;
}

.send-btn:disabled {
  background: #6c757d;
  cursor: not-allowed;
}

.send-btn:hover:not(:disabled) {
  background: #0056b3;
}

/* Responsive design */
@media (max-width: 768px) {
  .chat-container {
    height: calc(100vh - 60px); /* Account for mobile browser UI */
  }
  
  .input-container {
    flex-wrap: wrap;
  }
  
  .message-input {
    min-width: 200px;
  }
}
```

## 🚨 **Common Issues & Solutions**

### **Issue 1: Puter.ai Not Loading**
```javascript
// Solution: Add check and fallback
if (typeof window.puter === 'undefined') {
  console.error('Puter.js not loaded');
  // Show error message to user
  throw new Error('AI service unavailable. Please refresh the page.');
}
```

### **Issue 2: Firebase Connection Issues**
```javascript
// Solution: Implement retry logic
const saveWithRetry = async (data, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await firebaseService.saveChatHistory(data);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### **Issue 3: Memory Leaks in Chat History**
```javascript
// Solution: Implement pagination
const loadChatHistory = async (userId, limit = 20) => {
  const history = await firebaseService.getChatHistory(userId, {
    limit,
    orderBy: 'updatedAt',
    order: 'desc'
  });
  return history;
};
```

### **Issue 4: Usage Tracking Race Conditions**
```javascript
// Solution: Use Firestore transactions
import { runTransaction, doc } from 'firebase/firestore';

const incrementUsageAtomic = async (userId) => {
  const usageRef = doc(db, 'usage_tracking', `${userId}_${today}`);
  
  await runTransaction(db, async (transaction) => {
    const doc = await transaction.get(usageRef);
    const currentCount = doc.exists() ? doc.data().requests.count : 0;
    
    transaction.set(usageRef, {
      requests: { count: currentCount + 1 },
      updatedAt: serverTimestamp()
    }, { merge: true });
  });
};
```

## 📝 **Development Checklist**

### **Before Starting Development**
- [ ] Verify Firebase project setup
- [ ] Check Puter.ai API access
- [ ] Review Firestore security rules
- [ ] Set up development environment
- [ ] Install required dependencies

### **During Development**
- [ ] Implement error boundaries
- [ ] Add loading states
- [ ] Test usage limit enforcement
- [ ] Verify data persistence
- [ ] Test authentication flow

### **Before Deployment**
- [ ] Run all tests
- [ ] Check performance metrics
- [ ] Verify security rules
- [ ] Test on different devices
- [ ] Validate error handling

### **Post-Deployment**
- [ ] Monitor error rates
- [ ] Track usage metrics
- [ ] Collect user feedback
- [ ] Performance monitoring
- [ ] Security audit

---

**💡 For AI Agents: This file contains everything needed to develop, maintain, and extend the Chat AI feature of the Time.AI application. You can use this as context for any work related to the Chat AI functionality. All code examples are production-ready and follow the established patterns in the codebase.**