import React, { useState, useEffect, useRef, useCallback } from "react";

// ============================================================
// Exercise: Custom Hooks — Reusable Stateful Logic
// ============================================================
// Custom hooks let you extract and share stateful logic between
// components. Every custom hook name starts with "use".
//
// Instructions:
// 1. Implement useLocalStorage — persists state to localStorage
// 2. Implement useFetch — fetches data with loading/error states
//    (uses setTimeout to simulate network delay)
// 3. Implement useDebounce — debounces a rapidly-changing value
// 4. Implement useToggle — simple boolean toggle
// 5. Implement useWindowSize — tracks window width & height
// 6. Build an App that exercises all five hooks
// ============================================================

// TODO 1: useLocalStorage<T>(key: string, initialValue: T)
// - Read from localStorage on mount (JSON.parse)
// - Return [value, setValue] just like useState
// - Whenever setValue is called, also write to localStorage
// - Handle JSON parse errors gracefully (fall back to initial)
// function useLocalStorage<T>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] { ... }

// TODO 2: useFetch<T>(url: string)
// - Returns { data: T | null; loading: boolean; error: string | null }
// - On mount (and whenever url changes), start loading
// - Simulate a network request: use setTimeout (1 second delay)
//   then resolve with fake data based on the url
// - Handle cleanup: if url changes before timeout fires,
//   cancel the previous timeout
// - For the simulation, return something like:
//   { id: 1, name: url } as the data
// interface FetchState<T> { data: T | null; loading: boolean; error: string | null; }
// function useFetch<T>(url: string): FetchState<T> { ... }

// TODO 3: useDebounce<T>(value: T, delayMs: number)
// - Returns the debounced version of `value`
// - Only updates the returned value after `delayMs` of inactivity
// - Cleanup timeout on unmount or when value/delay changes
// function useDebounce<T>(value: T, delayMs: number): T { ... }

// TODO 4: useToggle(initialValue?: boolean)
// - Returns [value, toggle, setDirectly]
// - toggle() flips the boolean
// - setDirectly(v: boolean) sets it to a specific value
// function useToggle(initialValue?: boolean): [boolean, () => void, (v: boolean) => void] { ... }

// TODO 5: useWindowSize()
// - Returns { width: number; height: number }
// - Listen to the "resize" event on window
// - Cleanup the event listener on unmount
// - Initialize with current window.innerWidth / innerHeight
// function useWindowSize(): { width: number; height: number } { ... }

// TODO 6: LocalStorageDemo — uses useLocalStorage
// - Store a "username" in localStorage
// - Input field to update it
// - Show that the value persists across re-mounts
// function LocalStorageDemo() { ... }

// TODO 7: FetchDemo — uses useFetch
// - Let user type a URL (or pick from a list)
// - Show loading spinner, data, or error
// function FetchDemo() { ... }

// TODO 8: DebounceDemo — uses useDebounce
// - Input field for a search query
// - Show the raw value and the debounced value
// - Debounce by 500ms
// function DebounceDemo() { ... }

// TODO 9: ToggleDemo — uses useToggle
// - A "dark mode" toggle
// - Show the current state and a button to flip it
// function ToggleDemo() { ... }

// TODO 10: WindowSizeDemo — uses useWindowSize
// - Display current width x height, updating live on resize
// function WindowSizeDemo() { ... }

// TODO 11: Wire all demos into App
export function App() {
  return (
    <div>
      <h1>Exercise: Custom Hooks</h1>
      {/* TODO: Render LocalStorageDemo */}
      {/* TODO: Render FetchDemo */}
      {/* TODO: Render DebounceDemo */}
      {/* TODO: Render ToggleDemo */}
      {/* TODO: Render WindowSizeDemo */}
    </div>
  );
}
