import React, { useState } from "react";

// ============================================================
// Solution: Testing Components
// ============================================================
// Complete, testable components with inline comments explaining
// exactly how you would test each one using React Testing
// Library + Jest. Includes a visual "test results" display
// that simulates what test output looks like.
// ============================================================

// ---- COMPONENT 1: Counter ----
// TESTING STRATEGY:
// - render(<Counter />)
// - Use screen.getByText(/count: 0/i) to verify initial state
// - Use screen.getByRole('button', { name: /increment/i }) to find buttons
// - fireEvent.click() or userEvent.click() to simulate clicks
// - Assert text content changes after each click

function Counter() {
  const [count, setCount] = useState(0);

  return (
    <div style={{ marginBottom: "24px", padding: "16px", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
      <h3 style={{ margin: "0 0 12px 0" }}>Counter</h3>
      {/* data-testid="count" would be used for testing */}
      <p data-testid="count" style={{ fontSize: "24px", fontWeight: "bold", margin: "0 0 12px 0" }}>
        Count: {count}
      </p>
      <div style={{ display: "flex", gap: "8px" }}>
        <button
          onClick={() => setCount((c) => c + 1)}
          style={btnStyle("#3b82f6")}
        >
          Increment
        </button>
        <button
          onClick={() => setCount((c) => Math.max(0, c - 1))}
          style={btnStyle("#f59e0b")}
        >
          Decrement
        </button>
        <button onClick={() => setCount(0)} style={btnStyle("#6b7280")}>
          Reset
        </button>
      </div>
      {/* Test comments:
        TEST: "renders initial count of 0"
          expect(screen.getByTestId('count')).toHaveTextContent('Count: 0')

        TEST: "increment increases count"
          fireEvent.click(screen.getByRole('button', { name: /increment/i }))
          expect(screen.getByTestId('count')).toHaveTextContent('Count: 1')

        TEST: "decrement decreases count"
          // First increment to 1, then decrement
          fireEvent.click(screen.getByRole('button', { name: /increment/i }))
          fireEvent.click(screen.getByRole('button', { name: /decrement/i }))
          expect(screen.getByTestId('count')).toHaveTextContent('Count: 0')

        TEST: "count does not go below 0"
          fireEvent.click(screen.getByRole('button', { name: /decrement/i }))
          expect(screen.getByTestId('count')).toHaveTextContent('Count: 0')

        TEST: "reset sets count to 0"
          fireEvent.click(screen.getByRole('button', { name: /increment/i }))
          fireEvent.click(screen.getByRole('button', { name: /increment/i }))
          fireEvent.click(screen.getByRole('button', { name: /reset/i }))
          expect(screen.getByTestId('count')).toHaveTextContent('Count: 0')
      */}
    </div>
  );
}

// ---- COMPONENT 2: SearchFilter ----
// TESTING STRATEGY:
// - render(<SearchFilter items={['Apple', 'Banana', 'Cherry']} />)
// - Use screen.getByRole('textbox') to find the search input
// - Use screen.getAllByRole('listitem') to find filtered items
// - fireEvent.change(input, { target: { value: 'ap' } }) to type
// - Assert correct number of items shown

function SearchFilter({ items }: { items: string[] }) {
  const [query, setQuery] = useState("");

  const filtered = items.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div style={{ marginBottom: "24px", padding: "16px", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
      <h3 style={{ margin: "0 0 12px 0" }}>Search Filter</h3>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search items..."
        aria-label="Search items"
        style={{
          width: "100%",
          padding: "8px 12px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          fontSize: "14px",
          marginBottom: "8px",
          boxSizing: "border-box",
        }}
      />
      <p style={{ fontSize: "13px", color: "#666", margin: "0 0 8px 0" }}>
        Showing {filtered.length} of {items.length} items
      </p>
      {filtered.length === 0 ? (
        <p style={{ color: "#999", fontStyle: "italic" }}>No results found</p>
      ) : (
        <ul style={{ margin: 0, paddingLeft: "20px" }}>
          {filtered.map((item) => (
            <li key={item} style={{ padding: "2px 0" }}>
              {item}
            </li>
          ))}
        </ul>
      )}
      {/* Test comments:
        TEST: "renders all items initially"
          expect(screen.getAllByRole('listitem')).toHaveLength(items.length)

        TEST: "filters items as user types"
          fireEvent.change(screen.getByRole('textbox'), { target: { value: 'ap' } })
          expect(screen.getAllByRole('listitem')).toHaveLength(1) // 'Apple'

        TEST: "search is case-insensitive"
          fireEvent.change(screen.getByRole('textbox'), { target: { value: 'BANANA' } })
          expect(screen.getByText('Banana')).toBeInTheDocument()

        TEST: "shows 'No results found' when nothing matches"
          fireEvent.change(screen.getByRole('textbox'), { target: { value: 'xyz' } })
          expect(screen.getByText(/no results found/i)).toBeInTheDocument()

        TEST: "shows correct count"
          expect(screen.getByText(`Showing ${items.length} of ${items.length} items`)).toBeInTheDocument()

        TEST: "clearing search restores all items"
          fireEvent.change(input, { target: { value: 'ap' } })
          fireEvent.change(input, { target: { value: '' } })
          expect(screen.getAllByRole('listitem')).toHaveLength(items.length)
      */}
    </div>
  );
}

// ---- COMPONENT 3: ToggleContent ----
// TESTING STRATEGY:
// - render(<ToggleContent title="Details"><p>Secret</p></ToggleContent>)
// - Children should NOT be visible initially
// - Click button with "Show Details" text
// - Children should now be visible
// - Button text should change to "Hide Details"

function ToggleContent({ title, children }: { title: string; children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ marginBottom: "24px", padding: "16px", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
      <h3 style={{ margin: "0 0 12px 0" }}>Toggle Content</h3>
      <button
        onClick={() => setVisible((v) => !v)}
        style={{
          ...btnStyle("#8b5cf6"),
          marginBottom: "12px",
        }}
      >
        {visible ? `Hide ${title}` : `Show ${title}`}
      </button>
      {visible && (
        <div
          data-testid="toggle-content"
          style={{
            padding: "12px",
            backgroundColor: "#f8fafc",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
          }}
        >
          {children}
        </div>
      )}
      {/* Test comments:
        TEST: "content is hidden by default"
          expect(screen.queryByTestId('toggle-content')).not.toBeInTheDocument()

        TEST: "clicking button shows content"
          fireEvent.click(screen.getByRole('button', { name: /show details/i }))
          expect(screen.getByTestId('toggle-content')).toBeInTheDocument()
          expect(screen.getByText('Secret')).toBeVisible()

        TEST: "clicking again hides content"
          fireEvent.click(screen.getByRole('button', { name: /show details/i }))
          fireEvent.click(screen.getByRole('button', { name: /hide details/i }))
          expect(screen.queryByTestId('toggle-content')).not.toBeInTheDocument()

        TEST: "button text changes based on state"
          expect(screen.getByRole('button')).toHaveTextContent('Show Details')
          fireEvent.click(screen.getByRole('button'))
          expect(screen.getByRole('button')).toHaveTextContent('Hide Details')
      */}
    </div>
  );
}

// ---- COMPONENT 4: Form with validation ----
// TESTING STRATEGY:
// - render(<Form onSubmit={mockFn} />)
// - Use screen.getByLabelText() for inputs (accessible queries)
// - Use userEvent.type() to fill in fields
// - Check for validation error messages
// - Verify onSubmit is called with correct data

function Form({
  onSubmit,
}: {
  onSubmit: (data: { name: string; email: string; message: string }) => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [touched, setTouched] = useState({ name: false, email: false, message: false });
  const [submitted, setSubmitted] = useState(false);

  const errors = {
    name: name.length < 2 ? "Name must be at least 2 characters" : "",
    email: !email.includes("@") ? "Email must contain @" : "",
    message: message.length < 10 ? "Message must be at least 10 characters" : "",
  };

  const isValid = !errors.name && !errors.email && !errors.message;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ name: true, email: true, message: true });
    if (isValid) {
      onSubmit({ name, email, message });
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <div
        style={{
          marginBottom: "24px",
          padding: "16px",
          border: "1px solid #bbf7d0",
          borderRadius: "8px",
          backgroundColor: "#f0fdf4",
        }}
      >
        <h3 style={{ margin: "0 0 8px 0", color: "#166534" }}>Form Submitted!</h3>
        <p style={{ margin: 0, color: "#166534" }}>Thank you, {name}. Your message has been sent.</p>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: "24px", padding: "16px", border: "1px solid #e0e0e0", borderRadius: "8px" }}>
      <h3 style={{ margin: "0 0 12px 0" }}>Contact Form</h3>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "14px" }}>
          <label htmlFor="form-name" style={labelStyle}>
            Name
          </label>
          <input
            id="form-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, name: true }))}
            style={inputStyle}
          />
          {touched.name && errors.name && <p style={errorStyle}>{errors.name}</p>}
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label htmlFor="form-email" style={labelStyle}>
            Email
          </label>
          <input
            id="form-email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
            style={inputStyle}
          />
          {touched.email && errors.email && <p style={errorStyle}>{errors.email}</p>}
        </div>

        <div style={{ marginBottom: "14px" }}>
          <label htmlFor="form-message" style={labelStyle}>
            Message
          </label>
          <textarea
            id="form-message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, message: true }))}
            rows={3}
            style={{ ...inputStyle, resize: "vertical" }}
          />
          {touched.message && errors.message && <p style={errorStyle}>{errors.message}</p>}
        </div>

        <button type="submit" disabled={!isValid} style={btnStyle(isValid ? "#3b82f6" : "#94a3b8")}>
          Submit
        </button>
      </form>
      {/* Test comments:
        TEST: "renders all form fields"
          expect(screen.getByLabelText(/name/i)).toBeInTheDocument()
          expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
          expect(screen.getByLabelText(/message/i)).toBeInTheDocument()

        TEST: "shows error when name is too short"
          const nameInput = screen.getByLabelText(/name/i)
          await userEvent.type(nameInput, 'A')
          fireEvent.blur(nameInput)
          expect(screen.getByText(/name must be at least 2 characters/i)).toBeInTheDocument()

        TEST: "shows error when email has no @"
          await userEvent.type(screen.getByLabelText(/email/i), 'notanemail')
          fireEvent.blur(screen.getByLabelText(/email/i))
          expect(screen.getByText(/email must contain/i)).toBeInTheDocument()

        TEST: "shows error when message too short"
          await userEvent.type(screen.getByLabelText(/message/i), 'Hi')
          fireEvent.blur(screen.getByLabelText(/message/i))
          expect(screen.getByText(/message must be at least 10 characters/i)).toBeInTheDocument()

        TEST: "submit button is disabled when form invalid"
          expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()

        TEST: "calls onSubmit on valid submission"
          const mockSubmit = jest.fn()
          render(<Form onSubmit={mockSubmit} />)
          await userEvent.type(screen.getByLabelText(/name/i), 'John')
          await userEvent.type(screen.getByLabelText(/email/i), 'john@test.com')
          await userEvent.type(screen.getByLabelText(/message/i), 'This is a test message')
          fireEvent.click(screen.getByRole('button', { name: /submit/i }))
          expect(mockSubmit).toHaveBeenCalledWith({
            name: 'John', email: 'john@test.com', message: 'This is a test message'
          })

        TEST: "shows success message after submission"
          // ... fill in valid data and submit ...
          expect(screen.getByText(/form submitted/i)).toBeInTheDocument()

        TEST: "clears error when user corrects input"
          await userEvent.type(screen.getByLabelText(/name/i), 'A')
          fireEvent.blur(screen.getByLabelText(/name/i))
          expect(screen.getByText(/name must be at least 2/i)).toBeInTheDocument()
          await userEvent.type(screen.getByLabelText(/name/i), 'lice')
          expect(screen.queryByText(/name must be at least 2/i)).not.toBeInTheDocument()
      */}
    </div>
  );
}

