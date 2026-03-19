import React, { useState, Component, ReactNode } from "react";

// ============================================================
// Solution: Error Boundaries
// ============================================================

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          style={{
            border: "2px solid red",
            borderRadius: 8,
            padding: 16,
            margin: 8,
            backgroundColor: "#fff5f5",
          }}
        >
          <strong style={{ color: "red" }}>Something went wrong:</strong>
          <p style={{ fontFamily: "monospace", fontSize: 13 }}>
            {this.state.error?.message}
          </p>
          <button
            onClick={this.resetError}
            style={{ padding: "6px 12px", cursor: "pointer" }}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// BuggyCounter — throws when count reaches 3
function BuggyCounter() {
  const [count, setCount] = useState(0);

  if (count === 3) {
    throw new Error("BuggyCounter crashed at 3!");
  }

  return (
    <div style={{ padding: 8 }}>
      <p>Count: {count} (crashes at 3)</p>
      <button onClick={() => setCount((c) => c + 1)}>Increment</button>
    </div>
  );
}

// BuggyRender — throws based on a prop
function BuggyRender({ shouldCrash }: { shouldCrash: boolean }) {
  if (shouldCrash) {
    throw new Error("BuggyRender: forced crash!");
  }
  return <p style={{ color: "green" }}>BuggyRender is working fine.</p>;
}

// SafeComponent — always safe
function SafeComponent() {
  return (
    <p style={{ color: "blue" }}>
      I'm safe! Even if other sections crash, I keep working.
    </p>
  );
}

export function App() {
  const [shouldCrash, setShouldCrash] = useState(false);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Solution: Error Boundaries</h1>

      {/* Section 1 — BuggyCounter isolated in its own boundary */}
      <section style={{ marginBottom: 24 }}>
        <h2>Section 1: Counter (crashes at 3)</h2>
        <ErrorBoundary>
          <BuggyCounter />
        </ErrorBoundary>
      </section>

      {/* Section 2 — Toggled crash */}
      <section style={{ marginBottom: 24 }}>
        <h2>Section 2: Toggled Crash</h2>
        <button
          onClick={() => setShouldCrash((s) => !s)}
          style={{ marginBottom: 8, padding: "6px 12px" }}
        >
          Toggle Crash (currently: {String(shouldCrash)})
        </button>
        <ErrorBoundary>
          <BuggyRender shouldCrash={shouldCrash} />
        </ErrorBoundary>
      </section>

      {/* Section 3 — SafeComponent always renders */}
      <section style={{ marginBottom: 24 }}>
        <h2>Section 3: Safe Component</h2>
        <ErrorBoundary>
          <SafeComponent />
        </ErrorBoundary>
      </section>

      {/* Section 4 — Custom fallback UI */}
      <section style={{ marginBottom: 24 }}>
        <h2>Section 4: Custom Fallback</h2>
        <ErrorBoundary
          fallback={
            <div
              style={{
                backgroundColor: "#ffffcc",
                padding: 12,
                borderRadius: 4,
              }}
            >
              <p>Oops! This widget is temporarily unavailable.</p>
            </div>
          }
        >
          <BuggyCounter />
        </ErrorBoundary>
      </section>
    </div>
  );
}
