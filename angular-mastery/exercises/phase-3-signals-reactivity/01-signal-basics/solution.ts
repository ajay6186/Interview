import { Component, signal, computed, effect, input, output } from '@angular/core';

// ============================================================
// Solution 3.1 — Signal Basics
// ============================================================

// SOLUTION 1: CounterSignalComponent
@Component({
  selector: 'app-counter-signal',
  standalone: true,
  template: `
    <div style="display: flex; align-items: center; gap: 12px; flex-wrap: wrap;">
      <button (click)="count.update(n => n - 1)"
              style="width: 36px; height: 36px; font-size: 1.2rem; cursor: pointer; border-radius: 6px; border: 1px solid #ccc;">−</button>
      <span style="font-size: 2rem; font-weight: bold; min-width: 40px; text-align: center;">{{ count() }}</span>
      <button (click)="count.update(n => n + 1)"
              style="width: 36px; height: 36px; font-size: 1.2rem; cursor: pointer; border-radius: 6px; border: 1px solid #ccc;">+</button>
      <button (click)="count.set(0)"
              style="padding: 6px 12px; cursor: pointer; border-radius: 4px; border: 1px solid #e74c3c; color: #e74c3c;">
        Reset
      </button>
      <span style="color: #9b59b6;">doubled: <strong>{{ doubled() }}</strong></span>
    </div>
  `,
})
class CounterSignalComponent {
  count   = signal(0);
  doubled = computed(() => this.count() * 2);
}

// SOLUTION 2: FormSignalComponent
@Component({
  selector: 'app-form-signal',
  standalone: true,
  template: `
    <div style="display: flex; flex-direction: column; gap: 8px; max-width: 340px;">
      <input [value]="firstName()" (input)="firstName.set($any($event.target).value)"
             placeholder="First name"
             style="padding: 8px; border-radius: 4px; border: 1px solid #ccc;" />
      <input [value]="lastName()" (input)="lastName.set($any($event.target).value)"
             placeholder="Last name"
             style="padding: 8px; border-radius: 4px; border: 1px solid #ccc;" />
      <div style="background: #f0f4ff; padding: 10px; border-radius: 6px;">
        Full name: <strong>{{ fullName() || '(empty)' }}</strong>
        &nbsp;·&nbsp; {{ charCount() }} chars
      </div>
    </div>
  `,
})
class FormSignalComponent {
  firstName = signal('');
  lastName  = signal('');
  fullName  = computed(() => `${this.firstName()} ${this.lastName()}`.trim());
  charCount = computed(() => this.fullName().length);
}

// SOLUTION 3: EffectDemoComponent
@Component({
  selector: 'app-effect-demo',
  standalone: true,
  template: `
    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
      <strong>Theme:</strong>
      <span [style.background]="theme() === 'dark' ? '#333' : '#eee'"
            [style.color]="theme() === 'dark' ? '#fff' : '#333'"
            style="padding: 4px 12px; border-radius: 12px; font-size: 13px;">
        {{ theme() }}
      </span>
      <button (click)="theme.update(t => t === 'light' ? 'dark' : 'light')"
              style="padding: 6px 14px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">
        Toggle
      </button>
    </div>
    <div style="background: #f8f9fa; border-radius: 6px; padding: 10px; font-size: 13px; font-family: monospace; max-height: 120px; overflow-y: auto;">
      @for (entry of log(); track entry) {
        <div>{{ entry }}</div>
      } @empty {
        <div style="color: gray;">No changes yet.</div>
      }
    </div>
  `,
})
class EffectDemoComponent {
  theme = signal<'light' | 'dark'>('light');
  log   = signal<string[]>([]);

  constructor() {
    effect(() => {
      const t = this.theme();
      this.log.update((l) => [...l, `[${new Date().toLocaleTimeString()}] Theme → ${t}`]);
    });
  }
}

// SOLUTION 4: ShoppingCartComponent
type CartItem = { name: string; qty: number; price: number };

