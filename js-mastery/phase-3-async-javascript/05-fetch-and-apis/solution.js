// ============================================================================
// Solution 3.5 — Fetch & APIs
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// Mock fetch for Node.js environment
// ---------------------------------------------------------------------------

function mockFetch(url, options = {}) {
  const db = {
    "/users": [{ id: 1, name: "Alice" }, { id: 2, name: "Bob" }],
    "/users/1": { id: 1, name: "Alice", email: "alice@example.com" },
    "/users/2": { id: 2, name: "Bob", email: "bob@example.com" },
    "/posts": [{ id: 1, title: "Hello", userId: 1 }],
  };
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (url === "/error") return reject(new Error("Network error"));
      const data = db[url];
      if (!data) {
        return resolve({
          ok: false,
          status: 404,
          json: () => Promise.resolve({ error: "Not found" }),
        });
      }
      // POST requests return the body sent (echo) or a success status
      if (options.method === "POST") {
        return resolve({
          ok: true,
          status: 201,
          json: () => Promise.resolve({ created: true, body: JSON.parse(options.body || "{}") }),
        });
      }
      resolve({
        ok: true,
        status: 200,
        json: () => Promise.resolve(data),
      });
    }, 0);
  });
}

// ---------------------------------------------------------------------------
// 1. getUsers
// ---------------------------------------------------------------------------

async function getUsers() {
  const res = await mockFetch("/users");
  if (!res.ok) throw new Error("HTTP error " + res.status);
  return res.json();
}

// ---------------------------------------------------------------------------
// 2. getUser
// ---------------------------------------------------------------------------

async function getUser(id) {
  const res = await mockFetch(`/users/${id}`);
  if (!res.ok) throw new Error("HTTP error " + res.status);
  return res.json();
}

// ---------------------------------------------------------------------------
// 3. postData
// ---------------------------------------------------------------------------

async function postData(url, body) {
  const res = await mockFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error("HTTP error " + res.status);
  return res.json();
}

// ---------------------------------------------------------------------------
// 4. fetchWithRetry
// ---------------------------------------------------------------------------

async function fetchWithRetry(url, retries = 3) {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await mockFetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    } catch (err) {
      lastError = err;
      if (i < retries - 1) {
        await new Promise(r => setTimeout(r, 0)); // small backoff
      }
    }
  }
  throw lastError;
}

// ---------------------------------------------------------------------------
// 5. fetchParallel
// ---------------------------------------------------------------------------

async function fetchParallel(urls) {
  const responses = await Promise.all(urls.map(url => mockFetch(url)));
  return Promise.all(
    responses.map(res => {
      if (!res.ok) throw new Error("HTTP error " + res.status);
      return res.json();
    })
  );
}

// ---------------------------------------------------------------------------
// Run assertions
// ---------------------------------------------------------------------------

(async () => {
  const users = await getUsers();
  console.assert(Array.isArray(users) && users.length === 2, "getUsers failed");

  const user = await getUser(1);
  console.assert(user.id === 1 && user.name === "Alice", "getUser failed");

  const posted = await postData("/users", { name: "Charlie" });
  console.assert(posted.created === true, "postData failed");

  const parallel = await fetchParallel(["/users", "/posts"]);
  console.assert(parallel.length === 2, "fetchParallel failed");
  console.assert(Array.isArray(parallel[0]), "fetchParallel users failed");
  console.assert(Array.isArray(parallel[1]), "fetchParallel posts failed");

  // Test retry — /error always rejects
  let retryError;
  try { await fetchWithRetry("/error", 2); }
  catch (e) { retryError = e; }
  console.assert(retryError instanceof Error, "fetchWithRetry error failed");

  console.log("Exercise 3.5 — All assertions passed!");
})();
