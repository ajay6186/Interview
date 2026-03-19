// ============================================================================
// Solution 4.2 — Discriminated Unions
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// 1. Result type
// ---------------------------------------------------------------------------

type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

function err<E>(error: E): Result<never, E> {
  return { ok: false, error };
}

function unwrap<T, E>(result: Result<T, E>): T {
  if (result.ok) {
    return result.value;
  }
  throw result.error;
}

function mapResult<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  if (result.ok) {
    return ok(fn(result.value));
  }
  return result;
}

// ---------------------------------------------------------------------------
// 2. Action system
// ---------------------------------------------------------------------------

type TodoAction =
  | { type: "ADD_TODO"; payload: { text: string } }
  | { type: "TOGGLE_TODO"; payload: { id: number } }
  | { type: "DELETE_TODO"; payload: { id: number } }
  | { type: "SET_FILTER"; payload: { filter: "all" | "active" | "completed" } };

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

function handleAction(todos: Todo[], action: TodoAction): Todo[] {
  switch (action.type) {
    case "ADD_TODO":
      return [...todos, {
        id: Math.max(0, ...todos.map((t) => t.id)) + 1,
        text: action.payload.text,
        completed: false,
      }];
    case "TOGGLE_TODO":
      return todos.map((t) =>
        t.id === action.payload.id ? { ...t, completed: !t.completed } : t
      );
    case "DELETE_TODO":
      return todos.filter((t) => t.id !== action.payload.id);
    case "SET_FILTER":
      return todos; // filter doesn't change the todo list itself
  }
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

console.log("Solution 4.2 — All assertions passed!");

export {};
