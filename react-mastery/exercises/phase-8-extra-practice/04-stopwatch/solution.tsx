import React, { useState, useEffect, useRef } from "react";

// =============================================================
// SOLUTION 4: Stopwatch
// =============================================================

export function App() {
  // TODO 1 ✅ — state
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [laps, setLaps] = useState<number[]>([]);

  // TODO 2 ✅ — ref for the interval ID (does not cause re-renders)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // TODO 3 ✅ — manage the interval in useEffect
  useEffect(() => {
    if (isRunning) {
      // Start ticking: add 10ms every 10ms
      intervalRef.current = setInterval(() => {
        setTime((prev) => prev + 10);
      }, 10);
    } else {
      // Stop ticking
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    // Cleanup: always clear on re-run or unmount
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // TODO 4 ✅ — formatTime: convert ms → "MM:SS:cs"
  function formatTime(ms: number): string {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return [minutes, seconds, centiseconds]
      .map((n) => n.toString().padStart(2, "0"))
      .join(":");
  }

  // TODO 5 ✅ — handlers
  const handleStart = () => setIsRunning(true);
  const handleStop = () => setIsRunning(false);
  const handleReset = () => {
    setIsRunning(false);
    setTime(0);
    setLaps([]);
  };
  const handleLap = () => {
    if (isRunning) setLaps((prev) => [...prev, time]);
  };

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Stopwatch</h1>

      {/* --- DISPLAY --- */}
      <div style={styles.display}>{formatTime(time)}</div>

      {/* --- BUTTONS --- */}
      <div style={styles.buttons}>
        {isRunning ? (
          <button style={{ ...styles.btn, background: "#ef4444" }} onClick={handleStop}>
            Stop
          </button>
        ) : (
          <button style={{ ...styles.btn, background: "#22c55e" }} onClick={handleStart}>
            Start
          </button>
        )}
        <button style={{ ...styles.btn, background: "#f59e0b" }} onClick={handleReset}>
          Reset
        </button>
        <button
          style={{ ...styles.btn, background: isRunning ? "#6366f1" : "#d1d5db" }}
          onClick={handleLap}
          disabled={!isRunning}
        >
          Lap
        </button>
      </div>

      {/* --- LAP LIST --- */}
      {laps.length > 0 && (
        <div style={styles.lapList}>
          <p style={{ margin: "0 0 8px", fontFamily: "sans-serif", fontWeight: "bold", color: "#374151" }}>
            Laps
          </p>
          {laps.map((lapTime, index) => (
            <div key={index} style={styles.lapItem}>
              Lap {index + 1}: {formatTime(lapTime)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// --- KEY CONCEPTS ---
// 1. useRef vs useState for the interval ID:
//    - useState would cause a re-render every time the ID is stored
//    - useRef stores it silently — no re-render, but always up-to-date
//
// 2. setTime(prev => prev + 10)  ← FUNCTIONAL UPDATE
//    - Inside setInterval, `time` in the closure is stale (the value at
//      the time the interval was created)
//    - Using the functional form `prev => prev + 10` always gets the
//      latest value from React, avoiding the stale closure bug
//
// 3. Cleanup in useEffect:
//    return () => clearInterval(intervalRef.current)
//    - Called before the next effect run (when isRunning changes)
//    - Called when the component unmounts
//    - Prevents memory leaks

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 380, margin: "40px auto", fontFamily: "monospace", padding: "0 16px", textAlign: "center" },
  title: { fontSize: 26, marginBottom: 24, fontFamily: "sans-serif" },
  display: { fontSize: 64, fontWeight: "bold", letterSpacing: 4, color: "#111827", marginBottom: 28, padding: "24px 0", background: "#f9fafb", borderRadius: 16 },
  buttons: { display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 },
  btn: { padding: "10px 20px", color: "#fff", border: "none", borderRadius: 8, cursor: "pointer", fontSize: 15, fontFamily: "sans-serif", fontWeight: "bold" },
  lapList: { textAlign: "left", background: "#f9fafb", borderRadius: 10, padding: "12px 20px" },
  lapItem: { padding: "6px 0", borderBottom: "1px solid #e5e7eb", fontSize: 14, color: "#374151" },
};
