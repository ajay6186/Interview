# React Routing

### Q1: What is React Router and why do we need it?
**A:** React Router is the standard routing library for React. Since React is a single-page application (SPA) framework, the browser doesn't perform full page reloads on navigation. React Router intercepts URL changes, matches them to component trees, and renders the appropriate UI without a server roundtrip. It provides declarative routing, keeping the URL in sync with what's displayed.

### Q2: What is the difference between BrowserRouter and HashRouter?
**A:** `BrowserRouter` uses the HTML5 History API (`pushState`, `replaceState`) to create clean URLs like `/about`. It requires server-side configuration to serve `index.html` for all routes. `HashRouter` uses the URL hash (`/#/about`) which doesn't require server config since the hash is never sent to the server. `BrowserRouter` is preferred for production apps; `HashRouter` is useful for static file hosting or legacy environments.

### Q3: What is MemoryRouter and when would you use it?
**A:** `MemoryRouter` keeps the routing history in memory rather than in the URL bar. It's primarily used in testing environments where you need to control navigation history, and in non-browser environments like React Native. It's also useful for embedded widgets where you don't want to affect the host page's URL.

### Q4: What is the purpose of the `Route` component?
**A:** `Route` defines a mapping between a URL path and a component. When the current URL matches the route's `path` prop, the associated component is rendered. In React Router v6, routes are defined with `element` prop:
```jsx
<Route path="/users" element={<Users />} />
<Route path="/users/:id" element={<UserDetail />} />
```

### Q5: What changed from `Switch` in v5 to `Routes` in v6?
**A:** In v5, `Switch` rendered the first matching `Route`. In v6, `Switch` was replaced by `Routes`, which uses a ranking algorithm to pick the best match rather than just the first match. Routes in v6 are also relative by default, `exact` is no longer needed (all routes match exactly), and `element` replaced `component`/`render` props.

### Q6: What is the difference between `Link` and `NavLink`?
**A:** `Link` renders an anchor tag that navigates without a full page reload. `NavLink` is a special version of `Link` that knows whether it's "active" (matches the current URL). `NavLink` accepts a `className` or `style` prop as a function that receives `{ isActive, isPending }`, allowing you to style active navigation items:
```jsx
<NavLink to="/about" className={({ isActive }) => isActive ? "active" : ""}>
  About
</NavLink>
```

### Q7: How do you access route parameters in React Router v6?
**A:** Use the `useParams` hook. Define dynamic segments in the path with a colon prefix, then destructure the parameter from `useParams`:
```jsx
// Route definition
<Route path="/users/:userId" element={<UserProfile />} />

// Inside UserProfile component
function UserProfile() {
  const { userId } = useParams();
  return <div>User: {userId}</div>;
}
```

### Q8: How do nested routes work in React Router v6?
**A:** In v6, you nest `Route` elements inside parent routes and use the `Outlet` component to render child route content. Paths are relative to the parent:
```jsx
<Route path="/dashboard" element={<Dashboard />}>
  <Route index element={<DashboardHome />} />
  <Route path="settings" element={<Settings />} />  {/* /dashboard/settings */}
  <Route path="profile" element={<Profile />} />
</Route>

// Inside Dashboard component
function Dashboard() {
  return <div><nav>...</nav><Outlet /></div>;
}
```

### Q9: How do you navigate programmatically in React Router v6?
**A:** Use the `useNavigate` hook, which replaces v5's `useHistory`:
```jsx
function LoginForm() {
  const navigate = useNavigate();

  const handleSubmit = async () => {
    await login();
    navigate('/dashboard');          // push
    navigate('/dashboard', { replace: true }); // replace
    navigate(-1);                    // go back
  };
}
```

### Q10: How do you implement protected/private routes?
**A:** Create a wrapper component that checks authentication and either renders children or redirects:
```jsx
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

// Usage
<Route path="/dashboard" element={
  <ProtectedRoute><Dashboard /></ProtectedRoute>
} />
```
You can also use a layout route pattern with `Outlet` to protect multiple routes at once.

