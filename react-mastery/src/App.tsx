import React from "react";
import { Provider } from "react-redux";
import { store } from "./app/store";
import { useAppSelector } from "./app/hooks";
import { selectIsLoggedIn } from "./features/auth/authSelectors";
import { Login } from "./features/auth/Login";
import { Counter } from "./features/counter/Counter";

// Root reads auth state and decides which page to show.
// No React Router needed — auth state IS the routing logic here.
function Root() {
  const isLoggedIn = useAppSelector(selectIsLoggedIn);
  return isLoggedIn ? <Counter /> : <Login />;
}

// App wraps everything in Provider so all descendants can access the store.
export function App() {
  return (
    <Provider store={store}>
      <Root />
    </Provider>
  );
}
