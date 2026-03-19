import React, {
  useState,
  useTransition,
  useDeferredValue,
  useId,
  startTransition,
  Suspense,
  lazy,
} from "react";

// ============================================================
// Exercise: React 18 Features
// ============================================================
// Practice React 18's concurrent features:
//   - useTransition: mark non-urgent state updates
//   - useDeferredValue: defer a value's re-render
//   - useId: stable unique IDs for accessibility
//   - Suspense: wrap async/lazy components
//   - Automatic batching demonstration
//
// Instructions:
// 1. Build a SlowList that simulates an expensive render.
// 2. Use useTransition to keep a search input responsive.
// 3. Use useDeferredValue to defer SlowList re-renders.
// 4. Use useId to create accessible form field pairs.
// 5. Use Suspense + lazy to code-split a heavy component.
// 6. Demonstrate automatic batching vs flushSync.
// ============================================================

// Simulates a slow rendering component (renders 1000 items)
function SlowList({ query }: { query: string }) {
  const items = Array.from({ length: 1_000 }, (_, i) => `Item ${i + 1}`).filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  );

  // Simulate expensive render with a blocking loop
  const start = performance.now();
  while (performance.now() - start < 15) {
    /* intentional blocking for demo */
  }

  return (
    <ul style={{ height: 200, overflowY: "auto", margin: 0, padding: "0 0 0 20px" }}>
      {items.slice(0, 100).map((item, i) => (
        <li key={i}>{item} {query && <mark>{query}</mark>}</li>
      ))}
      {items.length > 100 && <li>... and {items.length - 100} more</li>}
    </ul>
  );
}

// TODO 1: Build a SearchWithTransition component
// - Use useState for `input` (what the user types — always instant)
// - Use useState for `query` (what SlowList filters on — can lag)
// - Use useTransition() to get [isPending, startTransition]
// - When input changes:
//     1. setInput(value) immediately (so the text field stays responsive)
//     2. startTransition(() => setQuery(value)) (marks SlowList update as non-urgent)
// - Render:
//     - An <input> bound to `input`
//     - A "Pending..." indicator when isPending === true
//     - <SlowList query={query} />
//
// function SearchWithTransition() { ... }

// TODO 2: Build a SearchWithDeferred component
// - Use useState for `input` only
// - Use useDeferredValue(input) to get `deferredInput`
// - Pass `deferredInput` to <SlowList>
// - The input stays responsive while the list update is deferred
// - Add a visual indicator: reduce opacity of SlowList when deferredInput !== input
//
// function SearchWithDeferred() { ... }

// TODO 3: Build an AccessibleForm using useId
// - Use useId() to generate stable IDs (at least two fields: name + email)
// - Pair each <label htmlFor={id}> with <input id={id}>
// - This ensures unique, SSR-safe IDs even if the component is rendered multiple times
//
// function AccessibleForm() { ... }

// TODO 4: Create a HeavyComponent using React.lazy
// Since we can't create a real separate file in this exercise,
// simulate it with a Promise that resolves after 1 second:
//
// const HeavyComponent = lazy(
//   () => new Promise<{ default: React.ComponentType }>(resolve => {
//     setTimeout(() => resolve({ default: () => <div>Heavy component loaded!</div> }), 1000);
//   })
// );
//
// Then create a LazyDemo component that:
// - Has a boolean `show` state (default false)
// - A button to set show to true
// - Wraps HeavyComponent in <Suspense fallback={<p>Loading heavy component...</p>}>
// - Only renders HeavyComponent when show is true
//
// function LazyDemo() { ... }

// TODO 5: Build a BatchingDemo
// - Have 3 separate state values: countA, countB, countC
// - A button "Update All (batched)" that sets all 3 in one event handler
//   (React 18 batches these automatically — only ONE re-render)
// - Track the render count with a useRef (doesn't trigger re-render itself):
//     const renderCount = useRef(0);
//     renderCount.current++;
// - Show renderCount.current in the UI so you can see batching in action
//
// function BatchingDemo() { ... }

export function App() {
  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Exercise: React 18 Features</h1>
      <p style={{ color: "gray" }}>Complete the TODOs to explore React 18 concurrent features.</p>

      {/* TODO 6: Render all five demos in sections:
          SearchWithTransition, SearchWithDeferred, AccessibleForm, LazyDemo, BatchingDemo
      */}
    </div>
  );
}
