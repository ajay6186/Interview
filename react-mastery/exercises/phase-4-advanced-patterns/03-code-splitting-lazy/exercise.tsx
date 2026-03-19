import React, { useState, Suspense, lazy, Component, ReactNode } from "react";

// ============================================================
// Exercise: Code Splitting with React.lazy & Suspense
// ============================================================
// React.lazy lets you defer loading a component's code until
// it is first rendered. Combined with Suspense, you can show
// a fallback UI while the lazy component loads.
//
// Since we can't use real dynamic imports in this single-file
// exercise, we simulate lazy loading with:
//   React.lazy(() => new Promise(resolve =>
//     setTimeout(() => resolve({ default: MyComponent }), delay)
//   ))
//
// Instructions:
// 1. Create three "heavy" tab-content components inline.
// 2. Create lazy-loaded versions using the simulated pattern.
// 3. Create an ErrorBoundary for handling failed loads.
// 4. Build a tab-based UI that lazy-loads each tab's content
//    on first click.
// 5. Wrap lazy components in Suspense with a fallback.
// ============================================================

// TODO 1: Create a DashboardContent component
// It should render a div with some dashboard placeholder text
// and a few stats items (just hardcoded).
// function DashboardContent() { ... }

// TODO 2: Create a SettingsContent component
// It should render a div with a few mock settings fields.
// function SettingsContent() { ... }

// TODO 3: Create an AnalyticsContent component
// It should render a div with a mock chart (text placeholder).
// function AnalyticsContent() { ... }

// TODO 4: Create lazy-loaded versions of each component
// Use this pattern to simulate a network delay:
//   const LazyDashboard = lazy(() =>
//     new Promise<{ default: React.ComponentType }>(resolve =>
//       setTimeout(() => resolve({ default: DashboardContent }), 1500)
//     )
//   );
// Create LazyDashboard, LazySettings, LazyAnalytics with
// different delays (e.g., 1500ms, 1000ms, 2000ms).

// TODO 5: Create a FailingComponent that always throws an error
// function FailingComponent() { throw new Error("Failed to load!"); }

// TODO 6: Create a lazy version that simulates a failed load
// const LazyFailing = lazy(() =>
//   new Promise<{ default: React.ComponentType }>((_, reject) =>
//     setTimeout(() => reject(new Error("Network error")), 1000)
//   )
// );

// TODO 7: Create an ErrorBoundary class component
// - State: { hasError: boolean; error: Error | null }
// - static getDerivedStateFromError(error): return { hasError: true, error }
// - componentDidCatch(error, info): console.error the error
// - render(): if hasError, show the error message and a
//   "Retry" button that resets state to { hasError: false, error: null }
// - Props should include `children: ReactNode`
//
// class ErrorBoundary extends Component<
//   { children: ReactNode },
//   { hasError: boolean; error: Error | null }
// > { ... }

export function App() {
  // TODO 8: Create state for the active tab
  // type Tab = "dashboard" | "settings" | "analytics" | "broken";
  // const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  // TODO 9: Create a renderTabContent function that returns
  // the correct lazy component based on activeTab:
  // - "dashboard" -> <LazyDashboard />
  // - "settings"  -> <LazySettings />
  // - "analytics" -> <LazyAnalytics />
  // - "broken"    -> <LazyFailing />
  // function renderTabContent() { ... }

  return (
    <div>
      <h1>Exercise: Code Splitting & Lazy Loading</h1>

      {/* TODO 10: Create tab navigation buttons
          Four buttons: Dashboard, Settings, Analytics, Broken Tab
          Style the active tab differently (e.g., bold or different background).
          Each button sets activeTab on click. */}

      {/* TODO 11: Wrap renderTabContent() in an ErrorBoundary
          and a Suspense boundary.
          - Suspense fallback: <div>Loading tab content...</div>
          - ErrorBoundary wraps the Suspense so it catches both
            render errors and lazy-load rejections.
          - IMPORTANT: Use `key={activeTab}` on the ErrorBoundary
            so that switching tabs resets any error state.

          <ErrorBoundary key={activeTab}>
            <Suspense fallback={<div>Loading tab content...</div>}>
              {renderTabContent()}
            </Suspense>
          </ErrorBoundary>
      */}
    </div>
  );
}
