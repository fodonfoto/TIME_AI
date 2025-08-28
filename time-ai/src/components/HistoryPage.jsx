import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import firebaseService from '../services/firebaseService';

const HistoryPage = ({ chatHistory, onSelectChat, onRenameChat, onDeleteChat }) => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredHistory, setFilteredHistory] = useState(chatHistory || []);
  const [menuOpen, setMenuOpen] = useState(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [currentChat, setCurrentChat] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const menuRefs = useRef({});

  // ปิดเมนูเมื่อคลิกข้างนอก
  useEffect(() => {
    const handleClickOutside = (event) => {
      // ตรวจสอบว่าไม่ได้คลิกที่ปุ่มเมนูหรือเมนูของรายการใดๆ
      const isClickInsideAnyMenu = 
        // ตรวจสอบว่าคลิกภายใน dropdown menu ใดๆ
        event.target.closest('.dropdown-menu') || 
        // ตรวจสอบว่าคลิกที่ปุ่มเมนูของรายการใดๆ
        event.target.closest('.history-item-actions');

      if (!isClickInsideAnyMenu) {
        setMenuOpen(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [filteredHistory]); // เพิ่ม filteredHistory เป็น dependency เพื่ออัปเดตเมื่อรายการเปลี่ยน

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

  const openDeleteModal = (chat, e) => {
    e.stopPropagation();
    e.preventDefault();
    console.log('Delete clicked for chat:', { id: encodeURIComponent(chat?.id || ''), title: encodeURIComponent(chat?.title || '') }); // Debug log
    if (chat && chat.id) {
      setCurrentChat(chat);
      setShowDeleteModal(true);
      setMenuOpen(null);
    } else {
      console.error('Invalid chat object:', chat);
    }
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
      setCurrentChat(null);
    }
  };



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

  const formatDate = (timestamp) => {
    try {
      if (!timestamp) return 'Unknown date';
      const date = new Date(timestamp);
      if (isNaN(date.getTime())) return 'Invalid date';
      return format(date, 'd MMM yyyy, HH:mm', { locale: enUS });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getPreviewText = (messages) => {
    try {
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return 'No messages';
      }
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage || !lastMessage.content) {
        return 'No content';
      }
      const content = String(lastMessage.content);
      return content.length > 50 
        ? `${content.substring(0, 50)}...` 
        : content;
    } catch (error) {
      console.error('Error getting preview text:', error);
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
                <button 
                  type="button" 
                  className="btn-cancel"
                  onClick={() => setShowRenameModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-confirm"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this conversation?</p>
            <div className="modal-actions">
              <button 
                className="btn-cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Cancel
              </button>
              <button 
                className="btn-delete"
                onClick={handleDeleteConfirm}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

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
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"></circle>
              <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
          </div>
        </div>

      <div className="history-list" style={{ overflow: 'visible' }}>
        {filteredHistory.length > 0 ? (
          filteredHistory.map((chat) => (
            <div 
              key={chat.id} 
              className="history-item"
              style={{ position: 'relative', zIndex: menuOpen === chat.id ? 1001 : 1 }}
              onClick={() => {
                onSelectChat(chat);
                navigate('/chatai');
              }}
            >
              <div className="history-item-content">
                <h4>{chat.title || 'New Conversation'}</h4>
                <p className="preview">{getPreviewText(chat.messages)}</p>
                <div className="meta">
                  <span className="date">{formatDate(chat.timestamp)}</span>
                  <span className="message-count">
                    {chat.messages.length} messages
                  </span>
                </div>
              </div>
              <div 
                className="history-item-actions" 
                ref={el => menuRefs.current[chat.id] = el}
                style={{ 
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  padding: '4px',
                  borderRadius: '4px',
                  transition: 'background-color 0.2s',
                  position: 'relative'
                }}
                onClick={(e) => toggleMenu(chat.id, e)}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.5401 8.31063C18.8987 8.31063 20.0001 7.20925 20.0001 5.85062C20.0001 4.492 18.8987 3.39062 17.5401 3.39062C16.1814 3.39062 15.0801 4.492 15.0801 5.85062C15.0801 7.20925 16.1814 8.31063 17.5401 8.31063Z" fill="currentColor"/>
                  <path d="M8.92 5.85062C8.92 4.49062 7.82001 3.39062 6.46001 3.39062C5.10001 3.39062 4 4.49062 4 5.85062C4 7.21062 5.10001 8.31063 6.46001 8.31063" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17.5401 20.6212C18.9001 20.6212 20.0001 19.5212 20.0001 18.1612C20.0001 16.8012 18.9001 15.7012 17.5401 15.7012C16.1801 15.7012 15.0801 16.8012 15.0801 18.1612" stroke="currentColor" strokeWidth="1.5" strokeMiterlimit="10" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M6.46001 20.6114C7.81863 20.6114 8.92 19.51 8.92 18.1514C8.92 16.7928 7.81863 15.6914 6.46001 15.6914C5.10139 15.6914 4 16.7928 4 18.1514C4 19.51 5.10139 20.6114 6.46001 20.6114Z" fill="currentColor"/>
                </svg>
                
                {menuOpen === chat.id && (
                  <div 
                    className="dropdown-menu"
                    onClick={(e) => {
                      // Prevent click from reaching parent elements
                      e.stopPropagation();
                      e.preventDefault();
                    }}
                  >
                    <div 
                      className="dropdown-item"
                      onClick={(e) => {
                        e.stopPropagation();
                        openRenameModal(chat, e);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
                      </svg>
                      Rename
                    </div>
                    <div 
                      className="dropdown-item danger"
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        openDeleteModal(chat, e);
                      }}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        <line x1="10" y1="11" x2="10" y2="17"></line>
                        <line x1="14" y1="11" x2="14" y2="17"></line>
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
            <div style={{
              width: '48px',
              height: '48px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-secondary)'
            }}>
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
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
