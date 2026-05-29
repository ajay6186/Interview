export {};

// ============================================================
// Phase 5 – Real World: ORM Types — ADVANCED (1–50)
// ============================================================

// --- 1. Base column type with infer ---
type ColumnType<T> = { _type: T; nullable: boolean; default?: T };
type ColOf<C extends ColumnType<unknown>> = C extends ColumnType<infer T> ? T : never;
function col<T>(nullable: boolean, def?: T): ColumnType<T> {
  return { _type: undefined as unknown as T, nullable, default: def };
}

// --- 2. Table schema definition ---
type TableSchema = Record<string, ColumnType<unknown>>;
type RowType<T extends TableSchema> = {
  [K in keyof T as T[K]["nullable"] extends true ? never : K]: ColOf<T[K]>
} & {
  [K in keyof T as T[K]["nullable"] extends true ? K : never]?: ColOf<T[K]> | null
};
const adv2_usersSchema = {
  id: col<number>(false),
  name: col<string>(false),
  email: col<string>(false),
  bio: col<string>(true),
};
type Adv2_User = RowType<typeof adv2_usersSchema>;

// --- 3. Where clause types ---
type WhereOp<T> =
  | { eq: T }
  | { ne: T }
  | { lt: T }
  | { lte: T }
  | { gt: T }
  | { gte: T }
  | { in: T[] }
  | { notIn: T[] }
  | { like: string }
  | { isNull: boolean };
type WhereClause<T extends TableSchema> = {
  [K in keyof T]?: WhereOp<ColOf<T[K]>>
};
type Adv3_Where = WhereClause<typeof adv2_usersSchema>;

// --- 4. Select type (subset of columns) ---
type SelectClause<T extends TableSchema, K extends keyof T = keyof T> = Pick<RowType<T>, K & keyof RowType<T>>;
type Adv4_NameEmail = SelectClause<typeof adv2_usersSchema, "name" | "email">;

// --- 5. OrderBy type ---
type OrderByClause<T extends TableSchema> = {
  [K in keyof T]?: "asc" | "desc"
};

// --- 6. Query builder with fluent API ---
class QueryBuilder<T extends TableSchema, Result = RowType<T>> {
  private _where: WhereClause<T> = {};
  private _orderBy: OrderByClause<T> = {};
  private _limit?: number;
  private _offset?: number;
  private _select?: (keyof T)[];
  constructor(private tableName: string, private schema: T) {}

  where(clause: WhereClause<T>): this {
    Object.assign(this._where, clause);
    return this;
  }
  orderBy(clause: OrderByClause<T>): this {
    Object.assign(this._orderBy, clause);
    return this;
  }
  limit(n: number): this { this._limit = n; return this; }
  offset(n: number): this { this._offset = n; return this; }
  select<K extends keyof T>(...cols: K[]): QueryBuilder<T, SelectClause<T, K>> {
    this._select = cols as (keyof T)[];
    return this as unknown as QueryBuilder<T, SelectClause<T, K>>;
  }
  toSQL(): string {
    const cols = this._select ? this._select.join(", ") : "*";
    let sql = `SELECT ${cols} FROM ${this.tableName}`;
    const where = Object.entries(this._where);
    if (where.length) sql += " WHERE " + where.map(([k]) => `${k} = ?`).join(" AND ");
    const order = Object.entries(this._orderBy);
    if (order.length) sql += " ORDER BY " + order.map(([k, d]) => `${k} ${d}`).join(", ");
    if (this._limit !== undefined) sql += ` LIMIT ${this._limit}`;
    if (this._offset !== undefined) sql += ` OFFSET ${this._offset}`;
    return sql;
  }
}
const adv6_qb = new QueryBuilder("users", adv2_usersSchema)
  .where({ id: { eq: 1 } })
  .select("name", "email")
  .limit(10);

// --- 7. Insert type ---
type InsertData<T extends TableSchema> = {
  [K in keyof T as T[K]["default"] extends undefined
    ? T[K]["nullable"] extends true ? K : K
    : never]: ColOf<T[K]>
} & {
  [K in keyof T as T[K]["default"] extends undefined ? never : K]?: ColOf<T[K]>
};

// --- 8. Update type (all optional except identifier) ---
type UpdateData<T extends TableSchema, Id extends keyof T = "id" & keyof T> = {
  [Id]: ColOf<T[Id]>
} & {
  [K in Exclude<keyof T, Id>]?: ColOf<T[K]> | (T[K]["nullable"] extends true ? null : never)
};

