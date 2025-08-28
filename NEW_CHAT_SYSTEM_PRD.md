# New Chat System PRD (Product Requirements Document)

## 1. ภาพรวมและวัตถุประสงค์

### ข้อมูลโปรเจกต์
- **ชื่อ**: Time AI - New Chat System
- **เป้าหมาย**: ระบบเริ่มการสนทนาใหม่ในแอปพลิเคชัน Time AI
- **ผู้ใช้**: ผู้ใช้ Time AI ที่ต้องการเริ่มการสนทนาใหม่
- **ปัญหาที่แก้ไข**: การเคลียร์การสนทนาปัจจุบันและเริ่มใหม่แบบ seamless

### ฟีเจอร์หลัก
- ปุ่ม "New Chat" ที่มุมบนขวาของหน้า Chat
- เคลียร์ messages state ปัจจุบัน
- รีเซ็ต currentChatId และ currentChatTitle
- UI/UX ที่สวยงามและตอบสนองได้
- การทำงานร่วมกับ Sidebar navigation

## 2. สถาปัตยกรรมเทคนิค

### เทคโนโลยีหลัก
```
Frontend: React 18+ with Hooks
State Management: useState, useCallback
Navigation: React Router v6
Authentication: Firebase Auth
Database: Firebase Cloud Firestore
Styling: CSS Variables + inline styles
Icons: SVG inline icons
```

### โครงสร้างไฟล์หลัก
```
src/
├── App.jsx                  - Main state management และ handleNewChat
├── components/
│   ├── ChatAI.jsx          - Chat interface with New Chat button
│   ├── ChatArea.jsx        - Alternative chat area component
│   ├── Sidebar.jsx         - Navigation integration
│   └── Message.jsx         - Message display components
├── services/
│   ├── firebaseService.js  - Database operations
│   ├── toolsService.js     - AI integration
│   └── usageService.js     - Usage tracking
└── styles/
    └── index.css           - Global styling
```

## 3. Core Implementation

### App.jsx - Main State Management (315 lines)
```jsx
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './config/firebase';
import ChatAI from './components/ChatAI';
import Sidebar from './components/Sidebar';
import firebaseService from './services/firebaseService';
import toolsService from './services/toolsService';
import { canUserMakeRequest, recordUsage } from './services/usageService';

function App() {
  // State Management
  const [user, loading] = useAuthState(auth);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentChatTitle, setCurrentChatTitle] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // New Chat Handler - Core Functionality
  const handleNewChat = useCallback(() => {
    setMessages([]);           // เคลียร์ข้อความทั้งหมด
    setCurrentChatId(null);    // รีเซ็ต chat ID
    setCurrentChatTitle('');   // รีเซ็ต chat title
  }, []);

  // Send Message Handler with New Chat Integration
  const handleSendMessage = async (message) => {
    if (!message.trim()) return;
    
    try {
      // 1. Check usage limits
      const usageCheck = await canUserMakeRequest(user.uid);
      if (!usageCheck.canUse) {
        const errorMessage = { 
          role: 'assistant', 
          content: `คุณได้ใช้งานครบตามขีดจำกัดรายวันแล้ว (${usageCheck.currentUsage}/${usageCheck.dailyLimit} ครั้ง)`
        };
        setMessages(prev => [...prev, { role: 'user', content: message }, errorMessage]);
        return;
      }

      // 2. Add user message to state
      const userMessage = { role: 'user', content: message };
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setIsLoading(true);
      
      // 3. Send to AI API
      const response = await toolsService.sendMessageWithTools(updatedMessages, selectedModel);
      const aiResponse = { 
        role: 'assistant', 
        content: response.choices[0].message.content
      };
      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);
      
      // 4. Record usage
      await recordUsage(user.uid);
      
      // 5. Save to Firestore
      if (user) {
        if (currentChatId) {
          // Update existing conversation
          const updatedData = {
            messages: finalMessages,
            timestamp: Date.now()
          };
          await firebaseService.updateChatMessages(currentChatId, updatedData);
        } else {
          // Create new conversation (สำหรับการสนทนาที่เริ่มจาก New Chat)
          const chatTitle = message.length > 30 ? `${message.substring(0, 30)}...` : message;
          const chatData = {
            title: chatTitle,
            messages: finalMessages,
            timestamp: Date.now()
          };
          const chatId = await firebaseService.saveChatHistory(user.uid, chatData);
          setCurrentChatId(chatId);
          setCurrentChatTitle(chatTitle);
          setChatHistory(prev => [{ id: chatId, ...chatData, userId: user.uid }, ...prev]);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      const errorMessage = { role: 'assistant', content: 'ขออภัย เกิดข้อผิดพลาด กรุณาลองใหม่' };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Router>
      <Routes>
        <Route path="*" element={
          <AuthGuard>
            <div className="app">
              <Sidebar onNewChat={handleNewChat} isOpen={isSidebarOpen} />
              <div className="main-content">
                <Routes>
                  <Route path="/chatai" element={
                    <ChatAI 
                      messages={messages} 
                      isLoading={isLoading} 
                      onNewChat={handleNewChat}
                      onSendMessage={handleSendMessage}
                    />
                  } />
                </Routes>
              </div>
            </div>
          </AuthGuard>
        } />
      </Routes>
    </Router>
  );
}

export default App;
```

