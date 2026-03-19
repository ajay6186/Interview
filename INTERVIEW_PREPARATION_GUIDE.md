# Senior Python Developer Interview Guide (6-7 Years Experience)
## Django, Flask, FastAPI & MySQL

---

## Table of Contents
1. [Django Interview Questions](#django-interview-questions)
2. [Flask Interview Questions](#flask-interview-questions)
3. [FastAPI Interview Questions](#fastapi-interview-questions)
4. [MySQL Interview Questions](#mysql-interview-questions)
5. [Preparation Strategy](#preparation-strategy)

---

## DJANGO INTERVIEW QUESTIONS

### 1. **Explain Django's request-response lifecycle in detail**

**Answer:**
1. **WSGI Handler**: Request enters through WSGI (Web Server Gateway Interface)
2. **Middleware (Request)**: Request passes through middleware classes in order defined in SETTINGS
3. **URL Resolver**: URLconf matches the URL pattern to a view
4. **View Processing**: View function/class processes the request
5. **Middleware (Response)**: Response passes back through middleware (in reverse order)
6. **Template Rendering**: If applicable, template is rendered with context
7. **HTTP Response**: Final response sent back to client

**Key Points:**
- Middleware executes twice: once for request, once for response
- Exception middleware can catch and handle errors
- URL resolver uses regex or path converters

---

### 2. **What are Django signals and when would you use them? What are the drawbacks?**

**Answer:**
Django signals allow decoupled applications to get notified when certain actions occur.

**Common Signals:**
- `pre_save` / `post_save`
- `pre_delete` / `post_delete`
- `m2m_changed`
- `request_started` / `request_finished`

**Use Cases:**
- Creating user profiles automatically when User is created
- Clearing cache when model data changes
- Logging model changes
- Sending notifications

**Drawbacks:**
- Makes code harder to trace and debug
- Can cause performance issues if not handled properly
- Hidden side effects
- Makes testing more complex
- Can lead to circular imports

**Example:**
```python
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User

@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)
```

---

### 3. **Explain Django ORM's select_related() vs prefetch_related()**

**Answer:**

**select_related():**
- Uses SQL JOIN to fetch related objects in a single query
- Works with ForeignKey and OneToOne relationships
- Returns a QuerySet
- More efficient for single-valued relationships

```python
# Without select_related - N+1 queries
books = Book.objects.all()
for book in books:
    print(book.author.name)  # Each iteration hits DB

# With select_related - Single JOIN query
books = Book.objects.select_related('author').all()
for book in books:
    print(book.author.name)  # No additional queries
```

**prefetch_related():**
- Performs separate queries and does "joining" in Python
- Works with ManyToMany and reverse ForeignKey relationships
- Better for multiple-valued relationships

```python
# Prefetch related objects efficiently
books = Book.objects.prefetch_related('tags').all()
for book in books:
    print(book.tags.all())  # No additional queries
```

**Combined Example:**
```python
# Optimize complex queries
books = Book.objects.select_related('author').prefetch_related('tags', 'reviews')
```

---

### 4. **How do you handle database transactions in Django? Explain atomic operations**

**Answer:**

**Methods:**

1. **Decorator:**
```python
from django.db import transaction

@transaction.atomic
def create_order(user, items):
    order = Order.objects.create(user=user)
    for item in items:
        OrderItem.objects.create(order=order, **item)
    # If any error occurs, entire transaction rolls back
```

2. **Context Manager:**
```python
from django.db import transaction

def process_payment(order_id, amount):
    try:
        with transaction.atomic():
            order = Order.objects.select_for_update().get(id=order_id)
            order.status = 'paid'
            order.save()
            Payment.objects.create(order=order, amount=amount)
    except Exception as e:
        # Transaction automatically rolled back
        logger.error(f"Payment failed: {e}")
```

3. **Manual Transaction Control:**
```python
from django.db import transaction

def manual_transaction():
    transaction.set_autocommit(False)
    try:
        # Database operations
        transaction.commit()
    except:
        transaction.rollback()
    finally:
        transaction.set_autocommit(True)
```

**Savepoints:**
```python
with transaction.atomic():
    # Create a savepoint
    sid = transaction.savepoint()
    try:
        # risky operation
        dangerous_operation()
    except:
        # Rollback to savepoint
        transaction.savepoint_rollback(sid)
    else:
        transaction.savepoint_commit(sid)
```

---

### 5. **Explain Django's caching framework and different cache backends**

**Answer:**

**Cache Backends:**

1. **Memcached:**
```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.memcached.PyMemcacheCache',
        'LOCATION': '127.0.0.1:11211',
    }
}
```

2. **Redis:**
```python
CACHES = {
    'default': {
        'BACKEND': 'django_redis.cache.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        }
    }
}
```

3. **Database Cache:**
```python
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'my_cache_table',
    }
}
```

**Caching Strategies:**

1. **Per-View Caching:**
```python
from django.views.decorators.cache import cache_page

@cache_page(60 * 15)  # Cache for 15 minutes
def my_view(request):
    return HttpResponse("Cached content")
```

2. **Template Fragment Caching:**
```django
{% load cache %}
{% cache 500 sidebar request.user.username %}
    .. sidebar for logged in user ..
{% endcache %}
```

3. **Low-Level Cache API:**
```python
from django.core.cache import cache

# Set cache
cache.set('my_key', 'my_value', 300)  # 5 minutes

# Get cache
value = cache.get('my_key', 'default_value')

# Delete cache
cache.delete('my_key')

# Get or set pattern
def get_expensive_data():
    data = cache.get('expensive_data')
    if data is None:
        data = expensive_computation()
        cache.set('expensive_data', data, 3600)
    return data
```

---

### 6. **How do you optimize Django queries? Explain common N+1 problems**

**Answer:**

**Common Optimization Techniques:**

1. **Use select_related() and prefetch_related()**
2. **Use only() and defer()**
```python
# Fetch only specific fields
users = User.objects.only('id', 'username')

# Defer large fields
users = User.objects.defer('biography', 'profile_image')
```

3. **Use values() and values_list()**
```python
# Returns dictionaries instead of model instances
user_data = User.objects.values('id', 'username')

# Returns tuples
user_ids = User.objects.values_list('id', flat=True)
```

4. **Bulk Operations:**
```python
# Bulk create
User.objects.bulk_create([
    User(username='user1'),
    User(username='user2'),
])

# Bulk update
users = User.objects.all()
for user in users:
    user.is_active = True
User.objects.bulk_update(users, ['is_active'])
```

5. **Use iterator() for large QuerySets:**
```python
# Avoid loading all objects into memory
for user in User.objects.iterator(chunk_size=1000):
    process_user(user)
```

6. **Database Indexing:**
```python
class Book(models.Model):
    title = models.CharField(max_length=200, db_index=True)
    isbn = models.CharField(max_length=13, unique=True)

    class Meta:
        indexes = [
            models.Index(fields=['title', 'author']),
            models.Index(fields=['-published_date']),
        ]
```

**N+1 Problem Example:**
```python
# BAD - N+1 queries
books = Book.objects.all()  # 1 query
for book in books:
    print(book.author.name)  # N queries

# GOOD - 2 queries total
books = Book.objects.select_related('author').all()
for book in books:
    print(book.author.name)
```

---

### 7. **Explain Django REST Framework authentication and permissions**

**Answer:**

**Authentication Classes:**

1. **Token Authentication:**
```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
    ]
}

# views.py
from rest_framework.authentication import TokenAuthentication
from rest_framework.permissions import IsAuthenticated

class MyView(APIView):
    authentication_classes = [TokenAuthentication]
    permission_classes = [IsAuthenticated]
```

2. **JWT Authentication:**
```python
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
}
```

3. **Session Authentication:**
```python
from rest_framework.authentication import SessionAuthentication
```

**Permission Classes:**

```python
from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user

# Usage
class BookViewSet(viewsets.ModelViewSet):
    permission_classes = [IsOwnerOrReadOnly]
```

**Built-in Permissions:**
- `AllowAny`
- `IsAuthenticated`
- `IsAdminUser`
- `IsAuthenticatedOrReadOnly`

---

### 8. **How do you implement custom middleware in Django?**

**Answer:**

**Middleware Structure:**

```python
# middleware.py
import logging

class RequestLoggingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        self.logger = logging.getLogger(__name__)

    def __call__(self, request):
        # Code executed before view
        self.logger.info(f"Request: {request.method} {request.path}")

        response = self.get_response(request)

        # Code executed after view
        self.logger.info(f"Response: {response.status_code}")
        return response

    def process_exception(self, request, exception):
        self.logger.error(f"Exception: {exception}")
        return None
```

**Advanced Middleware Example:**
```python
class APIRateLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/api/'):
            user_id = request.user.id if request.user.is_authenticated else request.META.get('REMOTE_ADDR')

            # Check rate limit
            if self.is_rate_limited(user_id):
                return JsonResponse({'error': 'Rate limit exceeded'}, status=429)

        response = self.get_response(request)
        return response

    def is_rate_limited(self, user_id):
        # Implement rate limiting logic using cache
        from django.core.cache import cache
        key = f'rate_limit_{user_id}'
        requests = cache.get(key, 0)

        if requests >= 100:  # 100 requests per minute
            return True

        cache.set(key, requests + 1, 60)  # 1 minute timeout
        return False
```

**Register in settings.py:**
```python
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'myapp.middleware.RequestLoggingMiddleware',
    'myapp.middleware.APIRateLimitMiddleware',
    # ... other middleware
]
```

---

### 9. **Explain Django's Class-Based Views (CBVs) vs Function-Based Views (FBVs)**

**Answer:**

**Function-Based Views:**
```python
from django.shortcuts import render, get_object_or_404
from django.http import HttpResponseRedirect

def book_detail(request, pk):
    book = get_object_or_404(Book, pk=pk)

    if request.method == 'POST':
        # Handle form submission
        form = BookForm(request.POST, instance=book)
        if form.is_valid():
            form.save()
            return HttpResponseRedirect('/success/')
    else:
        form = BookForm(instance=book)

    return render(request, 'book_detail.html', {'form': form, 'book': book})
```

**Class-Based Views:**
```python
from django.views.generic import DetailView, UpdateView

class BookDetailView(DetailView):
    model = Book
    template_name = 'book_detail.html'
    context_object_name = 'book'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['related_books'] = Book.objects.filter(
            author=self.object.author
        )[:5]
        return context

class BookUpdateView(UpdateView):
    model = Book
    form_class = BookForm
    template_name = 'book_form.html'
    success_url = '/success/'

    def form_valid(self, form):
        form.instance.modified_by = self.request.user
        return super().form_valid(form)
```

**Mixins Example:**
```python
from django.contrib.auth.mixins import LoginRequiredMixin, UserPassesTestMixin

class BookUpdateView(LoginRequiredMixin, UserPassesTestMixin, UpdateView):
    model = Book
    form_class = BookForm

    def test_func(self):
        book = self.get_object()
        return self.request.user == book.author
```

**Pros of CBVs:**
- Code reusability through inheritance
- Built-in generic views
- Mixins for common patterns
- Less boilerplate code

**Pros of FBVs:**
- Easier to understand for beginners
- More explicit
- Better for complex custom logic

---

### 10. **How do you handle file uploads and media files in Django?**

**Answer:**

**Settings Configuration:**
```python
# settings.py
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

**Model with File/Image Field:**
```python
from django.db import models
from django.core.validators import FileExtensionValidator

class Document(models.Model):
    title = models.CharField(max_length=200)
    file = models.FileField(
        upload_to='documents/%Y/%m/%d/',
        validators=[FileExtensionValidator(allowed_extensions=['pdf', 'doc', 'docx'])]
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.ImageField(
        upload_to='avatars/',
        blank=True,
        null=True
    )
```

**Form Handling:**
```python
from django import forms

class DocumentForm(forms.ModelForm):
    class Meta:
        model = Document
        fields = ['title', 'file']

# View
from django.views.generic import CreateView

class DocumentCreateView(CreateView):
    model = Document
    form_class = DocumentForm
    template_name = 'upload.html'
    success_url = '/success/'
```

**Template:**
```html
<form method="post" enctype="multipart/form-data">
    {% csrf_token %}
    {{ form.as_p }}
    <button type="submit">Upload</button>
</form>
```

**Custom Upload Handling:**
```python
def handle_uploaded_file(request):
    if request.method == 'POST' and request.FILES.get('file'):
        uploaded_file = request.FILES['file']

        # Validate file size
        if uploaded_file.size > 5 * 1024 * 1024:  # 5MB
            return JsonResponse({'error': 'File too large'}, status=400)

        # Save file
        fs = FileSystemStorage()
        filename = fs.save(uploaded_file.name, uploaded_file)
        file_url = fs.url(filename)

        return JsonResponse({'url': file_url})
```

**Using Cloud Storage (S3):**
```python
# settings.py
DEFAULT_FILE_STORAGE = 'storages.backends.s3boto3.S3Boto3Storage'
AWS_ACCESS_KEY_ID = 'your-access-key'
AWS_SECRET_ACCESS_KEY = 'your-secret-key'
AWS_STORAGE_BUCKET_NAME = 'your-bucket-name'
```

---

## FLASK INTERVIEW QUESTIONS

### 1. **Explain Flask's application context vs request context**

**Answer:**

**Application Context:**
- Created when Flask application is started
- Contains app-level data (config, logger, database connections)
- Accessed via `current_app`

**Request Context:**
- Created when a request comes in
- Contains request-specific data (request, session, g)
- Automatically pushed/popped by Flask

```python
from flask import Flask, current_app, g, request

app = Flask(__name__)

# Application context
with app.app_context():
    print(current_app.config['DEBUG'])
    # Access to app-level resources

# Request context
@app.route('/user/<user_id>')
def get_user(user_id):
    # request object available
    print(request.method)
    print(request.args.get('page'))

    # g object for storing data during request
    g.user = get_user_from_db(user_id)
    return jsonify(g.user)

# Using g across functions
@app.before_request
def load_user():
    if 'user_id' in session:
        g.user = User.query.get(session['user_id'])
    else:
        g.user = None

@app.route('/profile')
def profile():
    if g.user:
        return render_template('profile.html', user=g.user)
    return redirect('/login')
```

**Manual Context Management:**
```python
def send_newsletter():
    with app.app_context():
        # Access app config
        users = User.query.all()
        for user in users:
            send_email(user.email)
```

---

### 2. **How do you implement Blueprints in Flask? Why use them?**

**Answer:**

**Benefits:**
- Modular application structure
- Code organization
- Reusable components
- URL prefix management
- Separate error handlers

**Implementation:**

```python
# app/auth/routes.py
from flask import Blueprint, render_template, request, redirect, session

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        # Login logic
        session['user_id'] = user.id
        return redirect('/dashboard')
    return render_template('auth/login.html')

@auth_bp.route('/logout')
def logout():
    session.clear()
    return redirect('/')

# Custom error handler for blueprint
@auth_bp.errorhandler(404)
def auth_not_found(error):
    return render_template('auth/404.html'), 404
```

```python
# app/api/routes.py
from flask import Blueprint, jsonify

api_bp = Blueprint('api', __name__, url_prefix='/api/v1')

@api_bp.route('/users', methods=['GET'])
def get_users():
    users = User.query.all()
    return jsonify([user.to_dict() for user in users])

@api_bp.before_request
def before_api_request():
    # API-specific logic (e.g., authentication)
    if not verify_api_key(request.headers.get('X-API-Key')):
        return jsonify({'error': 'Invalid API key'}), 401
```

```python
# app/__init__.py
from flask import Flask

def create_app():
    app = Flask(__name__)
    app.config.from_object('config.Config')

    # Register blueprints
    from app.auth.routes import auth_bp
    from app.api.routes import api_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(api_bp)

    return app
```

**Nested Blueprints:**
```python
# Parent blueprint
admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

# Child blueprint
admin_users_bp = Blueprint('admin_users', __name__)

@admin_users_bp.route('/users')
def users():
    return render_template('admin/users.html')

# Register child to parent
admin_bp.register_blueprint(admin_users_bp)
```

---

### 3. **Explain Flask-SQLAlchemy relationship patterns and lazy loading**

**Answer:**

**Relationship Types:**

```python
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

# One-to-Many
class Author(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100))
    books = db.relationship('Book', backref='author', lazy='dynamic')

class Book(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    author_id = db.Column(db.Integer, db.ForeignKey('author.id'))

# Many-to-Many
tags = db.Table('post_tags',
    db.Column('post_id', db.Integer, db.ForeignKey('post.id')),
    db.Column('tag_id', db.Integer, db.ForeignKey('tag.id'))
)

class Post(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200))
    tags = db.relationship('Tag', secondary=tags, backref='posts')

class Tag(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50))

# One-to-One
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True)
    profile = db.relationship('Profile', uselist=False, backref='user')

class Profile(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    bio = db.Column(db.Text)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))
```

**Lazy Loading Options:**

1. **lazy='select'** (default): Loads data when accessed
2. **lazy='joined'**: Loads relationship in same query using JOIN
3. **lazy='subquery'**: Loads relationship using subquery
4. **lazy='dynamic'**: Returns query object instead of loaded items
5. **lazy='raise'**: Raises error if accessed (prevents N+1)

```python
class Author(db.Model):
    # Different lazy options
    books_select = db.relationship('Book', lazy='select')
    books_joined = db.relationship('Book', lazy='joined')
    books_dynamic = db.relationship('Book', lazy='dynamic')

# Usage
author = Author.query.get(1)

# lazy='select' - triggers additional query
books = author.books_select  # SELECT * FROM book WHERE author_id = 1

# lazy='joined' - loaded with author
author = Author.query.options(db.joinedload('books_joined')).get(1)

# lazy='dynamic' - returns query object
recent_books = author.books_dynamic.filter(
    Book.published_date > '2020-01-01'
).order_by(Book.published_date.desc()).limit(10)
```

---

### 4. **How do you implement authentication and authorization in Flask?**

**Answer:**

**Using Flask-Login:**

```python
from flask_login import LoginManager, UserMixin, login_user, logout_user, login_required

login_manager = LoginManager()
login_manager.init_app(app)

class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True)
    password_hash = db.Column(db.String(255))
    role = db.Column(db.String(20))

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

@app.route('/login', methods=['POST'])
def login():
    username = request.form['username']
    password = request.form['password']

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        login_user(user, remember=True)
        return redirect('/dashboard')
    return render_template('login.html', error='Invalid credentials')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    return redirect('/')
```

**Custom Authorization Decorator:**
```python
from functools import wraps
from flask import abort
from flask_login import current_user

def role_required(role):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated:
                abort(401)
            if current_user.role != role:
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator

@app.route('/admin')
@role_required('admin')
def admin_panel():
    return render_template('admin.html')
```

**JWT Authentication:**
```python
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity

jwt = JWTManager(app)
app.config['JWT_SECRET_KEY'] = 'your-secret-key'

@app.route('/api/login', methods=['POST'])
def api_login():
    username = request.json.get('username')
    password = request.json.get('password')

    user = User.query.filter_by(username=username).first()
    if user and user.check_password(password):
        access_token = create_access_token(
            identity=user.id,
            additional_claims={'role': user.role}
        )
        return jsonify(access_token=access_token)
    return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/api/protected', methods=['GET'])
@jwt_required()
def protected():
    current_user_id = get_jwt_identity()
    user = User.query.get(current_user_id)
    return jsonify(username=user.username)
```

---

### 5. **Explain Flask middleware and request hooks**

**Answer:**

**Request Hooks:**

```python
@app.before_first_request
def before_first_request():
    # Runs once before first request
    db.create_all()
    init_cache()

@app.before_request
def before_request():
    # Runs before every request
    g.start_time = time.time()
    g.db = get_db_connection()

@app.after_request
def after_request(response):
    # Runs after every request
    execution_time = time.time() - g.start_time
    response.headers['X-Execution-Time'] = str(execution_time)
    return response

@app.teardown_request
def teardown_request(exception=None):
    # Runs at the end of request, even if exception occurred
    db_connection = g.pop('db', None)
    if db_connection is not None:
        db_connection.close()

@app.teardown_appcontext
def teardown_appcontext(exception=None):
    # Runs when application context is torn down
    if hasattr(g, 'db'):
        g.db.close()
```

**Custom Middleware:**
```python
class RateLimitMiddleware:
    def __init__(self, app, limit=100):
        self.app = app
        self.limit = limit
        self.requests = {}

    def __call__(self, environ, start_response):
        client_ip = environ.get('REMOTE_ADDR')

        # Check rate limit
        if client_ip in self.requests:
            if self.requests[client_ip] >= self.limit:
                start_response('429 Too Many Requests', [])
                return [b'Rate limit exceeded']
            self.requests[client_ip] += 1
        else:
            self.requests[client_ip] = 1

        return self.app(environ, start_response)

# Apply middleware
app.wsgi_app = RateLimitMiddleware(app.wsgi_app)
```

**Request Preprocessing:**
```python
@app.before_request
def check_maintenance_mode():
    if app.config.get('MAINTENANCE_MODE'):
        if request.path != '/maintenance':
            return render_template('maintenance.html'), 503

@app.before_request
def log_request():
    logger.info(f"{request.method} {request.path} - {request.remote_addr}")

@app.before_request
def check_api_key():
    if request.path.startswith('/api/'):
        api_key = request.headers.get('X-API-Key')
        if not verify_api_key(api_key):
            return jsonify({'error': 'Invalid API key'}), 401
```

---

## FASTAPI INTERVIEW QUESTIONS

### 1. **Explain FastAPI's dependency injection system**

**Answer:**

FastAPI's dependency injection system allows you to declare dependencies that will be automatically resolved and injected.

**Basic Dependency:**
```python
from fastapi import Depends, FastAPI

app = FastAPI()

def get_db():
    db = Database()
    try:
        yield db
    finally:
        db.close()

@app.get("/users/")
async def get_users(db: Database = Depends(get_db)):
    return db.query(User).all()
```

**Class-Based Dependencies:**
```python
from typing import Optional

class Pagination:
    def __init__(self, skip: int = 0, limit: int = 100):
        self.skip = skip
        self.limit = limit

@app.get("/items/")
async def get_items(pagination: Pagination = Depends()):
    return items[pagination.skip:pagination.skip + pagination.limit]
```

**Nested Dependencies:**
```python
from fastapi import Header, HTTPException

async def verify_token(x_token: str = Header(...)):
    if x_token != "secret-token":
        raise HTTPException(status_code=401, detail="Invalid token")
    return x_token

async def get_current_user(token: str = Depends(verify_token)):
    user = decode_token(token)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid user")
    return user

@app.get("/users/me")
async def read_current_user(current_user: User = Depends(get_current_user)):
    return current_user
```

**Dependencies with yield:**
```python
async def get_db_session():
    async with SessionLocal() as session:
        try:
            yield session
            await session.commit()
        except:
            await session.rollback()
            raise
        finally:
            await session.close()

@app.post("/users/")
async def create_user(user: UserCreate, db: Session = Depends(get_db_session)):
    db_user = User(**user.dict())
    db.add(db_user)
    return db_user
```

**Global Dependencies:**
```python
app = FastAPI(dependencies=[Depends(verify_api_key)])
```

---

### 2. **How do you implement authentication and authorization in FastAPI?**

**Answer:**

**OAuth2 with JWT:**

```python
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta

app = FastAPI()

SECRET_KEY = "your-secret-key"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception

    user = get_user_from_db(username)
    if user is None:
        raise credentials_exception
    return user

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user
```

**Role-Based Access Control:**
```python
from enum import Enum

class Role(str, Enum):
    ADMIN = "admin"
    USER = "user"
    GUEST = "guest"

def require_role(required_role: Role):
    async def role_checker(current_user: User = Depends(get_current_user)):
        if current_user.role != required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

@app.delete("/users/{user_id}")
async def delete_user(
    user_id: int,
    current_user: User = Depends(require_role(Role.ADMIN))
):
    return {"message": f"User {user_id} deleted"}
```

---

### 3. **Explain Pydantic models and data validation in FastAPI**

**Answer:**

**Basic Pydantic Models:**

```python
from pydantic import BaseModel, Field, validator, root_validator
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., regex=r'^[\w\.-]+@[\w\.-]+\.\w+$')
    age: Optional[int] = Field(None, ge=0, le=150)

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

    @validator('password')
    def validate_password(cls, v):
        if not any(char.isdigit() for char in v):
            raise ValueError('Password must contain at least one digit')
        if not any(char.isupper() for char in v):
            raise ValueError('Password must contain at least one uppercase letter')
        return v

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[str] = None
    age: Optional[int] = None

