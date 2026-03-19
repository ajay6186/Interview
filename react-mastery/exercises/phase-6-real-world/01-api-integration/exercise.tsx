import React, { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// Exercise: API Integration
// ============================================================
// Build a custom useFetch hook and a complete data-fetching UI.
// Learn to manage loading, error, and success states, handle
// race conditions by aborting stale requests, and provide
// refresh and retry capabilities.
//
// Instructions:
// 1. Create a fake API function that returns data after a delay
// 2. Build a useFetch custom hook with loading/error/data states
// 3. Handle race conditions (abort previous request on new one)
// 4. Show a loading spinner while data is being fetched
// 5. Show an error state with a retry button
// 6. Display fetched data in a styled list
// 7. Implement a refresh button to re-fetch data
// ============================================================

// Fake user data to simulate an API response
interface User {
  id: number;
  name: string;
  email: string;
  role: string;
}

const FAKE_USERS: User[] = [
  { id: 1, name: "Alice Johnson", email: "alice@example.com", role: "Admin" },
  { id: 2, name: "Bob Smith", email: "bob@example.com", role: "Editor" },
  { id: 3, name: "Carol Williams", email: "carol@example.com", role: "Viewer" },
  { id: 4, name: "Dave Brown", email: "dave@example.com", role: "Editor" },
  { id: 5, name: "Eve Davis", email: "eve@example.com", role: "Admin" },
];

// TODO 1: Create a fakeApiCall function
// - Accept a parameter `shouldFail` (boolean, default false)
// - Return a Promise that resolves after 1500ms with FAKE_USERS
// - If shouldFail is true, reject the promise with an Error("Network error")
// - The function should accept an AbortSignal parameter for cancellation
// - If the signal is aborted before the timeout completes, reject with "Aborted"
function fakeApiCall(shouldFail?: boolean, signal?: AbortSignal): Promise<User[]> {
  // Replace this with a real implementation
  return Promise.resolve([]);
}

// TODO 2: Create a useFetch custom hook
// - It should accept a `url` string parameter (we'll use it as a key, not a real URL)
// - Manage three state values: data (User[] | null), loading (boolean), error (string | null)
// - Use a requestId ref to track the current request and detect stale responses
// - Provide a `fetchData` function that:
//   a) Sets loading to true, error to null
//   b) Increments the requestId
//   c) Calls fakeApiCall with an AbortSignal
//   d) On success: only update state if this is still the current request
//   e) On failure: only update error state if this is still the current request
// - Call fetchData on mount and when the url changes
// - Return { data, loading, error, refetch: fetchData }
function useFetch(url: string) {
  const data: User[] | null = null;
  const loading = false;
  const error: string | null = null;
  const refetch = () => {};

  // TODO: Implement the hook logic here

  return { data, loading, error, refetch };
}

// TODO 3: Create a LoadingSpinner component
// - Display a spinning animation or "Loading..." text
// - Style it to be centered
function LoadingSpinner() {
  return <div>Loading...</div>;
}

// TODO 4: Create an ErrorDisplay component
// - Accept props: message (string) and onRetry (function)
// - Display the error message in red
// - Show a "Retry" button that calls onRetry
function ErrorDisplay({ message, onRetry }: { message: string; onRetry: () => void }) {
  return <div>{message}</div>;
}

// TODO 5: Create a UserList component
// - Accept props: users (User[])
// - Render each user in a styled card/row showing name, email, and role
// - Add alternating row colors for readability
function UserList({ users }: { users: User[] }) {
  return <div>User list placeholder</div>;
}

// TODO 6: Create a SimulateErrorToggle component
// - Accept props: simulateError (boolean) and onToggle (function)
// - Render a checkbox that lets the user toggle simulated API failures
function SimulateErrorToggle({
  simulateError,
  onToggle,
}: {
  simulateError: boolean;
  onToggle: () => void;
}) {
  return <div>Error toggle placeholder</div>;
}

// TODO 7: Wire everything together in the App component
// - Use the useFetch hook
// - Add a simulateError state
// - Show LoadingSpinner when loading
// - Show ErrorDisplay when there's an error
// - Show UserList when data is available
// - Add a "Refresh" button that calls refetch
// - Add the SimulateErrorToggle
// - Show a request counter that increments on each fetch
export function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Exercise: API Integration</h1>
      <p>Implement the useFetch hook and all supporting components.</p>
    </div>
  );
}
