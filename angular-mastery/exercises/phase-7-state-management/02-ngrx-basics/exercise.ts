import { Component } from '@angular/core';

// ============================================================
// Exercise 7.2 — NgRx Basics
// ============================================================
// Topics:
//   • createAction / props
//   • createReducer / on()
//   • createSelector / createFeatureSelector
//   • Store — dispatch / select
//   • provideStore (configured in main.ts)
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: Counter Actions
// ---------------------------------------------------------------------------
// Create counter actions using createAction:
//   - increment (no props)
//   - decrement (no props)
//   - reset (no props)
//   - incrementBy — with props: { amount: number }
//
// import { createAction, props } from '@ngrx/store';
// export const increment    = createAction('[Counter] Increment');
// export const decrement    = createAction('[Counter] Decrement');
// export const reset        = createAction('[Counter] Reset');
// export const incrementBy  = createAction('[Counter] Increment By', props<{ amount: number }>());

// ---------------------------------------------------------------------------
// TODO 2: Counter Reducer
// ---------------------------------------------------------------------------
// Create a counterReducer using createReducer:
//   State: { count: number }
//   Handle: increment (+1), decrement (-1), reset (0), incrementBy (+amount)
//
// export interface CounterState { count: number; }
// const initialState: CounterState = { count: 0 };
// export const counterReducer = createReducer(initialState, on(...), on(...), ...);

// ---------------------------------------------------------------------------
// TODO 3: Counter Selectors
// ---------------------------------------------------------------------------
// Create selectors using createFeatureSelector and createSelector:
//   - selectCounterState — feature selector for 'counter'
//   - selectCount — selects state.count
//   - selectDoubled — computed: count * 2
//   - selectIsPositive — computed: count > 0
//
// export const selectCounterState = createFeatureSelector<CounterState>('counter');
// export const selectCount = createSelector(selectCounterState, state => state.count);
// ...

// ---------------------------------------------------------------------------
// TODO 4: CounterComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-ngrx-counter'.
// Inject Store using inject(Store).
// Use store.select(selectCount) and selectDoubled with toSignal().
// Dispatch: increment, decrement, reset, incrementBy({ amount: 5 }).
// Display: count, doubled.
//
// @Component({ selector: 'app-ngrx-counter', standalone: true, ... })
// export class CounterComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: Wire up provideStore
// ---------------------------------------------------------------------------
// In main.ts (already configured), add the counter reducer:
//   provideStore({ counter: counterReducer })
// Show how the store config looks as a code comment here.

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add CounterComponent
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 7.2 — NgRx Basics</h1>
      <!-- TODO: render CounterComponent -->
    </div>
  `,
})
export class AppComponent {}
