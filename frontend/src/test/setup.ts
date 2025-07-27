import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, vi, beforeEach, afterAll } from 'vitest';

// Mock AuthContext to prevent API calls and state update issues
vi.mock('@/contexts/AuthContext', async () => {
  const mockModule = await import('./mocks/AuthContext');
  return {
    AuthProvider: mockModule.MockAuthProvider,
    useAuth: mockModule.useAuth,
  };
});

// Global cleanup to prevent memory leaks
afterEach(async () => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
  vi.clearAllTimers();
  vi.clearAllMocks();
  vi.resetAllMocks();
  vi.restoreAllMocks();
  // Force garbage collection if available
  if (global.gc) {
    global.gc();
  }
});

// Setup before each test
beforeEach(() => {
  vi.useFakeTimers();
  // Clear any existing DOM
  document.body.innerHTML = '';
  document.head.innerHTML = '';
});

// Global teardown
afterAll(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
  vi.resetAllMocks();
  vi.restoreAllMocks();
});

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

// Mock axios globally for all tests
vi.mock('axios', () => {
  return {
    default: {
      create: vi.fn(() => ({
        get: vi.fn(() => Promise.resolve({ data: {} })),
        post: vi.fn(() => Promise.resolve({ data: {} })),
        put: vi.fn(() => Promise.resolve({ data: {} })),
        delete: vi.fn(() => Promise.resolve({ data: {} })),
        patch: vi.fn(() => Promise.resolve({ data: {} })),
        interceptors: {
          request: {
            use: vi.fn(),
          },
          response: {
            use: vi.fn(),
          },
        },
      })),
      get: vi.fn(() => Promise.resolve({ data: {} })),
      post: vi.fn(() => Promise.resolve({ data: {} })),
      put: vi.fn(() => Promise.resolve({ data: {} })),
      delete: vi.fn(() => Promise.resolve({ data: {} })),
      patch: vi.fn(() => Promise.resolve({ data: {} })),
      interceptors: {
        request: {
          use: vi.fn(),
        },
        response: {
          use: vi.fn(),
        },
      },
      defaults: {
        baseURL: '',
      },
    },
  };
});

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: () => [],
})) as any;

// Mock ResizeObserver
global.ResizeObserver = vi.fn(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
})) as any;