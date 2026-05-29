export {};

// ============================================================
// Phase 6 – Expert: SQL Query Builder — NESTED (1–50)
// ============================================================

type Params = (string | number | boolean | null)[];
type Table<N extends string, C extends Record<string, unknown>> = { __name: N; __columns: C };
type ColName<T extends Table<string, Record<string, unknown>>> = keyof T["__columns"] & string;

// Tables
type Users = Table<"users", { id: number; name: string; email: string; age: number; active: boolean; role: string }>;
type Posts = Table<"posts", { id: number; userId: number; title: string; body: string; published: boolean; views: number }>;
type Comments = Table<"comments", { id: number; postId: number; userId: number; body: string; score: number }>;
type Tags = Table<"tags", { id: number; postId: number; name: string }>;

const usersTable: Users = { __name: "users", __columns: { id: 0, name: "", email: "", age: 0, active: true, role: "" } };
const postsTable: Posts = { __name: "posts", __columns: { id: 0, userId: 0, title: "", body: "", published: false, views: 0 } };
const commentsTable: Comments = { __name: "comments", __columns: { id: 0, postId: 0, userId: 0, body: "", score: 0 } };
const tagsTable: Tags = { __name: "tags", __columns: { id: 0, postId: 0, name: "" } };

// Core builder
class QB<T extends Table<string, Record<string, unknown>>> {
  protected cols: string[] = ["*"];
  protected wheres: string[] = [];
  protected joins: string[] = [];
  protected orderBys: string[] = [];
  protected groupBys: string[] = [];
  protected params: Params = [];
  protected _limit?: number;
  protected _offset?: number;
  constructor(protected table: T) {}
  select(...c: ColName<T>[]): this { this.cols = c.length ? c : ["*"]; return this; }
  where(col: string, op: string, val: Params[number]): this { this.wheres.push(`${col} ${op} ?`); this.params.push(val); return this; }
  whereRaw(sql: string, ...p: Params): this { this.wheres.push(sql); this.params.push(...p); return this; }
  join(type: string, t: string, on: string): this { this.joins.push(`${type} JOIN ${t} ON ${on}`); return this; }
  orderBy(col: string, dir: "ASC" | "DESC" = "ASC"): this { this.orderBys.push(`${col} ${dir}`); return this; }
  groupBy(...c: string[]): this { this.groupBys.push(...c); return this; }
  limit(n: number): this { this._limit = n; return this; }
  offset(n: number): this { this._offset = n; return this; }
  toSQL(): { sql: string; params: Params } {
    let sql = `SELECT ${this.cols.join(", ")} FROM ${this.table.__name}`;
    if (this.joins.length) sql += " " + this.joins.join(" ");
    if (this.wheres.length) sql += " WHERE " + this.wheres.join(" AND ");
    if (this.groupBys.length) sql += " GROUP BY " + this.groupBys.join(", ");
    if (this.orderBys.length) sql += " ORDER BY " + this.orderBys.join(", ");
    if (this._limit !== undefined) sql += ` LIMIT ${this._limit}`;
    if (this._offset !== undefined) sql += ` OFFSET ${this._offset}`;
    return { sql, params: [...this.params] };
  }
}

// --- 1. Nested subquery in WHERE ---
const N1_inner = new QB(postsTable).select("userId").where("published", "=", true).toSQL();
const N1_outer = new QB(usersTable).whereRaw(`id IN (${N1_inner.sql})`, ...N1_inner.params).toSQL();
// SELECT * FROM users WHERE id IN (SELECT userId FROM posts WHERE published = ?)

// --- 2. Correlated subquery ---
function correlatedSubquery(outer: string, inner: { sql: string; params: Params }): string {
  return `EXISTS (${inner.sql.replace(/\?/g, (_, i) => `$${i + 1}`)})`;
}
const N2_inner = { sql: "SELECT 1 FROM posts WHERE posts.userId = users.id AND published = ?", params: [true] as Params };
const N2_q = new QB(usersTable).whereRaw(`EXISTS (${N2_inner.sql})`, ...N2_inner.params).toSQL();

