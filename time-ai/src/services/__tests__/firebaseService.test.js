import firebaseService from '../firebaseService';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp')
}));

jest.mock('../../config/firebase', () => ({
  db: {}
}));

describe('Firebase Service Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('User Management', () => {
    test('getUserProfile success', async () => {
      const mockUserData = {
        displayName: 'Test User',
        email: 'test@example.com',
        createdAt: 'mock-timestamp'
      };

      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUserData
      });

      const result = await firebaseService.getUserProfile('test-uid');
      expect(result).toEqual(mockUserData);
    });

    test('getUserProfile user not found', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => false
      });

      const result = await firebaseService.getUserProfile('non-existent-uid');
      expect(result).toBeNull();
    });

    test('createUserProfile success', async () => {
      const { setDoc } = require('firebase/firestore');
      setDoc.mockResolvedValue();

      const userData = {
        displayName: 'New User',
        email: 'new@example.com'
      };

      await firebaseService.createUserProfile('new-uid', userData);
      expect(setDoc).toHaveBeenCalled();
    });

    test('updateUserProfile success', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockResolvedValue();

      const updates = {
        displayName: 'Updated User'
      };

      await firebaseService.updateUserProfile('test-uid', updates);
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('Plan Management', () => {
    test('getUserCurrentPlan success', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({ currentPlan: 'pro' })
      });

      const result = await firebaseService.getUserCurrentPlan('test-uid');
      expect(result).toBe('pro');
    });

    test('getUserCurrentPlan default to free', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => ({})
      });

      const result = await firebaseService.getUserCurrentPlan('test-uid');
      expect(result).toBe('free');
    });

    test('getPlanConfigs success', async () => {
      const mockPlanConfigs = {
        free: { name: 'Free Plan', price: 0 },
        pro: { name: 'Pro Plan', price: 19 }
      };

      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockPlanConfigs
      });

      const result = await firebaseService.getPlanConfigs();
      expect(result).toEqual(mockPlanConfigs);
    });

    test('updateUserPlan success', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockResolvedValue();

      await firebaseService.updateUserPlan('test-uid', 'enterprise');
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('Usage Tracking', () => {
    test('getUserUsage success', async () => {
      const mockUsageData = {
        dailyUsage: 5,
        monthlyUsage: 150,
        lastUsed: 'mock-timestamp'
      };

      const { getDoc } = require('firebase/firestore');
      getDoc.mockResolvedValue({
        exists: () => true,
        data: () => mockUsageData
      });

      const result = await firebaseService.getUserUsage('test-uid');
      expect(result).toEqual(mockUsageData);
    });

    test('incrementUserUsage success', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockResolvedValue();

      await firebaseService.incrementUserUsage('test-uid');
      expect(updateDoc).toHaveBeenCalled();
    });

    test('resetDailyUsage success', async () => {
      const { updateDoc } = require('firebase/firestore');
      updateDoc.mockResolvedValue();

      await firebaseService.resetDailyUsage('test-uid');
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    test('handles Firebase errors gracefully', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockRejectedValue(new Error('Firebase error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      const result = await firebaseService.getUserProfile('test-uid');
      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    test('handles network errors', async () => {
      const { getDoc } = require('firebase/firestore');
      getDoc.mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await expect(firebaseService.getUserProfile('test-uid')).resolves.toBeNull();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });
  });

  describe('Data Validation', () => {
    test('validates user data before creating profile', async () => {
      const invalidUserData = {
        email: 'invalid-email'
      };

      await expect(
        firebaseService.createUserProfile('test-uid', invalidUserData)
      ).rejects.toThrow();
    });

    test('validates plan name before updating', async () => {
      await expect(
        firebaseService.updateUserPlan('test-uid', 'invalid-plan')
      ).rejects.toThrow();
    });
  });
});