class UserInDB(UserBase):
    id: int
    created_at: datetime
    is_active: bool = True

    class Config:
        orm_mode = True  # Allows conversion from ORM objects

class UserResponse(BaseModel):
    id: int
    username: str
    email: str

    class Config:
        orm_mode = True
```

**Advanced Validation:**
```python
from pydantic import validator, root_validator

class BookCreate(BaseModel):
    title: str
    isbn: str
    published_year: int
    price: float

    @validator('isbn')
    def validate_isbn(cls, v):
        # ISBN-13 validation
        if len(v) != 13 or not v.isdigit():
            raise ValueError('ISBN must be 13 digits')
        return v

    @validator('published_year')
    def validate_year(cls, v):
        current_year = datetime.now().year
        if v < 1000 or v > current_year:
            raise ValueError(f'Year must be between 1000 and {current_year}')
        return v

    @root_validator
    def validate_price_and_year(cls, values):
        price = values.get('price')
        year = values.get('published_year')
        if year and year < 2000 and price and price > 100:
            raise ValueError('Old books cannot be priced above $100')
        return values
```

**Nested Models:**
```python
class Address(BaseModel):
    street: str
    city: str
    country: str
    postal_code: str

class Author(BaseModel):
    name: str
    email: str
    address: Address

class Book(BaseModel):
    title: str
    authors: List[Author]
    tags: List[str] = []