// --- 3. Multi-level JOIN chain ---
const N3_q = new QB(usersTable)
  .select("id", "name", "email")
  .join("INNER", "posts", "posts.userId = users.id")
  .join("INNER", "comments", "comments.postId = posts.id")
  .join("LEFT", "tags", "tags.postId = posts.id")
  .where("active", "=", true)
  .groupBy("users.id", "users.name", "users.email")
  .toSQL();

// --- 4. Nested CTE with multiple levels ---
function withCTEs(ctes: { name: string; sql: string }[], main: string): string {
  return `WITH ${ctes.map(c => `${c.name} AS (${c.sql})`).join(", ")} ${main}`;
}
const N4_activeUsers = new QB(usersTable).where("active", "=", true).toSQL().sql;
const N4_publishedPosts = new QB(postsTable).where("published", "=", true).toSQL().sql;
const N4_cte = withCTEs(
  [{ name: "active_users", sql: N4_activeUsers }, { name: "pub_posts", sql: N4_publishedPosts }],
  "SELECT au.name, COUNT(pp.id) FROM active_users au JOIN pub_posts pp ON pp.userId = au.id GROUP BY au.name"
);

// --- 5. Recursive CTE for hierarchy ---
const N5_orgChart = `
  WITH RECURSIVE org AS (
    SELECT id, name, manager_id, 0 AS level FROM employees WHERE manager_id IS NULL
    UNION ALL
    SELECT e.id, e.name, e.manager_id, o.level + 1
    FROM employees e JOIN org o ON e.manager_id = o.id
  )
  SELECT * FROM org ORDER BY level
`;

// --- 6. Nested JSON aggregation ---
const N6_q = `
  SELECT
    u.id,
    u.name,
    JSON_AGG(
      JSON_BUILD_OBJECT(
        'id', p.id,
        'title', p.title,
        'tags', (
          SELECT JSON_AGG(JSON_BUILD_OBJECT('name', t.name))
          FROM tags t WHERE t.postId = p.id
        )
      ) ORDER BY p.id
    ) AS posts
  FROM users u
  LEFT JOIN posts p ON p.userId = u.id
  WHERE u.active = true
  GROUP BY u.id, u.name
`;

// --- 7. Nested CASE expressions ---
const N7_q = `
  SELECT
    id,
    name,
    CASE role
      WHEN 'admin' THEN CASE active WHEN true THEN 'super-admin' ELSE 'inactive-admin' END
      WHEN 'user' THEN CASE age >= 18 WHEN true THEN 'adult' ELSE 'minor' END
      ELSE 'guest'
    END AS category
  FROM users
`;

// --- 8. Window function with nested subquery frame ---
const N8_q = `
  SELECT
    id, userId, title, views,
    SUM(views) OVER (PARTITION BY userId ORDER BY id ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS running_views,
    AVG(views) OVER (PARTITION BY userId) AS avg_views,
    views - LAG(views, 1, 0) OVER (PARTITION BY userId ORDER BY id) AS view_delta
  FROM posts
`;

// --- 9. Nested UNION with CTE ---
const N9_q = withCTEs([{
  name: "all_content",
  sql: `
    SELECT 'post' AS type, id, title AS content FROM posts WHERE published = true
    UNION ALL
    SELECT 'comment' AS type, id, body AS content FROM comments WHERE score > 0
  `
}], "SELECT * FROM all_content ORDER BY type, id");

// --- 10. Nested pivot with multiple levels ---
const N10_q = `
  SELECT *
  FROM (
    SELECT
      u.name,
      DATE_TRUNC('month', p.created_at) AS month,
      COUNT(*) AS post_count
    FROM users u JOIN posts p ON p.userId = u.id
    GROUP BY u.name, DATE_TRUNC('month', p.created_at)
  ) sub
  PIVOT (SUM(post_count) FOR month IN ('2024-01', '2024-02', '2024-03'))
`;

// --- 11. Nested lateral join ---
const N11_q = `
  SELECT u.id, u.name, rp.*
  FROM users u
  CROSS JOIN LATERAL (
    SELECT p.id, p.title, p.views,
      (SELECT COUNT(*) FROM comments c WHERE c.postId = p.id) AS comment_count
    FROM posts p
    WHERE p.userId = u.id
    ORDER BY p.views DESC
    LIMIT 3
  ) rp
`;

