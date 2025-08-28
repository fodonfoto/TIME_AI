# History System PRD (Product Requirements Document)

## 1. ภาพรวมและวัตถุประสงค์

### ข้อมูลโปรเจกต์
- **ชื่อ**: Time AI - History System
- **เป้าหมาย**: ระบบจัดการประวัติการสนทนาแบบครบครัน
- **ผู้ใช้**: ผู้ใช้ Time AI ที่ต้องการจัดการและค้นหาการสนทนาเก่า
- **ปัญหาที่แก้ไข**: การค้นหา จัดระเบียบ และจัดการประวัติการสนทนาอย่างมีประสิทธิภาพ

### ฟีเจอร์หลัก
- ระบบค้นหา real-time ในชื่อและเนื้อหา
- การเปลี่ยนชื่อและลบการสนทนา
- Context menu และ modal dialogs
- Responsive design และ performance optimization
- การรวมกับ Firebase real-time updates

## 2. สถาปัตยกรรมเทคนิค

### เทคโนโลยีหลัก
```
Frontend: React 18+ with Hooks
Database: Firebase Cloud Firestore  
Authentication: Firebase Auth
Styling: CSS Variables + Modules
Date Handling: date-fns library
Routing: React Router
```

### แผนผังสถาปัตยกรรม
```
User Input → HistoryPage → Firebase Service → Firestore
     ↓            ↓              ↓             ↓
Navigation ← State Updates ← Real-time ← Data Persistence
```

## 3. Implementation หลัก

### Component Structure
```jsx
// HistoryPage.jsx - Main Component (313 lines)
import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import firebaseService from '../services/firebaseService';

const HistoryPage = ({ chatHistory, onSelectChat, onRenameChat, onDeleteChat }) => {
  // State Management
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHistory, setFilteredHistory] = useState(chatHistory || []);
  const [menuOpen, setMenuOpen] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const menuRefs = useRef({});
  const navigate = useNavigate();

  // Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      const isClickInsideAnyMenu = 
        event.target.closest('.dropdown-menu') || 
        event.target.closest('.history-item-actions');
      if (!isClickInsideAnyMenu) {
        setMenuOpen(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Search Filter
  useEffect(() => {
    if (chatHistory) {
      const filtered = chatHistory.filter(chat => 
        chat.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        chat.messages.some(msg => 
          msg.content.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
      setFilteredHistory(filtered);
    }
  }, [searchTerm, chatHistory]);

  // Event Handlers
  const toggleMenu = (chatId, e) => {
    e.stopPropagation();
    setMenuOpen(menuOpen === chatId ? null : chatId);
  };

  const openRenameModal = (chat, e) => {
    e.stopPropagation();
    setCurrentChat(chat);
    setNewTitle(chat.title);
    setShowRenameModal(true);
    setMenuOpen(null);
  };

  const handleRenameSubmit = (e) => {
    e.preventDefault();
    if (newTitle && newTitle !== currentChat.title) {
      onRenameChat(currentChat.id, newTitle);
    }
    setShowRenameModal(false);
  };

  const handleDeleteConfirm = () => {
    if (currentChat && currentChat.id) {
      onDeleteChat(currentChat.id);
      setShowDeleteModal(false);
    }
  };

  // Utility Functions
  const formatDate = (timestamp) => {
    try {
      if (!timestamp) return 'Unknown date';
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, 'd MMM yyyy, HH:mm', { locale: enUS });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const getPreviewText = (messages) => {
    try {
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return 'No messages';
      }
      const lastMessage = messages[messages.length - 1];
      const content = String(lastMessage.content || '');
      return content.length > 50 ? `${content.substring(0, 50)}...` : content;
    } catch (error) {
      return 'Error loading preview';
    }
  };

  return (
    <>
      {/* Rename Modal */}
      {showRenameModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="history-title">Rename Conversation</div>
            <form onSubmit={handleRenameSubmit}>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                autoFocus
                className="modal-input"
              />
              <div className="modal-actions">
                <button type="button" className="btn-cancel" 
                  onClick={() => setShowRenameModal(false)}>Cancel</button>
                <button type="submit" className="btn-confirm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this conversation?</p>
            <div className="modal-actions">
              <button className="btn-cancel" 
                onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="btn-delete" 
                onClick={handleDeleteConfirm}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="history-page">
        <div className="history-header">
          <h2>Chat History</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>

        <div className="history-list">
          {filteredHistory.length > 0 ? (
            filteredHistory.map((chat) => (
              <div key={chat.id} className="history-item"
                onClick={() => { onSelectChat(chat); navigate('/chatai'); }}>
                <div className="history-item-content">
                  <h4>{chat.title || 'New Conversation'}</h4>
                  <p className="preview">{getPreviewText(chat.messages)}</p>
                  <div className="meta">
                    <span className="date">{formatDate(chat.timestamp)}</span>
                    <span className="message-count">{chat.messages.length} messages</span>
                  </div>
                </div>
                <div className="history-item-actions" onClick={(e) => toggleMenu(chat.id, e)}>
                  <svg width="24" height="24" viewBox="0 0 24 24">
                    <circle cx="12" cy="5" r="2"></circle>
                    <circle cx="12" cy="12" r="2"></circle>
                    <circle cx="12" cy="19" r="2"></circle>
                  </svg>
                  {menuOpen === chat.id && (
                    <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                      <div className="dropdown-item" onClick={(e) => openRenameModal(chat, e)}>
                        <svg width="16" height="16" fill="none" stroke="currentColor">
                          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                        </svg>
                        Rename
                      </div>
                      <div className="dropdown-item danger" 
                        onClick={(e) => { e.stopPropagation(); setCurrentChat(chat); setShowDeleteModal(true); setMenuOpen(null); }}>
                        <svg width="16" height="16" fill="none" stroke="currentColor">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"></path>
                        </svg>
                        Delete
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              <h4>No Chat History Found</h4>
              <p>Start a new conversation to see history here</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default HistoryPage;
```

