import React, { useState, useMemo, useCallback, memo, useRef } from "react";

// ============================================================
// Solution: Performance Optimization
// ============================================================
// Demonstrates React.memo, useMemo, and useCallback to prevent
// unnecessary re-renders in a large list. Includes render count
// tracking to visualize the performance difference.
// ============================================================

interface Item {
  id: number;
  name: string;
  category: string;
  value: number;
}

const CATEGORIES = ["Electronics", "Books", "Clothing", "Food", "Sports"];

function generateItems(count: number): Item[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    category: CATEGORIES[i % CATEGORIES.length],
    value: Math.floor(Math.random() * 1000),
  }));
}

const ALL_ITEMS = generateItems(1000);

// 1. Custom hook to track render count
function useRenderCount(): number {
  const count = useRef(0);
  count.current += 1;
  return count.current;
}

// 2. Render counter badge
function RenderCounter({ label, count }: { label: string; count: number }) {
  const color = count < 5 ? "#16a34a" : count < 20 ? "#ca8a04" : "#dc2626";
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: "12px",
        fontSize: "12px",
        backgroundColor: color,
        color: "white",
        fontWeight: "bold",
      }}
    >
      {label}: {count} renders
    </span>
  );
}

// 3. ListItem WITHOUT memo (re-renders every time parent re-renders)
function ListItemSlow({ item, onSelect }: { item: Item; onSelect: (id: number) => void }) {
  const renderCount = useRenderCount();
  return (
    <div
      onClick={() => onSelect(item.id)}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 12px",
        borderBottom: "1px solid #f0f0f0",
        cursor: "pointer",
        fontSize: "13px",
      }}
    >
      <span style={{ fontWeight: 500 }}>{item.name}</span>
      <span style={{ color: "#666" }}>{item.category}</span>
      <span style={{ color: "#3b82f6" }}>${item.value}</span>
      <RenderCounter label="Renders" count={renderCount} />
    </div>
  );
}

// 4. ListItem WITH React.memo (skips re-render when props unchanged)
const ListItemFast = memo(function ListItemFast({
  item,
  onSelect,
}: {
  item: Item;
  onSelect: (id: number) => void;
}) {
  const renderCount = useRenderCount();
  return (
    <div
      onClick={() => onSelect(item.id)}
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "6px 12px",
        borderBottom: "1px solid #f0f0f0",
        cursor: "pointer",
        fontSize: "13px",
      }}
    >
      <span style={{ fontWeight: 500 }}>{item.name}</span>
      <span style={{ color: "#666" }}>{item.category}</span>
      <span style={{ color: "#3b82f6" }}>${item.value}</span>
      <RenderCounter label="Renders" count={renderCount} />
    </div>
  );
});

// 5. Memoized SearchBar
const SearchBar = memo(function SearchBar({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const renderCount = useRenderCount();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search items..."
        style={{
          padding: "8px 12px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          fontSize: "14px",
          width: "200px",
        }}
      />
      <RenderCounter label="SearchBar" count={renderCount} />
    </div>
  );
});

// 6. Category filter
const CategoryFilter = memo(function CategoryFilter({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (category: string) => void;
}) {
  const renderCount = useRenderCount();
  const allCategories = ["All", ...CATEGORIES];
  return (
    <div style={{ display: "flex", gap: "6px", alignItems: "center", flexWrap: "wrap" }}>
      {allCategories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelect(cat)}
          style={{
            padding: "4px 12px",
            border: "1px solid #ccc",
            borderRadius: "16px",
            backgroundColor: selected === cat ? "#3b82f6" : "white",
            color: selected === cat ? "white" : "#333",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          {cat}
        </button>
      ))}
      <RenderCounter label="Filter" count={renderCount} />
    </div>
  );
});

// 7. Sort toggle
const SortToggle = memo(function SortToggle({
  sortAsc,
  onToggle,
}: {
  sortAsc: boolean;
  onToggle: () => void;
}) {
  const renderCount = useRenderCount();
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
      <button
        onClick={onToggle}
        style={{
          padding: "6px 16px",
          border: "1px solid #ccc",
          borderRadius: "6px",
          backgroundColor: "white",
          cursor: "pointer",
          fontSize: "13px",
        }}
      >
        Sort by value: {sortAsc ? "Ascending" : "Descending"}
      </button>
      <RenderCounter label="Sort" count={renderCount} />
    </div>
  );
});

// 8. Unoptimized list: no memo, no useMemo, no useCallback
function UnoptimizedList({
  searchQuery,
  category,
  sortAsc,
}: {
  searchQuery: string;
  category: string;
  sortAsc: boolean;
}) {
  const renderCount = useRenderCount();

  // Filter and sort on every render (no memoization)
  const filtered = ALL_ITEMS.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = category === "All" || item.category === category;
    return matchesSearch && matchesCategory;
  }).sort((a, b) => (sortAsc ? a.value - b.value : b.value - a.value));

  const displayed = filtered.slice(0, 20);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <strong>Unoptimized ({filtered.length} items, showing 20)</strong>
        <RenderCounter label="List" count={renderCount} />
      </div>
      <div style={{ border: "1px solid #e0e0e0", borderRadius: "8px", overflow: "hidden" }}>
        {displayed.map((item) => (
          <ListItemSlow
            key={item.id}
            item={item}
            // Inline arrow function: creates NEW function reference every render
            // This defeats React.memo even if we used it
            onSelect={(id) => console.log("Selected:", id)}
          />
        ))}
      </div>
    </div>
  );
}

