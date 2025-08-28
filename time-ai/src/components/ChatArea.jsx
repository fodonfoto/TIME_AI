import { useEffect, useRef } from 'react'
import Message from './Message'
import Loading from './Loading'

function ChatArea({ messages, isLoading, onNewChat, currentChatTitle }) {
  const messagesEndRef = useRef(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  return (
    <div className="chat-area">
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
          {"New Chat"}
        </button>
      </div>

      {messages.length === 0 ? (
        <div className="welcome-message">
          <h3>{"Welcome to Time AI"}</h3>
          <p>{"Start a conversation with your AI assistant"}</p>
        </div>
      ) : (
        messages.map((message, index) => (
          <Message key={`${message.role}-${index}-${message.content.slice(0, 50)}`} role={message.role} content={message.content} />
        ))
      )}
      {isLoading && <Loading />}
      <div ref={messagesEndRef} />
    </div>
  )
}

export default ChatArea