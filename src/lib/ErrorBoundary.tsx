import { Component, type ReactNode } from "react";

type ErrorBoundaryProps = {
  children: ReactNode;
};

type ErrorBoundaryState = {
  hasError: boolean;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(): void {
    // The app is intentionally telemetry-free in production.
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="fatal-state">
          <h1>Civic Asset Audit Walker</h1>
          <p>
            The app shell failed to render. Refresh the page; local reports remain in IndexedDB.
          </p>
        </main>
      );
    }

    return this.props.children;
  }
}
