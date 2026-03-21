import { Component, Injectable, inject, signal, computed,
         ChangeDetectionStrategy } from '@angular/core';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

// ============================================================
// Solution 8.6 — Shopping Cart
// ============================================================

interface Product    { id: number; name: string; price: number; }
interface CartItem   { productId: number; name: string; price: number; qty: number; }

const PRODUCTS: Product[] = [
  { id: 1, name: 'Laptop',     price: 999 },
  { id: 2, name: 'Monitor',    price: 349 },
  { id: 3, name: 'Keyboard',   price: 79 },
  { id: 4, name: 'Mouse',      price: 39 },
  { id: 5, name: 'Headphones', price: 149 },
  { id: 6, name: 'Webcam',     price: 89 },
];

// SOLUTION 1: CartService
@Injectable({ providedIn: 'root' })
class CartService {
  private _items = signal<CartItem[]>([]);
  items     = this._items.asReadonly();
  total     = computed(() => this._items().reduce((s, i) => s + i.price * i.qty, 0));
  itemCount = computed(() => this._items().reduce((s, i) => s + i.qty, 0));
  isEmpty   = computed(() => this._items().length === 0);

  addItem(p: Product) {
    this._items.update(items => {
      const ex = items.find(i => i.productId === p.id);
      if (ex) return items.map(i => i.productId === p.id ? { ...i, qty: i.qty + 1 } : i);
      return [...items, { productId: p.id, name: p.name, price: p.price, qty: 1 }];
    });
  }
  removeItem(id: number) { this._items.update(items => items.filter(i => i.productId !== id)); }
  updateQty(id: number, qty: number) {
    if (qty <= 0) { this.removeItem(id); return; }
    this._items.update(items => items.map(i => i.productId === id ? { ...i, qty } : i));
  }
  clear() { this._items.set([]); }
  qtyFor(id: number) { return this._items().find(i => i.productId === id)?.qty ?? 0; }
}

// SOLUTION 2: ProductListComponent
@Component({
  selector: 'app-product-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Products</h3>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;">
        @for (p of products; track p.id) {
          <div style="border:1px solid #ddd;border-radius:8px;padding:12px;text-align:center;">
            <strong>{{ p.name }}</strong><br />
            <span style="color:#007bff;">${{ p.price }}</span><br />
            <button (click)="cart.addItem(p)" style="margin-top:8px;padding:4px 12px;cursor:pointer;">
              Add to Cart
            </button>
            @if (cart.qtyFor(p.id) > 0) {
              <span style="margin-left:4px;color:#28a745;">× {{ cart.qtyFor(p.id) }}</span>
            }
          </div>
        }
      </div>
    </section>
  `,
})
class ProductListComponent {
  cart     = inject(CartService);
  products = PRODUCTS;
}

// SOLUTION 3: CartComponent
@Component({
  selector: 'app-cart',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Cart ({{ cart.itemCount() }} items)</h3>
      @if (cart.isEmpty()) {
        <p style="color:#999;">Cart is empty.</p>
      }
      @for (item of cart.items(); track item.productId) {
        <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid #eee;">
          <span style="flex:1;">{{ item.name }}</span>
          <button (click)="cart.updateQty(item.productId, item.qty - 1)">−</button>
          <span style="min-width:24px;text-align:center;">{{ item.qty }}</span>
          <button (click)="cart.updateQty(item.productId, item.qty + 1)">+</button>
          <span style="min-width:70px;text-align:right;">${{ (item.price * item.qty).toFixed(2) }}</span>
          <button (click)="cart.removeItem(item.productId)" style="color:#e74c3c;background:none;border:none;cursor:pointer;font-size:1.2rem;">×</button>
        </div>
      }
    </section>
  `,
})
class CartComponent {
  cart = inject(CartService);
}

// SOLUTION 4: CartSummary
@Component({
  selector: 'app-cart-summary',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section style="background:#f9f9f9;padding:16px;border-radius:8px;">
      <h3>Summary</h3>
      <p>Subtotal: ${{ subtotal().toFixed(2) }}</p>
      <p>Tax (8%): ${{ tax().toFixed(2) }}</p>
      <p><strong>Total: ${{ grandTotal().toFixed(2) }}</strong></p>
    </section>
  `,
})
class CartSummaryComponent {
  cart      = inject(CartService);
  subtotal  = computed(() => this.cart.total());
  tax       = computed(() => this.subtotal() * 0.08);
  grandTotal = computed(() => this.subtotal() + this.tax());
}

// SOLUTION 5: CheckoutForm
@Component({
  selector: 'app-checkout-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Checkout</h3>
      @if (success()) {
        <p style="color:green;font-size:1.2rem;">Order placed successfully! Thank you!</p>
      } @else {
        <form [formGroup]="form" (ngSubmit)="submit()">
          <label>Name: <input formControlName="name" /></label>
          @if (f['name'].invalid && f['name'].touched) { <span style="color:red"> Required</span> }<br /><br />
          <label>Email: <input formControlName="email" type="email" /></label>
          @if (f['email'].errors?.['email'] && f['email'].touched) { <span style="color:red"> Invalid</span> }<br /><br />
          <label>Address: <input formControlName="address" style="width:280px;" /></label>
          @if (f['address'].invalid && f['address'].touched) { <span style="color:red"> Min 10 chars</span> }<br /><br />
          <label>Card #: <input formControlName="card" placeholder="16 digits" /></label>
          @if (f['card'].invalid && f['card'].touched) { <span style="color:red"> 16-digit number required</span> }<br /><br />
          <button type="submit" [disabled]="form.invalid || cart.isEmpty()">Place Order</button>
        </form>
      }
    </section>
  `,
})
class CheckoutFormComponent {
  cart    = inject(CartService);
  success = signal(false);
  form    = new FormGroup({
    name:    new FormControl('', Validators.required),
    email:   new FormControl('', [Validators.required, Validators.email]),
    address: new FormControl('', [Validators.required, Validators.minLength(10)]),
    card:    new FormControl('', [Validators.required, Validators.pattern(/^\d{16}$/)]),
  });
  get f() { return this.form.controls; }

  submit() {
    if (this.form.valid && !this.cart.isEmpty()) {
      this.success.set(true);
      this.cart.clear();
    }
  }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProductListComponent, CartComponent, CartSummaryComponent, CheckoutFormComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Solution 8.6 — Shopping Cart</h1>
      <app-product-list />
      <hr />
      <app-cart />
      <app-cart-summary />
      <hr />
      <app-checkout-form />
    </div>
  `,
})
export class AppComponent {}