// --- 9. Relation types ---
type HasOne<T extends TableSchema> = { kind: "hasOne"; schema: T; foreignKey: keyof T };
type HasMany<T extends TableSchema> = { kind: "hasMany"; schema: T; foreignKey: keyof T };
type BelongsTo<T extends TableSchema> = { kind: "belongsTo"; schema: T; foreignKey: string };
type Relation<T extends TableSchema> = HasOne<T> | HasMany<T> | BelongsTo<T>;

// --- 10. Model with relations ---
const postsSchema = {
  id: col<number>(false),
  userId: col<number>(false),
  title: col<string>(false),
  body: col<string>(true),
};
const adv10_userRelations = {
  posts: { kind: "hasMany" as const, schema: postsSchema, foreignKey: "userId" as const },
};
type Adv10_UserWithPosts = Adv2_User & { posts?: RowType<typeof postsSchema>[] };

// --- 11. Join types ---
type JoinType = "inner" | "left" | "right" | "full";
type JoinClause<A extends TableSchema, B extends TableSchema, K extends keyof A & keyof B> = {
  type: JoinType;
  table: string;
  on: K;
};
type JoinedRow<A extends TableSchema, B extends TableSchema> =
  RowType<A> & { [K in keyof RowType<B> as `joined_${string & K}`]: RowType<B>[K] };

// --- 12. Aggregation types ---
type AggFn = "count" | "sum" | "avg" | "min" | "max";
type AggClause<T extends TableSchema> = {
  fn: AggFn;
  col: keyof T;
  alias: string;
};
type AggResult<T extends TableSchema, Aggs extends AggClause<T>[]> =
  { [A in Aggs[number] as A["alias"]]: number };

// --- 13. Transaction type ---
type Transaction<T> = {
  query: <R>(fn: () => Promise<R>) => Promise<R>;
  commit: () => Promise<void>;
  rollback: () => Promise<void>;
  result?: T;
};

// --- 14. Repository pattern ---
interface Repository<T extends TableSchema> {
  findById(id: number): Promise<RowType<T> | null>;
  findAll(where?: WhereClause<T>): Promise<RowType<T>[]>;
  insert(data: Partial<RowType<T>>): Promise<RowType<T>>;
  update(id: number, data: Partial<RowType<T>>): Promise<RowType<T>>;
  delete(id: number): Promise<void>;
}
class InMemoryRepo<T extends TableSchema> implements Repository<T> {
  private store: RowType<T>[] = [];
  async findById(id: number): Promise<RowType<T> | null> {
    return this.store.find(r => (r as Record<string, unknown>)["id"] === id) ?? null;
  }
  async findAll(where?: WhereClause<T>): Promise<RowType<T>[]> { return this.store; }
  async insert(data: Partial<RowType<T>>): Promise<RowType<T>> {
    const row = { id: this.store.length + 1, ...data } as RowType<T>;
    this.store.push(row);
    return row;
  }
  async update(id: number, data: Partial<RowType<T>>): Promise<RowType<T>> {
    const idx = this.store.findIndex(r => (r as Record<string, unknown>)["id"] === id);
    if (idx < 0) throw new Error("Not found");
    this.store[idx] = { ...this.store[idx], ...data };
    return this.store[idx];
  }
  async delete(id: number): Promise<void> {
    this.store = this.store.filter(r => (r as Record<string, unknown>)["id"] !== id);
  }
}

// --- 15. Typed query result pagination ---
type Page<T> = { data: T[]; total: number; page: number; pageSize: number; totalPages: number };
function paginate<T>(data: T[], page: number, pageSize: number): Page<T> {
  const start = (page - 1) * pageSize;
  return {
    data: data.slice(start, start + pageSize),
    total: data.length,
    page,
    pageSize,
    totalPages: Math.ceil(data.length / pageSize),
  };
}

// --- 16. Typed migration ---
type Migration = {
  version: number;
  name: string;
  up: () => Promise<void>;
  down: () => Promise<void>;
};
function migration(version: number, name: string, up: () => Promise<void>, down: () => Promise<void>): Migration {
  return { version, name, up, down };
}
const adv16_m1 = migration(1, "create_users", async () => {}, async () => {});

