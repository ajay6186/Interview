# Redux & State Management

### Q1: What is Redux?
**A:** Redux is a predictable state management library for JavaScript apps. It maintains the entire application state in a single immutable store, with state changes made exclusively through dispatching actions that are processed by pure reducer functions. Originally created by Dan Abramov and Andrew Clark, it's heavily inspired by Flux architecture and the Elm language.

### Q2: What are the three core principles of Redux?
**A:** (1) **Single source of truth** -- the entire app state lives in one store object. (2) **State is read-only** -- the only way to change state is to dispatch an action describing what happened. (3) **Changes are made with pure functions** -- reducers are pure functions that take the previous state and an action, returning a new state without mutating the original.

### Q3: What is a Redux store?
**A:** The store is the object that holds the application state tree. It provides `getState()` to read the current state, `dispatch(action)` to trigger state changes, and `subscribe(listener)` to register callbacks for state changes. There is only one store per Redux application. In modern Redux Toolkit, you create it with `configureStore()`.

### Q4: What is an action in Redux?
**A:** An action is a plain JavaScript object with a `type` property describing what happened, and optionally a `payload` with associated data. Actions are the only information source for the store:
```js
{ type: 'todos/add', payload: { id: 1, text: 'Learn Redux' } }
```
Action creators are functions that return action objects.

### Q5: What is a reducer in Redux?
**A:** A reducer is a pure function that takes the current state and an action, and returns a new state: `(state, action) => newState`. Reducers must not mutate the input state, perform side effects, or call impure functions. They specify how the application state changes in response to actions:
```js
function todosReducer(state = [], action) {
  switch (action.type) {
    case 'todos/add':
      return [...state, action.payload];
    default:
      return state;
  }
}
```

### Q6: Explain the Redux data flow.
**A:** The data flow is unidirectional: (1) A user interaction triggers an action dispatch via `dispatch(action)`. (2) The store calls the root reducer with the current state and action. (3) The root reducer may combine output of multiple sub-reducers into a single state tree. (4) The store saves the new state and notifies all subscribers. (5) Connected UI components re-render with the new state.

### Q7: What is the difference between `connect()` and Redux hooks?
**A:** `connect()` is the older HOC pattern using `mapStateToProps` and `mapDispatchToProps` to inject Redux state/dispatch as props. Redux hooks (`useSelector`, `useDispatch`) are the modern approach that's more concise and doesn't add wrapper components:
```jsx
// Hooks approach (preferred)
function TodoList() {
  const todos = useSelector(state => state.todos);
  const dispatch = useDispatch();
  return todos.map(t => <li key={t.id} onClick={() => dispatch(remove(t.id))}>{t.text}</li>);
}
```
Hooks are recommended for new code; `connect()` is still supported.

### Q8: How does `useSelector` work?
**A:** `useSelector` takes a selector function that receives the entire Redux state and returns the part you need. It subscribes to the store and re-renders the component when the selected value changes (using strict `===` equality by default). To customize the comparison, pass a second argument:
```jsx
const user = useSelector(state => state.auth.user);
const todos = useSelector(state => state.todos, shallowEqual);
```

### Q9: What is Redux middleware?
**A:** Middleware sits between dispatching an action and the reducer receiving it. It can intercept actions, perform side effects (API calls, logging), transform actions, or dispatch additional actions. Middleware is composed in a chain, with each middleware calling `next(action)` to pass to the next one. Common examples are redux-thunk (async logic) and redux-logger.

### Q10: What is Redux Thunk and how does it work?
**A:** Redux Thunk middleware allows you to dispatch functions (thunks) instead of plain action objects. The function receives `dispatch` and `getState`, enabling async logic:
```js
function fetchUser(userId) {
  return async (dispatch, getState) => {
    dispatch({ type: 'user/loading' });
    try {
      const user = await api.fetchUser(userId);
      dispatch({ type: 'user/loaded', payload: user });
    } catch (err) {
      dispatch({ type: 'user/error', payload: err.message });
    }
  };
}
// dispatch(fetchUser(123));
```
Redux Toolkit includes thunk middleware by default.

### Q11: What is Redux Saga and how does it differ from Thunk?
**A:** Redux Saga uses generator functions to handle side effects, offering more powerful control flow than thunks: cancellation, debouncing, racing, parallel execution, and retry logic. Sagas listen for dispatched actions using `take`/`takeEvery`/`takeLatest` effects:
```js
function* fetchUserSaga(action) {
  try {
    const user = yield call(api.fetchUser, action.payload);
    yield put({ type: 'user/loaded', payload: user });
  } catch (e) {
    yield put({ type: 'user/error', payload: e.message });
  }
}
function* watchFetchUser() {
  yield takeLatest('user/fetch', fetchUserSaga);
}
```
Sagas are more testable but have a steeper learning curve than thunks.

