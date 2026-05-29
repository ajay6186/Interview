export {};

// ============================================================
// BASIC EXAMPLES — ORM Types (50 Examples)
// ============================================================

// 1. Basic model interface
interface UserModel { id: number; name: string; email: string; createdAt: Date; }

// 2. Post model interface
interface PostModel { id: number; title: string; body: string; userId: number; publishedAt: Date | null; }

// 3. Comment model interface
interface CommentModel { id: number; postId: number; userId: number; body: string; }

// 4. Omit id for create operations
type CreateUser = Omit<UserModel, "id" | "createdAt">;

// 5. Partial for update operations
type UpdateUser = Partial<Omit<UserModel, "id" | "createdAt">>;

// 6. Repository interface for a model
interface Repository<T> {
  findById(id: number): Promise<T | null>;
  findAll(): Promise<T[]>;
  create(data: Omit<T, "id">): Promise<T>;
  update(id: number, data: Partial<T>): Promise<T>;
  delete(id: number): Promise<void>;
}

// 7. Where clause type — equality conditions
type WhereClause<T> = Partial<T>;

// 8. Find with where clause
interface FindOptions<T> { where?: WhereClause<T>; limit?: number; offset?: number; }

// 9. Order direction
type OrderDirection = "ASC" | "DESC";

// 10. Order clause
type OrderBy<T> = { field: keyof T; direction: OrderDirection };

// 11. Query options — where + order + pagination
interface QueryOptions<T> extends FindOptions<T> { orderBy?: OrderBy<T>; }

// 12. Simple in-memory user repository
class UserRepository implements Repository<UserModel> {
  private db: UserModel[] = [];
  private nextId = 1;
  async findById(id: number): Promise<UserModel | null> {
    return this.db.find(u => u.id === id) ?? null;
  }
  async findAll(): Promise<UserModel[]> { return [...this.db]; }
  async create(data: Omit<UserModel, "id">): Promise<UserModel> {
    const user: UserModel = { id: this.nextId++, ...data };
    this.db.push(user);
    return user;
  }
  async update(id: number, data: Partial<UserModel>): Promise<UserModel> {
    const idx = this.db.findIndex(u => u.id === id);
    if (idx === -1) throw new Error("Not found");
    this.db[idx] = { ...this.db[idx], ...data };
    return this.db[idx];
  }
  async delete(id: number): Promise<void> {
    this.db = this.db.filter(u => u.id !== id);
  }
}

// 13. Soft delete mixin — adds deletedAt field
interface SoftDeletable { deletedAt: Date | null; }

// 14. Soft delete model
type SoftDeleteUser = UserModel & SoftDeletable;

// 15. Timestamps mixin
interface Timestamps { createdAt: Date; updatedAt: Date; }

// 16. Model with timestamps
type TimestampedPost = PostModel & Timestamps;

// 17. Primary key type alias
type PrimaryKey = number;

// 18. Foreign key — typed reference
type ForeignKey<_Model> = number;

// 19. Post model with typed foreign key
interface TypedPost {
  id: PrimaryKey;
  title: string;
  userId: ForeignKey<UserModel>;
}

// 20. Select specific fields
type SelectFields<T, K extends keyof T> = Pick<T, K>;

// 21. Select user summary (only id + name)
type UserSummary = SelectFields<UserModel, "id" | "name">;

// 22. Count result type
interface CountResult { count: number; }

// 23. Aggregate result type
interface AggregateResult { min?: number; max?: number; avg?: number; sum?: number; }

// 24. Find one helper type
type FindOne<T> = (where: WhereClause<T>) => Promise<T | null>;

// 25. Find many helper type
type FindMany<T> = (options?: QueryOptions<T>) => Promise<T[]>;

// 26. Save (upsert) helper type
type Save<T> = (model: T) => Promise<T>;

// 27. Transaction callback type
type TransactionCallback<T> = (tx: Repository<T>) => Promise<void>;

// 28. Typed column names for a model
type Columns<T> = (keyof T)[];

// 29. List user columns
const userColumns: Columns<UserModel> = ["id", "name", "email", "createdAt"];

