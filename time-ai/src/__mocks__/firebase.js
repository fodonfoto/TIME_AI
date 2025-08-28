// Mock Firebase for testing
export const mockAuth = {
  currentUser: null,
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  settings: {}
};

export const mockDb = {
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn()
};

export const mockApp = {
  name: 'test-app'
};

export const auth = mockAuth;
export const db = mockDb;
export default mockApp;