### Q12: What is Redux Toolkit (RTK)?
**A:** Redux Toolkit is the official, opinionated toolset for efficient Redux development. It simplifies store setup, reduces boilerplate, includes Immer for immutable updates, and bundles commonly needed middleware. It's the recommended way to write Redux logic and addresses most criticisms about Redux complexity.

### Q13: How does `createSlice` work?
**A:** `createSlice` generates action creators and action types automatically from a reducer definition. It uses Immer internally, so you can write "mutating" logic in reducers:
```js
const todosSlice = createSlice({
  name: 'todos',
  initialState: [],
  reducers: {
    add(state, action) {
      state.push(action.payload); // Immer makes this safe
    },
    remove(state, action) {
      return state.filter(t => t.id !== action.payload);
    },
    toggle(state, action) {
      const todo = state.find(t => t.id === action.payload);
      if (todo) todo.completed = !todo.completed;
    },
  },
});

export const { add, remove, toggle } = todosSlice.actions;
export default todosSlice.reducer;
```

### Q14: How does `configureStore` differ from `createStore`?
**A:** `configureStore` (RTK) wraps `createStore` with sensible defaults: it automatically adds thunk middleware, enables Redux DevTools, includes a serializable check middleware in development, and accepts a `reducer` object that it combines automatically:
```js
const store = configureStore({
  reducer: {
    todos: todosReducer,
    auth: authReducer,
  },
});
```
`createStore` is now deprecated in favor of `configureStore`.

### Q15: What is `createAsyncThunk`?
**A:** `createAsyncThunk` generates a thunk that dispatches lifecycle actions (`pending`, `fulfilled`, `rejected`) automatically:
```js
const fetchUsers = createAsyncThunk('users/fetch', async (_, { rejectWithValue }) => {
  try {
    const response = await api.getUsers();
    return response.data;
  } catch (err) {
    return rejectWithValue(err.message);
  }
});

// In slice
extraReducers: (builder) => {
  builder
    .addCase(fetchUsers.pending, (state) => { state.loading = true; })
    .addCase(fetchUsers.fulfilled, (state, action) => {
      state.loading = false;
      state.users = action.payload;
    })
    .addCase(fetchUsers.rejected, (state, action) => {
      state.loading = false;
      state.error = action.payload;
    });
},
```

### Q16: What are selectors and why are they useful?
**A:** Selectors are functions that extract specific pieces from the Redux state. They encapsulate the state shape, making components independent of store structure. If the state structure changes, you update selectors in one place:
```js
// Selectors
const selectTodos = (state) => state.todos;
const selectCompletedTodos = (state) => state.todos.filter(t => t.completed);

// Component
const completed = useSelector(selectCompletedTodos);
```

### Q17: What is `createSelector` from Reselect?
**A:** `createSelector` creates memoized selectors that only recompute when their inputs change. This avoids expensive recalculations on every render. It's included in Redux Toolkit:
```js
import { createSelector } from '@reduxjs/toolkit';

const selectTodos = (state) => state.todos;
const selectFilter = (state) => state.filter;

const selectFilteredTodos = createSelector(
  [selectTodos, selectFilter],
  (todos, filter) => {
    // Only runs when todos or filter change
    return todos.filter(t => t.status === filter);
  }
);
```

### Q18: How does Immer work in Redux Toolkit?
**A:** Immer uses JavaScript Proxies to let you write code that appears to mutate state, while actually producing a new immutable state behind the scenes. In RTK's `createSlice`, every reducer runs through Immer, so `state.push(item)` doesn't actually mutate -- Immer creates a structural copy. You can also return a new value directly to replace the entire state.

### Q19: What is the difference between Redux and the Context API?
**A:** Context API is built into React and suitable for low-frequency updates (themes, locale, auth). Redux is an external library optimized for frequent state updates with middleware, DevTools, and fine-grained subscriptions. Context re-renders all consumers when the value changes; Redux's `useSelector` only re-renders when the selected slice changes. Use Context for simple, infrequently-changing global state; use Redux for complex, frequently-updated state.

### Q20: What are Redux DevTools?
**A:** Redux DevTools is a browser extension that provides time-travel debugging, action logging, state inspection, and the ability to replay actions. It shows the action history, state diffs, and lets you jump to any previous state. It's enabled automatically with `configureStore` in development mode.

