// Phase 5 - Solution 01: NgRx Store Basics
// Topics: createAction, createReducer, on(), createSelector, Store, dispatch, select
//
// Setup in main.ts:
//   import { provideStore } from '@ngrx/store';
//   bootstrapApplication(AppComponent, {
//     providers: [ provideStore({ counter: counterReducer }) ]
//   });

import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

// ─── NgRx imports (would be real in a project with @ngrx/store installed) ───
// import { createAction, createReducer, createSelector,
//          createFeatureSelector, on, props, Store } from '@ngrx/store';

// ─────────────────────────────────────────────────────────────────────────────
// Since we can't import @ngrx/store here without the package installed,
// we provide a mini-shim to make the patterns visible + the file compilable.
// In a real project, DELETE the shim and use the real NgRx imports above.
// ─────────────────────────────────────────────────────────────────────────────

// ── Mini NgRx shim ──────────────────────────────────────────────────────────
type ActionCreator<T = void> = T extends void
  ? (() => { type: string }) & { type: string }
  : ((props: T) => { type: string } & T) & { type: string };

function createAction<T = void>(type: string): ActionCreator<T> {
  const creator = (props?: T) => ({ type, ...(props ?? {}) });
  creator.type = type;
  return creator as ActionCreator<T>;
}

function props<T>() { return {} as T; }

function on<S>(action: { type: string }, reducer: (s: S, a: unknown) => S) {
  return { action, reducer };
}

function createReducer<S>(initial: S, ...handlers: { action: { type: string }; reducer: (s: S, a: unknown) => S }[]) {
  return (state: S = initial, action: { type: string }) => {
    const handler = handlers.find(h => h.action.type === action.type);
    return handler ? handler.reducer(state, action) : state;
  };
}

function createFeatureSelector<S>(_key: string) {
  return (state: Record<string, unknown>) => state as unknown as S;
}

function createSelector<S, R>(sel: (s: unknown) => S, projector: (s: S) => R) {
  return (state: unknown) => projector(sel(state));
}
// ── End shim ─────────────────────────────────────────────────────────────────

// ─────────────────────────────────────────────────────────────────────────────
// 1. Counter Actions
// ─────────────────────────────────────────────────────────────────────────────

export const increment   = createAction('[Counter] Increment');
export const decrement   = createAction('[Counter] Decrement');
export const reset       = createAction('[Counter] Reset');
export const incrementBy = createAction<{ amount: number }>('[Counter] Increment By');

// ─────────────────────────────────────────────────────────────────────────────
// 2. Counter Reducer
// ─────────────────────────────────────────────────────────────────────────────

export interface CounterState { count: number; }

const initialState: CounterState = { count: 0 };

export const counterReducer = createReducer<CounterState>(
  initialState,
  on(increment,   state          => ({ ...state, count: state.count + 1 })),
  on(decrement,   state          => ({ ...state, count: state.count - 1 })),
  on(reset,       _state         => ({ ...initialState })),
  on(incrementBy, (state, action) => {
    const a = action as unknown as { amount: number };
    return { ...state, count: state.count + a.amount };
  }),
);

/*
// REAL NgRx createReducer:
export const counterReducer = createReducer(
  initialState,
  on(increment,   state          => ({ ...state, count: state.count + 1 })),
  on(decrement,   state          => ({ ...state, count: state.count - 1 })),
  on(reset,       _              => ({ ...initialState })),
  on(incrementBy, (state, { amount }) => ({ ...state, count: state.count + amount })),
);
*/

// ─────────────────────────────────────────────────────────────────────────────
// 3. Selectors
// ─────────────────────────────────────────────────────────────────────────────

export const selectCounterState = createFeatureSelector<CounterState>('counter');
export const selectCount        = createSelector(selectCounterState, s => s.count);
export const selectDoubled      = createSelector(selectCount, count => count * 2);
export const selectIsNegative   = createSelector(selectCount, count => count < 0);

/*
// How selectors compose (memoized — only recompute when inputs change):
// selectDoubled depends on selectCount which depends on selectCounterState.
// If selectCount returns the same value, selectDoubled won't recompute.

// Usage in component:
//   count$    = this.store.select(selectCount);
//   doubled$  = this.store.select(selectDoubled);
//   isNeg$    = this.store.select(selectIsNegative);
//
// Or with toSignal (Angular 16+):
//   count    = toSignal(this.store.select(selectCount), { initialValue: 0 });
*/

// ─────────────────────────────────────────────────────────────────────────────
// Simulated Store (replaces @ngrx/store Store service in demo)
// ─────────────────────────────────────────────────────────────────────────────

class SimulatedStore {
  private state = signal<CounterState>(initialState);
  private history = signal<number[]>([0]);

  dispatch(action: { type: string }) {
    const next = counterReducer(this.state(), action);
    this.state.set(next);
    this.history.set([...this.history(), next.count]);
  }

  select<T>(selector: (s: unknown) => T): () => T {
    return computed(() => selector(this.state() as unknown));
  }

  getHistory() { return this.history; }
}

const store = new SimulatedStore();

