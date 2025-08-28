import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', {
      message: encodeURIComponent(error?.message || 'Unknown error'),
      stack: encodeURIComponent(error?.stack || 'No stack trace'),
      componentStack: encodeURIComponent(errorInfo?.componentStack || 'No component stack')
    });
    this.setState({
      error: {
        message: error?.message || 'Unknown error',
        name: error?.name || 'Error'
      },
      errorInfo: {
        componentStack: errorInfo?.componentStack || 'No component stack'
      }
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" style={{
          padding: '20px',
          margin: '20px',
          border: '1px solid #ff6b6b',
          borderRadius: '8px',
          backgroundColor: '#ffe0e0',
          color: '#d63031'
        }}>
          <h2>เกิดข้อผิดพลาด</h2>
          <p>ขออภัย เกิดข้อผิดพลาดในการแสดงผล</p>
          <button 
            onClick={() => window.location.reload()}
            style={{
              padding: '8px 16px',
              backgroundColor: '#d63031',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginTop: '10px'
            }}
          >
            รีเฟรชหน้า
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;