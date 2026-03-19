# Components - Interview Q&A

---

### Q1: What is a React component?
**A:** A React component is a reusable, self-contained piece of UI. It accepts inputs (props) and returns React elements describing what should appear on screen. Components can be defined as JavaScript functions (functional components) or ES6 classes (class components). The component tree forms the backbone of any React application.

---

### Q2: What is the difference between functional and class components?
**A:** **Functional components** are plain JavaScript functions that accept props and return JSX. They use hooks for state and lifecycle. **Class components** extend `React.Component`, use `this.state` and `this.setState`, and have lifecycle methods like `componentDidMount`. Functional components are the modern standard -- they are simpler, easier to test, and support all features via hooks. Class components are considered legacy but still fully supported.

```jsx
// Functional
function Greeting({ name }) {
  return <h1>Hello, {name}</h1>;
}

// Class
class Greeting extends React.Component {
  render() {
    return <h1>Hello, {this.props.name}</h1>;
  }
}
```

---

### Q3: What are Pure Components?
**A:** In class components, `React.PureComponent` is a base class that implements `shouldComponentUpdate` with a shallow comparison of props and state. If neither has changed (shallow equality), the component skips re-rendering. For functional components, the equivalent is `React.memo()`, which wraps a component and performs a shallow props comparison.

---

### Q4: What is component composition?
**A:** Component composition is the pattern of building complex UIs by combining simpler components together. Instead of using inheritance, React favors composition via the `children` prop or by passing components as props. This makes components more flexible, reusable, and easier to reason about.

```jsx
function Card({ header, children }) {
  return (
    <div className="card">
      <div className="card-header">{header}</div>
      <div className="card-body">{children}</div>
    </div>
  );
}

<Card header={<Title />}>
  <Content />
</Card>
```

---

### Q5: What are Props in React?
**A:** Props (short for properties) are read-only inputs passed from a parent component to a child component. They are received as a single object argument in functional components (or via `this.props` in class components). Props enable data flow from parent to child, making components configurable and reusable. A component must never modify its own props.

---

### Q6: What is State in React?
**A:** State is mutable data managed internally by a component. When state changes, React re-renders the component and its children. In functional components, state is managed with the `useState` hook; in class components, with `this.state` and `this.setState()`. State should only contain data that, when changed, should trigger a re-render.

---

### Q7: What is the difference between Props and State?
**A:** Props are external inputs passed by a parent -- they are read-only and the component cannot change them. State is internal data owned by the component -- it is mutable via `setState` or the state setter function. Props flow down the component tree; state is local. When state changes, React re-renders the component. When a parent's state changes and is passed as a prop, the child also re-renders.

---

### Q8: What are Controlled Components?
**A:** A controlled component is a form element whose value is controlled by React state. The component renders the current state value and updates state on every change event. This gives React full control over the form data, making it easy to validate, transform, or conditionally process input.

```jsx
function ControlledInput() {
  const [value, setValue] = useState('');
  return (
    <input
      value={value}
      onChange={e => setValue(e.target.value)}
    />
  );
}
```

---

### Q9: What are Uncontrolled Components?
**A:** Uncontrolled components let the DOM manage form state internally. You access the current value via a `ref` rather than tracking it in React state. They are simpler for basic cases and useful when integrating with non-React code. Use `defaultValue` instead of `value` to set the initial value.

```jsx
function UncontrolledInput() {
  const inputRef = useRef(null);
  const handleSubmit = () => console.log(inputRef.current.value);
  return <input ref={inputRef} defaultValue="initial" />;
}
```

---

### Q10: When would you use an uncontrolled component over a controlled one?
**A:** Uncontrolled components are useful when: (1) integrating with third-party DOM libraries, (2) building simple forms where you only need the value on submit (not on every keystroke), or (3) working with file inputs (`<input type="file" />`), which are always uncontrolled in React. For most cases, controlled components are preferred because they offer more control over validation and behavior.

---

### Q11: What are Presentational (Dumb) components?
**A:** Presentational components are concerned only with *how things look*. They receive data and callbacks exclusively via props, have no internal state (or only UI state like toggling), and typically are pure functions of their props. They are highly reusable and easy to test.

---

### Q12: What are Container (Smart) components?
**A:** Container components are concerned with *how things work*. They manage state, handle data fetching, contain business logic, and pass data down to presentational components via props. With the advent of hooks, the container/presentational split is less rigid -- hooks let any component manage its own data logic without this explicit separation.

---

### Q13: What are the lifecycle phases of a class component?
**A:** Class components have three lifecycle phases: (1) **Mounting** -- component is created and inserted into the DOM (`constructor`, `getDerivedStateFromProps`, `render`, `componentDidMount`), (2) **Updating** -- component re-renders due to new props or state (`getDerivedStateFromProps`, `shouldComponentUpdate`, `render`, `getSnapshotBeforeUpdate`, `componentDidUpdate`), (3) **Unmounting** -- component is removed from the DOM (`componentWillUnmount`).

---

### Q14: What is `componentDidMount`?
**A:** `componentDidMount` is a class lifecycle method called once, immediately after the component is inserted into the DOM. It is the ideal place for side effects like API calls, setting up subscriptions, or manipulating the DOM directly. The functional component equivalent is `useEffect` with an empty dependency array.

---

### Q15: What is `componentWillUnmount`?
**A:** `componentWillUnmount` is called immediately before a class component is removed from the DOM. It is used for cleanup -- cancelling network requests, removing event listeners, clearing timers, and unsubscribing from observables. The functional equivalent is the cleanup function returned from `useEffect`.

