# Code Splitting

### Q1: What is code splitting and why is it important?
**A:** Code splitting is the technique of breaking your JavaScript bundle into smaller chunks that are loaded on demand rather than all at once. This reduces the initial bundle size, speeds up the first meaningful paint, and improves Time to Interactive (TTI). Without code splitting, users download the entire app's code even for pages they never visit.

### Q2: How does `React.lazy` work?
**A:** `React.lazy` lets you define a component that is loaded dynamically. It takes a function that calls `import()` and returns a Promise resolving to a module with a default export. The component is only loaded when it's first rendered:
```jsx
const LazyComponent = React.lazy(() => import('./HeavyComponent'));
```
It must be rendered inside a `Suspense` boundary that provides a fallback UI while loading.

### Q3: What is `Suspense` and how does it relate to code splitting?
**A:** `Suspense` is a React component that lets you display a fallback UI while waiting for lazy-loaded components (or data in React 18+) to resolve. You wrap lazy components with `Suspense` and provide a `fallback` prop:
```jsx
<Suspense fallback={<Spinner />}>
  <LazyComponent />
</Suspense>
```
If multiple lazy components are inside one `Suspense`, the fallback shows until all of them have loaded.

### Q4: What is a dynamic import?
**A:** A dynamic `import()` is a JavaScript expression (not a declaration) that loads a module at runtime and returns a Promise. Unlike static `import` statements at the top of files, dynamic imports can be used conditionally and trigger code splitting in bundlers like webpack and Vite:
```js
const module = await import('./utils');
module.someFunction();
```
Bundlers create a separate chunk for each dynamic import target.

### Q5: How do you implement route-based code splitting?
**A:** Combine React Router with `React.lazy` so each page's code is loaded only when navigated to:
```jsx
const Home = React.lazy(() => import('./pages/Home'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Settings = React.lazy(() => import('./pages/Settings'));

function App() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </Suspense>
  );
}
```
This is the most common and effective code-splitting strategy because routes are natural split points.

### Q6: When would you use component-based code splitting instead of route-based?
**A:** Use component-based splitting for heavy components that aren't tied to routes: modals, rich text editors, charts, admin panels, or features behind feature flags. This is useful when a component is large but only needed in specific user interactions:
```jsx
const HeavyChart = React.lazy(() => import('./HeavyChart'));

function Dashboard() {
  const [showChart, setShowChart] = useState(false);
  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Analytics</button>
      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <HeavyChart />
        </Suspense>
      )}
    </div>
  );
}
```

### Q7: How do you preload a lazy component before it's needed?
**A:** Call the dynamic import function ahead of time (e.g., on hover or route prefetch). The browser caches the module, so when `React.lazy` triggers the same import, it resolves instantly:
```jsx
const importDashboard = () => import('./pages/Dashboard');
const Dashboard = React.lazy(importDashboard);

// Preload on hover
<Link to="/dashboard" onMouseEnter={importDashboard}>Dashboard</Link>
```
You can also preload in `useEffect` when you predict the user will navigate next.

### Q8: How do you handle errors when a lazy component fails to load?
**A:** Wrap the `Suspense` boundary in an Error Boundary. If the network request for the chunk fails, the error boundary catches it and can show a retry option:
```jsx
class ChunkErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return <button onClick={() => this.setState({ hasError: false })}>Retry</button>;
    }
    return this.props.children;
  }
}

<ChunkErrorBoundary>
  <Suspense fallback={<Spinner />}>
    <LazyComponent />
  </Suspense>
</ChunkErrorBoundary>
```

### Q9: What tools can you use for bundle analysis?
**A:** **webpack-bundle-analyzer** generates a treemap visualization of your bundles. **source-map-explorer** provides a similar view using source maps. For Vite, use **rollup-plugin-visualizer**. These tools help you identify large dependencies, duplicate modules, and opportunities for code splitting. Run them periodically to catch bundle size regressions.

### Q10: What are named exports and how do they affect `React.lazy`?
**A:** `React.lazy` requires a default export. If the target module uses named exports, create an intermediate module that re-exports the desired component as default:
```jsx
// ManyComponents.js exports { Chart, Table, List }

// ChartWrapper.js
export { Chart as default } from './ManyComponents';

// Usage
const Chart = React.lazy(() => import('./ChartWrapper'));
```
Alternatively, use `.then()` to transform the import: `React.lazy(() => import('./ManyComponents').then(mod => ({ default: mod.Chart })))`.

### Q11: What is the difference between `prefetch` and `preload` at the webpack level?
**A:** Webpack magic comments control chunk loading hints. `/* webpackPreload: true */` loads the chunk in parallel with the parent chunk (high priority, needed soon). `/* webpackPrefetch: true */` loads during browser idle time (low priority, might be needed later):
```jsx
// Preload - loads immediately in parallel
import(/* webpackPreload: true */ './CriticalChart');

// Prefetch - loads during idle time
import(/* webpackPrefetch: true */ './FuturePage');
```
Preload is for current-route dependencies; prefetch is for likely next navigations.

### Q12: Can you use `Suspense` without `React.lazy`?
**A:** Yes. In React 18+, `Suspense` is a general mechanism for declaratively handling async operations. Libraries like Relay, TanStack Query, and frameworks like Next.js use Suspense for data fetching. Any component that "suspends" (throws a Promise) triggers the nearest `Suspense` fallback. This is the foundation of React's concurrent rendering model.

### Q13: How do you avoid layout shifts when lazy loading components?
**A:** Reserve the space the component will occupy by using skeleton screens, fixed-dimension containers, or CSS `aspect-ratio`. A well-designed `Suspense` fallback should match the approximate dimensions of the real component. You can also preload components early to minimize the time the fallback is visible.

### Q14: [BONUS] How do React Server Components relate to code splitting?
**A:** React Server Components (RSC) provide automatic code splitting at the component level. Server Components are never sent to the client bundle -- only their rendered output is streamed as a special format. This means you don't need `React.lazy` for Server Components; the bundler automatically excludes them from the client bundle. Client Components are still bundled, but the server/client boundary acts as a natural split point.

### Q15: [BONUS] What is streaming SSR and how does it improve performance?
**A:** Streaming SSR (via `renderToPipeableStream` in React 18) sends HTML to the browser incrementally as components resolve. Combined with `Suspense`, the server can flush the shell immediately and stream in content as data loads. This improves Time to First Byte (TTFB) and First Contentful Paint. The client then hydrates each streamed section independently via selective hydration, making the page interactive faster than waiting for the entire page to render on the server.
