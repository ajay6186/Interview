import React, { useState, useRef, forwardRef, createContext, useContext } from "react";

// ============================================================
// Exercise: Advanced TypeScript Patterns with React
// ============================================================
// Master TypeScript patterns that come up in real React codebases:
// generic components, discriminated unions, forwardRef, ComponentProps,
// conditional types, and utility-typed hooks.
//
// Instructions:
// 1. Create a generic List<T> component.
// 2. Type a discriminated union Alert component.
// 3. Build a LabeledInput using forwardRef.
// 4. Build a Button extending native button props with ComponentProps.
// 5. Create a type-safe form with useForm<T> hook.
// 6. Build a typed theme system with createContext.
// ============================================================

// TODO 1: Generic List<T> component
// - T must extend { id: number | string }
// - Props: { items: T[]; renderItem: (item: T) => React.ReactNode; emptyMessage?: string }
// - Render a <ul> with each item rendered via renderItem
// - If items.length === 0, render emptyMessage (default: "No items.")
// - Each <li> uses item.id as the key
//
// function List<T extends { id: number | string }>(props: ListProps<T>) { ... }

// TODO 2: Discriminated Union Alert
// Define AlertProps as a discriminated union on `variant`:
//   - { variant: "success"; message: string }
//   - { variant: "error"; message: string; onRetry: () => void }
//   - { variant: "warning"; message: string; dismissible: boolean; onDismiss?: () => void }
//
// Render different UI depending on the variant.
// The `onRetry` button only shows for "error".
// The dismiss button only shows for "warning" + dismissible === true.
//
// function Alert(props: AlertProps) { ... }

// TODO 3: LabeledInput with forwardRef
// - Props: { label: string } & React.InputHTMLAttributes<HTMLInputElement>
// - Use React.forwardRef<HTMLInputElement, LabeledInputProps>
// - Render a <label> (using a generated or passed id) and <input> together
// - The forwarded ref should attach to the <input>
//
// const LabeledInput = forwardRef<HTMLInputElement, LabeledInputProps>((props, ref) => { ... });

// TODO 4: Button extending native button props
// - Use React.ComponentProps<"button"> as the base
// - Add: variant?: "primary" | "secondary" | "danger"; size?: "sm" | "md" | "lg"
// - Merge the className prop with the variant/size class names
// - Spread all remaining native button props onto the <button>
//
// interface ButtonProps extends React.ComponentProps<"button"> { variant?: ...; size?: ...; }
// function Button({ variant = "primary", size = "md", className, ...rest }: ButtonProps) { ... }

// TODO 5: Type-safe useForm hook
// Generic over the shape of form values T (must be Record<string, string | number>).
// Returns:
//   - values: T
//   - handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void
//     (should update values[e.target.name] = e.target.value or e.target.valueAsNumber)
//   - reset: () => void (resets to initialValues)
//   - errors: Partial<Record<keyof T, string>>
//   - setError: (field: keyof T, message: string) => void
//
// function useForm<T extends Record<string, string | number>>(initialValues: T) { ... }

// TODO 6: Typed theme Context
// Define a Theme type: { mode: "light" | "dark"; primary: string; fontFamily: string }
// Create ThemeContext with a default light theme.
// Create a ThemeProvider that wraps children and allows overriding the theme.
// Create a useTheme hook that returns the context value (throw if used outside provider).
// Create a ThemedBox component that reads from useTheme and applies styles.
//
// type Theme = { mode: "light" | "dark"; primary: string; fontFamily: string };
// const ThemeContext = createContext<Theme>({ mode: "light", primary: "#2563eb", fontFamily: "sans-serif" });
// function ThemeProvider({ theme, children }: { theme: Partial<Theme>; children: React.ReactNode }) { ... }
// function useTheme(): Theme { ... }
// function ThemedBox({ children }: { children: React.ReactNode }) { ... }

export function App() {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Exercise: Advanced TypeScript Patterns</h1>
      <p style={{ color: "gray" }}>Complete the TODOs to see advanced TypeScript patterns.</p>

      {/* TODO 7: Use List<T> with products
          type Product = { id: number; name: string; price: number };
          const products: Product[] = [
            { id: 1, name: "React Course", price: 49 },
            { id: 2, name: "TS Handbook", price: 29 },
          ];
          <List
            items={products}
            renderItem={(p) => <span>{p.name} — ${p.price}</span>}
            emptyMessage="No products available."
          />
      */}

      {/* TODO 8: Use Alert with all three variants
          <Alert variant="success" message="Profile saved successfully!" />
          <Alert variant="error" message="Failed to load data." onRetry={() => alert("Retrying...")} />
          <Alert variant="warning" message="Your session expires soon." dismissible={true} onDismiss={() => alert("Dismissed")} />
      */}

      {/* TODO 9: Use LabeledInput with forwardRef
          <LabeledInput label="Username" ref={inputRef} placeholder="Enter username" />
          <button onClick={() => inputRef.current?.focus()}>Focus Input</button>
      */}

      {/* TODO 10: Use Button
          <Button variant="primary" size="lg" onClick={() => alert("Primary!")}>Primary Large</Button>
          <Button variant="secondary" size="sm">Secondary Small</Button>
          <Button variant="danger" disabled>Danger Disabled</Button>
      */}

      {/* TODO 11: Use useForm with a typed form
          const { values, handleChange, reset, errors, setError } = useForm({
            username: "",
            email: "",
            age: 0,
          });
          Render inputs for each field, validate on submit.
      */}

      {/* TODO 12: Use ThemeProvider + ThemedBox
          <ThemeProvider theme={{ mode: "dark", primary: "#7c3aed" }}>
            <ThemedBox>This box respects the theme!</ThemedBox>
          </ThemeProvider>
      */}
    </div>
  );
}
