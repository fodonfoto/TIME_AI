import { useState, useRef, useEffect } from 'react'

function ChatInput({ onSendMessage, isLoading }) {
  const [message, setMessage] = useState('')
  const [selectedModel, setSelectedModel] = useState('GPT-4 Turbo')
  const textareaRef = useRef(null)

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

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      const newHeight = Math.min(textarea.scrollHeight, 200)
      textarea.style.height = `${newHeight}px`
    }
  }, [message])

  const handleFileUpload = (e) => {
    const file = e.target.files[0]
    if (file) {
      console.log('File selected:', encodeURIComponent(file.name))
    }
  }

  return (
    <div className="chat-input-container">
      <div className="modern-chat-input">
        {/* Main input container */}
        <div className="input-wrapper">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask a question..."
            rows="1"
            disabled={isLoading}
            className="modern-textarea"
          />
          
          {/* Bottom toolbar */}
          <div className="input-toolbar">
            {/* Left side controls */}
            <div className="toolbar-left">
              <div className="model-selector-group">
                {/* AI Models toggle */}
                <button className="model-toggle-btn" title="Select AI Model">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22" strokeLinecap="round"/>
                    <path d="M20 5.69899C19.0653 5.76636 17.8681 6.12824 17.0379 7.20277C15.5385 9.14361 14.039 9.30556 13.0394 8.65861C11.5399 7.6882 12.8 6.11636 11.0401 5.26215C9.89313 4.70542 9.73321 3.19045 10.3716 2" strokeLinejoin="round"/>
                    <path d="M2 11C2.7625 11.6621 3.83046 12.2682 5.08874 12.2682C7.68843 12.2682 8.20837 12.7649 8.20837 14.7518C8.20837 16.7387 8.20837 16.7387 8.72831 18.2288C9.06651 19.1981 9.18472 20.1674 8.5106 21" strokeLinejoin="round"/>
                    <path d="M19.8988 19.9288L22 22M21.1083 17.0459C21.1083 19.2805 19.2932 21.0919 17.0541 21.0919C14.8151 21.0919 13 19.2805 13 17.0459C13 14.8114 14.8151 13 17.0541 13C19.2932 13 21.1083 14.8114 21.1083 17.0459Z" strokeLinecap="round"/>
                  </svg>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chevron-icon">
                    <path d="m7 15 5 5 5-5"/>
                    <path d="m7 9 5-5 5 5"/>
                  </svg>
                </button>
                
                {/* Tools toggle */}
                <button className="tools-btn" title="Tools">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20.663 8.85C21.2522 6.81022 21.0868 5.03955 20.0236 3.97636C17.7744 1.7271 12.3587 3.49602 7.92736 7.92736C7.45397 8.40074 7.01097 8.88536 6.6 9.37615M17.4 14.6238C16.989 15.1146 16.546 15.5993 16.0726 16.0726C11.6413 20.504 6.22562 22.2729 3.97636 20.0236C2.83569 18.883 2.72842 16.928 3.47772 14.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M12.6754 9.30005L10.9243 11.3704C10.7105 11.6476 10.6037 11.7862 10.6699 11.8931C10.7361 12 10.9288 12 11.3141 12H12.6867C13.072 12 13.2647 12 13.3309 12.107C13.3971 12.2139 13.2902 12.3525 13.0765 12.6297L11.3141 14.7" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M9.75 17.7059C9.13145 17.2114 8.52058 16.6659 7.92736 16.0726C3.49602 11.6413 1.7271 6.22562 3.97636 3.97636C5.11702 2.83569 7.07202 2.72842 9.3 3.47772M14.25 20.3607C16.6631 21.2813 18.8068 21.2405 20.0236 20.0236C22.2729 17.7744 20.504 12.3587 16.0726 7.92736C15.4794 7.33413 14.8686 6.78862 14.25 6.29407" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              </div>
              
              {/* Model selector */}
              <button className="model-selector" title="Select Model">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 12C4 8.22876 4 6.34315 5.17157 5.17157C6.34315 4 8.22876 4 12 4C15.7712 4 17.6569 4 18.8284 5.17157C20 6.34315 20 8.22876 20 12C20 15.7712 20 17.6569 18.8284 18.8284C17.6569 20 15.7712 20 12 20C8.22876 20 6.34315 20 5.17157 18.8284C4 17.6569 4 15.7712 4 12Z" strokeLinejoin="round"/>
                  <path d="M9.5 2V4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.5 2V4" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M9.5 20V22" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14.5 20V22" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M13 9L9 13" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M15 13L13 15" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 14.5L20 14.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 9.5L2 9.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M4 14.5L2 14.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M22 9.5L20 9.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="model-name">{selectedModel}</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="chevron-icon">
                  <path d="m7 15 5 5 5-5"/>
                  <path d="m7 9 5-5 5 5"/>
                </svg>
              </button>
            </div>
            
            {/* Right side controls */}
            <div className="toolbar-right">
              {/* File upload button */}
              <label className="modern-file-btn" title="Attach file">
                <input 
                  type="file" 
                  style={{ display: 'none' }} 
                  onChange={handleFileUpload}
                  accept="image/*,.pdf,.doc,.docx,.txt"
                />
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20.4999 10.5V10C20.4999 6.22876 20.4999 4.34315 19.3284 3.17157C18.1568 2 16.2712 2 12.4999 2H11.5C7.72883 2 5.84323 2 4.67166 3.17156C3.50009 4.34312 3.50007 6.22872 3.50004 9.99993L3.5 14.5C3.49997 17.7874 3.49996 19.4312 4.40788 20.5375C4.57412 20.7401 4.75986 20.9258 4.96242 21.0921C6.06877 22 7.71249 22 10.9999 22" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7.5 7H16.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M7.5 12H13.5" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M20.5 20L20.5 17C20.5 15.5706 19.1569 14 17.5 14C15.8431 14 14.5 15.5706 14.5 17L14.5 20.5C14.5 21.3284 15.1716 22 16 22C16.8284 22 17.5 21.3284 17.5 20.5V17" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </label>
              
              {/* Send button */}
              <button 
                type="submit" 
                className="modern-send-btn"
                disabled={!message.trim() || isLoading}
                title={isLoading ? 'Sending...' : 'Send message'}
                onClick={handleSubmit}
              >
                {isLoading ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="loading-spinner">
                    <circle cx="12" cy="12" r="10" opacity="0.25"/>
                    <path d="M12 2a10 10 0 0 1 10 10" opacity="0.75"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 10v3"/>
                    <path d="M6 6v11"/>
                    <path d="M10 3v18"/>
                    <path d="M14 8v7"/>
                    <path d="M18 5v13"/>
                    <path d="M22 10v3"/>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ChatInput