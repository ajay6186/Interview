import React from "react";
import {
  configureStore,
  createSlice,
  PayloadAction,
  createSelector,
} from "@reduxjs/toolkit";
import { Provider, useSelector, useDispatch } from "react-redux";

// ============================================================
// Solution: Redux Toolkit (Shopping Cart)
// ============================================================
// A shopping cart with products and cart slices, memoized
// selectors for derived data, and full CRUD cart operations.
// ============================================================

// --- Types ---

type Product = {
  id: string;
  name: string;
  price: number;
  description: string;
  inStock: boolean;
};

type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
};

type ProductsState = {
  products: Product[];
};

type CartState = {
  items: CartItem[];
};

// --- Sample Data ---

const sampleProducts: Product[] = [
  {
    id: "p1",
    name: "Wireless Headphones",
    price: 79.99,
    description: "Noise-cancelling over-ear headphones",
    inStock: true,
  },
  {
    id: "p2",
    name: "Mechanical Keyboard",
    price: 129.99,
    description: "Cherry MX Blue switches, RGB backlit",
    inStock: true,
  },
  {
    id: "p3",
    name: "USB-C Hub",
    price: 49.99,
    description: "7-in-1 hub with HDMI, USB-A, SD card",
    inStock: true,
  },
  {
    id: "p4",
    name: "Monitor Stand",
    price: 34.99,
    description: "Adjustable aluminum monitor riser",
    inStock: false,
  },
  {
    id: "p5",
    name: "Webcam HD",
    price: 59.99,
    description: "1080p webcam with built-in microphone",
    inStock: true,
  },
];

// --- Products Slice ---

const productsSlice = createSlice({
  name: "products",
  initialState: { products: sampleProducts } as ProductsState,
  reducers: {
    toggleStock(state, action: PayloadAction<string>) {
      const product = state.products.find((p) => p.id === action.payload);
      if (product) {
        product.inStock = !product.inStock;
      }
    },
  },
});

const { toggleStock } = productsSlice.actions;

// --- Cart Slice ---

const cartSlice = createSlice({
  name: "cart",
  initialState: { items: [] } as CartState,
  reducers: {
    addToCart(
      state,
      action: PayloadAction<{
        productId: string;
        name: string;
        price: number;
      }>
    ) {
      const existing = state.items.find(
        (item) => item.productId === action.payload.productId
      );
      if (existing) {
        existing.quantity += 1;
      } else {
        state.items.push({ ...action.payload, quantity: 1 });
      }
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter(
        (item) => item.productId !== action.payload
      );
    },
    updateQuantity(
      state,
      action: PayloadAction<{ productId: string; quantity: number }>
    ) {
      const { productId, quantity } = action.payload;
      if (quantity <= 0) {
        state.items = state.items.filter(
          (item) => item.productId !== productId
        );
      } else {
        const item = state.items.find((i) => i.productId === productId);
        if (item) {
          item.quantity = quantity;
        }
      }
    },
    clearCart(state) {
      state.items = [];
    },
  },
});

const { addToCart, removeFromCart, updateQuantity, clearCart } =
  cartSlice.actions;

// --- Store ---

const store = configureStore({
  reducer: {
    products: productsSlice.reducer,
    cart: cartSlice.reducer,
  },
});

type RootState = ReturnType<typeof store.getState>;
type AppDispatch = typeof store.dispatch;

// --- Memoized Selectors ---

const selectCartItems = (state: RootState) => state.cart.items;

const selectTotalItems = createSelector(selectCartItems, (items) =>
  items.reduce((sum, item) => sum + item.quantity, 0)
);

const selectTotalPrice = createSelector(selectCartItems, (items) =>
  items.reduce((sum, item) => sum + item.price * item.quantity, 0)
);

const selectCartItemCount = createSelector(
  selectCartItems,
  (items) => items.length
);

// --- Components ---

