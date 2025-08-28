import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import AuthGuard from '../components/AuthGuard';

// Mock dependencies
jest.mock('react-firebase-hooks/auth');
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  removeItem: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
});

describe('AuthGuard Security Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const TestComponent = () => <div>Protected Content</div>;

  const renderAuthGuard = () => {
    return render(
      <BrowserRouter>
        <AuthGuard>
          <TestComponent />
        </AuthGuard>
      </BrowserRouter>
    );
  };

  test('🔒 ป้องกัน user ที่ไม่ login', async () => {
    useAuthState.mockReturnValue([null, false]);
    renderAuthGuard();
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('🔒 ป้องกัน user ที่ไม่มี OTP token', async () => {
    const mockUser = { uid: 'test-uid' };
    useAuthState.mockReturnValue([mockUser, false]);
    mockSessionStorage.getItem.mockReturnValue(null);
    renderAuthGuard();
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('🔒 ป้องกัน token ที่หมดอายุ', async () => {
    const mockUser = { uid: 'test-uid' };
    useAuthState.mockReturnValue([mockUser, false]);
    const oldTimestamp = Date.now() - (31 * 60 * 1000);
    const expiredToken = btoa(`test-uid:${oldTimestamp}:random123`);
    mockSessionStorage.getItem.mockReturnValue(expiredToken);
    renderAuthGuard();
    await waitFor(() => {
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('secure_otp_test-uid');
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  test('✅ อนุญาต user ที่มี token ถูกต้อง', async () => {
    const mockUser = { uid: 'test-uid' };
    useAuthState.mockReturnValue([mockUser, false]);
    const validTimestamp = Date.now() - (10 * 60 * 1000);
    const validToken = btoa(`test-uid:${validTimestamp}:random123`);
    mockSessionStorage.getItem.mockReturnValue(validToken);
    renderAuthGuard();
    await waitFor(() => {
      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });
  });
});