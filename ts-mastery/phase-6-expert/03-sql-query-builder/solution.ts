// ============================================================================
// Solution 6.3 — Type-Safe SQL Query Builder
// ============================================================================

type Expect<T extends true> = T;
type Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;

// ---------------------------------------------------------------------------
// Database schema
// ---------------------------------------------------------------------------

type DB = {
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
};

// ---------------------------------------------------------------------------
// Query builder
// ---------------------------------------------------------------------------

type Operator = "=" | "!=" | ">" | "<" | ">=" | "<=";

interface WhereClause {
  column: string;
  operator: Operator;
  value: any;
}

class QueryBuilder<
  Schema extends Record<string, Record<string, any>>,
  Table extends keyof Schema & string = never,
  Cols extends (keyof Schema[Table])[] = []
> {
  private tableName: Table | null = null;
  private selectedCols: string[] = [];
  private whereClauses: WhereClause[] = [];

  from<T extends keyof Schema & string>(
    table: T
  ): QueryBuilder<Schema, T, []> {
    const qb = new QueryBuilder<Schema, T, []>();
    (qb as any).tableName = table;
    return qb;
  }

  select<C extends (keyof Schema[Table] & string)[]>(
    cols: [...C]
  ): QueryBuilder<Schema, Table, C> {
    const qb = new QueryBuilder<Schema, Table, C>();
    (qb as any).tableName = this.tableName;
    (qb as any).selectedCols = cols;
    (qb as any).whereClauses = [...this.whereClauses];
    return qb;
  }

  where<Col extends keyof Schema[Table] & string>(
    column: Col,
    operator: Operator,
    value: Schema[Table][Col]
  ): this {
    this.whereClauses.push({ column, operator, value });
    return this;
  }

  toSQL(): string {
    const cols = this.selectedCols.length > 0 ? this.selectedCols.join(", ") : "*";
    let sql = `SELECT ${cols} FROM ${this.tableName}`;
    if (this.whereClauses.length > 0) {
      const conditions = this.whereClauses
        .map((w) => `${w.column} ${w.operator} ${JSON.stringify(w.value)}`)
        .join(" AND ");
      sql += ` WHERE ${conditions}`;
    }
    return sql;
  }

  // Simulated execute — returns correctly typed results
  execute(): Pick<Schema[Table], Cols[number]>[] {
    // In real implementation, this would run the SQL
    return [];
  }
}

// ---------------------------------------------------------------------------
// Type-level tests
// ---------------------------------------------------------------------------

const qb = new QueryBuilder<DB>();

const userQuery = qb
  .from("users")
  .select(["id", "name", "email"])
  .where("departmentId", "=", 1);

type UserResult = ReturnType<typeof userQuery.execute>[number];
type TestUserResult = Expect<Equal<UserResult, { id: number; name: string; email: string }>>;

const postQuery = qb
  .from("posts")
  .select(["title", "published"])
  .where("published", "=", true);

type PostResult = ReturnType<typeof postQuery.execute>[number];
type TestPostResult = Expect<Equal<PostResult, { title: string; published: boolean }>>;

// ---------------------------------------------------------------------------
// Runtime tests
// ---------------------------------------------------------------------------

console.assert(
  userQuery.toSQL() === 'SELECT id, name, email FROM users WHERE departmentId = 1',
  "user query SQL"
);

console.assert(
  postQuery.toSQL() === 'SELECT title, published FROM posts WHERE published = true',
  "post query SQL"
);

const deptQuery = qb
  .from("departments")
  .select(["name", "budget"])
  .where("budget", ">", 10000);

console.assert(
  deptQuery.toSQL() === 'SELECT name, budget FROM departments WHERE budget > 10000',
  "dept query SQL"
);

console.log("Solution 6.3 — All assertions passed!");

export {};
