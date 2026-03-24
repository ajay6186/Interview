// ============================================================================
// Examples 3.5 — Fetch & APIs  (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// Shared mock fetch (used throughout all examples)
// ---------------------------------------------------------------------------

function mockFetch(url, options = {}) {
  const db = {
    "/users": [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }, { id: 3, name: "Charlie" }],
    "/users/1": { id: 1, name: "Alice", email: "alice@example.com", role: "admin" },
    "/users/2": { id: 2, name: "Bob", email: "bob@example.com", role: "user" },
    "/users/3": { id: 3, name: "Charlie", email: "charlie@example.com", role: "user" },
    "/posts": [
      { id: 1, title: "Hello World", userId: 1 },
      { id: 2, title: "Second Post", userId: 1 },
      { id: 3, title: "Third Post", userId: 2 },
    ],
    "/posts/1": { id: 1, title: "Hello World", body: "Content here", userId: 1 },
    "/comments": [
      { id: 1, postId: 1, text: "Great!" },
      { id: 2, postId: 1, text: "Nice!" },
    ],
    "/config": { version: "1.0", features: ["dark-mode", "notifications"] },
  };
  return new Promise((resolve, reject) => {
    const delay = options._delay || 0;
    setTimeout(() => {
      if (options._fail || url === "/error") {
        return reject(new Error("Network error"));
      }
      if (options._slow) {
        // For timeout testing — never resolves quickly
        return setTimeout(() => resolve({ ok: true, status: 200, json: () => Promise.resolve({}) }), 5000);
      }
      if (options.method === "POST" || options.method === "PUT" || options.method === "PATCH") {
        const body = options.body ? JSON.parse(options.body) : {};
        return resolve({
          ok: true,
          status: options.method === "POST" ? 201 : 200,
          json: () => Promise.resolve({ ...body, id: 99, createdAt: "2026-01-01" }),
        });
      }
      if (options.method === "DELETE") {
        return resolve({ ok: true, status: 204, json: () => Promise.resolve({}) });
      }
      const data = db[url];
      if (!data) {
        return resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: "Not found", url }),
        });
      }
      resolve({ ok: true, status: 200, json: () => Promise.resolve(data) });
    }, delay);
  });
}

// ─── BASIC (1–13) ────────────────────────────────────────────────────────────

/** fetch GET — basic */
async function ex01() {
  const res = await mockFetch("/users");
  const users = await res.json();
  console.log("Ex01 — users count:", users.length);
}

/** Check response.ok */
async function ex02() {
  const res = await mockFetch("/users/1");
  console.log("Ex02 — ok:", res.ok, "status:", res.status);
}

/** response.json() */
async function ex03() {
  const res = await mockFetch("/users/1");
  const user = await res.json();
  console.log("Ex03 — user:", user.name, user.email);
}

/** response.status handling */
async function ex04() {
  const res = await mockFetch("/nonexistent");
  console.log("Ex04 — 404 status:", res.status, "ok:", res.ok);
}

/** POST with JSON body */
async function ex05() {
  const res = await mockFetch("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Dave", email: "dave@example.com" }),
  });
  const created = await res.json();
  console.log("Ex05 — created:", created.name, "id:", created.id);
}

/** Headers object */
async function ex06() {
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
  };
  const res = await mockFetch("/users", { headers });
  console.log("Ex06 — headers set, ok:", res.ok);
}

