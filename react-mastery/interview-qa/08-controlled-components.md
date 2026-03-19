# Controlled Components & Forms

### Q1: What is a controlled component in React?
**A:** A controlled component is a form element whose value is driven by React state. The component's value is set via a `value` prop and updated through an `onChange` handler. React is the "single source of truth" for the input's value at all times:
```jsx
function ControlledInput() {
  const [name, setName] = useState('');
  return <input value={name} onChange={(e) => setName(e.target.value)} />;
}
```

### Q2: What is an uncontrolled component?
**A:** An uncontrolled component stores its own state internally in the DOM, like a traditional HTML form element. You access its value via a `ref` rather than managing it with state. Use `defaultValue` instead of `value` to set initial values:
```jsx
function UncontrolledInput() {
  const inputRef = useRef(null);
  const handleSubmit = () => console.log(inputRef.current.value);
  return <input defaultValue="initial" ref={inputRef} />;
}
```

### Q3: When should you use controlled vs uncontrolled components?
**A:** Use **controlled** components when you need real-time validation, conditional rendering based on input, enforcing input formats, or when multiple elements share the same data. Use **uncontrolled** components for simple forms where you only need the value on submit, integrating with non-React code, or for file inputs (which are always uncontrolled). Controlled components are the recommended approach in most React applications.

### Q4: Why is the `value` prop without `onChange` a problem?
**A:** Setting `value` without `onChange` makes the input read-only because React enforces the state value on every render, but there's no handler to update that state. React will log a warning. To fix it, either add an `onChange` handler, use `defaultValue` for uncontrolled behavior, or explicitly pass `readOnly` if that's the intent.

### Q5: How do you handle multiple form inputs efficiently?
**A:** Use a single state object and a generic `onChange` handler that uses the input's `name` attribute as the key:
```jsx
const [form, setForm] = useState({ firstName: '', lastName: '', email: '' });

const handleChange = (e) => {
  const { name, value } = e.target;
  setForm(prev => ({ ...prev, [name]: value }));
};

return (
  <>
    <input name="firstName" value={form.firstName} onChange={handleChange} />
    <input name="lastName" value={form.lastName} onChange={handleChange} />
    <input name="email" value={form.email} onChange={handleChange} />
  </>
);
```

### Q6: How do you handle checkboxes and radio buttons as controlled components?
**A:** Checkboxes use `checked` instead of `value`, with `onChange` reading `e.target.checked`. Radio buttons use both `checked` (comparing against state) and `value`:
```jsx
// Checkbox
<input type="checkbox" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} />

// Radio buttons
<input type="radio" name="plan" value="free" checked={plan === 'free'} onChange={(e) => setPlan(e.target.value)} />
<input type="radio" name="plan" value="pro" checked={plan === 'pro'} onChange={(e) => setPlan(e.target.value)} />
```

### Q7: How do you handle select elements as controlled components?
**A:** In React, `<select>` uses a `value` prop on the parent element rather than the `selected` attribute on `<option>`. For multi-select, `value` is an array:
```jsx
<select value={selectedFruit} onChange={(e) => setSelectedFruit(e.target.value)}>
  <option value="apple">Apple</option>
  <option value="banana">Banana</option>
</select>
```

### Q8: Why are file inputs always uncontrolled in React?
**A:** File inputs (`<input type="file">`) are read-only from JavaScript for security reasons -- you cannot programmatically set the file list. Therefore, they're always uncontrolled. You handle them via refs or by reading `e.target.files` in an `onChange` handler:
```jsx
const handleFileChange = (e) => {
  const file = e.target.files[0];
  // process file
};
```

### Q9: How do you implement form validation in React?
**A:** You can validate on change, on blur, or on submit. A common pattern tracks errors in a parallel state object:
```jsx
const [errors, setErrors] = useState({});

const validate = (form) => {
  const errs = {};
  if (!form.email.includes('@')) errs.email = 'Invalid email';
  if (form.password.length < 8) errs.password = 'Must be 8+ characters';
  return errs;
};

const handleSubmit = (e) => {
  e.preventDefault();
  const errs = validate(form);
  setErrors(errs);
  if (Object.keys(errs).length === 0) submitForm(form);
};
```
Display errors conditionally: `{errors.email && <span>{errors.email}</span>}`.

### Q10: How do you debounce an input in React?
**A:** Keep a controlled input for immediate UI updates but debounce the side effect (like an API call). Use `useEffect` with a timeout or a debounce utility:
```jsx
const [query, setQuery] = useState('');

useEffect(() => {
  const timer = setTimeout(() => {
    fetchResults(query);
  }, 300);
  return () => clearTimeout(timer);
}, [query]);

return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
```
This approach keeps the input responsive while delaying expensive operations.

### Q11: What is the `defaultValue` prop and when is it used?
**A:** `defaultValue` sets the initial value of an uncontrolled form element. Unlike `value`, React only uses it during the initial render and doesn't control the element afterwards. It maps to the DOM's default behavior. Use it when you want the DOM to manage the input state, such as with simple forms or when integrating with third-party libraries.

### Q12: How do you reset a form in React?
**A:** For controlled forms, reset the state to initial values. For uncontrolled forms, call `formRef.current.reset()` or use the native form reset. With controlled forms:
```jsx
const initialState = { name: '', email: '' };
const [form, setForm] = useState(initialState);
const handleReset = () => setForm(initialState);
```
You can also use a `key` prop on the form/component to force a full remount, which resets all child state.

### Q13: [BONUS] How does React Hook Form differ from Formik?
**A:** **React Hook Form** uses uncontrolled inputs with refs for better performance (fewer re-renders), has a smaller bundle size (~9KB vs ~33KB), and uses a `register` pattern. **Formik** uses controlled inputs by default, provides a more React-idiomatic API with `<Formik>`, `<Field>`, and `<ErrorMessage>` components, but re-renders the entire form on each keystroke unless optimized. React Hook Form generally has better performance for large forms; Formik has a gentler learning curve.

### Q14: [BONUS] What are server actions for forms in React 19+?
**A:** React 19 introduces the `action` prop on `<form>` elements, which accepts an async function. Combined with `useFormStatus` and `useActionState`, this enables progressive enhancement where forms work without JavaScript and can submit directly to server functions:
```jsx
async function createUser(formData) {
  'use server';
  const name = formData.get('name');
  await db.users.create({ name });
}

function Form() {
  return (
    <form action={createUser}>
      <input name="name" />
      <SubmitButton />
    </form>
  );
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return <button disabled={pending}>Submit</button>;
}
```

### Q15: [BONUS] What is `useActionState` (formerly `useFormState`) in React 19?
**A:** `useActionState` wraps a form action to track its return value and pending state. It replaces the earlier `useFormState` from `react-dom`. It returns the current state, a wrapped action, and a pending boolean:
```jsx
const [state, formAction, isPending] = useActionState(async (prevState, formData) => {
  const result = await submitForm(formData);
  if (result.error) return { error: result.error };
  return { success: true };
}, { error: null });

return (
  <form action={formAction}>
    {state.error && <p>{state.error}</p>}
    <input name="email" />
    <button disabled={isPending}>Submit</button>
  </form>
);
```
