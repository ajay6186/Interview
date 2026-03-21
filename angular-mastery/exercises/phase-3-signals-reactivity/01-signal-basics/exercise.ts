import { Component } from '@angular/core';

// ============================================================
// Exercise 3.1 — Signal Basics
// ============================================================
// Topics:
//   • signal(initialValue)  — writable signal
//   • signal.set(v) / signal.update(fn) / signal.mutate (deprecated)
//   • Reading a signal: signal()  (call syntax in template)
//   • computed(() => ...) — derived read-only signal
//   • effect(() => ...) — side-effect on signal change
//   • Reading signals in templates — NO async pipe needed
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: CounterSignalComponent
// ---------------------------------------------------------------------------
// selector='app-counter-signal'
// count = signal(0)
// doubled = computed(() => count() * 2)
// Template: display count and doubled, increment/decrement/reset buttons.
// Use signal.update() for increment/decrement.

// ---------------------------------------------------------------------------
// TODO 2: FormSignalComponent
// ---------------------------------------------------------------------------
// selector='app-form-signal'
// firstName = signal(''), lastName = signal('')
// fullName  = computed(() => `${firstName()} ${lastName()}`.trim())
// charCount = computed(() => fullName().length)
// Template: two inputs that call signal.set() on (input),
//   live preview of fullName and charCount.

// ---------------------------------------------------------------------------
// TODO 3: EffectDemoComponent
// ---------------------------------------------------------------------------
// selector='app-effect-demo'
// theme = signal<'light' | 'dark'>('light')
// log   = signal<string[]>([])
// Use effect(() => { ... }) in constructor (inject DestroyRef for cleanup)
//   to push "Theme changed to X" into log whenever theme changes.
// Template: toggle button and the log list.
// Note: effect() must be called in an injection context (constructor / field initializer).

// ---------------------------------------------------------------------------
// TODO 4: ShoppingCartComponent
// ---------------------------------------------------------------------------
// selector='app-shopping-cart'
// items = signal<{ name: string; qty: number; price: number }[]>([])
// total = computed(() => items().reduce((s, i) => s + i.qty * i.price, 0))
// count = computed(() => items().reduce((s, i) => s + i.qty, 0))
// Methods: addItem(name, price), incrementQty(name), removeItem(name)
// Template: an "Add" button for 3 preset products, a cart table, total display.

// ---------------------------------------------------------------------------
// TODO 5: SignalInputComponent
// ---------------------------------------------------------------------------
// Angular 17.1 introduced input() / output() signal-based API.
// selector='app-signal-input'
// Use: import { input, output } from '@angular/core'
// label  = input.required<string>()
// value  = input(0)
// changed = output<number>()
// Template: display label + value; two buttons to call changed.emit(value() ± 1)
// Demonstrate in root: [label]="'Score'" [value]="score" (changed)="score = $event"

// ---------------------------------------------------------------------------
// ROOT COMPONENT
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 3.1 — Signal Basics</h1>
      <!-- TODO 6: add all components to imports[] and render them -->
    </div>
  `,
})
export class AppComponent {}
