# Flask & FastAPI Interview Questions — Basic to Expert
## For 6-7 Years Experience | Complete Guide

> Difficulty: **B** = Basic | **I** = Intermediate | **A** = Advanced | **E** = Expert
> Each question includes the answer + code example where relevant.

---

# PART 1: FLASK (50 Questions)

---

## Section 1: Core Concepts

### [B] Q1: What is Flask? How does it differ from Django?

**Answer:**
Flask is a lightweight WSGI micro-framework. "Micro" means it doesn't include ORM, form validation, or admin panel by default — you pick your own libraries.

| Aspect | Flask | Django |
|--------|-------|--------|
| Philosophy | Micro, unopinionated | Batteries-included |
| ORM | SQLAlchemy (choose your own) | Django ORM (built-in) |
| Admin | None (use Flask-Admin) | Built-in admin panel |
| Templating | Jinja2 | Django Template Language |
| Routing | Decorators | urls.py patterns |
| Best For | APIs, microservices, small-to-mid apps | Full-stack web apps, CMS |

---

### [B] Q2: Explain the Flask application factory pattern. Why is it important?

**Answer:**
Instead of creating a global `app` object, you create the app inside a function. This allows:
1. **Multiple instances** (testing vs production)
2. **Lazy initialization** of extensions
3. **Blueprint registration** at the right time
4. **Circular import prevention**

```python
def create_app(config_name="development"):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Register blueprints
    from .auth import auth_bp
    app.register_blueprint(auth_bp)

    return app
```

---

### [B] Q3: What are Blueprints? Why use them?

**Answer:**
Blueprints group related views, templates, and static files. They are Flask's modularization mechanism.

```python
from flask import Blueprint

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    return jsonify(msg="logged in")

# In the factory:
app.register_blueprint(auth_bp)
```

**Benefits:**
- Organize large apps into modules
- Each module can have its own templates/static files
- Reusable across different apps
- URL prefix isolation

---

### [B] Q4: Explain Flask's request-response cycle.

**Answer:**
1. Client sends HTTP request → WSGI server (Gunicorn) receives it
2. Flask creates **application context** (`current_app`, `g`) and **request context** (`request`, `session`)
3. **Before-request hooks** run (`@app.before_request`)
4. **URL routing** matches the request to a view function
5. **View function** executes and returns a response
6. **After-request hooks** run (`@app.after_request`)
7. **Teardown functions** run (`@app.teardown_request`)
8. Response sent to client, contexts are popped

---

### [I] Q5: Explain Flask's Application Context vs Request Context.

**Answer:**

| Context | Proxy Variables | Lifetime | Purpose |
|---------|----------------|----------|---------|
| **Application** | `current_app`, `g` | Per-request or manually pushed | Access app config, store per-request data |
| **Request** | `request`, `session` | Per-request | Access HTTP request data, session cookies |

```python
# 'g' — per-request temporary storage (dies after request)
@app.before_request
def load_user():
    g.user = get_user_from_token(request.headers.get('Authorization'))

@app.route('/profile')
def profile():
    return jsonify(user=g.user.to_dict())  # available for this request only

# Manual context push (for CLI commands, testing)
with app.app_context():
    db.create_all()  # current_app is available here
```

**Key difference:** `g` resets every request, `session` persists across requests (cookie-based).

---

### [I] Q6: How do you handle configuration in Flask for different environments?

**Answer:**
```python
class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

class DevelopmentConfig(Config):
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///dev.db'

class ProductionConfig(Config):
    SQLALCHEMY_DATABASE_URI = os.environ['DATABASE_URL']

class TestingConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
}

# Usage in factory:
app.config.from_object(config[config_name])
```

**Best practices:**
- Never hardcode secrets — use environment variables
- Use `.env` files with `python-dotenv` for local dev
- Different configs for dev/test/staging/prod

---

### [I] Q7: How do `@app.before_request`, `@app.after_request`, and `@app.teardown_request` differ?

**Answer:**

| Hook | When | Use Case | Receives |
|------|------|----------|----------|
| `before_request` | Before every request | Auth checks, logging, timing | Nothing |
| `after_request` | After response is created | Add headers, CORS, logging | Response object |
| `teardown_request` | After response sent, even on error | Close DB connections, cleanup | Exception or None |

```python
@app.before_request
def start_timer():
    g.start_time = time.time()

@app.after_request
def add_headers(response):
    response.headers['X-Response-Time'] = f"{time.time() - g.start_time:.4f}s"
    return response  # MUST return the response

@app.teardown_request
def close_connection(exception):
    db_conn = getattr(g, 'db_conn', None)
    if db_conn:
        db_conn.close()
```

---

### [I] Q8: Explain Flask's error handling system.

**Answer:**
```python
# Method 1: Register custom error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify(error="Not Found", message=str(error)), 404

@app.errorhandler(500)
def server_error(error):
    db.session.rollback()  # clean up failed DB transaction
    return jsonify(error="Internal Server Error"), 500

# Method 2: Custom exceptions
class APIError(Exception):
    def __init__(self, message, status_code=400):
        self.message = message
        self.status_code = status_code

@app.errorhandler(APIError)
def handle_api_error(error):
    return jsonify(error=error.message), error.status_code

# Usage in view:
@app.route('/item/<int:id>')
def get_item(id):
    item = Item.query.get(id)
    if not item:
        raise APIError("Item not found", 404)
    return jsonify(item.to_dict())
```

---

## Section 2: Routing & Views

### [B] Q9: Explain Flask's URL routing system with variable rules.

**Answer:**
```python
# Basic route
@app.route('/users')
def list_users(): ...

# Variable rules with converters
@app.route('/user/<int:user_id>')       # int converter
@app.route('/post/<slug>')              # string (default)
@app.route('/file/<path:filepath>')     # path (includes slashes)
@app.route('/item/<float:price>')       # float
@app.route('/tag/<uuid:tag_id>')        # UUID

# Multiple methods
@app.route('/users', methods=['GET', 'POST'])
def users():
    if request.method == 'POST':
        return create_user()
    return list_users()

# URL building (reverse routing)
url_for('users')                # → /users
url_for('get_user', user_id=5)  # → /user/5
url_for('static', filename='style.css')  # → /static/style.css
```

---

### [I] Q10: How do you implement RESTful APIs in Flask?

