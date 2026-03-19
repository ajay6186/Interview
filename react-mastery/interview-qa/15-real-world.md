# Real-World React - Interview Q&A

---

### Q1: How do you structure a large React application?
**A:** Common approaches:
- **Feature-based structure** (recommended for large apps): group files by domain feature, not by type.
  ```
  src/
    features/
      auth/       (Login.tsx, authSlice.ts, useAuth.ts, auth.api.ts)
      products/   (ProductList.tsx, ProductCard.tsx, useProducts.ts)
    components/   (shared: Button, Modal, Input)
    hooks/        (shared custom hooks)
    utils/        (pure helpers)
    pages/        (route-level components, thin wrappers)
  ```
- **Type-based structure** (simpler for small apps): `components/`, `hooks/`, `pages/`, `utils/`.
- Co-locate tests next to their files (`Button.test.tsx` beside `Button.tsx`).

---

### Q2: What is code splitting and why does it matter?
**A:** Code splitting breaks the JavaScript bundle into smaller chunks that are loaded on demand. Without it, the entire app JS downloads before anything renders, causing slow initial load. With `React.lazy` + `Suspense`, route-level or feature-level code loads only when needed.

```tsx
const Dashboard = React.lazy(() => import("./pages/Dashboard"));

function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </Suspense>
  );
}
```

Tools like Vite and webpack perform tree-shaking and chunk splitting automatically.

---

### Q3: How do you handle authentication in a React SPA?
**A:** Common pattern:
1. Store the auth token in an `httpOnly` cookie (most secure) or memory state (never `localStorage` for sensitive tokens).
2. Create an `AuthContext` / `AuthProvider` that exposes `user`, `login`, `logout`.
3. Create a `ProtectedRoute` component that redirects to `/login` if unauthenticated.
4. On app load, call `/me` or `/auth/refresh` to restore the session.

```tsx
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
```

---

### Q4: How do you manage forms in React at scale?
**A:** Options:
- **React Hook Form (RHF)** — minimal re-renders, integrates with schema validators (Zod, Yup), great DX. Best for most cases.
- **Formik** — older but widely used, more boilerplate than RHF.
- **Custom controlled forms** — fine for simple cases (2–3 fields).

React Hook Form registers uncontrolled inputs by default but supports controlled inputs via `Controller`. It triggers re-renders only for validation errors, not on every keystroke.

```tsx
const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
<input {...register("email", { required: "Email is required", pattern: /^\S+@\S+$/ })} />
```

---

### Q5: How do you handle API data fetching in React?
**A:** Evolution:
1. **useEffect + fetch** — works but requires manual loading/error states and no caching.
2. **React Query (TanStack Query)** — the standard. Handles caching, background refetch, pagination, mutations, invalidation, loading/error states.
3. **SWR** — lighter alternative by Vercel with similar caching semantics.

```tsx
// React Query
const { data: users, isLoading, error } = useQuery({
  queryKey: ["users"],
  queryFn: () => fetch("/api/users").then(r => r.json()),
  staleTime: 5 * 60 * 1000, // 5 min cache
});
```

---

### Q6: What are the rules around React's Concurrent Mode and `useTransition`?
**A:** React 18 introduced Concurrent Mode, allowing React to interrupt, pause, and resume renders. `useTransition` marks state updates as non-urgent so React can yield to more important updates (like typing):

```tsx
const [isPending, startTransition] = useTransition();

function handleSearch(query: string) {
  setQuery(query); // urgent: update input immediately
  startTransition(() => {
    setSearchResults(computeExpensiveSearch(query)); // non-urgent
  });
}
```

`useDeferredValue` is the value-based equivalent — it defers re-renders triggered by a changing value.

---

### Q7: What are common React performance patterns?
**A:**
1. **`React.memo`** — prevents re-renders when props haven't changed.
2. **`useMemo`/`useCallback`** — memoize expensive values/callbacks (only when necessary).
3. **Virtualization** — render only visible rows for long lists (`react-window`, `@tanstack/virtual`).
4. **Code splitting** — lazy load routes and heavy components.
5. **`useTransition`** — defer non-urgent state updates.
6. **Avoid unnecessary context value recreation** — `useMemo` context values.
7. **Avoid anonymous functions in JSX** — extract handlers to avoid new references on every render (though this matters mostly when the handler is passed to `memo`-wrapped children).

---

### Q8: How do you handle errors gracefully in production React apps?
**A:**
1. **Error Boundaries** — catch render errors, display fallback UI, log to error tracking.
2. **Error tracking** — integrate Sentry, Datadog, or Bugsnag to capture errors in production.
3. **Global fetch error handling** — axios interceptors or React Query's `onError` global handler.
4. **Toast notifications** — surface user-friendly messages via a toast library.
5. **Loading/error states** — every data-fetching component should handle `isLoading`, `isError`, `isEmpty` states explicitly.

---

### Q9: What is the difference between SSR, SSG, and CSR?
**A:**
- **CSR (Client-Side Rendering)** — browser downloads a JS bundle, React renders in the browser. Slower initial load, great interactivity. (Vite + React)
- **SSR (Server-Side Rendering)** — server renders HTML on each request and sends it to the browser. Faster FCP, SEO-friendly, higher server cost. (Next.js)
- **SSG (Static Site Generation)** — HTML is generated at build time and served as static files. Fastest possible load, ideal for content that doesn't change often. (Next.js static export, Gatsby)
- **ISR (Incremental Static Regeneration)** — Next.js feature: static pages are regenerated on a schedule or on-demand without full rebuilds.

---

### Q10: How does React Router v6 work?
**A:** React Router v6 uses `<Routes>` + `<Route>` components. Key features:
- **Nested routes** — `<Outlet />` renders child routes inside layout components.
- **Relative paths** — child route paths are relative to their parent.
- **`useNavigate`** — programmatic navigation (replaces `useHistory`).
- **`useParams`** — access URL parameters.
- **`useSearchParams`** — access and update query strings.
- **`<Navigate>`** — declarative redirect component.
- **`loader`/`action`** (Data API, v6.4+) — pre-fetch data before the route renders.

---

### Q11: What are React Server Components (RSC)?
**A:** RSC (introduced experimentally in React 18, production-ready in Next.js 13+ App Router) are components that run exclusively on the server — they never ship JavaScript to the browser. Benefits: (1) Access databases, file systems, secrets directly, (2) Zero bundle size for server components, (3) Streaming HTML delivery. Client components are marked with `"use client"` and work as before. RSC is a paradigm shift — component selection (server vs client) becomes a key architectural decision.

---

### Q12: What is hydration in React?
**A:** Hydration is the process of attaching React's event listeners and state to server-rendered HTML. After the browser receives HTML from SSR, React's JS bundle loads and React "hydrates" the existing DOM (instead of re-rendering from scratch). This makes the page interactive. Hydration errors occur when the server-rendered HTML doesn't match what React would render on the client (e.g., due to time-dependent content or random IDs).