// --- 12. Multi-dimensional grouping ---
const N12_q = `
  SELECT
    GROUPING SETS (
      (role, DATE_TRUNC('month', created_at)),
      (role),
      (DATE_TRUNC('month', created_at)),
      ()
    ),
    COUNT(*) AS user_count,
    AVG(age) AS avg_age
  FROM users
  GROUP BY GROUPING SETS (
    (role, DATE_TRUNC('month', created_at)),
    (role),
    (DATE_TRUNC('month', created_at)),
    ()
  )
`;

// --- 13. Nested EXISTS / NOT EXISTS ---
const N13_q = `
  SELECT * FROM users u
  WHERE EXISTS (
    SELECT 1 FROM posts p
    WHERE p.userId = u.id
    AND EXISTS (
      SELECT 1 FROM comments c
      WHERE c.postId = p.id AND c.score > 10
    )
  )
`;

// --- 14. Nested aggregate inside window ---
const N14_q = `
  SELECT
    userId,
    SUM(views) AS total_views,
    SUM(SUM(views)) OVER (ORDER BY userId) AS running_total
  FROM posts
  GROUP BY userId
`;

// --- 15. Nested type-safe query builder class ---
class NestedQB<T extends Table<string, Record<string, unknown>>> extends QB<T> {
  subquery<I extends Table<string, Record<string, unknown>>>(
    inner: QB<I>,
    col: ColName<T>,
    op: "IN" | "NOT IN" | "="
  ): this {
    const { sql, params } = inner.toSQL();
    this.wheres.push(`${col} ${op} (${sql})`);
    this.params.push(...params);
    return this;
  }
}
const N15_q = new NestedQB(usersTable)
  .subquery(new QB(postsTable).select("userId").where("views", ">", 1000), "id", "IN")
  .orderBy("name")
  .toSQL();

// --- 16. Nested grouped result with HAVING inside CTE ---
const N16_cte = withCTEs([{
  name: "popular_users",
  sql: `
    SELECT userId, COUNT(*) AS post_count, SUM(views) AS total_views
    FROM posts WHERE published = true
    GROUP BY userId HAVING SUM(views) > 10000
  `
}], "SELECT u.*, p.post_count, p.total_views FROM users u JOIN popular_users p ON p.userId = u.id");

// --- 17. Nested JSON path queries ---
const N17_q = `
  SELECT
    id,
    metadata->>'name' AS meta_name,
    metadata->'address'->>'city' AS city,
    (metadata->'tags') AS tags,
    jsonb_array_length(metadata->'tags') AS tag_count
  FROM users
  WHERE metadata @> '{"verified": true}'
`;

// --- 18. Cross-join for Cartesian product ---
const N18_q = `
  SELECT u.name, t.name AS tag
  FROM users u
  CROSS JOIN tags t
  WHERE EXISTS (
    SELECT 1 FROM posts p
    WHERE p.userId = u.id AND p.id IN (
      SELECT postId FROM tags WHERE name = t.name
    )
  )
`;

// --- 19. Nested array aggregation with unnest ---
const N19_q = `
  SELECT DISTINCT ON (u.id) u.id, u.name, t.name AS most_used_tag
  FROM users u
  JOIN posts p ON p.userId = u.id
  JOIN tags t ON t.postId = p.id
  ORDER BY u.id, COUNT(t.name) OVER (PARTITION BY u.id, t.name) DESC
`;

// --- 20. Deep nested subquery with aggregation ---
const N20_q = `
  SELECT *
  FROM (
    SELECT
      userId,
      AVG(score) AS avg_score,
      PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY score) AS median_score
    FROM (
      SELECT c.userId, c.score
      FROM comments c
      JOIN posts p ON p.id = c.postId
      WHERE p.published = true AND p.views > 100
    ) filtered
    GROUP BY userId
    HAVING COUNT(*) >= 5
  ) stats
  WHERE avg_score > 7
`;

