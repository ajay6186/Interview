// ============================================================================
// Exercise 4.4 — Branded Types
// ============================================================================
// Use branded (nominal) types to prevent mixing up structurally identical
// but semantically different values (e.g., UserId vs PostId).
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Brand helper
// ---------------------------------------------------------------------------

// TODO: Define a Brand utility type that adds a phantom __brand property
// Brand<T, B> should be T & { readonly __brand: B }
type Brand<T, B extends string> = any;

// ---------------------------------------------------------------------------
// 2. Branded ID types
// ---------------------------------------------------------------------------

// TODO: Define branded types for UserId, PostId, and OrderId (all based on string)
type UserId = any;
type PostId = any;
type OrderId = any;

// TODO: Implement constructor functions that "brand" a raw string
function createUserId(id: string): UserId {
  return null as any;
}

function createPostId(id: string): PostId {
  return null as any;
}

function createOrderId(id: string): OrderId {
  return null as any;
}

// ---------------------------------------------------------------------------
// 3. Functions that enforce branded types
// ---------------------------------------------------------------------------

// TODO: These functions should ONLY accept the correct branded type
function getUserById(id: UserId): string {
  return `User:${id}`;
}

function getPostById(id: PostId): string {
  return `Post:${id}`;
}

// ---------------------------------------------------------------------------
// 4. Branded numeric types
// ---------------------------------------------------------------------------

// TODO: Create branded types for different units
type Meters = any;
type Seconds = any;
type MetersPerSecond = any;

function meters(value: number): Meters {
  return null as any;
}

function seconds(value: number): Seconds {
  return null as any;
}

// TODO: Implement a type-safe velocity function
function velocity(distance: Meters, time: Seconds): MetersPerSecond {
  return null as any;
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
const userId = createUserId("user-1");
const postId = createPostId("post-1");

console.assert(getUserById(userId) === "User:user-1", "getUserById");
console.assert(getPostById(postId) === "Post:post-1", "getPostById");

// These should cause compile errors (uncomment to verify):
// getUserById(postId);  // Error! PostId is not UserId
// getPostById(userId);  // Error! UserId is not PostId

const d = meters(100);
const t = seconds(10);
const v = velocity(d, t);
console.assert((v as unknown as number) === 10, "velocity");

console.log("Exercise 4.4 — All assertions passed!");

export {};
