import React, { useState, useContext, createContext, useCallback } from "react";

// ============================================================
// Solution: Authentication Flow
// ============================================================
// A complete authentication system using React Context with
// login/logout, protected routes, and conditional rendering.
// ============================================================

// User type
type User = {
  id: number;
  username: string;
  displayName: string;
  role: string;
};

// Auth context type
type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
};

// 1. Create the context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// 2. Simulate login API
function simulateLoginApi(username: string, password: string): Promise<User> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (username === "admin" && password === "password123") {
        resolve({
          id: 1,
          username: "admin",
          displayName: "Admin User",
          role: "Administrator",
        });
      } else {
        reject(new Error("Invalid credentials. Please try again."));
      }
    }, 1000);
  });
}

// 3. AuthProvider component
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const loggedInUser = await simulateLoginApi(username, password);
      setUser(loggedInUser);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setError(null);
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated: user !== null,
    login,
    logout,
    isLoading,
    error,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// 4. useAuth hook
function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// 5. LoginForm component
function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading, error } = useAuth();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(username, password);
  };

  return (
    <div
      style={{
        maxWidth: "360px",
        margin: "40px auto",
        padding: "32px",
        border: "1px solid #e0e0e0",
        borderRadius: "12px",
        backgroundColor: "#fafafa",
      }}
    >
      <h2 style={{ margin: "0 0 24px 0", textAlign: "center" }}>Sign In</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "16px" }}>
          <label
            style={{ display: "block", marginBottom: "4px", fontSize: "14px", color: "#555" }}
          >
            Username
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            disabled={isLoading}
            placeholder="Enter username"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>
        <div style={{ marginBottom: "20px" }}>
          <label
            style={{ display: "block", marginBottom: "4px", fontSize: "14px", color: "#555" }}
          >
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            placeholder="Enter password"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #ccc",
              borderRadius: "6px",
              fontSize: "14px",
              boxSizing: "border-box",
            }}
          />
        </div>
        {error && (
          <div
            style={{
              padding: "10px",
              marginBottom: "16px",
              backgroundColor: "#fef2f2",
              border: "1px solid #fca5a5",
              borderRadius: "6px",
              color: "#dc2626",
              fontSize: "14px",
            }}
          >
            {error}
          </div>
        )}
        <button
          type="submit"
          disabled={isLoading || !username || !password}
          style={{
            width: "100%",
            padding: "10px",
            backgroundColor: isLoading || !username || !password ? "#94a3b8" : "#3b82f6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: isLoading ? "not-allowed" : "pointer",
            fontSize: "15px",
            fontWeight: "bold",
          }}
        >
          {isLoading ? "Signing in..." : "Sign In"}
        </button>
      </form>
      <p style={{ marginTop: "16px", fontSize: "12px", color: "#999", textAlign: "center" }}>
        Hint: admin / password123
      </p>
    </div>
  );
}

// 6. NavBar component
function NavBar() {
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "12px 20px",
        backgroundColor: "#1e293b",
        color: "white",
        borderRadius: "8px",
        marginBottom: "20px",
      }}
    >
      <span style={{ fontWeight: "bold", fontSize: "18px" }}>MyApp</span>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        {isAuthenticated && user ? (
          <>
            <span style={{ fontSize: "14px", color: "#94a3b8" }}>
              Welcome, <strong style={{ color: "#e2e8f0" }}>{user.displayName}</strong>
            </span>
            <button
              onClick={logout}
              style={{
                padding: "6px 16px",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Logout
            </button>
          </>
        ) : (
          <span style={{ fontSize: "14px", color: "#94a3b8" }}>Not logged in</span>
        )}
      </div>
    </nav>
  );
}

// 7. ProtectedRoute component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>
        Checking authentication...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginForm />;
  }

  return <>{children}</>;
}

// 8. Dashboard component
function Dashboard() {
  const { user } = useAuth();

  if (!user) return null;

  const stats = [
    { label: "Projects", value: 12, color: "#3b82f6" },
    { label: "Tasks", value: 47, color: "#10b981" },
    { label: "Messages", value: 8, color: "#f59e0b" },
    { label: "Reports", value: 3, color: "#8b5cf6" },
  ];

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ margin: "0 0 4px 0" }}>Welcome back, {user.displayName}!</h2>
        <p style={{ margin: 0, color: "#666" }}>
          Role: <strong>{user.role}</strong>
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              padding: "20px",
              borderRadius: "10px",
              backgroundColor: "white",
              border: "1px solid #e0e0e0",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: "32px", fontWeight: "bold", color: stat.color }}>
              {stat.value}
            </div>
            <div style={{ fontSize: "14px", color: "#666", marginTop: "4px" }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          marginTop: "24px",
          padding: "20px",
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "10px",
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", color: "#166534" }}>Recent Activity</h3>
        <ul style={{ margin: 0, paddingLeft: "20px", color: "#555" }}>
          <li>Completed task "Update homepage design"</li>
          <li>Added comment on "API Integration" project</li>
          <li>Created new report "Q1 Summary"</li>
        </ul>
      </div>
    </div>
  );
}

// 9. App wiring everything together
export function App() {
  return (
    <AuthProvider>
      <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "800px" }}>
        <h1>Exercise: Authentication Flow</h1>
        <NavBar />
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      </div>
    </AuthProvider>
  );
}