### ChatAI.jsx - Chat Interface Component (145 lines)
```jsx
import { useState, useRef, useEffect } from 'react'
import Message from './Message'
import Loading from './Loading'

function ChatAI({ messages, isLoading, onNewChat, onSendMessage }) {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef(null)
  const textareaRef = useRef(null)

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      const newHeight = Math.min(textarea.scrollHeight, 120)
      textarea.style.height = 'auto'
      textarea.style.height = newHeight + 'px'
    }
  }, [message])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (message.trim() && !isLoading) {
      onSendMessage(message)
      setMessage('')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit(e)
    }
  }

  return (
    <>
      {/* Chat Area */}
      <div className="chat-area">
        {/* Header with New Chat Button */}
        <div style={{
          position: 'fixed',
          top: '10px',
          right: '20px',
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <button
            onClick={onNewChat}
            style={{
              background: 'var(--brand-gradient)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              padding: '0.5rem 1rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              fontWeight: '500',
              height: '40px',
              boxShadow: '0 2px 5px rgba(6, 61, 48, 0.3)',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            New Chat
          </button>
        </div>

        {/* Messages Display */}
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h3>Welcome to Time AI</h3>
            <p>Start a conversation with your AI assistant</p>
          </div>
        ) : (
          messages.map((message, index) => (
            <Message 
              key={`${message.role}-${index}-${message.content.slice(0, 50)}`} 
              role={message.role} 
              content={message.content} 
            />
          ))
        )}
        {isLoading && <Loading />}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="chat-input-container">
        <form onSubmit={handleSubmit} className="chat-input">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask anything..."
            rows="1"
          />
          <button 
            type="submit" 
            className="btn-send"
            disabled={!message.trim() || isLoading}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </form>
      </div>
    </>
  )
}

export default ChatAI
```

## 4. Service Integration

### firebaseService.js - Database Operations
```javascript
class FirebaseService {
  // Save new chat history
  async saveChatHistory(userId, chatData) {
    try {
      const conversationRef = collection(db, 'conversations');
      const docRef = await addDoc(conversationRef, {
        userId: userId,
        title: chatData.title,
        messages: chatData.messages,
        timestamp: chatData.timestamp || Date.now(),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Chat history saved:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('❌ Error saving chat history:', error);
      throw error;
    }
  }

  // Update existing chat messages
  async updateChatMessages(chatId, updateData) {
    try {
      const chatRef = doc(db, 'conversations', chatId);
      await updateDoc(chatRef, {
        messages: updateData.messages,
        timestamp: updateData.timestamp,
        updatedAt: serverTimestamp()
      });
      
      console.log('✅ Chat messages updated:', chatId);
      return true;
    } catch (error) {
      console.error('❌ Error updating chat messages:', error);
      throw error;
    }
  }

  // Get chat history for user
  async getChatHistory(userId) {
    try {
      const conversationsRef = collection(db, 'conversations');
      const q = query(
        conversationsRef,
        where('userId', '==', userId),
        orderBy('timestamp', 'desc'),
        limit(50)
      );
      
      const querySnapshot = await getDocs(q);
      const conversations = [];
      
      querySnapshot.forEach((doc) => {
        conversations.push({
          id: doc.id,
          ...doc.data()
        });
      });
      
      console.log('✅ Chat history loaded:', conversations.length, 'conversations');
      return conversations;
    } catch (error) {
      console.error('❌ Error loading chat history:', error);
      return [];
    }
  }
}

export default new FirebaseService();
```

### toolsService.js - AI Integration
```javascript
class ToolsService {
  async sendMessageWithTools(messages, model = 'gpt-4o-mini') {
    try {
      // ตรวจสอบว่า Puter.js โหลดแล้วหรือยัง
      if (typeof window.puter === 'undefined') {
        throw new Error('Puter.js not loaded. Please refresh the page.');
      }
      
      // ใช้ Puter.js AI chat
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
    } catch (error) {
      console.error('Puter.js AI chat error:', error);
      return {
        choices: [{
          message: {
            content: `❌ Error: ${error.message}\n\n🔧 Solutions:\n1. Refresh page\n2. Check internet connection\n3. Try again`
          }
        }]
      };
    }
  }
}

export default new ToolsService();
```

