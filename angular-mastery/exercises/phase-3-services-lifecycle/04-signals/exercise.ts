import { Component } from '@angular/core';

// ============================================================
// Exercise 3.4 — Signals
// ============================================================
// Topics:
//   • signal() — writable reactive state
//   • computed() — derived state
//   • effect() — reactive side effects
//   • input() — signal-based component inputs
//   • linkedSignal() — linked/derived writable signal
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: SignalBasicsComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-signal-basics'.
// Use signal(0) for a counter.
// Use computed() for doubled and isEven.
// Add increment and decrement buttons.
// Display count, doubled, and isEven.
//
// @Component({ selector: 'app-signal-basics', standalone: true, ... })
// export class SignalBasicsComponent { ... }

// ---------------------------------------------------------------------------
// TODO 2: ComputedComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-computed'.
// Simulate a shopping cart:
//   - items = signal([{ name: 'Apple', price: 1.5, qty: 2 }, ...])
//   - total = computed(() => sum of price * qty)
//   - itemCount = computed(() => sum of quantities)
//   - discount = computed(() => total > 10 ? total * 0.1 : 0)
// Display total, itemCount, and discount.
// Add a button to add a new item.
//
// @Component({ selector: 'app-computed', standalone: true, ... })
// export class ComputedComponent { ... }

// ---------------------------------------------------------------------------
// TODO 3: EffectComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-effect'.
// Use signal() for a value.
// Use effect() to:
//   - log every change to the console
//   - save the value to localStorage under key 'effect-demo'
// Add an input and a button to update the signal.
//
// @Component({ selector: 'app-effect', standalone: true, ... })
// export class EffectComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: SignalInputComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-signal-input'.
// Use the NEW signal input API: name = input<string>('World')
// Use computed() to derive a greeting: `Hello, ${name()}!`
// Display the computed greeting.
// Create a host wrapper that passes different names.
//
// @Component({ selector: 'app-signal-input', standalone: true, ... })
// export class SignalInputComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: LinkedSignalComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-linked-signal'.
// items = signal(['Apple', 'Banana', 'Cherry'])
// selected = linkedSignal(() => items()[0])  // resets to first when items changes
// Add buttons to change the selected item and to swap the items array.
// Show how selected resets when items changes.
//
// @Component({ selector: 'app-linked-signal', standalone: true, ... })
// export class LinkedSignalComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add all exercise components
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 3.4 — Signals</h1>
      <!-- TODO: render all components -->
    </div>
  `,
})
export class AppComponent {}
