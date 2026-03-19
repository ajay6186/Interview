import React, { useState, useMemo, useCallback, memo, useRef, useEffect } from "react";

// ============================================================
// Exercise: Performance Optimization
// ============================================================
// Learn to identify and fix performance issues in React apps.
// Use React.memo, useMemo, and useCallback to prevent
// unnecessary re-renders. Build a list of 1000 items and
// measure render counts to visualize the improvements.
//
// Instructions:
// 1. Create a large list of items (1000 items)
// 2. Track render counts for parent and child components
// 3. Use React.memo to prevent unnecessary child re-renders
// 4. Use useMemo to memoize filtered/sorted results
// 5. Use useCallback to memoize event handlers
// 6. Build a search filter that only re-renders matching items
// 7. Display render counts to visualize the optimization
// ============================================================

// Item type
interface Item {
  id: number;
  name: string;
  category: string;
  value: number;
}

// Generate 1000 items for the list
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

// TODO 1: Create a useRenderCount custom hook
// - Use useRef to track how many times a component has rendered
// - Increment the ref on every render
// - Return the current render count
// Hint: useRef persists across renders without causing re-renders
function useRenderCount(): number {
  return 0;
}

// TODO 2: Create a RenderCounter display component
// - Accept label (string) and count (number) props
// - Display the label and count in a small badge
// - Use a color scale: green (<5), yellow (5-20), red (>20)
function RenderCounter({ label, count }: { label: string; count: number }) {
  return <span>{label}: {count}</span>;
}

// TODO 3: Create a ListItem component WITHOUT React.memo (the "slow" version)
// - Accept props: item (Item) and onSelect ((id: number) => void)
// - Display item name, category, and value
// - Track renders with useRenderCount
// - Call onSelect when clicked
function ListItemSlow({ item, onSelect }: { item: Item; onSelect: (id: number) => void }) {
  return (
    <div>
      {item.name} - {item.category} - ${item.value}
    </div>
  );
}

// TODO 4: Create the SAME ListItem component WITH React.memo (the "fast" version)
// - Wrap it with React.memo to skip re-renders when props are unchanged
// - Same interface as ListItemSlow
function ListItemFast({ item, onSelect }: { item: Item; onSelect: (id: number) => void }) {
  return (
    <div>
      {item.name} - {item.category} - ${item.value}
    </div>
  );
}

// TODO 5: Create a SearchBar component
// - Accept props: value (string), onChange ((value: string) => void)
// - Render a text input for searching
// - Use React.memo to prevent re-renders when other state changes
function SearchBar({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} />;
}

// TODO 6: Create a CategoryFilter component
// - Accept props: selected (string), onSelect ((category: string) => void)
// - Render buttons for "All" + each category
// - Highlight the currently selected category
function CategoryFilter({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (category: string) => void;
}) {
  return (
    <div>
      <button>All</button>
      {CATEGORIES.map((cat) => (
        <button key={cat}>{cat}</button>
      ))}
    </div>
  );
}

// TODO 7: Create a SortToggle component
// - Accept props: sortAsc (boolean), onToggle (() => void)
// - Render a button that toggles between ascending/descending sort
function SortToggle({ sortAsc, onToggle }: { sortAsc: boolean; onToggle: () => void }) {
  return <button>Sort: {sortAsc ? "Ascending" : "Descending"}</button>;
}

// TODO 8: Create an UnoptimizedList component
// - Render ALL_ITEMS using ListItemSlow
// - Accept searchQuery, category, sortAsc as props
// - Filter and sort the items on EVERY render (no memoization)
// - Pass an inline arrow function as onSelect (creates new function every render)
// - Track render count
function UnoptimizedList({
  searchQuery,
  category,
  sortAsc,
}: {
  searchQuery: string;
  category: string;
  sortAsc: boolean;
}) {
  return <div>Unoptimized list placeholder</div>;
}

// TODO 9: Create an OptimizedList component
// - Render items using ListItemFast (React.memo version)
// - Use useMemo to memoize the filtered + sorted item list
// - Use useCallback to memoize the onSelect handler
// - Track render count
// - Only the items whose props actually change should re-render
function OptimizedList({
  searchQuery,
  category,
  sortAsc,
}: {
  searchQuery: string;
  category: string;
  sortAsc: boolean;
}) {
  return <div>Optimized list placeholder</div>;
}

// TODO 10: Wire everything together in App
// - State: searchQuery, category filter, sort direction, selected item, and a "mode" toggle
// - Mode toggle switches between "Unoptimized" and "Optimized" list
// - Render SearchBar, CategoryFilter, SortToggle
// - Add an unrelated counter button that forces re-renders of the parent
//   (to demonstrate how child re-renders differ between modes)
// - Show render counts for the parent App component
export function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Exercise: Performance Optimization</h1>
      <p>
        Implement memo, useMemo, and useCallback to optimize a large list.
      </p>
    </div>
  );
}
