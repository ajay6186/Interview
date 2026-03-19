import React, { useState, useMemo, useRef, memo } from "react";

// ============================================================
// Exercise: useMemo — Expensive Computations & Stable References
// ============================================================
// useMemo caches the RESULT of a computation so it only
// re-runs when its dependencies change. This is useful for:
//   - Expensive calculations (primes, sorting, filtering)
//   - Creating stable object/array references for children
//
// Instructions:
// 1. Write a helper `findPrimes(max)` that returns all primes
//    up to `max` using a sieve or trial division.
// 2. Build an UnmemoizedPrimes component that calls
//    findPrimes on EVERY render and shows how long it took.
// 3. Build a MemoizedPrimes component that wraps findPrimes
//    in useMemo so it only recomputes when `max` changes.
// 4. Build a FilteredList component that uses useMemo to
//    filter a large array based on a search query.
// 5. Build a StableReference component that passes a
//    useMemo'd config object to a memoized child.
// ============================================================

// TODO 1: Write findPrimes(max: number): number[]
// Returns an array of all prime numbers from 2..max.
// Use trial division or Sieve of Eratosthenes.
// function findPrimes(max: number): number[] { ... }

// TODO 2: UnmemoizedPrimes component
// - useState for `max` (default 20000) and a `color` toggle
// - Call findPrimes(max) directly (no useMemo)
// - Show: count of primes found, time taken (use performance.now)
// - Buttons to change max and to toggle color
// - Note: toggling color has NOTHING to do with primes, but
//   it forces a re-render and re-runs the expensive calculation
// function UnmemoizedPrimes() { ... }

// TODO 3: MemoizedPrimes component
// - Same setup as above
// - Wrap findPrimes in useMemo with [max] as dependency
// - Toggling color should NOT recompute primes
// - Show computation time so users can compare
// function MemoizedPrimes() { ... }

// TODO 4: FilteredList component
// - Create a large array of items (e.g., 10,000 strings)
//   generated once with useMemo([])
// - useState for a search query
// - useState for an unrelated toggle (to cause re-renders)
// - useMemo to filter items based on the search query
//   (only recomputes when query or items change)
// - Display the filtered count and first 20 results
// function FilteredList() { ... }

// TODO 5: StableReference component
// - Create a config object { theme, fontSize } with useMemo
// - Pass it to a React.memo child component (ConfigDisplay)
// - Without useMemo the child re-renders every time because
//   { theme, fontSize } is a new object each render
// - With useMemo the child only re-renders when theme or
//   fontSize actually change
// const ConfigDisplay = memo(function ConfigDisplay(...) { ... });
// function StableReference() { ... }

// TODO 6: Wire everything together
export function App() {
  return (
    <div>
      <h1>Exercise: useMemo</h1>
      {/* TODO: Render UnmemoizedPrimes */}
      {/* TODO: Render MemoizedPrimes */}
      {/* TODO: Render FilteredList */}
      {/* TODO: Render StableReference */}
    </div>
  );
}
