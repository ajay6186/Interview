# Flask Interview Questions & Answers (6-7 Years Experience)

---

## 1. Core Concepts

### Q1: Explain Flask's Application and Request Context.

**Answer:**
Flask uses context locals to make certain objects globally accessible within a request.

**Two types of contexts:**

| Context | Proxy Variables | Lifetime |
|---------|----------------|----------|
| Application Context | `current_app`, `g` | Per-request or manually pushed |
| Request Context | `request`, `session` | Per-request |

```python
from flask import Flask, request, g, current_app

app = Flask(__name__)

# Request context — automatically pushed during a request
@app.route('/user')
def get_user():
    user_id = request.args.get('id')  # 'request' is a context local
    return f"User {user_id}"

# Application context — for operations outside of requests
with app.app_context():
    # current_app is now available
    print(current_app.config['DEBUG'])

# g object — per-request storage (reset between requests)
@app.before_request
def load_user():
    g.user = get_current_user()

@app.route('/dashboard')
def dashboard():
    return f"Welcome {g.user.name}"
```

**How it works internally:**
Flask uses Werkzeug's `LocalStack` and `LocalProxy`. Each thread/greenlet gets its own stack, enabling thread-safe globals.

```python
# Simplified internal mechanism
_request_ctx_stack = LocalStack()  # One per thread
_app_ctx_stack = LocalStack()

# When a request comes in:
# 1. App context is pushed
# 2. Request context is pushed
# 3. View function executes
# 4. Request context is popped
# 5. App context is popped
```

---

### Q2: What are Flask Blueprints? How do they enable modular architecture?

**Answer:**
Blueprints are a way to organize your Flask application into reusable, modular components.

```python
# auth/routes.py
from flask import Blueprint

auth_bp = Blueprint('auth', __name__,
                     template_folder='templates',
                     static_folder='static',
                     url_prefix='/auth')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    return "Login Page"

@auth_bp.route('/logout')
def logout():
    return "Logged Out"

# Blueprint-specific error handler
@auth_bp.errorhandler(403)
def forbidden(e):
    return "Forbidden", 403

# Blueprint-specific before_request
@auth_bp.before_request
def check_auth():
    pass

# -----------------------------------------------
# products/routes.py
products_bp = Blueprint('products', __name__, url_prefix='/products')

@products_bp.route('/')
def list_products():
    return "Products"

# -----------------------------------------------
# app.py — Register blueprints
from flask import Flask
from auth.routes import auth_bp
from products.routes import products_bp

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(products_bp)

    # Nested blueprints (Flask 2.0+)
    api_bp = Blueprint('api', __name__, url_prefix='/api/v1')
    api_bp.register_blueprint(auth_bp)
    api_bp.register_blueprint(products_bp)
    app.register_blueprint(api_bp)
    # Routes: /api/v1/auth/login, /api/v1/products/

    return app
```

**Project structure with Blueprints:**
```
project/
├── app/
│   ├── __init__.py          # create_app factory
│   ├── auth/
│   │   ├── __init__.py
│   │   ├── routes.py
│   │   ├── models.py
│   │   └── templates/
│   ├── products/
│   │   ├── __init__.py
│   │   ├── routes.py
│   │   └── models.py
│   └── common/
│       ├── decorators.py
│       └── utils.py
├── config.py
├── migrations/
└── run.py
```

---

### Q3: Explain Flask's Application Factory pattern.

**Answer:**

```python
# app/__init__.py
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager
from flask_caching import Cache

# Extensions initialized without app
db = SQLAlchemy()
migrate = Migrate()
login_manager = LoginManager()
cache = Cache()

def create_app(config_name=None):
    app = Flask(__name__)

    # Load config
    config_name = config_name or os.environ.get('FLASK_CONFIG', 'development')
    app.config.from_object(config[config_name])

    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    login_manager.init_app(app)
    cache.init_app(app)

    # Register blueprints
    from app.auth import auth_bp
    app.register_blueprint(auth_bp)

    from app.api import api_bp
    app.register_blueprint(api_bp, url_prefix='/api/v1')

    # Register error handlers
    register_error_handlers(app)

    # Register CLI commands
    register_cli_commands(app)

    # Register shell context
    @app.shell_context_processor
    def make_shell_context():
        return {'db': db, 'User': User}

    return app

def register_error_handlers(app):
    @app.errorhandler(404)
    def not_found(e):
        return {'error': 'Not Found'}, 404

    @app.errorhandler(500)
    def server_error(e):
        return {'error': 'Internal Server Error'}, 500
```