// --- 21. Nested full-text search with ranking ---
const N21_q = `
  SELECT
    p.id, p.title,
    ts_rank_cd(
      setweight(to_tsvector('english', p.title), 'A') ||
      setweight(to_tsvector('english', p.body), 'B'),
      plainto_tsquery('english', $1)
    ) AS rank,
    ts_headline('english', p.body, plainto_tsquery('english', $1)) AS excerpt
  FROM posts p
  WHERE (
    setweight(to_tsvector('english', p.title), 'A') ||
    setweight(to_tsvector('english', p.body), 'B')
  ) @@ plainto_tsquery('english', $1)
  ORDER BY rank DESC
  LIMIT 10
`;

// --- 22. Nested trigger-like via with-returning ---
const N22_q = `
  WITH updated AS (
    UPDATE posts SET views = views + 1 WHERE id = $1 RETURNING id, userId, views
  ),
  user_update AS (
    UPDATE users u SET total_views = (SELECT SUM(views) FROM posts WHERE userId = u.id)
    FROM updated upd WHERE u.id = upd.userId
    RETURNING u.id, u.total_views
  )
  SELECT u.id, u.name, u.total_views, p.id AS post_id, p.views AS post_views
  FROM users u
  JOIN updated p ON p.userId = u.id
  JOIN user_update uu ON uu.id = u.id
`;

// --- 23. Nested type builder: query from union of tables ---
type MultiTableQuery<Tables extends Table<string, Record<string, unknown>>[]> = {
  tables: Tables;
  query: string;
};
function unionSelect<T extends Table<string, Record<string, unknown>>[]>(
  ...tables: T
): { sql: string } {
  return {
    sql: tables.map(t => `SELECT *, '${t.__name}' AS source FROM ${t.__name}`).join(" UNION ALL "),
  };
}
const N23_q = unionSelect(usersTable as unknown as Table<string, Record<string, unknown>>, postsTable as unknown as Table<string, Record<string, unknown>>);

// --- 24. Nested query with multiple WITH RECURSIVE ---
const N24_q = `
  WITH RECURSIVE
    category_tree AS (
      SELECT id, name, parent_id, 0 AS depth FROM categories WHERE parent_id IS NULL
      UNION ALL
      SELECT c.id, c.name, c.parent_id, ct.depth + 1
      FROM categories c JOIN category_tree ct ON c.parent_id = ct.id
      WHERE ct.depth < 5
    ),
    post_counts AS (
      SELECT category_id, COUNT(*) AS count FROM posts GROUP BY category_id
    )
  SELECT ct.*, COALESCE(pc.count, 0) AS post_count
  FROM category_tree ct
  LEFT JOIN post_counts pc ON pc.category_id = ct.id
`;

// --- 25. Nested materialized subquery optimization ---
const N25_q = `
  SELECT u.name, post_stats.*
  FROM users u
  JOIN LATERAL (
    SELECT
      COUNT(*) AS total,
      MAX(views) AS max_views,
      SUM(CASE WHEN published THEN views ELSE 0 END) AS published_views
    FROM posts p
    WHERE p.userId = u.id
  ) post_stats ON true
  WHERE u.active = true
`;

// --- 26. Nested QB as a composable monad ---
class QueryMonad<T extends Table<string, Record<string, unknown>>, R = T["__columns"]> {
  constructor(private qb: QB<T>) {}
  flatMap<U>(fn: (qb: QB<T>) => QB<U extends Table<string, Record<string, unknown>> ? U : T>): QueryMonad<U extends Table<string, Record<string, unknown>> ? U : T> {
    return new QueryMonad<U extends Table<string, Record<string, unknown>> ? U : T>(fn(this.qb) as QB<U extends Table<string, Record<string, unknown>> ? U : T>);
  }
  map(fn: (qb: QB<T>) => QB<T>): QueryMonad<T> { return new QueryMonad<T>(fn(this.qb)); }
  run(): { sql: string; params: Params } { return this.qb.toSQL(); }
}
const N26_qm = new QueryMonad(new QB(usersTable))
  .map(qb => qb.where("active", "=", true).limit(10));

