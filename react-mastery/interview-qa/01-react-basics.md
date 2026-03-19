# React Basics - Interview Q&A

---

### Q1: What is React?
**A:** React is an open-source JavaScript library for building user interfaces, developed and maintained by Meta (formerly Facebook). It follows a component-based architecture where UIs are broken into reusable, self-contained pieces. React uses a virtual DOM to efficiently update only the parts of the real DOM that have changed, resulting in high-performance rendering.

---

### Q2: Why use React over vanilla JavaScript?
**A:** React provides a declarative API so you describe *what* the UI should look like rather than *how* to manipulate the DOM. It offers reusable components, efficient rendering via the virtual DOM, a massive ecosystem, and strong community support. For complex, data-driven UIs, React drastically reduces boilerplate compared to imperative DOM manipulation.

---

### Q3: What is the Virtual DOM?
**A:** The Virtual DOM is a lightweight, in-memory JavaScript representation of the real DOM tree. When state changes, React creates a new virtual DOM tree, diffs it against the previous one (reconciliation), and applies only the minimal set of changes to the real DOM. This batched, selective update process is significantly faster than directly manipulating the real DOM for every change.

---

### Q4: How does the Virtual DOM differ from the Real DOM?
**A:** The Real DOM is the browser's actual document object model -- updating it is slow because it triggers layout recalculation, repainting, and reflow. The Virtual DOM is a plain JavaScript object tree that can be created and compared cheaply. React diffs two virtual DOM snapshots and produces a minimal patch to apply to the real DOM, avoiding expensive full re-renders.

---

### Q5: What are the main features of React?
**A:** Key features include: (1) **JSX** -- a syntax extension that lets you write HTML-like code in JavaScript, (2) **Components** -- reusable, composable building blocks, (3) **One-way data binding** -- data flows from parent to child via props, making data flow predictable, (4) **Virtual DOM** -- efficient diffing and patching, and (5) **Declarative UI** -- you describe the desired state and React handles DOM updates.

---

### Q6: What is JSX?
**A:** JSX (JavaScript XML) is a syntax extension that allows you to write HTML-like markup directly inside JavaScript. It is not valid JavaScript on its own -- Babel (or another compiler) transpiles JSX into `React.createElement()` calls (or the new JSX transform). JSX makes component templates more readable and allows embedding JavaScript expressions using curly braces `{}`.

---

### Q7: What is one-way data binding in React?
**A:** One-way data binding means data flows in a single direction -- from parent components down to child components via props. A child cannot directly modify its parent's state. If a child needs to communicate upward, the parent passes a callback function as a prop. This unidirectional flow makes the application state predictable and easier to debug.

---

### Q8: What is the difference between React and Angular?
**A:** React is a *library* focused on the view layer, giving you freedom to choose routing, state management, and other tools. Angular is a full *framework* with built-in solutions for routing, HTTP, forms, and dependency injection. React uses JSX and a virtual DOM; Angular uses HTML templates with directives and change detection. React has a gentler learning curve for the core library, while Angular provides a more opinionated, batteries-included structure.

---

### Q9: What is the difference between React and Vue?
**A:** Both React and Vue use a virtual DOM and component-based architecture. Vue uses HTML-based templates by default (though it supports JSX), while React uses JSX exclusively. Vue has a more gentle learning curve and provides official solutions for routing and state management. React has a larger ecosystem and corporate backing from Meta, and tends to be the choice for larger enterprise applications.

---

### Q10: What is a Single Page Application (SPA)?
**A:** A SPA loads a single HTML page and dynamically updates content as the user navigates, without full page reloads. JavaScript handles routing on the client side, fetching data via APIs and re-rendering components. This provides a smoother, app-like user experience. React is commonly used to build SPAs, often paired with a client-side router like React Router.

---

### Q11: What is the difference between SPA and MPA?
**A:** In a **SPA**, the server sends a single HTML shell and JavaScript handles all routing and rendering client-side, resulting in faster navigation after the initial load. In a **Multi-Page Application (MPA)**, each route is a separate HTML page served by the server, causing full page reloads on navigation. SPAs offer better UX but can have slower initial load times and SEO challenges; MPAs have simpler SEO but feel slower to navigate.

---

### Q12: What is the React Fiber architecture?
**A:** React Fiber is the reimplemented reconciliation engine introduced in React 16. It replaces the old synchronous, recursive stack-based reconciler with an incremental, asynchronous one. Fiber breaks rendering work into small units ("fibers") that can be paused, prioritized, and resumed. This enables features like time-slicing and concurrent rendering, allowing React to keep the UI responsive even during heavy updates.

---

### Q13: What is reconciliation in React?
**A:** Reconciliation is the algorithm React uses to diff the previous virtual DOM tree against the new one to determine the minimal set of DOM operations needed. It uses two key heuristics: (1) elements of different types produce different trees (full replacement), and (2) the `key` prop helps identify which items in a list have changed, moved, or been removed. This makes the diffing process O(n) instead of O(n^3).

---

### Q14: Why are keys important in React lists?
**A:** Keys give each list item a stable identity across re-renders. Without keys (or with index-based keys), React cannot reliably track which items changed, leading to incorrect DOM reuse, bugs with component state, and poor performance. A good key is a unique, stable identifier from your data (like an `id` field), not the array index.

```jsx
{items.map(item => (
  <ListItem key={item.id} value={item.name} />
))}
```

