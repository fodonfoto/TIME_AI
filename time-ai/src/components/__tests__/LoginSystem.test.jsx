import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import LoginPage from '../LoginPage';
import OTPModalNew from '../OTPModalNew';
import { useAuth } from '../../hooks/useAuth';

// Mock dependencies
jest.mock('../../hooks/useAuth');
jest.mock('../../services/otpService', () => ({
  sendOTP: jest.fn(),
  verifyOTP: jest.fn()
}));
jest.mock('../../utils/suppressCOOP', () => ({}));

// Import mocked functions
import { sendOTP, verifyOTP } from '../../services/otpService';

const renderWithRouter = (component) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Login System Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
  });

  describe('Google Login Tests', () => {
    test('แสดง Google login button', () => {
      useAuth.mockReturnValue({
        user: null,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn()
      });

      renderWithRouter(<LoginPage />);
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    });

    test('เรียก signInWithGoogle เมื่อคลิก Google login button', async () => {
      const mockSignInWithGoogle = jest.fn();
      useAuth.mockReturnValue({
        user: null,
        signInWithGoogle: mockSignInWithGoogle,
        signOut: jest.fn()
      });

      renderWithRouter(<LoginPage />);
      fireEvent.click(screen.getByText('Continue with Google'));
      expect(mockSignInWithGoogle).toHaveBeenCalled();
    });

    test('แสดง loading state ขณะ login', async () => {
      const mockSignInWithGoogle = jest.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
      useAuth.mockReturnValue({
        user: null,
        signInWithGoogle: mockSignInWithGoogle,
        signOut: jest.fn()
      });

      renderWithRouter(<LoginPage />);
      fireEvent.click(screen.getByText('Continue with Google'));
      
      await waitFor(() => {
        expect(screen.getByText('Signing in...')).toBeInTheDocument();
      });
    });
  });

  describe('OTP Modal Tests', () => {
    const mockUser = {
      email: 'test@example.com',
      displayName: 'Test User'
    };

    test('แสดง OTP modal เมื่อเปิด', () => {
      render(
        <OTPModalNew
          isOpen={true}
          user={mockUser}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      expect(screen.getByText('Time AI')).toBeInTheDocument();
      expect(screen.getByText('Sending verification code...')).toBeInTheDocument();
    });

    test('ส่ง OTP ใน development mode', async () => {
      sendOTP.mockResolvedValue({ success: true, ref_code: 'DEV001' });

      render(
        <OTPModalNew
          isOpen={true}
          user={mockUser}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Enter the verification code sent to')).toBeInTheDocument();
        expect(screen.getByText('test@example.com')).toBeInTheDocument();
        expect(screen.getByText('Ref.Code: DEV001')).toBeInTheDocument();
      });
    });

    test('ยอมรับ OTP code "111111" ใน development mode', async () => {
      const mockOnSuccess = jest.fn();
      sendOTP.mockResolvedValue({ success: true, ref_code: 'DEV001' });

      render(
        <OTPModalNew
          isOpen={true}
          user={mockUser}
          onSuccess={mockOnSuccess}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Enter the verification code sent to')).toBeInTheDocument();
      });

      // กรอก OTP "111111"
      const otpInputs = screen.getAllByRole('textbox');
      '111111'.split('').forEach((digit, index) => {
        fireEvent.change(otpInputs[index], { target: { value: digit } });
      });

      await waitFor(() => {
        expect(screen.getByText('Verification Successful!')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      }, { timeout: 2000 });
    });

    test('ปฏิเสธ OTP code อื่นๆ ใน development mode', async () => {
      sendOTP.mockResolvedValue({ success: true, ref_code: 'DEV001' });

      render(
        <OTPModalNew
          isOpen={true}
          user={mockUser}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Enter the verification code sent to')).toBeInTheDocument();
      });

      // กรอก OTP "123456" (ผิด)
      const otpInputs = screen.getAllByRole('textbox');
      '123456'.split('').forEach((digit, index) => {
        fireEvent.change(otpInputs[index], { target: { value: digit } });
      });

      await waitFor(() => {
        expect(screen.getByText('Your 6-digit verification code is incorrect')).toBeInTheDocument();
      });

      // ตรวจสอบว่า OTP inputs ถูก clear
      otpInputs.forEach(input => {
        expect(input.value).toBe('');
      });
    });

    test('จัดการ OTP input navigation', async () => {
      sendOTP.mockResolvedValue({ success: true, ref_code: 'DEV001' });

      render(
        <OTPModalNew
          isOpen={true}
          user={mockUser}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Enter the verification code sent to')).toBeInTheDocument();
      });

      const otpInputs = screen.getAllByRole('textbox');
      
      // กรอกตัวเลขแรก
      fireEvent.change(otpInputs[0], { target: { value: '1' } });
      expect(otpInputs[0].value).toBe('1');

      // ทดสอบ backspace navigation
      fireEvent.keyDown(otpInputs[1], { key: 'Backspace' });
      expect(document.activeElement).toBe(otpInputs[0]);
    });

    test('จัดการ paste OTP code', async () => {
      const mockOnSuccess = jest.fn();
      sendOTP.mockResolvedValue({ success: true, ref_code: 'DEV001' });

      render(
        <OTPModalNew
          isOpen={true}
          user={mockUser}
          onSuccess={mockOnSuccess}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Enter the verification code sent to')).toBeInTheDocument();
      });

      const otpInputs = screen.getAllByRole('textbox');
      
      // Paste "111111"
      fireEvent.paste(otpInputs[0], {
        clipboardData: {
          getData: () => '111111'
        }
      });

      await waitFor(() => {
        expect(screen.getByText('Verification Successful!')).toBeInTheDocument();
      });
    });

    test('แสดง countdown timer สำหรับ resend', async () => {
      sendOTP.mockResolvedValue({ success: true, ref_code: 'DEV001' });

      render(
        <OTPModalNew
          isOpen={true}
          user={mockUser}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/Resend code \(4:5\d\)/)).toBeInTheDocument();
      });
    });

    test('เปิดใช้งาน resend button หลังจาก countdown หมด', async () => {
      sendOTP.mockResolvedValue({ success: true, ref_code: 'DEV001' });

      const { rerender } = render(
        <OTPModalNew
          isOpen={true}
          user={mockUser}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Enter the verification code sent to')).toBeInTheDocument();
      });

      // Mock countdown = 0
      jest.useFakeTimers();
      jest.advanceTimersByTime(300000); // 5 minutes

      rerender(
        <OTPModalNew
          isOpen={true}
          user={mockUser}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        const resendButton = screen.getByText('Resend code');
        expect(resendButton).not.toHaveClass('disabled');
      });

      jest.useRealTimers();
    });

    test('reset error state เมื่อเปิด modal', () => {
      const { rerender } = render(
        <OTPModalNew
          isOpen={false}
          user={mockUser}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      rerender(
        <OTPModalNew
          isOpen={true}
          user={mockUser}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      // ตรวจสอบว่าไม่มี error message แสดง
      expect(screen.queryByText('Your 6-digit verification code is incorrect')).not.toBeInTheDocument();
    });
  });

  describe('Production Mode OTP Tests', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    test('เรียก verifyOTP service ใน production mode', async () => {
      const mockUser = { email: 'test@example.com' };
      verifyOTP.mockResolvedValue({ success: true });
      sendOTP.mockResolvedValue({ success: true, ref_code: 'PROD123' });

      render(
        <OTPModalNew
          isOpen={true}
          user={mockUser}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Enter the verification code sent to')).toBeInTheDocument();
      });

      // กรอก OTP
      const otpInputs = screen.getAllByRole('textbox');
      '123456'.split('').forEach((digit, index) => {
        fireEvent.change(otpInputs[index], { target: { value: digit } });
      });

      await waitFor(() => {
        expect(verifyOTP).toHaveBeenCalledWith('test@example.com', '123456');
      });
    });

    test('จัดการ OTP verification error ใน production mode', async () => {
      const mockUser = { email: 'test@example.com' };
      verifyOTP.mockResolvedValue({ success: false, error: 'Invalid OTP' });
      sendOTP.mockResolvedValue({ success: true, ref_code: 'PROD123' });

      render(
        <OTPModalNew
          isOpen={true}
          user={mockUser}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Enter the verification code sent to')).toBeInTheDocument();
      });

      // กรอก OTP ผิด
      const otpInputs = screen.getAllByRole('textbox');
      '123456'.split('').forEach((digit, index) => {
        fireEvent.change(otpInputs[index], { target: { value: digit } });
      });

      await waitFor(() => {
        expect(screen.getByText('Invalid OTP')).toBeInTheDocument();
      });
    });
  });

  describe('Error Handling Tests', () => {
    test('จัดการ network error ใน OTP sending', async () => {
      const mockUser = { email: 'test@example.com' };
      sendOTP.mockRejectedValue(new Error('Network error'));

      render(
        <OTPModalNew
          isOpen={true}
          user={mockUser}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Error Occurred')).toBeInTheDocument();
        expect(screen.getByText('Failed to send OTP. Please try again.')).toBeInTheDocument();
      });
    });

    test('จัดการกรณีไม่มี email', async () => {
      const mockUser = { email: null };
      
      render(
        <OTPModalNew
          isOpen={true}
          user={mockUser}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Error Occurred')).toBeInTheDocument();
      });
    });

    test('แสดง Try Again button ใน error state', async () => {
      const mockUser = { email: 'test@example.com' };
      sendOTP.mockRejectedValue(new Error('Network error'));

      render(
        <OTPModalNew
          isOpen={true}
          user={mockUser}
          onSuccess={jest.fn()}
          onCancel={jest.fn()}
        />
      );

      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });

      // ทดสอบ Try Again functionality
      sendOTP.mockResolvedValue({ success: true, ref_code: 'RETRY001' });
      fireEvent.click(screen.getByText('Try Again'));

      await waitFor(() => {
        expect(screen.getByText('Sending verification code...')).toBeInTheDocument();
      });
    });
  });

  describe('Integration Tests', () => {
    test('complete login flow: Google login → OTP verification → success', async () => {
      const mockSignInWithGoogle = jest.fn();
      const mockOnSuccess = jest.fn();
      
      // Mock successful Google login
      useAuth.mockReturnValue({
        user: { email: 'test@example.com', displayName: 'Test User' },
        signInWithGoogle: mockSignInWithGoogle,
        signOut: jest.fn()
      });

      sendOTP.mockResolvedValue({ success: true, ref_code: 'INT001' });

      const { rerender } = renderWithRouter(<LoginPage />);

      // Simulate OTP modal opening after Google login
      rerender(
        <BrowserRouter>
          <OTPModalNew
            isOpen={true}
            user={{ email: 'test@example.com' }}
            onSuccess={mockOnSuccess}
            onCancel={jest.fn()}
          />
        </BrowserRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Enter the verification code sent to')).toBeInTheDocument();
      });

      // Complete OTP verification
      const otpInputs = screen.getAllByRole('textbox');
      '111111'.split('').forEach((digit, index) => {
        fireEvent.change(otpInputs[index], { target: { value: digit } });
      });

      await waitFor(() => {
        expect(screen.getByText('Verification Successful!')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(mockOnSuccess).toHaveBeenCalled();
      }, { timeout: 2000 });
    });
  });
});