**Answer:**
```python
from flask import Blueprint, jsonify, request, abort

api = Blueprint('api', __name__, url_prefix='/api/v1')

@api.route('/users', methods=['GET'])
def list_users():
    page = request.args.get('page', 1, type=int)
    users = User.query.paginate(page=page, per_page=20)
    return jsonify(
        data=[u.to_dict() for u in users.items],
        meta={"page": users.page, "total": users.total}
    )

@api.route('/users', methods=['POST'])
def create_user():
    data = request.get_json()
    if not data:
        abort(400, description="JSON body required")
    user = User(**data)
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201  # 201 Created

@api.route('/users/<int:id>', methods=['GET'])
def get_user(id):
    user = db.session.get(User, id) or abort(404)
    return jsonify(user.to_dict())

@api.route('/users/<int:id>', methods=['PUT'])
def update_user(id):
    user = db.session.get(User, id) or abort(404)
    for key, value in request.get_json().items():
        setattr(user, key, value)
    db.session.commit()
    return jsonify(user.to_dict())

@api.route('/users/<int:id>', methods=['DELETE'])
def delete_user(id):
    user = db.session.get(User, id) or abort(404)
    db.session.delete(user)
    db.session.commit()
    return '', 204  # No Content
```

---

## Section 3: Database & ORM

### [I] Q11: How do you use Flask-SQLAlchemy with relationships?

**Answer:**
```python
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(80), nullable=False)
    # One-to-Many: one user has many posts
    posts = db.relationship('Post', backref='author', lazy='dynamic')

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    # Many-to-Many through association table
    tags = db.relationship('Tag', secondary=post_tags, backref='posts')

# Association table for many-to-many
post_tags = db.Table('post_tags',
    db.Column('post_id', db.Integer, db.ForeignKey('post.id')),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'))
)

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True)
```

**Lazy loading options:**
- `lazy='select'` (default) — load when accessed (N+1 problem!)
- `lazy='dynamic'` — returns a query object
- `lazy='joined'` — JOIN at load time (eager)
- `lazy='subquery'` — subquery at load time (eager)

---

### [A] Q12: Explain the N+1 query problem and how to solve it in Flask-SQLAlchemy.

**Answer:**
N+1 occurs when you load N records, then for each one, a separate query loads related data.

```python
# BAD: N+1 queries (1 query for users + N queries for posts)
users = User.query.all()
for user in users:
    print(user.posts.all())  # triggers a new query each time!

# GOOD: Eager loading with joinedload
from sqlalchemy.orm import joinedload

users = User.query.options(joinedload(User.posts)).all()
# Only 1 query with JOIN — all posts loaded at once

# GOOD: subqueryload (better for large result sets)
from sqlalchemy.orm import subqueryload
users = User.query.options(subqueryload(User.posts)).all()
# 2 queries: one for users, one subquery for all posts
```

---

### [A] Q13: How do you handle database migrations with Flask-Migrate?

**Answer:**
```bash
# Setup
flask db init          # creates migrations/ directory
flask db migrate -m "Add user table"   # auto-generate migration
flask db upgrade       # apply migration to DB
flask db downgrade     # rollback last migration
flask db history       # show migration history
```

```python
# In factory:
from flask_migrate import Migrate
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    db.init_app(app)
    migrate.init_app(app, db)
    return app
```

**Interview tip:** Migrations should ALWAYS be reviewed before applying — auto-generated migrations can miss things or generate incorrect operations.

---

## Section 4: Authentication & Security

### [I] Q14: How do you implement JWT authentication in Flask?

**Answer:**
```python
from flask_jwt_extended import (
    JWTManager, create_access_token, jwt_required, get_jwt_identity
)

jwt = JWTManager(app)

@app.route('/login', methods=['POST'])
def login():
    user = User.query.filter_by(username=request.json['username']).first()
    if user and user.check_password(request.json['password']):
        token = create_access_token(
            identity=str(user.id),
            additional_claims={"role": user.role}
        )
        return jsonify(access_token=token)
    return jsonify(msg="Bad credentials"), 401

@app.route('/protected')
@jwt_required()
def protected():
    user_id = get_jwt_identity()
    return jsonify(user_id=user_id)
```

**JWT vs Session:**
| JWT | Session |
|-----|---------|
| Stateless (no server storage) | Server-side storage (Redis/DB) |
| Good for APIs, microservices | Good for traditional web apps |
| Can't invalidate easily | Easy to invalidate (delete session) |
| Larger payload (sent every request) | Small cookie |

---

### [A] Q15: Explain CSRF protection in Flask. When is it needed?

**Answer:**
CSRF (Cross-Site Request Forgery) — attacker tricks user's browser into making unwanted requests.

```python
from flask_wtf.csrf import CSRFProtect
csrf = CSRFProtect(app)

# Automatically protects all POST/PUT/DELETE for form-based apps
# For APIs with JWT — CSRF is NOT needed (JWT is not auto-sent by browser)

# Exempt specific routes:
@csrf.exempt
@app.route('/api/webhook', methods=['POST'])
def webhook():
    return handle_webhook()
```

**When CSRF is needed:**
- Cookie-based session authentication (browser auto-sends cookies)
- Server-rendered forms

**When CSRF is NOT needed:**
- JWT auth (token in Authorization header — not auto-sent)
- API-only backends

---

### [A] Q16: How do you implement role-based access control (RBAC)?

**Answer:**
```python
import functools
from flask_jwt_extended import jwt_required, get_jwt

def role_required(*roles):
    """Decorator factory for role-based access."""
    def decorator(fn):
        @functools.wraps(fn)
        @jwt_required()
        def wrapper(*args, **kwargs):
            claims = get_jwt()
            if claims.get("role") not in roles:
                return jsonify(msg="Insufficient permissions"), 403
            return fn(*args, **kwargs)
        return wrapper
    return decorator

# Usage:
@app.route('/admin/dashboard')
@role_required('admin', 'superadmin')
def admin_dashboard():
    return jsonify(data="admin stuff")

@app.route('/editor/posts')
@role_required('editor', 'admin')
def editor_posts():
    return jsonify(data="editor stuff")
```

---

## Section 5: Testing

### [I] Q17: How do you test Flask applications?

**Answer:**
```python
import pytest
from app import create_app, db

@pytest.fixture
def app():
    app = create_app('testing')
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app):
    return app.test_client()

def test_register(client):
    resp = client.post('/api/auth/register', json={
        'username': 'test', 'email': 'test@t.com', 'password': 'pass123'
    })
    assert resp.status_code == 201

def test_login(client):
    # Setup
    client.post('/api/auth/register', json={...})
    # Test
    resp = client.post('/api/auth/login', json={
        'username': 'test', 'password': 'pass123'
    })
    assert 'access_token' in resp.get_json()
```

**Key testing concepts:**
- Use `app.test_client()` — no real HTTP server
- In-memory SQLite for speed
- Fixtures for setup/teardown
- Test both happy paths and error paths