### Q11: How do you handle 404 (not found) routes?
**A:** Place a catch-all route with `path="*"` at the end of your routes:
```jsx
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/about" element={<About />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```
In v6, the ranking algorithm ensures `*` only matches when no other route does, regardless of order.

### Q12: What is the `Navigate` component used for?
**A:** `Navigate` is a component that redirects to a different route when rendered. It replaces v5's `Redirect`. It's commonly used for conditional redirects inside route elements, like redirecting unauthenticated users or redirecting from old URLs to new ones. The `replace` prop controls whether it replaces the current history entry.

### Q13: How do you implement route-based lazy loading?
**A:** Combine `React.lazy` with `Suspense` to load route components on demand:
```jsx
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Settings = React.lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```
Each route's bundle is only downloaded when the user navigates to it.

### Q14: How do you work with search/query parameters?
**A:** Use the `useSearchParams` hook, which works like `useState` but syncs with the URL query string:
```jsx
function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q');  // ?q=react

  return (
    <input
      value={query || ''}
      onChange={(e) => setSearchParams({ q: e.target.value })}
    />
  );
}
```

### Q15: What is the `useLocation` hook?
**A:** `useLocation` returns the current location object containing `pathname`, `search`, `hash`, and `state`. It's useful for reading the current URL, accessing state passed via navigation, or triggering effects on route changes:
```jsx
const location = useLocation();
useEffect(() => {
  analytics.pageView(location.pathname);
}, [location]);
```

### Q16: How do you pass state during navigation?
**A:** Pass a `state` object via `Link`, `Navigate`, or `useNavigate`. This state is stored in the history entry and doesn't appear in the URL:
```jsx
// Passing state
<Link to="/checkout" state={{ from: 'cart' }}>Checkout</Link>
navigate('/checkout', { state: { from: 'cart' } });

// Reading state
const location = useLocation();
console.log(location.state?.from); // 'cart'
```

### Q17: What is an index route?
**A:** An index route is a child route with no path that renders at the parent's URL. It acts as the default child content when no other child route matches. Defined with the `index` prop instead of `path`:
```jsx
<Route path="/dashboard" element={<Dashboard />}>
  <Route index element={<DashboardHome />} />  {/* renders at /dashboard */}
  <Route path="stats" element={<Stats />} />     {/* renders at /dashboard/stats */}
</Route>
```

### Q18: [BONUS] What are data routers in React Router v6.4+?
**A:** Data routers (`createBrowserRouter`, `createMemoryRouter`) are a new paradigm that couples data loading with routing. You define `loader` and `action` functions directly on routes. Loaders fetch data before the component renders (eliminating loading spinners), and actions handle form submissions. This is inspired by Remix's data model:
```jsx
const router = createBrowserRouter([
  {
    path: '/users/:id',
    element: <User />,
    loader: async ({ params }) => {
      return fetch(`/api/users/${params.id}`);
    },
    action: async ({ request }) => {
      const formData = await request.formData();
      return updateUser(formData);
    },
    errorElement: <ErrorPage />,
  },
]);

// In component
function User() {
  const user = useLoaderData();
  return <div>{user.name}</div>;
}
```

### Q19: [BONUS] What is the `useRouteLoaderData` hook?
**A:** `useRouteLoaderData` lets you access loader data from any route in the current route hierarchy by its route ID. This is useful when a child component needs data loaded by a parent route without prop drilling. You assign an `id` to the route and reference it:
```jsx
{ id: 'root', path: '/', loader: rootLoader, element: <Root /> }

// Deep nested child
const rootData = useRouteLoaderData('root');
```

### Q20: [BONUS] How does React Router handle errors with data routers?
**A:** Each route can define an `errorElement` that renders when its loader, action, or component throws. Errors bubble up to the nearest parent `errorElement`. Inside the error boundary, use `useRouteError()` to access the thrown error. This provides a declarative error handling pattern that's tightly integrated with routing:
```jsx
function ErrorPage() {
  const error = useRouteError();
  return <div>Error: {error.message}</div>;
}
```
