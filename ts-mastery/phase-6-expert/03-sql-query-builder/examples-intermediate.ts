export {};

// ============================================================
// Phase 6 – Expert: SQL Query Builder — INTERMEDIATE (1–50)
// ============================================================

// Shared types
type Params = (string | number | boolean | null)[];
type Table<N extends string, C extends Record<string, unknown>> = { __name: N; __columns: C };
type ColName<T extends Table<string, Record<string, unknown>>> = keyof T["__columns"] & string;
type ColType<T extends Table<string, Record<string, unknown>>, C extends ColName<T>> = T["__columns"][C];

// Tables
type Users = Table<"users", { id: number; name: string; email: string; age: number; active: boolean }>;
type Posts = Table<"posts", { id: number; userId: number; title: string; body: string; publishedAt: string | null }>;
type Tags = Table<"tags", { id: number; postId: number; name: string }>;

// --- 1. Fluent query builder class ---
class QB<T extends Table<string, Record<string, unknown>>, Result = T["__columns"]> {
  protected _from: string;
  protected _cols: string[] = ["*"];
  protected _wheres: string[] = [];
  protected _joins: string[] = [];
  protected _orderBys: string[] = [];
  protected _groupBys: string[] = [];
  protected _havings: string[] = [];
  protected _limit?: number;
  protected _offset?: number;
  protected _params: Params = [];
  constructor(table: T) { this._from = table.__name; }

  select(...cols: ColName<T>[]): this { this._cols = cols.length > 0 ? cols : ["*"]; return this; }
  where(col: ColName<T>, op: string, value: T["__columns"][ColName<T>]): this {
    this._wheres.push(`${col} ${op} ?`);
    this._params.push(value as string | number | boolean | null);
    return this;
  }
  orderBy(col: ColName<T>, dir: "ASC" | "DESC" = "ASC"): this { this._orderBys.push(`${col} ${dir}`); return this; }
  groupBy(...cols: ColName<T>[]): this { this._groupBys.push(...cols); return this; }
  having(expr: string, ...params: Params): this { this._havings.push(expr); this._params.push(...params); return this; }
  limit(n: number): this { this._limit = n; return this; }
  offset(n: number): this { this._offset = n; return this; }
  toSQL(): { sql: string; params: Params } {
    let sql = `SELECT ${this._cols.join(", ")} FROM ${this._from}`;
    if (this._joins.length) sql += " " + this._joins.join(" ");
    if (this._wheres.length) sql += " WHERE " + this._wheres.join(" AND ");
    if (this._groupBys.length) sql += " GROUP BY " + this._groupBys.join(", ");
    if (this._havings.length) sql += " HAVING " + this._havings.join(" AND ");
    if (this._orderBys.length) sql += " ORDER BY " + this._orderBys.join(", ");
    if (this._limit !== undefined) sql += ` LIMIT ${this._limit}`;
    if (this._offset !== undefined) sql += ` OFFSET ${this._offset}`;
    return { sql, params: this._params };
  }
}

// --- 2. QB with JOIN support ---
class QBWithJoin<T extends Table<string, Record<string, unknown>>, Result = T["__columns"]> extends QB<T, Result> {
  join<J extends Table<string, Record<string, unknown>>>(
    joinTable: J, localCol: ColName<T>, remoteCol: ColName<J>, type: "INNER" | "LEFT" | "RIGHT" = "INNER"
  ): QBWithJoin<T, Result & J["__columns"]> {
    this._joins.push(`${type} JOIN ${joinTable.__name} ON ${this._from}.${localCol} = ${joinTable.__name}.${String(remoteCol)}`);
    return this as unknown as QBWithJoin<T, Result & J["__columns"]>;
  }
}

const I2_usersTable: Users = { __name: "users", __columns: { id: 0, name: "", email: "", age: 0, active: true } };
const I2_postsTable: Posts = { __name: "posts", __columns: { id: 0, userId: 0, title: "", body: "", publishedAt: null } };