**Benefits:**
1. **Testing** — Create app with different configs for testing
2. **Multiple instances** — Run different configurations simultaneously
3. **Delayed extension init** — Extensions can be shared across apps
4. **Avoid circular imports** — Extensions are created before the app

---

### Q4: How do you handle authentication in Flask?

**Answer:**

```python
# --- Using Flask-Login for session-based auth ---
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required

login_manager = LoginManager()
login_manager.login_view = 'auth.login'

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True)
    password_hash = db.Column(db.String(256))

    def set_password(self, password):
        from werkzeug.security import generate_password_hash
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        from werkzeug.security import check_password_hash
        return check_password_hash(self.password_hash, password)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if user and user.check_password(data['password']):
        login_user(user, remember=data.get('remember', False))
        return {'message': 'Logged in'}
    return {'error': 'Invalid credentials'}, 401

@auth_bp.route('/protected')
@login_required
def protected():
    return {'user': current_user.email}

# --- JWT Authentication ---
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

jwt = JWTManager(app)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    user = User.query.filter_by(email=data['email']).first()
    if user and user.check_password(data['password']):
        access_token = create_access_token(
            identity=user.id,
            additional_claims={'role': user.role}
        )
        return {'access_token': access_token}
    return {'error': 'Invalid credentials'}, 401

@auth_bp.route('/protected')
@jwt_required()
def protected():
    current_user_id = get_jwt_identity()
    return {'user_id': current_user_id}

# --- Custom decorator for role-based access ---
from functools import wraps

def role_required(role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated or current_user.role != role:
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route('/admin')
@login_required
@role_required('admin')
def admin_panel():
    return "Admin Panel"
```

---

### Q5: How do you structure a large Flask application?

**Answer:**

```
project/
├── app/
│   ├── __init__.py           # create_app factory
│   ├── extensions.py         # db, cache, mail instances
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   └── product.py
│   ├── api/
│   │   ├── __init__.py       # Blueprint
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── users.py
│   │   │   └── products.py
│   │   └── v2/
│   ├── services/             # Business logic layer
│   │   ├── user_service.py
│   │   └── payment_service.py
│   ├── repositories/         # Data access layer
│   │   ├── user_repo.py
│   │   └── product_repo.py
│   ├── schemas/              # Marshmallow/Pydantic schemas
│   │   ├── user_schema.py
│   │   └── product_schema.py
│   ├── utils/
│   │   ├── decorators.py
│   │   └── helpers.py
│   └── templates/
├── config/
│   ├── __init__.py
│   ├── default.py
│   ├── development.py
│   ├── production.py
│   └── testing.py
├── migrations/
├── tests/
│   ├── conftest.py
│   ├── test_auth.py
│   └── test_products.py
├── requirements/
│   ├── base.txt
│   ├── dev.txt
│   └── prod.txt
├── Dockerfile
├── docker-compose.yml
└── wsgi.py
```

```python
# app/extensions.py
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_caching import Cache
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

db = SQLAlchemy()
migrate = Migrate()
cache = Cache()
limiter = Limiter(key_func=get_remote_address)

# app/services/user_service.py — Business logic separate from routes
class UserService:
    @staticmethod
    def create_user(data):
        user = User(email=data['email'])
        user.set_password(data['password'])
        db.session.add(user)
        db.session.commit()
        send_welcome_email.delay(user.id)  # Celery task
        return user

    @staticmethod
    def get_user_by_id(user_id):
        user = User.query.get_or_404(user_id)
        return user
```

---

### Q6: How does Flask handle error handling and logging?

**Answer:**

```python
from flask import Flask, jsonify
import logging
from logging.handlers import RotatingFileHandler

app = Flask(__name__)

# --- Custom Exception Classes ---
class APIError(Exception):
    def __init__(self, message, status_code=400, payload=None):
        super().__init__()
        self.message = message
        self.status_code = status_code
        self.payload = payload

    def to_dict(self):
        rv = dict(self.payload or ())
        rv['error'] = self.message
        rv['status_code'] = self.status_code
        return rv

# Register error handlers
@app.errorhandler(APIError)
def handle_api_error(error):
    response = jsonify(error.to_dict())
    response.status_code = error.status_code
    return response

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Resource not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Internal server error'}), 500

# Usage in views
@app.route('/users/<int:user_id>')
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        raise APIError('User not found', status_code=404)
    return jsonify(user.to_dict())

# --- Logging Configuration ---
def configure_logging(app):
    if not app.debug:
        # File handler
        file_handler = RotatingFileHandler(
            'logs/app.log',
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=10
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Application startup')

# Usage
@app.route('/payment', methods=['POST'])
def process_payment():
    app.logger.info(f"Payment request from user {current_user.id}")
    try:
        result = payment_gateway.charge(amount)
        app.logger.info(f"Payment successful: {result.transaction_id}")
    except PaymentError as e:
        app.logger.error(f"Payment failed: {e}", exc_info=True)
        raise APIError("Payment processing failed", status_code=502)
```