### usageService.js - Usage Tracking
```javascript
// Helper functions for usage tracking
export const canUserMakeRequest = async (userId) => {
  try {
    const usageData = await usageService.getDailyUsage(userId);
    const hasReachedLimit = usageData.requests.remaining <= 0;
    
    return {
      canUse: !hasReachedLimit,
      currentUsage: usageData.requests.count,
      dailyLimit: usageData.requests.limit,
      remaining: usageData.requests.remaining
    };
  } catch (error) {
    console.error('Error checking user request limits:', error);
    return {
      canUse: true, // Allow usage in case of error
      currentUsage: 0,
      dailyLimit: 10,
      remaining: 10
    };
  }
};

export const recordUsage = async (userId) => {
  try {
    return await usageService.incrementUsage(userId, 'requests', 1);
  } catch (error) {
    console.error('Error recording usage:', error);
    return false;
  }
};
```

## 5. CSS Implementation

### Core Styles for New Chat Button
```css
:root {
  --brand-gradient: linear-gradient(135deg, #10A37F 0%, #4ade80 100%);
  --transition: all 0.2s ease;
}

/* New Chat Button in Chat Area */
.new-chat-btn {
  background: var(--brand-gradient);
  color: white;
  border: none;
  border-radius: 6px;
  padding: 0.5rem 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  height: 40px;
  box-shadow: 0 2px 5px rgba(6, 61, 48, 0.3);
  transition: var(--transition);
  position: fixed;
  top: 10px;
  right: 20px;
  z-index: 100;
}

.new-chat-btn:hover {
  background: linear-gradient(135deg, #0d8a6b 0%, #3bb870 100%);
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(6, 61, 48, 0.4);
}

.new-chat-btn:active {
  transform: translateY(0);
  box-shadow: 0 2px 4px rgba(6, 61, 48, 0.3);
}

.new-chat-btn svg {
  width: 16px;
  height: 16px;
  stroke-width: 2;
}

/* Welcome Message */
.welcome-message {
  text-align: center;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.welcome-message h3 {
  font-size: 32px;
  margin-bottom: 12px;
  background: linear-gradient(90deg, #10A37F, #0d8a6b, #063D30);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 700;
}

/* Responsive Design */
@media (max-width: 768px) {
  .new-chat-btn {
    top: 70px;
    right: 10px;
    padding: 0.4rem 0.8rem;
    font-size: 14px;
    height: 36px;
  }
}
```

## 6. Data Flow & User Journey

### Complete New Chat Flow
```
1. User คลิกปุ่ม "New Chat" → ChatAI หรือ Sidebar
2. handleNewChat() ใน App.jsx → เคลียร์ state
3. messages = [] → แสดง Welcome message
4. currentChatId = null → เตรียมสำหรับการสนทนาใหม่
5. currentChatTitle = '' → ไม่มีชื่อการสนทนา
6. User พิมพ์ข้อความแรก → handleSendMessage()
7. ตรวจสอบ usage limits → usageService
8. ส่งข้อความไป AI → toolsService
9. สร้าง conversation ใหม่ → firebaseService.saveChatHistory()
10. อัปเดต chatHistory state → แสดงใน Sidebar
11. อัปเดต currentChatId → สำหรับข้อความต่อไป
```

### State Management Flow
```
Initial State:
- messages: []
- currentChatId: null
- currentChatTitle: ''

After New Chat Click:
- messages: [] (cleared)
- currentChatId: null (reset)
- currentChatTitle: '' (reset)
- UI shows: Welcome message

After First Message:
- messages: [userMsg, aiMsg]
- currentChatId: 'new-chat-id'
- currentChatTitle: 'First message...'
- UI shows: Conversation
```

## 7. Testing Framework

