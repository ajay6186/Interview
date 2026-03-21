import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { createAction, createReducer, createSelector, createFeatureSelector,
         on, props, Store } from '@ngrx/store';
import { toSignal } from '@angular/core/rxjs-interop';

// ============================================================
// Solution 7.2 — NgRx Basics
// ============================================================

// SOLUTION 1: Actions
export const increment   = createAction('[Counter] Increment');
export const decrement   = createAction('[Counter] Decrement');
export const reset       = createAction('[Counter] Reset');
export const incrementBy = createAction('[Counter] Increment By', props<{ amount: number }>());

// SOLUTION 2: Reducer
export interface CounterState { count: number; }
const initialState: CounterState = { count: 0 };

export const counterReducer = createReducer(
  initialState,
  on(increment,   state => ({ ...state, count: state.count + 1 })),
  on(decrement,   state => ({ ...state, count: state.count - 1 })),
  on(reset,       _state => ({ count: 0 })),
  on(incrementBy, (state, { amount }) => ({ ...state, count: state.count + amount })),
);

// SOLUTION 3: Selectors
export const selectCounterState = createFeatureSelector<CounterState>('counter');
export const selectCount        = createSelector(selectCounterState, s => s.count);
export const selectDoubled      = createSelector(selectCount, n => n * 2);
export const selectIsPositive   = createSelector(selectCount, n => n > 0);

// SOLUTION 4: CounterComponent
@Component({
  selector: 'app-ngrx-counter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>NgRx Counter</h3>
      <p>Count: <strong>{{ count() }}</strong> | Doubled: {{ doubled() }} | Positive: {{ isPositive() }}</p>
      <button (click)="store.dispatch(increment())">+</button>
      <button (click)="store.dispatch(decrement())" style="margin-left:8px">−</button>
      <button (click)="store.dispatch(reset())" style="margin-left:8px">Reset</button>
      <button (click)="store.dispatch(incrementBy({ amount: 5 }))" style="margin-left:8px">+5</button>
      <p><em>Store config: provideStore(&#123; counter: counterReducer &#125;) in main.ts</em></p>
    </section>
  `,
})
class CounterComponent {
  store      = inject(Store);
  count      = toSignal(this.store.select(selectCount),      { initialValue: 0 });
  doubled    = toSignal(this.store.select(selectDoubled),    { initialValue: 0 });
  isPositive = toSignal(this.store.select(selectIsPositive), { initialValue: false });

  increment   = increment;
  decrement   = decrement;
  reset       = reset;
  incrementBy = incrementBy;
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CounterComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 7.2 — NgRx Basics</h1>
      <p><em>Requires: provideStore(&#123; counter: counterReducer &#125;) in main.ts</em></p>
      <app-ngrx-counter />
    </div>
  `,
})
export class AppComponent {}