# Usage
@app.post("/books/")
async def create_book(book: Book):
    return book
```

---

### 4. **How do you handle background tasks in FastAPI?**

**Answer:**

**Background Tasks:**

```python
from fastapi import BackgroundTasks
import smtplib

def send_email(email: str, message: str):
    # Simulate email sending
    time.sleep(2)
    print(f"Email sent to {email}: {message}")

@app.post("/send-notification/")
async def send_notification(
    email: str,
    background_tasks: BackgroundTasks
):
    background_tasks.add_task(send_email, email, "Welcome!")
    return {"message": "Notification will be sent in the background"}

# Multiple background tasks
@app.post("/users/")
async def create_user(
    user: UserCreate,
    background_tasks: BackgroundTasks
):
    # Create user
    db_user = create_user_in_db(user)

    # Add multiple background tasks
    background_tasks.add_task(send_welcome_email, user.email)
    background_tasks.add_task(log_user_creation, db_user.id)
    background_tasks.add_task(update_analytics, "new_user")

    return db_user
```

**Using Celery for Complex Tasks:**

```python
from celery import Celery

celery_app = Celery(
    "worker",
    broker="redis://localhost:6379/0",
    backend="redis://localhost:6379/0"
)

@celery_app.task
def process_video(video_id: int):
    # Long-running task
    video = get_video(video_id)
    transcode_video(video)
    generate_thumbnails(video)
    return {"status": "completed"}

