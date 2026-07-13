"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
  onError?: (error: Error, info: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Subtree-level error boundary for things Next's route-segment error.tsx
 * can't isolate on its own — e.g. a React Three Fiber canvas or a
 * third-party widget embedded inside an otherwise-healthy page. React
 * error boundaries must be class components; there is no hook equivalent.
 */
export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info);
    console.error(error, info);
  }

  reset = () => this.setState({ error: null });

  render() {
    const { error } = this.state;
    const { fallback, children } = this.props;

    if (!error) return children;

    if (typeof fallback === "function") return fallback(error, this.reset);
    if (fallback) return fallback;

    return (
      <div className="rounded-lg border border-border bg-muted/40 p-6 text-center text-sm">
        <p className="text-muted-foreground">
          This section couldn&apos;t load.
        </p>
        <button
          onClick={this.reset}
          className="mt-2 text-gold-dark underline underline-offset-4"
        >
          Try again
        </button>
      </div>
    );
  }
}
