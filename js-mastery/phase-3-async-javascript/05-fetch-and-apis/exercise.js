// ============================================================================
// Exercise 3.5 — Fetch & APIs
// ============================================================================
// Learn fetch patterns using a mock fetch implementation.
// Run with: node exercise.js
// ============================================================================

"use strict";

// Mock fetch for Node.js environment
function mockFetch(url, options = {}) {
  const db = {
    "/users": [{ id:1, name:"Alice" }, { id:2, name:"Bob" }],
    "/users/1": { id:1, name:"Alice", email:"alice@example.com" },
    "/posts": [{ id:1, title:"Hello", userId:1 }],
  };
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (url === "/error") return reject(new Error("Network error"));
      const data = db[url];
      if (!data) return resolve({ ok: false, status: 404, json: () => Promise.resolve({ error: "Not found" }) });
      resolve({ ok: true, status: 200, json: () => Promise.resolve(data) });
    }, 0);
  });
}

// TODO: Write `getUsers()` using mockFetch, checking response.ok, returning json()
async function getUsers() { /* TODO */ }

// TODO: Write `getUser(id)` fetching /users/{id}
async function getUser(id) { /* TODO */ }

// TODO: Write `postData(url, body)` making a POST request with JSON body
async function postData(url, body) {
  // TODO: call mockFetch with method:"POST", Content-Type header, JSON.stringify body
}

// TODO: Write `fetchWithRetry(url, retries)` retrying on failure up to retries times
async function fetchWithRetry(url, retries = 3) { /* TODO */ }

// TODO: Write `fetchParallel(urls)` fetching all URLs in parallel
async function fetchParallel(urls) { /* TODO */ }

// --- Run ---
(async () => {
  const users = await getUsers();
  console.assert(Array.isArray(users) && users.length === 2, "getUsers failed");

  const user = await getUser(1);
  console.assert(user.id === 1 && user.name === "Alice", "getUser failed");

  const parallel = await fetchParallel(["/users", "/posts"]);
  console.assert(parallel.length === 2, "fetchParallel failed");

  console.log("Exercise 3.5 — All assertions passed!");
})();