// --- 27. Nested aggregation pipeline type ---
type AggregationStep =
  | { stage: "match"; condition: string }
  | { stage: "group"; by: string[]; aggs: Record<string, string> }
  | { stage: "sort"; fields: Record<string, 1 | -1> }
  | { stage: "limit"; n: number }
  | { stage: "project"; fields: string[] };
function buildAggPipeline(table: string, steps: AggregationStep[]): string {
  let sql = "";
  const groupStep = steps.find(s => s.stage === "group") as Extract<AggregationStep, { stage: "group" }> | undefined;
  const matchStep = steps.find(s => s.stage === "match") as Extract<AggregationStep, { stage: "match" }> | undefined;
  const sortStep = steps.find(s => s.stage === "sort") as Extract<AggregationStep, { stage: "sort" }> | undefined;
  const limitStep = steps.find(s => s.stage === "limit") as Extract<AggregationStep, { stage: "limit" }> | undefined;
  const aggCols = groupStep ? Object.entries(groupStep.aggs).map(([k, expr]) => `${expr} AS ${k}`) : [];
  sql = `SELECT ${groupStep ? [...groupStep.by, ...aggCols].join(", ") : "*"} FROM ${table}`;
  if (matchStep) sql += ` WHERE ${matchStep.condition}`;
  if (groupStep) sql += ` GROUP BY ${groupStep.by.join(", ")}`;
  if (sortStep) sql += ` ORDER BY ${Object.entries(sortStep.fields).map(([k, v]) => `${k} ${v === 1 ? "ASC" : "DESC"}`).join(", ")}`;
  if (limitStep) sql += ` LIMIT ${limitStep.n}`;
  return sql;
}

// --- 28. Nested time series query ---
const N28_q = `
  SELECT
    DATE_TRUNC('hour', created_at) AS hour,
    COUNT(*) AS events,
    SUM(COUNT(*)) OVER (ORDER BY DATE_TRUNC('hour', created_at)) AS cumulative
  FROM posts
  WHERE created_at >= NOW() - INTERVAL '7 days'
  GROUP BY DATE_TRUNC('hour', created_at)
  ORDER BY hour
`;

// --- 29. Nested self-join for comparison ---
const N29_q = `
  SELECT
    a.userId,
    a.views AS post_views,
    b.views AS other_views,
    a.views - b.views AS diff
  FROM posts a
  JOIN posts b ON b.userId = a.userId AND b.id <> a.id
  WHERE a.views > b.views
  ORDER BY a.userId, diff DESC
`;

// --- 30. Nested query with multiple aggregation windows ---
const N30_q = `
  SELECT
    id, userId, views,
    NTILE(4) OVER (ORDER BY views) AS quartile,
    CUME_DIST() OVER (ORDER BY views) AS percentile,
    FIRST_VALUE(title) OVER (PARTITION BY userId ORDER BY views DESC) AS top_post_title
  FROM posts
  WHERE published = true
`;

// --- 31. Nested query builder factory ---
function queryFactory<T extends Table<string, Record<string, unknown>>>(table: T) {
  return {
    all: () => new QB<T>(table),
    active: (col: "active" & ColName<T>) => new QB<T>(table).where(col, "=", true),
    byId: (id: number) => new QB<T>(table).where("id" as ColName<T>, "=", id),
    paginate: (page: number, size: number) => new QB<T>(table).limit(size).offset((page - 1) * size),
    search: (col: ColName<T>, term: string) => new QB<T>(table).where(col, "LIKE", `%${term}%`),
  };
}
const N31_userQF = queryFactory(usersTable);
const N31_activeUsers = N31_userQF.active("active").where("age", ">=", 18).orderBy("name").toSQL();

