import React, { useState, useEffect, useRef } from "react";

// =============================================================
// EXERCISE 4: Stopwatch (useRef + useEffect)
// =============================================================
// WHAT YOU WILL PRACTICE:
//   - useRef to store a mutable value that does NOT trigger re-renders
//   - useEffect to start and stop a setInterval
//   - Cleaning up an interval when it is no longer needed
//   - Formatting a number into MM:SS:ms display
//
// GOAL: Build a stopwatch with:
//   1. A time display in format  MM:SS:ms  (e.g. "01:23:45")
//   2. Start button — begins counting
//   3. Stop button  — pauses counting
//   4. Reset button — stops and resets to 00:00:00
//   5. Lap button   — records the current time to a lap list
//
// KEY INSIGHT:
//   Store the interval ID in a useRef, NOT in useState.
//   Why? Changing a ref does NOT cause a re-render.
//   The interval ID is internal plumbing — the UI never needs to display it.
// =============================================================

// =============================================================
// TODO 1: Set up state
//   - time: number       (milliseconds elapsed, starts at 0)
//   - isRunning: boolean (is the stopwatch currently ticking?)
//   - laps: number[]     (list of recorded lap times in ms)
// =============================================================

// =============================================================
// TODO 2: Set up a ref
//   - intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
//   This will hold the interval ID so we can clear it later.
// =============================================================

// =============================================================
// TODO 3: useEffect — manage the interval
//   - If isRunning is true:
//       Start an interval that adds 10 to `time` every 10ms
//       Save the interval ID to intervalRef.current
//   - If isRunning is false:
//       Clear the interval using intervalRef.current
//   - Return a cleanup function that clears the interval
//   - Dependency array: [isRunning]
// =============================================================

// =============================================================
// TODO 4: Write formatTime(ms: number) → string
//   - Convert milliseconds to "MM:SS:cs" (cs = centiseconds = ms/10)
//   - Example: 75430 ms → "01:15:43"
//     minutes = Math.floor(ms / 60000)
//     seconds = Math.floor((ms % 60000) / 1000)
//     centiseconds = Math.floor((ms % 1000) / 10)
//   - Pad each part to 2 digits with .toString().padStart(2, "0")
// =============================================================

// =============================================================
// TODO 5: Write handler functions
//   - handleStart: set isRunning to true
//   - handleStop:  set isRunning to false
//   - handleReset: set isRunning to false, time to 0, laps to []
//   - handleLap:   add current time to laps array (only when running)
// =============================================================

export function App() {
  // TODO 1: state here
  // TODO 2: ref here

  // TODO 3: useEffect here

  // TODO 4: formatTime helper here

  // TODO 5: handler functions here

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Stopwatch</h1>

      {/* --- DISPLAY --- */}
      <div style={styles.display}>
        {/* TODO: show formatTime(time) */}
        00:00:00
      </div>

      {/* --- BUTTONS --- */}
      <div style={styles.buttons}>
        {/* TODO: show Start/Stop based on isRunning */}
        <button style={{ ...styles.btn, background: "#22c55e" }}>Start</button>
        <button style={{ ...styles.btn, background: "#ef4444" }}>Stop</button>
        <button style={{ ...styles.btn, background: "#f59e0b" }}>Reset</button>
        <button style={{ ...styles.btn, background: "#6366f1" }}>Lap</button>
      </div>

      {/* --- LAP LIST --- */}
      {/* TODO: show laps list if there are any */}
      {/* Each lap: "Lap X: MM:SS:cs" */}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 380, margin: "40px auto", fontFamily: "monospace", padding: "0 16px", textAlign: "center" },
  title: { fontSize: 26, marginBottom: 24, fontFamily: "sans-serif" },
  display: { fontSize: 64, fontWeight: "bold", letterSpacing: 4, color: "#111827", marginBottom: 28, padding: "24px 0", background: "#f9fafb", borderRadius: 16 },
  buttons: { display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 },
  btn: { padding: "10px 20px", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 15, fontFamily: "sans-serif", fontWeight: "bold" },
  lapList: { textAlign: "left", background: "#f9fafb", borderRadius: 10, padding: "12px 20px" },
  lapItem: { padding: "6px 0", borderBottom: "1px solid #e5e7eb", fontSize: 14, color: "#374151", fontFamily: "monospace" },
};