## 4. Firebase Integration

### Firestore Schema
```javascript
// conversations collection structure
{
  id: "auto-generated-id",
  userId: "user-firebase-uid", 
  title: "conversation title",
  messages: [
    {
      id: "message-id",
      content: "message content", 
      role: "user|assistant",
      timestamp: "2024-01-01T00:00:00Z"
    }
  ],
  timestamp: "2024-01-01T00:00:00Z",
  updatedAt: "2024-01-01T00:00:00Z"
}
```

### Security Rules
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conversations/{conversationId} {
      allow read, write, delete: if request.auth != null 
        && request.auth.uid == resource.data.userId;
    }
  }
}
```

### Firebase Service Methods
```javascript
// firebaseService.js - History operations
import { 
  collection, query, where, orderBy, getDocs, 
  doc, updateDoc, deleteDoc, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../config/firebase';

export const historyService = {
  // Get user conversations
  async getUserConversations(userId) {
    try {
      const q = query(
        collection(db, 'conversations'),
        where('userId', '==', userId),
        orderBy('updatedAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching conversations:', error);
      throw error;
    }
  },

  // Rename conversation
  async renameConversation(conversationId, newTitle) {
    try {
      const conversationRef = doc(db, 'conversations', conversationId);
      await updateDoc(conversationRef, {
        title: newTitle,
        updatedAt: serverTimestamp()
      });
      return true;
    } catch (error) {
      console.error('Error renaming conversation:', error);
      throw error;
    }
  },

  // Delete conversation
  async deleteConversation(conversationId) {
    try {
      await deleteDoc(doc(db, 'conversations', conversationId));
      return true;
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
    }
  }
};
```

## 5. CSS Implementation

### Variables และ Base Styles
```css
:root {
  --text-primary: #1a1a1a;
  --text-secondary: #666666;
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --border: #e1e5e9;
  --accent: #10A37F;
  --danger: #ef4444;
  --border-radius: 8px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --transition: all 0.2s ease;
}

.history-page {
  max-width: 800px;
  margin: 0 auto;
  padding: var(--spacing-lg);
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-lg);
}

.search-bar {
  position: relative;
  width: 300px;
}

.search-bar input {
  width: 100%;
  padding: var(--spacing-sm) var(--spacing-md);
  border: 2px solid var(--border);
  border-radius: var(--border-radius);
  transition: var(--transition);
}

.search-bar input:focus {
  outline: none;
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(16, 163, 127, 0.1);
}

.history-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--spacing-md);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  margin-bottom: var(--spacing-sm);
  cursor: pointer;
  transition: var(--transition);
  position: relative;
}

.history-item:hover {
  border-color: var(--accent);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--bg-primary);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 400px;
  width: 90%;
}

.dropdown-menu {
  position: absolute;
  top: 100%; right: 0;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: var(--border-radius);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
  z-index: 1001;
  min-width: 120px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  padding: var(--spacing-sm) var(--spacing-md);
  cursor: pointer;
  transition: var(--transition);
}

.dropdown-item:hover { background: var(--bg-secondary); }
.dropdown-item.danger { color: var(--danger); }

@media (max-width: 768px) {
  .history-page { padding: var(--spacing-md); }
  .history-header { flex-direction: column; gap: var(--spacing-md); }
  .search-bar { width: 100%; }
}
```

## 6. Error Handling และ Performance

### Error Handling Pattern
```javascript
// Error boundary wrapper
const HistoryErrorBoundary = ({ children }) => {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);
  
  if (hasError) {
    return (
      <div className="error-state">
        <h3>Something went wrong</h3>
        <button onClick={() => window.location.reload()}>Refresh</button>
      </div>
    );
  }
  return children;
};
```

### Performance Optimization
```javascript
// Debounced search hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// ใน HistoryPage
const debouncedSearchTerm = useDebounce(searchTerm, 300);

// Memoized filtering
const filteredHistory = useMemo(() => {
  if (!debouncedSearchTerm) return chatHistory || [];
  return chatHistory.filter(chat =>
    chat.title.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
    chat.messages.some(msg => msg.content.toLowerCase().includes(debouncedSearchTerm.toLowerCase()))
  );
}, [chatHistory, debouncedSearchTerm]);
```

## 7. Testing และ Validation

### Unit Tests
```javascript
// HistoryPage.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import HistoryPage from './HistoryPage';