@app.post("/videos/")
async def upload_video(video: UploadFile):
    # Save video
    video_id = save_video(video)

    # Queue processing task
    process_video.delay(video_id)

    return {"video_id": video_id, "status": "processing"}

@app.get("/videos/{video_id}/status")
async def get_video_status(video_id: int):
    task = celery_app.AsyncResult(video_id)
    return {"status": task.state, "result": task.result}
```

---

### 5. **Explain FastAPI's async/await and when to use it**

**Answer:**

**Async vs Sync:**

```python
# Sync endpoint - blocks the thread
@app.get("/sync-users/")
def get_users_sync():
    users = db.query(User).all()  # Blocking I/O
    return users

# Async endpoint - non-blocking
@app.get("/async-users/")
async def get_users_async():
    users = await db.fetch_all(User)  # Non-blocking I/O
    return users
```

**When to Use Async:**
- Database queries (with async drivers)
- HTTP requests to external APIs
- File I/O operations
- WebSocket connections
- Any I/O-bound operations

**When NOT to Use Async:**
- CPU-intensive computations
- Synchronous libraries
- Simple CRUD operations with sync ORM

**Async Database Operations:**

```python
from databases import Database

database = Database("postgresql://user:password@localhost/dbname")

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.get("/users/")
async def get_users():
    query = "SELECT * FROM users"
    users = await database.fetch_all(query)
    return users

