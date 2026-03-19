import React, { useState, Suspense, lazy, Component, ReactNode } from "react";

// ============================================================
// Solution: Code Splitting with React.lazy & Suspense
// ============================================================

// --- "Heavy" inline components ---

function DashboardContent() {
  return (
    <div style={{ padding: "20px", border: "1px solid #4caf50", borderRadius: "8px" }}>
      <h2>Dashboard</h2>
      <p>Welcome back! Here are your stats:</p>
      <ul>
        <li>Total Users: 1,234</li>
        <li>Active Sessions: 56</li>
        <li>Revenue: $12,345</li>
        <li>Uptime: 99.9%</li>
      </ul>
    </div>
  );
}

function SettingsContent() {
  return (
    <div style={{ padding: "20px", border: "1px solid #2196f3", borderRadius: "8px" }}>
      <h2>Settings</h2>
      <div style={{ marginBottom: "8px" }}>
        <label>Username: </label>
        <input defaultValue="jane_doe" />
      </div>
      <div style={{ marginBottom: "8px" }}>
        <label>Theme: </label>
        <select defaultValue="dark">
          <option value="light">Light</option>
          <option value="dark">Dark</option>
        </select>
      </div>
      <div>
        <label>
          <input type="checkbox" defaultChecked /> Enable notifications
        </label>
      </div>
    </div>
  );
}

function AnalyticsContent() {
  return (
    <div style={{ padding: "20px", border: "1px solid #ff9800", borderRadius: "8px" }}>
      <h2>Analytics</h2>
      <p>Page views this week:</p>
      <div style={{ fontFamily: "monospace", lineHeight: "1.2" }}>
        <div>Mon: {"#".repeat(12)} 120</div>
        <div>Tue: {"#".repeat(15)} 150</div>
        <div>Wed: {"#".repeat(9)} 90</div>
        <div>Thu: {"#".repeat(18)} 180</div>
        <div>Fri: {"#".repeat(22)} 220</div>
        <div>Sat: {"#".repeat(8)} 80</div>
        <div>Sun: {"#".repeat(6)} 60</div>
      </div>
    </div>
  );
}

// --- Lazy-loaded versions with simulated delays ---

const LazyDashboard = lazy(
  () =>
    new Promise<{ default: React.ComponentType }>((resolve) =>
      setTimeout(() => resolve({ default: DashboardContent }), 1500)
    )
);

const LazySettings = lazy(
  () =>
    new Promise<{ default: React.ComponentType }>((resolve) =>
      setTimeout(() => resolve({ default: SettingsContent }), 1000)
    )
);

const LazyAnalytics = lazy(
  () =>
    new Promise<{ default: React.ComponentType }>((resolve) =>
      setTimeout(() => resolve({ default: AnalyticsContent }), 2000)
    )
);

// --- A component that always fails to load ---

const LazyFailing = lazy(
  () =>
    new Promise<{ default: React.ComponentType }>((_, reject) =>
      setTimeout(() => reject(new Error("Network error: Failed to fetch module")), 1000)
    )
);

// --- ErrorBoundary ---

interface ErrorBoundaryProps {
  children: ReactNode;
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

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Caught error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            padding: "20px",
            border: "2px solid red",
            borderRadius: "8px",
            backgroundColor: "#fff0f0",
          }}
        >
          <h3 style={{ color: "red" }}>Something went wrong</h3>
          <p>{this.state.error?.message}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// --- Main App ---

type Tab = "dashboard" | "settings" | "analytics" | "broken";

const tabButtonStyle = (isActive: boolean): React.CSSProperties => ({
  padding: "8px 16px",
  marginRight: "4px",
  border: "1px solid #ccc",
  borderBottom: isActive ? "none" : "1px solid #ccc",
  borderRadius: "4px 4px 0 0",
  backgroundColor: isActive ? "#fff" : "#f0f0f0",
  fontWeight: isActive ? "bold" : "normal",
  cursor: "pointer",
});

export function App() {
  const [activeTab, setActiveTab] = useState<Tab>("dashboard");

  function renderTabContent() {
    switch (activeTab) {
      case "dashboard":
        return <LazyDashboard />;
      case "settings":
        return <LazySettings />;
      case "analytics":
        return <LazyAnalytics />;
      case "broken":
        return <LazyFailing />;
    }
  }

  return (
    <div>
      <h1>Exercise: Code Splitting & Lazy Loading</h1>

      {/* Tab navigation */}
      <div style={{ marginBottom: "0", borderBottom: "1px solid #ccc" }}>
        <button
          style={tabButtonStyle(activeTab === "dashboard")}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          style={tabButtonStyle(activeTab === "settings")}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
        <button
          style={tabButtonStyle(activeTab === "analytics")}
          onClick={() => setActiveTab("analytics")}
        >
          Analytics
        </button>
        <button
          style={tabButtonStyle(activeTab === "broken")}
          onClick={() => setActiveTab("broken")}
        >
          Broken Tab
        </button>
      </div>

      {/* Lazy content with error boundary and suspense */}
      <div style={{ padding: "16px", border: "1px solid #ccc", borderTop: "none" }}>
        <ErrorBoundary key={activeTab}>
          <Suspense
            fallback={
              <div style={{ padding: "20px", textAlign: "center" }}>
                Loading tab content...
              </div>
            }
          >
            {renderTabContent()}
          </Suspense>
        </ErrorBoundary>
      </div>

      <p style={{ fontSize: "0.85em", color: "#666", marginTop: "12px" }}>
        Each tab simulates a lazy-loaded component with a delay. The "Broken Tab"
        simulates a failed load to demonstrate ErrorBoundary.
      </p>
    </div>
  );
}