/** Content-Type header for JSON */
async function ex07() {
  const body = { title: "New Post", userId: 1 };
  const res = await mockFetch("/posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await res.json();
  console.log("Ex07 — POST result:", result.title);
}

/** Authorization header pattern */
async function ex08() {
  const token = "Bearer eyJhbGc...";
  const res = await mockFetch("/users", {
    headers: { Authorization: token },
  });
  console.log("Ex08 — auth request ok:", res.ok);
}

/** Fetch error handling — network error */
async function ex09() {
  try {
    await mockFetch("/error");
  } catch (e) {
    console.log("Ex09 — network error caught:", e.message);
  }
}

/** AbortController concept — cancel a request */
async function ex10() {
  // AbortController is a browser/Node API; simulate concept here
  function fetchWithAbort(url, signal) {
    return new Promise((resolve, reject) => {
      if (signal && signal.aborted) return reject(new Error("AbortError"));
      const timer = setTimeout(() => resolve({ ok: true, status: 200, json: () => Promise.resolve({ url }) }), 0);
      if (signal) signal.addEventListener("abort", () => { clearTimeout(timer); reject(new Error("AbortError")); });
    });
  }
  const controller = { aborted: false, listeners: [], abort() { this.aborted = true; this.listeners.forEach(fn => fn()); } };
  controller.signal = { get aborted() { return controller.aborted; }, addEventListener(_, fn) { controller.listeners.push(fn); } };
  const res = await fetchWithAbort("/users", controller.signal);
  console.log("Ex10 — fetch with abort (not aborted):", res.ok);
}

/** PUT request */
async function ex11() {
  const res = await mockFetch("/users/1", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name: "Alice Updated" }),
  });
  const result = await res.json();
  console.log("Ex11 — PUT result:", result.name);
}

/** DELETE request */
async function ex12() {
  const res = await mockFetch("/users/1", { method: "DELETE" });
  console.log("Ex12 — DELETE status:", res.status, "ok:", res.ok);
}

/** PATCH request */
async function ex13() {
  const res = await mockFetch("/users/1", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: "newemail@example.com" }),
  });
  const result = await res.json();
  console.log("Ex13 — PATCH result:", result.email);
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────────────────────

/** Timeout with manual race */
async function ex14() {
  function fetchWithTimeout(url, ms) {
    const timer = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms));
    return Promise.race([mockFetch(url), timer]);
  }
  const res = await fetchWithTimeout("/users", 100);
  console.log("Ex14 — fetch with timeout ok:", res.ok);
}

/** Retry on error */
async function ex15() {
  async function retryFetch(url, retries = 3) {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await mockFetch(url);
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res;
      } catch (e) {
        if (i === retries - 1) throw e;
        await new Promise(r => setTimeout(r, 0));
      }
    }
  }
  const res = await retryFetch("/users");
  const users = await res.json();
  console.log("Ex15 — retry fetch users:", users.length);
}

/** Parallel fetch with Promise.all */
async function ex16() {
  const [usersRes, postsRes] = await Promise.all([
    mockFetch("/users"),
    mockFetch("/posts"),
  ]);
  const [users, posts] = await Promise.all([usersRes.json(), postsRes.json()]);
  console.log("Ex16 — parallel: users:", users.length, "posts:", posts.length);
}

/** Sequential fetch — dependent requests */
async function ex17() {
  const userRes = await mockFetch("/users/1");
  const user = await userRes.json();
  // Use user data for next request
  const postsRes = await mockFetch("/posts");
  const posts = await postsRes.json();
  const userPosts = posts.filter(p => p.userId === user.id);
  console.log("Ex17 — sequential: user:", user.name, "posts:", userPosts.length);
}

/** Cache fetch results */
async function ex18() {
  const cache = new Map();
  async function cachedFetch(url) {
    if (!cache.has(url)) {
      const res = await mockFetch(url);
      cache.set(url, await res.json());
    }
    return cache.get(url);
  }
  let calls = 0;
  const orig = mockFetch;
  await cachedFetch("/users");
  await cachedFetch("/users"); // cached
  await cachedFetch("/posts");
  console.log("Ex18 — cache size:", cache.size, "(expect 2)");
}

/** Fetch interceptor pattern */
async function ex19() {
  function createInterceptedFetch(fetch, interceptors) {
    return async (url, options = {}) => {
      let req = { url, options };
      for (const { request } of interceptors.filter(i => i.request)) {
        req = await i.request(req);
      }
      let res = await fetch(req.url, req.options);
      for (const { response } of interceptors.filter(i => i.response)) {
        res = await i.response(res, req);
      }
      return res;
    };
  }
  const log = [];
  const interceptedFetch = createInterceptedFetch(mockFetch, [
    {
      request: async (req) => { log.push("req:" + req.url); return req; },
      response: async (res) => { log.push("res:" + res.status); return res; },
    },
  ]);
  await interceptedFetch("/users");
  console.log("Ex19 — interceptor log:", log.join(", "));
}