@app.post("/users/")
async def create_user(user: UserCreate):
    query = "INSERT INTO users(username, email) VALUES (:username, :email)"
    values = {"username": user.username, "email": user.email}
    await database.execute(query, values)
    return {"message": "User created"}
```

**Concurrent Requests:**

```python
import httpx
import asyncio

@app.get("/aggregate-data/")
async def aggregate_data():
    async with httpx.AsyncClient() as client:
        # Run multiple requests concurrently
        responses = await asyncio.gather(
            client.get("https://api1.example.com/data"),
            client.get("https://api2.example.com/data"),
            client.get("https://api3.example.com/data")
        )

    return {
        "api1": responses[0].json(),
        "api2": responses[1].json(),
        "api3": responses[2].json()
    }
```

**Mixing Sync and Async:**

```python
from starlette.concurrency import run_in_threadpool

def blocking_operation():
    # CPU-intensive or blocking I/O
    time.sleep(5)
    return "Done"

@app.get("/mixed/")
async def mixed_endpoint():
    # Run blocking operation in thread pool
    result = await run_in_threadpool(blocking_operation)
    return {"result": result}
```

---

### 6. **How do you implement WebSocket connections in FastAPI?**

**Answer:**

```python
from fastapi import WebSocket, WebSocketDisconnect
from typing import List

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            await connection.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: int):
    await manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            await manager.send_personal_message(f"You wrote: {data}", websocket)
            await manager.broadcast(f"Client #{client_id} says: {data}")
    except WebSocketDisconnect:
        manager.disconnect(websocket)
        await manager.broadcast(f"Client #{client_id} left the chat")

# Chat Room Example
class ChatRoom:
    def __init__(self):
        self.rooms: dict = {}

    async def join_room(self, room_id: str, websocket: WebSocket):
        if room_id not in self.rooms:
            self.rooms[room_id] = []
        await websocket.accept()
        self.rooms[room_id].append(websocket)

    async def leave_room(self, room_id: str, websocket: WebSocket):
        self.rooms[room_id].remove(websocket)

    async def broadcast_to_room(self, room_id: str, message: str):
        for connection in self.rooms.get(room_id, []):
            await connection.send_json(message)

chat = ChatRoom()

@app.websocket("/chat/{room_id}")
async def chat_endpoint(websocket: WebSocket, room_id: str):
    await chat.join_room(room_id, websocket)
    try:
        while True:
            data = await websocket.receive_json()
            await chat.broadcast_to_room(room_id, {
                "user": data["user"],
                "message": data["message"],
                "timestamp": datetime.now().isoformat()
            })
    except WebSocketDisconnect:
        await chat.leave_room(room_id, websocket)
```

---

### 7. **Explain FastAPI middleware and CORS**

**Answer:**

**Built-in CORS Middleware:**

```python
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://example.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

**Custom Middleware:**

```python
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import time

class TimingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start_time = time.time()
        response = await call_next(request)
        process_time = time.time() - start_time
        response.headers["X-Process-Time"] = str(process_time)
        return response

app.add_middleware(TimingMiddleware)

# Logging Middleware
class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        logger.info(f"Request: {request.method} {request.url}")
        try:
            response = await call_next(request)
            logger.info(f"Response: {response.status_code}")
            return response
        except Exception as e:
            logger.error(f"Error: {str(e)}")
            raise

# Authentication Middleware
class AuthMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path.startswith("/api/"):
            token = request.headers.get("Authorization")
            if not token or not verify_token(token):
                return JSONResponse(
                    status_code=401,
                    content={"detail": "Unauthorized"}
                )
        response = await call_next(request)
        return response

app.add_middleware(AuthMiddleware)
```

**Request/Response Modification:**

```python
class CustomHeaderMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Modify request
        request.state.request_id = generate_request_id()

        response = await call_next(request)

        # Modify response
        response.headers["X-Request-ID"] = request.state.request_id
        response.headers["X-API-Version"] = "1.0"

        return response
```

---

## MYSQL INTERVIEW QUESTIONS

### 1. **Explain MySQL indexing strategies and types**

**Answer:**

**Index Types:**

1. **Primary Key Index:**
```sql
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) UNIQUE
);
```

2. **Unique Index:**
```sql
CREATE UNIQUE INDEX idx_email ON users(email);
```

3. **Composite Index:**
```sql
-- Order matters!
CREATE INDEX idx_name_age ON users(last_name, first_name, age);

-- Good: Uses index
SELECT * FROM users WHERE last_name = 'Smith';
SELECT * FROM users WHERE last_name = 'Smith' AND first_name = 'John';

-- Bad: Doesn't use index efficiently
SELECT * FROM users WHERE first_name = 'John';  -- Skips first column
SELECT * FROM users WHERE age = 25;  -- Skips first columns
```

4. **Full-Text Index:**
```sql
CREATE FULLTEXT INDEX idx_content ON articles(title, body);

-- Usage
SELECT * FROM articles
WHERE MATCH(title, body) AGAINST('database optimization' IN NATURAL LANGUAGE MODE);
```

5. **Covering Index:**
```sql
-- Index includes all columns needed by query
CREATE INDEX idx_covering ON orders(customer_id, order_date, total_amount);

-- Query covered by index (no table access needed)
SELECT customer_id, order_date, total_amount
FROM orders
WHERE customer_id = 123;
```

**Index Strategies:**

```sql
-- Use EXPLAIN to analyze queries
EXPLAIN SELECT * FROM users WHERE email = 'test@example.com';

-- Index for sorting
CREATE INDEX idx_created_desc ON posts(created_at DESC);

-- Partial index (MySQL doesn't support directly, use prefix)
CREATE INDEX idx_email_prefix ON users(email(10));

-- Avoid over-indexing
-- Bad: Too many indexes slow down writes
CREATE INDEX idx1 ON users(username);
CREATE INDEX idx2 ON users(email);
CREATE INDEX idx3 ON users(phone);
CREATE INDEX idx4 ON users(username, email);  -- Redundant!
```

**When to Use Indexes:**
- WHERE clause columns
- JOIN columns
- ORDER BY columns
- GROUP BY columns
- Columns used in DISTINCT

**When NOT to Use Indexes:**
- Small tables (full scan is faster)
- Columns with low cardinality (many duplicates)
- Columns frequently updated
- Large TEXT/BLOB columns

---

### 2. **Explain MySQL transactions and isolation levels**

**Answer:**

**ACID Properties:**
- **Atomicity**: All or nothing
- **Consistency**: Database remains valid
- **Isolation**: Transactions don't interfere
- **Durability**: Committed changes persist

**Transaction Usage:**

```sql
START TRANSACTION;

UPDATE accounts SET balance = balance - 100 WHERE id = 1;
UPDATE accounts SET balance = balance + 100 WHERE id = 2;

-- Check if everything is okay
IF (SELECT balance FROM accounts WHERE id = 1) >= 0 THEN
    COMMIT;
ELSE
    ROLLBACK;
END IF;
```

**Isolation Levels:**

1. **READ UNCOMMITTED**
```sql
SET TRANSACTION ISOLATION LEVEL READ UNCOMMITTED;
-- Can read uncommitted changes (dirty read)
-- Lowest isolation, highest performance
```

2. **READ COMMITTED**
```sql
SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
-- Only reads committed changes
-- Prevents dirty reads
-- Default in PostgreSQL
```

