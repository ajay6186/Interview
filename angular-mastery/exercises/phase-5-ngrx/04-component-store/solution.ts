// Phase 5 - Solution 04: NgRx ComponentStore
// Topics: ComponentStore, updater, effect, select, vm$ pattern
//
// Setup: npm install @ngrx/component-store

import { Component, signal, computed, inject, Injectable, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// ─────────────────────────────────────────────────────────────────────────────
// Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface CartItem {
  id:       string;
  name:     string;
  price:    number;
  quantity: number;
}

export interface CartState {
  items:          CartItem[];
  checkoutStatus: 'idle' | 'pending' | 'success' | 'error';
}

// ─────────────────────────────────────────────────────────────────────────────
// ComponentStore shim (replaces @ngrx/component-store in this demo)
// In a real project: import { ComponentStore } from '@ngrx/component-store';
// ─────────────────────────────────────────────────────────────────────────────

/*
// REAL @ngrx/component-store ComponentStore:
import { ComponentStore } from '@ngrx/component-store';
import { tapResponse } from '@ngrx/operators';  // or '@ngrx/component-store'
import { Observable } from 'rxjs';
import { switchMap, tap } from 'rxjs/operators';

@Injectable()
export class CartComponentStore extends ComponentStore<CartState> {
  constructor() {
    super({ items: [], checkoutStatus: 'idle' });
  }

  // ── Updaters ──
  readonly addItem = this.updater((state, item: CartItem) => {
    const existing = state.items.find(i => i.id === item.id);
    if (existing) {
      return {
        ...state,
        items: state.items.map(i =>
          i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i
        ),
      };
    }
    return { ...state, items: [...state.items, { ...item, quantity: 1 }] };
  });

  readonly removeItem = this.updater((state, id: string) => ({
    ...state,
    items: state.items.filter(i => i.id !== id),
  }));

  readonly updateQuantity = this.updater((state, { id, quantity }: { id: string; quantity: number }) => ({
    ...state,
    items: quantity <= 0
      ? state.items.filter(i => i.id !== id)
      : state.items.map(i => i.id === id ? { ...i, quantity } : i),
  }));

  readonly clearCart = this.updater(state => ({ ...state, items: [] }));

  // ── Selectors ──
  readonly items$     = this.select(state => state.items);
  readonly total$     = this.select(state =>
    state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
  );
  readonly itemCount$ = this.select(state =>
    state.items.reduce((sum, i) => sum + i.quantity, 0)
  );

  // vm$ (ViewModel) pattern — combine multiple selectors
  readonly vm$ = this.select(
    this.items$,
    this.total$,
    this.itemCount$,
    this.select(state => state.checkoutStatus),
    (items, total, itemCount, checkoutStatus) => ({
      items, total, itemCount, checkoutStatus,
    })
  );

  // ── Effects ──
  readonly checkout$ = this.effect((trigger$: Observable<void>) =>
    trigger$.pipe(
      tap(() => this.patchState({ checkoutStatus: 'pending' })),
      switchMap(() =>
        this.http.post('/api/checkout', { items: this.get().items }).pipe(
          tapResponse(
            () => {
              this.patchState({ checkoutStatus: 'success' });
              this.clearCart();
            },
            () => this.patchState({ checkoutStatus: 'error' })
          )
        )
      )
    )
  );
}
*/

// ─────────────────────────────────────────────────────────────────────────────
// Simulated ComponentStore (signal-based, single-file demo)
// ─────────────────────────────────────────────────────────────────────────────

@Injectable()
export class CartComponentStore {
  private _state = signal<CartState>({ items: [], checkoutStatus: 'idle' });

  // ── Updaters ──────────────────────────────────────────────────────────────