@Component({
  selector: 'app-shopping-cart',
  standalone: true,
  template: `
    <div style="display: flex; gap: 8px; margin-bottom: 12px; flex-wrap: wrap;">
      @for (p of products; track p.name) {
        <button (click)="addItem(p.name, p.price)"
                style="padding: 6px 12px; background: #27ae60; color: white;
                       border: none; border-radius: 4px; cursor: pointer;">
          + {{ p.name }} (${{ p.price }})
        </button>
      }
    </div>
    @if (items().length > 0) {
      <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 10px;">
        <thead>
          <tr style="background: #3498db; color: white;">
            <th style="padding: 6px 10px; text-align: left;">Item</th>
            <th style="padding: 6px 10px;">Qty</th>
            <th style="padding: 6px 10px;">Price</th>
            <th style="padding: 6px 10px;">Subtotal</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (item of items(); track item.name) {
            <tr style="border-bottom: 1px solid #eee;">
              <td style="padding: 6px 10px;">{{ item.name }}</td>
              <td style="padding: 6px 10px; text-align: center;">
                <button (click)="incrementQty(item.name)" style="cursor: pointer;">+</button>
                {{ item.qty }}
              </td>
              <td style="padding: 6px 10px; text-align: right;">${{ item.price.toFixed(2) }}</td>
              <td style="padding: 6px 10px; text-align: right;">${{ (item.qty * item.price).toFixed(2) }}</td>
              <td style="padding: 6px 10px;">
                <button (click)="removeItem(item.name)"
                        style="background: #e74c3c; color: white; border: none;
                               border-radius: 4px; padding: 2px 8px; cursor: pointer; font-size: 12px;">✕</button>
              </td>
            </tr>
          }
        </tbody>
      </table>
      <div style="text-align: right; font-weight: bold;">
        {{ count() }} item(s) · Total: ${{ total().toFixed(2) }}
      </div>
    } @else {
      <p style="color: gray;">Cart is empty.</p>
    }
  `,
})
class ShoppingCartComponent {
  items = signal<CartItem[]>([]);
  total = computed(() => this.items().reduce((s, i) => s + i.qty * i.price, 0));
  count = computed(() => this.items().reduce((s, i) => s + i.qty, 0));
  products = [
    { name: 'Widget',  price: 9.99  },
    { name: 'Gadget',  price: 24.99 },
    { name: 'Doohickey', price: 4.49 },
  ];

  addItem(name: string, price: number) {
    this.items.update((list) => {
      const existing = list.find((i) => i.name === name);
      if (existing) return list.map((i) => i.name === name ? { ...i, qty: i.qty + 1 } : i);
      return [...list, { name, qty: 1, price }];
    });
  }
  incrementQty(name: string) {
    this.items.update((list) => list.map((i) => i.name === name ? { ...i, qty: i.qty + 1 } : i));
  }
  removeItem(name: string) {
    this.items.update((list) => list.filter((i) => i.name !== name));
  }
}

// SOLUTION 5: SignalInputComponent (signal-based inputs)
@Component({
  selector: 'app-signal-input',
  standalone: true,
  template: `
    <div style="display: flex; align-items: center; gap: 10px; padding: 10px;
                border: 1px solid #dee2e6; border-radius: 6px;">
      <span style="font-weight: 600; min-width: 60px;">{{ label() }}</span>
      <button (click)="changed.emit(value() - 1)"
              style="width: 30px; height: 30px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">−</button>
      <span style="min-width: 32px; text-align: center; font-size: 1.1rem; font-weight: bold;">{{ value() }}</span>
      <button (click)="changed.emit(value() + 1)"
              style="width: 30px; height: 30px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">+</button>
    </div>
  `,
})
class SignalInputComponent {
  label   = input.required<string>();
  value   = input(0);
  changed = output<number>();
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CounterSignalComponent,
    FormSignalComponent,
    EffectDemoComponent,
    ShoppingCartComponent,
    SignalInputComponent,
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Solution 3.1 — Signal Basics</h1>

      <h2>1. Counter with signal + computed</h2>
      <app-counter-signal />
      <hr />

      <h2>2. Form with signal inputs</h2>
      <app-form-signal />
      <hr />

      <h2>3. effect() side-effects</h2>
      <app-effect-demo />
      <hr />

      <h2>4. Shopping Cart (signal array)</h2>
      <app-shopping-cart />
      <hr />

      <h2>5. Signal-based input() / output()</h2>
      <app-signal-input label="Score" [value]="score" (changed)="score = $event" />
      <p>Parent sees: <strong>{{ score }}</strong></p>
    </div>
  `,
})
export class AppComponent {
  score = 10;
}
