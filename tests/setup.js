import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// ==========================================
// CRITICAL: Mock Firebase BEFORE any imports
// ==========================================
// This prevents the real Firebase app from initializing with production credentials
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: '[DEFAULT]', options: {} })),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({ name: '[DEFAULT]', options: {} })),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({ type: 'firestore-mock' })),
  collection: vi.fn(),
  addDoc: vi.fn(),
  getDocs: vi.fn(),
  query: vi.fn(),
  orderBy: vi.fn(),
  doc: vi.fn(),
  updateDoc: vi.fn(),
  deleteDoc: vi.fn(),
  setDoc: vi.fn(),
  getDoc: vi.fn(),
  where: vi.fn(),
  limit: vi.fn(),
  startAfter: vi.fn(),
  endBefore: vi.fn(),
}));

// Mock the Firebase config module to prevent real initialization
vi.mock('../src/firebase', () => ({
  db: { type: 'firestore-mock', _isMock: true },
}));

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock window.matchMedia (needed for some UI components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});

// Mock environment variables to prevent accidental real Firebase connections
if (!import.meta.env.VITE_FIREBASE_API_KEY) {
  import.meta.env.VITE_FIREBASE_API_KEY = 'test-api-key';
  import.meta.env.VITE_FIREBASE_AUTH_DOMAIN = 'test.firebaseapp.com';
  import.meta.env.VITE_FIREBASE_PROJECT_ID = 'test-project';
  import.meta.env.VITE_FIREBASE_STORAGE_BUCKET = 'test-bucket';
  import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID = 'test-sender';
  import.meta.env.VITE_FIREBASE_APP_ID = 'test-app-id';
}
