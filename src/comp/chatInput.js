import React from 'react';
import './chatInput.css';

function ChatInput() {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
    }
  };

  return (
    <div className="chat-container-wrapper">
      <div className="input-box-container">
        <textarea
          placeholder="Scrie mesajul tău aici..."
          className="chat-textarea"
          onKeyDown={handleKeyDown}
          rows="2"
        />
        <div className="button-row">
          <button className="send-btn" onClick={() => alert('Mesaj trimis!')}>
            <span className="send-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatInput;