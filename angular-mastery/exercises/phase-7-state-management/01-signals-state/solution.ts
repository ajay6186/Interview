import { Component, Injectable, inject, signal, computed, effect,
         ChangeDetectionStrategy } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { debounceTime } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';

// ============================================================
// Solution 7.1 — Signals-Based State
// ============================================================

// SOLUTION 1: CounterStore
@Injectable({ providedIn: 'root' })
class CounterStore {
  count       = signal(0);
  doubled     = computed(() => this.count() * 2);
  isNegative  = computed(() => this.count() < 0);
  history     = signal<number[]>([]);

  constructor() {
    effect(() => {
      const v = this.count();
      this.history.update(h => [...h.slice(-4), v]);
    });
  }

  increment() { this.count.update(n => n + 1); }
  decrement() { this.count.update(n => n - 1); }
  reset()     { this.count.set(0); }
}

// SOLUTION 2: CartStore
interface CartItem { id: number; name: string; price: number; qty: number; }

@Injectable({ providedIn: 'root' })
class CartStore {
  items     = signal<CartItem[]>([]);
  total     = computed(() => this.items().reduce((s, i) => s + i.price * i.qty, 0));
  itemCount = computed(() => this.items().reduce((s, i) => s + i.qty, 0));
  isEmpty   = computed(() => this.items().length === 0);

  addItem(item: CartItem) {
    this.items.update(items => {
      const existing = items.find(i => i.id === item.id);
      if (existing) return items.map(i => i.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      return [...items, item];
    });
  }
  removeItem(id: number) { this.items.update(items => items.filter(i => i.id !== id)); }
  updateQty(id: number, qty: number) {
    this.items.update(items => items.map(i => i.id === id ? { ...i, qty } : i));
  }
  clear() { this.items.set([]); }
}

// SOLUTION 3: UserStore with sessionStorage persistence
interface User { id: number; name: string; email: string; }

@Injectable({ providedIn: 'root' })
class UserStore {
  private _user = signal<User | null>(
    JSON.parse(sessionStorage.getItem('currentUser') ?? 'null')
  );
  currentUser  = this._user.asReadonly();
  isLoggedIn   = computed(() => this._user() !== null);
  displayName  = computed(() => this._user()?.name ?? 'Guest');

  constructor() {
    effect(() => sessionStorage.setItem('currentUser', JSON.stringify(this._user())));
  }

  login(user: User)  { this._user.set(user); }
  logout()           { this._user.set(null); }
}

// SOLUTION 4: toObservable
@Component({
  selector: 'app-to-observable',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>toObservable()</h3>
      <p>Counter: {{ store.count() }}</p>
      <button (click)="store.increment()">+</button>
      <button (click)="store.decrement()" style="margin-left:8px">−</button>
      <p>Debounced log (300ms): {{ log().join(', ') }}</p>
    </section>
  `,
})
class ToObservableComponent {
  store = inject(CounterStore);
  log   = signal<number[]>([]);

  constructor() {
    toObservable(this.store.count)
      .pipe(debounceTime(300), takeUntilDestroyed())
      .subscribe(v => this.log.update(l => [...l.slice(-4), v]));
  }
}

// SOLUTION 5: Signal-based form
@Component({
  selector: 'app-signal-form',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Signal Form with Auto-Save</h3>
      <label>Name: <input [(ngModel)]="nameVal" (ngModelChange)="name.set($event)" /></label><br /><br />
      <label>Email: <input [(ngModel)]="emailVal" (ngModelChange)="email.set($event)" /></label>
      @if (errors().length) {
        <ul style="color:red">@for (e of errors(); track e) { <li>{{ e }}</li> }</ul>
      } @else {
        <p style="color:green">Valid! Auto-saved to localStorage.</p>
      }
    </section>
  `,
})
class SignalFormComponent {
  name     = signal('');
  email    = signal('');
  nameVal  = '';
  emailVal = '';

  errors = computed(() => {
    const errs: string[] = [];
    if (!this.name()) errs.push('Name is required');
    if (!this.email().includes('@')) errs.push('Valid email required');
    return errs;
  });

  constructor() {
    effect(() => {
      if (!this.errors().length) {
        localStorage.setItem('signal-form', JSON.stringify({ name: this.name(), email: this.email() }));
      }
    });
  }
}

// Cart demo component
@Component({
  selector: 'app-cart-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>CartStore</h3>
      <button (click)="addProduct(1, 'Laptop', 999)">Add Laptop</button>
      <button (click)="addProduct(2, 'Mouse', 29)" style="margin-left:8px">Add Mouse</button>
      <button (click)="cart.clear()" style="margin-left:8px">Clear</button>
      <p>Items: {{ cart.itemCount() }} | Total: ${{ cart.total() }}</p>
      @for (item of cart.items(); track item.id) {
        <p>{{ item.name }} × {{ item.qty }} = ${{ item.price * item.qty }}
          <button (click)="cart.removeItem(item.id)">×</button>
        </p>
      }
    </section>
  `,
})
class CartDemoComponent {
  cart = inject(CartStore);
  addProduct(id: number, name: string, price: number) { this.cart.addItem({ id, name, price, qty: 1 }); }
}

// User demo component
@Component({
  selector: 'app-user-demo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>UserStore</h3>
      <p>{{ userStore.displayName() }} | loggedIn: {{ userStore.isLoggedIn() }}</p>
      <button (click)="userStore.login({ id: 1, name: 'Alice', email: 'alice@example.com' })">Login Alice</button>
      <button (click)="userStore.logout()" style="margin-left:8px">Logout</button>
    </section>
  `,
})
class UserDemoComponent { userStore = inject(UserStore); }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ToObservableComponent, CartDemoComponent, UserDemoComponent, SignalFormComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 7.1 — Signals-Based State</h1>
      <app-to-observable /><hr />
      <app-cart-demo /><hr />
      <app-user-demo /><hr />
      <app-signal-form />
    </div>
  `,
})
export class AppComponent {}
