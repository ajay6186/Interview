import React, { useState, useEffect, useCallback, useRef } from "react";

// ============================================================
// Exercise: Real-World React Patterns
// ============================================================
// Practice patterns you'll use in production React apps:
//   1. Data fetching with loading/error/empty states
//   2. Infinite scroll (IntersectionObserver)
//   3. Debounced search
//   4. Optimistic UI updates
//   5. Custom hook: useLocalStorage
//   6. Abort controller for cancelling fetch on unmount
//
// Instructions:
// Work through each TODO section below.
// ============================================================

// Fake API helpers (simulate network delay)
const FAKE_POSTS = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1,
  title: `Post ${i + 1}: ${["React", "TypeScript", "Node.js", "CSS", "GraphQL"][i % 5]} Tips`,
  likes: Math.floor(Math.random() * 200),
}));

function fakeFetch<T>(data: T, delay = 600): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), delay));
}

function fakeFetchPage(page: number, pageSize = 10) {
  const start = (page - 1) * pageSize;
  return fakeFetch(FAKE_POSTS.slice(start, start + pageSize));
}

// ==================== 1. useFetch ====================

// TODO 1: Build a useFetch<T> custom hook
// - Parameters: url or fetcher function (use a fetcher: () => Promise<T>)
// - Returns: { data: T | null; loading: boolean; error: string | null; refetch: () => void }
// - Fetches on mount and on refetch()
// - Uses AbortController to cancel the previous fetch if the component unmounts
//   or if refetch() is called before the previous one finishes
// - Sets loading, data, error appropriately
//
// function useFetch<T>(fetcher: () => Promise<T>) { ... }

// TODO 2: Build a PostList component using useFetch
// - Fetch FAKE_POSTS (first 10) using useFetch and fakeFetch
// - Show loading state: "Loading..."
// - Show error state with a Retry button (call refetch)
// - Show empty state: "No posts found."
// - Show the list of posts as cards (title + likes count)
//
// function PostList() { ... }

// ==================== 2. Infinite Scroll ====================

// TODO 3: Build an InfinitePostList component
// - Maintains a `page` state (starts at 1) and `posts` accumulator array
// - Has a `hasMore` flag (false when fewer than pageSize results returned)
// - Uses IntersectionObserver on a sentinel div at the bottom of the list
// - When the sentinel enters the viewport, load the next page
// - Append new posts to the existing list
// - Show a "Loading more..." indicator when fetching
// - Show "All posts loaded!" when hasMore is false
//
// function InfinitePostList() { ... }

// ==================== 3. Debounced Search ====================

// TODO 4: Build a useDebounce<T> hook
// - Takes a value and a delay (ms)
// - Returns the debounced value — it only updates after the delay has passed
//   since the last change
//
// function useDebounce<T>(value: T, delay: number): T { ... }

// TODO 5: Build a SearchPosts component using useDebounce
// - Has an `input` state (typed immediately) and uses useDebounce(input, 400)
//   to get `debouncedQuery`
// - Filters FAKE_POSTS by title (case-insensitive) based on debouncedQuery
// - Shows a "Searching..." indicator when input !== debouncedQuery
// - Shows the filtered results
//
// function SearchPosts() { ... }

// ==================== 4. Optimistic UI ====================

// TODO 6: Build an OptimisticLikes component
// - Renders a list of posts with a "♥ Like" button on each
// - On click, IMMEDIATELY increment the likes count in UI (optimistic update)
// - Then call a fake API (fakeFetch with 800ms delay)
// - If the API call "fails" (simulate by randomly rejecting 30% of the time),
//   REVERT the likes count back to the original
// - Show a brief "Failed to like" error message when revert happens
//
// function OptimisticLikes() { ... }

// ==================== 5. useLocalStorage ====================

// TODO 7: Build a useLocalStorage<T> hook
// - Similar API to useState: [value, setValue]
// - Initial value is read from localStorage (parse JSON), falls back to initialValue
// - Whenever value changes, persist to localStorage (JSON.stringify)
// - Handle JSON parse errors gracefully
//
// function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] { ... }

// TODO 8: Build a ThemeToggle component using useLocalStorage
// - Persists "light" | "dark" theme preference in localStorage under key "theme"
// - Renders a button to toggle between the two
// - Applies a background color based on the theme
// - Reload the page and verify the theme persists!
//
// function ThemeToggle() { ... }

export function App() {
  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Exercise: Real-World React Patterns</h1>
      <p style={{ color: "gray" }}>Complete the TODOs to practice production-ready patterns.</p>

      {/* TODO 9: Render all demos in labeled sections */}
    </div>
  );
}
