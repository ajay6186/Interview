import React, { useEffect, useRef, useState, ComponentType } from "react";

// ============================================================
// Exercise: Higher-Order Components (HOCs)
// ============================================================
// A Higher-Order Component is a function that takes a component
// and returns a new component with enhanced behavior. HOCs are
// a pattern for reusing component logic. They don't modify the
// original component; they wrap it.
//
// Instructions:
// 1. Create a withLogger HOC that logs when the wrapped
//    component mounts, unmounts, and updates (re-renders).
// 2. Create a withLoadingSpinner HOC that shows "Loading..."
//    when a `loading` prop is true.
// 3. Create a withAuth HOC that shows "Access Denied" when
//    an `isAuthenticated` prop is false.
// 4. Create a base UserProfile component.
// 5. Compose multiple HOCs onto the same component.
// 6. Set displayName on each wrapped component.
// ============================================================

// TODO 1: Create the withLogger HOC
// - It should accept a component (WrappedComponent) and return
//   a new component.
// - On mount: console.log(`[Logger] <ComponentName> mounted`)
// - On unmount: console.log(`[Logger] <ComponentName> unmounted`)
// - On every render: console.log(`[Logger] <ComponentName> rendered`)
//   (use useRef to track render count)
// - Use useEffect for mount/unmount logging.
// - Set displayName to `WithLogger(${name})`.
// - Pass all props through to WrappedComponent.
//
// function withLogger<P extends object>(WrappedComponent: ComponentType<P>) {
//   function WithLogger(props: P) { ... }
//   WithLogger.displayName = `WithLogger(${WrappedComponent.displayName || WrappedComponent.name || "Component"})`;
//   return WithLogger;
// }

// TODO 2: Create the withLoadingSpinner HOC
// - It should accept a component and return a new component.
// - The returned component accepts all the original props PLUS
//   a `loading: boolean` prop.
// - If loading is true, render <div>Loading...</div> instead
//   of the wrapped component.
// - If loading is false, render WrappedComponent with all
//   props except `loading`.
// - Set displayName to `WithLoading(${name})`.
//
// function withLoadingSpinner<P extends object>(WrappedComponent: ComponentType<P>) {
//   function WithLoading(props: P & { loading: boolean }) { ... }
//   WithLoading.displayName = ...;
//   return WithLoading;
// }

// TODO 3: Create the withAuth HOC
// - It should accept a component and return a new component.
// - The returned component accepts all original props PLUS
//   `isAuthenticated: boolean`.
// - If not authenticated, render:
//   <div style={{ color: "red" }}>Access Denied. Please log in.</div>
// - Otherwise render the WrappedComponent with all props
//   except `isAuthenticated`.
// - Set displayName to `WithAuth(${name})`.
//
// function withAuth<P extends object>(WrappedComponent: ComponentType<P>) { ... }

// TODO 4: Create a UserProfile component
// Props: { username: string; email: string }
// Render the username and email in a simple card-like div.
//
// function UserProfile({ username, email }: { username: string; email: string }) { ... }

// TODO 5: Compose HOCs — create an EnhancedUserProfile
// Apply withLogger, withLoadingSpinner, and withAuth to
// UserProfile. Order: withAuth(withLoadingSpinner(withLogger(UserProfile)))
// This means the outermost wrapper checks auth first, then
// loading, then the inner component gets logging.
//
// const EnhancedUserProfile = withAuth(withLoadingSpinner(withLogger(UserProfile)));

export function App() {
  // TODO 6: Create state for `isAuthenticated` (boolean, default false)
  // const [isAuthenticated, setIsAuthenticated] = useState(false);

  // TODO 7: Create state for `loading` (boolean, default false)
  // const [loading, setLoading] = useState(false);

  // TODO 8: Create state for `showProfile` (boolean, default true)
  // This lets us toggle the component to observe mount/unmount logs.
  // const [showProfile, setShowProfile] = useState(true);

  return (
    <div>
      <h1>Exercise: Higher-Order Components</h1>

      {/* TODO 9: Add toggle buttons
          - "Toggle Auth" — flips isAuthenticated
          - "Toggle Loading" — flips loading
          - "Toggle Mount" — flips showProfile (to see mount/unmount logs) */}

      {/* TODO 10: Display the current state values for debugging
          <p>Authenticated: {String(isAuthenticated)} | Loading: {String(loading)}</p> */}

      {/* TODO 11: Render EnhancedUserProfile conditionally
          {showProfile && (
            <EnhancedUserProfile
              username="Jane Doe"
              email="jane@example.com"
              isAuthenticated={isAuthenticated}
              loading={loading}
            />
          )} */}

      {/* TODO 12: Display the displayName of EnhancedUserProfile
          <p>displayName: {EnhancedUserProfile.displayName}</p> */}
    </div>
  );
}
