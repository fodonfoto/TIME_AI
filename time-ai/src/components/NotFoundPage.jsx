import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';

const NotFoundPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Auto redirect after 5 seconds
    const timer = setTimeout(() => {
      navigate('/chatai');
    }, 5000);

    return () => clearTimeout(timer);
  }, [navigate]);



  return (
    <div className="not-found-page">
      <div className="not-found-container">
        <div className="not-found-content">
          {/* Logo */}
          <div className="not-found-logo">
            <div className="logo-circle">
              <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
                <path d="M16 2L20 12H30L22 18L26 28L16 22L6 28L10 18L2 12H12L16 2Z" fill="currentColor"/>
              </svg>
            </div>
          </div>

          {/* 404 Display */}
          <div className="error-code">404</div>
          
          {/* Error Message */}
          <h1 className="error-title">Page Not Found</h1>
          <p className="error-description">
            Sorry, the page you are trying to access does not exist or has been moved.<br/>
            Please check the URL or return to the main page.
          </p>
        </div>

        {/* Background Animation */}
        <div className="not-found-bg">
          <div className="floating-shapes">
            <div className="shape shape-1"></div>
            <div className="shape shape-2"></div>
            <div className="shape shape-3"></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;