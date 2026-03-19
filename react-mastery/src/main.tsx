import React from "react";
import ReactDOM from "react-dom/client";

// =============================================================
// React Mastery - Exercise Runner
// =============================================================
// HOW TO SWITCH EXERCISES:
//   1. Comment out the current active import (the one without //)
//   2. Uncomment ONE exercise import below
//   3. Save — Vite hot-reloads instantly
//
// RULE: Exactly ONE import must be active at a time.
// =============================================================

// Default welcome screen — comment this out when starting an exercise
// import { App } from "./Welcome";

// --- Phase 1: Fundamentals ---
// import { App } from "../exercises/phase-1-fundamentals/01-jsx-and-rendering/exercise";
// import { App } from "../exercises/phase-1-fundamentals/01-jsx-and-rendering/solution";
// import { App } from "../exercises/phase-1-fundamentals/02-functional-components/exercise";
// import { App } from "../exercises/phase-1-fundamentals/02-functional-components/solution";
// import { App } from "../exercises/phase-1-fundamentals/03-props-and-data-flow/exercise";
// import { App } from "../exercises/phase-1-fundamentals/03-props-and-data-flow/solution";
// import { App } from "../exercises/phase-1-fundamentals/04-conditional-rendering/exercise";
// import { App } from "../exercises/phase-1-fundamentals/04-conditional-rendering/solution";
// import { App } from "../exercises/phase-1-fundamentals/05-lists-and-keys/exercise";
// import { App } from "../exercises/phase-1-fundamentals/05-lists-and-keys/solution";

// --- Feature-based Architecture Demo (Login → Counter) ---
// import { App } from "./App";

// --- Phase 2: Hooks Core ---
// import { App } from "../exercises/phase-2-hooks/01-useState/exercise";
// import { App } from "../exercises/phase-2-hooks/01-useState/solution";
// import { App } from "../exercises/phase-2-hooks/02-useEffect/exercise";
// import { App } from "../exercises/phase-2-hooks/02-useEffect/solution";
// import { App } from "../exercises/phase-2-hooks/02-useEffect/useEffect-examples.tsx"
import { App } from "../exercises/phase-2-hooks/03-useContext/exercise";
// import { App } from "../exercises/phase-2-hooks/03-useContext/solution";
// import { App } from "../exercises/phase-2-hooks/04-useReducer/exercise";
// import { App } from "../exercises/phase-2-hooks/04-useReducer/solution";
// import { App } from "../exercises/phase-2-hooks/05-useRef/exercise";
// import { App } from "../exercises/phase-2-hooks/05-useRef/solution";

// --- Phase 3: Hooks Advanced ---
// import { App } from "../exercises/phase-3-hooks-advanced/01-useCallback/exercise";
// import { App } from "../exercises/phase-3-hooks-advanced/01-useCallback/solution";
// import { App } from "../exercises/phase-3-hooks-advanced/02-useMemo/exercise";
// import { App } from "../exercises/phase-3-hooks-advanced/02-useMemo/solution";
// import { App } from "../exercises/phase-3-hooks-advanced/03-custom-hooks/exercise";
// import { App } from "../exercises/phase-3-hooks-advanced/03-custom-hooks/solution";
// import { App } from "../exercises/phase-3-hooks-advanced/04-useLayoutEffect/exercise";
// import { App } from "../exercises/phase-3-hooks-advanced/04-useLayoutEffect/solution";
// import { App } from "../exercises/phase-3-hooks-advanced/05-hook-patterns/exercise";
// import { App } from "../exercises/phase-3-hooks-advanced/05-hook-patterns/solution";

// --- Phase 4: Advanced Patterns ---
// import { App } from "../exercises/phase-4-advanced-patterns/01-controlled-forms/exercise";
// import { App } from "../exercises/phase-4-advanced-patterns/01-controlled-forms/solution";
// import { App } from "../exercises/phase-4-advanced-patterns/02-higher-order-components/exercise";
// import { App } from "../exercises/phase-4-advanced-patterns/02-higher-order-components/solution";
// import { App } from "../exercises/phase-4-advanced-patterns/03-code-splitting-lazy/exercise";
// import { App } from "../exercises/phase-4-advanced-patterns/03-code-splitting-lazy/solution";
// import { App } from "../exercises/phase-4-advanced-patterns/04-error-boundaries/exercise";
// import { App } from "../exercises/phase-4-advanced-patterns/04-error-boundaries/solution";
// import { App } from "../exercises/phase-4-advanced-patterns/05-routing/exercise";
// import { App } from "../exercises/phase-4-advanced-patterns/05-routing/solution";

