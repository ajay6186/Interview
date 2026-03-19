// ============================================================================
// Solution 4.4 — Branded Types
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Brand helper
// ---------------------------------------------------------------------------

type Brand<T, B extends string> = T & { readonly __brand: B };

// ---------------------------------------------------------------------------
// 2. Branded ID types
// ---------------------------------------------------------------------------

type UserId = Brand<string, "UserId">;
type PostId = Brand<string, "PostId">;
type OrderId = Brand<string, "OrderId">;

function createUserId(id: string): UserId {
  return id as UserId;
}

function createPostId(id: string): PostId {
  return id as PostId;
}

function createOrderId(id: string): OrderId {
  return id as OrderId;
}

// ---------------------------------------------------------------------------
// 3. Functions that enforce branded types
// ---------------------------------------------------------------------------

function getUserById(id: UserId): string {
  return `User:${id}`;
}

function getPostById(id: PostId): string {
  return `Post:${id}`;
}

// ---------------------------------------------------------------------------
// 4. Branded numeric types
// ---------------------------------------------------------------------------

type Meters = Brand<number, "Meters">;
type Seconds = Brand<number, "Seconds">;
type MetersPerSecond = Brand<number, "MetersPerSecond">;

function meters(value: number): Meters {
  return value as Meters;
}

function seconds(value: number): Seconds {
  return value as Seconds;
}

function velocity(distance: Meters, time: Seconds): MetersPerSecond {
  return ((distance as unknown as number) / (time as unknown as number)) as MetersPerSecond;
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
const userId = createUserId("user-1");
const postId = createPostId("post-1");

console.assert(getUserById(userId) === "User:user-1", "getUserById");
console.assert(getPostById(postId) === "Post:post-1", "getPostById");

// These would cause compile errors:
// getUserById(postId);  // Error!
// getPostById(userId);  // Error!

const d = meters(100);
const t = seconds(10);
const v = velocity(d, t);
console.assert((v as unknown as number) === 10, "velocity");

console.log("Solution 4.4 — All assertions passed!");

export {};
