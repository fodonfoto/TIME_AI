import { renderHook, act } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';

// Mock Firebase
jest.mock('firebase/auth', () => ({
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  GoogleAuthProvider: jest.fn(() => ({
    setCustomParameters: jest.fn()
  })),
  onAuthStateChanged: jest.fn()
}));

jest.mock('../../config/firebase', () => ({
  auth: {}
}));

describe('useAuth Hook Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('initial state', () => {
    const { result } = renderHook(() => useAuth());
    
    expect(result.current.user).toBeNull();
    expect(result.current.loading).toBe(true);
    expect(typeof result.current.signInWithGoogle).toBe('function');
    expect(typeof result.current.signOut).toBe('function');
  });

  test('signInWithGoogle success', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User'
    };

    signInWithPopup.mockResolvedValue({
      user: mockUser
    });

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(signInWithPopup).toHaveBeenCalled();
  });

  test('signInWithGoogle error handling', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    signInWithPopup.mockRejectedValue(new Error('Auth error'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signInWithGoogle();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error signing in with Google:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });

  test('signOut functionality', async () => {
    firebaseSignOut.mockResolvedValue();

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(firebaseSignOut).toHaveBeenCalled();
  });

  test('signOut error handling', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    firebaseSignOut.mockRejectedValue(new Error('Sign out error'));

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(consoleSpy).toHaveBeenCalledWith('Error signing out:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });
});