  addItem(item: CartItem): void {
    const state = this._state();
    const existing = state.items.find(i => i.id === item.id);
    if (existing) {
      this._state.set({
        ...state,
        items: state.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i),
      });
    } else {
      this._state.set({ ...state, items: [...state.items, { ...item, quantity: 1 }] });
    }
  }

  removeItem(id: string): void {
    this._state.set({ ...this._state(), items: this._state().items.filter(i => i.id !== id) });
  }

  updateQuantity(id: string, quantity: number): void {
    const items = quantity <= 0
      ? this._state().items.filter(i => i.id !== id)
      : this._state().items.map(i => i.id === id ? { ...i, quantity } : i);
    this._state.set({ ...this._state(), items });
  }

  clearCart(): void {
    this._state.set({ ...this._state(), items: [] });
  }

  // ── Selectors ────────────────────────────────────────────────────────────

  readonly items      = computed(() => this._state().items);
  readonly total      = computed(() => this._state().items.reduce((sum, i) => sum + i.price * i.quantity, 0));
  readonly itemCount  = computed(() => this._state().items.reduce((sum, i) => sum + i.quantity, 0));
  readonly status     = computed(() => this._state().checkoutStatus);

  // vm (ViewModel) pattern
  readonly vm = computed(() => ({
    items:          this.items(),
    total:          this.total(),
    itemCount:      this.itemCount(),
    checkoutStatus: this.status(),
  }));

  // ── Effects ───────────────────────────────────────────────────────────────

  async checkout(): Promise<void> {
    this._state.set({ ...this._state(), checkoutStatus: 'pending' });
    // Simulate HTTP call
    await new Promise(r => setTimeout(r, 1500));
    try {
      // Real: await this.http.post('/api/checkout', { items: ... }).toPromise();
      this._state.set({ ...this._state(), checkoutStatus: 'success' });
      this.clearCart();
    } catch {
      this._state.set({ ...this._state(), checkoutStatus: 'error' });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// CartComponent — provides CartComponentStore in its own providers[]
// ─────────────────────────────────────────────────────────────────────────────

const AVAILABLE_PRODUCTS: CartItem[] = [
  { id: 'p1', name: 'Angular Course',    price: 49.99, quantity: 0 },
  { id: 'p2', name: 'TypeScript Book',   price: 34.99, quantity: 0 },
  { id: 'p3', name: 'RxJS Workshop',     price: 79.99, quantity: 0 },
  { id: 'p4', name: 'NgRx Deep Dive',    price: 59.99, quantity: 0 },
];

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule],
  // KEY: ComponentStore is provided here — scoped to this component tree
  providers: [CartComponentStore],
  template: `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; padding:1.5rem;
                background:#e8f5e9; border-radius:8px; margin-bottom:1rem">
      <!-- Products panel -->
      <div>
        <h3>Products</h3>
        @for (product of products; track product.id) {
          <div style="display:flex; justify-content:space-between; align-items:center;
                      background:white; padding:0.6rem 0.75rem; border-radius:4px; margin-bottom:0.4rem">
            <div>
              <strong>{{ product.name }}</strong><br/>
              <small>${{ product.price }}</small>
            </div>
            <button (click)="addToCart(product)"
                    style="padding:0.3rem 0.75rem; background:#2e7d32; color:white;
                           border:none; border-radius:4px; cursor:pointer">
              Add
            </button>
          </div>
        }
      </div>

      <!-- Cart panel -->
      <div>
        <h3>Cart
          <small style="font-weight:normal; font-size:0.8rem; margin-left:0.4rem">
            ({{ vm().itemCount }} items)
          </small>
        </h3>

        @if (vm().items.length === 0) {
          <p style="color:#888; font-style:italic">Cart is empty</p>
        } @else {
          @for (item of vm().items; track item.id) {
            <div style="display:flex; align-items:center; gap:0.5rem; background:white;
                        padding:0.5rem; border-radius:4px; margin-bottom:0.4rem; font-size:0.9rem">
              <span style="flex:1">{{ item.name }}</span>
              <button (click)="decreaseQty(item)"
                      style="width:24px; height:24px; background:#ef5350; color:white;
                             border:none; border-radius:3px; cursor:pointer; font-weight:bold">−</button>
              <span style="min-width:20px; text-align:center">{{ item.quantity }}</span>
              <button (click)="cartStore.addItem(item)"
                      style="width:24px; height:24px; background:#2e7d32; color:white;
                             border:none; border-radius:3px; cursor:pointer; font-weight:bold">+</button>
              <span style="min-width:60px; text-align:right">${{ (item.price * item.quantity).toFixed(2) }}</span>
              <button (click)="cartStore.removeItem(item.id)"
                      style="background:transparent; border:none; cursor:pointer; color:#999">✕</button>
            </div>
          }

          <div style="border-top:2px solid #a5d6a7; padding-top:0.5rem; margin-top:0.5rem;
                      display:flex; justify-content:space-between; font-weight:bold">
            <span>Total:</span>
            <span>${{ vm().total.toFixed(2) }}</span>
          </div>
        }

        <!-- Checkout -->
        @if (vm().items.length > 0 && vm().checkoutStatus !== 'success') {
          <button (click)="checkout()"
                  [disabled]="vm().checkoutStatus === 'pending'"
                  style="width:100%; margin-top:0.75rem; padding:0.5rem; background:#1565c0;
                         color:white; border:none; border-radius:4px; cursor:pointer">
            {{ vm().checkoutStatus === 'pending' ? 'Processing...' : 'Checkout' }}
          </button>
        }

        @switch (vm().checkoutStatus) {
          @case ('success') {
            <div style="margin-top:0.75rem; padding:0.5rem; background:#c8e6c9; border-radius:4px; text-align:center">
              Order placed successfully!
            </div>
          }
          @case ('error') {
            <div style="margin-top:0.75rem; padding:0.5rem; background:#ffcdd2; border-radius:4px; text-align:center">
              Checkout failed. Please try again.
            </div>
          }
        }
      </div>
    </div>

    <div style="padding:1rem; background:#f1f8e9; border-radius:8px; font-size:0.85rem; margin-bottom:1rem">
      <strong>ComponentStore vs Global Store:</strong>
      <ul style="margin:0.5rem 0 0">
        <li><strong>ComponentStore</strong> — local, lives and dies with the component, no DevTools</li>
        <li><strong>Global Store</strong> — app-wide, persists across routes, supports DevTools time-travel</li>
        <li>Provide ComponentStore in <code>providers: [MyStore]</code> in the component decorator</li>
        <li><code>updater()</code> = synchronous state mutation (like a mini-reducer)</li>
        <li><code>effect()</code> = async side effect (HTTP calls, etc.)</li>
        <li><code>select()</code> = memoized derived state (Observable or Signal)</li>
        <li><code>patchState(&#123; key: value &#125;)</code> = partial state update</li>
      </ul>
    </div>
  `,
})
export class CartComponent {
  cartStore = inject(CartComponentStore);
  vm        = this.cartStore.vm;
  products  = AVAILABLE_PRODUCTS;

  addToCart(product: CartItem) {
    this.cartStore.addItem(product);
  }

  decreaseQty(item: CartItem) {
    this.cartStore.updateQuantity(item.id, item.quantity - 1);
  }

  async checkout() {
    await this.cartStore.checkout();
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, CartComponent],
  template: `
    <div style="font-family:sans-serif; max-width:900px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 5 – NgRx ComponentStore</h1>
      <app-cart />
    </div>
  `,
})
export class AppComponent {}