// --- 3. Scoped queries (reusable query parts) ---
type Scope<T extends Table<string, Record<string, unknown>>> = (qb: QB<T>) => QB<T>;
function activeScope<T extends Table<string, Record<string, unknown> & { active: boolean }>>(qb: QB<T>): QB<T> {
  return qb.where("active" as ColName<T>, "=", true);
}
function paginateScope<T extends Table<string, Record<string, unknown>>>(page: number, size: number): Scope<T> {
  return qb => qb.limit(size).offset((page - 1) * size);
}

// --- 4. Query builder with named parameters ---
class NamedQB<T extends Table<string, Record<string, unknown>>> {
  private sql: string[] = [];
  private namedParams: Record<string, Params[number]> = {};
  constructor(private table: T) { this.sql.push(`FROM ${table.__name}`); }
  where(col: ColName<T>, op: string, paramName: string, value: Params[number]): this {
    this.sql.push(`WHERE ${col} ${op} :${paramName}`);
    this.namedParams[paramName] = value;
    return this;
  }
  toSQL(): { sql: string; params: Record<string, Params[number]> } {
    return { sql: `SELECT * ${this.sql.join(" ")}`, params: this.namedParams };
  }
}

// --- 5. Query builder with type-safe column selection ---
type SelectedResult<T extends Table<string, Record<string, unknown>>, Cols extends ColName<T>> = {
  [C in Cols]: T["__columns"][C]
};
function typedSelect<T extends Table<string, Record<string, unknown>>, Cols extends ColName<T>>(
  table: T, ...cols: Cols[]
): { query: QB<T, SelectedResult<T, Cols>> } {
  const qb = new QB<T, SelectedResult<T, Cols>>(table);
  qb.select(...(cols as ColName<T>[]));
  return { query: qb };
}

// --- 6. WHERE IN subquery builder ---
class SubqueryQB<T extends Table<string, Record<string, unknown>>> {
  private qb: QB<T>;
  constructor(table: T) { this.qb = new QB<T>(table); }
  as<O extends Table<string, Record<string, unknown>>>(outerQB: QB<O>, col: ColName<O>, inCol: ColName<T>): QB<O> {
    const { sql, params } = this.qb.toSQL();
    (outerQB as unknown as { _wheres: string[]; _params: Params })["_wheres"].push(
      `${String(col)} IN (SELECT ${String(inCol)} FROM ${this.qb["_from"]})`
    );
    return outerQB;
  }
}