---

## Section 6: Performance & Production

### [A] Q18: How do you deploy Flask in production?

**Answer:**
**Never use `flask run` in production!** Flask's dev server is single-threaded and not secure.

```bash
# Gunicorn (Linux/Mac)
gunicorn -w 4 -b 0.0.0.0:8000 "app:create_app()"

# With gevent workers (async I/O)
gunicorn -w 4 -k gevent -b 0.0.0.0:8000 "app:create_app()"

# Waitress (Windows-compatible)
waitress-serve --port=8000 --call "app:create_app"
```

**Production checklist:**
1. Use WSGI server (Gunicorn, uWSGI, Waitress)
2. Put Nginx/Caddy in front as reverse proxy
3. Set `DEBUG=False`
4. Use environment variables for secrets
5. Enable HTTPS
6. Set up logging (not print statements)
7. Use connection pooling for database
8. Set up health checks

---

### [A] Q19: How do you implement caching in Flask?

**Answer:**
```python
from flask_caching import Cache

cache = Cache(config={
    'CACHE_TYPE': 'RedisCache',
    'CACHE_REDIS_URL': 'redis://localhost:6379/0',
    'CACHE_DEFAULT_TIMEOUT': 300
})
cache.init_app(app)

# Cache entire response
@app.route('/api/posts')
@cache.cached(timeout=60, query_string=True)
def list_posts():
    return jsonify(posts=Post.query.all())

# Cache function results (memoize)
@cache.memoize(timeout=120)
def get_user_stats(user_id):
    return expensive_calculation(user_id)

# Manual cache control
cache.set('key', value, timeout=300)
result = cache.get('key')
cache.delete('key')
cache.clear()  # flush all

# Cache invalidation on write
@app.route('/api/posts', methods=['POST'])
def create_post():
    post = Post(**request.json)
    db.session.add(post)
    db.session.commit()
    cache.delete_memoized(list_posts)  # invalidate
    return jsonify(post.to_dict()), 201
```

---

### [E] Q20: Explain WSGI. How does Flask interact with web servers?

**Answer:**
WSGI (Web Server Gateway Interface) is the Python standard (PEP 3333) for communication between web servers and Python applications.

```python
# A minimal WSGI app (what Flask IS under the hood):
def application(environ, start_response):
    status = '200 OK'
    headers = [('Content-Type', 'text/plain')]
    start_response(status, headers)
    return [b'Hello World']

# Flask IS a WSGI app:
app = Flask(__name__)
# app.__call__(environ, start_response) is called by the WSGI server

# The flow:
# Client → Nginx → Gunicorn (WSGI server) → Flask (WSGI app) → Response
```

**Why this matters:**
- Flask can't do async natively (WSGI is synchronous)
- One worker = one request at a time
- Use multiple workers (Gunicorn -w 4) for concurrency
- For async, use FastAPI (ASGI) or Flask with gevent

---

### [E] Q21: How do you handle long-running tasks in Flask?

**Answer:**
Flask is synchronous — long tasks block the worker. Solutions:

```python
# Method 1: Celery (production standard)
from celery import Celery

celery = Celery('tasks', broker='redis://localhost:6379/0')

@celery.task
def send_email(to, subject, body):
    # takes 5 seconds
    mail.send(Message(subject=subject, recipients=[to], body=body))

@app.route('/api/send-email', methods=['POST'])
def trigger_email():
    send_email.delay("user@test.com", "Hello", "World")  # async!
    return jsonify(msg="Email queued"), 202

# Method 2: Thread (simple cases)
import threading

@app.route('/api/process')
def process():
    thread = threading.Thread(target=long_running_task, args=(data,))
    thread.start()
    return jsonify(msg="Processing started"), 202

# Method 3: RQ (Redis Queue) — simpler than Celery
from rq import Queue
q = Queue(connection=Redis())

@app.route('/api/report')
def generate_report():
    job = q.enqueue(build_report, user_id=1)
    return jsonify(job_id=job.id), 202
```

---

### [E] Q22: How do you implement rate limiting in Flask?

**Answer:**
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,  # limit by IP
    default_limits=["200 per day", "50 per hour"],
    storage_uri="redis://localhost:6379",
)

# Per-route limits
@app.route('/api/login', methods=['POST'])
@limiter.limit("5 per minute")  # prevent brute force
def login():
    ...

# Dynamic limits
@app.route('/api/expensive')
@limiter.limit(lambda: "10/hour" if not current_user.is_premium else "100/hour")
def expensive_operation():
    ...

# Exempt routes
@app.route('/health')
@limiter.exempt
def health():
    return jsonify(status="ok")

# Custom key function (limit by user ID instead of IP)
@app.route('/api/data')
@limiter.limit("100/hour", key_func=lambda: get_jwt_identity())
def get_data():
    ...
```

---

### [E] Q23: How do you implement API versioning in Flask?

**Answer:**
```python
# Method 1: URL prefix (most common, most explicit)
v1 = Blueprint('v1', __name__, url_prefix='/api/v1')
v2 = Blueprint('v2', __name__, url_prefix='/api/v2')

@v1.route('/users')
def get_users_v1():
    return jsonify([{"name": u.name} for u in User.query.all()])

@v2.route('/users')
def get_users_v2():
    return jsonify({
        "data": [{"name": u.name, "email": u.email} for u in User.query.all()],
        "meta": {"total": User.query.count()}
    })

# Method 2: Header-based versioning
@app.route('/api/users')
def get_users():
    version = request.headers.get('API-Version', '1')
    if version == '2':
        return get_users_v2_logic()
    return get_users_v1_logic()

# Method 3: Accept header (content negotiation)
# Accept: application/vnd.myapi.v2+json
```

---

### [A] Q24: What are Flask signals? When would you use them?

**Answer:**
Signals are a pub/sub mechanism for decoupled event handling (uses the `blinker` library).

```python
from flask import request_started, request_finished, got_request_exception

# Built-in signals
def log_request(sender, **extra):
    print(f"Request started: {request.path}")

request_started.connect(log_request, app)

# Custom signals
from blinker import Namespace

my_signals = Namespace()
user_registered = my_signals.signal('user-registered')

# Emit signal
@app.route('/register', methods=['POST'])
def register():
    user = create_user(request.json)
    user_registered.send(app, user=user)  # fire and forget
    return jsonify(user.to_dict()), 201

# Subscribe to signal (decoupled handler)
def send_welcome_email(sender, user, **kwargs):
    mail.send(to=user.email, subject="Welcome!")