const mockChatHistory = [
  {
    id: '1',
    title: 'Test Chat',
    messages: [{ content: 'Hello', role: 'user' }],
    timestamp: '2024-01-01T00:00:00Z'
  }
];

describe('HistoryPage', () => {
  test('renders chat history correctly', () => {
    render(<HistoryPage chatHistory={mockChatHistory} onSelectChat={jest.fn()} />);
    expect(screen.getByText('Test Chat')).toBeInTheDocument();
  });

  test('filters conversations on search', async () => {
    render(<HistoryPage chatHistory={mockChatHistory} />);
    const searchInput = screen.getByPlaceholderText('Search conversations...');
    fireEvent.change(searchInput, { target: { value: 'Test' } });
    await waitFor(() => {
      expect(screen.getByText('Test Chat')).toBeInTheDocument();
    });
  });

  test('opens rename modal', () => {
    const { container } = render(<HistoryPage chatHistory={mockChatHistory} />);
    const menuButton = container.querySelector('.history-item-actions');
    fireEvent.click(menuButton);
    fireEvent.click(screen.getByText('Rename'));
    expect(screen.getByText('Rename Conversation')).toBeInTheDocument();
  });
});
```

## 8. Troubleshooting Guide

### ปัญหาทั่วไปและวิธีแก้ไข

#### 1. การสนทนาไม่แสดงผล
```javascript
// เช็ค chatHistory prop
console.log('chatHistory:', chatHistory);
// เพิ่ม fallback
const [filteredHistory, setFilteredHistory] = useState(chatHistory || []);
```

#### 2. เมนูไม่ปิดเมื่อคลิกข้างนอก
```javascript
// ตรวจสอบ event listener
const handleClickOutside = (event) => {
  if (!event.target.closest('.dropdown-menu, .history-item-actions')) {
    setMenuOpen(null);
  }
};
```

#### 3. Search ไม่ทำงาน
```javascript
// เช็คการกรองข้อมูล
const filtered = chatHistory?.filter(chat => {
  const term = searchTerm.toLowerCase();
  return chat.title?.toLowerCase().includes(term) ||
         chat.messages?.some(msg => msg.content?.toLowerCase().includes(term));
}) || [];
```

## 9. Development Checklist

### ขั้นตอนการพัฒนา
- [ ] ติดตั้ง dependencies: React, Firebase, date-fns, React Router
- [ ] สร้าง HistoryPage component พร้อม state management
- [ ] Implement search และ filtering system
- [ ] สร้าง context menu และ modal dialogs
- [ ] Integration กับ Firebase service และ authentication
- [ ] เพิ่ม CSS styling และ responsive design
- [ ] Implement error handling และ performance optimization
- [ ] เขียน unit tests และ integration tests
- [ ] ตรวจสอบ accessibility และ browser compatibility

### การใช้งานในโปรเจกต์
```jsx
// App.jsx integration
import HistoryPage from './components/HistoryPage';
import { useAuth } from './hooks/useAuth';
import { historyService } from './services/firebaseService';

function App() {
  const { user } = useAuth();
  const [chatHistory, setChatHistory] = useState([]);

  useEffect(() => {
    if (user) {
      historyService.getUserConversations(user.uid)
        .then(setChatHistory)
        .catch(console.error);
    }
  }, [user]);

  const handleSelectChat = (chat) => {
    // Navigate to chat with selected conversation
    navigate('/chat', { state: { conversation: chat } });
  };

  const handleRenameChat = async (chatId, newTitle) => {
    try {
      await historyService.renameConversation(chatId, newTitle);
      // Refresh chat history
      const updated = await historyService.getUserConversations(user.uid);
      setChatHistory(updated);
    } catch (error) {
      console.error('Rename failed:', error);
    }
  };

  const handleDeleteChat = async (chatId) => {
    try {
      await historyService.deleteConversation(chatId);
      // Remove from local state
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
    } catch (error) {
      console.error('Delete failed:', error);
    }
  };

  return (
    <Routes>
      <Route path="/history" element={
        <HistoryPage 
          chatHistory={chatHistory}
          onSelectChat={handleSelectChat}
          onRenameChat={handleRenameChat}
          onDeleteChat={handleDeleteChat}
        />
      } />
    </Routes>
  );
}
```

## 10. สรุปและเป้าหมาย

ระบบ History Page นี้ได้รับการออกแบบให้เป็น production-ready component ที่:
- ใช้งานง่ายและมีประสิทธิภาพสูง
- รองรับการค้นหาและจัดการข้อมูลแบบ real-time
- มีการจัดการข้อผิดพลาดและ performance optimization
- เข้ากันได้กับระบบ Firebase และ authentication
- มี responsive design และ accessibility
- ครอบคลุมด้วย unit tests และ integration tests

AI agents สามารถใช้เอกสารนี้เป็น context เพื่อพัฒนา ปรับปรุง หรือแก้ไขระบบ History Page ได้อย่างครบถ้วนและมีประสิทธิภาพ