// --- 32. Deeply nested type composition ---
type QueryPipeline<T extends Table<string, Record<string, unknown>>> = {
  steps: ((qb: QB<T>) => QB<T>)[];
  execute: (qb: QB<T>) => QB<T>;
};
function pipeline_<T extends Table<string, Record<string, unknown>>>(
  ...steps: ((qb: QB<T>) => QB<T>)[]
): QueryPipeline<T> {
  return { steps, execute: qb => steps.reduce((q, step) => step(q), qb) };
}
const N32_pipeline = pipeline_<Users>(
  qb => qb.where("active", "=", true),
  qb => qb.where("age", ">=", 18),
  qb => qb.orderBy("name"),
  qb => qb.limit(20)
);
const N32_result = N32_pipeline.execute(new QB(usersTable)).toSQL();

// --- 33. Nested anti-join pattern ---
const N33_q = `
  SELECT u.*
  FROM users u
  LEFT JOIN posts p ON p.userId = u.id AND p.published = true
  WHERE p.id IS NULL
`;

// --- 34. Nested reporting query ---
const N34_q = `
  WITH
    user_stats AS (
      SELECT
        u.id, u.name, u.role,
        COUNT(p.id) AS post_count,
        COALESCE(SUM(p.views), 0) AS total_views,
        COALESCE(MAX(p.views), 0) AS max_views
      FROM users u
      LEFT JOIN posts p ON p.userId = u.id
      GROUP BY u.id, u.name, u.role
    ),
    ranked AS (
      SELECT *,
        RANK() OVER (PARTITION BY role ORDER BY total_views DESC) AS rank_in_role
      FROM user_stats
    )
  SELECT * FROM ranked WHERE rank_in_role <= 3
`;

// --- 35. Nested query with conditional aggregation ---
const N35_q = `
  SELECT
    userId,
    COUNT(*) AS total_posts,
    COUNT(CASE WHEN published THEN 1 END) AS published_count,
    COUNT(CASE WHEN NOT published THEN 1 END) AS draft_count,
    SUM(CASE WHEN published THEN views ELSE 0 END) AS published_views,
    ROUND(100.0 * COUNT(CASE WHEN published THEN 1 END) / COUNT(*), 2) AS publish_rate
  FROM posts
  GROUP BY userId
  ORDER BY published_views DESC
`;

// --- 36. Nested QB with custom renderer ---
class CustomRendererQB<T extends Table<string, Record<string, unknown>>> extends QB<T> {
  private withTotals = false;
  addTotals(): this { this.withTotals = true; return this; }
  toSQL(): { sql: string; params: Params } {
    const base = super.toSQL();
    if (this.withTotals && this.groupBys.length) {
      return { sql: `${base.sql} WITH ROLLUP`, params: base.params };
    }
    return base;
  }
}

// --- 37. Event sourcing query pattern ---
const N37_q = `
  WITH events AS (
    SELECT * FROM event_store WHERE stream_id = $1 ORDER BY version
  ),
  state AS (
    SELECT
      MAX(CASE WHEN type = 'UserCreated' THEN payload->>'name' END) AS name,
      MAX(CASE WHEN type = 'EmailUpdated' THEN payload->>'email' END) AS email,
      BOOL_OR(type = 'UserDeleted') AS deleted,
      COUNT(*) AS event_count
    FROM events
  )
  SELECT * FROM state WHERE NOT deleted
`;

// --- 38. Nested query for social graph ---
const N38_q = `
  WITH RECURSIVE friends_of_friends AS (
    SELECT friend_id AS user_id, 1 AS degree FROM friendships WHERE user_id = $1
    UNION
    SELECT f.friend_id, fof.degree + 1
    FROM friendships f
    JOIN friends_of_friends fof ON f.user_id = fof.user_id
    WHERE fof.degree < 3
  )
  SELECT DISTINCT u.id, u.name, MIN(degree) AS closeness
  FROM users u
  JOIN friends_of_friends fof ON fof.user_id = u.id
  WHERE u.id <> $1
  GROUP BY u.id, u.name
  ORDER BY closeness, u.name
`;

