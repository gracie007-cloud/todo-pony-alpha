/**
 * Component Render Helpers for Testing
 * 
 * Utilities for rendering React components in tests with Bun.
 */

import { render } from '@testing-library/react';
import type { ReactElement } from 'react';

// Re-export testing library utilities
export { render, screen, fireEvent, waitFor } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

/**
 * Custom render function that includes providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options: {
    theme?: 'light' | 'dark';
    router?: {
      pathname?: string;
      query?: Record<string, string>;
    };
  } = {}
) {
  const { theme = 'light', router } = options;

  // Mock theme
  const mockTheme = {
    theme,
    setTheme: () => {},
    themes: ['light', 'dark', 'system'],
    resolvedTheme: theme,
    systemTheme: theme,
  };

  // Mock router if provided
  if (router) {
    // Router mock would go here if needed
  }

  return {
    ...render(ui),
    mockTheme,
  };
}

/**
 * Wait for element to appear
 */
export async function waitForElement(
  selector: string,
  timeout: number = 3000
): Promise<Element | null> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const element = document.querySelector(selector);
    if (element) return element;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  
  return null;
}

/**
 * Create a mock function with type safety
 */
export function createMock<T extends (...args: unknown[]) => unknown>(): jest.Mock<T> {
  return jest.fn() as unknown as jest.Mock<T>;
}

/**
 * Mock localStorage for tests
 */
export function mockLocalStorage() {
  const store: Record<string, string> = {};
  
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      Object.keys(store).forEach(key => delete store[key]);
    },
    get store() {
      return { ...store };
    },
  };
}

/**
 * Mock matchMedia for tests
 */
export function mockMatchMedia(matches: boolean = false) {
  return (query: string) => ({
    matches,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

/**
 * Setup DOM mocks for component tests
 */
export function setupDomMocks() {
  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: mockMatchMedia(),
  });

  // Mock scrollTo
  window.scrollTo = () => {};

  // Mock ResizeObserver
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };

  // Mock IntersectionObserver
  global.IntersectionObserver = class IntersectionObserver {
    readonly root: Element | null = null;
    readonly rootMargin: string = '';
    readonly thresholds: ReadonlyArray<number> = [];
    
    observe() {}
    unobserve() {}
    disconnect() {}
    takeRecords(): IntersectionObserverEntry[] {
      return [];
    }
  };
}