// --- 17. Schema diff / migration generator ---
type SchemaDiff = { added: string[]; removed: string[]; changed: string[] };
function diffSchema(old: TableSchema, next: TableSchema): SchemaDiff {
  const oldKeys = new Set(Object.keys(old));
  const newKeys = new Set(Object.keys(next));
  return {
    added: [...newKeys].filter(k => !oldKeys.has(k)),
    removed: [...oldKeys].filter(k => !newKeys.has(k)),
    changed: [...newKeys].filter(k => oldKeys.has(k) && JSON.stringify(old[k]) !== JSON.stringify(next[k])),
  };
}

// --- 18. Model hooks (lifecycle) ---
type HookFn<T> = (data: T) => T | Promise<T>;
type ModelHooks<T extends TableSchema> = {
  beforeInsert?: HookFn<Partial<RowType<T>>>;
  afterInsert?: HookFn<RowType<T>>;
  beforeUpdate?: HookFn<Partial<RowType<T>>>;
  afterUpdate?: HookFn<RowType<T>>;
  beforeDelete?: HookFn<number>;
  afterDelete?: HookFn<void>;
};

// --- 19. Typed scope (reusable query fragments) ---
type Scope<T extends TableSchema> = (qb: QueryBuilder<T>) => QueryBuilder<T>;
function activeScope<T extends TableSchema & { deletedAt: ColumnType<Date> }>(qb: QueryBuilder<T>): QueryBuilder<T> {
  return qb.where({ deletedAt: { isNull: true } } as WhereClause<T>);
}
function recentScope<T extends TableSchema>(n: number): Scope<T> {
  return qb => qb.limit(n).orderBy({} as OrderByClause<T>);
}

// --- 20. Typed soft-delete ---
type SoftDeletable<T extends TableSchema> = T & { deletedAt: ColumnType<Date | null> };
function softDelete<T extends TableSchema>(schema: T): SoftDeletable<T> {
  return { ...schema, deletedAt: col<Date | null>(true) };
}
const adv20_softUsers = softDelete(adv2_usersSchema);

// --- 21. Model factory ---
type ModelFactory<T extends TableSchema> = {
  create(data: Partial<RowType<T>>): RowType<T>;
};
function modelFactory<T extends TableSchema>(schema: T, defaults: Partial<RowType<T>>): ModelFactory<T> {
  let id = 1;
  return {
    create(data) {
      return { ...defaults, ...data, id: id++ } as RowType<T>;
    },
  };
}
const adv21_userFactory = modelFactory(adv2_usersSchema, { name: "Test User", email: "test@test.com" });

// --- 22. Seeder type ---
type Seeder<T extends TableSchema> = {
  seed: (repo: Repository<T>, count: number) => Promise<void>;
};
function seeder<T extends TableSchema>(
  factory: ModelFactory<T>
): Seeder<T> {
  return {
    async seed(repo, count) {
      for (let i = 0; i < count; i++) await repo.insert(factory.create({}));
    },
  };
}

// --- 23. Typed event sourcing for ORM ---
type OrmEvent<T extends TableSchema> =
  | { kind: "insert"; data: RowType<T> }
  | { kind: "update"; id: number; changes: Partial<RowType<T>> }
  | { kind: "delete"; id: number };

// --- 24. Schema-to-type mapping at compile time ---
type DBTypes = { string: string; number: number; boolean: boolean; date: Date; json: unknown };
type ColTypeMap<T extends keyof DBTypes> = DBTypes[T];
type TypedCol<T extends keyof DBTypes> = { dbType: T; nullable: boolean };
type TypedRow<T extends Record<string, TypedCol<keyof DBTypes>>> = {
  [K in keyof T]: ColTypeMap<T[K]["dbType"]> | (T[K]["nullable"] extends true ? null : never)
};
const adv24_typedUsersSchema = {
  id: { dbType: "number" as const, nullable: false },
  name: { dbType: "string" as const, nullable: false },
  active: { dbType: "boolean" as const, nullable: false },
};
type Adv24_TypedUser = TypedRow<typeof adv24_typedUsersSchema>;

// --- 25. Query result types with computed fields ---
type WithComputed<T, C extends Record<string, unknown>> = T & C;
type UserWithAge = WithComputed<Adv2_User, { age: number; isAdult: boolean }>;
function addComputedFields(user: Adv2_User): UserWithAge {
  const age = Math.floor(Math.random() * 80);
  return { ...user, age, isAdult: age >= 18 };
}

