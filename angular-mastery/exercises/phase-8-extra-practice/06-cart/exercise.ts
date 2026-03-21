import { Component } from '@angular/core';

// ============================================================
// Exercise 8.6 — Shopping Cart
// ============================================================
// Topics:
//   • Signals-based CartService
//   • Product listing + add-to-cart
//   • Cart with quantity controls
//   • Summary with tax/total
//   • Checkout form with validation
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: CartService
// ---------------------------------------------------------------------------
// Create a CartService decorated with @Injectable({ providedIn: 'root' }).
// interface CartItem { productId: number; name: string; price: number; qty: number; }
// Signals:
//   - items: CartItem[]
//   - computed: total (sum of price * qty)
//   - computed: itemCount (sum of qty)
//   - computed: isEmpty
// Methods:
//   - addItem(product: { id: number; name: string; price: number })
//     (increments qty if already in cart)
//   - removeItem(productId: number)
//   - updateQty(productId: number, qty: number)
//   - clear()
//
// @Injectable({ providedIn: 'root' })
// export class CartService { ... }

// ---------------------------------------------------------------------------
// TODO 2: ProductListComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-product-list'.
// Inject CartService.
// Display a grid of 6 products with: name, price, "Add to Cart" button.
// Show current qty in cart for each product.
//
// @Component({ selector: 'app-product-list', standalone: true, ... })
// export class ProductListComponent { ... }

// ---------------------------------------------------------------------------
// TODO 3: CartComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-cart'.
// Inject CartService.
// Display each cart item with:
//   - Product name and price
//   - − / + quantity controls
//   - Remove (×) button
//   - Line total (price × qty)
// Show "Cart is empty" when empty.
//
// @Component({ selector: 'app-cart', standalone: true, ... })
// export class CartComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: CartSummaryComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-cart-summary'.
// Inject CartService.
// Display:
//   - Subtotal
//   - Tax (8% of subtotal)
//   - Total (subtotal + tax)
//   - Item count
//
// @Component({ selector: 'app-cart-summary', standalone: true, ... })
// export class CartSummaryComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: CheckoutFormComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-checkout-form'.
// Use ReactiveFormsModule with validation:
//   - name (required)
//   - email (required, email)
//   - address (required, minLength 10)
//   - card number (required, pattern: 16 digits)
// On submit, display a success message and clear the cart.
//
// @Component({ selector: 'app-checkout-form', standalone: true, ... })
// export class CheckoutFormComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add all exercise components
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 8.6 — Shopping Cart</h1>
      <!-- TODO: render all components in a sensible layout -->
    </div>
  `,
})
export class AppComponent {}
