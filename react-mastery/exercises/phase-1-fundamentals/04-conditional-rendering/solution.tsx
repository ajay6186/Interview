import React, { useState } from "react";

// ============================================================
// Exercise 4: Conditional Rendering (SOLUTION)
// ============================================================

type User = {
  name: string;
  role: "admin" | "editor" | "viewer";
  notificationCount: number;
};

type RequestStatus = "idle" | "loading" | "success" | "error";

type DashboardData = {
  totalUsers: number;
  activeUsers: number;
  revenue: string;
};

const mockUser: User = { name: "Jane Doe", role: "admin", notificationCount: 5 };

const mockDashboardData: DashboardData = {
  totalUsers: 1250,
  activeUsers: 847,
  revenue: "$52,400",
};

// SOLUTION 1: if/else helper function
function getRoleContent(role: string): React.ReactNode {
  if (role === "admin") {
    return <span style={{ color: "red", fontWeight: "bold" }}>Administrator - Full Access</span>;
  } else if (role === "editor") {
    return <span style={{ color: "blue" }}>Editor - Can edit content</span>;
  } else if (role === "viewer") {
    return <span style={{ color: "gray" }}>Viewer - Read only</span>;
  } else {
    return <span>Unknown role</span>;
  }
}

// SOLUTION 2: Component using the helper
function RoleBadge({ role }: { role: string }) {
  return (
    <div>
      <strong>Access Level:</strong> {getRoleContent(role)}
    </div>
  );
}

// SOLUTION 3: Ternary operator for conditional rendering
function LoginStatus({
  isLoggedIn,
  userName,
  onToggle,
}: {
  isLoggedIn: boolean;
  userName: string;
  onToggle: () => void;
}) {
  return isLoggedIn ? (
    <div>
      Welcome back, <strong>{userName}</strong>!{" "}
      <button onClick={onToggle}>Logout</button>
    </div>
  ) : (
    <div>
      Please <button onClick={onToggle}>Login</button> to continue.
    </div>
  );
}

// SOLUTION 4: && operator (note: count > 0, not just count)
function NotificationBadge({ count }: { count: number }) {
  return (
    <>
      {count > 0 && (
        <span
          style={{
            background: "red",
            color: "white",
            borderRadius: "50%",
            padding: "2px 8px",
            fontSize: 12,
            marginLeft: 8,
          }}
        >
          {count}
        </span>
      )}
    </>
  );
}

// SOLUTION 5: Switch-case rendering
function StatusDisplay({
  status,
  data,
  errorMessage,
}: {
  status: RequestStatus;
  data: DashboardData | null;
  errorMessage?: string;
}) {
  switch (status) {
    case "idle":
      return (
        <div style={{ color: "gray", padding: 16 }}>
          Click "Fetch Data" to load the dashboard.
        </div>
      );

    case "loading":
      return (
        <div style={{ padding: 16, display: "flex", alignItems: "center" }}>
          <div
            style={{
              border: "4px solid #f3f3f3",
              borderTop: "4px solid #3498db",
              borderRadius: "50%",
              width: 30,
              height: 30,
              display: "inline-block",
              marginRight: 8,
            }}
          />
          Loading...
        </div>
      );

    case "success":
      return (
        <div
          style={{
            padding: 16,
            background: "#d4edda",
            borderRadius: 8,
          }}
        >
          <h3 style={{ marginTop: 0, color: "#155724" }}>Dashboard Data</h3>
          <p>Total Users: <strong>{data!.totalUsers}</strong></p>
          <p>Active Users: <strong>{data!.activeUsers}</strong></p>
          <p>Revenue: <strong>{data!.revenue}</strong></p>
        </div>
      );

    case "error":
      return (
        <div
          style={{
            padding: 16,
            background: "#f8d7da",
            borderRadius: 8,
            color: "#721c24",
          }}
        >
          <strong>Error:</strong> {errorMessage || "Something went wrong"}
        </div>
      );
  }
}

// SOLUTION 6: Returning null to hide a component
function WarningBanner({ message, isVisible }: { message: string; isVisible: boolean }) {
  if (!isVisible) {
    return null;
  }

  return (
    <div
      style={{
        background: "#fff3cd",
        border: "1px solid #ffc107",
        padding: 12,
        borderRadius: 4,
        marginBottom: 12,
      }}
    >
      <strong>Warning:</strong> {message}
    </div>
  );
}

// SOLUTION 7 & 8: App with state and all conditional rendering patterns
export function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [status, setStatus] = useState<RequestStatus>("idle");
  const [showWarning, setShowWarning] = useState(false);

  const simulateFetch = () => {
    setStatus("loading");
    setTimeout(() => {
      const isSuccess = Math.random() > 0.3;
      setStatus(isSuccess ? "success" : "error");
    }, 1500);
  };

  const reset = () => {
    setStatus("idle");
  };

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Exercise 4: Conditional Rendering</h1>

      {/* Null rendering pattern */}
      <WarningBanner message="This is a demo environment" isVisible={showWarning} />
      <button
        onClick={() => setShowWarning((prev) => !prev)}
        style={{ marginBottom: 16, padding: "6px 12px" }}
      >
        Toggle Warning
      </button>
      <hr />

      {/* Ternary rendering */}
      <h2>Login Status (Ternary)</h2>
      <LoginStatus
        isLoggedIn={isLoggedIn}
        userName={mockUser.name}
        onToggle={() => setIsLoggedIn((prev) => !prev)}
      />
      <button
        onClick={() => setIsLoggedIn((prev) => !prev)}
        style={{ marginTop: 8, padding: "6px 12px" }}
      >
        Toggle Login State
      </button>
      <hr />

      {/* && operator for conditional block */}
      {isLoggedIn && (
        <>
          <h2>User Role (if/else helper)</h2>
          <RoleBadge role={mockUser.role} />
          <hr />

          <h2>Notifications (&& operator)</h2>
          <p>
            Inbox
            <NotificationBadge count={mockUser.notificationCount} />
          </p>
          <p>
            Sent
            <NotificationBadge count={0} />
          </p>
          <hr />

          <h2>Dashboard (switch-case)</h2>
          <div style={{ marginBottom: 12 }}>
            <button
              onClick={simulateFetch}
              disabled={status === "loading"}
              style={{ padding: "6px 12px" }}
            >
              Fetch Data
            </button>
            <button
              onClick={reset}
              style={{ marginLeft: 8, padding: "6px 12px" }}
            >
              Reset
            </button>
          </div>
          <StatusDisplay
            status={status}
            data={status === "success" ? mockDashboardData : null}
            errorMessage="Failed to fetch dashboard data"
          />
        </>
      )}
    </div>
  );
}
