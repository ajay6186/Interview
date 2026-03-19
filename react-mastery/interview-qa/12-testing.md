# Testing React Components - Interview Q&A

---

### Q1: What is React Testing Library (RTL) and why is it preferred?
**A:** React Testing Library is a testing utility built on top of DOM Testing Library that renders React components into a real DOM (using jsdom) and provides queries to find elements the way a user would — by text, role, label, etc. It is preferred because: (1) Tests resemble real user interactions, (2) It discourages testing implementation details (internal state, component methods), (3) Tests survive refactors as long as behavior is unchanged, (4) It has become the de-facto standard for React component testing.

---

### Q2: What is the testing pyramid for React apps?
**A:**
```
        /\
       /E2E\        ← Few, slow, expensive (Cypress, Playwright)
      /------\
     /Integra-\     ← Medium (RTL, multiple components together)
    /----------\
   /   Unit     \   ← Many, fast, cheap (single component/hook)
  /--------------\
```
- **Unit tests** — test a single component or custom hook in isolation.
- **Integration tests** — test multiple components working together (form submits, data flows).
- **E2E tests** — test full user flows in a real browser.
RTL sits in the integration layer — it's the sweet spot for most React testing.

---

### Q3: What is the difference between `getBy`, `queryBy`, and `findBy` queries?
**A:**
| Query | Throws if not found | Returns | Use when |
|---|---|---|---|
| `getBy*` | Yes (synchronously) | Element | Element must exist right now |
| `queryBy*` | No (returns null) | Element or null | Testing element is absent |
| `findBy*` | Yes (after await) | Promise<Element> | Async — element appears after re-render |

```tsx
getByText("Submit");         // throws if missing
queryByText("Loading...");   // returns null if not found — good for asserting absence
await findByText("Success"); // waits up to timeout for element to appear
```

---

### Q4: What queries does RTL prioritize and why?
**A:** RTL follows an accessibility-first priority:
1. `getByRole` — most preferred; mirrors screen reader behavior
2. `getByLabelText` — form elements
3. `getByPlaceholderText`
4. `getByText` — visible text
5. `getByDisplayValue` — current value of inputs
6. `getByAltText`, `getByTitle`
7. `getByTestId` — last resort; use `data-testid`

Prefer `getByRole` because it verifies the element is accessible and has the correct semantic role.

---

### Q5: How do you test a component with `userEvent` vs `fireEvent`?
**A:** `fireEvent` dispatches a single DOM event. `userEvent` simulates full user interactions more realistically — clicking, typing, tabbing. Prefer `userEvent` for most tests:

```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

test("increments counter on click", async () => {
  const user = userEvent.setup();
  render(<Counter />);
  expect(screen.getByText("Count: 0")).toBeInTheDocument();
  await user.click(screen.getByRole("button", { name: /increment/i }));
  expect(screen.getByText("Count: 1")).toBeInTheDocument();
});
```

---

### Q6: How do you test asynchronous behavior (API calls, timers)?
**A:** Use `findBy*` queries or `waitFor` for async elements. Mock API calls with `vi.fn()` or `msw`:

```tsx
// Mocking fetch
global.fetch = vi.fn().mockResolvedValue({
  json: async () => ({ name: "Alice" }),
});

test("shows user name after fetch", async () => {
  render(<UserProfile userId={1} />);
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  expect(await screen.findByText("Alice")).toBeInTheDocument();
});
```

For timers, use `vi.useFakeTimers()` and `vi.advanceTimersByTime()`.

---

### Q7: How do you test a custom hook?
**A:** Use `renderHook` from RTL:

```tsx
import { renderHook, act } from "@testing-library/react";
import { useCounter } from "./useCounter";

test("increments count", () => {
  const { result } = renderHook(() => useCounter(0));
  expect(result.current.count).toBe(0);
  act(() => result.current.increment());
  expect(result.current.count).toBe(1);
});
```

`act` is required when the hook triggers a state update.

---

### Q8: What is `vi.mock` and how do you use it in Vitest?
**A:** `vi.mock` replaces a module with a mock implementation for the duration of the test. Useful for mocking API clients, routers, or third-party hooks:

```tsx
vi.mock("../api", () => ({
  fetchUser: vi.fn().mockResolvedValue({ id: 1, name: "Bob" }),
}));
```

For React Router's `useNavigate`:
```tsx
const mockNavigate = vi.fn();
vi.mock("react-router-dom", () => ({
  ...vi.importActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));
```

---

### Q9: How do you test components that use Context?
**A:** Wrap the component in the provider during rendering:

```tsx
function renderWithTheme(ui: React.ReactElement) {
  return render(
    <ThemeContext.Provider value="dark">{ui}</ThemeContext.Provider>
  );
}

test("renders with dark theme", () => {
  renderWithTheme(<Button />);
  expect(screen.getByRole("button")).toHaveClass("dark");
});
```

Or create a custom `render` wrapper that includes all providers your app needs.

---

### Q10: What should you NOT test in React components?
**A:** (1) **Internal implementation** — don't test `useState` values or private methods. (2) **Third-party library internals** — trust that React, RTL, etc. work correctly. (3) **Styling details** — exact CSS pixel values, unless accessibility-critical. (4) **Snapshot tests for large trees** — they break too easily and don't communicate intent. Small, meaningful snapshots are OK. Focus on: behavior, user interactions, accessibility, error states, and loading states.

---

### Q11: What is Mock Service Worker (MSW) and when do you use it?
**A:** MSW intercepts network requests at the service worker / Node.js level and returns mocked responses. Unlike mocking `fetch` directly, MSW works regardless of how your code makes requests (axios, fetch, ky). It's the gold standard for integration tests that involve API calls.

```ts
// handlers.ts
import { http, HttpResponse } from "msw";
export const handlers = [
  http.get("/api/users", () => HttpResponse.json([{ id: 1, name: "Alice" }])),
];
```

---

### Q12: What is the difference between unit, integration, and snapshot testing?
**A:**
- **Unit** — isolates a single component or function. Fast, easy to write.
- **Integration** — tests multiple components interacting. Catches wiring bugs.
- **Snapshot** — captures a rendered output and fails if it changes unexpectedly. Good for detecting unintentional UI changes, but noisy if overused.

Snapshots are most useful for small, stable UI pieces (like design system components). For complex components with lots of logic, prefer explicit assertions.
