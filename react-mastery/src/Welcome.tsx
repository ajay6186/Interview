import React from "react";

export function App() {
  return (
    <div>
      <h1>React Mastery</h1>
      <p style={{ marginTop: "1rem", fontSize: "1.2rem" }}>
        35 hands-on exercises to master React for interviews.
      </p>
      <div className="card">
        <h2>Getting Started</h2>
        <ol style={{ marginTop: "1rem", paddingLeft: "1.5rem", lineHeight: 2 }}>
          <li>Open <code>src/main.tsx</code></li>
          <li>Comment out the <code>Welcome</code> import</li>
          <li>Uncomment ONE exercise import</li>
          <li>Open the matching <code>exercise.tsx</code> and fill in the TODOs</li>
          <li>Check your work against <code>solution.tsx</code></li>
        </ol>
      </div>
      <div className="card">
        <h2>Phases</h2>
        <ul style={{ marginTop: "1rem", paddingLeft: "1.5rem", lineHeight: 2 }}>
          <li><strong>Phase 1:</strong> Fundamentals (JSX, Components, Props, State)</li>
          <li><strong>Phase 2:</strong> Hooks Core (useState, useEffect, useContext, useReducer, useRef)</li>
          <li><strong>Phase 3:</strong> Hooks Advanced (useCallback, useMemo, Custom Hooks)</li>
          <li><strong>Phase 4:</strong> Advanced Patterns (Forms, HOC, Code Splitting, Error Boundaries, Routing)</li>
          <li><strong>Phase 5:</strong> Redux (Store, Actions, Toolkit, Thunks)</li>
          <li><strong>Phase 6:</strong> Real World (API, Auth, Performance, Testing)</li>
          <li><strong>Phase 7:</strong> Advanced (Portals, Compound Components, TypeScript, React 18, Real-World Patterns)</li>
        </ul>
      </div>
      <div className="card">
        <h2>Interview Q&amp;A Files</h2>
        <p>Read these in <code>interview-qa/</code> before each phase:</p>
        <ul style={{ marginTop: "0.5rem", paddingLeft: "1.5rem", lineHeight: 2 }}>
          <li>01-react-basics · 02-jsx · 03-components · 04-hooks-basic · 05-hooks-advanced</li>
          <li>06-state-management · 07-routing · 08-controlled-components · 09-code-splitting</li>
          <li>10-redux · 11-performance · 12-testing · 13-advanced-patterns</li>
          <li>14-typescript-react · 15-real-world · 16-react-18</li>
        </ul>
      </div>
    </div>
  );
}
