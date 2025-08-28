import { useState, useEffect } from 'react';
import toolsService from '../services/toolsService';

const ToolModal = ({ isOpen, onClose, title, children, onSave }) => {
  if (!isOpen) return null;
  
  return (
    <div className="agent-modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="history-title">{title} Setup</div>
        <div className="agent-modal-body">
          {children}
        </div>
        <div className="modal-actions">
          <button 
            type="button"
            onClick={onClose} 
            className="btn-cancel"
          >
            {"Cancel"}
          </button>
          <button 
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSave();
            }} 
            className="btn-confirm"
          >
            {"Save"}
          </button>
        </div>
      </div>
    </div>
  );
};

function AgentPage() {
  const [formData, setFormData] = useState({
    systemPrompt: '',
    instructions: '',
    userPromptContext: ''
  });
  
  const [connections, setConnections] = useState({
    googleDrive: false,
    googleSheets: false,
    github: false,
    gitlab: false,
    jira: false,
    figma: false,
    puterCloud: false
  });
  const [activeModal, setActiveModal] = useState(null);
  const [apiKeys, setApiKeys] = useState({
    googleDrive: '',
    googleSheets: '',
    github: '',
    gitlab: '',
    jira: '',
    figma: '',
    puterCloud: ''
  });

  const handleConnect = (tool) => {
    setActiveModal(tool);
  };
  
  const handleDisconnect = (tool) => {
    setConnections(prev => ({ ...prev, [tool]: false }));
  };

  const handleSaveSetup = async (tool) => {
    const apiKey = apiKeys[tool];
    if (!apiKey) return;
    
    // Validate API key
    const isValid = await toolsService.validateApiKey(tool, apiKey);
    if (isValid) {
      toolsService.saveApiKeys({ [tool]: apiKey });
      setConnections(prev => ({ ...prev, [tool]: true }));
      setActiveModal(null);
    } else {
      alert('Invalid API key. Please check and try again.');
    }
  };

  const handleApiKeyChange = (tool, value) => {
    setApiKeys(prev => ({
      ...prev,
      [tool]: value
    }));
  };

  const renderModalContent = (tool) => {
    switch(tool) {
      case 'googleDrive':
        return (
          <div>
            <p>Connect your Google Drive account to access files and folders.</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.href = '/auth/google-drive'}
            >
              Sign in with Google
            </button>
          </div>
        );
      case 'googleSheets':
        return (
          <div>
            <div className="form-group">
              <label>Google Sheets API Key</label>
              <input
                type="password"
                className="form-control"
                value={apiKeys.googleSheets}
                onChange={(e) => handleApiKeyChange('googleSheets', e.target.value)}
                placeholder="Enter your Google Sheets API key"
              />
            </div>
          </div>
        );
      case 'github':
        return (
          <div>
            <p>Connect your GitHub account to access repositories.</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.href = '/auth/github'}
            >
              Sign in with GitHub
            </button>
          </div>
        );
      case 'gitlab':
        return (
          <div>
            <div className="form-group">
              <label>GitLab Access Token</label>
              <input
                type="password"
                className="form-control"
                value={apiKeys.gitlab}
                onChange={(e) => handleApiKeyChange('gitlab', e.target.value)}
                placeholder="Enter your GitLab access token"
              />
              <small className="form-text text-muted">
                Create an access token with <code>read_api</code> scope
              </small>
            </div>
          </div>
        );
      case 'jira':
        return (
          <div>
            <div className="form-group">
              <label>Jira Domain</label>
              <input
                type="text"
                className="form-control mb-2"
                placeholder="your-domain.atlassian.net"
              />
              <label>Email</label>
              <input
                type="email"
                className="form-control mb-2"
                placeholder="your-email@example.com"
              />
              <label>API Token</label>
              <input
                type="password"
                className="form-control"
                placeholder="Enter your Jira API token"
              />
            </div>
          </div>
        );
      case 'figma':
        return (
          <div>
            <div className="form-group">
              <label>Figma Personal Access Token</label>
              <input
                type="password"
                className="form-control"
                value={apiKeys.figma}
                onChange={(e) => handleApiKeyChange('figma', e.target.value)}
                placeholder="Enter your Figma personal access token"
              />
              <small className="form-text text-muted">
                Create a personal access token in your Figma account settings
              </small>
            </div>
          </div>
        );
      case 'puterCloud':
        return (
          <div>
            <div className="puter-info-section">
              <h3 style={{ color: 'var(--accent)', marginBottom: '1rem' }}>🚀 Puter Cloud Services</h3>
              <div className="puter-features">
                <div className="puter-feature-item">
                  <span className="puter-feature-icon">🤖</span>
                  <div>
                    <strong>Free AI Models</strong>
                    <p>GPT-4o Mini, Claude Sonnet 4, OpenRouter (200+ models)</p>
                  </div>
                </div>
                <div className="puter-feature-item">
                  <span className="puter-feature-icon">☁️</span>
                  <div>
                    <strong>Cloud Storage</strong>
                    <p>Unlimited file storage and management</p>
                  </div>
                </div>
                <div className="puter-feature-item">
                  <span className="puter-feature-icon">🗄️</span>
                  <div>
                    <strong>Key-Value Store</strong>
                    <p>Persistent data storage for user preferences</p>
                  </div>
                </div>
                <div className="puter-feature-item">
                  <span className="puter-feature-icon">🌐</span>
                  <div>
                    <strong>Static Hosting</strong>
                    <p>Deploy websites instantly with SSL</p>
                  </div>
                </div>
              </div>
              <div className="puter-setup-info">
                <p><strong>Setup:</strong> No API keys required! Just include the Puter.js script:</p>
                <code style={{ 
                  background: 'var(--bg-secondary)', 
                  padding: '0.5rem', 
                  borderRadius: '4px', 
                  display: 'block', 
                  marginTop: '0.5rem',
                  fontSize: '0.9rem'
                }}>
                  &lt;script src="https://js.puter.com/v2/"&gt;&lt;/script&gt;
                </code>
                <p style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}>
                  ✅ Zero cost for developers - users pay for their own usage<br/>
                  ✅ No backend setup required<br/>
                  ✅ Privacy-first - no tracking or data collection
                </p>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Saving data:', formData);
    // TODO: Send data to API
  };

  return (
    <div className="agent-page">
      {/* Header */}
      <div className="agent-header">
        <h1 className="agent-title">
          AI Agent
        </h1>
        <p className="agent-subtitle">
          Configure your AI Agent
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="agent-form">
        {/* System Prompt Card */}
        <div className="agent-card">
          <div className="agent-card-header">
            <div>
              <h2 className="agent-card-title">
                System Prompt
              </h2>
              <p className="agent-card-description">
                Define the role and behavior of your Agent
              </p>
            </div>
          </div>

          <div className="agent-textarea-container">
            <textarea
              name="systemPrompt"
              value={formData.systemPrompt}
              onChange={handleChange}
              className="agent-textarea"
              placeholder="Example: You are an AI assistant specialized in coding..."
              required
            />
            <div className="agent-char-counter">
              {formData.systemPrompt.length}/2000
            </div>
          </div>
        </div>

        {/* Instructions Card */}
        <div className="agent-card">
          <div className="agent-card-header">
            <div>
              <h2 className="agent-card-title">
                Instructions
              </h2>
              <p className="agent-card-description">
                Specify the working steps or instructions for the Agent
              </p>
            </div>
          </div>

          <div className="agent-textarea-container">
            <textarea
              name="instructions"
              value={formData.instructions}
              onChange={handleChange}
              className="agent-textarea"
              placeholder="Example: 1. Analyze the question 2. Find relevant information 3. Summarize the answer..."
            />
            <div className="agent-char-counter">
              {formData.instructions.length}/2000
            </div>
          </div>
        </div>

        {/* User Prompt Context Card */}
        <div className="agent-card">
          <div className="agent-card-header">
            <div>
              <h2 className="agent-card-title">
                User Prompt Context
              </h2>
              <p className="agent-card-description">
                Additional context to help the Agent provide better answers
              </p>
            </div>
          </div>

          <div className="agent-textarea-container">
            <textarea
              name="userPromptContext"
              value={formData.userPromptContext}
              onChange={handleChange}
              className="agent-textarea"
              placeholder="Example: The user is a software developer interested in the latest technologies..."
            />
            <div className="agent-char-counter">
              {formData.userPromptContext.length}/1000
            </div>
          </div>
        </div>

        {/* Google Drive Integration Card */}
        <div className="agent-card">
          <div className="agent-card-header">
            <h2 className="agent-card-title" style={{ margin: 0 }}>Connect Tool</h2>
          </div>
          
          <div className="drive-connect-container">
            <div className="drive-logo-container">
              <img 
                src="/src/assets/google-drive-logo-svgrepo-com.svg" 
                alt="Google Drive" 
                width="48" 
                height="48"
                className="agent-tool-icon"
              />
              <div className="agent-tool-info">
                <span>Google Drive</span>
                <div className={`connection-status ${connections.googleDrive ? 'connected' : 'disconnected'}`}>
                  {connections.googleDrive ? 'Connected' : 'Not Connected'}
                </div>
              </div>
            </div>
            {connections.googleDrive ? (
              <button 
                type="button" 
                className="btn btn-outline-danger"
                onClick={() => handleDisconnect('googleDrive')}
              >
                Disconnect
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => handleConnect('googleDrive')}
              >
                Connect
              </button>
            )}
          </div>

          <div className="drive-connect-container agent-tool-item">
            <div className="drive-logo-container">
              <img 
                src="/src/assets/sheets-sheet-svgrepo-com.svg" 
                alt="Google Sheets" 
                width="48" 
                height="48"
                className="agent-tool-icon"
              />
              <div className="agent-tool-info">
                <span>Google Sheets</span>
                <div className={`connection-status ${connections.googleSheets ? 'connected' : 'disconnected'}`}>
                  {connections.googleSheets ? 'Connected' : 'Not Connected'}
                </div>
              </div>
            </div>
            {connections.googleSheets ? (
              <button 
                type="button" 
                className="btn btn-outline-danger"
                onClick={() => handleDisconnect('googleSheets')}
              >
                Disconnect
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => handleConnect('googleSheets')}
              >
                Connect
              </button>
            )}
          </div>

          <div className="drive-connect-container agent-tool-item">
            <div className="drive-logo-container">
              <img 
                src="/src/assets/github-142-svgrepo-com.svg" 
                alt="GitHub" 
                width="48" 
                height="48"
                className="agent-tool-icon"
              />
              <div className="agent-tool-info">
                <span>GitHub</span>
                <div className={`connection-status ${connections.github ? 'connected' : 'disconnected'}`}>
                  {connections.github ? 'Connected' : 'Not Connected'}
                </div>
              </div>
            </div>
            {connections.github ? (
              <button 
                type="button" 
                className="btn btn-outline-danger"
                onClick={() => handleDisconnect('github')}
              >
                Disconnect
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => handleConnect('github')}
              >
                Connect
              </button>
            )}
          </div>

          <div className="drive-connect-container agent-tool-item">
            <div className="drive-logo-container">
              <img 
                src="/src/assets/gitlab-svgrepo-com.svg" 
                alt="GitLab" 
                width="48" 
                height="48"
                className="agent-tool-icon"
              />
              <div className="agent-tool-info">
                <span>GitLab</span>
                <div className={`connection-status ${connections.gitlab ? 'connected' : 'disconnected'}`}>
                  {connections.gitlab ? 'Connected' : 'Not Connected'}
                </div>
              </div>
            </div>
            {connections.gitlab ? (
              <button 
                type="button" 
                className="btn btn-outline-danger"
                onClick={() => handleDisconnect('gitlab')}
              >
                Disconnect
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => handleConnect('gitlab')}
              >
                Connect
              </button>
            )}
          </div>

          <div className="drive-connect-container agent-tool-item">
            <div className="drive-logo-container">
              <img 
                src="/src/assets/jira-svgrepo-com.svg" 
                alt="Jira" 
                width="48" 
                height="48"
                className="agent-tool-icon"
              />
              <div className="agent-tool-info">
                <span>Jira</span>
                <div className={`connection-status ${connections.jira ? 'connected' : 'disconnected'}`}>
                  {connections.jira ? 'Connected' : 'Not Connected'}
                </div>
              </div>
            </div>
            {connections.jira ? (
              <button 
                type="button" 
                className="btn btn-outline-danger"
                onClick={() => handleDisconnect('jira')}
              >
                Disconnect
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => handleConnect('jira')}
              >
                Connect
              </button>
            )}
          </div>

          <div className="drive-connect-container agent-tool-item">
            <div className="drive-logo-container">
              <img 
                src="/src/assets/figma-svgrepo-com.svg" 
                alt="Figma" 
                width="48" 
                height="48"
                className="agent-tool-icon"
              />
              <div className="agent-tool-info">
                <span>Figma</span>
                <div className={`connection-status ${connections.figma ? 'connected' : 'disconnected'}`}>
                  {connections.figma ? 'Connected' : 'Not Connected'}
                </div>
              </div>
            </div>
            {connections.figma ? (
              <button 
                type="button" 
                className="btn btn-outline-danger"
                onClick={() => handleDisconnect('figma')}
              >
                Disconnect
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-primary"
                onClick={() => handleConnect('figma')}
              >
                Connect
              </button>
            )}
          </div>

          <div className="drive-connect-container agent-tool-item" style={{ border: '2px solid var(--accent)', background: 'linear-gradient(135deg, rgba(6, 61, 48, 0.1), rgba(6, 61, 48, 0.05))' }}>
            <div className="drive-logo-container">
              <div style={{
                width: '48px',
                height: '48px',
                background: 'var(--brand-gradient)',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px'
              }}>
                ☁️
              </div>
              <div className="agent-tool-info">
                <span style={{ fontWeight: '600', color: 'var(--accent)' }}>Puter Cloud</span>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Free AI • Cloud Storage • Hosting
                </div>
                <div className={`connection-status ${connections.puterCloud ? 'connected' : 'disconnected'}`}>
                  {connections.puterCloud ? 'Connected' : 'Not Connected'}
                </div>
              </div>
            </div>
            {connections.puterCloud ? (
              <button 
                type="button" 
                className="btn btn-outline-danger"
                onClick={() => handleDisconnect('puterCloud')}
              >
                Disconnect
              </button>
            ) : (
              <button 
                type="button" 
                className="btn btn-primary"
                style={{ background: 'var(--brand-gradient)', border: 'none' }}
                onClick={() => handleConnect('puterCloud')}
              >
                Connect
              </button>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="agent-submit-container">
          <button type="submit" className="agent-submit-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="agent-submit-icon">
              <path d="M19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H16L21 8V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M17 21V13H7V21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M7 3V8H15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            {"Save Settings"}
          </button>
        </div>
      </form>
      
      {/* Tool Modals */}
      {activeModal && (
        <ToolModal
          isOpen={true}
          onClose={() => setActiveModal(null)}
          title={activeModal.charAt(0).toUpperCase() + activeModal.slice(1).replace(/([A-Z])/g, ' $1')}
          onSave={() => handleSaveSetup(activeModal)}
        >
          {renderModalContent(activeModal)}
        </ToolModal>
      )}
      

    </div>
  );
};

export default AgentPage;