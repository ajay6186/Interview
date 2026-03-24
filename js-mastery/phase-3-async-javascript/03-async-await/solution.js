// ============================================================================
// Solution 3.3 — Async/Await
// ============================================================================

"use strict";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// 1. fetchUser
// ---------------------------------------------------------------------------

async function fetchUser(id) {
  await sleep(0); // simulate async I/O
  return { id, name: "User_" + id };
}

// ---------------------------------------------------------------------------
// 2. fetchUserWithPosts
// ---------------------------------------------------------------------------

async function fetchUserWithPosts(id) {
  const user = await fetchUser(id);
  // Simulate fetching posts
  await sleep(0);
  const posts = [{ title: "Post 1" }, { title: "Post 2" }];
  return { user, posts };
}

// ---------------------------------------------------------------------------
// 3. fetchAll — parallel
// ---------------------------------------------------------------------------

async function fetchAll(ids) {
  return Promise.all(ids.map(id => fetchUser(id)));
}

// ---------------------------------------------------------------------------
// 4. safeRun
// ---------------------------------------------------------------------------

async function safeRun(fn) {
  try {
    const result = await fn();
    return { ok: true, result };
  } catch (error) {
    return { ok: false, error };
  }
}

// ---------------------------------------------------------------------------
// Run assertions
// ---------------------------------------------------------------------------

(async () => {
  const user = await fetchUser(1);
  console.assert(user.id === 1 && user.name === "User_1", "fetchUser failed");

  const userWithPosts = await fetchUserWithPosts(1);
  console.assert(userWithPosts.user.id === 1 && userWithPosts.posts.length > 0, "fetchUserWithPosts failed");

  const users = await fetchAll([1, 2, 3]);
  console.assert(users.length === 3, "fetchAll length failed");
  console.assert(users[0].id === 1 && users[2].id === 3, "fetchAll ids failed");

  const good = await safeRun(async () => 42);
  console.assert(good.ok && good.result === 42, "safeRun ok failed");

  const bad = await safeRun(async () => { throw new Error("oops"); });
  console.assert(!bad.ok && bad.error.message === "oops", "safeRun error failed");

  await sleep(0);
  console.log("Exercise 3.3 — All assertions passed!");
})();
