import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { useAuth } from '../hooks/useAuth';
import { sendOTP, verifyOTP } from '../services/otpService';
import firebaseService from '../services/firebaseService';

// Mock all dependencies
jest.mock('../hooks/useAuth');
jest.mock('../services/otpService');
jest.mock('../services/firebaseService');
jest.mock('../utils/suppressCOOP', () => ({}));

const renderApp = () => {
  return render(
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
};

describe('Login Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'development';
  });

  describe('Complete Login Flow', () => {
    test('ผู้ใช้ใหม่: Google login → OTP verification → Dashboard', async () => {
      // Step 1: Initial state - no user
      useAuth.mockReturnValue({
        user: null,
        loading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn()
      });

      renderApp();
      expect(screen.getByText('Continue with Google')).toBeInTheDocument();

      // Step 2: Mock successful Google login
      const mockUser = {
        uid: 'new-user-123',
        email: 'newuser@example.com',
        displayName: 'New User'
      };

      const mockSignInWithGoogle = jest.fn().mockResolvedValue();
      useAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signInWithGoogle: mockSignInWithGoogle,
        signOut: jest.fn()
      });

      // Mock user doesn't exist in system
      firebaseService.getUserProfile.mockResolvedValue(null);
      sendOTP.mockResolvedValue({ success: true, ref_code: 'NEW001' });

      // Simulate Google login click
      fireEvent.click(screen.getByText('Continue with Google'));

      // Step 3: OTP Modal should appear
      await waitFor(() => {
        expect(screen.getByText('Time AI')).toBeInTheDocument();
        expect(screen.getByText('Enter the verification code sent to')).toBeInTheDocument();
        expect(screen.getByText('newuser@example.com')).toBeInTheDocument();
      });

      // Step 4: Complete OTP verification
      const otpInputs = screen.getAllByRole('textbox');
      '111111'.split('').forEach((digit, index) => {
        fireEvent.change(otpInputs[index], { target: { value: digit } });
      });

      await waitFor(() => {
        expect(screen.getByText('Verification Successful!')).toBeInTheDocument();
      });

      // Step 5: Mock successful user creation and redirect to dashboard
      firebaseService.createUserProfile.mockResolvedValue();
      firebaseService.getUserCurrentPlan.mockResolvedValue('free');

      await waitFor(() => {
        // Should redirect to dashboard or main app
        expect(screen.queryByText('Continue with Google')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });

    test('ผู้ใช้เดิม: Google login → OTP verification → Dashboard', async () => {
      // Step 1: Mock existing user login
      const mockUser = {
        uid: 'existing-user-123',
        email: 'existing@example.com',
        displayName: 'Existing User'
      };

      useAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn()
      });

      // Mock user exists in system
      firebaseService.getUserProfile.mockResolvedValue({
        displayName: 'Existing User',
        email: 'existing@example.com',
        createdAt: new Date()
      });
      
      sendOTP.mockResolvedValue({ success: true, ref_code: 'EXT001' });

      renderApp();

      // Step 2: OTP Modal should appear for existing user
      await waitFor(() => {
        expect(screen.getByText('Enter the verification code sent to')).toBeInTheDocument();
        expect(screen.getByText('existing@example.com')).toBeInTheDocument();
      });

      // Step 3: Complete OTP verification
      const otpInputs = screen.getAllByRole('textbox');
      '111111'.split('').forEach((digit, index) => {
        fireEvent.change(otpInputs[index], { target: { value: digit } });
      });

      await waitFor(() => {
        expect(screen.getByText('Verification Successful!')).toBeInTheDocument();
      });

      // Step 4: Should proceed to dashboard
      firebaseService.getUserCurrentPlan.mockResolvedValue('pro');

      await waitFor(() => {
        expect(screen.queryByText('Enter the verification code sent to')).not.toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Error Scenarios', () => {
    test('Google login failure', async () => {
      const mockSignInWithGoogle = jest.fn().mockRejectedValue(new Error('Google login failed'));
      
      useAuth.mockReturnValue({
        user: null,
        loading: false,
        signInWithGoogle: mockSignInWithGoogle,
        signOut: jest.fn()
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      renderApp();
      fireEvent.click(screen.getByText('Continue with Google'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalled();
      });

      consoleSpy.mockRestore();
    });

    test('OTP sending failure', async () => {
      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      useAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn()
      });

      firebaseService.getUserProfile.mockResolvedValue({
        displayName: 'Test User',
        email: 'test@example.com'
      });

      sendOTP.mockRejectedValue(new Error('OTP sending failed'));

      renderApp();

      await waitFor(() => {
        expect(screen.getByText('Error Occurred')).toBeInTheDocument();
        expect(screen.getByText('Failed to send OTP. Please try again.')).toBeInTheDocument();
      });
    });

    test('OTP verification failure', async () => {
      const mockUser = {
        uid: 'test-user-123',
        email: 'test@example.com',
        displayName: 'Test User'
      };

      useAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn()
      });

      firebaseService.getUserProfile.mockResolvedValue({
        displayName: 'Test User',
        email: 'test@example.com'
      });

      sendOTP.mockResolvedValue({ success: true, ref_code: 'FAIL001' });

      renderApp();

      await waitFor(() => {
        expect(screen.getByText('Enter the verification code sent to')).toBeInTheDocument();
      });

      // Enter wrong OTP in development mode
      const otpInputs = screen.getAllByRole('textbox');
      '123456'.split('').forEach((digit, index) => {
        fireEvent.change(otpInputs[index], { target: { value: digit } });
      });

      await waitFor(() => {
        expect(screen.getByText('Your 6-digit verification code is incorrect')).toBeInTheDocument();
      });
    });
  });

  describe('Production Mode Tests', () => {
    beforeEach(() => {
      process.env.NODE_ENV = 'production';
    });

    test('production OTP verification flow', async () => {
      const mockUser = {
        uid: 'prod-user-123',
        email: 'prod@example.com',
        displayName: 'Prod User'
      };

      useAuth.mockReturnValue({
        user: mockUser,
        loading: false,
        signInWithGoogle: jest.fn(),
        signOut: jest.fn()
      });

      firebaseService.getUserProfile.mockResolvedValue({
        displayName: 'Prod User',
        email: 'prod@example.com'
      });

      sendOTP.mockResolvedValue({ success: true, ref_code: 'PROD001' });
      verifyOTP.mockResolvedValue({ success: true });

      renderApp();

      await waitFor(() => {
        expect(screen.getByText('Enter the verification code sent to')).toBeInTheDocument();
      });

      // Enter OTP
      const otpInputs = screen.getAllByRole('textbox');
      '123456'.split('').forEach((digit, index) => {
        fireEvent.change(otpInputs[index], { target: { value: digit } });
      });

      await waitFor(() => {
        expect(verifyOTP).toHaveBeenCalledWith('prod@example.com', '123456');
      });

      await waitFor(() => {
        expect(screen.getByText('Verification Successful!')).toBeInTheDocument();
      });
    });
  });
});