# TypeScript with React - Interview Q&A

---

### Q1: How do you type component props in React with TypeScript?
**A:** Define an `interface` or `type` for props and pass it as a generic to `React.FC` or annotate the function parameter directly. Direct parameter annotation is preferred:

```tsx
// Preferred (direct annotation)
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}

function Button({ label, onClick, disabled = false, variant = "primary" }: ButtonProps) {
  return <button onClick={onClick} disabled={disabled} className={variant}>{label}</button>;
}

// Using React.FC (less preferred — adds implicit children type in older React versions)
const Button: React.FC<ButtonProps> = ({ label, onClick }) => { ... };
```

---

### Q2: How do you type `children` in React with TypeScript?
**A:** Use `React.ReactNode` for the most permissive type (accepts JSX, strings, numbers, arrays, null, etc.). Use `React.ReactElement` if you only want JSX elements (not strings/numbers). In React 18+, `React.FC` no longer implicitly includes `children` — you must declare it explicitly.

```tsx
interface CardProps {
  children: React.ReactNode;  // most common
  title: string;
}

// Or for a component that only accepts a single JSX child:
interface WrapperProps {
  children: React.ReactElement;
}
```

---

### Q3: How do you type `useState` with TypeScript?
**A:** TypeScript can usually infer the type from the initial value. Provide the generic when inference is insufficient:

```tsx
const [count, setCount] = useState(0);           // inferred: number
const [name, setName] = useState("");             // inferred: string
const [user, setUser] = useState<User | null>(null); // explicit: User | null
const [items, setItems] = useState<string[]>([]); // explicit: string[]
```

---

### Q4: How do you type `useRef` in React?
**A:** Pass the DOM element type as the generic. Initial value for DOM refs must be `null`; for mutable value refs, it can be anything:

```tsx
// DOM ref — the ref.current will be HTMLInputElement | null
const inputRef = useRef<HTMLInputElement>(null);
inputRef.current?.focus(); // use optional chaining — it's null until mounted

// Mutable value ref (like an instance variable)
const timerRef = useRef<number | null>(null);
```

---

### Q5: How do you type event handlers in React?
**A:** React provides typed synthetic event interfaces:

```tsx
// Input change
function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
  setValue(e.target.value);
}

// Form submit
function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
  e.preventDefault();
}

// Button click
function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
  console.log(e.currentTarget);
}

// Keyboard
function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
  if (e.key === "Enter") submit();
}
```

---

### Q6: How do you type `useContext`?
**A:** Type the context at creation time with `createContext<T>()`. Use a non-null assertion or a custom hook with an early throw for safety:

```tsx
interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook with safety check
function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
```

---

### Q7: How do you type a custom hook?
**A:** Type the parameters and return type explicitly. Return a tuple or an object:

```tsx
// Returning a tuple (like useState)
function useToggle(initial = false): [boolean, () => void] {
  const [value, setValue] = useState(initial);
  const toggle = useCallback(() => setValue(v => !v), []);
  return [value, toggle];
}

// Returning an object
function useFetch<T>(url: string): { data: T | null; loading: boolean; error: string | null } {
  const [data, setData] = useState<T | null>(null);
  // ... fetch logic
  return { data, loading, error };
}
```

---

### Q8: What is the `PropsWithChildren` utility type?
**A:** `React.PropsWithChildren<P>` is a utility that adds `children?: React.ReactNode` to your props type. It's a shortcut to avoid typing `children` manually:

```tsx
type CardProps = React.PropsWithChildren<{ title: string }>;
// Equivalent to: { title: string; children?: React.ReactNode }
```

Direct declaration is more explicit and preferred in newer codebases.

---

### Q9: How do you use generic components in React + TypeScript?
**A:** Add a generic parameter to the component function. Note: in `.tsx` files, you need `<T,>` (trailing comma) or `extends object` to disambiguate from JSX:

```tsx
function List<T extends { id: number; label: string }>({ items }: { items: T[] }) {
  return (
    <ul>
      {items.map(item => <li key={item.id}>{item.label}</li>)}
    </ul>
  );
}

// TypeScript infers T from usage:
<List items={[{ id: 1, label: "React" }, { id: 2, label: "TypeScript" }]} />
```

---

### Q10: How do you type `forwardRef`?
**A:** Use `React.forwardRef<RefType, PropsType>`:

```tsx
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const LabeledInput = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, ...rest }, ref) => (
    <div>
      <label>{label}</label>
      <input ref={ref} {...rest} />
    </div>
  )
);

// Usage:
const ref = useRef<HTMLInputElement>(null);
<LabeledInput label="Name" ref={ref} />;
```

---

### Q11: What is the `ComponentProps` utility type and when is it useful?
**A:** `React.ComponentProps<"div">` extracts the props type of a native HTML element (or a component). Useful when you want to extend a native element's props without listing them all:

```tsx
// Extend native button props
interface MyButtonProps extends React.ComponentProps<"button"> {
  variant?: "primary" | "danger";
}

function MyButton({ variant = "primary", className, ...rest }: MyButtonProps) {
  return <button className={`btn-${variant} ${className ?? ""}`} {...rest} />;
}
```

---

### Q12: What is `discriminated union` and how is it useful in React props?
**A:** A discriminated union uses a common literal property (`kind`, `type`, `variant`) to narrow the type. Great for component props that have mutually exclusive configurations:

```tsx
type AlertProps =
  | { variant: "success"; message: string }
  | { variant: "error"; message: string; retryFn: () => void }
  | { variant: "info"; message: string; learnMoreUrl: string };

function Alert(props: AlertProps) {
  if (props.variant === "error") {
    // TypeScript knows `retryFn` exists here
    return <div><span>{props.message}</span><button onClick={props.retryFn}>Retry</button></div>;
  }
  // ...
}
```
