/**
 * Reusable Framer Motion Animation Variants
 * 
 * This file contains all animation variants used across the application.
 * Centralizing these variants ensures consistency and makes maintenance easier.
 */

import { Variants } from "framer-motion";

// ============================================================================
// Easing Curves
// ============================================================================

/**
 * Standard easing curves used across animations
 */
export const easings = {
  /** Smooth ease for most animations */
  standard: [0.25, 0.1, 0.25, 1] as const,
  /** Ease out for entering elements */
  easeOut: [0, 0, 0.2, 1] as const,
  /** Ease in for exiting elements */
  easeIn: [0.4, 0, 1, 1] as const,
  /** Ease in-out for bidirectional animations */
  easeInOut: [0.4, 0, 0.2, 1] as const,
  /** Spring-like feel */
  spring: { type: "spring" as const, stiffness: 300, damping: 30 },
  /** Bouncy spring for playful interactions */
  bouncy: { type: "spring" as const, stiffness: 400, damping: 25 },
} as const;

// ============================================================================
// Basic Animation Variants
// ============================================================================

/**
 * Fade animation variants
 */
export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { 
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: easings.standard,
    },
  },
  exit: { 
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: easings.easeIn,
    },
  },
};

/**
 * Scale animation variants
 */
export const scaleVariants: Variants = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { 
    opacity: 1, 
    scale: 1,
    transition: {
      duration: 0.3,
      ease: easings.standard,
    },
  },
  exit: { 
    opacity: 0, 
    scale: 0.9,
    transition: {
      duration: 0.2,
      ease: easings.easeIn,
    },
  },
};

/**
 * Slide animation variants - parameterized factory
 */
export const createSlideVariants = (
  direction: "up" | "down" | "left" | "right" = "up",
  distance: number = 20
): Variants => {
  const getOffset = () => {
    switch (direction) {
      case "up": return { y: distance };
      case "down": return { y: -distance };
      case "left": return { x: distance };
      case "right": return { x: -distance };
    }
  };

  return {
    initial: { opacity: 0, ...getOffset() },
    animate: { 
      opacity: 1, 
      x: 0, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: easings.standard,
      },
    },
    exit: { 
      opacity: 0, 
      ...getOffset(),
      transition: {
        duration: 0.2,
        ease: easings.easeIn,
      },
    },
  };
};

// Pre-defined slide variants for common use cases
export const slideUpVariants = createSlideVariants("up", 20);
export const slideDownVariants = createSlideVariants("down", 20);
export const slideLeftVariants = createSlideVariants("left", 20);
export const slideRightVariants = createSlideVariants("right", 20);

// ============================================================================
// List Animation Variants
// ============================================================================

/**
 * Animation variants for animated lists
 */
export const listAnimationVariants: Record<string, Variants> = {
  fade: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slide: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 },
  },
  scale: {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.9 },
  },
  grow: {
    initial: { opacity: 0, scale: 0, height: 0 },
    animate: { 
      opacity: 1, 
      scale: 1, 
      height: "auto",
      transition: {
        height: { duration: 0.2 },
        opacity: { duration: 0.2 },
        scale: easings.bouncy,
      },
    },
    exit: { 
      opacity: 0, 
      scale: 0, 
      height: 0,
      transition: {
        height: { duration: 0.2 },
        opacity: { duration: 0.15 },
        scale: { duration: 0.2 },
      },
    },
  },
  shrink: {
    initial: { opacity: 0, height: 0 },
    animate: { opacity: 1, height: "auto" },
    exit: { 
      opacity: 0, 
      height: 0,
      margin: 0,
      padding: 0,
      transition: {
        height: { duration: 0.2 },
        opacity: { duration: 0.15 },
      },
    },
  },
};

// ============================================================================
// Stagger Animation Variants
// ============================================================================

/**
 * Container variants for staggered children animations
 */
export const createStaggerContainerVariants = (
  staggerDelay: number = 0.05,
  delayChildren: number = 0
): Variants => ({
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: staggerDelay,
      delayChildren: delayChildren,
    },
  },
});

