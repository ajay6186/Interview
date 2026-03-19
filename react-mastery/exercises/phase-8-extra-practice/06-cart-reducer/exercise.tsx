import React, { useReducer } from "react";

// =============================================================
// EXERCISE 6: Shopping Cart with useReducer
// =============================================================
// WHAT YOU WILL PRACTICE:
//   - useReducer for managing complex state with multiple actions
//   - Immutable state updates (never mutate directly)
//   - Deriving values from state (total price, item count)
//   - The reducer pattern: (state, action) => newState
//
// GOAL: Build a shopping cart that:
//   1. Shows a list of available products (CATALOG)
//   2. Each product has an "Add to Cart" button
//   3. Cart sidebar shows cart items with quantity + remove button
//   4. "+" and "-" buttons to change quantity
//   5. Shows total item count and total price
//   6. "Clear Cart" button to empty everything
//
// ACTIONS TO IMPLEMENT:
//   - ADD_ITEM:      Add a product to the cart (or increase qty if already there)
//   - REMOVE_ITEM:   Remove a product entirely from the cart
//   - INCREMENT_QTY: Increase quantity of an item by 1
//   - DECREMENT_QTY: Decrease quantity by 1 (remove if it reaches 0)
//   - CLEAR_CART:    Empty the entire cart
// =============================================================

// --- Types (do not change) ---
interface Product {
  id: number;
  name: string;
  price: number;
  emoji: string;
}

interface CartItem {
  product: Product;
  quantity: number;
}

interface CartState {
  items: CartItem[];
}

type CartAction =
  | { type: "ADD_ITEM"; payload: Product }
  | { type: "REMOVE_ITEM"; payload: number }       // payload = product id
  | { type: "INCREMENT_QTY"; payload: number }     // payload = product id
  | { type: "DECREMENT_QTY"; payload: number }     // payload = product id
  | { type: "CLEAR_CART" };

// --- Catalog data (do not change) ---
const CATALOG: Product[] = [
  { id: 1, name: "Coffee Mug", price: 12.99, emoji: "☕" },
  { id: 2, name: "Mechanical Keyboard", price: 89.99, emoji: "⌨️" },
  { id: 3, name: "Desk Lamp", price: 34.99, emoji: "💡" },
  { id: 4, name: "Notebook", price: 8.99, emoji: "📓" },
  { id: 5, name: "USB-C Hub", price: 49.99, emoji: "🔌" },
];

// =============================================================
// TODO 1: Write the initial state
//   { items: [] }
// =============================================================

// =============================================================
// TODO 2: Write the cartReducer function
//   cartReducer(state: CartState, action: CartAction): CartState
//
//   Handle each action:
//
//   ADD_ITEM:
//     - If product already in cart → increase its quantity by 1
//     - If not in cart → add { product: action.payload, quantity: 1 }
//
//   REMOVE_ITEM:
//     - Filter out the item with product.id === action.payload
//
//   INCREMENT_QTY:
//     - Map: find matching product.id, return { ...item, quantity: item.quantity + 1 }
//
//   DECREMENT_QTY:
//     - If quantity is 1: remove the item (like REMOVE_ITEM)
//     - If quantity > 1: decrease by 1
//
//   CLEAR_CART:
//     - Return { items: [] }
//
//   IMPORTANT: Never mutate state. Always return a NEW object.
// =============================================================

export function App() {
  // TODO 3: Call useReducer with cartReducer and initialState

  // TODO 4: Derive totalItems and totalPrice from state.items
  //   totalItems: sum of all quantities
  //   totalPrice: sum of (item.product.price * item.quantity)

  return (
    <div style={styles.layout}>
      {/* --- LEFT: Product Catalog --- */}
      <div style={styles.catalog}>
        <h2 style={styles.sectionTitle}>Shop</h2>
        {CATALOG.map((product) => (
          <div key={product.id} style={styles.productCard}>
            <span style={{ fontSize: 32 }}>{product.emoji}</span>
            <div style={{ flex: 1 }}>
              <p style={styles.productName}>{product.name}</p>
              <p style={styles.productPrice}>${product.price.toFixed(2)}</p>
            </div>
            {/* TODO: dispatch ADD_ITEM when clicked */}
            <button style={styles.addBtn}>Add to Cart</button>
          </div>
        ))}
      </div>

      {/* --- RIGHT: Cart --- */}
      <div style={styles.cart}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={styles.sectionTitle}>
            Cart {/* TODO: show totalItems in badge */}
          </h2>
          {/* TODO: show "Clear" button only if cart has items */}
        </div>

        {/* TODO: show "Cart is empty" message when no items */}
        {/* TODO: map over state.items and render each cart item */}
        {/* Each item:
              - emoji + name + "$price each"
              - "-" button (dispatch DECREMENT_QTY)
              - quantity number
              - "+" button (dispatch INCREMENT_QTY)
              - "✕" remove button (dispatch REMOVE_ITEM)
        */}

        {/* TODO: show total price footer when cart has items */}
        {/* Total: $XX.XX */}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  layout: { display: "flex", gap: 24, maxWidth: 860, margin: "32px auto", fontFamily: "sans-serif", padding: "0 16px", alignItems: "flex-start" },
  catalog: { flex: 1 },
  cart: { width: 300, background: "#f9fafb", borderRadius: 12, padding: "20px", border: "1px solid #e5e7eb", position: "sticky", top: 20 },
  sectionTitle: { fontSize: 20, fontWeight: "bold", margin: "0 0 16px", color: "#111827" },
  productCard: { display: "flex", alignItems: "center", gap: 12, padding: "12px", background: "#fff", borderRadius: 8, marginBottom: 10, border: "1px solid #e5e7eb" },
  productName: { margin: 0, fontWeight: "bold", fontSize: 14, color: "#111827" },
  productPrice: { margin: "2px 0 0", color: "#6b7280", fontSize: 13 },
  addBtn: { padding: "6px 12px", background: "#4f46e5", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer", fontSize: 13, whiteSpace: "nowrap" },
  cartItem: { display: "flex", alignItems: "center", gap: 8, padding: "10px 0", borderBottom: "1px solid #e5e7eb", fontSize: 14 },
  qtyBtn: { width: 26, height: 26, border: "1px solid #d1d5db", borderRadius: 4, background: "#fff", cursor: "pointer", fontSize: 16, lineHeight: 1 },
  removeBtn: { marginLeft: "auto", background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 16 },
  totalRow: { marginTop: 16, paddingTop: 12, borderTop: "2px solid #e5e7eb", display: "flex", justifyContent: "space-between", fontWeight: "bold", fontSize: 16 },
  clearBtn: { padding: "4px 10px", background: "#fee2e2", color: "#ef4444", border: "none", borderRadius: 4, cursor: "pointer", fontSize: 13 },
  badge: { background: "#4f46e5", color: "#fff", borderRadius: 10, padding: "2px 8px", fontSize: 12, marginLeft: 6 },
};
