export {};

// ============================================================
// Phase 6 – Expert: SQL Query Builder — BASIC (1–50)
// ============================================================

// --- 1. Table definition type ---
type Table<Name extends string, Columns extends Record<string, unknown>> = {
  __name: Name;
  __columns: Columns;
};
type UsersTable = Table<"users", { id: number; name: string; email: string; age: number }>;

// --- 2. Column reference ---
type Col<T extends Table<string, Record<string, unknown>>, C extends keyof T["__columns"]> = {
  table: T["__name"];
  column: C;
  type: T["__columns"][C];
};
type UserIdCol = Col<UsersTable, "id">;
type UserNameCol = Col<UsersTable, "name">;

// --- 3. SELECT * type ---
type SelectAll<T extends Table<string, Record<string, unknown>>> = T["__columns"];
type B3 = SelectAll<UsersTable>; // { id:number; name:string; email:string; age:number }

// --- 4. SELECT specific columns ---
type SelectCols<T extends Table<string, Record<string, unknown>>, Cols extends keyof T["__columns"]> =
  Pick<T["__columns"], Cols>;
type B4 = SelectCols<UsersTable, "id" | "name">; // {id:number; name:string}

// --- 5. WHERE clause type ---
type WhereEq<T extends Table<string, Record<string, unknown>>, C extends keyof T["__columns"]> = {
  column: C;
  value: T["__columns"][C];
};
const B5_where: WhereEq<UsersTable, "id"> = { column: "id", value: 1 };

// --- 6. Simple SQL string builder ---
function select(table: string, ...cols: string[]): string {
  return `SELECT ${cols.length > 0 ? cols.join(", ") : "*"} FROM ${table}`;
}
const B6_sql = select("users", "id", "name", "email");
// "SELECT id, name, email FROM users"

// --- 7. WHERE builder ---
function where_(sql: string, condition: string): string {
  return `${sql} WHERE ${condition}`;
}
const B7_sql = where_(select("users"), "id = 1");

// --- 8. ORDER BY builder ---
function orderBy(sql: string, col: string, dir: "ASC" | "DESC" = "ASC"): string {
  return `${sql} ORDER BY ${col} ${dir}`;
}
const B8_sql = orderBy(where_(select("users"), "age > 18"), "name");

// --- 9. LIMIT builder ---
function limit(sql: string, n: number): string {
  return `${sql} LIMIT ${n}`;
}
const B9_sql = limit(select("users"), 10);

// --- 10. OFFSET builder ---
function offset(sql: string, n: number): string {
  return `${sql} OFFSET ${n}`;
}
const B10_sql = offset(limit(select("users"), 10), 20);

// --- 11. Typed query result ---
type QueryResult<T extends Table<string, Record<string, unknown>>, Cols extends keyof T["__columns"] = keyof T["__columns"]> = {
  rows: Pick<T["__columns"], Cols>[];
  rowCount: number;
};
type B11 = QueryResult<UsersTable, "id" | "name">;

// --- 12. FROM clause type ---
type From<T extends Table<string, Record<string, unknown>>> = { from: T["__name"] };
const B12_from: From<UsersTable> = { from: "users" };

// --- 13. Table column list type ---
type Columns<T extends Table<string, Record<string, unknown>>> = keyof T["__columns"] & string;
type B13 = Columns<UsersTable>; // "id" | "name" | "email" | "age"

// --- 14. Comparison operators ---
type CompOp = "=" | "<>" | "<" | "<=" | ">" | ">=";
type WhereExpr<T extends Table<string, Record<string, unknown>>> = {
  column: Columns<T>;
  op: CompOp;
  value: T["__columns"][Columns<T>];
};

// --- 15. AND / OR composition ---
type AndExpr<T extends Table<string, Record<string, unknown>>> = {
  op: "AND";
  left: WhereExpr<T> | AndExpr<T> | OrExpr<T>;
  right: WhereExpr<T> | AndExpr<T> | OrExpr<T>;
};
type OrExpr<T extends Table<string, Record<string, unknown>>> = {
  op: "OR";
  left: WhereExpr<T> | AndExpr<T> | OrExpr<T>;
  right: WhereExpr<T> | AndExpr<T> | OrExpr<T>;
};

