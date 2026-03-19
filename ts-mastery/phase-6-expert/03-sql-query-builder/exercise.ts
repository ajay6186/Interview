// ============================================================================
// Exercise 6.3 — Type-Safe SQL Query Builder
// ============================================================================
// Build a query builder that validates column names, join conditions,
// and infers result types from the query structure.
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// Database schema definition
// ---------------------------------------------------------------------------

interface DB {
  users: {
    id: number;
    name: string;
    email: string;
    departmentId: number;
  };
  departments: {
    id: number;
    name: string;
    budget: number;
  };
  posts: {
    id: number;
    title: string;
    body: string;
    authorId: number;
    published: boolean;
  };
}

// ---------------------------------------------------------------------------
// TODO: Implement QueryBuilder
// ---------------------------------------------------------------------------

// The builder should support:
// - from<Table>(table) — select the table
// - select<Cols>(cols[]) — pick columns (validated against table)
// - where(col, op, value) — add filter (type-checked)
// - Result type is inferred from selected columns

// TODO: Define the builder class
class QueryBuilder<
  Schema extends Record<string, Record<string, any>>,
  Table extends keyof Schema = never,
  Selected extends keyof Schema[Table] = never
> {
  // TODO: implement from, select, where, toSQL, execute
}

// ---------------------------------------------------------------------------
// Usage (uncomment after implementing)
// ---------------------------------------------------------------------------

/*
const qb = new QueryBuilder<DB>();

const query = qb
  .from("users")
  .select(["id", "name", "email"])
  .where("departmentId", "=", 1);

// Type of result should be { id: number; name: string; email: string }[]

const postQuery = qb
  .from("posts")
  .select(["title", "published"])
  .where("published", "=", true);

// Type of result should be { title: string; published: boolean }[]

// These should cause compile errors:
// qb.from("users").select(["nonexistent"]);    // Error
// qb.from("users").where("badCol", "=", 1);    // Error
*/

console.log("Exercise 6.3 — All assertions passed!");

export {};