// --- 26. Typed cursor-based pagination ---
type Cursor<T> = { encode: (row: T) => string; decode: (cursor: string) => Partial<T> };
function cursor<T extends Record<string, unknown>>(key: keyof T): Cursor<T> {
  return {
    encode: row => Buffer.from(JSON.stringify({ [key]: row[key] })).toString("base64"),
    decode: c => JSON.parse(Buffer.from(c, "base64").toString()) as Partial<T>,
  };
}
type CursorPage<T> = { data: T[]; nextCursor?: string; prevCursor?: string; hasMore: boolean };

// --- 27. Typed batch operations ---
type BatchInsert<T extends TableSchema> = { rows: Partial<RowType<T>>[]; chunkSize?: number };
async function batchInsert<T extends TableSchema>(
  repo: Repository<T>, batch: BatchInsert<T>
): Promise<void> {
  const { rows, chunkSize = 100 } = batch;
  for (let i = 0; i < rows.length; i += chunkSize) {
    for (const row of rows.slice(i, i + chunkSize)) await repo.insert(row);
  }
}

// --- 28. Type-safe raw query with parameterized types ---
type RawQuery<P extends unknown[], R> = { sql: string; params: P; result: R };
function raw<P extends unknown[], R>(sql: string, params: P): RawQuery<P, R> {
  return { sql, params, result: undefined as unknown as R };
}
const adv28_q = raw<[number], { count: number }[]>("SELECT count(*) as count FROM users WHERE id > ?", [5]);

// --- 29. Typed stored procedure call ---
type ProcCall<Params extends unknown[], Result> = {
  name: string;
  params: Params;
  execute: () => Promise<Result>;
};
function proc<P extends unknown[], R>(name: string, params: P, fn: (...args: P) => Promise<R>): ProcCall<P, R> {
  return { name, params, execute: () => fn(...params) };
}
const adv29_procCall = proc("get_user", [1], async (id: number) => ({ id, name: "Alice" }));

// --- 30. Unit-of-work pattern ---
class UnitOfWork {
  private operations: (() => Promise<void>)[] = [];
  add(op: () => Promise<void>): this { this.operations.push(op); return this; }
  async commit(): Promise<void> { for (const op of this.operations) await op(); }
  async rollback(): Promise<void> { this.operations = []; }
}
const adv30_uow = new UnitOfWork()
  .add(async () => console.log("insert user"))
  .add(async () => console.log("insert post"));

// --- 31. Discriminated table union ---
type AnyTable =
  | { table: "users"; schema: typeof adv2_usersSchema }
  | { table: "posts"; schema: typeof postsSchema };
function getSchema(table: AnyTable["table"]): TableSchema {
  const map: Record<string, TableSchema> = {
    users: adv2_usersSchema,
    posts: postsSchema,
  };
  return map[table];
}

// --- 32. Typed multi-tenant support ---
type TenantId = string & { __brand: "TenantId" };
type TenantedRepo<T extends TableSchema> = Repository<T> & { tenantId: TenantId };
function withTenant<T extends TableSchema>(repo: Repository<T>, tenantId: TenantId): TenantedRepo<T> {
  return { ...repo, tenantId };
}

// --- 33. Schema versioning ---
type SchemaVersion<V extends number, T extends TableSchema> = { version: V; schema: T };
function schemaV<V extends number, T extends TableSchema>(version: V, schema: T): SchemaVersion<V, T> {
  return { version, schema };
}
const adv33_v1 = schemaV(1, adv2_usersSchema);
const adv33_v2 = schemaV(2, { ...adv2_usersSchema, phone: col<string>(true) });

// --- 34. Typed query cache ---
class QueryCache {
  private cache = new Map<string, { data: unknown; expires: number }>();
  set<T>(key: string, data: T, ttlMs: number): void {
    this.cache.set(key, { data, expires: Date.now() + ttlMs });
  }
  get<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry || Date.now() > entry.expires) { this.cache.delete(key); return undefined; }
    return entry.data as T;
  }
}
const adv34_cache = new QueryCache();

// --- 35. Composite primary key ---
type CompositePk<T extends TableSchema, Keys extends keyof T[]> = Pick<RowType<T>, Keys[number] & keyof RowType<T>>;
const orderItemsSchema = {
  orderId: col<number>(false),
  productId: col<number>(false),
  quantity: col<number>(false),
};
type Adv35_OrderItemPk = CompositePk<typeof orderItemsSchema, ["orderId", "productId"]>;

