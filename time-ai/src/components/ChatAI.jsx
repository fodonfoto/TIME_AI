import { useState, useRef, useEffect } from 'react'
import Message from './Message'
import Loading from './Loading'
import ChatScrollAnchor from './ChatScrollAnchor'
import ChatInput from './ChatInput'

function ChatAI({ messages, isLoading, onNewChat, onSendMessage }) {
  const messagesContainerRef = useRef(null)
  const [isAtBottom, setIsAtBottom] = useState(true)

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (isAtBottom && messagesContainerRef.current) {
      const container = messagesContainerRef.current
      container.scrollTop = container.scrollHeight
    }
  }, [messages, isLoading, isAtBottom])

  // Track scroll position to determine if user has scrolled up
  const handleScroll = () => {
    if (!messagesContainerRef.current) return
    
    const container = messagesContainerRef.current
    const isScrolledToBottom = 
      container.scrollHeight - container.scrollTop <= container.clientHeight + 100
    
    setIsAtBottom(isScrolledToBottom)
  }



  return (
    <div className="chat-container">
      {/* Header with New Chat button */}
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          New Chat
        </button>
      </div>

      {/* Chat Messages Area */}
      <div 
        className="chat-area"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h3>Welcome to Time AI</h3>
            <p>Start a conversation with your AI assistant</p>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <Message 
                key={`${message.role}-${index}-${message.content.slice(0, 50)}`} 
                role={message.role} 
                content={message.content} 
              />
            ))}
            {isLoading && <Loading />}
            <ChatScrollAnchor trackVisibility={isAtBottom} />
          </>
        )}
      </div>

      {/* Scroll to bottom button */}
      {!isAtBottom && messages.length > 0 && (
        <button
          className="scroll-to-bottom-btn"
          onClick={() => {
            if (messagesContainerRef.current) {
              messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight
              setIsAtBottom(true)
            }
          }}
          style={{
            position: 'fixed',
            bottom: '120px',
            right: '50%',
            transform: 'translateX(50%)',
            background: 'var(--brand-gradient)',
            color: 'white',
            border: 'none',
            borderRadius: '50%',
            width: '40px',
            height: '40px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(6, 61, 48, 0.3)',
            zIndex: 50,
            transition: 'all 0.2s ease'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      )}

      {/* Chat Input */}
      <ChatInput onSendMessage={onSendMessage} isLoading={isLoading} />
    </div>
  )
}

export default ChatAI