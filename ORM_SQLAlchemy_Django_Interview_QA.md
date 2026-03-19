# ORM Interview Questions & Answers
## Django ORM + SQLAlchemy | Basic → Senior (6-7 Years Experience)

---

## TABLE OF CONTENTS

### Django ORM
- [Beginner (0-1 yr)](#django-beginner)
  - What is Django ORM, QuerySet, get/filter, Field types, on_delete
- [Intermediate (2-3 yrs)](#django-intermediate)
  - select_related, prefetch_related, N+1 Problem, values/values_list, annotate/aggregate, Q objects, F expressions, defer/only
- [Advanced / Senior (4-7 yrs)](#django-advanced)
  - Query optimization, Prefetch object, select_for_update, Custom managers, bulk_create, Transactions, Raw SQL, Migrations, Signals, Abstract models, Multi-DB

### SQLAlchemy
- [Beginner (0-1 yr)](#sqlalchemy-beginner)
  - Core vs ORM, Session, Object states, commit/flush, relationship/backref
- [Intermediate (2-3 yrs)](#sqlalchemy-intermediate)
  - Lazy/Eager loading, 2.0 style, Many-to-Many, with_for_update, expire_on_commit
- [Advanced / Senior (4-7 yrs)](#sqlalchemy-advanced)
  - Connection pooling, Soft deletes, Hybrid properties, Events, Bulk operations, Multi-tenancy, Custom types, Alembic migrations, Async SQLAlchemy

### [Quick Comparison Table](#comparison)
### [Interview Tips](#tips)

---

<a name="django-beginner"></a>
# PART 1: DJANGO ORM

## BEGINNER (0-1 Year Experience)

---

### Q1. What is Django ORM and why do we use it?

**Answer:**

Django ORM (Object-Relational Mapper) is an abstraction layer that maps Python classes (models) to database tables, and Python method calls to SQL queries. It lets you work with your database using Python code without writing raw SQL.

**Why use it:**
- Database-agnostic — same code works with PostgreSQL, MySQL, SQLite
- Prevents SQL injection by default (uses parameterized queries)
- Handles schema migrations automatically
- Reduces boilerplate — no manual cursor management

**How it works internally:**
1. You define a Python class inheriting from `models.Model`
2. Django creates a corresponding database table via migrations
3. Django translates Python method chains into SQL at query evaluation time

```python
# models.py
from django.db import models

class User(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    age = models.IntegerField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'users'   # Custom table name (default: appname_user)
        ordering = ['-created_at']  # Default ordering

# Django generates this SQL table:
# CREATE TABLE users (
#   id INTEGER PRIMARY KEY AUTOINCREMENT,
#   name VARCHAR(100),
#   email VARCHAR(254) UNIQUE,
#   age INTEGER,
#   is_active BOOLEAN DEFAULT TRUE,
#   created_at DATETIME
# );
```

---

### Q2. What is a QuerySet? Explain its lazy evaluation.

**Answer:**

A `QuerySet` is a collection of database objects that represents a database query. It is **lazy** — it does not execute any SQL until you explicitly evaluate it.

**QuerySet is evaluated when you:**
- Iterate over it (`for user in qs`)
- Convert to list (`list(qs)`)
- Slice it (`qs[0:5]`)
- Call `repr()` or `len()`
- Call `bool()` on it
- Call `.all()`, `.first()`, `.last()`, `.get()`, `.exists()`, `.count()`

```python
# Step 1: Building the query — NO database hit yet
qs = User.objects.filter(is_active=True)  # No SQL executed
qs = qs.filter(age__gte=18)              # No SQL executed
qs = qs.order_by('name')                 # No SQL executed

# Step 2: Evaluation — database hit happens NOW
for user in qs:                          # SQL executed here
    print(user.name)

# SQL generated:
# SELECT * FROM users
# WHERE is_active = TRUE AND age >= 18
# ORDER BY name;
```

**Why lazy evaluation is useful:**
- You can build complex queries in steps without performance penalty
- Django can optimize the final query before it's sent
- You can pass QuerySets between functions without hitting the database

**QuerySet is cached after evaluation:**
```python
qs = User.objects.filter(is_active=True)

# First iteration — hits database
for user in qs:
    print(user.name)

# Second iteration — uses cached results, no DB hit
for user in qs:
    print(user.email)
```

---

### Q3. Difference between `get()`, `filter()`, `first()`, `last()`, `exists()`

**Answer:**

| Method | Returns | Raises Exception | DB Query |
|--------|---------|-----------------|----------|
| `get()` | Single object | `DoesNotExist` if none, `MultipleObjectsReturned` if >1 | `SELECT ... LIMIT 21` |
| `filter()` | QuerySet (0 or more rows) | Never | No hit until evaluated |
| `first()` | Single object or `None` | Never | `SELECT ... ORDER BY pk LIMIT 1` |
| `last()` | Single object or `None` | Never | `SELECT ... ORDER BY pk DESC LIMIT 1` |
| `exists()` | Boolean | Never | `SELECT 1 ... LIMIT 1` (fastest check) |
| `count()` | Integer | Never | `SELECT COUNT(*)` |

```python
# get() — use when you expect exactly ONE result
try:
    user = User.objects.get(id=1)
except User.DoesNotExist:
    print("Not found")
except User.MultipleObjectsReturned:
    print("Multiple found — data issue")

# filter() — use when you expect 0 or many results
active_users = User.objects.filter(is_active=True)
# Returns QuerySet, not evaluated yet

# first() — safer than get() when you just want one result
user = User.objects.filter(email='alice@example.com').first()
if user:  # Could be None
    print(user.name)

# exists() — fastest way to check if a record exists
# GOOD — uses SQL EXISTS which is optimized
if User.objects.filter(email='alice@example.com').exists():
    raise ValueError("Email already registered")

# BAD — fetches all matching rows just to check
if User.objects.filter(email='alice@example.com'):
    raise ValueError("Email already registered")
```

---

### Q4. Explain Django model field types with examples

**Answer:**

```python
class Product(models.Model):
    # --- String Fields ---
    name = models.CharField(max_length=200)          # VARCHAR — short strings, required max_length
    description = models.TextField()                  # TEXT — unlimited length, no max_length
    slug = models.SlugField(unique=True)              # VARCHAR — URL-safe string (letters, numbers, hyphens)

    # --- Numeric Fields ---
    price = models.DecimalField(max_digits=10, decimal_places=2)  # DECIMAL — money/precision
    quantity = models.IntegerField(default=0)         # INTEGER
    rating = models.FloatField(null=True)             # FLOAT — approximate decimal

    # --- Boolean Fields ---
    is_active = models.BooleanField(default=True)     # BOOLEAN

    # --- Date/Time Fields ---
    created_at = models.DateTimeField(auto_now_add=True)  # Set once on creation
    updated_at = models.DateTimeField(auto_now=True)      # Updated on every save()
    birth_date = models.DateField()                        # DATE only
    start_time = models.TimeField()                        # TIME only

    # --- File Fields ---
    image = models.ImageField(upload_to='products/')   # Stores file path in DB
    document = models.FileField(upload_to='docs/')

    # --- Relational Fields ---
    category = models.ForeignKey('Category', on_delete=models.CASCADE)
    tags = models.ManyToManyField('Tag', blank=True)

    # --- JSON Field (PostgreSQL / Django 3.1+) ---
    metadata = models.JSONField(default=dict)

    # --- UUID Field ---
    import uuid
    public_id = models.UUIDField(default=uuid.uuid4, editable=False, unique=True)

    class Meta:
        verbose_name_plural = 'Products'
```

**Key field options:**
- `null=True` — stores NULL in DB (use for non-string fields)
- `blank=True` — allows empty in forms/validation
- `default=value` — default value
- `unique=True` — adds UNIQUE constraint
- `db_index=True` — adds database index
- `choices=[('M', 'Male'), ('F', 'Female')]` — restricts values

---

### Q5. Explain `ForeignKey`, `OneToOneField`, `ManyToManyField` with real-world examples

**Answer:**

```python
# ForeignKey (Many-to-One)
# Many books can belong to ONE author
class Author(models.Model):
    name = models.CharField(max_length=100)

class Book(models.Model):
    title = models.CharField(max_length=200)
    author = models.ForeignKey(
        Author,
        on_delete=models.CASCADE,
        related_name='books'  # author.books.all() — access books from author
    )

# Usage
author = Author.objects.get(id=1)
author.books.all()      # All books by this author (reverse relation)
book.author             # The author of this book (forward relation)


# OneToOneField (One-to-One)
# Every user has exactly ONE profile
class UserProfile(models.Model):
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile'
    )
    bio = models.TextField()
    avatar_url = models.URLField()

# Usage
user.profile            # Access profile from user
profile.user            # Access user from profile


# ManyToManyField (Many-to-Many)
# A student can enroll in many courses, a course has many students
class Course(models.Model):
    name = models.CharField(max_length=100)

class Student(models.Model):
    name = models.CharField(max_length=100)
    courses = models.ManyToManyField(Course, related_name='students')

# Usage
student.courses.all()       # All courses for a student
course.students.all()       # All students in a course
student.courses.add(course) # Enroll student
student.courses.remove(course)  # Unenroll student
student.courses.clear()     # Remove all enrollments
```

---

### Q6. What does `on_delete` mean? Explain all options.

**Answer:**

`on_delete` defines what happens to child records when the parent (referenced) record is deleted.

```python
class Order(models.Model):
    # CASCADE — delete order when user is deleted (most common)
    user = models.ForeignKey(User, on_delete=models.CASCADE)

    # PROTECT — prevent user deletion if they have orders
    # raises ProtectedError exception
    user = models.ForeignKey(User, on_delete=models.PROTECT)

    # SET_NULL — set user_id to NULL when user is deleted
    # requires null=True on the field
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)

    # SET_DEFAULT — set to default value when user is deleted
    # requires default=... on the field
    user = models.ForeignKey(User, on_delete=models.SET_DEFAULT, default=1)

    # DO_NOTHING — no action (can cause referential integrity errors!)
    # only use if you handle cleanup manually or DB has no constraints
    user = models.ForeignKey(User, on_delete=models.DO_NOTHING)

    # SET(callable) — call a function to get the replacement value
    def get_sentinel_user():
        return User.objects.get_or_create(username='deleted')[0].id

    user = models.ForeignKey(User, on_delete=models.SET(get_sentinel_user))
```

**When to use which:**
- `CASCADE` — child records make no sense without parent (orders without users)
- `PROTECT` — ensure no orphaned data (don't delete categories with products)
- `SET_NULL` — optional relation (post can exist without an author)
- `SET_DEFAULT` — assign to a default owner/category

---

<a name="django-intermediate"></a>
## INTERMEDIATE (2-3 Years Experience)

---

### Q7. What is the N+1 query problem? How do you detect and fix it?

**Answer:**

The N+1 problem occurs when you run 1 query to fetch N records, then run N additional queries to fetch related data — one for each record.

```python
# PROBLEM — N+1 queries
books = Book.objects.all()          # Query 1: SELECT all books (returns 100 books)
for book in books:
    print(book.author.name)         # Query 2-101: 1 query per book to get author!
# Total: 101 queries for 100 books

# SOLUTION — select_related (SQL JOIN)
books = Book.objects.select_related('author').all()  # 1 query with JOIN
for book in books:
    print(book.author.name)         # No extra queries — data already loaded!
```

**How to detect N+1:**
```python
# Method 1: Django Debug Toolbar (shows query count per request)

# Method 2: Django shell — check connection.queries
from django.db import connection, reset_queries
reset_queries()

books = list(Book.objects.all())
for book in books:
    _ = book.author.name

print(len(connection.queries))   # Prints 101 for N+1 problem
print(connection.queries[-3:])   # See last 3 queries

# Method 3: Print the query
print(Book.objects.select_related('author').query)
```

---

### Q8. `select_related` vs `prefetch_related` — deep explanation

**Answer:**

**`select_related`** — Uses a SQL `JOIN`. Fetches everything in **one query**. Best for ForeignKey and OneToOne (returns a single related object).

```python
# select_related — generates a single JOIN query
books = Book.objects.select_related('author', 'author__publisher').all()

# SQL generated:
# SELECT books.*, authors.*, publishers.*
# FROM books
# JOIN authors ON books.author_id = authors.id
# JOIN publishers ON authors.publisher_id = publishers.id

# Can traverse relations with double underscore
books = Book.objects.select_related('author__publisher__country')
```

**`prefetch_related`** — Uses **separate queries** then joins in Python. Best for ManyToMany and reverse ForeignKey (returns multiple related objects).

```python
# prefetch_related — generates 2 separate queries
authors = Author.objects.prefetch_related('books').all()

# Query 1: SELECT * FROM authors
# Query 2: SELECT * FROM books WHERE author_id IN (1, 2, 3, ...)
# Python then maps books to their authors

# Multiple prefetches
authors = Author.objects.prefetch_related('books', 'books__tags').all()
# 3 queries total — still much better than N+1
```

**When to use which:**

| Scenario | Use |
|----------|-----|
| `ForeignKey` (book → author) | `select_related` |
| `OneToOne` | `select_related` |
| `ManyToMany` | `prefetch_related` |
| Reverse FK (author → books) | `prefetch_related` |
| Deep chain FK (book → author → publisher) | `select_related` |

---

### Q9. Explain `values()` and `values_list()` — when and why to use them

**Answer:**

By default, Django fetches full model instances (all columns). `values()` and `values_list()` return only the specified columns as dictionaries or tuples, which is much faster when you don't need full model objects.

```python
# Default — returns full User model instances (all columns)
users = User.objects.filter(is_active=True)
# SELECT id, name, email, age, bio, avatar, created_at, ... FROM users

# values() — returns list of dictionaries
users = User.objects.values('id', 'name', 'email')
# [{'id': 1, 'name': 'Alice', 'email': 'alice@ex.com'}, ...]
# SELECT id, name, email FROM users   (faster — less data transferred)

# values_list() — returns list of tuples
users = User.objects.values_list('id', 'name')
# [(1, 'Alice'), (2, 'Bob'), ...]

# flat=True — returns a flat list (only works with single field)
emails = User.objects.values_list('email', flat=True)
# ['alice@ex.com', 'bob@ex.com', ...]

# named=True — returns named tuples
users = User.objects.values_list('id', 'name', named=True)
for user in users:
    print(user.id, user.name)  # Access by attribute name

# Real-world use case — get list of IDs for bulk operation
user_ids = User.objects.filter(is_active=False).values_list('id', flat=True)
SomeOtherModel.objects.filter(user_id__in=user_ids).delete()
```

**Performance tip:** Use `values()` / `values_list()` in APIs that return JSON — no need to instantiate full model objects.

---

### Q10. `annotate()` vs `aggregate()` — explain with detailed examples

**Answer:**

- **`aggregate()`** — computes a **single value** for the **entire queryset** (returns a dict)
- **`annotate()`** — computes a value **per row** and attaches it to each object

```python
from django.db.models import Count, Avg, Sum, Max, Min, F

# --- aggregate() examples ---

# Count total users
result = User.objects.aggregate(total=Count('id'))
# {'total': 500}

# Multiple aggregations in one query
stats = Order.objects.aggregate(
    total_orders=Count('id'),
    total_revenue=Sum('amount'),
    avg_order=Avg('amount'),
    max_order=Max('amount'),
)
# {'total_orders': 1200, 'total_revenue': Decimal('98000.00'), ...}

# Aggregate with filter
active_stats = Order.objects.filter(status='completed').aggregate(
    revenue=Sum('amount')
)


# --- annotate() examples ---

# Add book count to each author
authors = Author.objects.annotate(book_count=Count('books'))
for author in authors:
    print(f"{author.name}: {author.book_count} books")

# Filter by annotated value — authors with more than 5 books
prolific = Author.objects.annotate(
    book_count=Count('books')
).filter(book_count__gt=5).order_by('-book_count')

# Multiple annotations
from django.db.models import Q

authors = Author.objects.annotate(
    total_books=Count('books'),
    published_books=Count('books', filter=Q(books__is_published=True)),
    avg_rating=Avg('books__rating'),
    revenue=Sum('books__sales_amount'),
)

# Annotation with conditional expression
from django.db.models import Case, When, IntegerField

users = User.objects.annotate(
    priority=Case(
        When(age__lt=18, then=1),        # Junior
        When(age__range=(18, 60), then=2), # Adult
        default=3,                          # Senior
        output_field=IntegerField()
    )
)
```

---

### Q11. `Q` objects — complex queries with OR, AND, NOT

**Answer:**

```python
from django.db.models import Q

# Basic AND (same as chaining .filter())
User.objects.filter(age__gte=18, is_active=True)
# Equivalent with Q:
User.objects.filter(Q(age__gte=18) & Q(is_active=True))

# OR — only possible with Q objects
User.objects.filter(Q(is_staff=True) | Q(is_superuser=True))

# NOT — use ~ (tilde) operator
User.objects.filter(~Q(age__lt=18))          # age >= 18
User.objects.filter(~Q(country='US'))         # not from US

# Complex combinations — use parentheses for clarity
User.objects.filter(
    Q(country='IN') & (Q(age__gte=18) | Q(is_verified=True))
)
# SQL: WHERE country = 'IN' AND (age >= 18 OR is_verified = TRUE)

# Build Q objects dynamically
def build_search_query(name=None, email=None, min_age=None):
    q = Q()
    if name:
        q &= Q(name__icontains=name)
    if email:
        q &= Q(email__icontains=email)
    if min_age:
        q &= Q(age__gte=min_age)
    return User.objects.filter(q)

# Real-world: Search across multiple fields
search_term = "alice"
results = User.objects.filter(
    Q(name__icontains=search_term) |
    Q(email__icontains=search_term) |
    Q(bio__icontains=search_term)
)
```

---

### Q12. `F()` expressions — atomic database operations

**Answer:**

`F()` references a model field value at the **database level**. Operations using `F()` are executed by the database, not Python — making them atomic and avoiding race conditions.

```python
from django.db.models import F

# --- Without F() — RACE CONDITION RISK ---
product = Product.objects.get(id=1)
product.view_count += 1   # Read into Python, modify, write back
product.save()
# If two requests run simultaneously, both read the same count
# and only one increment is saved! (lost update)

# --- With F() — ATOMIC ---
Product.objects.filter(id=1).update(view_count=F('view_count') + 1)
# SQL: UPDATE products SET view_count = view_count + 1 WHERE id = 1
# Database handles the increment atomically — no race condition!

# F() in save() — also works
product = Product.objects.get(id=1)
product.view_count = F('view_count') + 1
product.save()
product.refresh_from_db()  # Must refresh to see the new value

# F() to compare two fields in same row
# Find employees earning more than their manager
Employee.objects.filter(salary__gt=F('manager__salary'))

# F() with arithmetic
# Apply 10% discount
Product.objects.all().update(price=F('price') * 0.9)

# F() with date arithmetic
from datetime import timedelta
from django.db.models import ExpressionWrapper, DurationField

# Find subscriptions expiring within 7 days
Subscription.objects.filter(
    expires_at__lte=F('created_at') + timedelta(days=7)
)

# F() in annotations
orders = Order.objects.annotate(
    profit=ExpressionWrapper(
        F('revenue') - F('cost'),
        output_field=DecimalField()
    )
)
```

---

### Q13. `defer()` and `only()` — partial loading

**Answer:**

Control which fields are loaded from the database to reduce data transfer.

```python
# only() — fetch ONLY these fields, defer everything else
users = User.objects.only('id', 'name', 'email')
# SELECT id, name, email FROM users

# defer() — fetch ALL fields EXCEPT these
users = User.objects.defer('bio', 'avatar_url', 'raw_data')
# SELECT id, name, email, age, ... (all except bio, avatar_url, raw_data)

# When you access a deferred field — triggers a NEW query per object!
user = User.objects.only('name').get(id=1)
print(user.name)   # OK — already loaded
print(user.email)  # EXTRA QUERY: SELECT email FROM users WHERE id = 1

# Real-world use case — list view (no need for heavy fields)
users = User.objects.only('id', 'name', 'email', 'created_at')
# Great for a user listing API

# Full detail view — load everything
user = User.objects.get(id=1)

# Combine with select_related
books = Book.objects.only('title', 'price').select_related(
    'author'
).only('title', 'price', 'author__name')
```

**Note:** `pk` is always loaded even if not specified in `only()`.

---

<a name="django-advanced"></a>
## ADVANCED / SENIOR (4-7 Years Experience)

---

### Q14. How do you diagnose and optimize slow Django ORM queries?

**Answer:**

A systematic approach to query optimization:

```python
# Step 1 — Print the generated SQL
qs = User.objects.filter(is_active=True).select_related('profile')
print(str(qs.query))

# Step 2 — Measure query time in shell
import time
start = time.time()
list(qs)
print(f"Query took: {time.time() - start:.3f}s")

# Step 3 — Use connection.queries to see ALL queries
from django.db import connection, reset_queries
import django
django.conf.settings.DEBUG = True

reset_queries()
# ... run your code ...
for q in connection.queries:
    print(f"Time: {q['time']}s | SQL: {q['sql'][:200]}")
print(f"Total queries: {len(connection.queries)}")

# Step 4 — EXPLAIN the slow query (PostgreSQL)
from django.db import connection

with connection.cursor() as cursor:
    cursor.execute("EXPLAIN ANALYZE SELECT * FROM users WHERE age > 25")
    rows = cursor.fetchall()
    for row in rows:
        print(row[0])

# Step 5 — Add indexes for frequently filtered fields
class User(models.Model):
    email = models.EmailField(db_index=True)     # Single index
    status = models.CharField(max_length=20)

    class Meta:
        indexes = [
            models.Index(fields=['status', 'created_at']),   # Composite index
            models.Index(fields=['email'], name='user_email_idx'),
        ]
        # PostgreSQL partial index
        # indexes = [models.Index(fields=['email'], condition=Q(is_active=True))]

# Step 6 — Use exists() instead of count() for presence check
# BAD
if User.objects.filter(email=email).count() > 0:
    raise ValueError("Taken")

# GOOD
if User.objects.filter(email=email).exists():
    raise ValueError("Taken")

# Step 7 — Avoid loading full objects for bulk updates
# BAD — loads all objects into Python
for user in User.objects.filter(is_active=False):
    user.delete()

# GOOD — single SQL DELETE
User.objects.filter(is_active=False).delete()

# Step 8 — Use iterator() for large querysets to avoid memory issues
for user in User.objects.filter(is_active=True).iterator(chunk_size=500):
    process(user)  # Fetches 500 at a time, doesn't cache
```

---

### Q15. Custom Managers and QuerySet — reusable query logic

**Answer:**

```python
# Custom QuerySet — chainable methods
class UserQuerySet(models.QuerySet):
    def active(self):
        return self.filter(is_active=True)

    def verified(self):
        return self.filter(is_email_verified=True)

    def adults(self):
        return self.filter(age__gte=18)

    def with_profile(self):
        return self.select_related('profile')

    def by_country(self, country):
        return self.filter(country=country)


# Custom Manager — entry point to QuerySet
class UserManager(models.Manager):
    def get_queryset(self):
        return UserQuerySet(self.model, using=self._db)

    # Shortcut methods
    def active(self):
        return self.get_queryset().active()

    def staff(self):
        return self.get_queryset().filter(is_staff=True)


class User(models.Model):
    name = models.CharField(max_length=100)
    age = models.IntegerField()
    is_active = models.BooleanField(default=True)
    is_email_verified = models.BooleanField(default=False)
    country = models.CharField(max_length=50)

    objects = UserManager()    # Replace default manager


# Usage — fully chainable!
User.objects.active().verified().adults().by_country('IN')
User.objects.active().with_profile().filter(age__gte=21)

# Real-world example — SoftDelete Manager
class SoftDeleteQuerySet(models.QuerySet):
    def delete(self):
        return self.update(deleted_at=timezone.now())

    def hard_delete(self):
        return super().delete()

    def alive(self):
        return self.filter(deleted_at__isnull=True)

    def dead(self):
        return self.filter(deleted_at__isnull=False)


class SoftDeleteManager(models.Manager):
    def get_queryset(self):
        # Default queryset only returns non-deleted records
        return SoftDeleteQuerySet(self.model, using=self._db).alive()


class Post(models.Model):
    title = models.CharField(max_length=200)
    deleted_at = models.DateTimeField(null=True)

    objects = SoftDeleteManager()   # Only returns alive records
    all_objects = models.Manager()  # Access all including deleted

Post.objects.all()              # Only alive posts
Post.all_objects.all()          # All posts including deleted
Post.objects.filter(...).delete()  # Soft delete
```

---

### Q16. `bulk_create`, `bulk_update` — performance for large datasets

**Answer:**

```python
# --- bulk_create ---
# BAD — 1000 separate INSERT queries
for i in range(1000):
    User.objects.create(name=f'User {i}', age=i % 50 + 18)

# GOOD — 1 INSERT query
users = [User(name=f'User {i}', age=i % 50 + 18) for i in range(1000)]
User.objects.bulk_create(users, batch_size=500)
# batch_size=500 — sends 2 INSERT queries (500 rows each)

# bulk_create with ignore_conflicts (skip duplicates)
User.objects.bulk_create(users, ignore_conflicts=True)

# bulk_create with update_conflicts (Django 4.1+)
User.objects.bulk_create(
    users,
    update_conflicts=True,
    update_fields=['name', 'age'],
    unique_fields=['email'],
)

# --- bulk_update ---
users = User.objects.filter(country='USA')
for user in users:
    user.country = 'US'  # Rename

# BAD — N UPDATE queries
for user in users:
    user.save()

# GOOD — 1 UPDATE query
User.objects.bulk_update(users, fields=['country'], batch_size=500)


# CAVEATS of bulk_create / bulk_update:
# 1. Does NOT call model's save() method
# 2. Does NOT trigger post_save / pre_save signals
# 3. Does NOT automatically set primary key (unless update_conflicts=True in PG)
# 4. Django does not validate field values

# When signals matter — use individual saves
# When performance matters — use bulk operations
```

---

### Q17. Database Transactions — `atomic()`, `savepoints`, `on_commit`

**Answer:**

```python
from django.db import transaction

# --- Basic atomic block ---
# All operations succeed together or all roll back
with transaction.atomic():
    user = User.objects.create(name='Alice', email='alice@ex.com')
    profile = Profile.objects.create(user=user, bio='Hello')
    # If Profile.create fails, User.create is also rolled back

# --- atomic() as decorator ---
@transaction.atomic
def transfer_funds(from_account_id, to_account_id, amount):
    from_acc = BankAccount.objects.select_for_update().get(id=from_account_id)
    to_acc = BankAccount.objects.select_for_update().get(id=to_account_id)

    if from_acc.balance < amount:
        raise ValueError("Insufficient funds")

    from_acc.balance = F('balance') - amount
    to_acc.balance = F('balance') + amount
    from_acc.save()
    to_acc.save()
    # Both saves happen or neither does

# --- Savepoints (nested atomic blocks) ---
with transaction.atomic():           # Outer transaction
    create_user()
    with transaction.atomic():       # Creates a savepoint
        try:
            risky_operation()        # If this fails...
        except Exception:
            pass                     # Only inner block rolls back
    create_profile()                 # This still runs!

# --- transaction.on_commit() ---
# Run code AFTER the transaction successfully commits
# Common use: sending emails, triggering Celery tasks

@transaction.atomic
def register_user(data):
    user = User.objects.create(**data)
    # DO NOT send email here — transaction might still roll back!

    # Schedule email AFTER commit
    transaction.on_commit(
        lambda: send_welcome_email.delay(user.id)
    )

# --- Manual transaction control ---
try:
    with transaction.atomic():
        do_something()
        if some_condition:
            # Manually trigger rollback
            raise transaction.TransactionManagementError()
except Exception:
    pass  # Transaction rolled back
```

---

### Q18. `select_for_update()` — Row-level locking

**Answer:**

```python
from django.db import transaction
from django.db.models import F

# Locking rows prevents concurrent updates from corrupting data
# Example: Two users trying to book the last seat simultaneously

@transaction.atomic
def book_seat(event_id, user_id):
    # Lock the event row until transaction ends
    event = Event.objects.select_for_update().get(id=event_id)

    if event.available_seats <= 0:
        raise Exception("No seats available")

    event.available_seats -= 1
    event.save()
    Booking.objects.create(event=event, user_id=user_id)
    # Lock released when transaction ends

# Without select_for_update:
# Request 1: reads seats=1
# Request 2: reads seats=1
# Request 1: sets seats=0, saves
# Request 2: sets seats=0, saves — DOUBLE BOOKED!

# With select_for_update:
# Request 1: locks row, reads seats=1
# Request 2: waits for lock...
# Request 1: sets seats=0, saves, commits (lock released)
# Request 2: acquires lock, reads seats=0, raises exception — SAFE!

# --- Options ---
# NOWAIT — raise exception immediately if lock unavailable (don't wait)
Event.objects.select_for_update(nowait=True).get(id=event_id)

# SKIP LOCKED — skip locked rows (good for job queues)
tasks = Task.objects.select_for_update(skip_locked=True).filter(
    status='pending'
)[:10]

# of — lock specific related tables too
Event.objects.select_for_update(of=('self', 'venue')).select_related('venue')
```

---

### Q19. Django Migrations — advanced patterns

**Answer:**

```python
# --- RunPython for data migrations ---
def forward_migrate(apps, schema_editor):
    # Use historical model — NOT the current one
    User = apps.get_model('myapp', 'User')
    for user in User.objects.all():
        user.username = user.email.split('@')[0]
        user.save()

def reverse_migrate(apps, schema_editor):
    User = apps.get_model('myapp', 'User')
    User.objects.all().update(username='')

class Migration(migrations.Migration):
    dependencies = [('myapp', '0004_add_username_field')]

    operations = [
        migrations.RunPython(forward_migrate, reverse_migrate)
    ]


# --- Safe zero-downtime column addition ---
# Step 1: Add nullable column (safe — existing rows unaffected)
migrations.AddField(
    model_name='user',
    name='phone',
    field=models.CharField(max_length=20, null=True, blank=True),
)

# Step 2: Backfill data (RunPython)
# Step 3: Add NOT NULL constraint after backfill
migrations.AlterField(
    model_name='user',
    name='phone',
    field=models.CharField(max_length=20),  # Remove null=True
)


# --- RunSQL for database-specific features ---
class Migration(migrations.Migration):
    operations = [
        migrations.RunSQL(
            sql="CREATE INDEX CONCURRENTLY idx_users_email ON users(email);",
            reverse_sql="DROP INDEX idx_users_email;",
        ),
    ]


# --- SeparateDatabaseAndState for no-downtime rename ---
# Rename column without locking the table
class Migration(migrations.Migration):
    operations = [
        migrations.SeparateDatabaseAndState(
            database_operations=[
                migrations.RunSQL("ALTER TABLE users RENAME COLUMN old_name TO new_name"),
            ],
            state_operations=[
                migrations.RenameField('user', 'old_name', 'new_name'),
            ],
        )
    ]
```

---

### Q20. Abstract Models, Proxy Models, and Multi-table Inheritance

**Answer:**

```python
# --- Abstract Model — shared fields, no DB table created ---
class TimestampedModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True   # <-- No database table for this model

class User(TimestampedModel):
    name = models.CharField(max_length=100)
    # Has created_at and updated_at fields automatically

class Product(TimestampedModel):
    name = models.CharField(max_length=200)
    # Also has created_at and updated_at


# --- Proxy Model — same DB table, different Python behavior ---
class User(models.Model):
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=20)

class AdminUser(User):
    class Meta:
        proxy = True  # Uses same 'users' table!

    def promote(self):
        self.role = 'admin'
        self.save()

    objects = AdminUserManager()  # Custom manager for admins


# --- Multi-table Inheritance — separate tables with automatic JOIN ---
class Animal(models.Model):
    name = models.CharField(max_length=100)
    age = models.IntegerField()

class Dog(Animal):
    breed = models.CharField(max_length=100)
    # Creates 'dog' table with one-to-one link to 'animal' table
    # animal_ptr_id = OneToOneField(Animal)

dog = Dog.objects.get(id=1)
dog.name   # From animal table (automatic JOIN)
dog.breed  # From dog table
```

---

<a name="sqlalchemy-beginner"></a>
# PART 2: SQLALCHEMY

## BEGINNER (0-1 Year Experience)

---

### Q21. What is SQLAlchemy? Core vs ORM — what's the difference?

**Answer:**

SQLAlchemy is a Python SQL toolkit and ORM. It has two distinct layers:

**Core** — Works directly with SQL table constructs. Gives you full SQL control. Returns rows (tuples or dict-like objects), not model instances.

**ORM** — Built on top of Core. Maps Python classes to tables. Returns model instances with full relationship support.

```python
from sqlalchemy import create_engine, MetaData, Table, Column, Integer, String, select
from sqlalchemy.orm import DeclarativeBase, mapped_column, Mapped, Session

# === CORE STYLE ===
engine = create_engine("postgresql+psycopg2://user:pass@localhost/db")
metadata = MetaData()

users_table = Table('users', metadata,
    Column('id', Integer, primary_key=True),
    Column('name', String(100)),
    Column('age', Integer),
)

# Core query
with engine.connect() as conn:
    stmt = select(users_table).where(users_table.c.age > 25)
    result = conn.execute(stmt)
    rows = result.fetchall()    # List of Row objects (tuple-like)
    for row in rows:
        print(row.name, row.age)


# === ORM STYLE (SQLAlchemy 2.0) ===
class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))
    age: Mapped[int]

# ORM query
with Session(engine) as session:
    stmt = select(User).where(User.age > 25)
    users = session.execute(stmt).scalars().all()   # List of User instances
    for user in users:
        print(user.name, user.age)   # Full model attributes

# When to use Core:
# - Data pipelines, ETL jobs, complex reporting queries
# - When you don't need model instances
# - Maximum performance with minimal overhead

# When to use ORM:
# - Web applications with relationships
# - CRUD operations on well-defined models
# - When model behavior (methods, properties) matters
```

---

### Q22. What is a Session? How does it work?

**Answer:**

A `Session` is the central object in SQLAlchemy ORM. It:
1. Tracks all objects you load or create (identity map)
2. Maintains a transaction
3. Coordinates with the database

```python
from sqlalchemy.orm import Session, sessionmaker

engine = create_engine("postgresql+psycopg2://user:pass@localhost/db")

# Method 1 — context manager (recommended for scripts)
with Session(engine) as session:
    user = User(name='Alice', age=30)
    session.add(user)
    session.commit()
# Session automatically closed after 'with' block

# Method 2 — sessionmaker factory (recommended for web apps)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)

# FastAPI/Flask dependency pattern
def get_db():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()

# Method 3 — scoped_session (thread-local, for Flask)
from sqlalchemy.orm import scoped_session
db_session = scoped_session(SessionLocal)

# Identity Map — Session caches objects by primary key
with Session(engine) as session:
    user1 = session.get(User, 1)  # DB hit
    user2 = session.get(User, 1)  # No DB hit — returns cached object
    assert user1 is user2         # Same Python object!

# Session tracks changes automatically
with Session(engine) as session:
    user = session.get(User, 1)
    user.name = 'Bob'            # Session notices this change
    session.commit()             # Automatically generates UPDATE
```

---

### Q23. Object lifecycle states in SQLAlchemy

**Answer:**

```python
from sqlalchemy import inspect

# Transient — created, not associated with any session
user = User(name='Alice')
print(inspect(user).transient)   # True

# Pending — added to session, not yet flushed/committed
session.add(user)
print(inspect(user).pending)     # True
print(user.id)                   # None — not in DB yet

# Persistent — in session AND in database
session.commit()
print(inspect(user).persistent)  # True
print(user.id)                   # 1 — assigned by DB

# Detached — has identity (pk) but not in any session
session.expunge(user)
print(inspect(user).detached)    # True
print(user.name)                 # Works — data still in Python
# user.posts  — would raise DetachedInstanceError for lazy relations!

# Re-attach detached object
session.add(user)                # Back to persistent
# or
user = session.merge(user)       # Merge detached state into session

# Deleted — marked for deletion, removed after commit
session.delete(user)
print(inspect(user).deleted)     # True (before commit)
session.commit()
# User no longer in DB, object becomes detached
```

---

### Q24. `commit()` vs `flush()` vs `expire()` vs `refresh()`

**Answer:**

```python
with Session(engine) as session:
    user = User(name='Alice', age=25)
    session.add(user)

    # flush() — sends SQL to DB within current transaction
    # Useful when you need the DB-generated ID before committing
    session.flush()
    print(user.id)        # ID is now populated (DB assigned it)
    # Transaction is still open — can still rollback!

    # commit() — commits the transaction to DB permanently
    session.commit()
    # Transaction closed, changes are permanent

    # expire() — marks an object's attributes as stale
    # Next access will reload from DB
    session.expire(user)         # Expire all attributes
    session.expire(user, ['name'])  # Expire specific attribute
    print(user.name)             # Triggers SELECT to reload

    # refresh() — immediately reload from DB (expire + load in one step)
    session.refresh(user)
    print(user.name)             # Fresh value from DB

    # expire_all() — expire all objects in session
    session.expire_all()

# Real-world scenario: Get ID before commit
with Session(engine) as session:
    with session.begin():
        order = Order(user_id=1, total=100.00)
        session.add(order)
        session.flush()                    # Get order.id from DB

        # Now create order items using the order ID
        items = [
            OrderItem(order_id=order.id, product_id=1, qty=2),
            OrderItem(order_id=order.id, product_id=3, qty=1),
        ]
        session.add_all(items)
        # commit() happens automatically at end of session.begin() context
```

---

### Q25. `relationship()` — configuration options

**Answer:**

```python
from sqlalchemy.orm import relationship

class Author(Base):
    __tablename__ = 'authors'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(100))

    # One author → many books
    books: Mapped[list['Book']] = relationship(
        'Book',
        back_populates='author',
        cascade='all, delete-orphan',  # Delete books when author deleted
        lazy='select',                  # Load on access (default)
        order_by='Book.created_at.desc()',
    )

class Book(Base):
    __tablename__ = 'books'
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    author_id: Mapped[int] = mapped_column(ForeignKey('authors.id'))

    author: Mapped['Author'] = relationship('Author', back_populates='books')

# --- Cascade options ---
# 'save-update' — adding parent also adds children to session (default)
# 'merge'       — merging parent also merges children
# 'delete'      — deleting parent deletes children
# 'delete-orphan' — delete child if removed from parent's collection
# 'all'         — all of the above except delete-orphan
# 'all, delete-orphan' — most common for parent-owns-children

# --- Lazy loading strategies ---
class Author(Base):
    books = relationship('Book', lazy='select')      # Load on access (N+1 risk)
    books = relationship('Book', lazy='joined')      # Always JOIN (eager)
    books = relationship('Book', lazy='subquery')    # Subquery load
    books = relationship('Book', lazy='selectin')    # SELECT IN load
    books = relationship('Book', lazy='dynamic')     # Returns query (deprecated in 2.0)
    books = relationship('Book', lazy='noload')      # Never load
    books = relationship('Book', lazy='raise')       # Raise error if accessed lazily

# Usage
author = session.get(Author, 1)
print(author.books)        # List of Book objects
author.books.append(Book(title='New Book'))
session.commit()           # Both author and book saved
```

---

<a name="sqlalchemy-intermediate"></a>
## INTERMEDIATE (2-3 Years Experience)

---

### Q26. Eager loading — `joinedload`, `selectinload`, `subqueryload`

**Answer:**

```python
from sqlalchemy.orm import joinedload, selectinload, subqueryload, contains_eager

# --- joinedload — SQL JOIN, single query ---
# Best for: ManyToOne, OneToOne (single related object)
stmt = select(Book).options(joinedload(Book.author))
books = session.execute(stmt).unique().scalars().all()
# SQL: SELECT books.*, authors.* FROM books LEFT JOIN authors ON ...

# --- selectinload — SELECT IN, 2 queries ---
# Best for: OneToMany, ManyToMany (collections)
stmt = select(Author).options(selectinload(Author.books))
authors = session.execute(stmt).scalars().all()
# Query 1: SELECT * FROM authors
# Query 2: SELECT * FROM books WHERE author_id IN (1, 2, 3, ...)

# --- Nested/chained loading ---
stmt = select(Author).options(
    selectinload(Author.books).joinedload(Book.publisher)
)
# Loads authors → then loads books → then joins publisher for each book

# --- Multiple relationships ---
stmt = select(Author).options(
    selectinload(Author.books),
    selectinload(Author.awards),
)

# --- contains_eager — use when you've already joined in WHERE clause ---
stmt = (
    select(Author)
    .join(Author.books)
    .where(Book.is_published == True)
    .options(contains_eager(Author.books))  # Tell SA the join is already done
)
authors = session.execute(stmt).unique().scalars().all()

# Performance guide:
# joinedload   → 1 query, bigger result set. Good for few related objects
# selectinload → 2 queries, clean result sets. Good for collections
# subqueryload → 2 queries (subquery style). Generally avoid — selectinload is better
```

---

### Q27. SQLAlchemy 2.0 — New query style explained

**Answer:**

```python
from sqlalchemy import select, update, delete, func
from sqlalchemy.orm import Session

# === SQLAlchemy 1.x (LEGACY — still works but avoid for new code) ===
# session.query() style
users = session.query(User).filter(User.age > 25).all()
user = session.query(User).filter_by(id=1).first()
session.query(User).filter(User.age < 18).update({'is_minor': True})

# === SQLAlchemy 2.0 (MODERN — preferred) ===
# select() style — mirrors SQL closely

# SELECT
stmt = select(User).where(User.age > 25)
users = session.execute(stmt).scalars().all()    # List of User objects

# SELECT with multiple models (returns Row objects)
stmt = select(User, Address).join(User.address)
rows = session.execute(stmt).all()
for user, address in rows:
    print(user.name, address.city)

# .scalars() — unwrap single-model results
# .scalar() — single value (e.g., first column of first row)
# .scalar_one() — exactly one result, error if 0 or >1
# .scalar_one_or_none() — one result or None

# SELECT with aggregation
stmt = select(func.count(User.id), func.avg(User.age))
count, avg_age = session.execute(stmt).one()

# UPDATE
stmt = (
    update(User)
    .where(User.is_active == False)
    .values(deleted_at=datetime.utcnow())
)
session.execute(stmt)
session.commit()

# DELETE
stmt = delete(User).where(User.age < 0)
session.execute(stmt)
session.commit()

# Filtering helpers
stmt = select(User).where(
    User.name.ilike('%alice%'),             # Case-insensitive LIKE
    User.age.between(18, 65),               # BETWEEN
    User.country.in_(['IN', 'US', 'UK']),  # IN
    User.deleted_at.is_(None),              # IS NULL
    User.email.contains('@gmail.com'),      # LIKE %@gmail.com%
)

# ORDER, LIMIT, OFFSET
stmt = select(User).order_by(User.created_at.desc()).limit(10).offset(20)
```

---

### Q28. Many-to-Many with association tables — simple and advanced

**Answer:**

```python
# --- Simple M2M using secondary ---
from sqlalchemy import Table, ForeignKey

# Association table (no model class needed)
book_tag_association = Table(
    'book_tags',
    Base.metadata,
    Column('book_id', Integer, ForeignKey('books.id'), primary_key=True),
    Column('tag_id', Integer, ForeignKey('tags.id'), primary_key=True),
)

class Book(Base):
    __tablename__ = 'books'
    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(200))
    tags: Mapped[list['Tag']] = relationship(
        'Tag',
        secondary=book_tag_association,
        back_populates='books'
    )

class Tag(Base):
    __tablename__ = 'tags'
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(50))
    books: Mapped[list[Book]] = relationship(
        'Book',
        secondary=book_tag_association,
        back_populates='tags'
    )

# Usage
book = session.get(Book, 1)
tag = session.get(Tag, 1)
book.tags.append(tag)   # Adds to association table
session.commit()

# --- Advanced M2M with extra fields on association ---
# Use an association object (model) instead of secondary table

class BookTag(Base):
    __tablename__ = 'book_tags'
    book_id: Mapped[int] = mapped_column(ForeignKey('books.id'), primary_key=True)
    tag_id: Mapped[int] = mapped_column(ForeignKey('tags.id'), primary_key=True)
    added_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)  # Extra field!
    added_by: Mapped[str] = mapped_column(String(100))

    # Relationships to parent objects
    book: Mapped['Book'] = relationship(back_populates='book_tags')
    tag: Mapped['Tag'] = relationship(back_populates='book_tags')

class Book(Base):
    book_tags: Mapped[list[BookTag]] = relationship(back_populates='book')

# Usage
bt = BookTag(book_id=1, tag_id=2, added_by='admin')
session.add(bt)
session.commit()
```

---

<a name="sqlalchemy-advanced"></a>
## ADVANCED / SENIOR (4-7 Years Experience)

---

### Q29. Connection Pooling — configuration and monitoring

**Answer:**

```python
from sqlalchemy import create_engine, event
from sqlalchemy.pool import QueuePool, NullPool, StaticPool

# --- Production PostgreSQL setup ---
engine = create_engine(
    'postgresql+psycopg2://user:pass@localhost/mydb',
    poolclass=QueuePool,    # Default for most databases
    pool_size=10,           # Number of connections maintained in pool
    max_overflow=20,        # Extra connections allowed beyond pool_size
                            # Total possible: pool_size + max_overflow = 30
    pool_timeout=30,        # Seconds to wait for a connection (raises TimeoutError)
    pool_recycle=1800,      # Recycle connections after 30 min (prevents "gone away")
    pool_pre_ping=True,     # Test connection health before use (handles dropped connections)
    echo=False,             # Don't log every SQL statement
    echo_pool=False,        # Don't log pool events
)

# --- Serverless / AWS Lambda — no pooling ---
engine = create_engine(
    'postgresql+psycopg2://user:pass@host/db',
    poolclass=NullPool,     # No pool — create/close connection per request
)

# --- SQLite in-memory for testing ---
engine = create_engine(
    'sqlite:///:memory:',
    poolclass=StaticPool,
    connect_args={'check_same_thread': False},
)

# --- Monitor pool events ---
@event.listens_for(engine, 'connect')
def on_connect(dbapi_conn, connection_record):
    print(f"New DB connection: {id(dbapi_conn)}")

@event.listens_for(engine, 'checkout')
def on_checkout(dbapi_conn, connection_record, connection_proxy):
    print(f"Connection checked out from pool")

@event.listens_for(engine, 'checkin')
def on_checkin(dbapi_conn, connection_record):
    print(f"Connection returned to pool")

# --- Check pool status ---
pool = engine.pool
print(f"Pool size: {pool.size()}")
print(f"Connections in use: {pool.checkedout()}")
print(f"Connections available: {pool.checkedin()}")
```

---

### Q30. Hybrid Properties — Python and SQL level attributes

**Answer:**

```python
from sqlalchemy.ext.hybrid import hybrid_property, hybrid_method
from sqlalchemy import func

class User(Base):
    __tablename__ = 'users'
    id: Mapped[int] = mapped_column(primary_key=True)
    first_name: Mapped[str] = mapped_column(String(50))
    last_name: Mapped[str] = mapped_column(String(50))
    birth_year: Mapped[int]
    salary: Mapped[float]

    # --- Hybrid property (read-only computed attribute) ---
    @hybrid_property
    def full_name(self):
        # Instance level — called on Python objects
        return f"{self.first_name} {self.last_name}"

    @full_name.expression
    def full_name(cls):
        # Class level — used in SQL queries
        return func.concat(cls.first_name, ' ', cls.last_name)

    # --- Hybrid property with setter ---
    @hybrid_property
    def age(self):
        return 2026 - self.birth_year

    @age.expression
    def age(cls):
        return 2026 - cls.birth_year

    @age.setter
    def age(self, value):
        self.birth_year = 2026 - value

    # --- Hybrid method ---
    @hybrid_method
    def earns_more_than(self, amount):
        return self.salary > amount

    @earns_more_than.expression
    def earns_more_than(cls, amount):
        return cls.salary > amount


# --- Usage ---

# Instance level (Python)
user = session.get(User, 1)
print(user.full_name)         # "Alice Smith"
print(user.age)               # 30
user.age = 25                 # Sets birth_year = 2001

# SQL level (in queries)
# These use the @expression defined method — generate valid SQL!

# Search by full name
results = session.execute(
    select(User).where(User.full_name == 'Alice Smith')
).scalars().all()
# SQL: WHERE first_name || ' ' || last_name = 'Alice Smith'

# Filter by age
adults = session.execute(
    select(User).where(User.age >= 18)
).scalars().all()
# SQL: WHERE (2026 - birth_year) >= 18

# Use hybrid method in query
high_earners = session.execute(
    select(User).where(User.earns_more_than(100000))
).scalars().all()
```

---

### Q31. SQLAlchemy Events — hooks and automation

**Answer:**

```python
from sqlalchemy import event
from sqlalchemy.orm import Session

# --- Model-level events ---

# Before INSERT
@event.listens_for(User, 'before_insert')
def before_user_insert(mapper, connection, target):
    target.created_at = datetime.utcnow()
    target.slug = slugify(target.name)

# After INSERT
@event.listens_for(User, 'after_insert')
def after_user_insert(mapper, connection, target):
    print(f"User created: {target.id}")

# Before UPDATE — detect which fields changed
@event.listens_for(User, 'before_update')
def before_user_update(mapper, connection, target):
    target.updated_at = datetime.utcnow()

    # Check what changed
    state = inspect(target)
    for attr in state.attrs:
        hist = attr.history
        if hist.has_changes():
            print(f"Field '{attr.key}' changed: {hist.deleted} → {hist.added}")

# --- Session-level events ---

# After commit — trigger background tasks
@event.listens_for(Session, 'after_commit')
def after_commit(session):
    # Process objects that were newly created
    for obj in session.new:
        if isinstance(obj, User):
            send_welcome_email.delay(obj.email)  # Celery task

    # Process objects that were updated
    for obj in session.dirty:
        if isinstance(obj, Order) and obj.status == 'completed':
            send_receipt.delay(obj.id)

# After rollback — for logging/alerting
@event.listens_for(Session, 'after_rollback')
def after_rollback(session):
    logger.warning("Transaction rolled back")

# --- Engine/Connection level events ---

# Set search_path for multi-tenant (PostgreSQL schemas)
@event.listens_for(engine, 'connect')
def set_search_path(dbapi_connection, connection_record):
    cursor = dbapi_connection.cursor()
    cursor.execute("SET search_path TO myschema, public")
    cursor.close()

# --- Attribute events ---

# Intercept attribute changes
@event.listens_for(User.password, 'set')
def hash_password(target, value, oldvalue, initiator):
    # Automatically hash password when it's set
    import bcrypt
    return bcrypt.hashpw(value.encode(), bcrypt.gensalt()).decode()
```

---

### Q32. Bulk Operations in SQLAlchemy 2.0 — production patterns

**Answer:**

```python
from sqlalchemy import insert, update, delete
from sqlalchemy.dialects.postgresql import insert as pg_insert

# --- Bulk INSERT (ORM style — slower, triggers events) ---
session.add_all([
    User(name='Alice', age=25),
    User(name='Bob', age=30),
])
session.commit()

# --- Bulk INSERT (Core style — fast, no ORM overhead) ---
stmt = insert(User).values([
    {'name': 'Alice', 'age': 25},
    {'name': 'Bob', 'age': 30},
    {'name': 'Charlie', 'age': 22},
])
session.execute(stmt)
session.commit()

# --- Upsert (INSERT ... ON CONFLICT) — PostgreSQL ---
stmt = pg_insert(User).values([
    {'email': 'alice@ex.com', 'name': 'Alice', 'age': 25},
    {'email': 'bob@ex.com', 'name': 'Bob', 'age': 30},
])

# On conflict — update existing
stmt = stmt.on_conflict_do_update(
    index_elements=['email'],          # Conflict on email column
    set_={
        'name': stmt.excluded.name,    # excluded = the row that was rejected
        'age': stmt.excluded.age,
        'updated_at': datetime.utcnow(),
    }
)
session.execute(stmt)
session.commit()

# --- Bulk UPDATE (Core style) ---
stmt = (
    update(User)
    .where(User.country == 'USA')
    .values(country='US')
)
session.execute(stmt)

# --- Bulk DELETE ---
stmt = delete(User).where(User.deleted_at < datetime(2020, 1, 1))
result = session.execute(stmt)
print(f"Deleted: {result.rowcount} rows")

# --- ORM bulk update (SQLAlchemy 2.0) ---
session.execute(
    update(User)
    .where(User.is_active == False)
    .values(role='inactive')
    .execution_options(synchronize_session='fetch')
    # synchronize_session:
    # 'evaluate' — Python evaluates which objects to update in session (default)
    # 'fetch' — DB fetches updated rows to synchronize session
    # False — don't synchronize (fastest, but session may be stale)
)
```

---

### Q33. Async SQLAlchemy — for FastAPI and async applications

**Answer:**

```python
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# --- Setup ---
engine = create_async_engine(
    'postgresql+asyncpg://user:pass@localhost/db',
    echo=False,
    pool_size=10,
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,  # Important for async — don't expire after commit
)

# --- Async queries ---
async def get_users():
    async with AsyncSessionLocal() as session:
        stmt = select(User).where(User.is_active == True)
        result = await session.execute(stmt)
        return result.scalars().all()

async def create_user(name: str, email: str):
    async with AsyncSessionLocal() as session:
        user = User(name=name, email=email)
        session.add(user)
        await session.commit()
        await session.refresh(user)  # Reload to get DB-generated values
        return user

# --- FastAPI integration ---
from fastapi import FastAPI, Depends

app = FastAPI()

async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

@app.get('/users')
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).options(selectinload(User.posts)))
    return result.scalars().all()

# --- Async relationship loading ---
# IMPORTANT: lazy loading doesn't work in async!
# You MUST explicitly eager load all relationships

# BAD in async context
user = await session.get(User, 1)
print(user.posts)  # MissingGreenlet error!

# GOOD — explicitly load
stmt = select(User).where(User.id == 1).options(selectinload(User.posts))
user = (await session.execute(stmt)).scalar_one()
print(user.posts)  # Works!
```

---

### Q34. Alembic — database migrations for SQLAlchemy

**Answer:**

```bash
# Install and initialize
pip install alembic
alembic init alembic

# Project structure created:
# alembic/
#   env.py          — configuration file
#   versions/       — migration files
# alembic.ini       — main config file
```

```python
# alembic/env.py — connect to your models
from myapp.models import Base
from myapp.config import DATABASE_URL

config.set_main_option('sqlalchemy.url', DATABASE_URL)
target_metadata = Base.metadata  # Point to your models
```

```bash
# Create auto migration (detects schema changes)
alembic revision --autogenerate -m "add users table"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1

# Rollback to specific revision
alembic downgrade abc123

# View migration history
alembic history

# View current revision
alembic current
```

```python
# Generated migration file
def upgrade() -> None:
    op.create_table('users',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('email', sa.String(254), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('email'),
    )
    op.create_index('ix_users_email', 'users', ['email'])

def downgrade() -> None:
    op.drop_index('ix_users_email', table_name='users')
    op.drop_table('users')


# --- Data migration in Alembic ---
def upgrade():
    # Schema change
    op.add_column('users', sa.Column('full_name', sa.String(200)))

    # Data migration using bulk SQL
    op.execute("""
        UPDATE users
        SET full_name = first_name || ' ' || last_name
    """)

    # Then make it NOT NULL
    op.alter_column('users', 'full_name', nullable=False)

def downgrade():
    op.drop_column('users', 'full_name')


# --- Concurrent index creation (PostgreSQL, zero downtime) ---
def upgrade():
    op.execute('COMMIT')  # End transaction — CREATE CONCURRENTLY can't run in one
    op.execute('CREATE INDEX CONCURRENTLY ix_users_email ON users(email)')

def downgrade():
    op.execute('COMMIT')
    op.execute('DROP INDEX CONCURRENTLY ix_users_email')
```

---

<a name="comparison"></a>
# QUICK COMPARISON TABLE

| Feature | Django ORM | SQLAlchemy |
|---|---|---|
| **Query style** | `Model.objects.filter()` | `select(Model).where()` |
| **Session/DB access** | Auto (thread-local) | Explicit `Session` |
| **N+1 fix (FK)** | `select_related` | `joinedload` |
| **N+1 fix (M2M/reverse)** | `prefetch_related` | `selectinload` |
| **Fine-grained prefetch** | `Prefetch(queryset=...)` | `.options(selectinload(...))` |
| **Atomic field update** | `F('field') + 1` | `update().values(col=col+1)` |
| **Row locking** | `select_for_update()` | `.with_for_update()` |
| **Complex filters** | `Q` objects | `and_()`, `or_()`, `not_()` |
| **Aggregation** | `annotate()`, `aggregate()` | `func.count()`, `func.avg()` |
| **Raw SQL** | `.raw()`, `cursor.execute()` | `text()`, `connection.execute()` |
| **Transactions** | `transaction.atomic()` | `session.begin()` |
| **Bulk insert** | `bulk_create()` | Core `insert()` |
| **Bulk update** | `bulk_update()` | Core `update().where()` |
| **Migrations** | Built-in `makemigrations` | Alembic (third-party) |
| **Custom logic** | Managers, QuerySets | Events, hybrid properties |
| **Async support** | Django 4.1+ (limited) | `AsyncSession`, `asyncpg` |
| **JSON field** | `JSONField` | `JSON` type |
| **Multi-DB** | `using='secondary'` | Multiple engines |
| **Learning curve** | Easier | Steeper |
| **Flexibility** | Less, more opinionated | More, explicit |

---

<a name="tips"></a>
# INTERVIEW TIPS BY EXPERIENCE LEVEL

## For 0-2 Years
- Know the basic CRUD operations cold
- Understand QuerySet lazy evaluation clearly
- Be able to explain ForeignKey and on_delete options
- Know what N+1 is and how to fix it

## For 3-4 Years
- Deep knowledge of `select_related` vs `prefetch_related`
- Comfortable with `Q`, `F`, `annotate`, `aggregate`
- Know when to use `values()` for performance
- Understand database transactions and atomicity
- Can write and explain migrations

## For 5-7 Years (Senior)
- Diagnose slow queries systematically (EXPLAIN, indexes)
- Design custom managers and QuerySet APIs
- Know connection pooling internals
- Handle race conditions with row locking
- Design zero-downtime migration strategies
- Understand async ORM patterns
- Trade-offs between ORM convenience and raw SQL performance
- Production concerns: monitoring, connection leaks, pool sizing

## Common Senior-Level Questions
- "How would you handle 1 million rows without loading them all into memory?"
  → `iterator()`, `bulk_create()`, chunked processing
- "How do you prevent race conditions in a booking system?"
  → `select_for_update()`, `with_for_update()`, atomic transactions
- "How do you deploy a migration to production safely without downtime?"
  → Nullable column first, backfill, then add constraint; avoid locks
- "When would you use raw SQL instead of ORM?"
  → Complex analytics, window functions, DB-specific features, extreme performance needs
