// ============================================================================
// Exercise 3.3 — Async/Await
// ============================================================================
// Master async functions, await, error handling, and parallel patterns.
// Run with: node exercise.js
// ============================================================================

"use strict";

// TODO: Write async `fetchUser(id)` that resolves with {id, name: "User_"+id}
async function fetchUser(id) { /* TODO */ }

// TODO: Write async `fetchUserWithPosts(id)` that fetches user then "posts" (just [{title:"Post 1"}])
async function fetchUserWithPosts(id) { /* TODO: await fetchUser, build result */ }

// TODO: Write async `fetchAll(ids)` fetching all users in PARALLEL using Promise.all
async function fetchAll(ids) { /* TODO */ }

// TODO: Write async `safeRun(fn)` that runs fn() and returns {ok:true,result} or {ok:false,error}
async function safeRun(fn) { /* TODO: try/catch */ }

// TODO: Write `sleep(ms)` returning a Promise resolving after ms
function sleep(ms) { /* TODO */ }

// --- Run ---
(async () => {
  const user = await fetchUser(1);
  console.assert(user.id === 1 && user.name === "User_1", "fetchUser failed");

  const userWithPosts = await fetchUserWithPosts(1);
  console.assert(userWithPosts.user.id === 1 && userWithPosts.posts.length > 0, "fetchUserWithPosts failed");

  const users = await fetchAll([1,2,3]);
  console.assert(users.length === 3, "fetchAll length failed");
  console.assert(users[0].id === 1 && users[2].id === 3, "fetchAll ids failed");

  const good = await safeRun(async () => 42);
  console.assert(good.ok && good.result === 42, "safeRun ok failed");

  const bad = await safeRun(async () => { throw new Error("oops"); });
  console.assert(!bad.ok && bad.error.message === "oops", "safeRun error failed");

  await sleep(0);
  console.log("Exercise 3.3 — All assertions passed!");
})();