/** Response transform */
async function ex20() {
  async function fetchTransformed(url, transform) {
    const res = await mockFetch(url);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    return transform(data);
  }
  const names = await fetchTransformed("/users", users => users.map(u => u.name));
  console.log("Ex20 — transformed:", names.join(", "));
}

/** Request deduplication */
async function ex21() {
  const inflight = new Map();
  async function dedupedFetch(url) {
    if (!inflight.has(url)) {
      inflight.set(url, mockFetch(url).finally(() => inflight.delete(url)));
    }
    return inflight.get(url);
  }
  const [r1, r2, r3] = await Promise.all([
    dedupedFetch("/users"),
    dedupedFetch("/users"),
    dedupedFetch("/users"),
  ]);
  const [d1, d2, d3] = await Promise.all([r1.json(), r2.json(), r3.json()]);
  console.log("Ex21 — deduped (all same length):", d1.length === d2.length && d2.length === d3.length);
}

/** Optimistic update concept */
async function ex22() {
  let localUsers = [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }];
  async function optimisticUpdate(id, update) {
    // Apply locally first
    localUsers = localUsers.map(u => u.id === id ? { ...u, ...update } : u);
    try {
      const res = await mockFetch(`/users/${id}`, {
        method: "PATCH",
        body: JSON.stringify(update),
      });
      if (!res.ok) throw new Error("Failed");
      return localUsers;
    } catch (e) {
      // Rollback on failure
      localUsers = localUsers.map(u => u.id === id ? { ...u, ...Object.fromEntries(Object.keys(update).map(k => [k, undefined])) } : u);
      throw e;
    }
  }
  const updated = await optimisticUpdate(1, { name: "Alice Smith" });
  console.log("Ex22 — optimistic update:", updated.find(u => u.id === 1).name);
}

/** Error type differentiation */
async function ex23() {
  async function typedFetch(url) {
    let res;
    try {
      res = await mockFetch(url);
    } catch (e) {
      throw Object.assign(new Error("NetworkError: " + e.message), { type: "network" });
    }
    if (res.status === 404) throw Object.assign(new Error("Not found: " + url), { type: "not_found" });
    if (res.status === 401) throw Object.assign(new Error("Unauthorized"), { type: "auth" });
    if (!res.ok) throw Object.assign(new Error("HTTP " + res.status), { type: "http" });
    return res.json();
  }
  const users = await typedFetch("/users");
  console.log("Ex23 — typed fetch:", users.length, "users");
  const err = await typedFetch("/missing").catch(e => e);
  console.log("Ex23 — error type:", err.type);
}

/** Fetch all settled — no failure throws */
async function ex24() {
  async function fetchAllSettled(urls) {
    const responses = await Promise.allSettled(
      urls.map(url => mockFetch(url).then(r => r.json()))
    );
    return responses.map((r, i) => ({
      url: urls[i],
      ok: r.status === "fulfilled",
      data: r.status === "fulfilled" ? r.value : null,
      error: r.status === "rejected" ? r.reason.message : null,
    }));
  }
  const results = await fetchAllSettled(["/users", "/error", "/posts"]);
  results.forEach(r => console.log(`Ex24 — ${r.url}: ok=${r.ok}`));
}

/** Paginated fetch */
async function ex25() {
  // Simulate paginated endpoint
  function pagedMockFetch(url) {
    const allUsers = [
      { id: 1, name: "Alice" }, { id: 2, name: "Bob" },
      { id: 3, name: "Charlie" }, { id: 4, name: "Dave" },
    ];
    const match = url.match(/\?page=(\d+)&limit=(\d+)/);
    if (match) {
      const page = parseInt(match[1]);
      const limit = parseInt(match[2]);
      const start = (page - 1) * limit;
      const items = allUsers.slice(start, start + limit);
      const hasMore = start + limit < allUsers.length;
      return Promise.resolve({
        ok: true, status: 200,
        json: () => Promise.resolve({ items, hasMore, page, limit }),
      });
    }
    return mockFetch(url);
  }
  async function fetchAllPages(baseUrl, limit = 2) {
    const all = [];
    let page = 1;
    let hasMore = true;
    while (hasMore) {
      const res = await pagedMockFetch(`${baseUrl}?page=${page}&limit=${limit}`);
      const data = await res.json();
      all.push(...data.items);
      hasMore = data.hasMore;
      page++;
    }
    return all;
  }
  const all = await fetchAllPages("/users-paged");
  console.log("Ex25 — all pages:", all.length, "items");
}

