// ============================================================================
// Exercise 5.4 — ORM-Style Type Definitions
// ============================================================================
// Build type-safe model definitions with relations, like a mini Prisma/Drizzle.
//
// Instructions: Fill in every TODO so the file compiles and all assertions pass.
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// Column type definitions
// ---------------------------------------------------------------------------

// TODO: Define column types that carry their TypeScript type
interface Column<T> {
  _type: T;
  nullable: boolean;
  defaultValue?: T;
}

// TODO: Implement column constructors
function col<T>(opts?: { nullable?: boolean; default?: T }): Column<T> {
  return null as any;
}

// Shorthand column types
function text(): Column<string> { return col<string>(); }
function integer(): Column<number> { return col<number>(); }
function bool(): Column<boolean> { return col<boolean>(); }
function timestamp(): Column<Date> { return col<Date>(); }
function nullable<T>(column: Column<T>): Column<T | null> { return col<T | null>({ nullable: true }); }

// ---------------------------------------------------------------------------
// TODO: Table definition and type inference
// ---------------------------------------------------------------------------

type TableColumns = Record<string, Column<any>>;

// TODO: Infer the row type from column definitions
type InferRow<Columns extends TableColumns> = any;

// TODO: Define a table function
function defineTable<C extends TableColumns>(name: string, columns: C) {
  return {
    name,
    columns,
    // TODO: Add a typed `create` method that accepts InferRow<C>
    // TODO: Add a typed `findMany` that returns InferRow<C>[]
  };
}

// ---------------------------------------------------------------------------
// Model definitions
// ---------------------------------------------------------------------------

/*
const users = defineTable("users", {
  id: integer(),
  name: text(),
  email: text(),
  bio: nullable(text()),
  active: bool(),
  createdAt: timestamp(),
});

const posts = defineTable("posts", {
  id: integer(),
  title: text(),
  body: text(),
  authorId: integer(),
  published: bool(),
});

// Type-level tests
type UserRow = InferRow<typeof users.columns>;
type TestUserRow = Expect<Equal<UserRow, {
  id: number;
  name: string;
  email: string;
  bio: string | null;
  active: boolean;
  createdAt: Date;
}>>;

type PostRow = InferRow<typeof posts.columns>;
type TestPostRow = Expect<Equal<PostRow, {
  id: number;
  title: string;
  body: string;
  authorId: number;
  published: boolean;
}>>;
*/

console.log("Exercise 5.4 — All assertions passed!");

export {};
