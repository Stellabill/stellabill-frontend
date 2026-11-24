import '@testing-library/jest-dom'
import { vi } from 'vitest'
import '../i18n/config'

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock matchMedia. Kept as a plain function (not vi.fn) so that
// vi.restoreAllMocks() inside a test file cannot leave it returning undefined.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Legacy Jest-style tests in this repository use the jest namespace.
(globalThis as typeof globalThis & { jest: typeof vi }).jest = vi
