import React, { useReducer, useState } from "react";

// ============================================================
// Solution: useReducer — Counter with Action History
// ============================================================

interface HistoryEntry {
  action: string;
  resultingCount: number;
  timestamp: string;
}

interface State {
  count: number;
  step: number;
  history: HistoryEntry[];
}

type Action =
  | { type: "INCREMENT" }
  | { type: "DECREMENT" }
  | { type: "RESET" }
  | { type: "SET_STEP"; payload: number }
  | { type: "SET_COUNT"; payload: number };

const initialState: State = {
  count: 0,
  step: 1,
  history: [],
};

function addHistory(
  history: HistoryEntry[],
  actionLabel: string,
  resultingCount: number
): HistoryEntry[] {
  return [
    ...history,
    {
      action: actionLabel,
      resultingCount,
      timestamp: new Date().toLocaleTimeString(),
    },
  ];
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "INCREMENT": {
      const newCount = state.count + state.step;
      return {
        ...state,
        count: newCount,
        history: addHistory(state.history, `INCREMENT by ${state.step}`, newCount),
      };
    }
    case "DECREMENT": {
      const newCount = state.count - state.step;
      return {
        ...state,
        count: newCount,
        history: addHistory(state.history, `DECREMENT by ${state.step}`, newCount),
      };
    }
    case "RESET": {
      return {
        ...initialState,
        history: addHistory(state.history, "RESET", 0),
      };
    }
    case "SET_STEP": {
      return {
        ...state,
        step: action.payload,
        history: addHistory(
          state.history,
          `SET_STEP to ${action.payload}`,
          state.count
        ),
      };
    }
    case "SET_COUNT": {
      return {
        ...state,
        count: action.payload,
        history: addHistory(
          state.history,
          `SET_COUNT to ${action.payload}`,
          action.payload
        ),
      };
    }
  }
}

function CounterDisplay({
  count,
  step,
  dispatch,
}: {
  count: number;
  step: number;
  dispatch: React.Dispatch<Action>;
}) {
  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Counter</h2>
      <p style={{ fontSize: 48, fontFamily: "monospace", margin: "8px 0" }}>
        {count}
      </p>
      <p style={{ color: "#666" }}>Step size: {step}</p>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={() => dispatch({ type: "INCREMENT" })}
          style={{ padding: "8px 16px", fontSize: 16 }}
        >
          + Increment
        </button>
        <button
          onClick={() => dispatch({ type: "DECREMENT" })}
          style={{ padding: "8px 16px", fontSize: 16 }}
        >
          - Decrement
        </button>
        <button
          onClick={() => dispatch({ type: "RESET" })}
          style={{ padding: "8px 16px", fontSize: 16, color: "red" }}
        >
          Reset
        </button>
      </div>
    </div>
  );
}

function StepControl({
  dispatch,
  step,
}: {
  dispatch: React.Dispatch<Action>;
  step: number;
}) {
  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Step Control</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <label>
          Custom step:{" "}
          <input
            type="number"
            min={1}
            value={step}
            onChange={(e) =>
              dispatch({ type: "SET_STEP", payload: Math.max(1, Number(e.target.value)) })
            }
            style={{ width: 60, padding: 4, fontSize: 16 }}
          />
        </label>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {[1, 5, 10].map((preset) => (
          <button
            key={preset}
            onClick={() => dispatch({ type: "SET_STEP", payload: preset })}
            style={{
              padding: "6px 16px",
              fontSize: 14,
              fontWeight: step === preset ? "bold" : "normal",
              border: step === preset ? "2px solid blue" : "1px solid #ccc",
            }}
          >
            Step {preset}
          </button>
        ))}
      </div>
    </div>
  );
}

function SetCountForm({ dispatch }: { dispatch: React.Dispatch<Action> }) {
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = Number(inputValue);
    if (!isNaN(num)) {
      dispatch({ type: "SET_COUNT", payload: num });
      setInputValue("");
    }
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Set Count Directly</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          type="number"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Enter a number..."
          style={{ padding: 8, fontSize: 16, flex: 1 }}
        />
        <button type="submit" style={{ padding: "8px 16px", fontSize: 16 }}>
          Set Count
        </button>
      </form>
    </div>
  );
}

function ActionHistory({ history }: { history: HistoryEntry[] }) {
  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Action History ({history.length} actions)</h2>
      {history.length === 0 ? (
        <p style={{ color: "#999" }}>No actions dispatched yet.</p>
      ) : (
        <div
          style={{
            maxHeight: 250,
            overflowY: "auto",
            background: "#f9f9f9",
            borderRadius: 4,
            padding: 8,
          }}
        >
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #ddd" }}>
                <th style={{ textAlign: "left", padding: 4 }}>#</th>
                <th style={{ textAlign: "left", padding: 4 }}>Action</th>
                <th style={{ textAlign: "right", padding: 4 }}>Count</th>
                <th style={{ textAlign: "right", padding: 4 }}>Time</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry, index) => (
                <tr key={index} style={{ borderBottom: "1px solid #eee" }}>
                  <td style={{ padding: 4, color: "#999" }}>{index + 1}</td>
                  <td style={{ padding: 4, fontFamily: "monospace" }}>
                    {entry.action}
                  </td>
                  <td style={{ padding: 4, textAlign: "right", fontWeight: "bold" }}>
                    {entry.resultingCount}
                  </td>
                  <td style={{ padding: 4, textAlign: "right", color: "#666" }}>
                    {entry.timestamp}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export function App() {
  const [state, dispatch] = useReducer(reducer, initialState);

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Exercise: useReducer</h1>
      <CounterDisplay count={state.count} step={state.step} dispatch={dispatch} />
      <StepControl dispatch={dispatch} step={state.step} />
      <SetCountForm dispatch={dispatch} />
      <ActionHistory history={state.history} />
    </div>
  );
}