/** Bearer token refresh pattern */
async function ex26() {
  let token = "old-token";
  let refreshCount = 0;
  async function refreshToken() { refreshCount++; token = "new-token"; return token; }
  async function authenticatedFetch(url) {
    let res = await mockFetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (res.status === 401) {
      await refreshToken();
      res = await mockFetch(url, { headers: { Authorization: `Bearer ${token}` } });
    }
    return res;
  }
  const res = await authenticatedFetch("/users");
  console.log("Ex26 — auth fetch ok:", res.ok, "token:", token);
}

// ─── NESTED (27–38) ──────────────────────────────────────────────────────────

/** API client class */
async function ex27() {
  class ApiClient {
    constructor(baseUrl, fetchFn = mockFetch) {
      this.baseUrl = baseUrl;
      this.fetch = fetchFn;
    }
    async get(path) {
      const res = await this.fetch(this.baseUrl + path);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }
    async post(path, data) {
      const res = await this.fetch(this.baseUrl + path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    }
  }
  const api = new ApiClient("");
  const users = await api.get("/users");
  console.log("Ex27 — API client users:", users.length);
  const created = await api.post("/users", { name: "Eve" });
  console.log("Ex27 — API client created:", created.name);
}

/** REST client with CRUD methods */
async function ex28() {
  function createRESTClient(resource) {
    return {
      async list() {
        const res = await mockFetch(`/${resource}`);
        return res.json();
      },
      async get(id) {
        const res = await mockFetch(`/${resource}/${id}`);
        return res.json();
      },
      async create(data) {
        const res = await mockFetch(`/${resource}`, {
          method: "POST", body: JSON.stringify(data),
        });
        return res.json();
      },
      async update(id, data) {
        const res = await mockFetch(`/${resource}/${id}`, {
          method: "PATCH", body: JSON.stringify(data),
        });
        return res.json();
      },
      async remove(id) {
        const res = await mockFetch(`/${resource}/${id}`, { method: "DELETE" });
        return res.ok;
      },
    };
  }
  const usersClient = createRESTClient("users");
  const all = await usersClient.list();
  const one = await usersClient.get(1);
  const del = await usersClient.remove(1);
  console.log("Ex28 — REST: list:", all.length, "get:", one.name, "delete:", del);
}

/** Fetch middleware chain */
async function ex29() {
  function createFetchWithMiddleware(fetchFn, middlewares) {
    return async (url, options = {}) => {
      const ctx = { url, options, response: null };
      async function dispatch(i) {
        if (i >= middlewares.length) {
          ctx.response = await fetchFn(ctx.url, ctx.options);
        } else {
          await middlewares[i](ctx, () => dispatch(i + 1));
        }
      }
      await dispatch(0);
      return ctx.response;
    };
  }
  const log = [];
  const fetch2 = createFetchWithMiddleware(mockFetch, [
    async (ctx, next) => { log.push("before:" + ctx.url); await next(); log.push("after"); },
    async (ctx, next) => { log.push("auth"); await next(); },
  ]);
  await fetch2("/users");
  console.log("Ex29 — middleware:", log.join(", "));
}

/** Request/response logging */
async function ex30() {
  const requestLog = [];
  function loggingFetch(url, options = {}) {
    const start = Date.now();
    requestLog.push({ url, method: options.method || "GET", timestamp: start });
    return mockFetch(url, options).then(res => {
      requestLog[requestLog.length - 1].duration = Date.now() - start;
      requestLog[requestLog.length - 1].status = res.status;
      return res;
    });
  }
  await loggingFetch("/users");
  await loggingFetch("/posts");
  console.log("Ex30 — logged requests:", requestLog.length);
  console.log("Ex30 — first log:", requestLog[0].url, requestLog[0].status);
}

/** Rate limiting for requests */
async function ex31() {
  function rateLimitedFetch(fetchFn, requestsPerSecond) {
    const interval = 1000 / requestsPerSecond;
    let lastRequestTime = 0;
    return async (url, options) => {
      const now = Date.now();
      const elapsed = now - lastRequestTime;
      if (elapsed < interval) {
        await new Promise(r => setTimeout(r, interval - elapsed));
      }
      lastRequestTime = Date.now();
      return fetchFn(url, options);
    };
  }
  const limited = rateLimitedFetch(mockFetch, 100); // 100 req/s
  const [r1, r2] = await Promise.all([limited("/users"), limited("/posts")]);
  console.log("Ex31 — rate limited ok:", r1.ok, r2.ok);
}

/** Cache-first strategy */
async function ex32() {
  function cacheFirst(fetchFn) {
    const cache = new Map();
    return async (url, options = {}) => {
      // Only cache GET requests
      if (!options.method || options.method === "GET") {
        if (cache.has(url)) {
          console.log("Ex32 — cache hit:", url);
          return { ok: true, status: 200, json: () => Promise.resolve(cache.get(url)) };
        }
        const res = await fetchFn(url, options);
        if (res.ok) {
          const data = await res.json();
          cache.set(url, data);
          return { ok: true, status: 200, json: () => Promise.resolve(data) };
        }
        return res;
      }
      return fetchFn(url, options);
    };
  }
  const cf = cacheFirst(mockFetch);
  await cf("/users"); // miss
  await cf("/users"); // hit
  const res = await cf("/users");
  const users = await res.json();
  console.log("Ex32 — cache-first users:", users.length);
}

/** Stale-while-revalidate */
async function ex33() {
  function staleWhileRevalidate(fetchFn, maxAge = 1000) {
    const cache = new Map();
    return async (url) => {
      const entry = cache.get(url);
      const now = Date.now();
      // Revalidate in background if stale
      if (!entry || now - entry.ts > maxAge) {
        const fresh = fetchFn(url).then(r => r.json()).then(data => {
          cache.set(url, { data, ts: Date.now() });
          return data;
        });
        if (!entry) return fresh; // wait on first load
        fresh.catch(() => {}); // background refresh
      }
      return entry.data;
    };
  }
  const swr = staleWhileRevalidate(mockFetch);
  const users = await swr("/users");
  console.log("Ex33 — SWR users:", users.length);
  const cached = await swr("/users"); // stale
  console.log("Ex33 — SWR cached:", cached.length);
}

/** Background sync concept */
async function ex34() {
  class SyncQueue {
    constructor(fetchFn) {
      this.queue = [];
      this.fetch = fetchFn;
      this.processing = false;
    }
    enqueue(request) {
      this.queue.push(request);
      if (!this.processing) this._process();
    }
    async _process() {
      this.processing = true;
      while (this.queue.length) {
        const { url, options, resolve, reject } = this.queue.shift();
        try { resolve(await this.fetch(url, options)); }
        catch (e) { reject(e); }
      }
      this.processing = false;
    }
    submit(url, options = {}) {
      return new Promise((resolve, reject) => this.enqueue({ url, options, resolve, reject }));
    }
  }
  const sync = new SyncQueue(mockFetch);
  const results = await Promise.all([
    sync.submit("/users"),
    sync.submit("/posts"),
  ]);
  console.log("Ex34 — sync queue results:", results.length, "both ok:", results.every(r => r.ok));
}

/** Request batching */
async function ex35() {
  function batchFetch(fetchFn, delay = 0) {
    let pending = [];
    let timer = null;
    return function queueRequest(url) {
      return new Promise((resolve, reject) => {
        pending.push({ url, resolve, reject });
        if (!timer) {
          timer = setTimeout(async () => {
            const batch = pending.splice(0);
            timer = null;
            const results = await Promise.allSettled(batch.map(r => fetchFn(r.url)));
            results.forEach((result, i) => {
              if (result.status === "fulfilled") batch[i].resolve(result.value);
              else batch[i].reject(result.reason);
            });
          }, delay);
        }
      });
    };
  }
  const batched = batchFetch(mockFetch, 0);
  const [r1, r2, r3] = await Promise.all([
    batched("/users"),
    batched("/posts"),
    batched("/config"),
  ]);
  console.log("Ex35 — batched requests:", [r1, r2, r3].every(r => r.ok));
}

/** GraphQL fetch pattern */
async function ex36() {
  function graphqlFetch(queryStr, variables = {}) {
    // Simulate a GraphQL endpoint using mockFetch
    const body = JSON.stringify({ query: queryStr, variables });
    return mockFetch("/graphql", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
    }).then(res => res.json());
  }
  const result = await graphqlFetch(`query GetUser($id: ID!) { user(id: $id) { name } }`, { id: 1 });
  console.log("Ex36 — GraphQL result id:", result.id);
}