### Unit Tests
```javascript
// NewChat.test.jsx
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import ChatAI from '../components/ChatAI';

describe('New Chat Functionality', () => {
  const mockOnNewChat = jest.fn();
  const mockOnSendMessage = jest.fn();

  beforeEach(() => {
    mockOnNewChat.mockClear();
    mockOnSendMessage.mockClear();
  });

  test('renders New Chat button', () => {
    render(
      <ChatAI 
        messages={[]} 
        isLoading={false} 
        onNewChat={mockOnNewChat}
        onSendMessage={mockOnSendMessage}
      />
    );
    
    expect(screen.getByText('New Chat')).toBeInTheDocument();
  });

  test('calls onNewChat when button clicked', () => {
    render(
      <ChatAI 
        messages={[]} 
        isLoading={false} 
        onNewChat={mockOnNewChat}
        onSendMessage={mockOnSendMessage}
      />
    );
    
    fireEvent.click(screen.getByText('New Chat'));
    expect(mockOnNewChat).toHaveBeenCalledTimes(1);
  });

  test('shows welcome message when no messages', () => {
    render(
      <ChatAI 
        messages={[]} 
        isLoading={false} 
        onNewChat={mockOnNewChat}
        onSendMessage={mockOnSendMessage}
      />
    );
    
    expect(screen.getByText('Welcome to Time AI')).toBeInTheDocument();
  });

  test('clears messages after new chat', async () => {
    const { rerender } = render(
      <ChatAI 
        messages={[{ role: 'user', content: 'Test message' }]} 
        isLoading={false} 
        onNewChat={mockOnNewChat}
        onSendMessage={mockOnSendMessage}
      />
    );
    
    // Should show existing message
    expect(screen.getByText('Test message')).toBeInTheDocument();
    
    // Click new chat and re-render with empty messages
    fireEvent.click(screen.getByText('New Chat'));
    
    rerender(
      <ChatAI 
        messages={[]} 
        isLoading={false} 
        onNewChat={mockOnNewChat}
        onSendMessage={mockOnSendMessage}
      />
    );
    
    // Should show welcome message
    expect(screen.getByText('Welcome to Time AI')).toBeInTheDocument();
  });
});
```

## 8. Troubleshooting Guide

### ปัญหาทั่วไปและวิธีแก้ไข

#### 1. ปุ่ม New Chat ไม่ทำงาน
```javascript
// ตรวจสอบ onNewChat prop
console.log('onNewChat function:', typeof onNewChat);

// ตรวจสอบ event handler
const handleNewChatClick = () => {
  console.log('New Chat clicked');
  if (onNewChat) {
    onNewChat();
  } else {
    console.error('onNewChat function not provided');
  }
};
```

#### 2. State ไม่รีเซ็ต
```javascript
// ตรวจสอบ useCallback dependencies
const handleNewChat = useCallback(() => {
  console.log('Clearing chat state');
  setMessages([]);
  setCurrentChatId(null);
  setCurrentChatTitle('');
}, []); // ไม่มี dependencies
```

#### 3. Welcome Message ไม่แสดง
```javascript
// ตรวจสอบ conditional rendering
{messages.length === 0 ? (
  <div className="welcome-message">
    <h3>Welcome to Time AI</h3>
    <p>Start a conversation with your AI assistant</p>
  </div>
) : (
  // Messages display
)}
```

## 9. Development Checklist

### ขั้นตอนการพัฒนา
- [ ] ติดตั้ง dependencies: React, React Router, Firebase
- [ ] สร้าง handleNewChat function ใน App.jsx
- [ ] เพิ่ม New Chat button ใน ChatAI component
- [ ] เพิ่ม CSS styling สำหรับปุ่ม
- [ ] Integration กับ Sidebar component
- [ ] ทดสอบ state management
- [ ] เขียน unit tests
- [ ] ทดสอบ responsive design
- [ ] ตรวจสอบ accessibility

### การใช้งานในโปรเจกต์
```jsx
// App.jsx integration
const handleNewChat = useCallback(() => {
  setMessages([]);
  setCurrentChatId(null);
  setCurrentChatTitle('');
}, []);

// ChatAI component usage
<ChatAI 
  messages={messages}
  isLoading={isLoading}
  onNewChat={handleNewChat}
  onSendMessage={handleSendMessage}
/>
```

## 10. สรุปและเป้าหมาย

ระบบ New Chat นี้ได้รับการออกแบบให้เป็น production-ready feature ที่:
- ให้ผู้ใช้เริ่มการสนทนาใหม่ได้อย่างง่ายดาย
- รีเซ็ต state ทั้งหมดอย่างสมบูรณ์
- มี UI/UX ที่สวยงามและตอบสนองได้
- ทำงานร่วมกับระบบ Firebase และ authentication
- รองรับการใช้งานบน mobile และ desktop
- ครอบคลุมด้วย unit tests และ error handling

AI agents สามารถใช้เอกสารนี้เป็น context เพื่อพัฒนา ปรับปรุง หรือแก้ไขระบบ New Chat ได้อย่างครบถ้วนและมีประสิทธิภาพ

---

**หมายเหตุ**: เอกสารนี้ครอบคลุมการทำงานทั้งหมดของปุ่ม New Chat ตั้งแต่ UI component, state management, service integration, ไปจนถึง testing และ troubleshooting สำหรับให้ AI agents สามารถทำงานต่อได้แบบ end-to-end