// --- 7. Query result type with row count ---
type PaginatedResult<T> = {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};
function paginatedResult<T>(rows: T[], total: number, page: number, pageSize: number): PaginatedResult<T> {
  return { rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

// --- 8. Query builder with OR WHERE support ---
class OrWhereQB<T extends Table<string, Record<string, unknown>>> extends QB<T> {
  private _orWheres: string[] = [];
  orWhere(col: ColName<T>, op: string, value: T["__columns"][ColName<T>]): this {
    this._orWheres.push(`${col} ${op} ?`);
    this._params.push(value as Params[number]);
    return this;
  }
  toSQL(): { sql: string; params: Params } {
    const base = super.toSQL();
    if (this._orWheres.length) {
      const orClause = this._orWheres.join(" OR ");
      return { sql: base.sql.replace("WHERE", `WHERE (${this._wheres.join(" AND ")}) OR (${orClause})`).replace(" WHERE ", " WHERE "), params: base.params };
    }
    return base;
  }
}

// --- 9. Query builder middleware (transforms before execute) ---
type QBMiddleware<T extends Table<string, Record<string, unknown>>> = (qb: QB<T>) => QB<T>;
function applyMiddleware<T extends Table<string, Record<string, unknown>>>(
  qb: QB<T>, ...mws: QBMiddleware<T>[]
): QB<T> {
  return mws.reduce((q, mw) => mw(q), qb);
}
const I9_softDeleteMw: QBMiddleware<Users> = qb => qb; // would add deleted_at IS NULL

// --- 10. Type-safe INSERT builder ---
class InsertQB<T extends Table<string, Record<string, unknown>>> {
  private rows: Partial<T["__columns"]>[] = [];
  constructor(private table: T) {}
  values(row: Partial<T["__columns"]>): this { this.rows.push(row); return this; }
  toSQL(): { sql: string; params: Params } {
    const cols = Object.keys(this.rows[0] ?? {});
    const placeholders = this.rows.map(() => `(${cols.map(() => "?").join(", ")})`).join(", ");
    const params: Params = this.rows.flatMap(row => cols.map(c => (row as Record<string, Params[number]>)[c]));
    return { sql: `INSERT INTO ${this.table.__name} (${cols.join(", ")}) VALUES ${placeholders}`, params };
  }
}

// --- 11. Type-safe UPDATE builder ---
class UpdateQB<T extends Table<string, Record<string, unknown>>> {
  private _set: Partial<T["__columns"]> = {};
  private _wheres: string[] = [];
  private _params: Params = [];
  constructor(private table: T) {}
  set(data: Partial<T["__columns"]>): this { Object.assign(this._set, data); return this; }
  where(col: ColName<T>, op: string, value: T["__columns"][ColName<T>]): this {
    this._wheres.push(`${col} ${op} ?`);
    this._params.push(value as Params[number]);
    return this;
  }
  toSQL(): { sql: string; params: Params } {
    const entries = Object.entries(this._set);
    const setClause = entries.map(([k]) => `${k} = ?`).join(", ");
    const setParams: Params = entries.map(([, v]) => v as Params[number]);
    let sql = `UPDATE ${this.table.__name} SET ${setClause}`;
    if (this._wheres.length) sql += ` WHERE ${this._wheres.join(" AND ")}`;
    return { sql, params: [...setParams, ...this._params] };
  }
}

// --- 12. CTE builder ---
class CteQB<T extends Table<string, Record<string, unknown>>> {
  private ctes: { name: string; query: string }[] = [];
  private mainQB: QB<T>;
  constructor(table: T) { this.mainQB = new QB<T>(table); }
  with_(name: string, qb: QB<T>): this { this.ctes.push({ name, query: qb.toSQL().sql }); return this; }
  main(): QB<T> { return this.mainQB; }
  toSQL(): string {
    const cteStr = this.ctes.map(c => `${c.name} AS (${c.query})`).join(", ");
    return `WITH ${cteStr} ${this.mainQB.toSQL().sql}`;
  }
}

// --- 13. Recursive CTE (e.g., tree queries) ---
function recursiveCte(name: string, baseCase: string, recursiveCase: string, main: string): string {
  return `WITH RECURSIVE ${name} AS (${baseCase} UNION ALL ${recursiveCase}) ${main}`;
}
const I13_sql = recursiveCte(
  "tree",
  "SELECT id, name, parent_id FROM categories WHERE parent_id IS NULL",
  "SELECT c.id, c.name, c.parent_id FROM categories c JOIN tree t ON c.parent_id = t.id",
  "SELECT * FROM tree"
);

// --- 14. Upsert (INSERT ON CONFLICT) builder ---
function upsert(table: string, data: Record<string, unknown>, conflictCol: string): { sql: string; params: Params } {
  const cols = Object.keys(data);
  const vals = Object.values(data) as Params;
  const updates = cols.map(c => `${c} = EXCLUDED.${c}`).join(", ");
  const sql = `INSERT INTO ${table} (${cols.join(", ")}) VALUES (${cols.map(() => "?").join(", ")}) ON CONFLICT (${conflictCol}) DO UPDATE SET ${updates}`;
  return { sql, params: vals };
}
const I14_upsert = upsert("users", { name: "Alice", email: "alice@test.com" }, "email");

// --- 15. Batch insert with chunking ---
function batchInsert<T extends Table<string, Record<string, unknown>>>(
  table: T, rows: Partial<T["__columns"]>[], chunkSize = 100
): { sql: string; params: Params }[] {
  const results: { sql: string; params: Params }[] = [];
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const qb = new InsertQB<T>(table);
    chunk.forEach(r => qb.values(r));
    results.push(qb.toSQL());
  }
  return results;
}

// --- 16. Query builder with soft-delete support ---
class SoftDeleteQB<T extends Table<string, Record<string, unknown> & { deleted_at: string | null }>> extends QB<T> {
  withDeleted(): this { return this; }
  onlyDeleted(): this { return this.where("deleted_at" as ColName<T>, "IS NOT", null); }
  noDeleted(): this { return this.where("deleted_at" as ColName<T>, "IS", null); }
}

// --- 17. Query aggregations ---
type AggResult<T extends Table<string, Record<string, unknown>>> = {
  [K in ColName<T>]?: number | string
} & { count: number };
function aggregate<T extends Table<string, Record<string, unknown>>>(
  table: T,
  groupBy: ColName<T>[],
  fns: { fn: "COUNT" | "SUM" | "AVG" | "MIN" | "MAX"; col: ColName<T>; alias: string }[]
): { sql: string } {
  const aggCols = fns.map(f => `${f.fn}(${f.col}) AS ${f.alias}`);
  const sql = `SELECT ${[...groupBy, ...aggCols].join(", ")} FROM ${table.__name} GROUP BY ${groupBy.join(", ")}`;
  return { sql };
}

// --- 18. Query builder with window functions ---
function rowNumber(partitionBy?: string, orderBy?: string): string {
  const parts: string[] = [];
  if (partitionBy) parts.push(`PARTITION BY ${partitionBy}`);
  if (orderBy) parts.push(`ORDER BY ${orderBy}`);
  return `ROW_NUMBER() OVER (${parts.join(" ")})`;
}
function rank_(partitionBy?: string, orderBy?: string): string {
  const parts: string[] = [];
  if (partitionBy) parts.push(`PARTITION BY ${partitionBy}`);
  if (orderBy) parts.push(`ORDER BY ${orderBy}`);
  return `RANK() OVER (${parts.join(" ")})`;
}
function lag(col: string, offset = 1, default_?: string): string {
  return `LAG(${col}, ${offset}${default_ ? `, ${default_}` : ""}) OVER ()`;
}
function lead(col: string, offset = 1, default_?: string): string {
  return `LEAD(${col}, ${offset}${default_ ? `, ${default_}` : ""}) OVER ()`;
}

// --- 19. Query migration runner ---
type Migration = { version: number; name: string; up: string; down: string };
class MigrationRunner {
  private applied: number[] = [];
  async runUp(migrations: Migration[], runner: { execute: (sql: string) => Promise<void> }): Promise<void> {
    for (const m of migrations.sort((a, b) => a.version - b.version)) {
      if (!this.applied.includes(m.version)) {
        await runner.execute(m.up);
        this.applied.push(m.version);
      }
    }
  }
}

// --- 20. Query plan analyzer ---
type QueryPlan = { operation: string; table: string; index?: string; rows: number; cost: number };
function analyzeQuery(sql: string): Promise<QueryPlan[]> {
  return Promise.resolve([
    { operation: "Seq Scan", table: "users", rows: 1000, cost: 10.5 },
    { operation: "Index Scan", table: "posts", index: "posts_userId_idx", rows: 5, cost: 0.2 },
  ]);
}

// --- 21. Query cache ---
class QueryCache {
  private cache = new Map<string, { result: unknown; expires: number }>();
  async cached<T>(key: string, ttlMs: number, fn: () => Promise<T>): Promise<T> {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expires) return cached.result as T;
    const result = await fn();
    this.cache.set(key, { result, expires: Date.now() + ttlMs });
    return result;
  }
}

