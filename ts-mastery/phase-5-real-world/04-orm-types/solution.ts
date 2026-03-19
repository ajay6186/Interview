// ============================================================================
// Solution 5.4 — ORM-Style Type Definitions
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// Column types
// ---------------------------------------------------------------------------

interface Column<T> {
  _type: T;
  nullable: boolean;
  defaultValue?: T;
}

function col<T>(opts?: { nullable?: boolean; default?: T }): Column<T> {
  return {
    _type: undefined as any,
    nullable: opts?.nullable ?? false,
    defaultValue: opts?.default,
  };
}

function text(): Column<string> { return col<string>(); }
function integer(): Column<number> { return col<number>(); }
function bool(): Column<boolean> { return col<boolean>(); }
function timestamp(): Column<Date> { return col<Date>(); }
function nullable<T>(column: Column<T>): Column<T | null> {
  return col<T | null>({ nullable: true });
}

// ---------------------------------------------------------------------------
// Table definition and inference
// ---------------------------------------------------------------------------

type TableColumns = Record<string, Column<any>>;

type InferRow<Columns extends TableColumns> = {
  [K in keyof Columns]: Columns[K]["_type"];
};

function defineTable<C extends TableColumns>(name: string, columns: C) {
  const store: InferRow<C>[] = [];

  return {
    name,
    columns,
    create(row: InferRow<C>): InferRow<C> {
      store.push(row);
      return row;
    },
    findMany(): InferRow<C>[] {
      return [...store];
    },
  };
}

// ---------------------------------------------------------------------------
// Model definitions
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------

const alice = users.create({
  id: 1,
  name: "Alice",
  email: "alice@test.com",
  bio: null,
  active: true,
  createdAt: new Date(),
});
console.assert(alice.name === "Alice", "create user");
console.assert(alice.bio === null, "nullable bio");

const post = posts.create({
  id: 1,
  title: "Hello",
  body: "World",
  authorId: 1,
  published: true,
});
console.assert(post.title === "Hello", "create post");

console.assert(users.findMany().length === 1, "findMany users");
console.assert(posts.findMany().length === 1, "findMany posts");

console.log("Solution 5.4 — All assertions passed!");

export {};