user_registered.connect(send_welcome_email)
```

**vs. hooks:** Signals are fire-and-forget, multiple subscribers, decoupled. Hooks (`before_request`) are linear and can modify the request/response.

---

### [A] Q25: How do you structure a large Flask application?

**Answer:**
```
myapp/
├── app/
│   ├── __init__.py          # create_app() factory
│   ├── config.py            # Config classes
│   ├── extensions.py        # db, jwt, cache, mail instances
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── post.py
│   ├── api/
│   │   ├── __init__.py      # API blueprint
│   │   ├── auth.py          # /auth routes
│   │   ├── users.py         # /users routes
│   │   └── posts.py         # /posts routes
│   ├── services/            # Business logic
│   │   ├── user_service.py
│   │   └── post_service.py
│   ├── schemas/             # Marshmallow schemas
│   │   ├── user_schema.py
│   │   └── post_schema.py
│   └── utils/
│       ├── decorators.py
│       └── helpers.py
├── migrations/
├── tests/
│   ├── conftest.py          # Shared fixtures
│   ├── test_auth.py
│   └── test_posts.py
├── .env
├── requirements.txt
└── wsgi.py                  # Entry point for production
```

**Key principles:**
- Separate models, routes, services, schemas
- Extensions in one file to avoid circular imports
- Factory pattern in `__init__.py`
- Services layer for business logic (keeps views thin)

---

---

# PART 2: FASTAPI (50 Questions)

---

## Section 1: Core Concepts

### [B] Q26: What is FastAPI? Why choose it over Flask?

**Answer:**
FastAPI is a modern, high-performance ASGI web framework built on:
- **Starlette** (async web framework)
- **Pydantic** (data validation)
- **Python type hints** (powers everything)

| Feature | FastAPI | Flask |
|---------|---------|-------|
| Protocol | ASGI (async) | WSGI (sync) |
| Type Hints | Required, powers validation | Optional |
| Validation | Automatic (Pydantic) | Manual or Marshmallow |
| API Docs | Auto-generated (Swagger + ReDoc) | None built-in |
| Performance | ~On par with Node.js/Go | Slower |
| Dependency Injection | Built-in | Manual |
| WebSocket | Built-in | Flask-SocketIO |

---

### [B] Q27: Explain Pydantic models in FastAPI.

**Answer:**
Pydantic models define the shape of request/response data with automatic validation.

```python
from pydantic import BaseModel, Field, EmailStr, field_validator

class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=50)
    email: EmailStr
    age: int = Field(ge=18, le=120)
    role: str = "user"

    # Custom validation
    @field_validator('username')
    @classmethod
    def username_alphanumeric(cls, v):
        if not v.isalnum():
            raise ValueError('must be alphanumeric')
        return v.lower()

# FastAPI auto-validates incoming JSON:
@app.post("/users")
async def create_user(user: UserCreate):  # ← auto-validated
    return user  # auto-serialized to JSON

# Invalid request automatically returns 422 with details:
# {"detail": [{"loc": ["body", "age"], "msg": "...", "type": "..."}]}
```

---

### [B] Q28: How does FastAPI handle path parameters and query parameters?

**Answer:**
```python
from fastapi import Path, Query
from typing import Annotated

# Path parameters — part of the URL
@app.get("/users/{user_id}")
async def get_user(
    user_id: Annotated[int, Path(ge=1, description="User ID")]
):
    return {"user_id": user_id}

# Query parameters — after ? in URL
@app.get("/users")
async def list_users(
    page: Annotated[int, Query(ge=1)] = 1,
    per_page: Annotated[int, Query(ge=1, le=100)] = 10,
    search: str | None = None,  # optional
    sort_by: str = "created_at",  # default value
):
    return {"page": page, "per_page": per_page}

# GET /users?page=2&per_page=20&search=john
```

**Rule:** If a parameter is in the path → path param. Otherwise → query param.

---

### [I] Q29: Explain FastAPI's Dependency Injection system.

**Answer:**
Dependencies are reusable functions that provide values to route handlers. FastAPI resolves them automatically.

```python
from fastapi import Depends
from typing import Annotated

# Simple dependency
async def get_db():
    db = SessionLocal()
    try:
        yield db  # yield = cleanup after request
    finally:
        db.close()

# Dependency that depends on another dependency
async def get_current_user(
    token: str = Depends(get_token_from_header),
    db: Session = Depends(get_db),
) -> User:
    user = db.query(User).filter(User.id == decode(token)).first()
    if not user:
        raise HTTPException(401, "Invalid token")
    return user

# Chain dependencies
async def get_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(403, "Not admin")
    return user

# Use type aliases for clean code (Annotated pattern)
DbSession = Annotated[Session, Depends(get_db)]
CurrentUser = Annotated[User, Depends(get_current_user)]
AdminUser = Annotated[User, Depends(get_admin)]

@app.get("/admin/users")
async def list_users(db: DbSession, admin: AdminUser):
    return db.query(User).all()
```

**DI Benefits:**
- Reusable logic (auth, DB, pagination)
- Automatic cleanup with `yield`
- Testable (override with `app.dependency_overrides`)
- Sub-dependencies resolved automatically

---

### [I] Q30: What is the difference between `def` and `async def` in FastAPI?

**Answer:**
```python
# async def — for I/O-bound operations (DB, HTTP, file I/O)
@app.get("/async")
async def async_route():
    result = await some_async_db_query()  # non-blocking
    return result

# def — for CPU-bound or sync libraries
@app.get("/sync")
def sync_route():
    result = sync_db_query()  # runs in thread pool (auto!)
    return result
```

**Key rules:**
1. Use `async def` when you `await` something
2. Use `def` for sync code — FastAPI auto-runs it in a **thread pool** (won't block)
3. **NEVER** use blocking calls inside `async def` — it blocks the entire event loop!

```python
# BAD — blocks event loop:
@app.get("/bad")
async def bad():
    time.sleep(5)  # blocks everything!

# GOOD — either make it sync:
@app.get("/good")
def good():
    time.sleep(5)  # runs in thread pool

# Or use async sleep:
@app.get("/also-good")
async def also_good():
    await asyncio.sleep(5)  # non-blocking
```

---

### [I] Q31: How does FastAPI auto-generate API documentation?

**Answer:**
FastAPI generates OpenAPI (Swagger) spec automatically from your code:

```python
@app.post(
    "/users",
    response_model=UserResponse,
    status_code=201,
    summary="Create a new user",
    description="Registers a user with validation",
    tags=["users"],
    responses={
        409: {"description": "Username already exists"},
        422: {"description": "Validation error"},
    },
)
async def create_user(user: UserCreate):
    """
    Create a user with:
    - **username**: 3-50 alphanumeric chars
    - **email**: valid email address
    - **password**: minimum 6 characters
    """
    ...