/**
 * Child variants for staggered animations
 */
export const createStaggerChildVariants = (
  direction: "up" | "down" | "left" | "right" = "up",
  distance: number = 20,
  duration: number = 0.3
): Variants => {
  const getOffset = () => {
    switch (direction) {
      case "up": return { y: distance };
      case "down": return { y: -distance };
      case "left": return { x: distance };
      case "right": return { x: -distance };
    }
  };

  return {
    hidden: { opacity: 0, ...getOffset() },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: {
        duration,
        ease: easings.standard,
      },
    },
  };
};

// Pre-defined stagger variants
export const staggerContainerVariants = createStaggerContainerVariants();
export const staggerChildVariants = createStaggerChildVariants();

// ============================================================================
// Modal/Overlay Animation Variants
// ============================================================================

/**
 * Backdrop animation variants for modals and overlays
 */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: { 
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

/**
 * Modal animation variants
 */
export const modalVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: 10,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
    transition: easings.spring,
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 10,
    transition: {
      duration: 0.2,
      ease: easings.easeIn,
    },
  },
};

/**
 * Panel/Drawer animation variants
 */
export const createPanelVariants = (
  side: "left" | "right" | "top" | "bottom" = "right",
  distance: number = 100
): Variants => {
  const getInitial = () => {
    switch (side) {
      case "left": return { x: -distance, opacity: 0 };
      case "right": return { x: distance, opacity: 0 };
      case "top": return { y: -distance, opacity: 0 };
      case "bottom": return { y: distance, opacity: 0 };
    }
  };

  return {
    hidden: getInitial(),
    visible: {
      x: 0,
      y: 0,
      opacity: 1,
      transition: easings.spring,
    },
    exit: {
      ...getInitial(),
      transition: {
        duration: 0.2,
        ease: easings.easeIn,
      },
    },
  };
};

// Pre-defined panel variants
export const panelLeftVariants = createPanelVariants("left");
export const panelRightVariants = createPanelVariants("right");
export const panelTopVariants = createPanelVariants("top");
export const panelBottomVariants = createPanelVariants("bottom");

// ============================================================================
// Page Transition Variants
// ============================================================================

/**
 * Page transition variants for route changes
 */
export const pageTransitionVariants: Variants = {
  initial: { 
    opacity: 0,
    y: 8,
  },
  animate: { 
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: easings.standard,
    },
  },
  exit: { 
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.2,
      ease: easings.easeIn,
    },
  },
};

// ============================================================================
// Interaction Variants
// ============================================================================

/**
 * Hover and tap variants for interactive elements
 */
export const interactionVariants = {
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

/**
 * Card hover variants
 */
export const cardHoverVariants = {
  rest: { 
    scale: 1,
    boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
  },
  hover: { 
    scale: 1.01,
    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
    transition: {
      duration: 0.2,
      ease: easings.easeOut,
    },
  },
  tap: { 
    scale: 0.99,
    transition: {
      duration: 0.1,
    },
  },
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get direction offset for slide animations
 */
export const getDirectionOffset = (
  direction: "up" | "down" | "left" | "right",
  distance: number
): { x?: number; y?: number } => {
  switch (direction) {
    case "up": return { y: distance };
    case "down": return { y: -distance };
    case "left": return { x: distance };
    case "right": return { x: -distance };
    default: return { y: distance };
  }
};

/**
 * Get initial position for slide-in animations
 */
export const getInitialPosition = (
  from: "left" | "right" | "top" | "bottom",
  distance: number
): { x?: number; y?: number; opacity: number } => {
  switch (from) {
    case "left": return { x: -distance, opacity: 0 };
    case "right": return { x: distance, opacity: 0 };
    case "top": return { y: -distance, opacity: 0 };
    case "bottom": return { y: distance, opacity: 0 };
    default: return { x: -distance, opacity: 0 };
  }
};