// 9. Optimized list: memo + useMemo + useCallback
function OptimizedList({
  searchQuery,
  category,
  sortAsc,
}: {
  searchQuery: string;
  category: string;
  sortAsc: boolean;
}) {
  const renderCount = useRenderCount();

  // useMemo: only recomputes when searchQuery, category, or sortAsc changes
  const filtered = useMemo(() => {
    return ALL_ITEMS.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = category === "All" || item.category === category;
      return matchesSearch && matchesCategory;
    }).sort((a, b) => (sortAsc ? a.value - b.value : b.value - a.value));
  }, [searchQuery, category, sortAsc]);

  // useCallback: stable function reference across renders
  const handleSelect = useCallback((id: number) => {
    console.log("Selected:", id);
  }, []);

  const displayed = filtered.slice(0, 20);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
        <strong>Optimized ({filtered.length} items, showing 20)</strong>
        <RenderCounter label="List" count={renderCount} />
      </div>
      <div style={{ border: "1px solid #e0e0e0", borderRadius: "8px", overflow: "hidden" }}>
        {displayed.map((item) => (
          <ListItemFast
            key={item.id}
            item={item}
            // Stable function reference from useCallback
            // Combined with React.memo on ListItemFast, items skip re-renders
            onSelect={handleSelect}
          />
        ))}
      </div>
    </div>
  );
}

// 10. App component
export function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [sortAsc, setSortAsc] = useState(true);
  const [mode, setMode] = useState<"unoptimized" | "optimized">("optimized");
  const [unrelatedCounter, setUnrelatedCounter] = useState(0);
  const appRenderCount = useRenderCount();

  // Memoized callbacks to prevent child re-renders
  const handleSearchChange = useCallback((value: string) => setSearchQuery(value), []);
  const handleCategorySelect = useCallback((cat: string) => setCategory(cat), []);
  const handleSortToggle = useCallback(() => setSortAsc((prev) => !prev), []);

  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif", maxWidth: "900px" }}>
      <h1>Exercise: Performance Optimization</h1>
      <p style={{ color: "#666" }}>
        Compare unoptimized vs. optimized rendering. Click the "Unrelated counter" button
        to trigger parent re-renders and watch how render counts differ.
      </p>

      <div
        style={{
          display: "flex",
          gap: "12px",
          alignItems: "center",
          marginBottom: "16px",
          padding: "12px",
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
        }}
      >
        <RenderCounter label="App" count={appRenderCount} />
        <button
          onClick={() => setUnrelatedCounter((c) => c + 1)}
          style={{
            padding: "6px 16px",
            backgroundColor: "#8b5cf6",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            fontSize: "13px",
          }}
        >
          Unrelated counter: {unrelatedCounter} (click to force re-render)
        </button>
        <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
          <button
            onClick={() => setMode("unoptimized")}
            style={{
              padding: "6px 16px",
              backgroundColor: mode === "unoptimized" ? "#ef4444" : "white",
              color: mode === "unoptimized" ? "white" : "#333",
              border: "1px solid #ccc",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Unoptimized
          </button>
          <button
            onClick={() => setMode("optimized")}
            style={{
              padding: "6px 16px",
              backgroundColor: mode === "optimized" ? "#16a34a" : "white",
              color: mode === "optimized" ? "white" : "#333",
              border: "1px solid #ccc",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
            }}
          >
            Optimized
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" }}>
        <SearchBar value={searchQuery} onChange={handleSearchChange} />
        <CategoryFilter selected={category} onSelect={handleCategorySelect} />
        <SortToggle sortAsc={sortAsc} onToggle={handleSortToggle} />
      </div>

      {mode === "unoptimized" ? (
        <UnoptimizedList searchQuery={searchQuery} category={category} sortAsc={sortAsc} />
      ) : (
        <OptimizedList searchQuery={searchQuery} category={category} sortAsc={sortAsc} />
      )}

      <div
        style={{
          marginTop: "20px",
          padding: "16px",
          backgroundColor: "#fffbeb",
          border: "1px solid #fde68a",
          borderRadius: "8px",
          fontSize: "13px",
          color: "#92400e",
        }}
      >
        <strong>What to observe:</strong>
        <ul style={{ margin: "8px 0 0 0", paddingLeft: "20px" }}>
          <li>
            Click "Unrelated counter" and watch render counts. In optimized mode,
            memoized children do not re-render.
          </li>
          <li>
            In unoptimized mode, every child re-renders on every parent state change,
            even if their props did not change.
          </li>
          <li>
            <code>React.memo</code> prevents re-renders when props are equal.
          </li>
          <li>
            <code>useCallback</code> ensures stable function references so memo can work.
          </li>
          <li>
            <code>useMemo</code> avoids re-computing the filtered list on every render.
          </li>
        </ul>
      </div>
    </div>
  );
}
