import React, { useState } from "react";

// ============================================================
// Solution: useState Fundamentals
// ============================================================

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Counter</h2>
      <p style={{ fontSize: 24 }}>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>{" "}
      <button onClick={() => setCount(count - 1)}>Decrement</button>{" "}
      <button onClick={() => setCount(0)}>Reset</button>
    </div>
  );
}

function Toggle() {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Toggle</h2>
      <button onClick={() => setIsVisible((prev) => !prev)}>
        {isVisible ? "Hide" : "Show"}
      </button>
      {isVisible && (
        <p style={{ color: "green", fontWeight: "bold" }}>
          This is the secret message!
        </p>
      )}
    </div>
  );
}

function TextInput() {
  const [text, setText] = useState("");

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Controlled Text Input</h2>
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type something..."
        style={{ padding: 8, fontSize: 16, width: "100%" }}
      />
      <p>You typed: {text}</p>
      <button onClick={() => setText("")}>Clear</button>
    </div>
  );
}

function TodoList() {
  const [items, setItems] = useState<string[]>([]);
  const [inputValue, setInputValue] = useState("");

  const handleAdd = () => {
    const trimmed = inputValue.trim();
    if (trimmed === "") return;
    setItems((prev) => [...prev, trimmed]);
    setInputValue("");
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Todo List</h2>
      <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="New item..."
          style={{ padding: 8, fontSize: 16, flex: 1 }}
        />
        <button onClick={handleAdd}>Add</button>
      </div>
      <p>Items: {items.length}</p>
      <ul>
        {items.map((item, index) => (
          <li key={index}>{item}</li>
        ))}
      </ul>
    </div>
  );
}

interface Profile {
  name: string;
  email: string;
  age: number;
}

const defaultProfile: Profile = { name: "", email: "", age: 0 };

function ProfileForm() {
  const [profile, setProfile] = useState<Profile>(defaultProfile);

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Profile Form</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
        <label>
          Name:{" "}
          <input
            type="text"
            value={profile.name}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, name: e.target.value }))
            }
          />
        </label>
        <label>
          Email:{" "}
          <input
            type="email"
            value={profile.email}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, email: e.target.value }))
            }
          />
        </label>
        <label>
          Age:{" "}
          <input
            type="number"
            value={profile.age}
            onChange={(e) =>
              setProfile((prev) => ({ ...prev, age: Number(e.target.value) }))
            }
          />
        </label>
      </div>
      <div
        style={{
          background: "#f5f5f5",
          padding: 12,
          borderRadius: 4,
          marginBottom: 8,
        }}
      >
        <strong>Profile Summary:</strong>
        <p>Name: {profile.name || "(empty)"}</p>
        <p>Email: {profile.email || "(empty)"}</p>
        <p>Age: {profile.age}</p>
      </div>
      <button onClick={() => setProfile(defaultProfile)}>Reset</button>
    </div>
  );
}

function BatchCounter() {
  const [count, setCount] = useState(0);

  const handleBrokenAdd = () => {
    // All three calls see the same `count` value from this render.
    // React batches these, so only the last one "wins" — net effect is +1.
    setCount(count + 1);
    setCount(count + 1);
    setCount(count + 1);
  };

  const handleCorrectAdd = () => {
    // Each call receives the latest pending state via the updater function.
    // So each one truly adds 1 — net effect is +3.
    setCount((prev) => prev + 1);
    setCount((prev) => prev + 1);
    setCount((prev) => prev + 1);
  };

  return (
    <div style={{ border: "1px solid #ccc", padding: 16, marginBottom: 16 }}>
      <h2>Batch Counter (Functional Updater)</h2>
      <p style={{ fontSize: 24 }}>Count: {count}</p>
      <button onClick={handleBrokenAdd}>Add 3 (broken — only adds 1)</button>{" "}
      <button onClick={handleCorrectAdd}>Add 3 (correct — adds 3)</button>{" "}
      <button onClick={() => setCount(0)}>Reset</button>
      <p style={{ color: "#666", fontSize: 14, marginTop: 8 }}>
        The "broken" button calls <code>setCount(count + 1)</code> three times,
        but all three see the same stale <code>count</code> value.
        <br />
        The "correct" button uses the functional updater{" "}
        <code>setCount(prev =&gt; prev + 1)</code> so each call chains properly.
      </p>
    </div>
  );
}

export function App() {
  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Exercise: useState Fundamentals</h1>
      <Counter />
      <Toggle />
      <TextInput />
      <TodoList />
      <ProfileForm />
      <BatchCounter />
    </div>
  );
}
