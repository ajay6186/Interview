import React, { useReducer } from "react";

// =============================================================
// SOLUTION 6: Shopping Cart with useReducer
// =============================================================

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
  | { type: "REMOVE_ITEM"; payload: number }
  | { type: "INCREMENT_QTY"; payload: number }
  | { type: "DECREMENT_QTY"; payload: number }
  | { type: "CLEAR_CART" };

const CATALOG: Product[] = [
  { id: 1, name: "Coffee Mug", price: 12.99, emoji: "☕" },
  { id: 2, name: "Mechanical Keyboard", price: 89.99, emoji: "⌨️" },
  { id: 3, name: "Desk Lamp", price: 34.99, emoji: "💡" },
  { id: 4, name: "Notebook", price: 8.99, emoji: "📓" },
  { id: 5, name: "USB-C Hub", price: 49.99, emoji: "🔌" },
];

// TODO 1 ✅ — initial state
const initialState: CartState = { items: [] };

// TODO 2 ✅ — reducer function
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_ITEM": {
      const exists = state.items.find(
        (item) => item.product.id === action.payload.id
      );
      if (exists) {
        // Already in cart — increase quantity
        return {
          items: state.items.map((item) =>
            item.product.id === action.payload.id
              ? { ...item, quantity: item.quantity + 1 }
              : item
          ),
        };
      }
      // Not in cart — add new entry
      return {
        items: [...state.items, { product: action.payload, quantity: 1 }],
      };
    }

    case "REMOVE_ITEM":
      return {
        items: state.items.filter((item) => item.product.id !== action.payload),
      };

    case "INCREMENT_QTY":
      return {
        items: state.items.map((item) =>
          item.product.id === action.payload
            ? { ...item, quantity: item.quantity + 1 }
            : item
        ),
      };

    case "DECREMENT_QTY":
      return {
        items: state.items
          .map((item) =>
            item.product.id === action.payload
              ? { ...item, quantity: item.quantity - 1 }
              : item
          )
          .filter((item) => item.quantity > 0), // Remove if qty reaches 0
      };

    case "CLEAR_CART":
      return { items: [] };

    default:
      return state;
  }
}

export function App() {
  // TODO 3 ✅ — useReducer
  const [state, dispatch] = useReducer(cartReducer, initialState);

  // TODO 4 ✅ — derived values
  const totalItems = state.items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = state.items.reduce(
    (sum, item) => sum + item.product.price * item.quantity,
    0
  );

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
            <button
              style={styles.addBtn}
              onClick={() => dispatch({ type: "ADD_ITEM", payload: product })}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>

      {/* --- RIGHT: Cart --- */}
      <div style={styles.cart}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={styles.sectionTitle}>
            Cart
            {totalItems > 0 && (
              <span style={styles.badge}>{totalItems}</span>
            )}
          </h2>
          {state.items.length > 0 && (
            <button
              style={styles.clearBtn}
              onClick={() => dispatch({ type: "CLEAR_CART" })}
            >
              Clear
            </button>
          )}
        </div>

        {state.items.length === 0 && (
          <p style={{ color: "#9ca3af", textAlign: "center", padding: "20px 0" }}>
            Your cart is empty
          </p>
        )}

        {state.items.map((item) => (
          <div key={item.product.id} style={styles.cartItem}>
            <span>{item.product.emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: "bold", color: "#111827", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {item.product.name}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                ${item.product.price.toFixed(2)} each
              </p>
            </div>
            <button
              style={styles.qtyBtn}
              onClick={() =>
                dispatch({ type: "DECREMENT_QTY", payload: item.product.id })
              }
            >
              −
            </button>
            <span style={{ minWidth: 20, textAlign: "center", fontWeight: "bold" }}>
              {item.quantity}
            </span>
            <button
              style={styles.qtyBtn}
              onClick={() =>
                dispatch({ type: "INCREMENT_QTY", payload: item.product.id })
              }
            >
              +
            </button>
            <button
              style={styles.removeBtn}
              onClick={() =>
                dispatch({ type: "REMOVE_ITEM", payload: item.product.id })
              }
            >
              ✕
            </button>
          </div>
        ))}

        {state.items.length > 0 && (
          <div style={styles.totalRow}>
            <span>Total</span>
            <span>${totalPrice.toFixed(2)}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// --- KEY CONCEPTS ---
// 1. useReducer(reducer, initialState) → [state, dispatch]
//    - Use when state has multiple sub-values or complex transitions
//    - dispatch({ type: "ACTION", payload: data }) triggers the reducer
//
// 2. Reducer is a pure function: (state, action) => newState
//    - Never mutate state directly: state.items.push(x) ← WRONG
//    - Always return a new object: { ...state, items: [...state.items, x] }
//
// 3. Derived values (totalItems, totalPrice) from state:
//    - Compute them during render — no need for separate state
//
// 4. useReducer vs useState:
//    - useState: simple value or small independent pieces
//    - useReducer: multiple related values, complex update logic, actions that depend on current state

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