// Shared styles
const btnStyle = (bg: string): React.CSSProperties => ({
  padding: "8px 18px",
  backgroundColor: bg,
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
});

const labelStyle: React.CSSProperties = {
  display: "block",
  marginBottom: "4px",
  fontSize: "14px",
  fontWeight: 500,
  color: "#374151",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "8px 12px",
  border: "1px solid #ccc",
  borderRadius: "6px",
  fontSize: "14px",
  boxSizing: "border-box",
};

const errorStyle: React.CSSProperties = {
  color: "#dc2626",
  fontSize: "13px",
  margin: "4px 0 0 0",
};

// ---- Visual Test Results Display ----
function TestResultsDisplay() {
  const results = [
    { suite: "Counter", tests: [
      { name: "renders initial count of 0", pass: true },
      { name: "increment increases count by 1", pass: true },
      { name: "decrement decreases count by 1", pass: true },
      { name: "count does not go below 0", pass: true },
      { name: "reset sets count to 0", pass: true },
    ]},
    { suite: "SearchFilter", tests: [
      { name: "renders all items initially", pass: true },
      { name: "filters items as user types", pass: true },
      { name: "search is case-insensitive", pass: true },
      { name: 'shows "No results found" when empty', pass: true },
      { name: "shows correct item count", pass: true },
      { name: "clearing search restores items", pass: true },
    ]},
    { suite: "ToggleContent", tests: [
      { name: "content is hidden by default", pass: true },
      { name: "clicking shows content", pass: true },
      { name: "clicking again hides content", pass: true },
      { name: "button text updates with state", pass: true },
    ]},
    { suite: "Form", tests: [
      { name: "renders all form fields", pass: true },
      { name: "validates name min length", pass: true },
      { name: "validates email format", pass: true },
      { name: "validates message min length", pass: true },
      { name: "disables submit when invalid", pass: true },
      { name: "calls onSubmit with valid data", pass: true },
      { name: "shows success message", pass: true },
      { name: "clears error on correction", pass: true },
    ]},
  ];

  const totalTests = results.reduce((sum, s) => sum + s.tests.length, 0);

  return (
    <div
      style={{
        padding: "16px",
        backgroundColor: "#0f172a",
        borderRadius: "8px",
        color: "#e2e8f0",
        fontFamily: "monospace",
        fontSize: "13px",
      }}
    >
      <div style={{ color: "#94a3b8", marginBottom: "12px" }}>
        PASS  src/testing-components.test.tsx
      </div>
      {results.map((suite) => (
        <div key={suite.suite} style={{ marginBottom: "10px" }}>
          <div style={{ color: "white", fontWeight: "bold" }}>{suite.suite}</div>
          {suite.tests.map((test) => (
            <div key={test.name} style={{ paddingLeft: "16px" }}>
              <span style={{ color: "#4ade80" }}>PASS</span>{" "}
              <span style={{ color: "#cbd5e1" }}>{test.name}</span>
            </div>
          ))}
        </div>
      ))}
      <div style={{ borderTop: "1px solid #334155", paddingTop: "8px", marginTop: "8px" }}>
        <span style={{ color: "#4ade80" }}>Tests: {totalTests} passed</span>,{" "}
        {totalTests} total
      </div>
    </div>
  );
}