---

### Q7: Explain Flask-SQLAlchemy relationships and query patterns.

**Answer:**

```python
from app.extensions import db

# One-to-Many
class Author(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    books = db.relationship('Book', backref='author', lazy='select')

class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    author_id = db.Column(db.Integer, db.ForeignKey('author.id'))

# Many-to-Many
book_tags = db.Table('book_tags',
    db.Column('book_id', db.Integer, db.ForeignKey('book.id')),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'))
)

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))
    books = db.relationship('Book', secondary=book_tags, backref='tags')

# --- Lazy Loading Options ---
# 'select'       — Load when accessed (default, N+1 problem)
# 'joined'       — Load with JOIN
# 'subquery'     — Load with subquery
# 'dynamic'      — Returns query object (for large collections)
# 'selectin'     — Load with SELECT IN

# --- Query Patterns ---
# Basic queries
users = User.query.filter_by(active=True).all()
user = User.query.filter(User.email == email).first_or_404()

# Complex queries
from sqlalchemy import and_, or_, func

results = db.session.query(
    Author.name,
    func.count(Book.id).label('book_count')
).join(Book).group_by(Author.id).having(
    func.count(Book.id) > 5
).all()

# Eager loading to avoid N+1
authors = Author.query.options(
    db.joinedload(Author.books)
).all()

# Pagination
page = request.args.get('page', 1, type=int)
pagination = User.query.paginate(page=page, per_page=20)
# pagination.items, pagination.pages, pagination.total
```

---

### Q8: How do you test Flask applications?

**Answer:**

```python
# conftest.py
import pytest
from app import create_app, db as _db

@pytest.fixture(scope='session')
def app():
    app = create_app('testing')
    with app.app_context():
        _db.create_all()
        yield app
        _db.drop_all()

@pytest.fixture(scope='function')
def db(app):
    """Clean database between tests."""
    with app.app_context():
        _db.session.begin_nested()
        yield _db
        _db.session.rollback()

@pytest.fixture
def client(app):
    return app.test_client()

@pytest.fixture
def auth_client(client, db):
    """Client with authenticated user."""
    user = User(email='test@example.com')
    user.set_password('password')
    db.session.add(user)
    db.session.commit()

    client.post('/auth/login', json={
        'email': 'test@example.com',
        'password': 'password'
    })
    return client

# test_users.py
class TestUserAPI:
    def test_create_user(self, client, db):
        response = client.post('/api/users', json={
            'email': 'new@example.com',
            'password': 'securepass123'
        })
        assert response.status_code == 201
        assert response.json['email'] == 'new@example.com'
        assert User.query.count() == 1

    def test_get_user_not_found(self, client):
        response = client.get('/api/users/999')
        assert response.status_code == 404

    def test_protected_route_requires_auth(self, client):
        response = client.get('/api/protected')
        assert response.status_code == 401

    def test_protected_route_with_auth(self, auth_client):
        response = auth_client.get('/api/protected')
        assert response.status_code == 200

    def test_create_user_validation(self, client):
        response = client.post('/api/users', json={
            'email': 'invalid-email'
        })
        assert response.status_code == 400

# Testing with mocks
from unittest.mock import patch

def test_payment(client, auth_client):
    with patch('app.services.payment_service.stripe.Charge.create') as mock_charge:
        mock_charge.return_value = {'id': 'ch_test', 'status': 'succeeded'}
        response = auth_client.post('/api/payments', json={'amount': 1000})
        assert response.status_code == 200
        mock_charge.assert_called_once()
```

---

### Q9: Explain Flask middleware and request hooks.

**Answer:**

