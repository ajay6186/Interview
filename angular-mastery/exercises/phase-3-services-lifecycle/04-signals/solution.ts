import { Component, signal, computed, effect, input, linkedSignal,
         ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';

// ============================================================
// Solution 3.4 — Signals
// ============================================================

// SOLUTION 1: SignalBasicsComponent
@Component({
  selector: 'app-signal-basics',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Signal Basics</h3>
      <p>Count: <strong>{{ count() }}</strong></p>
      <p>Doubled: {{ doubled() }} | isEven: {{ isEven() }}</p>
      <button (click)="count.update(n => n - 1)">−</button>
      <button (click)="count.update(n => n + 1)" style="margin-left: 8px;">+</button>
    </section>
  `,
})
class SignalBasicsComponent {
  count   = signal(0);
  doubled = computed(() => this.count() * 2);
  isEven  = computed(() => this.count() % 2 === 0);
}

// SOLUTION 2: ComputedComponent
interface CartItem { name: string; price: number; qty: number; }

@Component({
  selector: 'app-computed',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Computed — Shopping Cart</h3>
      @for (item of items(); track item.name) {
        <p>{{ item.name }} × {{ item.qty }} = ${{ (item.price * item.qty).toFixed(2) }}</p>
      }
      <p>Items: {{ itemCount() }} | Total: ${{ total().toFixed(2) }} | Discount: ${{ discount().toFixed(2) }}</p>
      <button (click)="addItem()">Add Mango ($2.00)</button>
    </section>
  `,
})
class ComputedComponent {
  items = signal<CartItem[]>([
    { name: 'Apple',  price: 1.5, qty: 2 },
    { name: 'Banana', price: 0.8, qty: 3 },
  ]);
  total     = computed(() => this.items().reduce((s, i) => s + i.price * i.qty, 0));
  itemCount = computed(() => this.items().reduce((s, i) => s + i.qty, 0));
  discount  = computed(() => this.total() > 10 ? this.total() * 0.1 : 0);

  addItem() {
    this.items.update(items => [...items, { name: 'Mango', price: 2, qty: 1 }]);
  }
}

// SOLUTION 3: EffectComponent
@Component({
  selector: 'app-effect',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>effect() — Side Effects</h3>
      <input [(ngModel)]="inputVal" placeholder="type something..." />
      <button (click)="save()" style="margin-left: 8px;">Save</button>
      <p>Stored: <strong>{{ value() }}</strong></p>
      <p><em>Check console and localStorage['effect-demo']</em></p>
    </section>
  `,
})
class EffectComponent {
  value    = signal(localStorage.getItem('effect-demo') ?? '');
  inputVal = '';

  constructor() {
    effect(() => {
      const v = this.value();
      console.log('[effect] value changed:', v);
      localStorage.setItem('effect-demo', v);
    });
  }

  save() { this.value.set(this.inputVal); }
}

// SOLUTION 4: SignalInputComponent
@Component({
  selector: 'app-signal-input',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>{{ greeting() }}</p>`,
})
class SignalInputComponent {
  name     = input<string>('World');
  greeting = computed(() => `Hello, ${this.name()}!`);
}

@Component({
  selector: 'app-signal-input-host',
  standalone: true,
  imports: [SignalInputComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>input() — Signal Inputs</h3>
      @for (n of names; track n) {
        <app-signal-input [name]="n" />
      }
    </section>
  `,
})
class SignalInputHostComponent {
  names = ['Alice', 'Bob', 'Angular'];
}

// SOLUTION 5: LinkedSignalComponent
@Component({
  selector: 'app-linked-signal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>linkedSignal()</h3>
      <p>Items: {{ items().join(', ') }}</p>
      <p>Selected: <strong>{{ selected() }}</strong></p>
      <button (click)="selectNext()">Select Next</button>
      <button (click)="swapItems()" style="margin-left: 8px;">Swap Items Array</button>
      <p><em>Swapping items resets selection to first item.</em></p>
    </section>
  `,
})
class LinkedSignalComponent {
  items    = signal(['Apple', 'Banana', 'Cherry']);
  selected = linkedSignal(() => this.items()[0]);
  private idx = 0;

  selectNext() {
    this.idx = (this.idx + 1) % this.items().length;
    this.selected.set(this.items()[this.idx]);
  }

  swapItems() {
    this.idx = 0;
    this.items.set(['Mango', 'Grape', 'Peach']);
  }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    SignalBasicsComponent,
    ComputedComponent,
    EffectComponent,
    SignalInputHostComponent,
    LinkedSignalComponent,
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 3.4 — Signals</h1>
      <app-signal-basics />
      <hr />
      <app-computed />
      <hr />
      <app-effect />
      <hr />
      <app-signal-input-host />
      <hr />
      <app-linked-signal />
    </div>
  `,
})
export class AppComponent {}