// --- 22. Query statistics ---
type QueryStat = { sql: string; durationMs: number; rows: number; timestamp: Date };
class QueryProfiler {
  private stats: QueryStat[] = [];
  async profile<T>(sql: string, fn: () => Promise<{ rows: T[]; rowCount: number }>): Promise<{ rows: T[]; rowCount: number }> {
    const start = Date.now();
    const result = await fn();
    this.stats.push({ sql, durationMs: Date.now() - start, rows: result.rowCount, timestamp: new Date() });
    return result;
  }
  report(): QueryStat[] { return [...this.stats]; }
}

// --- 23. Type-safe ORDER BY with multiple columns ---
type OrderByClause<T extends Table<string, Record<string, unknown>>> = {
  col: ColName<T>;
  dir: "ASC" | "DESC";
  nulls?: "FIRST" | "LAST";
}[];
function orderByClause<T extends Table<string, Record<string, unknown>>>(clauses: OrderByClause<T>): string {
  return clauses.map(c => `${c.col} ${c.dir}${c.nulls ? ` NULLS ${c.nulls}` : ""}`).join(", ");
}

// --- 24. Query builder plugin system ---
type QBPlugin<T extends Table<string, Record<string, unknown>>> = {
  name: string;
  transform: (qb: QB<T>) => QB<T>;
};
function withPlugins<T extends Table<string, Record<string, unknown>>>(
  qb: QB<T>, plugins: QBPlugin<T>[]
): QB<T> {
  return plugins.reduce((q, p) => p.transform(q), qb);
}