3. **REPEATABLE READ** (MySQL default)
```sql
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;
-- Same query returns same results within transaction
-- Prevents dirty reads and non-repeatable reads
-- Can have phantom reads
```

4. **SERIALIZABLE**
```sql
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
-- Highest isolation level
-- Transactions execute serially
-- Prevents all phenomena but lowest performance
```

**Locking:**

```sql
-- Pessimistic locking
SELECT * FROM products WHERE id = 1 FOR UPDATE;
UPDATE products SET stock = stock - 1 WHERE id = 1;
COMMIT;

-- Shared lock (read lock)
SELECT * FROM products WHERE id = 1 LOCK IN SHARE MODE;

-- Optimistic locking (application level)
-- Use version column
UPDATE products
SET stock = stock - 1, version = version + 1
WHERE id = 1 AND version = @old_version;
```

**Savepoints:**

```sql
START TRANSACTION;

INSERT INTO orders (user_id, total) VALUES (1, 100);
SAVEPOINT sp1;

INSERT INTO order_items (order_id, product_id) VALUES (1, 10);
SAVEPOINT sp2;

-- Something went wrong
ROLLBACK TO SAVEPOINT sp2;

-- Continue with transaction
INSERT INTO order_items (order_id, product_id) VALUES (1, 20);
COMMIT;
```

---

### 3. **Explain MySQL query optimization techniques**

**Answer:**

**1. Use EXPLAIN:**
```sql
EXPLAIN SELECT u.username, COUNT(o.id) as order_count
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE u.created_at > '2023-01-01'
GROUP BY u.id
ORDER BY order_count DESC;

-- Look for:
-- type: ALL is bad (full table scan), ref/range is good
-- rows: Number of rows examined
-- Extra: Using index, Using temporary, Using filesort
```

**2. Optimize JOIN operations:**
```sql
-- Bad: JOIN without index
SELECT * FROM orders o
JOIN customers c ON o.customer_email = c.email;

-- Good: JOIN on indexed column
SELECT * FROM orders o
JOIN customers c ON o.customer_id = c.id;

-- Better: Use covering index
CREATE INDEX idx_covering ON orders(customer_id, order_date, total);
```

**3. Avoid SELECT *:**
```sql
-- Bad
SELECT * FROM users WHERE id = 1;

-- Good
SELECT id, username, email FROM users WHERE id = 1;
```

**4. Use LIMIT:**
```sql
-- Bad: Fetches all rows
SELECT * FROM products ORDER BY created_at DESC;

-- Good: Fetch only needed rows
SELECT * FROM products ORDER BY created_at DESC LIMIT 10;
```

**5. Optimize WHERE clauses:**
```sql
-- Bad: Function on indexed column prevents index usage
SELECT * FROM users WHERE YEAR(created_at) = 2023;

-- Good: Use range
SELECT * FROM users WHERE created_at BETWEEN '2023-01-01' AND '2023-12-31';

-- Bad: Leading wildcard prevents index usage
SELECT * FROM users WHERE email LIKE '%@gmail.com';

-- Good: No leading wildcard
SELECT * FROM users WHERE email LIKE 'john%';
```

**6. Use EXISTS instead of IN for subqueries:**
```sql
-- Bad: IN with large subquery
SELECT * FROM users
WHERE id IN (SELECT user_id FROM orders WHERE total > 1000);

-- Good: EXISTS
SELECT * FROM users u
WHERE EXISTS (SELECT 1 FROM orders o WHERE o.user_id = u.id AND o.total > 1000);
```

**7. Optimize GROUP BY and ORDER BY:**
```sql
-- Create index for GROUP BY
CREATE INDEX idx_group ON orders(customer_id, order_date);

-- Use same columns in GROUP BY and ORDER BY
SELECT customer_id, SUM(total)
FROM orders
GROUP BY customer_id
ORDER BY customer_id;  -- Uses same order as GROUP BY
```

**8. Partition large tables:**
```sql
CREATE TABLE orders (
    id INT,
    user_id INT,
    order_date DATE,
    total DECIMAL(10,2)
)
PARTITION BY RANGE (YEAR(order_date)) (
    PARTITION p2021 VALUES LESS THAN (2022),
    PARTITION p2022 VALUES LESS THAN (2023),
    PARTITION p2023 VALUES LESS THAN (2024),
    PARTITION p_future VALUES LESS THAN MAXVALUE
);
```

---

### 4. **Explain MySQL replication and high availability**

**Answer:**

**Replication Types:**

1. **Master-Slave (Source-Replica):**
```sql
-- On Master
CREATE USER 'replicator'@'%' IDENTIFIED BY 'password';
GRANT REPLICATION SLAVE ON *.* TO 'replicator'@'%';
FLUSH PRIVILEGES;

-- Show master status
SHOW MASTER STATUS;
-- Note the File and Position

-- On Slave
CHANGE MASTER TO
    MASTER_HOST='master_host',
    MASTER_USER='replicator',
    MASTER_PASSWORD='password',
    MASTER_LOG_FILE='mysql-bin.000001',
    MASTER_LOG_POS=154;

START SLAVE;
SHOW SLAVE STATUS\G;
```

2. **Master-Master (Dual-Master):**
```sql
-- Both servers act as master and slave
-- Auto-increment offset to avoid conflicts
-- Server 1:
SET GLOBAL auto_increment_increment = 2;
SET GLOBAL auto_increment_offset = 1;

-- Server 2:
SET GLOBAL auto_increment_increment = 2;
SET GLOBAL auto_increment_offset = 2;
```

3. **Group Replication:**
```sql
-- Multi-master with automatic conflict resolution
-- Provides fault tolerance and automatic failover
```

**Replication Formats:**

```sql
-- Statement-based: Replicates SQL statements
SET GLOBAL binlog_format = 'STATEMENT';

-- Row-based: Replicates changed rows (safer)
SET GLOBAL binlog_format = 'ROW';

-- Mixed: Automatic switching
SET GLOBAL binlog_format = 'MIXED';
```

**High Availability Architecture:**

```
Application Layer
     ↓
  ProxySQL / HAProxy (Load Balancer)
     ↓
Master ←→ Slave1 ← Slave2 ← Slave3
  (Write)   (Read)  (Read)  (Read)
```

**Monitoring Replication:**

```sql
-- Check slave status
SHOW SLAVE STATUS\G;

-- Important fields:
-- Slave_IO_Running: Should be Yes
-- Slave_SQL_Running: Should be Yes
-- Seconds_Behind_Master: Should be 0 or low

-- Check replication lag
SELECT
    TIMESTAMPDIFF(SECOND,
        ts,
        NOW()) AS replication_lag_seconds
FROM (
    SELECT MAX(last_update) AS ts
    FROM information_schema.processlist
    WHERE command = 'Sleep'
) AS t;
```

---

### 5. **Explain stored procedures, triggers, and events in MySQL**

**Answer:**

**Stored Procedures:**