```

**Docs available at:**
- `/docs` — Swagger UI (interactive)
- `/redoc` — ReDoc (read-only, better for documentation)
- `/openapi.json` — Raw OpenAPI JSON spec

---

### [A] Q32: Explain FastAPI's middleware system.

**Answer:**
```python
from fastapi import Request
from starlette.middleware.base import BaseHTTPMiddleware

# Method 1: @app.middleware decorator
@app.middleware("http")
async def timing_middleware(request: Request, call_next):
    start = time.perf_counter()
    response = await call_next(request)
    duration = time.perf_counter() - start
    response.headers["X-Response-Time"] = f"{duration:.4f}s"
    return response

# Method 2: Class-based middleware
class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api/"):
            token = request.headers.get("Authorization")
            if not token:
                return JSONResponse(status_code=401, content={"detail": "No token"})
        return await call_next(request)

app.add_middleware(AuthMiddleware)

# Built-in middleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"])
app.add_middleware(GZipMiddleware, minimum_size=1000)
```

**Middleware execution order:** Last added → first executed (stack order).

---

## Section 2: Async & Performance

### [A] Q33: How does ASGI differ from WSGI?

**Answer:**

| Feature | WSGI | ASGI |
|---------|------|------|
| Protocol | Synchronous | Asynchronous |
| Concurrency | Thread-based | Event loop (single thread handles many) |
| WebSocket | Not supported | Native support |
| HTTP/2 | Not supported | Supported |
| Server | Gunicorn, uWSGI | Uvicorn, Hypercorn, Daphne |
| Framework | Flask, Django | FastAPI, Starlette, Django (channels) |

```python
# WSGI app signature:
def app(environ, start_response):
    start_response('200 OK', [('Content-Type', 'text/plain')])
    return [b'Hello']

# ASGI app signature:
async def app(scope, receive, send):
    await send({
        'type': 'http.response.start',
        'status': 200,
        'headers': [[b'content-type', b'text/plain']],
    })
    await send({'type': 'http.response.body', 'body': b'Hello'})
```

---

### [A] Q34: How do you handle concurrent async operations in FastAPI?

**Answer:**
```python
import asyncio
import httpx

# Sequential (slow) — each call waits for the previous
@app.get("/sequential")
async def sequential():
    async with httpx.AsyncClient() as client:
        users = await client.get("https://api.example.com/users")      # 200ms
        posts = await client.get("https://api.example.com/posts")      # 200ms
        comments = await client.get("https://api.example.com/comments") # 200ms
    # Total: ~600ms

# Concurrent (fast) — all calls run simultaneously
@app.get("/concurrent")
async def concurrent():
    async with httpx.AsyncClient() as client:
        users, posts, comments = await asyncio.gather(
            client.get("https://api.example.com/users"),
            client.get("https://api.example.com/posts"),
            client.get("https://api.example.com/comments"),
        )
    # Total: ~200ms (max of all three)

# With error handling
results = await asyncio.gather(
    task1(), task2(), task3(),
    return_exceptions=True  # don't fail all if one fails
)
for result in results:
    if isinstance(result, Exception):
        logger.error(f"Task failed: {result}")
```

---

### [E] Q35: How do you handle CPU-bound work in an async FastAPI app?

**Answer:**
CPU-bound work blocks the event loop. Solutions:

```python
import asyncio
from concurrent.futures import ProcessPoolExecutor

# Method 1: run_in_executor with ProcessPoolExecutor
executor = ProcessPoolExecutor(max_workers=4)

def heavy_computation(data):
    """CPU-intensive — runs in separate process."""
    return sum(x**2 for x in range(10_000_000))

@app.get("/compute")
async def compute():
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(executor, heavy_computation, data)
    return {"result": result}

# Method 2: Use Celery for really heavy work
@app.post("/report")
async def generate_report(background_tasks: BackgroundTasks):
    task = celery_app.send_task("generate_report", args=[user_id])
    return {"task_id": task.id, "status": "processing"}

@app.get("/report/{task_id}")
async def get_report_status(task_id: str):
    result = AsyncResult(task_id)
    return {"status": result.status, "result": result.result}
```

---

## Section 3: Pydantic V2 Deep Dive

### [I] Q36: What are the key changes in Pydantic V2?

**Answer:**
```python
from pydantic import BaseModel, ConfigDict, field_validator, model_validator

class UserV2(BaseModel):
    # model_config replaces inner Config class
    model_config = ConfigDict(
        from_attributes=True,     # was: orm_mode = True
        str_strip_whitespace=True,
        validate_default=True,
    )

    name: str
    email: str
    age: int

    # field_validator replaces @validator
    @field_validator('name')
    @classmethod
    def name_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('name cannot be empty')
        return v

    # model_validator replaces @root_validator
    @model_validator(mode='after')
    def check_consistency(self):
        if self.age < 18 and 'admin' in self.name.lower():
            raise ValueError('admins must be 18+')
        return self

# Key V2 changes:
# - Config class → model_config = ConfigDict(...)
# - orm_mode → from_attributes
# - @validator → @field_validator
# - @root_validator → @model_validator
# - .dict() → .model_dump()
# - .json() → .model_dump_json()
# - .parse_obj() → .model_validate()
# - 5-50x faster (Rust core)
```

---

### [A] Q37: How do you handle complex response models in FastAPI?

**Answer:**
```python
from pydantic import BaseModel

# Nested models
class Address(BaseModel):
    street: str
    city: str
    country: str

class UserResponse(BaseModel):
    id: int
    name: str
    address: Address | None = None
    tags: list[str] = []

# Generic pagination response
from typing import Generic, TypeVar
T = TypeVar("T")

class PaginatedResponse(BaseModel, Generic[T]):
    data: list[T]
    total: int
    page: int
    per_page: int

# Usage:
@app.get("/users", response_model=PaginatedResponse[UserResponse])
async def list_users():
    ...

# Exclude fields from response
class UserFull(BaseModel):
    id: int
    name: str
    email: str
    password_hash: str  # we don't want this in the response!

class UserPublic(BaseModel):
    id: int
    name: str
    email: str

@app.get("/users/{id}", response_model=UserPublic)
async def get_user(id: int):
    return user  # password_hash is automatically excluded
```

---

## Section 4: Database (Async SQLAlchemy)

### [I] Q38: How do you set up async SQLAlchemy with FastAPI?

**Answer:**
```python
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