// --- 39. Nested query for recommendation engine ---
const N39_q = `
  SELECT
    target_user.id,
    target_user.name,
    COUNT(DISTINCT shared_tags.name) AS shared_interests,
    COUNT(DISTINCT mutual_posts.id) AS mutual_posts_read
  FROM users target_user
  JOIN tags shared_tags ON shared_tags.postId IN (
    SELECT postId FROM tags WHERE name IN (
      SELECT DISTINCT name FROM tags
      WHERE postId IN (SELECT id FROM posts WHERE userId = $1)
    )
  )
  JOIN posts mutual_posts ON mutual_posts.id = shared_tags.postId
    AND mutual_posts.userId = target_user.id
  WHERE target_user.id <> $1
  GROUP BY target_user.id, target_user.name
  ORDER BY shared_interests DESC, mutual_posts_read DESC
  LIMIT 10
`;

// --- 40. Nested query for audit trail ---
const N40_q = `
  SELECT
    e.*,
    u.name AS actor_name,
    LAG(e.payload) OVER (PARTITION BY e.entity_id ORDER BY e.created_at) AS prev_state
  FROM audit_events e
  JOIN users u ON u.id = e.user_id
  WHERE e.entity_type = $1 AND e.entity_id = $2
  ORDER BY e.created_at
`;

// --- 41. Nested parameterized query builder ---
class ParamQB<T extends Table<string, Record<string, unknown>>> {
  private conditions: { sql: string; params: Params }[] = [];
  constructor(private table: T) {}
  where(col: ColName<T>, op: string, val: Params[number]): this {
    this.conditions.push({ sql: `${col} ${op} ?`, params: [val] });
    return this;
  }
  orGroup(group: { col: ColName<T>; op: string; val: Params[number] }[]): this {
    const sqls = group.map(c => `${c.col} ${c.op} ?`);
    const params = group.map(c => c.val);
    this.conditions.push({ sql: `(${sqls.join(" OR ")})`, params });
    return this;
  }
  toSQL(): { sql: string; params: Params } {
    const allParams: Params = this.conditions.flatMap(c => c.params);
    const whereSql = this.conditions.map(c => c.sql).join(" AND ");
    return {
      sql: `SELECT * FROM ${this.table.__name}${whereSql ? ` WHERE ${whereSql}` : ""}`,
      params: allParams,
    };
  }
}
const N41_q = new ParamQB(usersTable)
  .where("active", "=", true)
  .orGroup([{ col: "role", op: "=", val: "admin" }, { col: "role", op: "=", val: "moderator" }])
  .where("age", ">=", 18)
  .toSQL();

// --- 42. Nested schema-aware query builder ---
type SchemaMap = Record<string, Table<string, Record<string, unknown>>>;
class SchemaAwareQB<Schema extends SchemaMap> {
  from<K extends keyof Schema & string>(table: K): QB<Schema[K]> {
    return new QB<Schema[K]>({ __name: table, __columns: {} as Schema[K]["__columns"] });
  }
}
type AppSchema = { users: Users; posts: Posts; comments: Comments };
const N42_schema = new SchemaAwareQB<AppSchema>();
const N42_usersQ = N42_schema.from("users").where("active", "=", true).toSQL();

// --- 43. Nested type-safe query transformer ---
type QueryTransformer<T extends Table<string, Record<string, unknown>>> = {
  transform: (qb: QB<T>) => QB<T>;
  priority: number;
};
function applyTransformers<T extends Table<string, Record<string, unknown>>>(
  qb: QB<T>, transformers: QueryTransformer<T>[]
): QB<T> {
  return [...transformers].sort((a, b) => a.priority - b.priority)
    .reduce((q, t) => t.transform(q), qb);
}

// --- 44. Nested multi-tenant query ---
class TenantQB<T extends Table<string, Record<string, unknown>>> extends QB<T> {
  forTenant(tenantId: string): this {
    return this.whereRaw(`tenant_id = ?`, tenantId);
  }
  withSharding(shardId: number): this {
    return this.whereRaw(`shard_id = ?`, shardId);
  }
}

// --- 45. Nested query builder with compiled queries ---
type CompiledQuery = { execute: (params: Params) => { sql: string; params: Params } };
function compile<T extends Table<string, Record<string, unknown>>>(
  template: (qb: QB<T>) => QB<T>, table: T
): CompiledQuery {
  return {
    execute: (dynamicParams: Params) => {
      const qb = template(new QB<T>(table));
      const { sql, params } = qb.toSQL();
      return { sql, params: [...params, ...dynamicParams] };
    },
  };
}
const N45_compiledUserSearch = compile<Users>(
  qb => qb.where("active", "=", true).orderBy("name"),
  usersTable
);