function ProductCard({ product }: { product: Product }) {
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "12px",
        borderRadius: "8px",
        opacity: product.inStock ? 1 : 0.5,
      }}
    >
      <h4 style={{ margin: "0 0 4px 0" }}>{product.name}</h4>
      <p style={{ color: "#666", fontSize: "14px", margin: "0 0 8px 0" }}>
        {product.description}
      </p>
      <p style={{ fontWeight: "bold", margin: "0 0 8px 0" }}>
        ${product.price.toFixed(2)}
      </p>
      <button
        disabled={!product.inStock}
        onClick={() =>
          dispatch(
            addToCart({
              productId: product.id,
              name: product.name,
              price: product.price,
            })
          )
        }
        style={{
          padding: "6px 14px",
          backgroundColor: product.inStock ? "#27ae60" : "#ccc",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: product.inStock ? "pointer" : "not-allowed",
        }}
      >
        {product.inStock ? "Add to Cart" : "Out of Stock"}
      </button>
    </div>
  );
}

function ProductList() {
  const products = useSelector(
    (state: RootState) => state.products.products
  );

  return (
    <div>
      <h2>Products</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}

function CartItemRow({ item }: { item: CartItem }) {
  const dispatch = useDispatch<AppDispatch>();
  const subtotal = item.price * item.quantity;

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "8px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <div style={{ flex: 1 }}>
        <strong>{item.name}</strong>
        <br />
        <span style={{ color: "#666", fontSize: "14px" }}>
          ${item.price.toFixed(2)} x {item.quantity} = $
          {subtotal.toFixed(2)}
        </span>
      </div>
      <div style={{ display: "flex", gap: "4px", alignItems: "center" }}>
        <button
          onClick={() =>
            dispatch(
              updateQuantity({
                productId: item.productId,
                quantity: item.quantity - 1,
              })
            )
          }
          style={{ width: "28px", height: "28px" }}
        >
          -
        </button>
        <span style={{ minWidth: "24px", textAlign: "center" }}>
          {item.quantity}
        </span>
        <button
          onClick={() =>
            dispatch(
              updateQuantity({
                productId: item.productId,
                quantity: item.quantity + 1,
              })
            )
          }
          style={{ width: "28px", height: "28px" }}
        >
          +
        </button>
        <button
          onClick={() => dispatch(removeFromCart(item.productId))}
          style={{
            marginLeft: "8px",
            padding: "4px 10px",
            background: "#e74c3c",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Remove
        </button>
      </div>
    </div>
  );
}

function CartSummary() {
  const totalItems = useSelector(selectTotalItems);
  const totalPrice = useSelector(selectTotalPrice);
  const uniqueProducts = useSelector(selectCartItemCount);
  const dispatch = useDispatch<AppDispatch>();

  return (
    <div
      style={{
        marginTop: "16px",
        padding: "12px",
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
      }}
    >
      <h3 style={{ marginTop: 0 }}>Cart Summary</h3>
      <p>Unique products: {uniqueProducts}</p>
      <p>Total items: {totalItems}</p>
      <p style={{ fontWeight: "bold", fontSize: "18px" }}>
        Total: ${totalPrice.toFixed(2)}
      </p>
      <button
        onClick={() => dispatch(clearCart())}
        style={{
          padding: "8px 20px",
          background: "#e67e22",
          color: "#fff",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer",
        }}
      >
        Clear Cart
      </button>
    </div>
  );
}

function CartView() {
  const items = useSelector(selectCartItems);

  return (
    <div>
      <h2>Shopping Cart</h2>
      {items.length === 0 ? (
        <p style={{ color: "#999" }}>Your cart is empty.</p>
      ) : (
        <>
          {items.map((item) => (
            <CartItemRow key={item.productId} item={item} />
          ))}
          <CartSummary />
        </>
      )}
    </div>
  );
}

// --- App ---

export function App() {
  return (
    <Provider store={store}>
      <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
        <h1>Exercise: Redux Toolkit (Shopping Cart)</h1>
        <div style={{ display: "flex", gap: "32px" }}>
          <div style={{ flex: 1 }}>
            <ProductList />
          </div>
          <div style={{ flex: 1 }}>
            <CartView />
          </div>
        </div>
      </div>
    </Provider>
  );
}