// --- 16. WHERE expression to SQL string ---
function exprToSql<T extends Table<string, Record<string, unknown>>>(
  expr: WhereExpr<T> | AndExpr<T> | OrExpr<T>
): string {
  if ("op" in expr && (expr.op === "AND" || expr.op === "OR")) {
    return `(${exprToSql((expr as AndExpr<T>).left)} ${expr.op} ${exprToSql((expr as AndExpr<T>).right)})`;
  }
  const w = expr as WhereExpr<T>;
  return `${String(w.column)} ${w.op} ${JSON.stringify(w.value)}`;
}

// --- 17. SELECT query object type ---
type SelectQuery<T extends Table<string, Record<string, unknown>>> = {
  from: T["__name"];
  cols: (Columns<T> | "*")[];
  where?: WhereExpr<T> | AndExpr<T> | OrExpr<T>;
  orderBy?: { col: Columns<T>; dir: "ASC" | "DESC" };
  limit?: number;
  offset?: number;
};
const B17_query: SelectQuery<UsersTable> = {
  from: "users",
  cols: ["id", "name"],
  where: { column: "age", op: ">=", value: 18 },
  orderBy: { col: "name", dir: "ASC" },
  limit: 20,
  offset: 0,
};

// --- 18. Convert SelectQuery to SQL string ---
function queryToSql<T extends Table<string, Record<string, unknown>>>(q: SelectQuery<T>): string {
  let sql = `SELECT ${q.cols.join(", ")} FROM ${q.from}`;
  if (q.where) sql += ` WHERE ${exprToSql(q.where)}`;
  if (q.orderBy) sql += ` ORDER BY ${String(q.orderBy.col)} ${q.orderBy.dir}`;
  if (q.limit !== undefined) sql += ` LIMIT ${q.limit}`;
  if (q.offset !== undefined) sql += ` OFFSET ${q.offset}`;
  return sql;
}
const B18_sql = queryToSql(B17_query);

// --- 19. INSERT query type ---
type InsertQuery<T extends Table<string, Record<string, unknown>>> = {
  into: T["__name"];
  values: Partial<T["__columns"]>[];
};

// --- 20. INSERT to SQL ---
function insertToSql<T extends Table<string, Record<string, unknown>>>(q: InsertQuery<T>): string {
  const cols = Object.keys(q.values[0] ?? {});
  const vals = q.values.map(row =>
    `(${cols.map(c => JSON.stringify((row as Record<string, unknown>)[c])).join(", ")})`
  ).join(", ");
  return `INSERT INTO ${q.into} (${cols.join(", ")}) VALUES ${vals}`;
}

// --- 21. UPDATE query type ---
type UpdateQuery<T extends Table<string, Record<string, unknown>>> = {
  table: T["__name"];
  set: Partial<T["__columns"]>;
  where?: WhereExpr<T>;
};
function updateToSql<T extends Table<string, Record<string, unknown>>>(q: UpdateQuery<T>): string {
  const sets = Object.entries(q.set)
    .map(([k, v]) => `${k} = ${JSON.stringify(v)}`).join(", ");
  let sql = `UPDATE ${q.table} SET ${sets}`;
  if (q.where) sql += ` WHERE ${exprToSql(q.where)}`;
  return sql;
}

// --- 22. DELETE query type ---
type DeleteQuery<T extends Table<string, Record<string, unknown>>> = {
  from: T["__name"];
  where?: WhereExpr<T>;
};
function deleteToSql<T extends Table<string, Record<string, unknown>>>(q: DeleteQuery<T>): string {
  let sql = `DELETE FROM ${q.from}`;
  if (q.where) sql += ` WHERE ${exprToSql(q.where)}`;
  return sql;
}

// --- 23. COUNT query ---
function count(table: string, where?: string): string {
  let sql = `SELECT COUNT(*) FROM ${table}`;
  if (where) sql += ` WHERE ${where}`;
  return sql;
}
const B23_sql = count("users", "active = true");

// --- 24. JOIN type ---
type JoinType = "INNER" | "LEFT" | "RIGHT" | "FULL";
type Join<
  A extends Table<string, Record<string, unknown>>,
  B extends Table<string, Record<string, unknown>>,
  JK extends keyof A["__columns"] & keyof B["__columns"]
