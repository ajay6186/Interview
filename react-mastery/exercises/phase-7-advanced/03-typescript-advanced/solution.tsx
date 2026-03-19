import React, { useState, useRef, forwardRef, createContext, useContext, useCallback } from "react";

// ============================================================
// Solution: Advanced TypeScript Patterns with React
// ============================================================

// --- 1. Generic List<T> ---
interface ListProps<T extends { id: number | string }> {
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  emptyMessage?: string;
}

function List<T extends { id: number | string }>({
  items,
  renderItem,
  emptyMessage = "No items.",
}: ListProps<T>) {
  if (items.length === 0) {
    return <p style={{ color: "#9ca3af", fontStyle: "italic" }}>{emptyMessage}</p>;
  }
  return (
    <ul style={{ paddingLeft: 20 }}>
      {items.map((item) => (
        <li key={item.id} style={{ marginBottom: 4 }}>
          {renderItem(item)}
        </li>
      ))}
    </ul>
  );
}

// --- 2. Discriminated Union Alert ---
type AlertProps =
  | { variant: "success"; message: string }
  | { variant: "error"; message: string; onRetry: () => void }
  | { variant: "warning"; message: string; dismissible: boolean; onDismiss?: () => void };

const alertColors = {
  success: { bg: "#d1fae5", border: "#10b981", text: "#065f46" },
  error: { bg: "#fee2e2", border: "#ef4444", text: "#7f1d1d" },
  warning: { bg: "#fef9c3", border: "#f59e0b", text: "#78350f" },
};

function Alert(props: AlertProps) {
  const colors = alertColors[props.variant];
  return (
    <div
      style={{
        backgroundColor: colors.bg,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        padding: "10px 16px",
        borderRadius: 6,
        marginBottom: 8,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span>
        <strong>[{props.variant.toUpperCase()}]</strong> {props.message}
      </span>
      <span style={{ display: "flex", gap: 8 }}>
        {props.variant === "error" && (
          <button onClick={props.onRetry} style={{ padding: "4px 10px" }}>
            Retry
          </button>
        )}
        {props.variant === "warning" && props.dismissible && (
          <button onClick={props.onDismiss} style={{ padding: "4px 10px" }}>
            Dismiss
          </button>
        )}
      </span>
    </div>
  );
}

// --- 3. LabeledInput with forwardRef ---
interface LabeledInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const LabeledInput = forwardRef<HTMLInputElement, LabeledInputProps>(
  ({ label, id, ...rest }, ref) => {
    const inputId = id ?? `input-${label.toLowerCase().replace(/\s+/g, "-")}`;
    return (
      <div style={{ marginBottom: 12 }}>
        <label htmlFor={inputId} style={{ display: "block", fontWeight: "bold", marginBottom: 4 }}>
          {label}
        </label>
        <input
          id={inputId}
          ref={ref}
          style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 4, width: "100%", boxSizing: "border-box" }}
          {...rest}
        />
      </div>
    );
  }
);

