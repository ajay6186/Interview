import React, { useState } from "react";
import {
  configureStore,
  createSlice,
  PayloadAction,
  createSelector,
} from "@reduxjs/toolkit";
import { Provider, useSelector, useDispatch } from "react-redux";

// ============================================================
// Exercise: Redux Toolkit (Shopping Cart)
// ============================================================
// Build a shopping cart with products and cart slices. Practice
// createSlice, PayloadAction, and createSelector for memoized
// derived data (total items, total price).
//
// Instructions:
// 1. Define Product, CartItem, ProductsState, and CartState types
// 2. Create a productsSlice with a hardcoded product catalog
// 3. Create a cartSlice with addToCart, removeFromCart,
//    updateQuantity, and clearCart reducers
// 4. Build memoized selectors with createSelector
// 5. Build ProductList, CartView, and CartSummary components
// 6. Wire everything together with the store and Provider
// ============================================================

// TODO 1: Define a Product type
// - id: string
// - name: string
// - price: number
// - description: string
// - inStock: boolean

// TODO 2: Define a CartItem type
// - productId: string
// - name: string
// - price: number
// - quantity: number

// TODO 3: Define ProductsState and CartState types
// ProductsState: { products: Product[] }
// CartState: { items: CartItem[] }

// TODO 4: Create a hardcoded list of products (at least 4)
// const sampleProducts: Product[] = [ ... ];

// TODO 5: Create productsSlice
// name: "products"
// initialState: { products: sampleProducts }
// reducers:
//   toggleStock: PayloadAction<string> - toggle inStock for a product by id
//   (This slice is mostly read-only; products are pre-loaded)

// TODO 6: Create cartSlice
// name: "cart"
// initialState: { items: [] as CartItem[] }
// reducers:
//   a) addToCart: PayloadAction<{ productId: string; name: string; price: number }>
//      If item already in cart, increment quantity by 1
//      Otherwise, push a new CartItem with quantity 1
//   b) removeFromCart: PayloadAction<string> (productId)
//      Filter out the item with matching productId
//   c) updateQuantity: PayloadAction<{ productId: string; quantity: number }>
//      Find the item and set its quantity
//      If quantity <= 0, remove the item
//   d) clearCart: reset items to empty array

// TODO 7: Export action creators from both slices

// TODO 8: Configure the store with both reducers

// TODO 9: Derive RootState and AppDispatch types

// TODO 10: Create memoized selectors using createSelector
//   a) selectCartItems: (state: RootState) => state.cart.items
//   b) selectTotalItems: uses selectCartItems, sums up all quantities
//   c) selectTotalPrice: uses selectCartItems, sums up (price * quantity)
//   d) selectCartItemCount: uses selectCartItems, returns items.length (unique products)

// --- Components ---

// TODO 11: Build a ProductCard component
// - Receives a product prop
// - Shows name, description, price
// - "Add to Cart" button (disabled if out of stock)
// - Dispatches addToCart on click
function ProductCard(props: { product: any }) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "12px",
        borderRadius: "8px",
      }}
    >
      <h4>{props.product?.name ?? "Product Name"}</h4>
      <p>$?.??</p>
      <button>Add to Cart</button>
    </div>
  );
}

// TODO 12: Build a ProductList component
// - useSelector to get all products
// - Render a grid of ProductCard components
function ProductList() {
  return (
    <div>
      <h2>Products</h2>
      <p>No products loaded (implement ProductList)</p>
    </div>
  );
}

// TODO 13: Build a CartItemRow component
// - Shows item name, price, quantity, subtotal (price * quantity)
// - Buttons to increment/decrement quantity (dispatch updateQuantity)
// - Button to remove item (dispatch removeFromCart)
function CartItemRow(props: { item: any }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "8px 0",
        borderBottom: "1px solid #eee",
      }}
    >
      <span>Item Name - $0.00 x 0</span>
      <div>
        <button>-</button>
        <button>+</button>
        <button>Remove</button>
      </div>
    </div>
  );
}

// TODO 14: Build a CartSummary component
// - Use memoized selectors to get totalItems and totalPrice
// - Display total unique products, total items, total price
// - "Clear Cart" button
function CartSummary() {
  return (
    <div
      style={{
        marginTop: "16px",
        padding: "12px",
        backgroundColor: "#f9f9f9",
        borderRadius: "8px",
      }}
    >
      <h3>Cart Summary</h3>
      <p>Total items: ???</p>
      <p>Total price: $?.??</p>
      <button>Clear Cart</button>
    </div>
  );
}

// TODO 15: Build a CartView component
// - useSelector to get cart items
// - If empty, show "Your cart is empty"
// - Otherwise, render CartItemRow for each item and CartSummary
function CartView() {
  return (
    <div>
      <h2>Shopping Cart</h2>
      <p>Cart is empty (implement CartView)</p>
    </div>
  );
}

// TODO 16: Wrap App in Provider
export function App() {
  return (
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
  );
}