// --- 25. Query builder factory ---
function qbFactory<T extends Table<string, Record<string, unknown>>>(table: T) {
  return {
    select: (...cols: ColName<T>[]) => new QB<T>(table).select(...cols),
    insert: () => new InsertQB<T>(table),
    update: () => new UpdateQB<T>(table),
  };
}

// --- 26. Typed JOIN result merging ---
type JoinedRow<A extends Record<string, unknown>, B extends Record<string, unknown>, AAlias extends string, BAlias extends string> = {
  [K in keyof A as `${AAlias}.${K & string}`]: A[K]
} & {
  [K in keyof B as `${BAlias}.${K & string}`]: B[K]
};
type I26 = JoinedRow<{ id: number; name: string }, { id: number; userId: number; title: string }, "u", "p">;

// --- 27. Lateral join builder ---
function lateralJoin(main: string, lateral: string, alias: string): string {
  return `${main}, LATERAL (${lateral}) ${alias}`;
}
const I27_sql = lateralJoin(
  "SELECT * FROM users u",
  "SELECT * FROM posts WHERE user_id = u.id ORDER BY created_at DESC LIMIT 5",
  "recent_posts"
);

// --- 28. FULL TEXT SEARCH query ---
function fullTextSearch(table: string, cols: string[], query: string): { sql: string; params: Params } {
  const tsv = cols.map(c => `to_tsvector(${c})`).join(" || ");
  return {
    sql: `SELECT * FROM ${table} WHERE (${tsv}) @@ plainto_tsquery(?)`,
    params: [query],
  };
}
const I28_q = fullTextSearch("posts", ["title", "body"], "TypeScript generics");

// --- 29. JSONB query operators ---
function jsonbContains(col: string, value: object): { sql: string; params: Params } {
  return { sql: `${col} @> ?::jsonb`, params: [JSON.stringify(value)] };
}
function jsonbPath(col: string, path: string): string {
  return `${col} -> '${path}'`;
}
function jsonbPathText(col: string, path: string): string {
  return `${col} ->> '${path}'`;
}

// --- 30. Array operators (PostgreSQL) ---
function arrayContains(col: string, value: unknown): string { return `? = ANY(${col})`; }
function arrayOverlap(col: string, values: unknown[]): string { return `${col} && ARRAY[${values.map(v => JSON.stringify(v)).join(",")}]`; }
function arrayAppend(col: string, value: unknown): string { return `array_append(${col}, ?)`; }

// --- 31. Range types (PostgreSQL) ---
function tsRange(start: string, end: string): string { return `tstzrange('${start}', '${end}')`; }
function intRange(lo: number, hi: number): string { return `int4range(${lo}, ${hi})`; }
function rangeContains(col: string, value: string): string { return `${col} @> '${value}'::timestamptz`; }

// --- 32. GeoSpatial query (PostGIS) ---
function stDistance(colA: string, colB: string): string { return `ST_Distance(${colA}, ${colB})`; }
function stWithin(col: string, geom: string, radius: number): string {
  return `ST_DWithin(${col}, ST_GeomFromText('${geom}'), ${radius})`;
}

// --- 33. Transaction builder with savepoints ---
class TransactionBuilder {
  private ops: string[] = [];
  begin(): this { this.ops.push("BEGIN"); return this; }
  savepoint(name: string): this { this.ops.push(`SAVEPOINT ${name}`); return this; }
  rollbackTo(name: string): this { this.ops.push(`ROLLBACK TO SAVEPOINT ${name}`); return this; }
  release(name: string): this { this.ops.push(`RELEASE SAVEPOINT ${name}`); return this; }
  addOp(sql: string): this { this.ops.push(sql); return this; }
  commit(): this { this.ops.push("COMMIT"); return this; }
  toSQL(): string { return this.ops.join(";\n"); }
}