// --- 4. Button extending native button props ---
interface ButtonProps extends React.ComponentProps<"button"> {
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, React.CSSProperties> = {
  primary: { backgroundColor: "#2563eb", color: "#fff", border: "none" },
  secondary: { backgroundColor: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db" },
  danger: { backgroundColor: "#dc2626", color: "#fff", border: "none" },
};

const sizeStyles: Record<NonNullable<ButtonProps["size"]>, React.CSSProperties> = {
  sm: { padding: "4px 10px", fontSize: 13 },
  md: { padding: "8px 16px", fontSize: 15 },
  lg: { padding: "12px 24px", fontSize: 17 },
};

function Button({ variant = "primary", size = "md", style, disabled, ...rest }: ButtonProps) {
  return (
    <button
      style={{
        ...variantStyles[variant],
        ...sizeStyles[size],
        borderRadius: 6,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
      disabled={disabled}
      {...rest}
    />
  );
}

// --- 5. Type-safe useForm hook ---
function useForm<T extends Record<string, string | number>>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value, type } = e.target;
      setValues((prev) => ({
        ...prev,
        [name]: type === "number" ? e.target.valueAsNumber : value,
      }));
    },
    []
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  const setError = useCallback((field: keyof T, message: string) => {
    setErrors((prev) => ({ ...prev, [field]: message }));
  }, []);

  return { values, handleChange, reset, errors, setError };
}

// --- 6. Typed theme Context ---
interface Theme {
  mode: "light" | "dark";
  primary: string;
  fontFamily: string;
}

const defaultTheme: Theme = { mode: "light", primary: "#2563eb", fontFamily: "sans-serif" };
const ThemeContext = createContext<Theme>(defaultTheme);

function ThemeProvider({ theme, children }: { theme: Partial<Theme>; children: React.ReactNode }) {
  const merged: Theme = { ...defaultTheme, ...theme };
  return <ThemeContext.Provider value={merged}>{children}</ThemeContext.Provider>;
}

function useTheme(): Theme {
  return useContext(ThemeContext);
}

function ThemedBox({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <div
      style={{
        backgroundColor: theme.mode === "dark" ? "#1f2937" : "#f9fafb",
        color: theme.mode === "dark" ? "#f9fafb" : "#1f2937",
        border: `2px solid ${theme.primary}`,
        fontFamily: theme.fontFamily,
        padding: 16,
        borderRadius: 8,
      }}
    >
      <strong>Mode: {theme.mode} | Primary: {theme.primary}</strong>
      <div>{children}</div>
    </div>
  );
}

// --- App ---
type Product = { id: number; name: string; price: number };

const sampleProducts: Product[] = [
  { id: 1, name: "React Mastery Course", price: 49 },
  { id: 2, name: "TypeScript Handbook", price: 29 },
  { id: 3, name: "Node.js Bootcamp", price: 39 },
];

export function App() {
  const inputRef = useRef<HTMLInputElement>(null);
  const { values, handleChange, reset, errors, setError } = useForm({
    username: "",
    email: "",
    age: 0,
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    let hasError = false;
    if (!values.username) { setError("username", "Username is required"); hasError = true; }
    if (!String(values.email).includes("@")) { setError("email", "Valid email required"); hasError = true; }
    if (Number(values.age) < 18) { setError("age", "Must be 18 or older"); hasError = true; }
    if (!hasError) alert(`Submitted: ${JSON.stringify(values, null, 2)}`);
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Solution: Advanced TypeScript Patterns</h1>

      {/* 1. Generic List */}
      <section style={{ marginBottom: 32 }}>
        <h2>1. Generic List&lt;T&gt;</h2>
        <List
          items={sampleProducts}
          renderItem={(p) => <span>{p.name} — <strong>${p.price}</strong></span>}
        />
        <h3>Empty state:</h3>
        <List items={[]} renderItem={() => null} emptyMessage="No products available right now." />
      </section>

      {/* 2. Discriminated Union Alert */}
      <section style={{ marginBottom: 32 }}>
        <h2>2. Discriminated Union Alert</h2>
        <Alert variant="success" message="Profile saved successfully!" />
        <Alert variant="error" message="Failed to load data." onRetry={() => alert("Retrying...")} />
        <Alert variant="warning" message="Your session expires soon." dismissible={true} onDismiss={() => alert("Dismissed")} />
      </section>

      {/* 3. LabeledInput with forwardRef */}
      <section style={{ marginBottom: 32 }}>
        <h2>3. LabeledInput + forwardRef</h2>
        <LabeledInput label="Username" ref={inputRef} placeholder="Enter username" />
        <Button onClick={() => inputRef.current?.focus()} size="sm">Focus Input via Ref</Button>
      </section>

      {/* 4. Button variants */}
      <section style={{ marginBottom: 32 }}>
        <h2>4. Button with ComponentProps</h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Button variant="primary" size="lg" onClick={() => alert("Primary!")}>Primary Large</Button>
          <Button variant="secondary" size="md">Secondary Medium</Button>
          <Button variant="danger" size="sm" disabled>Danger Disabled</Button>
        </div>
      </section>

      {/* 5. Type-safe useForm */}
      <section style={{ marginBottom: 32 }}>
        <h2>5. Type-safe useForm&lt;T&gt;</h2>
        <form onSubmit={handleSubmit}>
          <LabeledInput
            label="Username"
            name="username"
            value={values.username}
            onChange={handleChange}
          />
          {errors.username && <p style={{ color: "red", marginTop: -8 }}>{errors.username}</p>}
          <LabeledInput
            label="Email"
            name="email"
            type="email"
            value={values.email}
            onChange={handleChange}
          />
          {errors.email && <p style={{ color: "red", marginTop: -8 }}>{errors.email}</p>}
          <LabeledInput
            label="Age"
            name="age"
            type="number"
            value={values.age}
            onChange={handleChange}
          />
          {errors.age && <p style={{ color: "red", marginTop: -8 }}>{errors.age}</p>}
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <Button type="submit">Submit</Button>
            <Button type="button" variant="secondary" onClick={reset}>Reset</Button>
          </div>
        </form>
      </section>

      {/* 6. Typed Theme */}
      <section style={{ marginBottom: 32 }}>
        <h2>6. Typed Theme Context</h2>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
          <ThemeProvider theme={{ mode: "light", primary: "#2563eb" }}>
            <ThemedBox>Light theme with blue primary</ThemedBox>
          </ThemeProvider>
          <ThemeProvider theme={{ mode: "dark", primary: "#7c3aed" }}>
            <ThemedBox>Dark theme with purple primary</ThemedBox>
          </ThemeProvider>
        </div>
      </section>
    </div>
  );
}
