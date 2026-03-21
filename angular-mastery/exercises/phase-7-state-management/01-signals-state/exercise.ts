import { Component } from '@angular/core';

// ============================================================
// Exercise 7.1 — Signals-Based State
// ============================================================
// Topics:
//   • signal / computed / effect for state management
//   • Class-based stores using signals
//   • toObservable() — bridge signals to RxJS
//   • Reactive form state with signals
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: CounterStore
// ---------------------------------------------------------------------------
// Create a class CounterStore decorated with @Injectable({ providedIn: 'root' }).
// Use signal(0) for `count`.
// computed: doubled, isNegative, history (last 5 values tracked via effect).
// Methods: increment(), decrement(), reset().
//
// @Injectable({ providedIn: 'root' })
// export class CounterStore { ... }

// ---------------------------------------------------------------------------
// TODO 2: CartStore
// ---------------------------------------------------------------------------
// Create a class CartStore decorated with @Injectable({ providedIn: 'root' }).
// interface CartItem { id: number; name: string; price: number; qty: number }
// signal: items: CartItem[].
// computed: total, itemCount, isEmpty.
// Methods: addItem(item), removeItem(id), updateQty(id, qty), clear().
//
// @Injectable({ providedIn: 'root' })
// export class CartStore { ... }

// ---------------------------------------------------------------------------
// TODO 3: UserStore
// ---------------------------------------------------------------------------
// Create a class UserStore decorated with @Injectable({ providedIn: 'root' }).
// interface User { id: number; name: string; email: string }
// signal: currentUser: User | null.
// computed: isLoggedIn, displayName.
// Methods: login(user: User), logout().
// Use effect() to persist currentUser to sessionStorage.
//
// @Injectable({ providedIn: 'root' })
// export class UserStore { ... }

// ---------------------------------------------------------------------------
// TODO 4: ToObservableComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-to-observable'.
// Inject CounterStore.
// Use toObservable(counterStore.count) to convert the signal to an Observable.
// Apply debounceTime(300) and subscribe to log values.
// Display the signal value and a history of debounced values.
//
// @Component({ selector: 'app-to-observable', standalone: true, ... })
// export class ToObservableComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: SignalFormComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-signal-form'.
// Use signal() for form field values (name, email).
// Use computed() for isValid and errorMessages.
// Use effect() to auto-save to localStorage when the form is valid.
// Display form fields and validation state.
//
// @Component({ selector: 'app-signal-form', standalone: true, ... })
// export class SignalFormComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add all exercise components
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 7.1 — Signals-Based State</h1>
      <!-- TODO: render all components -->
    </div>
  `,
})
export class AppComponent {}