// --- 34. Query dry-run / explain ---
type ExplainResult = { plan: string; cost: string; rows: number; width: number };
function explainQuery(sql: string, analyze = false): string {
  return `EXPLAIN ${analyze ? "ANALYZE " : ""}${sql}`;
}

// --- 35. Schema inspector ---
class SchemaInspector {
  async getTables(runner: { query: <T>(sql: string) => Promise<{ rows: T[] }> }): Promise<string[]> {
    const { rows } = await runner.query<{ table_name: string }>(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'"
    );
    return rows.map(r => r.table_name);
  }
  async getColumns(runner: { query: <T>(sql: string, params?: unknown[]) => Promise<{ rows: T[] }> }, table: string): Promise<{ name: string; type: string }[]> {
    const { rows } = await runner.query<{ column_name: string; data_type: string }>(
      "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1",
      [table]
    );
    return rows.map(r => ({ name: r.column_name, type: r.data_type }));
  }
}

// --- 36. Query builder with automatic pagination total ---
async function withTotal<T>(
  qb: QB<T extends Table<string, Record<string, unknown>> ? T : Table<string, Record<string, unknown>>>,
  runner: { query: <R>(sql: string, params?: Params) => Promise<{ rows: R[]; rowCount: number }> }
): Promise<{ rows: T[]; total: number }> {
  const { sql, params } = qb.toSQL();
  const countSql = `SELECT COUNT(*) as count FROM (${sql}) sub`;
  const [dataResult, countResult] = await Promise.all([
    runner.query<T>(sql, params),
    runner.query<{ count: string }>(countSql, params),
  ]);
  return { rows: dataResult.rows, total: parseInt(countResult.rows[0]?.count ?? "0", 10) };
}

// --- 37. MERGE statement builder ---
function merge(target: string, source: string, on: string, whenMatched: string, whenNotMatched: string): string {
  return `MERGE INTO ${target} USING ${source} ON ${on} WHEN MATCHED THEN ${whenMatched} WHEN NOT MATCHED THEN ${whenNotMatched}`;
}

// --- 38. PIVOT query builder ---
function pivot(table: string, rowCol: string, colCol: string, valCol: string, pivotVals: string[]): string {
  const cases = pivotVals.map(v =>
    `MAX(CASE WHEN ${colCol} = '${v}' THEN ${valCol} END) AS "${v}"`
  ).join(", ");
  return `SELECT ${rowCol}, ${cases} FROM ${table} GROUP BY ${rowCol}`;
}
const I38_pivot = pivot("sales", "product", "month", "amount", ["Jan", "Feb", "Mar"]);

// --- 39. Query builder with field aliases ---
class AliasQB<T extends Table<string, Record<string, unknown>>> extends QB<T> {
  selectAs(col: ColName<T>, alias: string): this {
    this._cols = this._cols.filter(c => c !== "*");
    this._cols.push(`${col} AS ${alias}`);
    return this;
  }
}

// --- 40. Stored procedure call builder ---
function callProc(name: string, ...args: Params): { sql: string; params: Params } {
  return { sql: `CALL ${name}(${args.map(() => "?").join(", ")})`, params: args };
}
const I40_call = callProc("update_user_stats", 1, new Date().toISOString());

// --- 41. COPY TO (export) builder ---
function copyTo(query: string, file: string, format = "CSV"): string {
  return `COPY (${query}) TO '${file}' WITH ${format} HEADER`;
}

// --- 42. Materialized view builder ---
function createMaterializedView(name: string, query: string): string {
  return `CREATE MATERIALIZED VIEW ${name} AS ${query}`;
}
function refreshMaterializedView(name: string, concurrently = true): string {
  return `REFRESH MATERIALIZED VIEW ${concurrently ? "CONCURRENTLY " : ""}${name}`;
}