---

### Q15: What is the difference between state and props?
**A:** **Props** are read-only inputs passed from a parent component to a child; they cannot be modified by the receiving component. **State** is mutable data owned and managed internally by a component. When state changes, React re-renders the component. Props flow down (parent to child), while state is local. To share state across components, you lift it up to a common ancestor or use a state management solution.

---

### Q16: What are React 18's key features?
**A:** React 18 introduced: (1) **Concurrent Rendering** -- React can prepare multiple versions of the UI simultaneously, (2) **Automatic Batching** -- state updates in promises, timeouts, and event handlers are batched automatically, (3) **Transitions** (`startTransition`) -- mark non-urgent updates so React can keep the UI responsive, (4) **Suspense on the server** -- streaming SSR with selective hydration, and (5) new hooks like `useId`, `useDeferredValue`, and `useSyncExternalStore`.

---

### Q17: What is Concurrent Mode (Concurrent Rendering)?
**A:** Concurrent rendering is a mechanism in React 18+ that allows React to work on multiple state updates at the same time. React can start rendering an update, pause to handle a more urgent one, then resume. This keeps the UI responsive during expensive renders. It is opt-in via APIs like `startTransition` and `useDeferredValue`, and requires using `createRoot` instead of `ReactDOM.render`.

---

### Q18: What is automatic batching in React 18?
**A:** Before React 18, batching (grouping multiple state updates into a single re-render) only worked inside React event handlers. React 18 extends automatic batching to *all* contexts -- `setTimeout`, `Promise.then`, native event handlers, and more. This reduces unnecessary re-renders and improves performance without any code changes.

```jsx
// React 18: both updates are batched into ONE re-render
setTimeout(() => {
  setCount(c => c + 1);
  setFlag(f => !f);
}, 1000);
```

---

### Q19: What is `startTransition` in React 18?
**A:** `startTransition` marks a state update as non-urgent (a "transition"). React will keep the current UI responsive and render the transition in the background. If a more urgent update (like typing in an input) comes in, React interrupts the transition to handle it first. This is ideal for expensive updates like filtering a large list.

```jsx
import { startTransition } from 'react';

startTransition(() => {
  setSearchResults(filterLargeList(query));
});
```

---

### Q20: What is `useDeferredValue`?
**A:** `useDeferredValue` accepts a value and returns a deferred version that may lag behind. React will first render with the old deferred value (keeping the UI responsive) and then re-render in the background with the new value. It is useful when you cannot wrap the state update itself in `startTransition` because the value comes from props or an external source.

```jsx
const deferredQuery = useDeferredValue(query);
// Use deferredQuery in expensive rendering
```

---

### Q21: What is React Strict Mode?
**A:** `<React.StrictMode>` is a development-only wrapper that helps identify potential problems. It intentionally double-invokes certain functions (render, effects, constructors) to detect impure renders and side effects. In React 18, it also simulates unmounting and remounting components to prepare for future features like offscreen rendering. It produces no visible UI and has no effect in production builds.

---

### Q22: What is the `createRoot` API?
**A:** `createRoot` is the new root API introduced in React 18, replacing `ReactDOM.render`. It opts your app into concurrent features like automatic batching, transitions, and streaming SSR. Usage: `const root = createRoot(document.getElementById('root')); root.render(<App />);`. The legacy `ReactDOM.render` still works but does not enable concurrent features.

---

### Q23: What is React's component-based architecture?
**A:** React applications are built by composing small, reusable components, each responsible for rendering a piece of the UI. Components can contain other components, forming a tree. Each component manages its own markup, styles, and logic, making code modular, testable, and maintainable. Data flows through the tree via props, and components re-render when their state or props change.

---

### [BONUS] Q24: What are React Server Components (RSC)?
**A:** React Server Components are components that run exclusively on the server. They can directly access databases, file systems, and other server-side resources without sending their JavaScript to the client. They reduce bundle size because their code never reaches the browser. RSCs are marked by default in frameworks like Next.js (App Router); client components opt in with `"use client"`. RSCs can render client components but not vice versa.

---

### [BONUS] Q25: What is the React Compiler (React Forget)?
**A:** The React Compiler (previously known as React Forget) is an optimizing compiler that automatically memoizes components and hooks at build time. It eliminates the need for manual `useMemo`, `useCallback`, and `React.memo` calls by analyzing your code and inserting memoization where beneficial. It understands the Rules of React and optimizes only safe transformations. It is being adopted incrementally at Meta and is available experimentally for the community.

---

### [BONUS] Q26: What is Suspense and how does it work?
**A:** `<Suspense>` lets you declaratively specify a loading fallback while child components are waiting for asynchronous data (or lazy-loaded code). When a child "suspends" (throws a promise), React shows the fallback UI until the promise resolves, then re-renders with the data. Combined with React 18's concurrent features, Suspense enables streaming SSR and selective hydration.

```jsx
<Suspense fallback={<Spinner />}>
  <LazyComponent />
</Suspense>
```

---

### [BONUS] Q27: What is Selective Hydration?
**A:** Selective hydration is a React 18 SSR feature that allows React to hydrate parts of the page independently and prioritize based on user interaction. If a user clicks on a section that hasn't been hydrated yet, React will prioritize hydrating that section first. This works together with `<Suspense>` boundaries on the server to stream HTML and hydrate progressively, improving Time to Interactive.