> = {
  type: JoinType;
  table: B["__name"];
  on: JK;
};

// --- 25. JOIN SQL builder ---
function join(sql: string, type: JoinType, table: string, on: string): string {
  return `${sql} ${type} JOIN ${table} ON ${on}`;
}
const B25_sql = join(select("users", "users.id", "posts.title"), "INNER", "posts", "users.id = posts.user_id");

// --- 26. GROUP BY builder ---
function groupBy(sql: string, ...cols: string[]): string {
  return `${sql} GROUP BY ${cols.join(", ")}`;
}
const B26_sql = groupBy(select("users", "country", "COUNT(*)"), "country");

// --- 27. HAVING builder ---
function having(sql: string, condition: string): string {
  return `${sql} HAVING ${condition}`;
}
const B27_sql = having(groupBy(select("users", "country", "COUNT(*)"), "country"), "COUNT(*) > 10");

// --- 28. DISTINCT builder ---
function distinct(sql: string): string {
  return sql.replace("SELECT ", "SELECT DISTINCT ");
}
const B28_sql = distinct(select("users", "country"));

// --- 29. Subquery type ---
type Subquery<T extends Table<string, Record<string, unknown>>> = {
  query: SelectQuery<T>;
  alias: string;
};
function subquery<T extends Table<string, Record<string, unknown>>>(q: SelectQuery<T>, alias: string): string {
  return `(${queryToSql(q)}) AS ${alias}`;
}

// --- 30. IN clause ---
function inClause(col: string, values: (string | number)[]): string {
  return `${col} IN (${values.map(v => JSON.stringify(v)).join(", ")})`;
}
const B30_sql = where_(select("users"), inClause("id", [1, 2, 3]));

// --- 31. NOT IN clause ---
function notIn(col: string, values: (string | number)[]): string {
  return `${col} NOT IN (${values.map(v => JSON.stringify(v)).join(", ")})`;
}

// --- 32. BETWEEN clause ---
function between(col: string, lo: number, hi: number): string {
  return `${col} BETWEEN ${lo} AND ${hi}`;
}
const B32_sql = where_(select("users"), between("age", 18, 65));

// --- 33. LIKE clause ---
function like(col: string, pattern: string): string {
  return `${col} LIKE '${pattern}'`;
}
const B33_sql = where_(select("users"), like("name", "Al%"));

// --- 34. IS NULL clause ---
function isNull(col: string): string { return `${col} IS NULL`; }
function isNotNull(col: string): string { return `${col} IS NOT NULL`; }
const B34_sql = where_(select("users"), isNull("deleted_at"));

// --- 35. CASE WHEN expression ---
function caseWhen(cases: { when: string; then: string }[], else_?: string): string {
  const whens = cases.map(c => `WHEN ${c.when} THEN ${c.then}`).join(" ");
  return `CASE ${whens}${else_ ? ` ELSE ${else_}` : ""} END`;
}
const B35_sql = caseWhen([{ when: "age < 18", then: "'minor'" }, { when: "age < 65", then: "'adult'" }], "'senior'");

// --- 36. Aggregate functions ---
function sum(col: string): string { return `SUM(${col})`; }
function avg(col: string): string { return `AVG(${col})`; }
function min_(col: string): string { return `MIN(${col})`; }
function max_(col: string): string { return `MAX(${col})`; }
function count_(col: string = "*"): string { return `COUNT(${col})`; }
const B36_sql = select("users", "country", sum("age"), avg("age"), count_());

// --- 37. UNION builder ---
function union(...queries: string[]): string { return queries.join(" UNION "); }
function unionAll(...queries: string[]): string { return queries.join(" UNION ALL "); }
const B37_sql = union(where_(select("users", "name"), "age < 18"), where_(select("users", "name"), "age >= 65"));

// --- 38. Parameterized query (prevent SQL injection) ---
type Params = (string | number | boolean | null)[];
type ParameterizedQuery = { sql: string; params: Params };
function paramQuery(sql: string, ...params: Params): ParameterizedQuery {
  return { sql, params };
}
const B38_q = paramQuery("SELECT * FROM users WHERE id = ? AND active = ?", 1, true);