// ─────────────────────────────────────────────────────────────────────────────
// 4. CounterComponent
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#e8f5e9; border-radius:8px; margin-bottom:1rem">
      <h2>Counter</h2>

      <div style="font-size:3rem; font-weight:bold; text-align:center; margin:1rem 0;
                  color:{{ isNegative() ? '#c62828' : '#1b5e20' }}">
        {{ count() }}
      </div>

      <div style="display:flex; gap:0.5rem; justify-content:center; flex-wrap:wrap; margin-bottom:1rem">
        <button (click)="dispatch('increment')"
                style="padding:0.5rem 1.25rem; font-size:1.25rem; background:#2e7d32; color:white; border:none; border-radius:4px; cursor:pointer">
          +1
        </button>
        <button (click)="dispatch('decrement')"
                style="padding:0.5rem 1.25rem; font-size:1.25rem; background:#c62828; color:white; border:none; border-radius:4px; cursor:pointer">
          −1
        </button>
        <button (click)="dispatch('incrementBy5')"
                style="padding:0.5rem 1.25rem; background:#1565c0; color:white; border:none; border-radius:4px; cursor:pointer">
          +5
        </button>
        <button (click)="dispatch('reset')"
                style="padding:0.5rem 1.25rem; background:#555; color:white; border:none; border-radius:4px; cursor:pointer">
          Reset
        </button>
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem; font-size:0.9rem">
        <div style="background:white; padding:0.5rem; border-radius:4px">
          Doubled: <strong>{{ doubled() }}</strong>
        </div>
        <div style="background:white; padding:0.5rem; border-radius:4px">
          Is Negative: <strong [style.color]="isNegative() ? 'red' : 'green'">{{ isNegative() }}</strong>
        </div>
      </div>

      <div style="margin-top:1rem; font-size:0.85rem; background:#f1f8e9; padding:0.75rem; border-radius:4px">
        <strong>Real NgRx Component Pattern:</strong>
        <pre style="margin:0.5rem 0 0; font-size:0.8rem">{{ codeSnippet }}</pre>
      </div>
    </div>
  `,
})
export class CounterComponent {
  count      = store.select(selectCount);
  doubled    = store.select(selectDoubled);
  isNegative = store.select(selectIsNegative);

  dispatch(action: string) {
    switch (action) {
      case 'increment':    store.dispatch(increment());            break;
      case 'decrement':    store.dispatch(decrement());            break;
      case 'reset':        store.dispatch(reset());                break;
      case 'incrementBy5': store.dispatch(incrementBy({ amount: 5 })); break;
    }
  }

  codeSnippet = `
export class CounterComponent {
  private store = inject(Store);

  count      = toSignal(this.store.select(selectCount),      { initialValue: 0 });
  doubled    = toSignal(this.store.select(selectDoubled),    { initialValue: 0 });
  isNegative = toSignal(this.store.select(selectIsNegative), { initialValue: false });

  increment()   { this.store.dispatch(increment()); }
  decrement()   { this.store.dispatch(decrement()); }
  reset()       { this.store.dispatch(reset()); }
  incrementBy5(){ this.store.dispatch(incrementBy({ amount: 5 })); }
}`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. CounterHistoryComponent — accumulate history with scan()
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-counter-history',
  standalone: true,
  template: `
    <div style="padding:1.5rem; background:#e3f2fd; border-radius:8px; margin-bottom:1rem">
      <h2>Counter History</h2>
      <p style="font-size:0.9rem; color:#555">
        Uses <code>scan()</code> to accumulate a running array of state snapshots.
      </p>

      <div style="display:flex; align-items:flex-end; gap:3px; height:60px; background:white;
                  padding:4px; border-radius:4px; margin-bottom:0.5rem; overflow-x:auto">
        @for (val of history(); track $index) {
          <div
            [style.height]="barHeight(val) + 'px'"
            [style.background]="val < 0 ? '#c62828' : '#2e7d32'"
            [style.min-width]="'8px'"
            [style.flex]="'0 0 8px'"
            [title]="val"
          ></div>
        }
      </div>

      <div style="display:flex; flex-wrap:wrap; gap:4px; font-size:0.8rem">
        @for (val of history(); track $index) {
          <span style="background:#e0e0e0; padding:2px 6px; border-radius:3px">{{ val }}</span>
        }
      </div>

      <pre style="margin-top:1rem; background:#f5f5f5; padding:0.75rem; border-radius:4px; font-size:0.8rem">{{ scanPattern }}</pre>
    </div>
  `,
})
export class CounterHistoryComponent {
  history = store.getHistory();

  barHeight(val: number): number {
    return Math.min(Math.abs(val) * 4 + 4, 55);
  }

  scanPattern = `
// Real NgRx pattern using scan():
const count$ = this.store.select(selectCount);

history$ = count$.pipe(
  scan((acc, val) => [...acc, val], [] as number[])
);

// Template:
// @for (val of history$ | async; track $index) { ... }
// Or: history = toSignal(history$, { initialValue: [] });`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CounterComponent, CounterHistoryComponent],
  template: `
    <div style="font-family:sans-serif; max-width:800px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 5 – NgRx Store Basics</h1>

      <app-counter />
      <app-counter-history />

      <div style="padding:1rem; background:#f5f5f5; border-radius:8px; font-size:0.85rem">
        <strong>NgRx Store Cheat Sheet:</strong>
        <ul>
          <li><code>createAction('[Source] Event')</code> — define an action with no payload</li>
          <li><code>createAction('[Source] Event', props&lt;&#123;id:number&#125;&gt;())</code> — with payload</li>
          <li><code>createReducer(initialState, on(action, (state, {payload}) => newState))</code></li>
          <li><code>createFeatureSelector&lt;T&gt;('featureKey')</code> — root slice selector</li>
          <li><code>createSelector(sel, projector)</code> — memoized derived selector</li>
          <li><code>store.dispatch(actionCreator(payload))</code> — trigger state change</li>
          <li><code>store.select(selector)</code> — Observable of derived state</li>
          <li><code>toSignal(store.select(sel), &#123; initialValue: ... &#125;)</code> — reactive signal</li>
        </ul>
      </div>
    </div>
  `,
})
export class AppComponent {}
