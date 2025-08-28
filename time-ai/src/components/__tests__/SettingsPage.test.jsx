import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import SettingsPage from '../SettingsPage';
import { useAuth } from '../../hooks/useAuth';
import firebaseService from '../../services/firebaseService';

// Mock dependencies
jest.mock('../../hooks/useAuth');
jest.mock('../../services/firebaseService');
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn()
}));

const mockPlanConfigs = {
  free: {
    id: 'free',
    name: 'Free Plan',
    price: 0,
    period: 'month',
    dailyLimit: 10,
    active: true
  },
  pro: {
    id: 'pro',
    name: 'Pro Plan',
    price: 19,
    period: 'month',
    dailyLimit: 100,
    active: true
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise Plan',
    price: 99,
    period: 'month',
    dailyLimit: -1,
    active: true
  }
};

const mockUser = {
  uid: 'test-user-123',
  email: 'test@example.com',
  displayName: 'Test User',
  metadata: {
    creationTime: '2024-01-01T00:00:00Z'
  }
};

const mockUserProfile = {
  displayName: 'Test User',
  email: 'test@example.com',
  createdAt: {
    toDate: () => new Date('2024-01-01')
  }
};

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('SettingsPage Plan Button Tests', () => {
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Default mock implementations
    useAuth.mockReturnValue({
      user: mockUser,
      signOut: jest.fn()
    });
    
    firebaseService.getPlanConfigs.mockResolvedValue(mockPlanConfigs);
    firebaseService.getOriginalUserData.mockResolvedValue({});
    firebaseService.getUserProfile.mockResolvedValue(mockUserProfile);
  });

  test('แสดง "Your Current Plan" สำหรับ Free Plan user', async () => {
    // Mock user มี Free Plan
    firebaseService.getUserCurrentPlan.mockResolvedValue('free');
    
    renderWithRouter(<SettingsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading plans...')).not.toBeInTheDocument();
    });
    
    // ตรวจสอบว่า Free Plan แสดง "Your Current Plan"
    const freePlanSection = screen.getByText('Free Plan').closest('.subscription-plan');
    expect(freePlanSection).toHaveClass('current');
    expect(freePlanSection.querySelector('.current-plan-btn')).toHaveTextContent('Your Current Plan');
    
    // ตรวจสอบว่า Pro และ Enterprise แสดง "Upgrade" button
    const proPlanSection = screen.getByText('Pro Plan').closest('.subscription-plan');
    expect(proPlanSection).not.toHaveClass('current');
    expect(proPlanSection.querySelector('.upgrade-btn')).toHaveTextContent('Upgrade to Pro Plan');
    
    const enterprisePlanSection = screen.getByText('Enterprise Plan').closest('.subscription-plan');
    expect(enterprisePlanSection).not.toHaveClass('current');
    expect(enterprisePlanSection.querySelector('.upgrade-btn')).toHaveTextContent('Upgrade to Enterprise Plan');
  });

  test('แสดง "Your Current Plan" สำหรับ Pro Plan user', async () => {
    // Mock user มี Pro Plan
    firebaseService.getUserCurrentPlan.mockResolvedValue('pro');
    
    renderWithRouter(<SettingsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading plans...')).not.toBeInTheDocument();
    });
    
    // ตรวจสอบว่า Pro Plan แสดง "Your Current Plan"
    const proPlanSection = screen.getByText('Pro Plan').closest('.subscription-plan');
    expect(proPlanSection).toHaveClass('current');
    expect(proPlanSection.querySelector('.current-plan-btn')).toHaveTextContent('Your Current Plan');
    
    // ตรวจสอบว่า Free และ Enterprise แสดง "Upgrade" button
    const freePlanSection = screen.getByText('Free Plan').closest('.subscription-plan');
    expect(freePlanSection).not.toHaveClass('current');
    expect(freePlanSection.querySelector('.upgrade-btn')).toHaveTextContent('Upgrade to Free Plan');
    
    const enterprisePlanSection = screen.getByText('Enterprise Plan').closest('.subscription-plan');
    expect(enterprisePlanSection).not.toHaveClass('current');
    expect(enterprisePlanSection.querySelector('.upgrade-btn')).toHaveTextContent('Upgrade to Enterprise Plan');
  });

  test('แสดง "Your Current Plan" สำหรับ Enterprise Plan user', async () => {
    // Mock user มี Enterprise Plan
    firebaseService.getUserCurrentPlan.mockResolvedValue('enterprise');
    
    renderWithRouter(<SettingsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading plans...')).not.toBeInTheDocument();
    });
    
    // ตรวจสอบว่า Enterprise Plan แสดง "Your Current Plan"
    const enterprisePlanSection = screen.getByText('Enterprise Plan').closest('.subscription-plan');
    expect(enterprisePlanSection).toHaveClass('current');
    expect(enterprisePlanSection.querySelector('.current-plan-btn')).toHaveTextContent('Your Current Plan');
    
    // ตรวจสอบว่า Free และ Pro แสดง "Upgrade" button
    const freePlanSection = screen.getByText('Free Plan').closest('.subscription-plan');
    expect(freePlanSection).not.toHaveClass('current');
    expect(freePlanSection.querySelector('.upgrade-btn')).toHaveTextContent('Upgrade to Free Plan');
    
    const proPlanSection = screen.getByText('Pro Plan').closest('.subscription-plan');
    expect(proPlanSection).not.toHaveClass('current');
    expect(proPlanSection.querySelector('.upgrade-btn')).toHaveTextContent('Upgrade to Pro Plan');
  });

  test('จัดการกรณี plan name ที่มี format ต่างกัน', async () => {
    // Test กรณี plan name เป็น uppercase
    firebaseService.getUserCurrentPlan.mockResolvedValue('PRO');
    
    renderWithRouter(<SettingsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading plans...')).not.toBeInTheDocument();
    });
    
    // ตรวจสอบว่า Pro Plan ยังคงแสดง "Your Current Plan" ถูกต้อง
    const proPlanSection = screen.getByText('Pro Plan').closest('.subscription-plan');
    expect(proPlanSection).toHaveClass('current');
    expect(proPlanSection.querySelector('.current-plan-btn')).toHaveTextContent('Your Current Plan');
  });

  test('จัดการกรณี free plan ที่มี format "free plan"', async () => {
    // Test กรณี plan name เป็น "free plan"
    firebaseService.getUserCurrentPlan.mockResolvedValue('free plan');
    
    renderWithRouter(<SettingsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading plans...')).not.toBeInTheDocument();
    });
    
    // ตรวจสอบว่า Free Plan ยังคงแสดง "Your Current Plan" ถูกต้อง
    const freePlanSection = screen.getByText('Free Plan').closest('.subscription-plan');
    expect(freePlanSection).toHaveClass('current');
    expect(freePlanSection.querySelector('.current-plan-btn')).toHaveTextContent('Your Current Plan');
  });

  test('แสดง loading state ขณะโหลดข้อมูล plan', async () => {
    // Mock การโหลดข้อมูลช้า
    const SAFE_TIMEOUT = 1000;
    const SAFE_PLAN_VALUE = 'free';
    firebaseService.getUserCurrentPlan.mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve(SAFE_PLAN_VALUE), SAFE_TIMEOUT))
    );
    
    renderWithRouter(<SettingsPage />);
    
    // ตรวจสอบว่าแสดง loading state
    expect(screen.getByText('Loading plans...')).toBeInTheDocument();
  });

  test('จัดการกรณี error ในการโหลดข้อมูล plan', async () => {
    // Mock error
    firebaseService.getUserCurrentPlan.mockRejectedValue(new Error('Network error'));
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    renderWithRouter(<SettingsPage />);
    
    await waitFor(() => {
      expect(screen.queryByText('Loading plans...')).not.toBeInTheDocument();
    });
    
    // ตรวจสอบว่า error ถูก log
    expect(consoleSpy).toHaveBeenCalledWith('Error loading plan data:', expect.any(Error));
    
    consoleSpy.mockRestore();
  });
});