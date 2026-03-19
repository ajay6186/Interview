import React, { useState, useEffect, useCallback, useRef } from "react";

// ============================================================
// Solution: Real-World React Patterns
// ============================================================

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

function useFetch<T>(fetcher: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const fetch = useCallback(() => {
    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setError(null);

    fetcher()
      .then((result) => {
        if (!controller.signal.aborted) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) {
          setError(err.message ?? "An error occurred");
          setLoading(false);
        }
      });
  }, [fetcher]);

  useEffect(() => {
    fetch();
    return () => abortRef.current?.abort();
  }, [fetch]);

  return { data, loading, error, refetch: fetch };
}

function PostCard({ post }: { post: { id: number; title: string; likes: number } }) {
  return (
    <div style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "10px 14px", marginBottom: 8 }}>
      <strong>{post.title}</strong>
      <span style={{ float: "right", color: "#6b7280" }}>♥ {post.likes}</span>
    </div>
  );
}

function PostList() {
  const fetcher = useCallback(() => fakeFetch(FAKE_POSTS.slice(0, 10)), []);
  const { data: posts, loading, error, refetch } = useFetch(fetcher);

  if (loading) return <p>Loading...</p>;
  if (error) return (
    <div>
      <p style={{ color: "red" }}>Error: {error}</p>
      <button onClick={refetch}>Retry</button>
    </div>
  );
  if (!posts || posts.length === 0) return <p>No posts found.</p>;

  return (
    <div>
      {posts.map((p) => <PostCard key={p.id} post={p} />)}
      <button onClick={refetch} style={{ marginTop: 8 }}>Refetch</button>
    </div>
  );
}

// ==================== 2. Infinite Scroll ====================

function InfinitePostList() {
  const [posts, setPosts] = useState<typeof FAKE_POSTS>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const PAGE_SIZE = 10;

  const loadPage = useCallback(async (pageNum: number) => {
    setLoading(true);
    const newPosts = await fakeFetchPage(pageNum, PAGE_SIZE);
    setPosts((prev) => [...prev, ...newPosts]);
    if (newPosts.length < PAGE_SIZE) setHasMore(false);
    setLoading(false);
  }, []);

  // Load first page
  useEffect(() => {
    loadPage(1);
  }, [loadPage]);

  // IntersectionObserver to trigger next page
  useEffect(() => {
    if (!hasMore || loading) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((p) => {
            const next = p + 1;
            loadPage(next);
            return next;
          });
        }
      },
      { threshold: 0.1 }
    );
    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, loadPage]);

  return (
    <div style={{ maxHeight: 400, overflowY: "auto", border: "1px solid #e5e7eb", borderRadius: 6, padding: 12 }}>
      {posts.map((p) => <PostCard key={p.id} post={p} />)}
      <div ref={sentinelRef} style={{ padding: 8, textAlign: "center", color: "#9ca3af" }}>
        {loading ? "Loading more..." : hasMore ? "Scroll for more" : "All posts loaded!"}
      </div>
    </div>
  );
}

// ==================== 3. Debounced Search ====================