// ---- App ----
const SAMPLE_ITEMS = [
  "Apple", "Banana", "Cherry", "Date", "Elderberry",
  "Fig", "Grape", "Honeydew", "Kiwi", "Lemon",
];

export function App() {
  const [submittedData, setSubmittedData] = useState<{
    name: string;
    email: string;
    message: string;
  } | null>(null);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "700px" }}>
      <h1>Exercise: Testing Components</h1>
      <p style={{ color: "#666", marginBottom: "24px" }}>
        Each component below is built to be testable. Read the inline comments in the source
        code for the exact test cases you would write using React Testing Library + Jest.
      </p>

      <Counter />
      <SearchFilter items={SAMPLE_ITEMS} />
      <ToggleContent title="Details">
        <p>This is the hidden content that appears when toggled!</p>
        <p>It can contain any React children.</p>
      </ToggleContent>
      <Form
        onSubmit={(data) => {
          setSubmittedData(data);
          console.log("Form submitted:", data);
        }}
      />

      {submittedData && (
        <div
          style={{
            padding: "12px",
            backgroundColor: "#eff6ff",
            border: "1px solid #bfdbfe",
            borderRadius: "8px",
            marginBottom: "24px",
            fontSize: "14px",
          }}
        >
          <strong>Last submission:</strong> {JSON.stringify(submittedData)}
        </div>
      )}

      <h2 style={{ marginTop: "32px" }}>Simulated Test Results</h2>
      <p style={{ color: "#666", fontSize: "14px" }}>
        Below is what the test output would look like if you ran these tests:
      </p>
      <TestResultsDisplay />
    </div>
  );
}
