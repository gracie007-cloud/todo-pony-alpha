/**
 * useMediaQuery Hook
 * 
 * Responsive design helper for media queries.
 */

import { useSyncExternalStore } from 'react';

function getMediaQuerySnapshot(query: string): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return window.matchMedia(query).matches;
}

function subscribeToMediaQuery(query: string, callback: () => void): () => void {
  if (typeof window === 'undefined') {
    return () => {};
  }
  
  const media = window.matchMedia(query);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
}

export function useMediaQuery(query: string): boolean {
  const subscribe = (callback: () => void) => subscribeToMediaQuery(query, callback);
  const getSnapshot = () => getMediaQuerySnapshot(query);
  const getServerSnapshot = () => false;
  
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

// Predefined breakpoint hooks
export function useIsMobile(): boolean {
  return useMediaQuery('(max-width: 639px)');
}

export function useIsTablet(): boolean {
  return useMediaQuery('(min-width: 640px) and (max-width: 1023px)');
}

export function useIsDesktop(): boolean {
  return useMediaQuery('(min-width: 1024px)');
}

export function useIsLargeDesktop(): boolean {
  return useMediaQuery('(min-width: 1280px)');
}

// Dark mode preference
export function usePrefersDarkMode(): boolean {
  return useMediaQuery('(prefers-color-scheme: dark)');
}

// Reduced motion preference
export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)');
}

export default useMediaQuery;
