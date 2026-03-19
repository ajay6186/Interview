import React, { useState } from "react";

// ============================================================
// Exercise 4: Conditional Rendering
// ============================================================
// In this exercise you will learn five different techniques
// for conditional rendering in React: helper functions with
// if/else, ternary operators, logical && operator, switch-case,
// and returning null to hide components.
//
// Instructions:
// 1. Use an if/else helper function to render content
// 2. Use ternary operators inline in JSX
// 3. Use the && operator for simple show/hide logic
// 4. Use switch-case for multi-state rendering
// 5. Return null from a component to render nothing
// ============================================================

// --- Types ---
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

// --- Data ---
const mockUser: User = { name: "Jane Doe", role: "admin", notificationCount: 5 };

const mockDashboardData: DashboardData = {
  totalUsers: 1250,
  activeUsers: 847,
  revenue: "$52,400",
};

// TODO 1: Create a helper function getRoleContent that takes a role string
// and uses if/else to return different JSX:
//   - "admin"  -> <span style={{ color: "red", fontWeight: "bold" }}>Administrator - Full Access</span>
//   - "editor" -> <span style={{ color: "blue" }}>Editor - Can edit content</span>
//   - "viewer" -> <span style={{ color: "gray" }}>Viewer - Read only</span>
//   - default  -> <span>Unknown role</span>
// function getRoleContent(role: string): React.ReactNode { ... }

// TODO 2: Create a RoleBadge component that calls getRoleContent.
// Props: { role: string }
// It should render: <div><strong>Access Level:</strong> {getRoleContent(role)}</div>
// function RoleBadge({ role }: { role: string }) { ... }

// TODO 3: Create a LoginStatus component that uses a ternary operator.
// Props: { isLoggedIn: boolean; userName: string }
// It should render:
//   If isLoggedIn:  <div>Welcome back, <strong>{userName}</strong>! <button>Logout</button></div>
//   If not:         <div>Please <button>Login</button> to continue.</div>
// (The buttons don't need onClick handlers for this exercise)
// function LoginStatus({ isLoggedIn, userName }: ...) { ... }

// TODO 4: Create a NotificationBadge component that uses the && operator.
// Props: { count: number }
// It should render:
//   {count > 0 && <span style={{ background: "red", color: "white", borderRadius: "50%",
//     padding: "2px 8px", fontSize: 12, marginLeft: 8 }}>{count}</span>}
// If count is 0, nothing should be rendered.
// IMPORTANT: Don't write {count && <span>...} because count=0 will render "0" in the DOM.
// Always use a boolean expression like count > 0.
// function NotificationBadge({ count }: { count: number }) { ... }

// TODO 5: Create a StatusDisplay component that uses switch-case.
// Props: { status: RequestStatus; data: DashboardData | null; errorMessage?: string }
// Use a switch statement on status and return different JSX for each case:
//   "idle"    -> <div style={{ color: "gray" }}>Click "Fetch Data" to load the dashboard.</div>
//   "loading" -> <div><div className="spinner" style={{ ... }}>Loading...</div></div>
//     For the spinner, use style: { border: "4px solid #f3f3f3", borderTop: "4px solid #3498db",
//       borderRadius: "50%", width: 30, height: 30, display: "inline-block", marginRight: 8 }
//   "success" -> A <div> showing data.totalUsers, data.activeUsers, data.revenue in <p> tags
//                (assert data is not null since status is success)
//   "error"   -> <div style={{ color: "red", ... }}>Error: {errorMessage || "Something went wrong"}</div>
// function StatusDisplay({ status, data, errorMessage }: ...) { ... }

// TODO 6: Create a WarningBanner component that returns null when not visible.
// Props: { message: string; isVisible: boolean }
// If isVisible is false, return null (component renders nothing).
// If isVisible is true, render:
//   <div style={{ background: "#fff3cd", border: "1px solid #ffc107", padding: 12, borderRadius: 4, marginBottom: 12 }}>
//     <strong>Warning:</strong> {message}
//   </div>
// function WarningBanner({ message, isVisible }: ...) { ... }

export function App() {
  // TODO 7: Set up the following state:
  //   const [isLoggedIn, setIsLoggedIn] = useState(true);
  //   const [status, setStatus] = useState<RequestStatus>("idle");
  //   const [showWarning, setShowWarning] = useState(false);
  //
  // Create a simulateFetch function that:
  //   1. Sets status to "loading"
  //   2. After 1500ms (setTimeout), randomly sets status to "success" or "error" (70% success)
  //
  // Create a reset function that sets status back to "idle"

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Exercise 4: Conditional Rendering</h1>

      {/* TODO 8: Render the full dashboard:
          <WarningBanner message="This is a demo environment" isVisible={showWarning} />
          <button onClick toggle showWarning>Toggle Warning</button>
          <hr />

          <h2>Login Status (Ternary)</h2>
          <LoginStatus isLoggedIn={isLoggedIn} userName={mockUser.name} />
          <button onClick toggle isLoggedIn>Toggle Login State</button>
          <hr />

          Conditionally render the rest only if isLoggedIn using &&:
          {isLoggedIn && (
            <>
              <h2>User Role (if/else helper)</h2>
              <RoleBadge role={mockUser.role} />
              <hr />

              <h2>Notifications (&& operator)</h2>
              <p>Inbox <NotificationBadge count={mockUser.notificationCount} /></p>
              <p>Sent <NotificationBadge count={0} /></p>
              <hr />

              <h2>Dashboard (switch-case)</h2>
              <div style={{ marginBottom: 12 }}>
                <button onClick={simulateFetch} disabled={status === "loading"}>Fetch Data</button>
                <button onClick={reset} style={{ marginLeft: 8 }}>Reset</button>
              </div>
              <StatusDisplay
                status={status}
                data={status === "success" ? mockDashboardData : null}
                errorMessage="Failed to fetch dashboard data"
              />
            </>
          )}
      */}
      <p style={{ color: "gray" }}>Complete the TODOs to see the results here.</p>
    </div>
  );
}
