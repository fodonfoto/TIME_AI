import { useState, useEffect } from 'react';

function ChatDebug() {
  const [debugInfo, setDebugInfo] = useState({});
  const [testResult, setTestResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkEnvironment = () => {
      const info = {
        puterLoaded: typeof window.puter !== 'undefined',
        puterAiAvailable: typeof window.puter?.ai?.chat === 'function',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      };
      setDebugInfo(info);
    };
    
    checkEnvironment();
  }, []);

  const testPuterChat = async () => {
    setIsLoading(true);
    setTestResult(null);
    
    try {
      if (!window.puter) {
        throw new Error('Puter.js not loaded');
      }
      
      if (!window.puter.ai) {
        throw new Error('Puter.ai not available');
      }
      
      const testMessages = [
        { role: 'user', content: 'Hello, this is a test message' }
      ];
      
      const response = await window.puter.ai.chat(testMessages, {
        model: 'gpt-5-mini',
        max_tokens: 50
      });
      
      setTestResult({
        success: true,
        response: response,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      setTestResult({
        success: false,
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString()
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace', 
      backgroundColor: '#f5f5f5',
      border: '1px solid #ddd',
      borderRadius: '8px',
      margin: '20px'
    }}>
      <h3>🔧 Chat Debug Panel</h3>
      
      <div style={{ marginBottom: '20px' }}>
        <h4>Environment Check:</h4>
        <ul>
          <li>Puter.js Loaded: {debugInfo.puterLoaded ? '✅' : '❌'}</li>
          <li>Puter.ai Available: {debugInfo.puterAiAvailable ? '✅' : '❌'}</li>
          <li>User Agent: {debugInfo.userAgent}</li>
          <li>Timestamp: {debugInfo.timestamp}</li>
        </ul>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <button 
          onClick={testPuterChat}
          disabled={isLoading}
          style={{
            padding: '10px 20px',
            backgroundColor: isLoading ? '#ccc' : '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: isLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {isLoading ? 'Testing...' : '{"Test Puter Chat"}'}
        </button>
      </div>

      {testResult && (
        <div style={{ 
          padding: '15px', 
          backgroundColor: testResult.success ? '#d4edda' : '#f8d7da',
          border: `1px solid ${testResult.success ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '4px'
        }}>
          <h4>Test Result:</h4>
          {testResult.success ? (
            <div>
              <p>✅ Success!</p>
              <p><strong>Response:</strong> {testResult.response}</p>
              <p><strong>Time:</strong> {testResult.timestamp}</p>
            </div>
          ) : (
            <div>
              <p>❌ Failed!</p>
              <p><strong>Error:</strong> {testResult.error}</p>
              <p><strong>Time:</strong> {testResult.timestamp}</p>
              {testResult.stack && (
                <details>
                  <summary>Stack Trace</summary>
                  <pre style={{ fontSize: '12px', overflow: 'auto' }}>
                    {testResult.stack}
                  </pre>
                </details>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default ChatDebug;