/** WebSocket concept — event-driven wrapper */
async function ex37() {
  // Simulate WebSocket-like pub/sub with async
  function createMockSocket() {
    const handlers = {};
    return {
      on(event, fn) { (handlers[event] = handlers[event] || []).push(fn); },
      send(event, data) { setTimeout(() => (handlers[event] || []).forEach(fn => fn(data)), 0); },
      close() { Object.keys(handlers).forEach(k => delete handlers[k]); },
    };
  }
  const socket = createMockSocket();
  const messages = [];
  socket.on("message", data => messages.push(data));
  socket.send("message", { text: "Hello" });
  socket.send("message", { text: "World" });
  await new Promise(r => setTimeout(r, 10));
  console.log("Ex37 — socket messages:", messages.map(m => m.text).join(", "));
}

/** Server-Sent Events concept */
async function ex38() {
  function createSSEStream(events) {
    let index = 0;
    return {
      [Symbol.asyncIterator]() { return this; },
      async next() {
        if (index >= events.length) return { done: true };
        await new Promise(r => setTimeout(r, 0));
        return { value: events[index++], done: false };
      },
    };
  }
  const events = [
    { type: "update", data: { count: 1 } },
    { type: "update", data: { count: 2 } },
    { type: "close", data: {} },
  ];
  const received = [];
  for await (const event of createSSEStream(events)) {
    received.push(event.type);
    if (event.type === "close") break;
  }
  console.log("Ex38 — SSE events:", received.join(", "));
}

