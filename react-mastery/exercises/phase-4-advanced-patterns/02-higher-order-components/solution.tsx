import React, { useEffect, useRef, useState, ComponentType } from "react";

// ============================================================
// Solution: Higher-Order Components (HOCs)
// ============================================================

// --- withLogger HOC ---
function withLogger<P extends object>(WrappedComponent: ComponentType<P>) {
  function WithLogger(props: P) {
    const renderCount = useRef(0);
    renderCount.current += 1;

    const name =
      WrappedComponent.displayName || WrappedComponent.name || "Component";

    console.log(`[Logger] <${name}> rendered (count: ${renderCount.current})`);

    useEffect(() => {
      console.log(`[Logger] <${name}> mounted`);
      return () => {
        console.log(`[Logger] <${name}> unmounted`);
      };
    }, [name]);

    return <WrappedComponent {...props} />;
  }

  WithLogger.displayName = `WithLogger(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
  return WithLogger;
}

// --- withLoadingSpinner HOC ---
function withLoadingSpinner<P extends object>(
  WrappedComponent: ComponentType<P>
) {
  function WithLoading(props: P & { loading: boolean }) {
    const { loading, ...rest } = props as any;

    if (loading) {
      return (
        <div
          style={{
            padding: "20px",
            textAlign: "center",
            fontSize: "1.2em",
          }}
        >
          Loading...
        </div>
      );
    }

    return <WrappedComponent {...(rest as P)} />;
  }

  WithLoading.displayName = `WithLoading(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
  return WithLoading;
}

// --- withAuth HOC ---
function withAuth<P extends object>(WrappedComponent: ComponentType<P>) {
  function WithAuth(props: P & { isAuthenticated: boolean }) {
    const { isAuthenticated, ...rest } = props as any;

    if (!isAuthenticated) {
      return (
        <div
          style={{
            color: "red",
            padding: "20px",
            border: "1px solid red",
            borderRadius: "4px",
          }}
        >
          Access Denied. Please log in.
        </div>
      );
    }

    return <WrappedComponent {...(rest as P)} />;
  }

  WithAuth.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
  return WithAuth;
}

// --- Base UserProfile component ---
function UserProfile({
  username,
  email,
}: {
  username: string;
  email: string;
}) {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: "8px",
        padding: "16px",
        maxWidth: "300px",
      }}
    >
      <h3>User Profile</h3>
      <p>
        <strong>Name:</strong> {username}
      </p>
      <p>
        <strong>Email:</strong> {email}
      </p>
    </div>
  );
}

// --- Compose HOCs ---
// Auth is checked first (outermost), then loading, then logging
const EnhancedUserProfile = withAuth(
  withLoadingSpinner(withLogger(UserProfile))
);

export function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showProfile, setShowProfile] = useState(true);

  return (
    <div>
      <h1>Exercise: Higher-Order Components</h1>

      <div style={{ marginBottom: "16px" }}>
        <button onClick={() => setIsAuthenticated((a) => !a)}>
          Toggle Auth
        </button>
        <button
          onClick={() => setLoading((l) => !l)}
          style={{ marginLeft: "8px" }}
        >
          Toggle Loading
        </button>
        <button
          onClick={() => setShowProfile((s) => !s)}
          style={{ marginLeft: "8px" }}
        >
          Toggle Mount
        </button>
      </div>

      <p>
        Authenticated: {String(isAuthenticated)} | Loading:{" "}
        {String(loading)} | Mounted: {String(showProfile)}
      </p>

      {showProfile && (
        <EnhancedUserProfile
          username="Jane Doe"
          email="jane@example.com"
          isAuthenticated={isAuthenticated}
          loading={loading}
        />
      )}

      <p style={{ marginTop: "16px", fontStyle: "italic" }}>
        displayName: {EnhancedUserProfile.displayName}
      </p>

      <p style={{ fontSize: "0.85em", color: "#666", marginTop: "12px" }}>
        Open the browser console to see mount/unmount/render logs.
      </p>
    </div>
  );
}
