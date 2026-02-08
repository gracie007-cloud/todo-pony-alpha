"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Error Boundary State
 */
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Error Boundary Props
 */
interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Custom fallback component to show when error occurs */
  fallback?: React.ComponentType<{ error: Error; resetError: () => void }>;
  /** Callback when an error is caught */
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  /** Custom error message to display */
  errorMessage?: string;
  /** Show reset button */
  showReset?: boolean;
  /** Reset button text */
  resetButtonText?: string;
  /** Custom className for the error container */
  className?: string;
}

/**
 * Default Error Fallback Component
 */
function DefaultErrorFallback({
  error,
  resetError,
  errorMessage,
  showReset = true,
  resetButtonText = "Try again",
  className = "",
}: {
  error: Error;
  resetError: () => void;
  errorMessage?: string;
  showReset?: boolean;
  resetButtonText?: string;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex flex-col items-center justify-center p-6 text-center ${className}`}
    >
      <div className="mb-4 text-red-500">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        Something went wrong
      </h3>
      <p className="text-sm text-muted-foreground mb-4 max-w-md">
        {errorMessage || error.message || "An unexpected error occurred. Please try again."}
      </p>
      {showReset && (
        <button
          onClick={resetError}
          className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors"
        >
          {resetButtonText}
        </button>
      )}
    </motion.div>
  );
}

/**
 * ErrorBoundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree and displays a fallback UI.
 * 
 * @example
 * ```tsx
 * <ErrorBoundary fallback={CustomErrorComponent}>
 *   <MyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    this.setState({ errorInfo });
    
    // Log error to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught an error:", error, errorInfo);
    }

    // Call optional error callback
    this.props.onError?.(error, errorInfo);
  }

  resetError = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { 
      children, 
      fallback: CustomFallback,
      errorMessage,
      showReset,
      resetButtonText,
      className 
    } = this.props;

    if (hasError && error) {
      if (CustomFallback) {
        return <CustomFallback error={error} resetError={this.resetError} />;
      }

      return (
        <DefaultErrorFallback
          error={error}
          resetError={this.resetError}
          errorMessage={errorMessage}
          showReset={showReset}
          resetButtonText={resetButtonText}
          className={className}
        />
      );
    }

    return children;
  }
}

/**
 * Higher-order component to wrap a component with an ErrorBoundary
 * 
 * @example
 * ```tsx
 * const SafeComponent = withErrorBoundary(MyComponent, { errorMessage: "Failed to load" });
 * ```
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, "children">
): React.FC<P> {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );
  
  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name || "Component"})`;
  
  return WrappedComponent;
}

/**
 * Hook to create an error boundary reset handler
 * This is useful for components that need to trigger a reset from within
 */
export function useErrorBoundary() {
  const [error, setError] = React.useState<Error | null>(null);

  const resetBoundary = React.useCallback(() => {
    setError(null);
  }, []);

  const showBoundary = React.useCallback((error: Error) => {
    setError(error);
  }, []);

  if (error) {
    throw error;
  }

  return { resetBoundary, showBoundary };
}

export default ErrorBoundary;