// --- 36. Typed index definition ---
type IndexDef<T extends TableSchema> = {
  name: string;
  columns: (keyof T)[];
  unique?: boolean;
  partial?: WhereClause<T>;
};
const adv36_emailIdx: IndexDef<typeof adv2_usersSchema> = { name: "users_email_idx", columns: ["email"], unique: true };

// --- 37. Schema constraints ---
type Constraint<T extends TableSchema> =
  | { type: "unique"; columns: (keyof T)[] }
  | { type: "check"; expression: string }
  | { type: "foreignKey"; column: keyof T; references: { table: string; column: string } };
const adv37_fk: Constraint<typeof postsSchema> = {
  type: "foreignKey", column: "userId",
  references: { table: "users", column: "id" }
};

// --- 38. Typed virtual columns (computed) ---
type VirtualCol<T extends TableSchema, R> = { expression: string; type: R };
function virtualCol<T extends TableSchema, R>(expression: string): VirtualCol<T, R> {
  return { expression, type: undefined as unknown as R };
}
const adv38_fullName = virtualCol<typeof adv2_usersSchema, string>("CONCAT(first_name, ' ', last_name)");

// --- 39. Query explain/analyze type ---
type QueryPlan = { steps: QueryPlanStep[] };
type QueryPlanStep = {
  operation: string;
  table?: string;
  rows?: number;
  cost?: number;
  extra?: string;
};
async function explainQuery(qb: QueryBuilder<TableSchema>): Promise<QueryPlan> {
  return { steps: [{ operation: "Seq Scan", table: "users", rows: 1000, cost: 0.5 }] };
}

// --- 40. Model observers ---
type Observer<T extends TableSchema> = {
  onInsert?: (row: RowType<T>) => void;
  onUpdate?: (old: RowType<T>, next: RowType<T>) => void;
  onDelete?: (id: number) => void;
};
function withObserver<T extends TableSchema>(
  repo: Repository<T>, observer: Observer<T>
): Repository<T> {
  return {
    ...repo,
    async insert(data) {
      const row = await repo.insert(data);
      observer.onInsert?.(row);
      return row;
    },
    async update(id, data) {
      const old = await repo.findById(id);
      const next = await repo.update(id, data);
      if (old) observer.onUpdate?.(old, next);
      return next;
    },
    async delete(id) {
      await repo.delete(id);
      observer.onDelete?.(id);
    },
    findById: repo.findById.bind(repo),
    findAll: repo.findAll.bind(repo),
  };
}

// --- 41. Type-safe fixture loading ---
type Fixture<T extends TableSchema> = { tableName: string; data: Partial<RowType<T>>[] };
async function loadFixture<T extends TableSchema>(repo: Repository<T>, fixture: Fixture<T>): Promise<void> {
  for (const row of fixture.data) await repo.insert(row);
}

// --- 42. Model validation decorator ---
type Validator_<T> = (value: T) => string | null;
type ColumnValidators<T extends TableSchema> = { [K in keyof T]?: Validator_<ColOf<T[K]>> };
function validateRow<T extends TableSchema>(
  row: Partial<RowType<T>>,
  validators: ColumnValidators<T>
): string[] {
  const errors: string[] = [];
  for (const [key, validator] of Object.entries(validators)) {
    const v = validator as Validator_<unknown>;
    const err = v((row as Record<string, unknown>)[key]);
    if (err) errors.push(`${key}: ${err}`);
  }
  return errors;
}
const adv42_userValidators: ColumnValidators<typeof adv2_usersSchema> = {
  name: v => (!v || (v as string).length < 2 ? "Name too short" : null),
  email: v => (!v || !(v as string).includes("@") ? "Invalid email" : null),
};

// --- 43. Typed connection pool ---
type PoolConfig = { min: number; max: number; idleTimeoutMs: number };
class ConnectionPool {
  private connections: unknown[] = [];
  constructor(private config: PoolConfig) {}
  acquire(): unknown { return this.connections.pop() ?? {}; }
  release(conn: unknown): void { this.connections.push(conn); }
}

// --- 44. Replication routing (read/write split) ---
type DbRole = "primary" | "replica";
type ConnectionRouter = { route: (op: "read" | "write") => DbRole };
const adv44_router: ConnectionRouter = { route: op => op === "write" ? "primary" : "replica" };