// --- Phase 5: Redux ---
// import { App } from "../exercises/phase-5-redux/01-store-and-reducers/exercise";
// import { App } from "../exercises/phase-5-redux/01-store-and-reducers/solution";
// import { App } from "../exercises/phase-5-redux/02-actions-and-dispatch/exercise";
// import { App } from "../exercises/phase-5-redux/02-actions-and-dispatch/solution";
// import { App } from "../exercises/phase-5-redux/03-react-redux-connect/exercise";
// import { App } from "../exercises/phase-5-redux/03-react-redux-connect/solution";
// import { App } from "../exercises/phase-5-redux/04-redux-toolkit/exercise";
// import { App } from "../exercises/phase-5-redux/04-redux-toolkit/solution";
// import { App } from "../exercises/phase-5-redux/05-async-thunks/exercise";
// import { App } from "../exercises/phase-5-redux/05-async-thunks/solution";

// --- Phase 6: Real World ---
// import { App } from "../exercises/phase-6-real-world/01-api-integration/exercise";
// import { App } from "../exercises/phase-6-real-world/01-api-integration/solution";
// import { App } from "../exercises/phase-6-real-world/02-authentication-flow/exercise";
// import { App } from "../exercises/phase-6-real-world/02-authentication-flow/solution";
// import { App } from "../exercises/phase-6-real-world/03-performance-optimization/exercise";
// import { App } from "../exercises/phase-6-real-world/03-performance-optimization/solution";
// import { App } from "../exercises/phase-6-real-world/04-testing-components/exercise";
// import { App } from "../exercises/phase-6-real-world/04-testing-components/solution";
// import { App } from "../exercises/phase-6-real-world/05-full-mini-app/exercise";
// import { App } from "../exercises/phase-6-real-world/05-full-mini-app/solution";

// --- Phase 7: Advanced ---
// import { App } from "../exercises/phase-7-advanced/01-portals/exercise";
// import { App } from "../exercises/phase-7-advanced/01-portals/solution";
// import { App } from "../exercises/phase-7-advanced/02-compound-components/exercise";
// import { App } from "../exercises/phase-7-advanced/02-compound-components/solution";
// import { App } from "../exercises/phase-7-advanced/03-typescript-advanced/exercise";
// import { App } from "../exercises/phase-7-advanced/03-typescript-advanced/solution";
// import { App } from "../exercises/phase-7-advanced/04-react-18-features/exercise";
// import { App } from "../exercises/phase-7-advanced/04-react-18-features/solution";
// import { App } from "../exercises/phase-7-advanced/05-real-world-patterns/exercise";
// import { App } from "../exercises/phase-7-advanced/05-real-world-patterns/solution";

// --- Phase 8: Extra Practice (Build Confidence) ---
// import { App } from "../exercises/phase-8-extra-practice/01-todo-app/exercise";
// import { App } from "../exercises/phase-8-extra-practice/01-todo-app/solution";
// import { App } from "../exercises/phase-8-extra-practice/02-data-fetching/exercise";
// import { App } from "../exercises/phase-8-extra-practice/02-data-fetching/solution";
// import { App } from "../exercises/phase-8-extra-practice/03-search-and-filter/exercise";
// import { App } from "../exercises/phase-8-extra-practice/03-search-and-filter/solution";
// import { App } from "../exercises/phase-8-extra-practice/04-stopwatch/exercise";
// import { App } from "../exercises/phase-8-extra-practice/04-stopwatch/solution";
// import { App } from "../exercises/phase-8-extra-practice/05-theme-context/exercise";
// import { App } from "../exercises/phase-8-extra-practice/05-theme-context/solution";
// import { App } from "../exercises/phase-8-extra-practice/06-cart-reducer/exercise";
// import { App } from "../exercises/phase-8-extra-practice/06-cart-reducer/solution";
// import { App } from "../exercises/phase-8-extra-practice/07-custom-hooks/exercise";
// import { App } from "../exercises/phase-8-extra-practice/07-custom-hooks/solution";
// import { App } from "../exercises/phase-8-extra-practice/08-multi-step-form/exercise";
// import { App } from "../exercises/phase-8-extra-practice/08-multi-step-form/solution";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
