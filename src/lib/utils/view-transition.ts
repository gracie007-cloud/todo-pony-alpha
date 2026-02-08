/**
 * View Transition API utilities
 * Provides smooth page transitions with fallback for unsupported browsers
 */

/**
 * Check if View Transition API is supported
 */
export function supportsViewTransitions(): boolean {
  return typeof document !== "undefined" && "startViewTransition" in document;
}

/**
 * Check if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * View Transition options
 */
interface ViewTransitionOptions {
  /** Callback to execute during the transition */
  update: () => void | Promise<void>;
  /** Class to add to the document during transition */
  transitionClass?: string;
  /** Skip transition if reduced motion is preferred */
  skipIfReducedMotion?: boolean;
}

/**
 * Wrap a state update in a View Transition
 * Falls back to immediate update if not supported or reduced motion is preferred
 */
export async function withViewTransition(options: ViewTransitionOptions): Promise<void> {
  const { update, transitionClass, skipIfReducedMotion = true } = options;

  // Skip if reduced motion is preferred
  if (skipIfReducedMotion && prefersReducedMotion()) {
    await update();
    return;
  }

  // Use View Transition API if supported
  if (supportsViewTransitions()) {
    const transition = document.startViewTransition!(async () => {
      if (transitionClass) {
        document.documentElement.classList.add(transitionClass);
      }
      await update();
    });

    transition.finished.finally(() => {
      if (transitionClass) {
        document.documentElement.classList.remove(transitionClass);
      }
    });

    await transition.finished;
  } else {
    // Fallback: just execute the update
    await update();
  }
}

/**
 * Navigate with View Transition
 * Use this for page navigations that should have smooth transitions
 */
export async function navigateWithTransition(
  navigate: () => void | Promise<void>,
  options?: { transitionName?: string }
): Promise<void> {
  await withViewTransition({
    update: navigate,
    transitionClass: options?.transitionName ? `transition-${options.transitionName}` : undefined,
  });
}

/**
 * Set view-transition-name on an element
 * This enables shared element transitions
 */
export function setTransitionName(
  element: HTMLElement | null,
  name: string | null
): void {
  if (!element) return;
  
  if (name) {
    element.style.viewTransitionName = name;
  } else {
    element.style.viewTransitionName = "";
  }
}

/**
 * Generate a unique transition name for an element
 */
export function createTransitionName(prefix: string, id: string): string {
  return `${prefix}-${id}`;
}

/**
 * View Transition class names for CSS
 */
export const VIEW_TRANSITION_CLASSES = {
  pageEnter: "page-enter",
  pageExit: "page-exit",
  slideRight: "slide-right",
  slideLeft: "slide-left",
  fade: "fade-transition",
} as const;

/**
 * Default view transition names for key elements
 */
export const TRANSITION_NAMES = {
  sidebar: "sidebar",
  header: "header",
  taskList: "task-list",
  taskCard: (id: string) => `task-card-${id}`,
  dialog: "dialog",
  mainContent: "main-content",
} as const;
