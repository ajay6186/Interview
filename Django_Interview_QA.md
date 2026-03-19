# Django Interview Questions & Answers (6-7 Years Experience)

---

## 1. Architecture & Core Concepts

### Q1: Explain Django's MTV architecture and how it differs from MVC?

**Answer:**
Django follows the **Model-Template-View (MTV)** pattern:

- **Model** — Handles data and business logic (same as MVC's Model)
- **Template** — Handles presentation/UI (equivalent to MVC's View)
- **View** — Handles the request/response logic (equivalent to MVC's Controller)

The key difference is naming. Django's "View" acts as the controller, and Django's "Template" acts as the view. Django also has a URL dispatcher that routes requests to the appropriate view.

```
Request → URL Dispatcher → View → Model (DB) → View → Template → Response
```

---

### Q2: What is Django Middleware? How do you write custom middleware?

**Answer:**
Middleware is a framework of hooks into Django's request/response processing. It's a lightweight plugin system for globally altering input/output.

**Execution Order:**
- Request phase: top to bottom
- Response phase: bottom to top

```python
# Custom Middleware Example
class RequestTimingMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
        # One-time configuration and initialization

    def __call__(self, request):
        import time
        start_time = time.time()

        # Code executed before the view
        response = self.get_response(request)

        # Code executed after the view
        duration = time.time() - start_time
        response['X-Request-Duration'] = str(duration)
        return response

    def process_view(self, request, view_func, view_args, view_kwargs):
        """Called just before Django calls the view."""
        return None

    def process_exception(self, request, exception):
        """Called when a view raises an exception."""
        return None

    def process_template_response(self, request, response):
        """Called after the view returns a TemplateResponse."""
        return response
```

```python
# settings.py
MIDDLEWARE = [
    'myapp.middleware.RequestTimingMiddleware',
    # ...
]
```

---

### Q3: Explain Django's ORM QuerySet evaluation and lazy loading.

**Answer:**
QuerySets are **lazy** — they don't hit the database until they are evaluated.

**When QuerySets are evaluated:**
1. **Iteration** — `for obj in queryset`
2. **Slicing with step** — `queryset[::2]`
3. **len()** — `len(queryset)`
4. **list()** — `list(queryset)`
5. **bool()** — `if queryset:`
6. **repr()** — Printing in shell
7. **Pickling/Caching**

```python
# This does NOT hit the database
qs = User.objects.filter(is_active=True)
qs = qs.exclude(role='admin')
qs = qs.order_by('-date_joined')

# Database is hit only HERE
for user in qs:
    print(user.name)
```

**QuerySet Caching:**
```python
# First evaluation — hits DB, caches results
qs = User.objects.all()
list(qs)  # DB hit

# Second evaluation — uses cache
list(qs)  # No DB hit
```

---

### Q4: What are `select_related` and `prefetch_related`? When to use each?

**Answer:**

| Feature | `select_related` | `prefetch_related` |
|---------|------------------|-------------------|
| Join Type | SQL JOIN (single query) | Separate query + Python join |
| Relations | ForeignKey, OneToOne | ManyToMany, reverse ForeignKey |
| Performance | Better for single-valued | Better for multi-valued |

```python
# select_related — uses SQL JOIN (ForeignKey/OneToOne)
# 1 query instead of N+1
books = Book.objects.select_related('author', 'publisher').all()

# prefetch_related — separate queries (ManyToMany/reverse FK)
# 2 queries instead of N+1
authors = Author.objects.prefetch_related('books').all()

# Custom Prefetch with filtering
from django.db.models import Prefetch
authors = Author.objects.prefetch_related(
    Prefetch(
        'books',
        queryset=Book.objects.filter(published=True),
        to_attr='published_books'
    )
)
```

---

### Q5: How does Django handle database transactions?

**Answer:**
Django provides several ways to manage transactions:

```python
# 1. ATOMIC_REQUESTS — wraps every view in a transaction
# settings.py
DATABASES = {
    'default': {
        'ATOMIC_REQUESTS': True,
    }
}

# 2. transaction.atomic() — decorator
from django.db import transaction

@transaction.atomic
def transfer_money(from_acc, to_acc, amount):
    from_acc.balance -= amount
    from_acc.save()
    to_acc.balance += amount
    to_acc.save()

# 3. transaction.atomic() — context manager
def create_order(request):
    with transaction.atomic():
        order = Order.objects.create(user=request.user)
        for item in cart_items:
            OrderItem.objects.create(order=order, product=item.product)

# 4. Nested atomic blocks (savepoints)
with transaction.atomic():  # Outer transaction
    user.save()
    with transaction.atomic():  # Savepoint
        try:
            profile.save()
        except IntegrityError:
            pass  # Savepoint rolled back, outer continues

# 5. Manual transaction management
from django.db import transaction

def manual_example():
    transaction.set_autocommit(False)
    try:
        # ... operations
        transaction.commit()
    except:
        transaction.rollback()
    finally:
        transaction.set_autocommit(True)

# 6. on_commit — run code after transaction commits
with transaction.atomic():
    order = Order.objects.create(...)
    transaction.on_commit(lambda: send_order_email.delay(order.id))
```

---

### Q6: Explain Django Signals. What are the drawbacks?

**Answer:**
Signals allow decoupled applications to get notified when actions occur.

```python
# Built-in signals
from django.db.models.signals import pre_save, post_save, pre_delete, post_delete
from django.dispatch import receiver
from django.core.signals import request_started, request_finished

# Method 1: Decorator
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)

# Method 2: Manual connect
def my_handler(sender, **kwargs):
    pass
post_save.connect(my_handler, sender=User)

# Custom Signal
import django.dispatch
order_completed = django.dispatch.Signal()  # Django 3.1+

# Send signal
order_completed.send(sender=Order, order=order, user=user)
```

**Drawbacks:**
1. **Hard to debug** — implicit flow, stack traces are confusing
2. **Performance** — synchronous execution, can slow down requests
3. **Order dependency** — signal handlers have no guaranteed order
4. **Tight coupling in disguise** — can create hidden dependencies
5. **Race conditions** — signals fire before transaction commits

**Best Practice:** Prefer explicit method calls over signals. Use signals only for truly decoupled apps.

---

### Q7: How do you optimize Django for high traffic?

**Answer:**

```python
# 1. DATABASE OPTIMIZATION
# Use indexes
class Product(models.Model):
    name = models.CharField(max_length=200, db_index=True)
    class Meta:
        indexes = [
            models.Index(fields=['name', 'category']),
            models.Index(fields=['-created_at']),
        ]

# Use .only() and .defer() for partial loading
Product.objects.only('name', 'price')
Product.objects.defer('description', 'metadata')

# Use .values() or .values_list() when you don't need model instances
Product.objects.values_list('id', 'name', flat=False)

# Bulk operations
Product.objects.bulk_create([Product(name=n) for n in names])
Product.objects.bulk_update(products, ['price'])

# 2. CACHING
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
    }
}

# Per-view cache
from django.views.decorators.cache import cache_page
@cache_page(60 * 15)
def my_view(request):
    pass

# Template fragment caching
# {% cache 500 sidebar request.user.id %}

# Low-level cache
from django.core.cache import cache
cache.set('my_key', 'my_value', timeout=300)
value = cache.get('my_key')

# 3. ASYNC VIEWS (Django 4.1+)
async def async_view(request):
    data = await sync_to_async(heavy_db_operation)()
    return JsonResponse(data)

# 4. Database connection pooling (Django 5.1+)
DATABASES = {
    'default': {
        'CONN_MAX_AGE': 600,
        'CONN_HEALTH_CHECKS': True,
    }
}

# 5. Use pagination
from django.core.paginator import Paginator
paginator = Paginator(queryset, 25)

# 6. Use Celery for background tasks
# 7. Use CDN for static files
# 8. Enable GZip middleware
# 9. Database read replicas with database routers
```

---

### Q8: Explain Django REST Framework (DRF) — Serializers, ViewSets, and Authentication.

**Answer:**

```python
# --- SERIALIZERS ---
from rest_framework import serializers

class UserSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'full_name']
        read_only_fields = ['id']

    def get_full_name(self, obj):
        return f"{obj.first_name} {obj.last_name}"

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists")
        return value

    def validate(self, data):
        """Cross-field validation"""
        if data.get('start_date') and data.get('end_date'):
            if data['start_date'] > data['end_date']:
                raise serializers.ValidationError("End date must be after start date")
        return data

# Nested Serializer
class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    user = UserSerializer(read_only=True)

    class Meta:
        model = Order
        fields = '__all__'

# --- VIEWSETS ---
from rest_framework import viewsets, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['username', 'email']
    ordering_fields = ['date_joined']

    def get_queryset(self):
        qs = super().get_queryset()
        if not self.request.user.is_staff:
            qs = qs.filter(id=self.request.user.id)
        return qs

    def get_serializer_class(self):
        if self.action == 'list':
            return UserListSerializer
        return UserDetailSerializer

    @action(detail=True, methods=['post'])
    def deactivate(self, request, pk=None):
        user = self.get_object()
        user.is_active = False
        user.save()
        return Response({'status': 'deactivated'})

# --- AUTHENTICATION ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle',
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '100/hour',
        'user': '1000/hour',
    },
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}

# Custom Permission
from rest_framework.permissions import BasePermission

class IsOwnerOrReadOnly(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        return obj.owner == request.user
```

---

### Q9: Explain Django's Class-Based Views (CBVs) and the MRO.

**Answer:**

```python
# View hierarchy
# View → TemplateView → ListView/DetailView → CreateView/UpdateView/DeleteView

from django.views.generic import ListView, DetailView, CreateView
from django.contrib.auth.mixins import LoginRequiredMixin, PermissionRequiredMixin

class ProductListView(LoginRequiredMixin, ListView):
    model = Product
    template_name = 'products/list.html'
    context_object_name = 'products'
    paginate_by = 20

    def get_queryset(self):
        qs = super().get_queryset()
        category = self.request.GET.get('category')
        if category:
            qs = qs.filter(category__slug=category)
        return qs.select_related('category')

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['categories'] = Category.objects.all()
        return context

# MRO (Method Resolution Order) — C3 Linearization
# Python resolves methods left-to-right, depth-first
class MyView(LoginRequiredMixin, PermissionRequiredMixin, UpdateView):
    pass

# MRO: MyView → LoginRequiredMixin → PermissionRequiredMixin → UpdateView → ...
print(MyView.__mro__)
```

---

### Q10: How do you handle database migrations in production?

**Answer:**

```python
# 1. Always review migrations before applying
python manage.py showmigrations
python manage.py sqlmigrate myapp 0005

# 2. Zero-downtime migrations strategy:
# Step 1: Add new column with null=True (backward compatible)
# Step 2: Deploy code that writes to both old and new columns
# Step 3: Backfill data
# Step 4: Deploy code that reads from new column
# Step 5: Remove old column

# 3. Data migrations
from django.db import migrations

def forward_func(apps, schema_editor):
    User = apps.get_model('myapp', 'User')
    for user in User.objects.all().iterator():
        user.full_name = f"{user.first_name} {user.last_name}"
        user.save(update_fields=['full_name'])

def reverse_func(apps, schema_editor):
    pass

class Migration(migrations.Migration):
    dependencies = [('myapp', '0004_auto')]
    operations = [
        migrations.RunPython(forward_func, reverse_func),
    ]

# 4. Squash migrations for cleanup
python manage.py squashmigrations myapp 0001 0010

# 5. Use --fake for special cases
python manage.py migrate --fake myapp 0005
```

---

### Q11: What is the Django Manager? How do you create custom managers?

**Answer:**

```python
from django.db import models

class ActiveManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_active=True)

class PublishedManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(status='published')

    def by_author(self, author):
        return self.get_queryset().filter(author=author)

    def recent(self, days=7):
        from django.utils import timezone
        cutoff = timezone.now() - timezone.timedelta(days=days)
        return self.get_queryset().filter(created_at__gte=cutoff)

class Article(models.Model):
    title = models.CharField(max_length=200)
    status = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)

    objects = models.Manager()        # Default manager
    active = ActiveManager()           # Custom manager
    published = PublishedManager()     # Custom manager

# Usage
Article.objects.all()                  # All articles
Article.active.all()                   # Only active
Article.published.recent(days=30)      # Published in last 30 days
Article.published.by_author(user)      # Published by specific author
```

---

### Q12: Explain Django's Security Features.

**Answer:**

1. **CSRF Protection** — `{% csrf_token %}` in forms, `CsrfViewMiddleware`
2. **XSS Protection** — Auto-escaping in templates, `|safe` filter must be explicit
3. **SQL Injection** — ORM parameterizes queries automatically
4. **Clickjacking** — `X-Frame-Options` via `XFrameOptionsMiddleware`
5. **HTTPS/SSL** — `SECURE_SSL_REDIRECT`, `SECURE_HSTS_SECONDS`
6. **Password Hashing** — PBKDF2 by default, supports Argon2, bcrypt
7. **Session Security** — `SESSION_COOKIE_SECURE`, `SESSION_COOKIE_HTTPONLY`
8. **Host Header Validation** — `ALLOWED_HOSTS`
9. **Content Type Sniffing** — `SECURE_CONTENT_TYPE_NOSNIFF`

```python
# Production security settings
SECURE_SSL_REDIRECT = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_CONTENT_TYPE_NOSNIFF = True
SECURE_BROWSER_XSS_FILTER = True
X_FRAME_OPTIONS = 'DENY'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
     'OPTIONS': {'min_length': 12}},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]
```

---

### Q13: How do you implement custom User model in Django?

**Answer:**

```python
# ALWAYS do this at the START of a project
from django.contrib.auth.models import AbstractUser, AbstractBaseUser, BaseUserManager

# Option 1: Extend AbstractUser (recommended)
class CustomUser(AbstractUser):
    phone = models.CharField(max_length=15, blank=True)
    avatar = models.ImageField(upload_to='avatars/', null=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    class Meta:
        db_table = 'users'

# Option 2: Full custom with AbstractBaseUser
class CustomUserManager(BaseUserManager):
    def create_user(self, email, password=None, **extra_fields):
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, password, **extra_fields)

class CustomUser(AbstractBaseUser, PermissionsMixin):
    email = models.EmailField(unique=True)
    first_name = models.CharField(max_length=50)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    objects = CustomUserManager()
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['first_name']

# settings.py
AUTH_USER_MODEL = 'myapp.CustomUser'
```

---

### Q14: Explain Django Channels and WebSockets.

**Answer:**

```python
# Django Channels extends Django to handle WebSockets, HTTP2, etc.

# consumers.py
import json
from channels.generic.websocket import AsyncWebsocketConsumer

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope['url_route']['kwargs']['room_name']
        self.room_group_name = f'chat_{self.room_name}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive(self, text_data):
        data = json.loads(text_data)
        message = data['message']

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
                'sender': self.scope['user'].username,
            }
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'message': event['message'],
            'sender': event['sender'],
        }))

# routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'ws/chat/(?P<room_name>\w+)/$', consumers.ChatConsumer.as_asgi()),
]

# settings.py
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [('127.0.0.1', 6379)],
        },
    },
}
```

---

### Q15: What are F() and Q() expressions?

**Answer:**

```python
from django.db.models import F, Q, Value, Case, When

# F() — Reference model field values in queries (avoids race conditions)
# Increment price by 10% without loading into Python
Product.objects.update(price=F('price') * 1.10)

# Compare two fields
Entry.objects.filter(comments__gt=F('views'))

# Annotations with F()
from django.db.models import ExpressionWrapper, DecimalField
Product.objects.annotate(
    profit=ExpressionWrapper(
        F('selling_price') - F('cost_price'),
        output_field=DecimalField()
    )
)

# Q() — Complex queries with OR, AND, NOT
Product.objects.filter(
    Q(category='electronics') | Q(category='books'),
    Q(price__lt=100) & ~Q(status='discontinued'),
)

# Dynamic query building
filters = Q()
if category:
    filters &= Q(category=category)
if min_price:
    filters &= Q(price__gte=min_price)
Product.objects.filter(filters)

# Case/When — Conditional expressions
Product.objects.annotate(
    price_category=Case(
        When(price__lt=10, then=Value('cheap')),
        When(price__lt=100, then=Value('moderate')),
        default=Value('expensive'),
    )
)
```
