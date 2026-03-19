  ---
  The Full Mental Map

  ┌─────────────────────────────────────────────────────┐
  │                      STORE                          │
  │  { counter: { value: 5, lastAction: "increment" } } │
  └───────────────┬─────────────────┬───────────────────┘
                  │                 │
            getState()          dispatch(action)
                  │                 │
      ┌───────────▼───┐    ┌────────▼──────────┐
      │  useSelector  │    │    Middleware      │
      │  (reads state)│    │  (thunks, logger)  │
      └───────┬───────┘    └────────┬──────────┘
              │                    │
      Component re-renders     Reducer(state, action)
                                   │
                              New State → back to Store

  ---