```sql
DELIMITER //

CREATE PROCEDURE GetUserOrders(IN userId INT)
BEGIN
    SELECT o.id, o.order_date, o.total
    FROM orders o
    WHERE o.user_id = userId
    ORDER BY o.order_date DESC;
END //

DELIMITER ;

-- Call procedure
CALL GetUserOrders(123);

-- Procedure with OUT parameter
DELIMITER //

CREATE PROCEDURE GetOrderStats(
    IN userId INT,
    OUT totalOrders INT,
    OUT totalAmount DECIMAL(10,2)
)
BEGIN
    SELECT
        COUNT(*),
        SUM(total)
    INTO totalOrders, totalAmount
    FROM orders
    WHERE user_id = userId;
END //

DELIMITER ;

-- Usage
CALL GetOrderStats(123, @count, @amount);
SELECT @count, @amount;

-- Complex procedure with error handling
DELIMITER //

CREATE PROCEDURE TransferFunds(
    IN fromAccount INT,
    IN toAccount INT,
    IN amount DECIMAL(10,2)
)
BEGIN
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SELECT 'Transfer failed' AS message;
    END;

    START TRANSACTION;

    UPDATE accounts
    SET balance = balance - amount
    WHERE id = fromAccount AND balance >= amount;

    IF ROW_COUNT() = 0 THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Insufficient funds';
    END IF;

    UPDATE accounts
    SET balance = balance + amount
    WHERE id = toAccount;

    COMMIT;
    SELECT 'Transfer successful' AS message;
END //

DELIMITER ;
```

**Triggers:**

```sql
-- Before INSERT trigger
DELIMITER //

CREATE TRIGGER before_user_insert
BEFORE INSERT ON users
FOR EACH ROW
BEGIN
    SET NEW.created_at = NOW();
    SET NEW.username = LOWER(NEW.username);
END //

DELIMITER ;

-- After UPDATE trigger
DELIMITER //

CREATE TRIGGER after_product_update
AFTER UPDATE ON products
FOR EACH ROW
BEGIN
    IF NEW.stock < 10 AND OLD.stock >= 10 THEN
        INSERT INTO low_stock_alerts(product_id, stock_level, alert_date)
        VALUES (NEW.id, NEW.stock, NOW());
    END IF;
END //

DELIMITER ;

-- Audit trigger
DELIMITER //

CREATE TRIGGER audit_order_changes
AFTER UPDATE ON orders
FOR EACH ROW
BEGIN
    INSERT INTO order_audit(
        order_id,
        old_status,
        new_status,
        changed_by,
        changed_at
    )
    VALUES (
        NEW.id,
        OLD.status,
        NEW.status,
        USER(),
        NOW()
    );
END //

DELIMITER ;
```

**Events:**

```sql
-- Enable event scheduler
SET GLOBAL event_scheduler = ON;

-- Daily cleanup event
DELIMITER //

CREATE EVENT daily_cleanup
ON SCHEDULE EVERY 1 DAY
STARTS '2024-01-01 02:00:00'
DO
BEGIN
    DELETE FROM temporary_data
    WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY);

    DELETE FROM session_data
    WHERE last_activity < DATE_SUB(NOW(), INTERVAL 1 DAY);

    OPTIMIZE TABLE temporary_data;
END //

DELIMITER ;

-- One-time event
CREATE EVENT one_time_cleanup
ON SCHEDULE AT '2024-12-31 23:59:59'
DO
  DELETE FROM old_records WHERE year < 2020;

-- Recurring event with interval
CREATE EVENT send_weekly_report
ON SCHEDULE EVERY 1 WEEK
STARTS '2024-01-01 09:00:00'
DO
  CALL GenerateWeeklyReport();

-- Show events
SHOW EVENTS;

-- Disable/Enable event
ALTER EVENT daily_cleanup DISABLE;
ALTER EVENT daily_cleanup ENABLE;

-- Drop event
DROP EVENT IF EXISTS daily_cleanup;
```

---

### 6. **Explain database normalization and denormalization**

**Answer:**

**Normal Forms:**

**1NF (First Normal Form):**
- Eliminate repeating groups
- Each cell contains atomic value

```sql
-- Bad: Not in 1NF
CREATE TABLE students (
    id INT,
    name VARCHAR(100),
    courses VARCHAR(500)  -- "Math,Physics,Chemistry"
);

-- Good: 1NF
CREATE TABLE students (
    id INT PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE student_courses (
    student_id INT,
    course_name VARCHAR(100),
    PRIMARY KEY (student_id, course_name),
    FOREIGN KEY (student_id) REFERENCES students(id)
);
```

**2NF (Second Normal Form):**
- Must be in 1NF
- No partial dependencies

```sql
-- Bad: Not in 2NF
CREATE TABLE order_items (
    order_id INT,
    product_id INT,
    product_name VARCHAR(100),  -- Depends only on product_id
    product_price DECIMAL(10,2), -- Depends only on product_id
    quantity INT,
    PRIMARY KEY (order_id, product_id)
);

-- Good: 2NF
CREATE TABLE products (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    price DECIMAL(10,2)
);

CREATE TABLE order_items (
    order_id INT,
    product_id INT,
    quantity INT,
    PRIMARY KEY (order_id, product_id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

**3NF (Third Normal Form):**
- Must be in 2NF
- No transitive dependencies

```sql
-- Bad: Not in 3NF
CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    department_id INT,
    department_name VARCHAR(100),  -- Depends on department_id
    department_location VARCHAR(100)  -- Depends on department_id
);

-- Good: 3NF
CREATE TABLE departments (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    location VARCHAR(100)
);

CREATE TABLE employees (
    id INT PRIMARY KEY,
    name VARCHAR(100),
    department_id INT,
    FOREIGN KEY (department_id) REFERENCES departments(id)
);
```

**Denormalization:**

When to denormalize for performance:

```sql
-- Normalized (requires JOIN)
SELECT u.username, COUNT(p.id) as post_count
FROM users u
LEFT JOIN posts p ON u.id = p.user_id
GROUP BY u.id;

-- Denormalized (maintains count in users table)
CREATE TABLE users (
    id INT PRIMARY KEY,
    username VARCHAR(50),
    post_count INT DEFAULT 0,  -- Denormalized
    INDEX idx_post_count (post_count)
);

-- Update with trigger
DELIMITER //
CREATE TRIGGER update_post_count
AFTER INSERT ON posts
FOR EACH ROW
BEGIN
    UPDATE users
    SET post_count = post_count + 1
    WHERE id = NEW.user_id;
END //
DELIMITER ;

-- Now query is simple and fast
SELECT username, post_count FROM users;
```

**Materialized Views (MySQL doesn't support directly):**

```sql
-- Simulate with table and events
CREATE TABLE user_stats AS
SELECT
    u.id,
    u.username,
    COUNT(DISTINCT o.id) as order_count,
    SUM(o.total) as total_spent,
    MAX(o.order_date) as last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id
GROUP BY u.id;

-- Update periodically
CREATE EVENT refresh_user_stats
ON SCHEDULE EVERY 1 HOUR
DO
BEGIN
    TRUNCATE user_stats;
    INSERT INTO user_stats
    SELECT
        u.id,
        u.username,
        COUNT(DISTINCT o.id),
        SUM(o.total),
        MAX(o.order_date)
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    GROUP BY u.id;
END;
```

---

### 7. **Explain MySQL backup and recovery strategies**

**Answer:**

**Backup Types:**

**1. Logical Backup (mysqldump):**

```bash
# Full database backup
mysqldump -u root -p --all-databases > full_backup.sql

# Single database
mysqldump -u root -p database_name > db_backup.sql

