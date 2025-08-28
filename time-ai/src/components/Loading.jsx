import React from 'react'

function Loading() {
  return (
    <div className="message assistant">
      <div className="message-avatar">AI</div>
      <div className="message-content">
        <div className="loading">
          <span>Thinking</span>
          <div className="loading-dots">
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
            <div className="loading-dot"></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Loading