# Engine & session factory
engine = create_async_engine("sqlite+aiosqlite:///app.db")
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Modern declarative base (SQLAlchemy 2.0+)
class Base(DeclarativeBase):
    pass

class User(Base):
    __tablename__ = "users"
    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(80))
    email: Mapped[str] = mapped_column(String(120), unique=True)

# Dependency
async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

# Usage in route
@app.get("/users")
async def list_users(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    users = result.scalars().all()
    return users
```

---

### [A] Q39: Explain async database query patterns in FastAPI.

**Answer:**
```python
from sqlalchemy import select, func, and_, or_

# Basic CRUD
async def get_user(db: AsyncSession, user_id: int):
    result = await db.execute(select(User).where(User.id == user_id))
    return result.scalar_one_or_none()

# Filtering with multiple conditions
async def search_users(db: AsyncSession, name: str, min_age: int):
    stmt = select(User).where(
        and_(
            User.name.ilike(f"%{name}%"),
            User.age >= min_age
        )
    )
    result = await db.execute(stmt)
    return result.scalars().all()

# Pagination
async def paginate_users(db: AsyncSession, page: int, per_page: int):
    # Count
    count_stmt = select(func.count()).select_from(User)
    total = (await db.execute(count_stmt)).scalar()

    # Fetch page
    stmt = select(User).offset((page-1) * per_page).limit(per_page)
    users = (await db.execute(stmt)).scalars().all()

    return {"data": users, "total": total, "pages": (total + per_page - 1) // per_page}

# Eager loading (avoid N+1)
from sqlalchemy.orm import selectinload
stmt = select(User).options(selectinload(User.posts))
result = await db.execute(stmt)
```

---

## Section 5: WebSocket & Real-time

### [A] Q40: How do you implement WebSockets in FastAPI?

**Answer:**
```python
from fastapi import WebSocket, WebSocketDisconnect

class ConnectionManager:
    def __init__(self):
        self.active_connections: dict[str, list[WebSocket]] = {}

    async def connect(self, ws: WebSocket, room: str = "default"):
        await ws.accept()
        self.active_connections.setdefault(room, []).append(ws)

    def disconnect(self, ws: WebSocket, room: str = "default"):
        self.active_connections[room].remove(ws)

    async def broadcast(self, message: str, room: str = "default"):
        for conn in self.active_connections.get(room, []):
            await conn.send_text(message)

    async def send_personal(self, ws: WebSocket, message: str):
        await ws.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{room}")
async def websocket_endpoint(ws: WebSocket, room: str):
    await manager.connect(ws, room)
    try:
        while True:
            data = await ws.receive_text()
            await manager.broadcast(f"Message in {room}: {data}", room)
    except WebSocketDisconnect:
        manager.disconnect(ws, room)
        await manager.broadcast(f"Client left {room}", room)
```

---

## Section 6: Background Tasks

### [I] Q41: How do background tasks work in FastAPI?

**Answer:**
```python
from fastapi import BackgroundTasks

# Simple background task
def write_log(message: str):
    with open("log.txt", "a") as f:
        f.write(f"{datetime.now()}: {message}\n")

def send_email(email: str, body: str):
    # simulate slow I/O
    time.sleep(2)
    print(f"Email sent to {email}")

@app.post("/items")
async def create_item(item: Item, background_tasks: BackgroundTasks):
    # These run AFTER the response is sent
    background_tasks.add_task(write_log, f"Item created: {item.name}")
    background_tasks.add_task(send_email, "admin@site.com", f"New item: {item.name}")
    return item  # response sent immediately

# Background tasks in dependencies
async def log_dependency(background_tasks: BackgroundTasks):
    background_tasks.add_task(write_log, "dependency executed")
```

**BackgroundTasks vs Celery:**
| BackgroundTasks | Celery |
|----------------|--------|
| In-process, simple | Separate workers, distributed |
| No retry/monitoring | Retry, monitoring (Flower) |
| Good for: emails, logging | Good for: heavy processing, scheduled |

---

## Section 7: Testing

### [I] Q42: How do you test FastAPI applications?

**Answer:**
```python
import pytest
from httpx import AsyncClient, ASGITransport

# Override dependencies for testing
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac

@pytest.mark.asyncio
async def test_create_user(client: AsyncClient):
    resp = await client.post("/users", json={
        "name": "Test", "email": "test@t.com", "password": "pass123"
    })
    assert resp.status_code == 201
    assert resp.json()["name"] == "Test"

@pytest.mark.asyncio
async def test_validation_error(client: AsyncClient):
    resp = await client.post("/users", json={"name": ""})
    assert resp.status_code == 422

# Test WebSocket
from starlette.testclient import TestClient
def test_websocket():
    client = TestClient(app)
    with client.websocket_connect("/ws") as ws:
        ws.send_text("hello")
        data = ws.receive_text()
        assert "hello" in data
```

---

## Section 8: Production & Deployment

### [A] Q43: How do you deploy FastAPI in production?

**Answer:**
```bash
# Basic Uvicorn
uvicorn app:app --host 0.0.0.0 --port 8000 --workers 4

# With Gunicorn + Uvicorn workers (recommended)
gunicorn app:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000

# Docker
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["gunicorn", "app:app", "-w", "4", "-k", "uvicorn.workers.UvicornWorker", "-b", "0.0.0.0:8000"]
```

**Production checklist:**
1. Gunicorn with UvicornWorker (multi-process + async)
2. Workers = (2 × CPU cores) + 1
3. Nginx/Caddy reverse proxy in front
4. HTTPS termination at proxy
5. Health check endpoint
6. Structured logging (not print)
7. Environment variables for secrets
8. Connection pooling (SQLAlchemy pool_size)

---

### [E] Q44: Explain FastAPI's lifespan events.

**Answer:**
```python
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # STARTUP — runs once when server starts
    print("Starting up...")
    engine = create_async_engine(DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # Store shared resources in app.state
    app.state.redis = await aioredis.from_url("redis://localhost")
    app.state.http_client = httpx.AsyncClient()

    yield  # ← app runs here

    # SHUTDOWN — runs once when server stops
    print("Shutting down...")
    await app.state.redis.close()
    await app.state.http_client.aclose()
    await engine.dispose()

app = FastAPI(lifespan=lifespan)

# This replaces the deprecated @app.on_event("startup") / @app.on_event("shutdown")
```

---

### [E] Q45: How do you implement custom exception handling in FastAPI?

**Answer:**
```python
from fastapi import HTTPException, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

# Custom exception class
class AppException(Exception):
    def __init__(self, status_code: int, detail: str, error_code: str = None):
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code

@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "error_code": exc.error_code,
            "path": str(request.url),
        },
    )

# Override default validation error format
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        errors.append({
            "field": " → ".join(str(loc) for loc in error["loc"]),
            "message": error["msg"],
            "type": error["type"],
        })
    return JSONResponse(status_code=422, content={"errors": errors})

# Usage
@app.get("/items/{id}")
async def get_item(id: int):
    item = await db.get(Item, id)
    if not item:
        raise AppException(404, "Item not found", error_code="ITEM_NOT_FOUND")
    return item
```

---

## Section 9: Advanced Patterns

### [E] Q46: How do you implement event-driven architecture with FastAPI?

**Answer:**
```python
# Method 1: In-process event bus
from collections import defaultdict
from typing import Callable

class EventBus:
    def __init__(self):
        self._handlers: dict[str, list[Callable]] = defaultdict(list)

    def subscribe(self, event: str, handler: Callable):
        self._handlers[event].append(handler)

    async def publish(self, event: str, data: dict):
        for handler in self._handlers[event]:
            if asyncio.iscoroutinefunction(handler):
                await handler(data)
            else:
                handler(data)

event_bus = EventBus()

# Register handlers
async def on_user_created(data):
    await send_welcome_email(data["email"])

def on_user_created_log(data):
    logger.info(f"User created: {data['username']}")

event_bus.subscribe("user.created", on_user_created)
event_bus.subscribe("user.created", on_user_created_log)

# Publish in route
@app.post("/users")
async def create_user(user: UserCreate, db: DbSession):
    new_user = User(**user.model_dump())
    db.add(new_user)
    await db.flush()
    await event_bus.publish("user.created", {"email": user.email, "username": user.username})
    return new_user
```

---

### [E] Q47: How do you implement a custom APIRouter with shared dependencies?

**Answer:**
```python
from fastapi import APIRouter

# Router with shared dependencies applied to ALL routes
authenticated_router = APIRouter(
    prefix="/api/v1",
    tags=["v1"],
    dependencies=[Depends(verify_api_key), Depends(rate_limit)],
    responses={401: {"description": "Not authenticated"}},
)

@authenticated_router.get("/users")
async def list_users(db: DbSession):
    ...  # verify_api_key and rate_limit already applied

@authenticated_router.get("/posts")
async def list_posts(db: DbSession):
    ...  # same dependencies

# Include in app
app.include_router(authenticated_router)

# Nested routers
admin_router = APIRouter(prefix="/admin", tags=["admin"])
admin_router.include_router(user_admin_router)  # /admin/users
admin_router.include_router(post_admin_router)  # /admin/posts
app.include_router(admin_router, dependencies=[Depends(get_admin_user)])
```

---

### [E] Q48: How do you implement Server-Sent Events (SSE) in FastAPI?

**Answer:**
```python
from fastapi.responses import StreamingResponse
import asyncio

async def event_generator():
    """Generate SSE events."""
    while True:
        data = await get_latest_data()
        yield f"data: {json.dumps(data)}\n\n"
        await asyncio.sleep(1)

@app.get("/stream")
async def stream():
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    )
```

**SSE vs WebSocket:**
| SSE | WebSocket |
|-----|-----------|
| Server → Client only | Bidirectional |
| HTTP (simple) | Upgrade protocol |
| Auto-reconnect | Manual reconnect |
| Good for: notifications, feeds | Good for: chat, gaming |

---

---

# PART 3: COMPARISON & SCENARIO QUESTIONS

---

### [A] Q49: When would you choose Flask over FastAPI and vice versa?

**Answer:**

**Choose Flask when:**
- Building traditional web apps with server-rendered HTML
- Team is more familiar with Flask
- Need extensive ecosystem (Flask-Admin, Flask-Login, Flask-Mail)
- Simple APIs without need for auto-docs or validation
- Legacy system integration

**Choose FastAPI when:**
- Building pure REST/GraphQL APIs
- Need high performance (async I/O)
- Want auto-generated API docs
- Heavy I/O-bound workload (many DB/API calls)
- WebSocket/real-time requirements
- Want built-in request validation
- Microservices architecture

---

### [A] Q50: How would you migrate a Flask app to FastAPI?

**Answer:**

**Step-by-step strategy:**
1. **Keep both running** — run Flask and FastAPI side-by-side behind a reverse proxy
2. **Migrate models first** — SQLAlchemy models work in both (just switch to async)
3. **Migrate routes incrementally** — one blueprint at a time
4. **Replace Marshmallow with Pydantic** schemas
5. **Replace decorators with Depends()** for auth
6. **Switch WSGI → ASGI** server (Gunicorn → Uvicorn)

```python
# Flask route:
@app.route('/users/<int:id>', methods=['GET'])
@login_required
def get_user(id):
    user = User.query.get_or_404(id)
    return jsonify(UserSchema().dump(user))