// --- 39. Named parameters ---
type NamedParams = Record<string, string | number | boolean | null>;
type NamedQuery = { sql: string; params: NamedParams };
function namedQuery(sql: string, params: NamedParams): NamedQuery {
  return { sql, params };
}
const B39_q = namedQuery("SELECT * FROM users WHERE id = :id", { id: 1 });

// --- 40. CTE (Common Table Expression) ---
function withCte(name: string, query: string, main: string): string {
  return `WITH ${name} AS (${query}) ${main}`;
}
const B40_sql = withCte("recent", "SELECT * FROM posts ORDER BY created_at DESC LIMIT 10", "SELECT * FROM recent WHERE author_id = 1");

// --- 41. Window function ---
function over(fn: string, partitionBy?: string, orderBy?: string): string {
  const parts: string[] = [];
  if (partitionBy) parts.push(`PARTITION BY ${partitionBy}`);
  if (orderBy) parts.push(`ORDER BY ${orderBy}`);
  return `${fn} OVER (${parts.join(" ")})`;
}
const B41_sql = over("ROW_NUMBER()", "department", "salary DESC");

// --- 42. CREATE TABLE builder ---
function createTable(name: string, cols: Record<string, string>): string {
  const colDefs = Object.entries(cols).map(([c, t]) => `${c} ${t}`).join(", ");
  return `CREATE TABLE ${name} (${colDefs})`;
}
const B42_sql = createTable("users", { id: "SERIAL PRIMARY KEY", name: "VARCHAR(100) NOT NULL", email: "VARCHAR(255) UNIQUE" });

// --- 43. DROP TABLE builder ---
function dropTable(name: string, ifExists = true): string {
  return `DROP TABLE ${ifExists ? "IF EXISTS " : ""}${name}`;
}
const B43_sql = dropTable("users");

// --- 44. ALTER TABLE builder ---
function addColumn(table: string, col: string, type_: string): string {
  return `ALTER TABLE ${table} ADD COLUMN ${col} ${type_}`;
}
function dropColumn(table: string, col: string): string {
  return `ALTER TABLE ${table} DROP COLUMN ${col}`;
}
const B44_sql = addColumn("users", "phone", "VARCHAR(20)");

// --- 45. CREATE INDEX builder ---
function createIndex(table: string, cols: string[], unique = false): string {
  return `CREATE ${unique ? "UNIQUE " : ""}INDEX ON ${table} (${cols.join(", ")})`;
}
const B45_sql = createIndex("users", ["email"], true);

// --- 46. Transaction builder ---
function transaction(...queries: string[]): string {
  return ["BEGIN", ...queries, "COMMIT"].join("; ");
}
const B46_sql = transaction(
  insertToSql({ into: "users", values: [{ name: "Alice", email: "alice@example.com" }] }),
  updateToSql({ table: "users", set: { age: 30 }, where: { column: "name", op: "=", value: "Alice" } })
);

// --- 47. EXPLAIN query ---
function explain(query: string, analyze = false): string {
  return `EXPLAIN ${analyze ? "ANALYZE " : ""}${query}`;
}
const B47_sql = explain(select("users"), true);

// --- 48. COPY bulk load ---
function copy(table: string, cols: string[], fromFile: string): string {
  return `COPY ${table} (${cols.join(", ")}) FROM '${fromFile}' CSV HEADER`;
}
const B48_sql = copy("users", ["name", "email"], "/tmp/users.csv");

// --- 49. View builder ---
function createView(name: string, query: string): string {
  return `CREATE OR REPLACE VIEW ${name} AS ${query}`;
}
const B49_sql = createView("active_users", where_(select("users"), "deleted_at IS NULL"));

// --- 50. Query runner interface ---
interface QueryRunner {
  query<T>(sql: string, params?: Params): Promise<{ rows: T[]; rowCount: number }>;
  execute(sql: string, params?: Params): Promise<{ rowCount: number }>;
}
class MockQueryRunner implements QueryRunner {
  async query<T>(sql: string, params?: Params): Promise<{ rows: T[]; rowCount: number }> {
    console.log("Query:", sql, params);
    return { rows: [], rowCount: 0 };
  }
  async execute(sql: string, params?: Params): Promise<{ rowCount: number }> {
    console.log("Execute:", sql, params);
    return { rowCount: 0 };
  }
}
const B50_runner = new MockQueryRunner();