// 30. Typed raw query result
type RawRow = Record<string, string | number | boolean | null>;

// 31. Map raw row to model
function mapRow<T>(row: RawRow, mapping: Record<keyof T, string>): T {
  const result = {} as T;
  for (const key in mapping) {
    (result as Record<string, unknown>)[key] = row[mapping[key]];
  }
  return result;
}

// 32. Condition operator types
type ComparisonOp = "eq" | "ne" | "gt" | "gte" | "lt" | "lte" | "like" | "in";

// 33. Typed condition
interface Condition<T, K extends keyof T> {
  field: K;
  op: ComparisonOp;
  value: T[K] | T[K][];
}

// 34. Build where conditions
function eq<T, K extends keyof T>(field: K, value: T[K]): Condition<T, K> {
  return { field, op: "eq", value };
}

// 35. Greater than condition
function gt<T, K extends keyof T>(field: K, value: T[K]): Condition<T, K> {
  return { field, op: "gt", value };
}

// 36. Like condition
function like<T, K extends keyof T & string>(field: K, value: string): Condition<T, K> {
  return { field, op: "like", value: value as T[K] };
}

// 37. In condition
function inValues<T, K extends keyof T>(field: K, values: T[K][]): Condition<T, K> {
  return { field, op: "in", value: values };
}

// 38. Simple query builder
class SimpleQuery<T> {
  private conditions: Condition<T, keyof T>[] = [];
  private _limit?: number;
  private _offset?: number;
  where<K extends keyof T>(cond: Condition<T, K>): this {
    this.conditions.push(cond as Condition<T, keyof T>);
    return this;
  }
  limit(n: number): this { this._limit = n; return this; }
  offset(n: number): this { this._offset = n; return this; }
  build(): { conditions: Condition<T, keyof T>[]; limit?: number; offset?: number } {
    return { conditions: this.conditions, limit: this._limit, offset: this._offset };
  }
}

// 39. Seeder type — inserts initial data
type Seeder<T> = (repo: Repository<T>) => Promise<void>;

// 40. User seeder
const seedUsers: Seeder<UserModel> = async (repo) => {
  await repo.create({ name: "Alice", email: "alice@example.com", createdAt: new Date() });
  await repo.create({ name: "Bob", email: "bob@example.com", createdAt: new Date() });
};

// 41. Pagination meta
interface PaginationMeta { page: number; perPage: number; total: number; totalPages: number; }

// 42. Paginated query result
interface PaginatedResult<T> { data: T[]; meta: PaginationMeta; }

// 43. Compute pagination meta
function paginationMeta(page: number, perPage: number, total: number): PaginationMeta {
  return { page, perPage, total, totalPages: Math.ceil(total / perPage) };
}

// 44. Model validation type
type ModelValidator<T> = (data: Partial<T>) => string[];

// 45. User model validator
const validateUserModel: ModelValidator<UserModel> = (data) => {
  const errors: string[] = [];
  if (!data.name || data.name.trim() === "") errors.push("name is required");
  if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) errors.push("valid email is required");
  return errors;
};

// 46. Hook types — before/after save
type BeforeSave<T> = (data: Partial<T>) => Partial<T>;
type AfterSave<T> = (model: T) => void;

// 47. Normalize email before save
const normalizeEmail: BeforeSave<UserModel> = (data) => ({
  ...data,
  email: data.email?.toLowerCase().trim(),
});

// 48. Index definition
interface Index<T> { fields: (keyof T)[]; unique: boolean; name: string; }

// 49. User email unique index
const userEmailIndex: Index<UserModel> = {
  fields: ["email"],
  unique: true,
  name: "idx_users_email",
};

// 50. Schema definition for a model
interface ModelSchema<T> {
  tableName: string;
  fields: (keyof T)[];
  primaryKey: keyof T;
  indexes: Index<T>[];
}

const userSchema: ModelSchema<UserModel> = {
  tableName: "users",
  fields: ["id", "name", "email", "createdAt"],
  primaryKey: "id",
  indexes: [userEmailIndex],
};