# Equivalent FastAPI route:
@app.get('/users/{id}', response_model=UserResponse)
async def get_user(id: int, db: DbSession, user: CurrentUser):
    result = await db.execute(select(User).where(User.id == id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(404, "User not found")
    return user
```

---

### [E] Q51: Design a microservice communication pattern using FastAPI.

**Answer:**
```python
# Service A calls Service B via async HTTP
import httpx

# Shared HTTP client (reuse connections)
@asynccontextmanager
async def lifespan(app: FastAPI):
    app.state.http = httpx.AsyncClient(base_url="http://service-b:8000", timeout=10)
    yield
    await app.state.http.aclose()

@app.get("/orders/{order_id}")
async def get_order(order_id: int, request: Request):
    # Get order from local DB
    order = await get_order_from_db(order_id)

    # Call user service for user details
    user_resp = await request.app.state.http.get(f"/users/{order.user_id}")
    user_resp.raise_for_status()

    return {**order.to_dict(), "user": user_resp.json()}

# With circuit breaker pattern
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
async def call_service(client: httpx.AsyncClient, path: str):
    resp = await client.get(path)
    resp.raise_for_status()
    return resp.json()
```

---

### [E] Q52: How do you handle database transactions across multiple operations?

**Answer:**

**Flask (synchronous):**
```python
@app.route('/transfer', methods=['POST'])
def transfer():
    try:
        sender = User.query.get(request.json['from_id'])
        receiver = User.query.get(request.json['to_id'])
        amount = request.json['amount']

        sender.balance -= amount
        receiver.balance += amount

        db.session.commit()  # atomic — both or neither
    except Exception:
        db.session.rollback()
        raise
```

**FastAPI (async):**
```python
@app.post("/transfer")
async def transfer(data: TransferRequest, db: DbSession):
    async with db.begin_nested():  # savepoint
        sender = await db.get(User, data.from_id, with_for_update=True)  # row lock
        receiver = await db.get(User, data.to_id, with_for_update=True)

        if sender.balance < data.amount:
            raise HTTPException(400, "Insufficient funds")

        sender.balance -= data.amount
        receiver.balance += data.amount
    # commit happens automatically via dependency
```

---

---

# PART 4: QUICK-FIRE QUESTIONS (Common in Interviews)

### Flask Quick-Fire

| # | Question | Short Answer |
|---|----------|-------------|
| 53 | What is `url_for()`? | Reverse URL building from endpoint name |
| 54 | Difference between `redirect()` and `url_for()`? | `redirect` returns 302 response; `url_for` builds URL string |
| 55 | What is `flash()` in Flask? | One-time messages stored in session (success/error msgs) |
| 56 | How to serve static files? | `url_for('static', filename='style.css')` → `/static/style.css` |
| 57 | What is Jinja2? | Templating engine: `{{ variable }}`, `{% for %}`, `{% if %}` |
| 58 | What is `make_response()`? | Creates Response object for custom headers/cookies |
| 59 | How to set cookies? | `resp.set_cookie('key', 'value', httponly=True, secure=True)` |
| 60 | How to handle file uploads? | `request.files['file']`, use `secure_filename()` |
| 61 | What is Flask-Migrate? | Alembic wrapper for database schema migrations |
| 62 | What does `abort(404)` do? | Raises HTTPException with 404 status |
| 63 | Difference between `g` and `session`? | `g` = per-request temp storage; `session` = persists across requests |
| 64 | What is `jsonify()`? | Creates JSON Response with correct Content-Type header |
| 65 | How does Flask handle CORS? | Flask-CORS extension: `CORS(app, origins=["..."])` |

### FastAPI Quick-Fire

| # | Question | Short Answer |
|---|----------|-------------|
| 66 | What is `Depends()`? | Dependency injection — resolve function params automatically |
| 67 | Difference between `Body()`, `Query()`, `Path()`? | Where to extract parameter: request body, URL query, URL path |
| 68 | What is `response_model`? | Filters and validates output data shape |
| 69 | How to return custom status codes? | `@app.post("/", status_code=201)` or `Response(status_code=201)` |
| 70 | What is `HTTPException`? | Raises HTTP error: `raise HTTPException(status_code=404, detail="...")` |
| 71 | What is `BackgroundTasks`? | Run functions after response is sent |
| 72 | How to add OpenAPI tags? | `@app.get("/", tags=["users"])` |
| 73 | What is `from_attributes=True`? | Pydantic V2 setting to read data from ORM model attributes |
| 74 | Difference between `model_dump()` and `model_dump_json()`? | `dict` vs `JSON string` output |
| 75 | What is `Annotated` in FastAPI? | PEP 593 — attach metadata to type hints: `Annotated[int, Query(ge=1)]` |
| 76 | How to handle file uploads? | `UploadFile` param: `async def upload(file: UploadFile)` |
| 77 | What is `JSONResponse`? | Custom response with explicit JSON body and headers |
| 78 | How to disable docs? | `FastAPI(docs_url=None, redoc_url=None)` |

---

# PART 5: SYSTEM DESIGN QUESTIONS

### [E] Q79: Design a rate-limited API with token bucket algorithm.

**Answer:**
```python
import time
from collections import defaultdict

class TokenBucket:
    def __init__(self, rate: float, capacity: int):
        self.rate = rate          # tokens per second
        self.capacity = capacity  # max tokens
        self.tokens: dict[str, float] = defaultdict(lambda: capacity)
        self.last_time: dict[str, float] = defaultdict(time.time)

    def consume(self, key: str) -> bool:
        now = time.time()
        elapsed = now - self.last_time[key]
        self.last_time[key] = now

        # Add tokens based on elapsed time
        self.tokens[key] = min(
            self.capacity,
            self.tokens[key] + elapsed * self.rate
        )

        if self.tokens[key] >= 1:
            self.tokens[key] -= 1
            return True
        return False

bucket = TokenBucket(rate=10, capacity=100)  # 10 req/sec, burst of 100

@app.middleware("http")
async def rate_limit(request: Request, call_next):
    client_ip = request.client.host
    if not bucket.consume(client_ip):
        return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded"})
    return await call_next(request)
```

---

### [E] Q80: How would you implement a caching layer with cache invalidation?

**Answer:**
```python
import hashlib, json
from functools import wraps

# Cache decorator with TTL and invalidation
def cached(ttl: int = 300, prefix: str = ""):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Build cache key from function name + args
            key_data = f"{prefix}:{func.__name__}:{json.dumps(kwargs, sort_keys=True)}"
            cache_key = hashlib.md5(key_data.encode()).hexdigest()

            # Check cache
            cached_value = await redis.get(cache_key)
            if cached_value:
                return json.loads(cached_value)

            # Execute and cache
            result = await func(*args, **kwargs)
            await redis.setex(cache_key, ttl, json.dumps(result))
            return result

        # Attach invalidation method
        async def invalidate(**kwargs):
            key_data = f"{prefix}:{func.__name__}:{json.dumps(kwargs, sort_keys=True)}"
            cache_key = hashlib.md5(key_data.encode()).hexdigest()
            await redis.delete(cache_key)

        wrapper.invalidate = invalidate
        return wrapper
    return decorator

# Usage
@cached(ttl=60, prefix="posts")
async def get_posts(page: int = 1):
    return await db.execute(select(Post).offset((page-1)*10).limit(10))

# Invalidate after write
@app.post("/posts")
async def create_post(post: PostCreate):
    ...
    await get_posts.invalidate(page=1)  # clear page 1 cache
```

---

# TIPS FOR THE INTERVIEW

1. **Always explain trade-offs** — no solution is perfect
2. **Mention production concerns** — logging, monitoring, error handling, security
3. **Know both frameworks deeply** — interviewers love comparison questions
4. **Code on the spot** — practice writing decorators, middleware, Pydantic models
5. **Database knowledge is crucial** — N+1, transactions, migrations, connection pooling
6. **Async understanding** — explain event loop, blocking vs non-blocking, when to use what
7. **Security** — JWT vs sessions, CORS, CSRF, SQL injection, input validation
8. **Testing** — fixtures, mocking, dependency overrides, integration vs unit
9. **System design** — rate limiting, caching, background tasks, microservices
10. **Show your 6-7 year experience** — talk about scaling issues you've faced, production incidents, architecture decisions