// --- 45. Typed GraphQL resolver from ORM schema ---
type GqlField<T> = { type: string; resolve: (root: T) => unknown };
type GqlType<T extends TableSchema> = { [K in keyof T]: GqlField<RowType<T>> };
function schemaToGql<T extends TableSchema>(schema: T): Partial<GqlType<T>> {
  const fields: Partial<GqlType<T>> = {};
  for (const [key] of Object.entries(schema)) {
    (fields as Record<string, unknown>)[key] = {
      type: "String",
      resolve: (root: RowType<T>) => (root as Record<string, unknown>)[key],
    };
  }
  return fields;
}
const adv45_userGql = schemaToGql(adv2_usersSchema);

// --- 46. Typed change log ---
type ChangeLog<T extends TableSchema> = {
  id: number;
  table: string;
  operation: "insert" | "update" | "delete";
  rowId: number;
  diff?: Partial<RowType<T>>;
  timestamp: Date;
};
function recordChange<T extends TableSchema>(
  table: string,
  op: ChangeLog<T>["operation"],
  rowId: number,
  diff?: Partial<RowType<T>>
): ChangeLog<T> {
  return { id: Math.random(), table, operation: op, rowId, diff, timestamp: new Date() };
}

// --- 47. Query statistics ---
type QueryStats = {
  sql: string;
  durationMs: number;
  rowsAffected: number;
  timestamp: Date;
};
function measureQuery<T>(sql: string, fn: () => Promise<T[]>): Promise<{ result: T[]; stats: QueryStats }> {
  const start = Date.now();
  return fn().then(result => ({
    result,
    stats: { sql, durationMs: Date.now() - start, rowsAffected: result.length, timestamp: new Date() },
  }));
}

// --- 48. Typed data loader (N+1 prevention) ---
class DataLoader<K, V> {
  private queue: Map<K, ((v: V | null) => void)[]> = new Map();
  constructor(private batchFn: (keys: K[]) => Promise<(V | null)[]>) {}
  load(key: K): Promise<V | null> {
    return new Promise(resolve => {
      if (!this.queue.has(key)) this.queue.set(key, []);
      this.queue.get(key)!.push(resolve);
      if (this.queue.size === 1) queueMicrotask(() => this.flush());
    });
  }
  private async flush(): Promise<void> {
    const keys = [...this.queue.keys()];
    const results = await this.batchFn(keys);
    keys.forEach((k, i) => this.queue.get(k)!.forEach(cb => cb(results[i])));
    this.queue.clear();
  }
}
const adv48_userLoader = new DataLoader<number, Adv2_User>(async ids =>
  ids.map(id => ({ id, name: `User ${id}`, email: `u${id}@test.com`, bio: null }))
);

// --- 49. Schema registry ---
class OrmSchemaRegistry {
  private schemas: Map<string, TableSchema> = new Map();
  register<T extends TableSchema>(name: string, schema: T): void { this.schemas.set(name, schema); }
  get<T extends TableSchema>(name: string): T { return this.schemas.get(name) as T; }
  tables(): string[] { return [...this.schemas.keys()]; }
}
const adv49_registry = new OrmSchemaRegistry();
adv49_registry.register("users", adv2_usersSchema);
adv49_registry.register("posts", postsSchema);

// --- 50. Full typed Active Record pattern ---
class Model<T extends TableSchema> {
  private data: Partial<RowType<T>> = {};
  constructor(private schema: T, private repoInstance: Repository<T>) {}
  set<K extends keyof RowType<T>>(key: K, value: RowType<T>[K]): this {
    (this.data as Record<string, unknown>)[key as string] = value;
    return this;
  }
  get<K extends keyof RowType<T>>(key: K): RowType<T>[K] | undefined {
    return (this.data as Record<string, unknown>)[key as string] as RowType<T>[K] | undefined;
  }
  async save(): Promise<RowType<T>> { return this.repoInstance.insert(this.data); }
  static create<S extends TableSchema>(schema: S, repo: Repository<S>): Model<S> {
    return new Model(schema, repo);
  }
}
const adv50_repo = new InMemoryRepo<typeof adv2_usersSchema>();
const adv50_user = Model.create(adv2_usersSchema, adv50_repo);
adv50_user.set("name", "Alice").set("email", "alice@example.com");
