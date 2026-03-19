import React, { useState, useMemo, useCallback } from "react";

// =============================================================
// SOLUTION 3: Search & Filter with useMemo + useCallback
// =============================================================

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

// TODO 4 ✅ — HighlightMatch component
function HighlightMatch({ text, query }: { text: string; query: string }) {
  if (!query.trim()) return <span>{text}</span>;

  const index = text.toLowerCase().indexOf(query.toLowerCase());
  if (index === -1) return <span>{text}</span>;

  const before = text.slice(0, index);
  const match = text.slice(index, index + query.length);
  const after = text.slice(index + query.length);

  return (
    <span>
      {before}
      <mark style={{ background: "#fef08a", padding: 0 }}>{match}</mark>
      {after}
    </span>
  );
}

export function App() {
  // TODO 1 ✅ — state
  const [searchQuery, setSearchQuery] = useState("");
  const [sortAsc, setSortAsc] = useState(true);

  // TODO 2 ✅ — useMemo: expensive filter + sort, only recomputes when deps change
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    const filtered = PRODUCTS.filter((p) =>
      p.name.toLowerCase().includes(q)
    );
    return filtered.sort((a, b) =>
      sortAsc
        ? a.name.localeCompare(b.name)
        : b.name.localeCompare(a.name)
    );
  }, [searchQuery, sortAsc]);

  // TODO 3 ✅ — useCallback: stable reference for the sort toggle
  const toggleSort = useCallback(() => {
    setSortAsc((prev) => !prev);
  }, []);

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Product Search</h1>

      {/* --- CONTROLS --- */}
      <div style={styles.controls}>
        <input
          style={styles.searchInput}
          type="text"
          placeholder="Search products..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button style={styles.sortBtn} onClick={toggleSort}>
          Sort: {sortAsc ? "A→Z" : "Z→A"}
        </button>
      </div>

      {/* --- RESULT COUNT --- */}
      <p style={styles.count}>
        <strong>{filteredProducts.length}</strong> result
        {filteredProducts.length !== 1 ? "s" : ""} found
      </p>

      {/* --- PRODUCT LIST --- */}
      <ul style={styles.list}>
        {filteredProducts.length === 0 && (
          <p style={{ color: "#9ca3af", textAlign: "center", padding: 20 }}>
            No products match "{searchQuery}"
          </p>
        )}
        {filteredProducts.map((product) => (
          <li key={product.id} style={styles.listItem}>
            <span style={styles.productName}>
              <HighlightMatch text={product.name} query={searchQuery} />
            </span>
            <span style={styles.price}>
              ${product.price.toLocaleString()}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// --- KEY CONCEPTS ---
// 1. useMemo(() => compute(), [deps])
//    → Only re-runs compute() when deps change
//    → Great for filtering/sorting large lists
//    → Without it, the filter would run on EVERY render (even unrelated ones)
//
// 2. useCallback(() => fn(), [deps])
//    → Returns the same function reference between renders
//    → Without it, a new function object is created each render
//    → Most important when the callback is passed as a prop to a memoized child
//
// 3. When to use useMemo vs useCallback:
//    - useMemo: memoize a VALUE (result of computation)
//    - useCallback: memoize a FUNCTION (the function itself)
//    - useMemo(() => fn, []) === useCallback(fn, [])

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