// ─── ADVANCED (39–50) ────────────────────────────────────────────────────────

/** Streaming response concept */
async function ex39() {
  async function* streamResponse(data, chunkSize = 10) {
    const str = JSON.stringify(data);
    for (let i = 0; i < str.length; i += chunkSize) {
      yield str.slice(i, i + chunkSize);
    }
  }
  const users = [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }];
  const chunks = [];
  for await (const chunk of streamResponse(users)) {
    chunks.push(chunk);
  }
  const reassembled = JSON.parse(chunks.join(""));
  console.log("Ex39 — streaming:", reassembled.length, "users reassembled");
}

/** Multipart form data concept */
async function ex40() {
  function buildMultipartBody(fields) {
    const boundary = "----FormBoundary123";
    const parts = Object.entries(fields).map(([name, value]) =>
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}`
    );
    return {
      body: parts.join("\r\n") + `\r\n--${boundary}--`,
      contentType: `multipart/form-data; boundary=${boundary}`,
    };
  }
  const { body, contentType } = buildMultipartBody({ username: "Alice", age: "30" });
  const res = await mockFetch("/upload", {
    method: "POST",
    headers: { "Content-Type": contentType },
    body,
  });
  console.log("Ex40 — multipart POST ok:", res.ok);
}

/** Content negotiation */
async function ex41() {
  async function fetchWithAccept(url, format = "json") {
    const acceptMap = { json: "application/json", html: "text/html", xml: "application/xml" };
    const res = await mockFetch(url, {
      headers: { Accept: acceptMap[format] || format },
    });
    if (!res.ok) throw new Error("HTTP " + res.status);
    return res.json(); // mockFetch always returns JSON
  }
  const data = await fetchWithAccept("/users", "json");
  console.log("Ex41 — content negotiation:", data.length, "users");
}

/** Pagination cursor pattern */
async function ex42() {
  function createCursorFetch() {
    const allItems = Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `Item${i + 1}` }));
    return (cursor = 0, limit = 3) => {
      const items = allItems.slice(cursor, cursor + limit);
      const nextCursor = cursor + limit < allItems.length ? cursor + limit : null;
      return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve({ items, nextCursor }) });
    };
  }
  const cursorFetch = createCursorFetch();
  const all = [];
  let cursor = 0;
  while (cursor !== null) {
    const res = await cursorFetch(cursor, 4);
    const data = await res.json();
    all.push(...data.items);
    cursor = data.nextCursor;
  }
  console.log("Ex42 — cursor pagination:", all.length, "total items");
}

/** API versioning */
async function ex43() {
  function createVersionedClient(version) {
    return async (path, options = {}) => {
      const url = `/api/${version}${path}`;
      // Rewrite to mockFetch endpoint
      const mockUrl = path; // strip prefix for mock
      const res = await mockFetch(mockUrl, options);
      return { ...res, version };
    };
  }
  const v1 = createVersionedClient("v1");
  const res = await v1("/users");
  console.log("Ex43 — versioned API:", res.version, "ok:", res.ok);
}

/** ETag / conditional requests */
async function ex44() {
  const etags = new Map();
  async function conditionalFetch(url) {
    const etag = etags.get(url);
    const options = etag ? { headers: { "If-None-Match": etag } } : {};
    const res = await mockFetch(url, options);
    // Simulate ETag response header
    if (res.ok) etags.set(url, `"${Date.now()}"`);
    return res;
  }
  await conditionalFetch("/users"); // initial
  const res2 = await conditionalFetch("/users"); // conditional
  console.log("Ex44 — ETag conditional:", res2.ok, "etags stored:", etags.size);
}

/** Service worker fetch intercept concept */
async function ex45() {
  // Simulate SW cache strategy: cache-first with network fallback
  const swCache = new Map();
  async function swFetch(url, options = {}) {
    // Check cache first
    if (swCache.has(url)) {
      console.log("Ex45 — SW cache hit:", url);
      return { ok: true, status: 200, json: () => Promise.resolve(swCache.get(url)) };
    }
    // Network fallback
    try {
      const res = await mockFetch(url, options);
      if (res.ok) {
        const data = await res.json();
        swCache.set(url, data);
        return { ok: true, status: 200, json: () => Promise.resolve(data) };
      }
      return res;
    } catch (e) {
      throw new Error("offline: " + e.message);
    }
  }
  await swFetch("/users"); // network fetch + cache
  await swFetch("/users"); // cache hit
  console.log("Ex45 — SW cache size:", swCache.size);
}

/** HTTP polling with async generator */
async function ex46() {
  async function* poll(url, interval = 0, maxPolls = 3) {
    for (let i = 0; i < maxPolls; i++) {
      const res = await mockFetch(url);
      const data = await res.json();
      yield data;
      if (i < maxPolls - 1) await new Promise(r => setTimeout(r, interval));
    }
  }
  const polls = [];
  for await (const data of poll("/config", 0, 3)) {
    polls.push(data.version);
  }
  console.log("Ex46 — poll results:", polls.length, "polls, version:", polls[0]);
}

/** Fetch with progress tracking (simulated) */
async function ex47() {
  function fetchWithProgress(url, onProgress) {
    return new Promise(async (resolve, reject) => {
      let loaded = 0;
      const total = 100;
      const res = await mockFetch(url).catch(reject);
      // Simulate progress
      const intervalId = setInterval(() => {
        loaded = Math.min(loaded + 25, total);
        onProgress(loaded, total);
        if (loaded >= total) clearInterval(intervalId);
      }, 0);
      resolve(res);
    });
  }
  const progressLog = [];
  const res = await fetchWithProgress("/users", (loaded, total) => {
    progressLog.push(`${loaded}/${total}`);
  });
  await new Promise(r => setTimeout(r, 20)); // let intervals fire
  console.log("Ex47 — progress tracked, final ok:", res.ok);
}

/** Fetch queue with priority */
async function ex48() {
  class PriorityFetchQueue {
    constructor() {
      this.queues = { high: [], normal: [], low: [] };
      this.running = false;
    }
    add(priority, url, options = {}) {
      return new Promise((resolve, reject) => {
        (this.queues[priority] || this.queues.normal).push({ url, options, resolve, reject });
        if (!this.running) this._run();
      });
    }
    async _run() {
      this.running = true;
      while (true) {
        let found = null;
        for (const p of ["high", "normal", "low"]) {
          if (this.queues[p].length) { found = this.queues[p].shift(); break; }
        }
        if (!found) break;
        const { url, options, resolve, reject } = found;
        await mockFetch(url, options).then(resolve).catch(reject);
      }
      this.running = false;
    }
  }
  const q = new PriorityFetchQueue();
  const results = await Promise.all([
    q.add("low", "/config"),
    q.add("high", "/users"),
    q.add("normal", "/posts"),
  ]);
  console.log("Ex48 — priority queue:", results.every(r => r.ok), "done");
}

/** API client with automatic token refresh */
async function ex49() {
  let accessToken = "valid-token";
  let refreshToken = "refresh-token";
  async function refreshAccessToken() {
    return "new-access-token-" + Date.now();
  }
  async function apiRequest(url, options = {}) {
    const headers = { ...options.headers, Authorization: `Bearer ${accessToken}` };
    let res = await mockFetch(url, { ...options, headers });
    // Simulate 401 on first request
    if (res.status === 401) {
      accessToken = await refreshAccessToken();
      const newHeaders = { ...options.headers, Authorization: `Bearer ${accessToken}` };
      res = await mockFetch(url, { ...options, headers: newHeaders });
    }
    return res;
  }
  const res = await apiRequest("/users");
  const users = await res.json();
  console.log("Ex49 — auto-refresh users:", users.length, "token:", accessToken.startsWith("valid") ? "original" : "refreshed");
}

/** Full API client with middleware, caching, and retry */
async function ex50() {
  class FullApiClient {
    constructor(fetchFn = mockFetch) {
      this._fetch = fetchFn;
      this._cache = new Map();
      this._retries = 2;
    }
    async _fetchWithRetry(url, options) {
      for (let i = 0; i <= this._retries; i++) {
        try {
          const res = await this._fetch(url, options);
          if (!res.ok && res.status >= 500) throw new Error("Server error");
          return res;
        } catch (e) {
          if (i === this._retries) throw e;
          await new Promise(r => setTimeout(r, 0));
        }
      }
    }
    async get(url) {
      if (this._cache.has(url)) return this._cache.get(url);
      const res = await this._fetchWithRetry(url, { method: "GET" });
      const data = await res.json();
      this._cache.set(url, data);
      return data;
    }
    async post(url, body) {
      const res = await this._fetchWithRetry(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      return res.json();
    }
    clearCache() { this._cache.clear(); }
  }
  const client = new FullApiClient();
  const users = await client.get("/users");
  const users2 = await client.get("/users"); // cached
  const created = await client.post("/users", { name: "Grace" });
  console.log("Ex50 — full client: users:", users.length, "cached same:", users === users2, "created:", created.name);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  await ex01(); await ex02(); await ex03(); await ex04(); await ex05();
  await ex06(); await ex07(); await ex08(); await ex09(); await ex10();
  await ex11(); await ex12(); await ex13();
  await ex14(); await ex15(); await ex16(); await ex17(); await ex18();
  await ex19(); await ex20(); await ex21(); await ex22(); await ex23();
  await ex24(); await ex25(); await ex26();
  await ex27(); await ex28(); await ex29(); await ex30(); await ex31();
  await ex32(); await ex33(); await ex34(); await ex35(); await ex36();
  await ex37(); await ex38();
  await ex39(); await ex40(); await ex41(); await ex42(); await ex43();
  await ex44(); await ex45(); await ex46(); await ex47(); await ex48();
  await ex49(); await ex50();
}

main().catch(e => console.error("Error:", e));
