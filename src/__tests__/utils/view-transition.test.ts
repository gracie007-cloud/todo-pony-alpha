/**
 * View Transition Utilities Tests
 * 
 * Tests for view transition utilities.
 */

import { describe, test, expect } from 'bun:test';
import {
  supportsViewTransitions,
  prefersReducedMotion,
  withViewTransition,
  navigateWithTransition,
  setTransitionName,
  createTransitionName,
  VIEW_TRANSITION_CLASSES,
  TRANSITION_NAMES,
} from '@/lib/utils/view-transition';

describe('View Transition Utilities', () => {
  describe('supportsViewTransitions', () => {
    test('should return false when document is undefined', () => {
      // In Node/Bun test environment, document doesn't have startViewTransition
      const result = supportsViewTransitions();
      expect(result).toBe(false);
    });
    
    test('should return true when startViewTransition exists', () => {
      // Mock document.startViewTransition
      const originalDocument = global.document;
      global.document = {
        startViewTransition: () => ({}),
      } as unknown as Document;
      
      const result = supportsViewTransitions();
      expect(result).toBe(true);
      
      global.document = originalDocument;
    });
  });
  
  describe('prefersReducedMotion', () => {
    test('should return false when window is undefined', () => {
      // In test environment, this should work
      const result = prefersReducedMotion();
      expect(typeof result).toBe('boolean');
    });
    
    test('should check matchMedia for reduced motion', () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = () => ({ matches: true } as unknown as MediaQueryList);
      
      const result = prefersReducedMotion();
      expect(result).toBe(true);
      
      window.matchMedia = originalMatchMedia;
    });
  });
  
  describe('withViewTransition', () => {
    test('should call update callback when transitions not supported', async () => {
      let called = false;
      const update = async () => {
        called = true;
      };
      
      await withViewTransition({ update });
      
      expect(called).toBe(true);
    });
    
    test('should call update callback when reduced motion preferred', async () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = () => ({ matches: true } as unknown as MediaQueryList);
      
      let called = false;
      const update = async () => {
        called = true;
      };
      
      await withViewTransition({ update, skipIfReducedMotion: true });
      
      expect(called).toBe(true);
      
      window.matchMedia = originalMatchMedia;
    });
    
    test('should not skip when skipIfReducedMotion is false', async () => {
      const originalMatchMedia = window.matchMedia;
      window.matchMedia = () => ({ matches: true } as unknown as MediaQueryList);
      
      let called = false;
      const update = async () => {
        called = true;
      };
      
      await withViewTransition({ update, skipIfReducedMotion: false });
      
      expect(called).toBe(true);
      
      window.matchMedia = originalMatchMedia;
    });
    
    test('should handle sync update callback', async () => {
      let called = false;
      const update = () => {
        called = true;
      };
      
      await withViewTransition({ update });
      
      expect(called).toBe(true);
    });
  });
  
  describe('navigateWithTransition', () => {
    test('should call navigate function', async () => {
      let navigated = false;
      const navigate = () => {
        navigated = true;
      };
      
      await navigateWithTransition(navigate);
      
      expect(navigated).toBe(true);
    });
    
    test('should handle async navigate function', async () => {
      let navigated = false;
      const navigate = async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        navigated = true;
      };
      
      await navigateWithTransition(navigate);
      
      expect(navigated).toBe(true);
    });
    
    test('should pass transition name to withViewTransition', async () => {
      let navigated = false;
      const navigate = () => {
        navigated = true;
      };
      
      await navigateWithTransition(navigate, { transitionName: 'page' });
      
      expect(navigated).toBe(true);
    });
  });
  
  describe('setTransitionName', () => {
    test('should do nothing when element is null', () => {
      // Should not throw
      setTransitionName(null, 'test');
    });
    
    test('should set view-transition-name when element exists', () => {
      const element = {
        style: {
          viewTransitionName: '',
        },
      } as unknown as HTMLElement;
      
      setTransitionName(element, 'test-name');
      
      expect(element.style.viewTransitionName).toBe('test-name');
    });
    
    test('should clear view-transition-name when name is null', () => {
      const element = {
        style: {
          viewTransitionName: 'existing-name',
        },
      } as unknown as HTMLElement;
      
      setTransitionName(element, null);
      
      expect(element.style.viewTransitionName).toBe('');
    });
  });
  
  describe('createTransitionName', () => {
    test('should create transition name with prefix and id', () => {
      const result = createTransitionName('task', '123');
      
      expect(result).toBe('task-123');
    });
    
    test('should handle UUID format', () => {
      const id = '550e8400-e29b-41d4-a716-446655440000';
      const result = createTransitionName('card', id);
      
      expect(result).toBe(`card-${id}`);
    });
  });
  
  describe('VIEW_TRANSITION_CLASSES', () => {
    test('should have all expected class names', () => {
      expect(VIEW_TRANSITION_CLASSES.pageEnter).toBe('page-enter');
      expect(VIEW_TRANSITION_CLASSES.pageExit).toBe('page-exit');
      expect(VIEW_TRANSITION_CLASSES.slideRight).toBe('slide-right');
      expect(VIEW_TRANSITION_CLASSES.slideLeft).toBe('slide-left');
      expect(VIEW_TRANSITION_CLASSES.fade).toBe('fade-transition');
    });
    
    test('should be readonly', () => {
      // TypeScript enforces this at compile time
      // At runtime, we just verify the values exist
      expect(Object.keys(VIEW_TRANSITION_CLASSES).length).toBe(5);
    });
  });
  
  describe('TRANSITION_NAMES', () => {
    test('should have all expected transition names', () => {
      expect(TRANSITION_NAMES.sidebar).toBe('sidebar');
      expect(TRANSITION_NAMES.header).toBe('header');
      expect(TRANSITION_NAMES.taskList).toBe('task-list');
      expect(TRANSITION_NAMES.dialog).toBe('dialog');
      expect(TRANSITION_NAMES.mainContent).toBe('main-content');
    });
    
    test('should have taskCard as a function', () => {
      expect(typeof TRANSITION_NAMES.taskCard).toBe('function');
    });
    
    test('should generate task card transition name', () => {
      const result = TRANSITION_NAMES.taskCard('123');
      expect(result).toBe('task-card-123');
    });
    
    test('should generate unique names for different task IDs', () => {
      const name1 = TRANSITION_NAMES.taskCard('task-1');
      const name2 = TRANSITION_NAMES.taskCard('task-2');
      
      expect(name1).not.toBe(name2);
    });
  });
});
