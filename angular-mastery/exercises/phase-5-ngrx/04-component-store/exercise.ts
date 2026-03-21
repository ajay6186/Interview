// Phase 5 - Exercise 04: NgRx ComponentStore
// Topics: ComponentStore, updater, effect, select, vm$ pattern
//
// Setup: npm install @ngrx/component-store
// Docs: https://ngrx.io/guide/component-store

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: Create CartComponentStore
//
// Import ComponentStore from '@ngrx/component-store'
//
// Define interfaces:
//   export interface CartItem { id: string; name: string; price: number; quantity: number; }
//   export interface CartState { items: CartItem[]; checkoutStatus: 'idle' | 'pending' | 'success' | 'error'; }
//
// Create:
//   @Injectable()
//   export class CartComponentStore extends ComponentStore<CartState> {
//     constructor() { super({ items: [], checkoutStatus: 'idle' }); }
//   }
//
// NOTE: ComponentStore is LOCAL state — one instance per component.
// It does NOT require provideStore(). Provide it in the component's providers[].
// ─────────────────────────────────────────────

// TODO 1: CartComponentStore skeleton
// @Injectable()
// export class CartComponentStore extends ComponentStore<CartState> { ... }

// ─────────────────────────────────────────────
// TODO 2: Updaters
//
// Updaters are synchronous state mutations — like mini-reducers.
// Add these to CartComponentStore:
//
// readonly addItem = this.updater((state, item: CartItem) => {
//   const existing = state.items.find(i => i.id === item.id);
//   if (existing) {
//     return { ...state, items: state.items.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i) };
//   }
//   return { ...state, items: [...state.items, { ...item, quantity: 1 }] };
// });
//
// Also implement:
// - removeItem(id: string)         — filter out item by id
// - updateQuantity(id, quantity)   — update item quantity (remove if 0)
// - clearCart()                    — reset to empty items array
// ─────────────────────────────────────────────

// TODO 2: addItem, removeItem, updateQuantity, clearCart updaters

// ─────────────────────────────────────────────
// TODO 3: Selectors
//
// Use this.select() to derive state:
//
//   readonly items$  = this.select(state => state.items);
//   readonly total$  = this.select(state => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
//   readonly itemCount$ = this.select(state => state.items.reduce((sum, i) => sum + i.quantity, 0));
//
// Combine into a ViewModel (vm$) pattern:
//   readonly vm$ = this.select(
//     this.items$,
//     this.total$,
//     this.itemCount$,
//     this.select(state => state.checkoutStatus),
//     (items, total, itemCount, checkoutStatus) => ({ items, total, itemCount, checkoutStatus })
//   );
// ─────────────────────────────────────────────

// TODO 3: items$, total$, itemCount$, vm$ selectors

// ─────────────────────────────────────────────
// TODO 4: checkout$ effect
//
// Effects handle async work (HTTP calls, etc.):
//
//   readonly checkout$ = this.effect((trigger$: Observable<void>) =>
//     trigger$.pipe(
//       tap(() => this.patchState({ checkoutStatus: 'pending' })),
//       switchMap(() =>
//         this.http.post('/api/checkout', { items: this.get().items }).pipe(
//           tapResponse(
//             () => {
//               this.patchState({ checkoutStatus: 'success' });
//               this.clearCart();
//             },
//             () => this.patchState({ checkoutStatus: 'error' })
//           )
//         )
//       )
//     )
//   );
//
// tapResponse is from '@ngrx/component-store' — handles next + error safely.
// Call the effect: this.cartStore.checkout$();
// ─────────────────────────────────────────────

// TODO 4: checkout$ effect

// ─────────────────────────────────────────────
// TODO 5: CartComponent — inject CartComponentStore via providers[]
//
// @Component({
//   selector: 'app-cart',
//   standalone: true,
//   providers: [CartComponentStore],   ← scoped to this component tree
//   ...
// })
// export class CartComponent {
//   private cartStore = inject(CartComponentStore);
//   vm$ = this.cartStore.vm$;
//
//   // Use vm$ | async in template or toSignal(vm$)
// }
// ─────────────────────────────────────────────

// TODO 5: CartComponent
// @Component({ ... })
// export class CartComponent { }

// ─────────────────────────────────────────────
// TODO 6: Add CartComponent to imports[] in AppComponent
// ─────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: import CartComponent
  ],
  template: `
    <h1>NgRx ComponentStore Exercise</h1>
    <!-- TODO 6: render CartComponent -->
  `,
})
export class AppComponent {}
