// ============================================================================
// Exercise 4.2 — Discriminated Unions
// ============================================================================
// Build a type-safe result/error handling system using discriminated unions.
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Result type (like Rust's Result<T, E>)
// ---------------------------------------------------------------------------

// TODO: Define a discriminated union Result<T, E>
// - Success: { ok: true; value: T }
// - Failure: { ok: false; error: E }
type Result<T, E> = any;

// TODO: Implement helper constructors
function ok<T>(value: T): Result<T, never> {
  // TODO
  return null as any;
}

function err<E>(error: E): Result<never, E> {
  // TODO
  return null as any;
}

// TODO: Implement unwrap — returns value if ok, throws error if not
function unwrap<T, E>(result: Result<T, E>): T {
  // TODO
  return null as any;
}

// TODO: Implement map — transform the success value
function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  // TODO
  return null as any;
}

// ---------------------------------------------------------------------------
// 2. Action system (Redux-style)
// ---------------------------------------------------------------------------

// TODO: Define action types for a todo app:
// - { type: "ADD_TODO"; payload: { text: string } }
// - { type: "TOGGLE_TODO"; payload: { id: number } }
// - { type: "DELETE_TODO"; payload: { id: number } }
// - { type: "SET_FILTER"; payload: { filter: "all" | "active" | "completed" } }

type TodoAction = any;

// TODO: Implement a reducer-like function
interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function handleAction(todos: Todo[], action: TodoAction): Todo[] {
  // TODO: handle each action type
  return null as any;
}

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------
const success = ok(42);
const failure = err("not found");
console.assert(unwrap(success) === 42, "unwrap ok");
let threw = false;
try { unwrap(failure); } catch { threw = true; }
console.assert(threw, "unwrap err throws");

const mapped = mapResult(ok(5), (n) => n * 2);
console.assert(unwrap(mapped) === 10, "map ok");
const mappedErr = mapResult(err("oops"), (n: number) => n * 2);
console.assert(!mappedErr.ok, "map err stays err");

const todos: Todo[] = [{ id: 1, text: "Learn TS", completed: false }];
const added = handleAction(todos, { type: "ADD_TODO", payload: { text: "New" } });
console.assert(added.length === 2, "add todo");
const toggled = handleAction(todos, { type: "TOGGLE_TODO", payload: { id: 1 } });
console.assert(toggled[0].completed === true, "toggle todo");
const deleted = handleAction(todos, { type: "DELETE_TODO", payload: { id: 1 } });
console.assert(deleted.length === 0, "delete todo");

console.log("Exercise 4.2 — All assertions passed!");

export {};