---

### Q16: What are Higher-Order Components (HOCs)?
**A:** A HOC is a function that takes a component and returns a new, enhanced component. It is a pattern for reusing component logic -- the HOC wraps the input component and injects additional props or behavior. Common examples include `connect()` from Redux and `withRouter()` from React Router. HOCs should not mutate the original component.

```jsx
function withLogging(WrappedComponent) {
  return function EnhancedComponent(props) {
    useEffect(() => { console.log('Rendered:', WrappedComponent.name); }, []);
    return <WrappedComponent {...props} />;
  };
}

const LoggedButton = withLogging(Button);
```

---

### Q17: What are the downsides of HOCs?
**A:** HOCs can lead to: (1) **Wrapper hell** -- deeply nested component trees that are hard to debug, (2) **Prop name collisions** -- multiple HOCs may inject props with the same name, (3) **Indirection** -- it is not immediately clear where props come from, (4) **Static method loss** -- static methods on the wrapped component are not forwarded automatically. Custom hooks have largely replaced HOCs in modern React.

---

### Q18: What is the Render Props pattern?
**A:** Render props is a pattern where a component receives a function as a prop (often called `render` or `children`) and calls that function to determine what to render. This allows sharing logic between components without HOCs. The function receives internal state/data as arguments.

```jsx
function MouseTracker({ render }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  // ... mouse move handler
  return render(position);
}

<MouseTracker render={({ x, y }) => <p>Mouse: {x}, {y}</p>} />
```

---

### Q19: What are Compound Components?
**A:** Compound components are a pattern where a parent component shares implicit state with its children, and the children are designed to work together as a cohesive unit. Think of `<select>` and `<option>` in HTML. In React, this is typically implemented using React Context to share state between the parent and its specialized children.

```jsx
<Tabs defaultTab="tab1">
  <Tabs.List>
    <Tabs.Tab id="tab1">Tab 1</Tabs.Tab>
    <Tabs.Tab id="tab2">Tab 2</Tabs.Tab>
  </Tabs.List>
  <Tabs.Panel id="tab1">Content 1</Tabs.Panel>
  <Tabs.Panel id="tab2">Content 2</Tabs.Panel>
</Tabs>
```

---

### Q20: What is `React.memo`?
**A:** `React.memo` is a higher-order component that memoizes a functional component. It performs a shallow comparison of the previous and new props -- if they are equal, React skips re-rendering the component and reuses the last rendered output. You can pass a custom comparison function as the second argument for more granular control.

```jsx
const ExpensiveList = React.memo(function ExpensiveList({ items }) {
  return items.map(item => <Item key={item.id} {...item} />);
});

// With custom comparison
const MemoComp = React.memo(MyComponent, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id;
});
```

---

### Q21: What is `forwardRef`?
**A:** `React.forwardRef` creates a component that can receive a `ref` and forward it to a child DOM element or component. By default, refs do not pass through functional components. `forwardRef` is essential for reusable component libraries where consumers need direct access to the underlying DOM node.

```jsx
const FancyInput = React.forwardRef((props, ref) => {
  return <input ref={ref} className="fancy" {...props} />;
});

// Usage
const inputRef = useRef();
<FancyInput ref={inputRef} />
```

---

### Q22: What is the `children` prop?
**A:** `children` is a special prop automatically populated with whatever content is placed between a component's opening and closing tags. It can be a string, element, array of elements, or even a function (render props pattern). This makes components composable and flexible.

```jsx
function Wrapper({ children }) {
  return <div className="wrapper">{children}</div>;
}

<Wrapper>
  <h1>Hello</h1>
  <p>World</p>
</Wrapper>
```

---

### Q23: What is prop drilling and how do you avoid it?
**A:** Prop drilling is when props are passed through multiple intermediate components that don't use them, just to reach a deeply nested component. It makes code harder to maintain and refactor. Solutions include: (1) **React Context** for global/shared state, (2) **Component composition** (passing components as props), (3) **State management libraries** like Redux, Zustand, or Jotai.

---

### [BONUS] Q24: What are React Server Components vs Client Components?
**A:** **Server Components** (default in Next.js App Router) run on the server, can access server-side resources (databases, file system), and send zero JavaScript to the client. **Client Components** (marked with `"use client"`) run in the browser and handle interactivity, event handlers, hooks, and browser APIs. Server components can render client components, but client components cannot import server components. This split reduces bundle size and improves performance.

---

### [BONUS] Q25: How does `forwardRef` work with `useImperativeHandle`?
**A:** `useImperativeHandle` customizes the instance value exposed to parent components when using `forwardRef`. Instead of exposing the entire DOM node, you can expose a limited API with specific methods. This provides better encapsulation and a cleaner component interface.

```jsx
const CustomInput = React.forwardRef((props, ref) => {
  const inputRef = useRef();
  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current.focus(),
    clear: () => { inputRef.current.value = ''; }
  }));
  return <input ref={inputRef} {...props} />;
});
```

---

### [BONUS] Q26: What is the difference between `React.createElement` and component instantiation?
**A:** `React.createElement(type, props, children)` creates a React element -- a plain JavaScript object describing what to render. It does *not* instantiate a component or create a DOM node. React itself handles instantiation during the reconciliation phase. Writing `<MyComponent />` in JSX is syntactic sugar for `React.createElement(MyComponent, null)`. The element is a lightweight description; the actual component instance (or fiber) is managed by React internally.
