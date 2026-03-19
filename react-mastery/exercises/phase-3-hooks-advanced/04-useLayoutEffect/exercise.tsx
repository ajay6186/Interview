import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
} from "react";

// ============================================================
// Exercise: useLayoutEffect — Synchronous DOM Measurement
// ============================================================
// useLayoutEffect fires SYNCHRONOUSLY after DOM mutations but
// BEFORE the browser paints. This is the right place to read
// DOM layout (widths, heights, positions) and make adjustments
// so the user never sees a visual "flash".
//
// useEffect fires AFTER paint — if you measure & adjust there,
// users may see a brief flicker.
//
// Instructions:
// 1. Build a Tooltip that positions itself using
//    useLayoutEffect to measure the trigger element.
// 2. Build a FlickerComparison that shows the difference
//    between useEffect and useLayoutEffect when setting a
//    box's position based on its measured width.
// 3. Build an AutoScrollMessages component that auto-scrolls
//    to the bottom of a message list using useLayoutEffect.
// 4. Build a MeasureElement component that reads and displays
//    an element's width/height synchronously using
//    useLayoutEffect.
// ============================================================

// TODO 1: Tooltip component
// - Props: { children: React.ReactNode; text: string }
// - Render the children inside a wrapper <span> with a ref
// - When hovered, show a tooltip <div> positioned absolutely
// - Use useLayoutEffect to measure the wrapper's
//   getBoundingClientRect() and position the tooltip above it
// - The tooltip should appear ABOVE the element, centered
// function Tooltip({ children, text }: { children: React.ReactNode; text: string }) { ... }

// TODO 2: FlickerComparison
// - Two boxes side by side
// - Both start with left: 0, then move to a position based
//   on their own measured width (e.g., left = width + 20)
// - Box A uses useEffect to measure & set position
//   (you may see a flicker — the box appears at 0 then jumps)
// - Box B uses useLayoutEffect to measure & set position
//   (no flicker — position is set before paint)
// - A "Reset" button that sets both back to 0 to re-trigger
// function FlickerComparison() { ... }

// TODO 3: AutoScrollMessages
// - useState for a list of messages (strings)
// - A button to add a new message
// - A scrollable container div with a ref
// - useLayoutEffect that scrolls the container to the bottom
//   whenever messages.length changes
// - Because it runs before paint, the user never sees the
//   list without the scroll — it's already at the bottom
// function AutoScrollMessages() { ... }

// TODO 4: MeasureElement
// - A resizable <textarea> (the user can drag to resize)
// - useLayoutEffect to read the textarea's offsetWidth and
//   offsetHeight and store them in state
// - Display "Width: Xpx, Height: Ypx" next to the textarea
// - Also listen to window resize events in useLayoutEffect
//   to re-measure
// function MeasureElement() { ... }

// TODO 5: Wire everything together
export function App() {
  return (
    <div>
      <h1>Exercise: useLayoutEffect</h1>
      {/* TODO: Render Tooltip demo */}
      {/* TODO: Render FlickerComparison */}
      {/* TODO: Render AutoScrollMessages */}
      {/* TODO: Render MeasureElement */}
    </div>
  );
}
