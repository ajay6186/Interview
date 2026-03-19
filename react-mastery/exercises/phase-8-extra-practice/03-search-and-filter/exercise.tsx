import React, { useState, useMemo, useCallback } from "react";

// =============================================================
// EXERCISE 3: Search & Filter with useMemo + useCallback
// =============================================================
// WHAT YOU WILL PRACTICE:
//   - useMemo: avoid re-computing an expensive filtered list on every render
//   - useCallback: stable function references to prevent unnecessary re-renders
//   - Controlled search input
//   - Sorting a list
//
// GOAL: Build a product search page that:
//   1. Shows a list of products
//   2. Has a search input — filters products by name in real-time
//   3. Has a "Sort" button — toggles between A→Z and Z→A
//   4. Shows how many results are found
//   5. Highlights the matched part of the product name in the results
//
// PERFORMANCE RULE:
//   - The filtered + sorted list must be computed with useMemo
//     so it only recalculates when search or sort order changes
//   - The sort toggle handler must be wrapped in useCallback
// =============================================================

// --- Data (do not change) ---
const PRODUCTS = [
  { id: 1, name: "Apple MacBook Pro", price: 2499 },
  { id: 2, name: "Samsung Galaxy S24", price: 999 },
  { id: 3, name: "Sony WH-1000XM5 Headphones", price: 349 },
  { id: 4, name: "Apple iPhone 15 Pro", price: 1199 },
  { id: 5, name: "Dell XPS 15 Laptop", price: 1899 },
  { id: 6, name: "Apple AirPods Pro", price: 249 },
  { id: 7, name: "Samsung 4K Monitor", price: 699 },
  { id: 8, name: "Logitech MX Master 3 Mouse", price: 99 },
  { id: 9, name: "Mechanical Keyboard - Keychron K2", price: 89 },
  { id: 10, name: "iPad Pro 12.9 inch", price: 1099 },
];

// =============================================================
// TODO 1: Set up state
//   - searchQuery: string
//   - sortAsc: boolean (true = A→Z, false = Z→A)
// =============================================================

// =============================================================
// TODO 2: useMemo — compute filteredProducts
//   - Filter PRODUCTS where name.toLowerCase() includes searchQuery.toLowerCase()
//   - Then sort by name ascending or descending based on sortAsc
//   - Dependency array: [searchQuery, sortAsc]
// =============================================================

// =============================================================
// TODO 3: useCallback — toggleSort
//   - Flip sortAsc boolean
//   - Dependency array: [] (setSortAsc is stable, no deps needed)
// =============================================================

// =============================================================
// TODO 4: HighlightMatch component
//   - Props: { text: string; query: string }
//   - If query is empty, return the text as-is
//   - Find the matching part (case-insensitive) and wrap it in a <mark> tag
//   - Example: text="Apple MacBook", query="mac" →
//     <span>Apple <mark>Mac</mark>Book</span>
// =============================================================

export function App() {
  // TODO 1: state here

  // TODO 2: useMemo here

  // TODO 3: useCallback here

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Product Search</h1>

      {/* --- CONTROLS --- */}
      <div style={styles.controls}>
        <input
          style={styles.searchInput}
          type="text"
          placeholder="Search products..."
          // TODO: bind value and onChange
        />
        {/* TODO: call toggleSort on click, show "Sort: A→Z" or "Sort: Z→A" */}
        <button style={styles.sortBtn}>
          Sort: {/* sortAsc ? "A→Z" : "Z→A" */}
        </button>
      </div>

      {/* --- RESULT COUNT --- */}
      <p style={styles.count}>
        {/* TODO: show filteredProducts.length results */}
        results found
      </p>

      {/* --- PRODUCT LIST --- */}
      <ul style={styles.list}>
        {/* TODO: map over filteredProducts
              Each item: show HighlightMatch for name, and price formatted as "$X,XXX"
        */}
      </ul>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: 520, margin: "40px auto", fontFamily: "sans-serif", padding: "0 16px" },
  title: { textAlign: "center", fontSize: 26, marginBottom: 20 },
  controls: { display: "flex", gap: 10, marginBottom: 12 },
  searchInput: { flex: 1, padding: "9px 14px", fontSize: 15, borderRadius: 8, border: "1px solid #d1d5db" },
  sortBtn: { padding: "9px 16px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: 8, cursor: "pointer", fontSize: 14, whiteSpace: "nowrap" },
  count: { color: "#6b7280", fontSize: 13, marginBottom: 8 },
  list: { listStyle: "none", padding: 0, margin: 0 },
  listItem: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 0", borderBottom: "1px solid #f0f0f0" },
  productName: { fontSize: 15, color: "#111827" },
  price: { fontSize: 15, fontWeight: "bold", color: "#4f46e5" },
};
