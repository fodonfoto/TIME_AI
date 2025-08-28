import { useState, useEffect } from 'react';
import { showPopupBlockerHelp } from '../utils/popupHelper';

const PopupBlockerModal = ({ isOpen, onClose, onRetry }) => {
  const [helpInfo, setHelpInfo] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const info = showPopupBlockerHelp();
      setHelpInfo(info);
    }
  }, [isOpen]);

  if (!isOpen || !helpInfo) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '500px' }}>
        <div className="modal-header">
          <h3>🚫 Popup ถูกบล็อก</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        
        <div className="modal-body">
          <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)' }}>
            {helpInfo.message}
          </p>
          
          <div style={{ 
            background: 'var(--background-secondary)', 
            padding: '1rem', 
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <h4 style={{ marginBottom: '0.5rem', color: 'var(--text-primary)' }}>
              สำหรับ {helpInfo.browser === 'chrome' ? 'Chrome' : 
                      helpInfo.browser === 'firefox' ? 'Firefox' : 
                      helpInfo.browser === 'safari' ? 'Safari' : 
                      helpInfo.browser === 'edge' ? 'Edge' : 'เบราว์เซอร์ของคุณ'}:
            </h4>
            <ol style={{ margin: 0, paddingLeft: '1.2rem' }}>
              {helpInfo.instructions.map((instruction, index) => (
                <li key={index} style={{ 
                  marginBottom: '0.3rem', 
                  color: 'var(--text-secondary)',
                  fontSize: '14px'
                }}>
                  {instruction}
                </li>
              ))}
            </ol>
          </div>
          
          <div style={{ 
            background: 'rgba(16, 163, 127, 0.1)', 
            border: '1px solid var(--primary)',
            padding: '0.75rem', 
            borderRadius: '6px',
            fontSize: '14px',
            color: 'var(--text-secondary)'
          }}>
            💡 <strong>เคล็ดลับ:</strong> หลังจากเปิดใช้ popup แล้ว คลิก "ลองใหม่" ด้านล่าง
          </div>
        </div>
        
        <div className="modal-footer">
          <button 
            className="btn btn-secondary" 
            onClick={onClose}
            style={{ marginRight: '0.5rem' }}
          >
            ปิด
          </button>
          <button 
            className="btn btn-primary" 
            onClick={onRetry}
          >
            ลองใหม่
          </button>
        </div>
      </div>
    </div>
  );
};

export default PopupBlockerModal;