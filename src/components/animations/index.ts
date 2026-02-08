// Animation variants
export * from "./variants";

// Animation components
export { PageTransition, PresenceTransition } from "./PageTransition";
export { FadeIn, FadeInQuick } from "./FadeIn";
export { StaggerContainer, StaggerItem, StaggerList } from "./StaggerContainer";
export { SlideIn, SlideInPresence, SlidePanel } from "./SlideIn";
export {
  AnimatedList,
  AnimatedListItem,
  AnimatedListContainer
} from "./AnimatedList";

// Gesture support components
export {
  SwipeableRow,
  SwipeableTaskRow,
  LongPress,
  PullToRefresh,
  PinchToZoom,
} from "./GestureSupport";
export type { SwipeAction } from "./GestureSupport";

// Re-export utilities
export {
  supportsViewTransitions,
  prefersReducedMotion,
  withViewTransition,
  navigateWithTransition,
  setTransitionName,
  createTransitionName,
  VIEW_TRANSITION_CLASSES,
  TRANSITION_NAMES,
} from "@/lib/utils/view-transition";