```python
from flask import Flask, request, g
import time

app = Flask(__name__)

# --- Request Hooks (in order of execution) ---

@app.before_first_request  # Removed in Flask 2.3, use app startup instead
def initialize():
    """Runs once before the first request."""
    pass

@app.before_request
def before_request_handler():
    """Runs before every request."""
    g.start_time = time.time()
    g.request_id = request.headers.get('X-Request-ID', str(uuid.uuid4()))

    # Return a response to short-circuit (e.g., for maintenance mode)
    if app.config.get('MAINTENANCE_MODE'):
        return jsonify({'error': 'Under maintenance'}), 503

@app.after_request
def after_request_handler(response):
    """Runs after every request (even if an exception occurred and was handled)."""
    duration = time.time() - g.get('start_time', time.time())
    response.headers['X-Request-Duration'] = str(duration)
    response.headers['X-Request-ID'] = g.get('request_id', '')

    # Log request
    app.logger.info(
        f"{request.method} {request.path} {response.status_code} {duration:.3f}s"
    )
    return response

@app.teardown_request
def teardown_request_handler(exception):
    """Runs after the response is sent (cleanup). Always runs."""
    db_session = g.pop('db_session', None)
    if db_session is not None:
        db_session.close()

# --- WSGI Middleware ---
class ProfilingMiddleware:
    def __init__(self, app):
        self.app = app

    def __call__(self, environ, start_response):
        # Modify environ (request)
        environ['HTTP_X_CUSTOM'] = 'value'

        # Call the actual app
        return self.app(environ, start_response)

app.wsgi_app = ProfilingMiddleware(app.wsgi_app)
```

---

### Q10: How do you deploy Flask in production?

**Answer:**

```python
# 1. NEVER use app.run() in production
# Use a production WSGI server

# --- Gunicorn (recommended) ---
# gunicorn -w 4 -b 0.0.0.0:8000 --timeout 120 "app:create_app()"
# gunicorn -w 4 -k gevent -b 0.0.0.0:8000 "app:create_app()"  # async workers

# wsgi.py
from app import create_app
application = create_app('production')

# --- Docker Deployment ---
# Dockerfile
"""
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:8000", "wsgi:application"]
"""

# --- Nginx configuration ---
"""
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /static {
        alias /app/static;
        expires 30d;
    }
}
"""

# --- Production config ---
class ProductionConfig:
    SECRET_KEY = os.environ['SECRET_KEY']
    SQLALCHEMY_DATABASE_URI = os.environ['DATABASE_URL']
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 20,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
    }
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    PREFERRED_URL_SCHEME = 'https'
```

---

### Q11: Flask vs Django — When to use which?

**Answer:**

| Aspect | Flask | Django |
|--------|-------|--------|
| Philosophy | Micro-framework, minimal | Batteries-included |
| ORM | Choose your own (SQLAlchemy) | Built-in (Django ORM) |
| Admin | None built-in | Powerful admin interface |
| Learning Curve | Lower | Steeper |
| Flexibility | High (choose components) | Convention over configuration |
| Best For | APIs, microservices, small-medium apps | Full-stack web apps, CMS, rapid prototyping |
| Async | Limited (Flask 2.0+) | Better support (Django 4.1+) |
| Template Engine | Jinja2 | Django Template Language |
| Auth | Extensions needed | Built-in |

**Use Flask when:**
- Building REST APIs / microservices
- You want full control over components
- Small to medium projects
- Prototyping / learning

**Use Django when:**
- Full-stack web applications
- Need admin interface
- Rapid development with conventions
- Large teams (convention reduces debate)

---

### Q12: How do you handle rate limiting and API versioning in Flask?

**Answer:**

```python
# --- Rate Limiting ---
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["200 per day", "50 per hour"],
    storage_uri="redis://localhost:6379"
)

@app.route("/api/search")
@limiter.limit("10 per minute")
def search():
    return jsonify(results=[])

# Per-user rate limiting
@limiter.limit("100/hour", key_func=lambda: current_user.id)
def user_endpoint():
    pass

# --- API Versioning ---

# Method 1: URL Prefix (most common)
v1 = Blueprint('api_v1', __name__, url_prefix='/api/v1')
v2 = Blueprint('api_v2', __name__, url_prefix='/api/v2')

@v1.route('/users')
def get_users_v1():
    return jsonify(users=[{'name': u.name} for u in User.query.all()])

@v2.route('/users')
def get_users_v2():
    return jsonify({
        'data': [{'name': u.name, 'email': u.email} for u in User.query.all()],
        'meta': {'total': User.query.count()}
    })

app.register_blueprint(v1)
app.register_blueprint(v2)

# Method 2: Header-based versioning
@app.route('/api/users')
def get_users():
    version = request.headers.get('API-Version', '1')
    if version == '2':
        return get_users_v2_logic()
    return get_users_v1_logic()
```