# Specific tables
mysqldump -u root -p database_name table1 table2 > tables_backup.sql

# With compression
mysqldump -u root -p database_name | gzip > backup.sql.gz

# Exclude certain tables
mysqldump -u root -p database_name \
    --ignore-table=database_name.log_table \
    --ignore-table=database_name.temp_table \
    > backup.sql

# With routines and events
mysqldump -u root -p --routines --events database_name > backup.sql

# Consistent backup (for InnoDB)
mysqldump -u root -p --single-transaction --quick database_name > backup.sql
```

**2. Physical Backup (Percona XtraBackup):**

```bash
# Full backup
xtrabackup --backup --target-dir=/backup/full

# Incremental backup
xtrabackup --backup --target-dir=/backup/inc1 \
    --incremental-basedir=/backup/full

# Prepare backup
xtrabackup --prepare --target-dir=/backup/full
xtrabackup --prepare --target-dir=/backup/full \
    --incremental-dir=/backup/inc1

# Restore
systemctl stop mysql
rm -rf /var/lib/mysql/*
xtrabackup --copy-back --target-dir=/backup/full
chown -R mysql:mysql /var/lib/mysql
systemctl start mysql
```

**3. Binary Log Backup:**

```sql
-- Enable binary logging
[mysqld]
log-bin=mysql-bin
server-id=1
binlog_format=ROW

-- Backup binary logs
mysqlbinlog mysql-bin.000001 > binlog_backup.sql

-- Point-in-time recovery
mysqlbinlog --start-datetime="2024-01-01 10:00:00" \
            --stop-datetime="2024-01-01 11:00:00" \
            mysql-bin.000001 | mysql -u root -p
```

**Recovery Strategies:**

```bash
# Restore from mysqldump
mysql -u root -p database_name < backup.sql

# Restore compressed backup
gunzip < backup.sql.gz | mysql -u root -p database_name

# Restore all databases
mysql -u root -p < full_backup.sql

# Point-in-time recovery
# 1. Restore full backup
mysql -u root -p < full_backup.sql

# 2. Apply binary logs up to specific point
mysqlbinlog --stop-position=12345 mysql-bin.000001 | mysql -u root -p
```

**Automated Backup Script:**

```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Create backup
mysqldump -u backup_user -p$DB_PASSWORD \
    --single-transaction \
    --routines \
    --events \
    --all-databases | gzip > "$BACKUP_DIR/backup_$DATE.sql.gz"

# Remove old backups
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Upload to S3 (optional)
aws s3 cp "$BACKUP_DIR/backup_$DATE.sql.gz" \
    s3://my-backups/mysql/

# Send notification
echo "Backup completed: backup_$DATE.sql.gz" | \
    mail -s "MySQL Backup Status" admin@example.com
```

---

## PREPARATION STRATEGY

### 1. **Study Timeline (4-6 Weeks)**

**Week 1-2: Django**
- Review ORM concepts and practice complex queries
- Build a small project with authentication and authorization
- Practice REST API development with DRF
- Study caching strategies and implement them

**Week 3: Flask & FastAPI**
- Compare and contrast with Django
- Build microservices with FastAPI
- Implement async endpoints
- Practice WebSocket implementation

**Week 4: MySQL**
- Practice query optimization with EXPLAIN
- Study and implement different index types
- Practice writing stored procedures and triggers
- Set up replication locally

**Week 5-6: Integration & Practice**
- Build a complete project using all technologies
- Practice system design questions
- Mock interviews
- Review and fill knowledge gaps

### 2. **Hands-On Practice Projects**

**Project 1: E-commerce API**
- User authentication (JWT)
- Product catalog with search and filters
- Order management with transactions
- Payment integration
- Implement caching
- API rate limiting

**Project 2: Social Media Backend**
- User profiles and authentication
- Post creation with media uploads
- Follow/unfollow system
- News feed with pagination
- Real-time notifications (WebSocket)
- Database optimization for scale

**Project 3: Microservices Architecture**
- User service (FastAPI)
- Product service (Flask)
- Order service (Django)
- API Gateway
- Service communication
- Database per service

### 3. **Key Topics to Master**

**Django:**
- ORM query optimization
- Custom middleware
- Signals and when to avoid them
- Celery integration
- Django REST Framework
- Security best practices
- Testing strategies

**Flask:**
- Application factory pattern
- Blueprint architecture
- Flask-SQLAlchemy
- Custom decorators
- Request/response lifecycle
- Extension development

**FastAPI:**
- Async/await patterns
- Dependency injection
- Pydantic models and validation
- Background tasks
- WebSocket
- Testing async endpoints

**MySQL:**
- Index strategies
- Query optimization
- Transaction management
- Replication setup
- Backup and recovery
- Performance tuning
- Stored procedures

### 4. **Common Interview Questions Format**

**Behavioral:**
- Describe a challenging bug you fixed
- How do you handle technical debt?
- Explain a time you optimized performance
- How do you approach code reviews?

**System Design:**
- Design a URL shortener
- Design a notification system
- Design a caching system
- Design a scalable e-commerce platform

**Coding Challenges:**
- Implement rate limiting
- Build a custom ORM feature
- Optimize slow queries
- Implement caching strategy

### 5. **Resources**

**Books:**
- "Two Scoops of Django" - Django best practices
- "Flask Web Development" by Miguel Grinberg
- "High Performance MySQL"
- "Designing Data-Intensive Applications"

**Online:**
- Official documentation (primary resource)
- Real Python tutorials
- FastAPI documentation and tutorials
- MySQL Performance Blog
- GitHub open-source projects

**Practice:**
- LeetCode (SQL and coding challenges)
- HackerRank (Python and SQL)
- Build personal projects
- Contribute to open-source

### 6. **Interview Day Tips**

**Before:**
- Review your projects thoroughly
- Practice explaining technical decisions
- Prepare questions for the interviewer
- Get good sleep

**During:**
- Think out loud
- Ask clarifying questions
- Discuss trade-offs
- Admit when you don't know something
- Show enthusiasm for learning

**After:**
- Follow up with thank you email
- Reflect on areas to improve
- Continue learning

### 7. **Red Flags to Avoid**

- Don't use SELECT *
- Don't ignore N+1 query problems
- Don't store passwords in plain text
- Don't skip input validation
- Don't ignore error handling
- Don't over-engineer simple solutions
- Don't use transactions everywhere unnecessarily

### 8. **Practice Questions**

**Daily Practice:**
- Write 2-3 complex SQL queries
- Implement a Django/Flask/FastAPI endpoint
- Optimize an existing query
- Read and analyze production code
- Review Python best practices

**Weekly:**
- Build a complete feature end-to-end
- Performance test your code
- Conduct mock interview
- Review interview questions
- Study system design patterns

---

## FINAL TIPS

1. **Focus on fundamentals**: Understand WHY things work, not just HOW
2. **Practice coding**: Write code daily, don't just read
3. **Explain concepts**: Practice explaining to others
4. **Build projects**: Hands-on experience is invaluable
5. **Stay updated**: Follow latest releases and best practices
6. **Performance matters**: Always consider scalability
7. **Security first**: Never compromise on security
8. **Test your code**: Write tests for critical functionality
9. **Document your work**: Good documentation shows professionalism
10. **Be honest**: It's okay to say "I don't know, but here's how I'd find out"

Good luck with your interviews! 🚀