function useDebounce<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function SearchPosts() {
  const [input, setInput] = useState("");
  const debouncedQuery = useDebounce(input, 400);
  const isSearching = input !== debouncedQuery;

  const filtered = FAKE_POSTS.filter((p) =>
    p.title.toLowerCase().includes(debouncedQuery.toLowerCase())
  );

  return (
    <div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Search posts (debounced 400ms)..."
        style={{ padding: "8px 12px", width: "100%", boxSizing: "border-box", marginBottom: 8 }}
      />
      {isSearching && <p style={{ color: "#6b7280", fontStyle: "italic" }}>Searching...</p>}
      <p style={{ color: "#9ca3af", fontSize: 13 }}>{filtered.length} results</p>
      <div style={{ maxHeight: 200, overflowY: "auto" }}>
        {filtered.slice(0, 20).map((p) => (
          <div key={p.id} style={{ padding: "6px 0", borderBottom: "1px solid #f3f4f6" }}>
            {p.title}
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== 4. Optimistic UI ====================

type Post = { id: number; title: string; likes: number };

function OptimisticLikes() {
  const [posts, setPosts] = useState<Post[]>(FAKE_POSTS.slice(0, 5));
  const [errors, setErrors] = useState<Record<number, string>>({});

  async function handleLike(postId: number) {
    const originalLikes = posts.find((p) => p.id === postId)!.likes;

    // Optimistic update
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, likes: p.likes + 1 } : p))
    );

    // Simulate API call — fails 30% of the time
    const shouldFail = Math.random() < 0.3;
    await fakeFetch(null, 800);

    if (shouldFail) {
      // Revert
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, likes: originalLikes } : p))
      );
      setErrors((prev) => ({ ...prev, [postId]: "Failed to like. Reverted." }));
      setTimeout(() => {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[postId];
          return next;
        });
      }, 2500);
    }
  }

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id} style={{ border: "1px solid #e5e7eb", borderRadius: 6, padding: "10px 14px", marginBottom: 8 }}>
          <span>{post.title}</span>
          <div style={{ float: "right", display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => handleLike(post.id)} style={{ padding: "4px 10px" }}>
              ♥ {post.likes}
            </button>
          </div>
          {errors[post.id] && (
            <p style={{ color: "red", fontSize: 12, margin: "4px 0 0" }}>{errors[post.id]}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ==================== 5. useLocalStorage ====================

function useLocalStorage<T>(key: string, initialValue: T): [T, (val: T | ((prev: T) => T)) => void] {
  const [stored, setStored] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (val: T | ((prev: T) => T)) => {
      setStored((prev) => {
        const next = typeof val === "function" ? (val as (p: T) => T)(prev) : val;
        try {
          localStorage.setItem(key, JSON.stringify(next));
        } catch {/* ignore */}
        return next;
      });
    },
    [key]
  );

  return [stored, setValue];
}

function ThemeToggle() {
  const [theme, setTheme] = useLocalStorage<"light" | "dark">("theme", "light");

  return (
    <div
      style={{
        padding: 20,
        backgroundColor: theme === "dark" ? "#1f2937" : "#f9fafb",
        color: theme === "dark" ? "#f9fafb" : "#1f2937",
        borderRadius: 8,
        transition: "background-color 0.3s, color 0.3s",
      }}
    >
      <p>Current theme: <strong>{theme}</strong></p>
      <button
        onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
        style={{ padding: "8px 16px" }}
      >
        Switch to {theme === "light" ? "dark" : "light"} mode
      </button>
      <p style={{ fontSize: 12, opacity: 0.6 }}>
        Refresh the page — your preference is saved in localStorage!
      </p>
    </div>
  );
}

// ==================== App ====================

const sectionStyle: React.CSSProperties = {
  border: "1px solid #e5e7eb",
  borderRadius: 8,
  padding: 20,
  marginBottom: 32,
};

export function App() {
  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Solution: Real-World React Patterns</h1>

      <section style={sectionStyle}>
        <h2>1. useFetch with Abort Controller</h2>
        <PostList />
      </section>

      <section style={sectionStyle}>
        <h2>2. Infinite Scroll (IntersectionObserver)</h2>
        <InfinitePostList />
      </section>

      <section style={sectionStyle}>
        <h2>3. Debounced Search</h2>
        <SearchPosts />
      </section>

      <section style={sectionStyle}>
        <h2>4. Optimistic UI (30% failure rate)</h2>
        <p style={{ fontSize: 13, color: "#6b7280" }}>
          Click ♥ — the count updates instantly. If the fake API rejects (~30%), it reverts.
        </p>
        <OptimisticLikes />
      </section>

      <section style={sectionStyle}>
        <h2>5. useLocalStorage</h2>
        <ThemeToggle />
      </section>
    </div>
  );
}