// --- 43. Partition table builder ---
function createPartitionedTable(name: string, cols: Record<string, string>, partitionBy: string): string {
  const colDefs = Object.entries(cols).map(([c, t]) => `${c} ${t}`).join(", ");
  return `CREATE TABLE ${name} (${colDefs}) PARTITION BY RANGE (${partitionBy})`;
}
function createPartition(parent: string, child: string, from: string, to: string): string {
  return `CREATE TABLE ${child} PARTITION OF ${parent} FOR VALUES FROM ('${from}') TO ('${to}')`;
}

// --- 44. Type-safe query event hooks ---
type QueryHook = {
  beforeQuery?: (sql: string, params: Params) => void;
  afterQuery?: (sql: string, params: Params, durationMs: number) => void;
  onError?: (sql: string, params: Params, error: Error) => void;
};
class HookedRunner {
  constructor(private hooks: QueryHook) {}
  async query<T>(sql: string, params: Params, fn: () => Promise<T[]>): Promise<T[]> {
    this.hooks.beforeQuery?.(sql, params);
    const start = Date.now();
    try {
      const result = await fn();
      this.hooks.afterQuery?.(sql, params, Date.now() - start);
      return result;
    } catch (e) {
      this.hooks.onError?.(sql, params, e as Error);
      throw e;
    }
  }
}

// --- 45. Multi-database query routing ---
type DbRole = "primary" | "replica";
function routeQuery(sql: string): DbRole {
  const upper = sql.trim().toUpperCase();
  return upper.startsWith("SELECT") ? "replica" : "primary";
}

// --- 46. Query retry with backoff ---
async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts = 3,
  backoffMs = 100
): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try { return await fn(); }
    catch (e) {
      if (attempt === maxAttempts) throw e;
      await new Promise(r => setTimeout(r, backoffMs * attempt));
    }
  }
  throw new Error("Should not reach here");
}

// --- 47. Type-safe bulk delete ---
function bulkDelete<T extends Table<string, Record<string, unknown>>>(
  table: T, ids: T["__columns"][ColName<T>][]
): { sql: string; params: Params } {
  return {
    sql: `DELETE FROM ${table.__name} WHERE id IN (${ids.map(() => "?").join(", ")})`,
    params: ids as Params,
  };
}

// --- 48. Query result mapper ---
function mapResult<T, U>(
  rows: T[],
  mapper: (row: T) => U
): U[] {
  return rows.map(mapper);
}
type DbUser = { user_id: number; user_name: string; user_email: string };
type AppUser = { id: number; name: string; email: string };
const mapUser = (row: DbUser): AppUser => ({ id: row.user_id, name: row.user_name, email: row.user_email });

// --- 49. Query builder with observable results ---
type QueryObserver<T> = { onRow: (row: T) => void; onComplete: () => void; onError: (e: Error) => void };
async function streamQuery<T>(sql: string, params: Params, observer: QueryObserver<T>): Promise<void> {
  try {
    const fakeRows: T[] = [];
    fakeRows.forEach(row => observer.onRow(row));
    observer.onComplete();
  } catch (e) { observer.onError(e as Error); }
}

// --- 50. Full-featured QB with all capabilities ---
class FullQB<T extends Table<string, Record<string, unknown>>> {
  private qb: QB<T>;
  private insertQb?: InsertQB<T>;
  private updateQb?: UpdateQB<T>;
  constructor(private table: T) { this.qb = new QB<T>(table); }
  select(...cols: ColName<T>[]): this { this.qb.select(...cols); return this; }
  where(col: ColName<T>, op: string, val: T["__columns"][ColName<T>]): this { this.qb.where(col, op, val); return this; }
  limit(n: number): this { this.qb.limit(n); return this; }
  offset(n: number): this { this.qb.offset(n); return this; }
  orderBy(col: ColName<T>, dir?: "ASC" | "DESC"): this { this.qb.orderBy(col, dir); return this; }
  paginate(page: number, size: number): this { return this.limit(size).offset((page - 1) * size); }
  toSQL(): { sql: string; params: Params } { return this.qb.toSQL(); }
  async execute(runner: { query: <R>(sql: string, params?: Params) => Promise<{ rows: R[] }> }): Promise<T["__columns"][]> {
    const { sql, params } = this.toSQL();
    const result = await runner.query<T["__columns"]>(sql, params);
    return result.rows;
  }
}
