// Phase 5 - Exercise 01: NgRx Store Basics
// Topics: createAction, createReducer, on(), createSelector, Store, dispatch, select
//
// Setup: npm install @ngrx/store
// main.ts: bootstrapApplication(AppComponent, { providers: [provideStore({ counter: counterReducer })] })
// Docs: https://ngrx.io/guide/store

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: Define counter actions
//
// Import createAction, props from '@ngrx/store'
//
// Create the following actions:
// - increment        (no payload)
// - decrement        (no payload)
// - reset            (no payload)
// - incrementBy      (payload: { amount: number })
//
// Convention: action type = '[Source] Event Description'
// e.g. '[Counter] Increment'
// ─────────────────────────────────────────────

// TODO 1: Counter actions
// export const increment   = createAction('[Counter] Increment');
// export const decrement   = createAction('[Counter] Decrement');
// export const reset       = createAction('[Counter] Reset');
// export const incrementBy = createAction('[Counter] Increment By', props<{ amount: number }>());

// ─────────────────────────────────────────────
// TODO 2: Define counter reducer
//
// - Define interface CounterState { count: number }
// - const initialState: CounterState = { count: 0 }
// - Use createReducer(initialState, on(action, (state) => newState), ...)
// - Handle all 4 actions
// - For incrementBy: spread state and add amount: { ...state, count: state.count + action.amount }
// - Export as: export const counterReducer = createReducer(...)
// ─────────────────────────────────────────────

// TODO 2: CounterState + counterReducer
// export interface CounterState { count: number; }
// const initialState: CounterState = { count: 0 };
// export const counterReducer = createReducer(initialState, ...);

// ─────────────────────────────────────────────
// TODO 3: Define selectors
//
// Import createFeatureSelector, createSelector from '@ngrx/store'
//
// - selectCounterState: createFeatureSelector<CounterState>('counter')
// - selectCount:       createSelector(selectCounterState, s => s.count)
// - selectDoubled:     createSelector(selectCount, count => count * 2)
// - selectIsNegative:  createSelector(selectCount, count => count < 0)
// ─────────────────────────────────────────────

// TODO 3: Selectors
// export const selectCounterState = createFeatureSelector<CounterState>('counter');
// export const selectCount      = createSelector(selectCounterState, s => s.count);
// export const selectDoubled    = createSelector(selectCount, count => count * 2);
// export const selectIsNegative = createSelector(selectCount, count => count < 0);

// ─────────────────────────────────────────────
// TODO 4: CounterComponent
//
// - Inject Store with inject(Store)
// - Select state as observables using store.select(selectCount) etc.
//   OR use the modern toSignal(store.select(selectCount))
// - Display: count, doubled, isNegative
// - Buttons: Increment, Decrement, Reset, +5 (incrementBy({ amount: 5 }))
// - Dispatch actions with store.dispatch(actionCreator())
// ─────────────────────────────────────────────

// TODO 4: CounterComponent
// @Component({ ... })
// export class CounterComponent { }

// ─────────────────────────────────────────────
// TODO 5: CounterHistoryComponent
//
// - Inject Store, select count$ = store.select(selectCount)
// - Use scan() from RxJS to build a running history array:
//   history$ = count$.pipe(scan((acc, val) => [...acc, val], [] as number[]))
// - Display the history as a horizontal bar chart or numbered list
// - Use AsyncPipe in template (| async) or toSignal()
// ─────────────────────────────────────────────

// TODO 5: CounterHistoryComponent
// @Component({ ... })
// export class CounterHistoryComponent { }

// ─────────────────────────────────────────────
// TODO 6: Add all components to imports[] and render them in AppComponent
// ─────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: import components here
  ],
  template: `
    <h1>NgRx Store Basics Exercise</h1>
    <!-- TODO 6: render CounterComponent and CounterHistoryComponent -->
  `,
})
export class AppComponent {}
