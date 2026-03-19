import React, { useState, useContext, createContext, useCallback } from "react";

// ============================================================
// Exercise: Authentication Flow
// ============================================================
// Build a complete authentication system using React Context.
// Implement login/logout, protected routes, and conditional
// rendering based on auth state. This mirrors real-world auth
// patterns used in production React applications.
//
// Instructions:
// 1. Create an AuthContext with user state and auth actions
// 2. Build an AuthProvider that manages auth state
// 3. Create a useAuth hook for consuming the context
// 4. Build a LoginForm with username/password inputs
// 5. Build a ProtectedRoute wrapper component
// 6. Build a Dashboard visible only to logged-in users
// 7. Build a NavBar with conditional Login/Logout button
// 8. Simulate an async login API call
// ============================================================

// Valid credentials for the simulated API
// Username: "admin"  Password: "password123"

// TODO 1: Define the User type
// - id: number
// - username: string
// - displayName: string
// - role: string
type User = unknown;

// TODO 2: Define the AuthContextType
// - user: User | null
// - isAuthenticated: boolean
// - login: (username: string, password: string) => Promise<void>
// - logout: () => void
// - isLoading: boolean
// - error: string | null
type AuthContextType = unknown;

// TODO 3: Create the AuthContext using createContext
// Initialize with undefined and cast appropriately
// const AuthContext = createContext<AuthContextType | undefined>(undefined);

// TODO 4: Create a simulateLoginApi function
// - Accept username and password parameters
// - Return a Promise that resolves after 1000ms
// - If credentials match ("admin" / "password123"), resolve with a User object
// - Otherwise, reject with Error("Invalid credentials")
function simulateLoginApi(username: string, password: string): Promise<unknown> {
  return Promise.resolve(null);
}

// TODO 5: Create the AuthProvider component
// - Manage state: user (User | null), isLoading (boolean), error (string | null)
// - Implement login function that:
//   a) Sets isLoading to true, clears error
//   b) Calls simulateLoginApi
//   c) On success: sets the user
//   d) On failure: sets the error message
//   e) Sets isLoading to false in both cases
// - Implement logout function that sets user to null
// - Derive isAuthenticated from user !== null
// - Provide all values through AuthContext.Provider
function AuthProvider({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

// TODO 6: Create the useAuth hook
// - Call useContext(AuthContext)
// - Throw an error if used outside of AuthProvider
// - Return the context value
function useAuth(): any {
  return {
    user: null,
    isAuthenticated: false,
    login: async () => {},
    logout: () => {},
    isLoading: false,
    error: null,
  };
}

// TODO 7: Create the LoginForm component
// - Two controlled inputs: username and password
// - A submit button that calls login(username, password)
// - Display error message if login fails
// - Disable form while isLoading is true
// - Show loading text on button while logging in
function LoginForm() {
  return (
    <div>
      <h2>Login</h2>
      <p>Login form placeholder</p>
    </div>
  );
}

// TODO 8: Create the NavBar component
// - Show app title on the left
// - On the right, show either:
//   a) User's display name + "Logout" button (if authenticated)
//   b) Nothing or "Not logged in" (if not authenticated)
function NavBar() {
  return (
    <nav>
      <span>My App</span>
    </nav>
  );
}

// TODO 9: Create the ProtectedRoute component
// - Accept children as a prop
// - If user is authenticated, render the children
// - If not authenticated, render the LoginForm instead
// - While auth is loading, show a loading indicator
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

// TODO 10: Create the Dashboard component
// - Show a welcome message with the user's display name
// - Show the user's role
// - Display some fake dashboard content (stats, cards, etc.)
function Dashboard() {
  return (
    <div>
      <h2>Dashboard</h2>
      <p>Dashboard placeholder</p>
    </div>
  );
}

// TODO 11: Wire everything together in App
// - Wrap everything in AuthProvider
// - Render NavBar at the top
// - Render ProtectedRoute wrapping Dashboard
// - Add a hint showing valid credentials
export function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Exercise: Authentication Flow</h1>
      <p>Implement the auth context, provider, and all components.</p>
    </div>
  );
}
