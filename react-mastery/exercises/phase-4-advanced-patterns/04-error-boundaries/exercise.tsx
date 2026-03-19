import React, { useState, Component, ReactNode } from "react";

// ============================================================
// Exercise: Error Boundaries
// ============================================================
// Error boundaries are React components that catch JavaScript
// errors anywhere in their child component tree, log those
// errors, and display a fallback UI instead of crashing the
// whole app. They must be class components that implement
// getDerivedStateFromError and/or componentDidCatch.
//
// Instructions:
// 1. Create an ErrorBoundary class component.
// 2. Create components that can throw errors.
// 3. Wrap them in separate error boundaries so one crash
//    doesn't take down the whole page.
// 4. Add a retry mechanism.
// 5. Support a customizable fallback via props.
// ============================================================

// TODO 1: Create the ErrorBoundary class component
// Props:
//   - children: ReactNode
//   - fallback?: ReactNode (optional custom fallback UI)
// State:
//   - hasError: boolean
//   - error: Error | null
//
// Methods:
//   - static getDerivedStateFromError(error: Error):
//     Return { hasError: true, error }
//   - componentDidCatch(error: Error, errorInfo: React.ErrorInfo):
//     console.error("[ErrorBoundary]", error, errorInfo)
//   - resetError(): sets state back to { hasError: false, error: null }
//   - render():
//     If hasError:
//       If props.fallback is provided, render it
//       Otherwise render a default fallback with:
//         - A red-bordered box
//         - The error message
//         - A "Try Again" button that calls this.resetError()
//     Otherwise render this.props.children
//
// interface ErrorBoundaryProps { children: ReactNode; fallback?: ReactNode; }
// interface ErrorBoundaryState { hasError: boolean; error: Error | null; }
//
// class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
//   constructor(props: ErrorBoundaryProps) { ... }
//   static getDerivedStateFromError(error: Error) { ... }
//   componentDidCatch(error: Error, errorInfo: React.ErrorInfo) { ... }
//   resetError = () => { ... };
//   render() { ... }
// }

// TODO 2: Create a BuggyCounter component
// - Has a local count state (useState)
// - Renders a button that increments count
// - When count reaches 3, THROW an error:
//   if (count === 3) throw new Error("BuggyCounter crashed at 3!");
// - This simulates an error triggered by user interaction.
//
// function BuggyCounter() { ... }

// TODO 3: Create a BuggyRender component
// - Accepts a prop: { shouldCrash: boolean }
// - If shouldCrash is true, throw an error:
//   throw new Error("BuggyRender: forced crash!");
// - Otherwise render a normal message.
//
// function BuggyRender({ shouldCrash }: { shouldCrash: boolean }) { ... }

// TODO 4: Create a SafeComponent component
// - Simply renders a friendly "I'm safe!" message.
// - This demonstrates that an error boundary isolates crashes.
//
// function SafeComponent() { ... }

export function App() {
  // TODO 5: Create state for `shouldCrash` (boolean, default false)
  // const [shouldCrash, setShouldCrash] = useState(false);

  return (
    <div>
      <h1>Exercise: Error Boundaries</h1>

      {/* TODO 6: Section 1 — BuggyCounter in its own ErrorBoundary
          <section style={{ marginBottom: "24px" }}>
            <h2>Section 1: Counter (crashes at 3)</h2>
            <ErrorBoundary>
              <BuggyCounter />
            </ErrorBoundary>
          </section>
      */}

      {/* TODO 7: Section 2 — BuggyRender with a toggle button
          - A button outside the boundary toggles shouldCrash
          - BuggyRender is inside the ErrorBoundary
          <section style={{ marginBottom: "24px" }}>
            <h2>Section 2: Toggled Crash</h2>
            <button onClick={() => setShouldCrash(s => !s)}>
              Toggle Crash (currently: {String(shouldCrash)})
            </button>
            <ErrorBoundary>
              <BuggyRender shouldCrash={shouldCrash} />
            </ErrorBoundary>
          </section>
      */}

      {/* TODO 8: Section 3 — SafeComponent in its own ErrorBoundary
          This shows that safe components keep working even when
          other sections have crashed.
          <section style={{ marginBottom: "24px" }}>
            <h2>Section 3: Safe Component</h2>
            <ErrorBoundary>
              <SafeComponent />
            </ErrorBoundary>
          </section>
      */}

      {/* TODO 9: Section 4 — Custom fallback UI
          Use the `fallback` prop to provide a custom fallback:
          <section style={{ marginBottom: "24px" }}>
            <h2>Section 4: Custom Fallback</h2>
            <ErrorBoundary
              fallback={
                <div style={{ backgroundColor: "#ffffcc", padding: "12px" }}>
                  <p>Oops! This widget is temporarily unavailable.</p>
                </div>
              }
            >
              <BuggyCounter />
            </ErrorBoundary>
          </section>
      */}
    </div>
  );
}
