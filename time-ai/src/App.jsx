// Hot Reload Test - This comment verifies hot reloading is working
import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from './config/firebase';
import { routerConfig } from './router.config';
import Sidebar from './components/Sidebar';
import ChatAI from './components/ChatAI';
import Dashboard from './components/Dashboard';
import HistoryPage from './components/HistoryPage';
import SettingsPage from './components/SettingsPage';
import AgentPage from './components/AgentPage';
import SubscriptionPage from './components/SubscriptionPage';
import LoginPage from './components/LoginPage';
import NotFoundPage from './components/NotFoundPage';
import FirebaseTest from './components/FirebaseTest';
import DatabaseRestructureTest from './components/DatabaseRestructureTest';
import PlanStatus from './components/PlanStatus';
import ErrorBoundary from './components/ErrorBoundary';

import AuthGuard from './components/AuthGuard';
import firebaseService from './services/firebaseService';
import toolsService from './services/toolsService';
import { canUserMakeRequest, recordUsage } from './services/usageService';
import { useWindowSize } from './hooks/useWindowSize';

function App() {
  const [user, loading] = useAuthState(auth);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gpt-4o-mini');
  const [selectedDataset, setSelectedDataset] = useState('default');
  const [selectedEnv, setSelectedEnv] = useState('production');
  const [chatHistory, setChatHistory] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [currentChatTitle, setCurrentChatTitle] = useState('');
  const [setupStatus, setSetupStatus] = useState('');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [redirectInProgress, setRedirectInProgress] = useState(false); // ป้องกัน infinite redirect
  const [historyLoaded, setHistoryLoaded] = useState(false); // ป้องกัน infinite getChatHistory
  const windowSize = useWindowSize();

  useEffect(() => {
    if (user && !loading && !redirectInProgress && !historyLoaded) {
      const loadChatHistory = async () => {
        try {
          setSetupStatus('กำลังโหลดประวัติการสนทนา...');
          const history = await firebaseService.getChatHistory(user.uid);
          setChatHistory(history);
          setHistoryLoaded(true); // ป้องกันการโหลดซ้ำ
          setSetupStatus('');
        } catch (error) {
          console.error('Error loading chat history:', error);
          setHistoryLoaded(true); // ป้องกันการโหลดซ้ำแม้เกิด error
          setSetupStatus('');
        }
      };
      loadChatHistory();
    }
  }, [user, loading, redirectInProgress, historyLoaded]);

  useEffect(() => {
    if (windowSize.width <= 768) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [windowSize]);

  const handleNewChat = useCallback(() => {
    setMessages([]);
    setCurrentChatId(null);
    setCurrentChatTitle('');
  }, []);

  const handleRenameChat = useCallback(async (chatId, newTitle) => {
    try {
      await firebaseService.updateChatTitle(chatId, newTitle);
      setChatHistory(prev => 
        prev.map(chat => 
          chat.id === chatId ? { ...chat, title: newTitle } : chat
        )
      );
    } catch (error) {
      console.error('Failed to rename chat:', error);
    }
  }, []);

  const handleDeleteChat = useCallback(async (chatId) => {
    try {
      await firebaseService.deleteChat(chatId);
      setChatHistory(prev => prev.filter(chat => chat.id !== chatId));
      if (messages.length > 0 && chatHistory.find(chat => chat.id === chatId)?.messages === messages) {
        setMessages([]);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
    }
  }, [messages, chatHistory]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const handleSendMessage = async (message) => {
    if (!message.trim()) return;
    
    try {
      const usageCheck = await canUserMakeRequest(user.uid);
      if (!usageCheck.canUse) {
        const errorMessage = { 
          role: 'assistant', 
          content: `คุณได้ใช้งานครบตามขีดจำกัดรายวันแล้ว (${usageCheck.currentUsage}/${usageCheck.dailyLimit} ครั้ง) กรุณาอัพเกรดแพ็กเกจหรือรอจนถึงวันถัดไป` 
        };
        setMessages(prev => [...prev, { role: 'user', content: message }, errorMessage]);
        return;
      }
    } catch (error) {
      console.error('Error checking usage limits:', error);
    }
    
    const userMessage = { role: 'user', content: message };
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setIsLoading(true);
    
    try {
      const response = await toolsService.sendMessageWithTools(updatedMessages, selectedModel);
      const aiResponse = { 
        role: 'assistant', 
        content: response.choices[0].message.content
      };
      const finalMessages = [...updatedMessages, aiResponse];
      setMessages(finalMessages);
      
      try {
        await recordUsage(user.uid);
      } catch (error) {
        console.error('Error recording usage:', error);
      }
      
      if (user) {
        try {
          if (currentChatId) {
            const updatedData = {
              messages: finalMessages,
              timestamp: Date.now()
            };
            await firebaseService.updateChatMessages(currentChatId, updatedData);
            setChatHistory(prev => prev.map(chat => 
              chat.id === currentChatId 
                ? { ...chat, messages: finalMessages, timestamp: Date.now() }
                : chat
            ));
          } else {
            const chatTitle = currentChatTitle || (message.length > 30 ? `${message.substring(0, 30)}...` : message);
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
        } catch (saveError) {
          console.error('❌ ไม่สามารถบันทึกประวัติการสนทนาได้:', saveError);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Time AI</h2>
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  if (!loading && !user && !redirectInProgress) {
    return (
      <Router future={routerConfig.future}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/404" element={<NotFoundPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    );
  }



  return (
    <Router future={routerConfig.future}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/404" element={<NotFoundPage />} />
        <Route path="*" element={
          <AuthGuard>
            <div className="app" style={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            <Sidebar
              selectedModel={selectedModel}
              setSelectedModel={setSelectedModel}
              selectedDataset={selectedDataset}
              setSelectedDataset={setSelectedDataset}
              selectedEnv={selectedEnv}
              setSelectedEnv={setSelectedEnv}
              onNewChat={handleNewChat}
              isOpen={isSidebarOpen}
              onToggle={toggleSidebar}
            />

            {isSidebarOpen && window.innerWidth <= 768 && (
              <div 
                className="sidebar-overlay"
                onClick={toggleSidebar}
                style={{
                  position: 'fixed',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.5)',
                  zIndex: 99,
                }}
              />
            )}
            
            <div 
              className="main-content"
              style={{
                flex: 1,
                marginLeft: isSidebarOpen ? '260px' : '50px',
                width: isSidebarOpen ? 'calc(100% - 260px)' : 'calc(100% - 50px)',
                transition: 'margin-left 0.3s ease-in-out, width 0.3s ease-in-out',
                position: 'relative',
                overflowY: 'auto',
                height: '100vh',
                padding: '20px',
                boxSizing: 'border-box'
              }}
            >
              {setupStatus && setupStatus.includes('เกิดข้อผิดพลาด') && (
                <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                  ⚠️ {setupStatus} - กรุณาลองรีเฟรชหน้าเว็บ
                </div>
              )}
              
              {setupStatus && setupStatus.includes('🎉') && (
                <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
                  {setupStatus}
                </div>
              )}
              
              {user && (
                <div className="mb-4">
                  <PlanStatus userId={user.uid} />
                </div>
              )}
              
              <Routes>
                <Route path="/" element={<Navigate to="/chatai" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/chatai" element={
                  <ErrorBoundary>
                    <ChatAI 
                      messages={messages} 
                      isLoading={isLoading} 
                      onNewChat={handleNewChat}
                      onSendMessage={handleSendMessage}
                    />
                  </ErrorBoundary>
                } />
                <Route path="/history" element={
                  <HistoryPage 
                    chatHistory={chatHistory}
                    onSelectChat={(chat) => {
                      setMessages(chat.messages || []);
                      setCurrentChatId(chat.id);
                      setCurrentChatTitle(chat.title);
                    }}
                    onRenameChat={handleRenameChat}
                    onDeleteChat={handleDeleteChat}
                  />
                } />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/agent" element={<AgentPage />} />
                <Route path="/subscription" element={<SubscriptionPage />} />
                <Route path="/firebase-test" element={<FirebaseTest />} />
                <Route path="/database-test" element={<DatabaseRestructureTest />} />
                <Route path="*" element={<Navigate to="/chatai" replace />} />
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