// --- 46. Nested query with error recovery ---
async function safeQuery<T>(
  fn: () => Promise<T>,
  fallback: T,
  retries = 2
): Promise<T> {
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (e) {
      if (i === retries) { console.error("Query failed:", e); return fallback; }
      await new Promise(r => setTimeout(r, 100 * (i + 1)));
    }
  }
  return fallback;
}

// --- 47. Nested query composition with pipe ---
type QueryStep<T extends Table<string, Record<string, unknown>>> = (qb: QB<T>) => QB<T>;
function pipeQuery<T extends Table<string, Record<string, unknown>>>(
  table: T, ...steps: QueryStep<T>[]
): { sql: string; params: Params } {
  return steps.reduce((qb, step) => step(qb), new QB<T>(table)).toSQL();
}
const N47_result = pipeQuery(
  usersTable,
  qb => qb.select("id", "name", "email"),
  qb => qb.where("active", "=", true),
  qb => qb.where("age", ">=", 21),
  qb => qb.orderBy("name"),
  qb => qb.limit(50)
);

// --- 48. Nested analytics dashboard query ---
const N48_q = withCTEs([
  { name: "user_activity", sql: "SELECT userId, COUNT(*) posts, SUM(views) views FROM posts WHERE published = true GROUP BY userId" },
  { name: "engagement", sql: "SELECT postId, COUNT(*) comments, AVG(score) avg_score FROM comments GROUP BY postId" },
  { name: "top_posts", sql: "SELECT p.*, e.comments, e.avg_score FROM posts p JOIN engagement e ON e.postId = p.id WHERE e.avg_score > 7" },
], "SELECT u.name, ua.posts, ua.views, COUNT(tp.id) AS top_posts FROM users u JOIN user_activity ua ON ua.userId = u.id LEFT JOIN top_posts tp ON tp.userId = u.id GROUP BY u.name, ua.posts, ua.views ORDER BY ua.views DESC LIMIT 20");

// --- 49. Nested query builder with TypeScript branded return types ---
type Brand<T, B extends string> = T & { __brand: B };
type SafeQuery<T> = Brand<{ sql: string; params: Params }, "SafeQuery"> & { _type: T };
function safeSQL<T>(sql: string, params: Params): SafeQuery<T> {
  return { sql, params, __brand: "SafeQuery", _type: undefined as unknown as T };
}
const N49_typed = safeSQL<{ id: number; name: string }>("SELECT id, name FROM users WHERE active = ?", [true]);

// --- 50. Full nested query: analytics with subqueries, CTEs, and window functions ---
const N50_fullAnalytics = withCTEs([
  {
    name: "base_metrics",
    sql: `
      SELECT
        u.id AS user_id, u.name, u.role,
        COUNT(p.id) AS posts,
        COALESCE(SUM(p.views), 0) AS views,
        COALESCE(AVG(p.views), 0) AS avg_views,
        COUNT(c.id) AS comments
      FROM users u
      LEFT JOIN posts p ON p.userId = u.id AND p.published = true
      LEFT JOIN comments c ON c.userId = u.id
      GROUP BY u.id, u.name, u.role
    `
  },
  {
    name: "ranked_metrics",
    sql: `
      SELECT *,
        RANK() OVER (ORDER BY views DESC) AS views_rank,
        PERCENT_RANK() OVER (ORDER BY views) AS views_percentile,
        NTILE(10) OVER (ORDER BY views) AS views_decile
      FROM base_metrics
    `
  }
], `
  SELECT
    rm.*,
    CASE
      WHEN views_decile >= 9 THEN 'top 10%'
      WHEN views_decile >= 7 THEN 'top 30%'
      WHEN views_decile >= 5 THEN 'top 50%'
      ELSE 'below median'
    END AS tier
  FROM ranked_metrics rm
  ORDER BY views_rank
`);