### Q21: When should you use Redux vs simpler alternatives?
**A:** Use Redux when you have: complex state logic shared across many components, frequent state updates, need for middleware (logging, analytics, async coordination), need for time-travel debugging, or a large team benefiting from strict patterns. For simpler apps, `useState`/`useReducer` + Context, or lighter libraries like Zustand or Jotai, may be more appropriate. Redux Toolkit has reduced the boilerplate argument significantly.

### Q22: What is the purpose of `combineReducers`?
**A:** `combineReducers` merges multiple reducer functions into a single root reducer. Each sub-reducer manages its own slice of the state tree. The keys you pass to `combineReducers` become the keys in the state object:
```js
const rootReducer = combineReducers({
  users: usersReducer,   // state.users
  posts: postsReducer,   // state.posts
});
```
With RTK's `configureStore`, passing an object to `reducer` does this automatically.

### Q23: How do you handle side effects that aren't API calls (e.g., localStorage)?
**A:** Use middleware or listener middleware. RTK provides `createListenerMiddleware` for reactive side-effect logic:
```js
const listenerMiddleware = createListenerMiddleware();
listenerMiddleware.startListening({
  actionCreator: setTheme,
  effect: async (action) => {
    localStorage.setItem('theme', action.payload);
  },
});
```
This is cleaner than putting side effects in components and more lightweight than Redux Saga.

### Q24: What is the Redux store enhancer pattern?
**A:** Store enhancers are higher-order functions that wrap `createStore` to add functionality. They're more powerful than middleware because they can override any store method. The Redux DevTools extension is a store enhancer. `applyMiddleware` itself is an enhancer. Enhancers compose like middleware but operate at the store level rather than the dispatch level.

### Q25: How do you normalize state in Redux?
**A:** Normalization stores data in a flat structure using lookup tables (by ID) instead of nested arrays. This prevents data duplication and simplifies updates:
```js
// Normalized state
{
  entities: { 1: { id: 1, name: 'Alice' }, 2: { id: 2, name: 'Bob' } },
  ids: [1, 2]
}
```
RTK provides `createEntityAdapter` which generates reducers and selectors for normalized data automatically.

### Q26: What is `createEntityAdapter` in RTK?
**A:** `createEntityAdapter` provides prebuilt reducers and selectors for managing normalized collections of entities. It handles common operations like add, update, upsert, and remove:
```js
const usersAdapter = createEntityAdapter();
const usersSlice = createSlice({
  name: 'users',
  initialState: usersAdapter.getInitialState(),
  reducers: {
    addUser: usersAdapter.addOne,
    updateUser: usersAdapter.updateOne,
    removeUser: usersAdapter.removeOne,
  },
});
const { selectAll, selectById } = usersAdapter.getSelectors(state => state.users);
```

### Q27: Can you dispatch multiple actions synchronously?
**A:** Yes, each dispatch is synchronous by default and triggers subscribers after the reducer runs. If you dispatch multiple actions in sequence, React 18's automatic batching ensures only one re-render occurs. Before React 18, you could use `batch()` from react-redux or dispatch a single action containing the combined update.

### Q28: [BONUS] How does Zustand compare to Redux?
**A:** Zustand is a lightweight state management library (~1KB) with a hook-based API. It doesn't require providers, reducers, or actions -- just define a store with `create()`. It supports middleware, devtools, and persistence. It's simpler than Redux for small-to-medium apps but lacks Redux's strict patterns and ecosystem:
```js
const useStore = create((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
}));
// Usage: const count = useStore((state) => state.count);
```

### Q29: [BONUS] How do Jotai and Recoil differ from Redux?
**A:** Jotai and Recoil use an atomic state model instead of a single store. State is defined as independent atoms that components subscribe to individually. This provides fine-grained reactivity without selectors. Recoil (by Meta) supports derived state via selectors and async queries. Jotai (by Pmndrs) is smaller and simpler, inspired by Recoil but with a more minimal API. Both eliminate the boilerplate of Redux and are ideal for apps with many independent state pieces.

### Q30: [BONUS] What is RTK Query?
**A:** RTK Query is a data fetching and caching solution built into Redux Toolkit. It auto-generates hooks for API endpoints, handles caching, invalidation, polling, and optimistic updates. It eliminates the need to write thunks, reducers, and loading state for API calls:
```js
const api = createApi({
  baseQuery: fetchBaseQuery({ baseUrl: '/api' }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query({ query: () => '/users', providesTags: ['User'] }),
    addUser: builder.mutation({
      query: (body) => ({ url: '/users', method: 'POST', body }),
      invalidatesTags: ['User'],
    }),
  }),
});
export const { useGetUsersQuery, useAddUserMutation } = api;
```
It's similar to TanStack Query but integrated directly with the Redux store.
