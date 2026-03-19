"""
Flask Interview Demo Server
Covers: Application Factory, Blueprints, Middleware, Error Handling,
        SQLAlchemy ORM, JWT Auth, Caching, Rate Limiting, Testing patterns
Run:  flask run --debug
Test: pytest tests/
"""

import os
import functools
from datetime import datetime, timezone

from flask import Flask, jsonify, request, g, abort
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager, create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from flask_caching import Cache
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
from marshmallow import Schema, fields, validate, ValidationError

# ──────────────────────────────────────────────
# Extensions (initialised without app — factory pattern)
# ──────────────────────────────────────────────
db = SQLAlchemy()
jwt = JWTManager()
cache = Cache()

# ──────────────────────────────────────────────
# Models
# ──────────────────────────────────────────────
class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(20), default="user")  # user | admin
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    posts = db.relationship("Post", backref="author", lazy="dynamic")

    def set_password(self, pw):
        self.password_hash = generate_password_hash(pw)

    def check_password(self, pw):
        return check_password_hash(self.password_hash, pw)

    def to_dict(self):
        return {
            "id": self.id,
            "username": self.username,
            "email": self.email,
            "role": self.role,
            "created_at": self.created_at.isoformat(),
        }


class Post(db.Model):
    __tablename__ = "posts"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(200), nullable=False)
    body = db.Column(db.Text, nullable=False)
    published = db.Column(db.Boolean, default=False)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc),
                           onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            "id": self.id,
            "title": self.title,
            "body": self.body,
            "published": self.published,
            "author": self.author.username,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
        }

# ──────────────────────────────────────────────
# Marshmallow Schemas (validation & serialization)
# ──────────────────────────────────────────────
class RegisterSchema(Schema):
    username = fields.Str(required=True, validate=validate.Length(min=3, max=80))
    email = fields.Email(required=True)
    password = fields.Str(required=True, validate=validate.Length(min=6))


class PostCreateSchema(Schema):
    title = fields.Str(required=True, validate=validate.Length(min=1, max=200))
    body = fields.Str(required=True)
    published = fields.Bool(load_default=False)


class PostUpdateSchema(Schema):
    title = fields.Str(validate=validate.Length(min=1, max=200))
    body = fields.Str()
    published = fields.Bool()


# ──────────────────────────────────────────────
# Custom Decorators
# ──────────────────────────────────────────────
def admin_required(fn):
    """Decorator that requires JWT + admin role."""
    @functools.wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify(msg="Admin access required"), 403
        return fn(*args, **kwargs)
    return wrapper


# ──────────────────────────────────────────────
# Blueprints
# ──────────────────────────────────────────────
from flask import Blueprint

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")
posts_bp = Blueprint("posts", __name__, url_prefix="/api/posts")
admin_bp = Blueprint("admin", __name__, url_prefix="/api/admin")


# ── Auth Routes ──────────────────────────────
@auth_bp.route("/register", methods=["POST"])
def register():
    """Register a new user."""
    schema = RegisterSchema()
    try:
        data = schema.load(request.get_json())
    except ValidationError as err:
        return jsonify(errors=err.messages), 422

    if User.query.filter(
        (User.username == data["username"]) | (User.email == data["email"])
    ).first():
        return jsonify(msg="Username or email already exists"), 409

    user = User(username=data["username"], email=data["email"])
    user.set_password(data["password"])
    db.session.add(user)
    db.session.commit()

    return jsonify(msg="User created", user=user.to_dict()), 201


@auth_bp.route("/login", methods=["POST"])
def login():
    """Login and receive JWT tokens."""
    data = request.get_json()
    user = User.query.filter_by(username=data.get("username")).first()

    if not user or not user.check_password(data.get("password", "")):
        return jsonify(msg="Invalid credentials"), 401

    # additional_claims are added to the JWT payload
    access_token = create_access_token(
        identity=str(user.id),
        additional_claims={"role": user.role, "username": user.username}
    )
    refresh_token = create_refresh_token(identity=str(user.id))

    return jsonify(access_token=access_token, refresh_token=refresh_token)


@auth_bp.route("/refresh", methods=["POST"])
@jwt_required(refresh=True)
def refresh():
    """Get a new access token using refresh token."""
    identity = get_jwt_identity()
    user = db.session.get(User, int(identity))
    access_token = create_access_token(
        identity=identity,
        additional_claims={"role": user.role, "username": user.username}
    )
    return jsonify(access_token=access_token)


@auth_bp.route("/me", methods=["GET"])
@jwt_required()
def me():
    """Get current user profile."""
    user = db.session.get(User, int(get_jwt_identity()))
    return jsonify(user=user.to_dict())


# ── Posts Routes (CRUD) ──────────────────────
@posts_bp.route("", methods=["GET"])
@cache.cached(timeout=30, query_string=True)
def list_posts():
    """List posts with pagination and optional search."""
    page = request.args.get("page", 1, type=int)
    per_page = request.args.get("per_page", 10, type=int)
    search = request.args.get("q", "")

    query = Post.query.filter_by(published=True)
    if search:
        query = query.filter(Post.title.ilike(f"%{search}%"))

    pagination = query.order_by(Post.created_at.desc()).paginate(
        page=page, per_page=min(per_page, 100), error_out=False
    )

    return jsonify(
        posts=[p.to_dict() for p in pagination.items],
        meta={
            "page": pagination.page,
            "per_page": pagination.per_page,
            "total": pagination.total,
            "pages": pagination.pages,
            "has_next": pagination.has_next,
            "has_prev": pagination.has_prev,
        },
    )


@posts_bp.route("/<int:post_id>", methods=["GET"])
def get_post(post_id):
    """Get a single post by ID."""
    post = db.session.get(Post, post_id)
    if not post:
        abort(404, description="Post not found")
    return jsonify(post=post.to_dict())


@posts_bp.route("", methods=["POST"])
@jwt_required()
def create_post():
    """Create a new post (authenticated)."""
    schema = PostCreateSchema()
    try:
        data = schema.load(request.get_json())
    except ValidationError as err:
        return jsonify(errors=err.messages), 422

    post = Post(**data, user_id=int(get_jwt_identity()))
    db.session.add(post)
    db.session.commit()
    cache.clear()  # invalidate list cache

    return jsonify(post=post.to_dict()), 201


@posts_bp.route("/<int:post_id>", methods=["PUT", "PATCH"])
@jwt_required()
def update_post(post_id):
    """Update own post."""
    post = db.session.get(Post, post_id)
    if not post:
        abort(404, description="Post not found")
    if post.user_id != int(get_jwt_identity()):
        abort(403, description="Not your post")

    schema = PostUpdateSchema()
    try:
        data = schema.load(request.get_json())
    except ValidationError as err:
        return jsonify(errors=err.messages), 422

    for key, value in data.items():
        setattr(post, key, value)
    db.session.commit()
    cache.clear()

    return jsonify(post=post.to_dict())


@posts_bp.route("/<int:post_id>", methods=["DELETE"])
@jwt_required()
def delete_post(post_id):
    """Delete own post."""
    post = db.session.get(Post, post_id)
    if not post:
        abort(404, description="Post not found")
    if post.user_id != int(get_jwt_identity()):
        abort(403, description="Not your post")

    db.session.delete(post)
    db.session.commit()
    cache.clear()

    return jsonify(msg="Post deleted"), 200


# ── Admin Routes ─────────────────────────────
@admin_bp.route("/users", methods=["GET"])
@admin_required
def list_users():
    """Admin: list all users."""
    users = User.query.all()
    return jsonify(users=[u.to_dict() for u in users])


@admin_bp.route("/users/<int:user_id>", methods=["DELETE"])
@admin_required
def delete_user(user_id):
    """Admin: delete a user."""
    user = db.session.get(User, user_id)
    if not user:
        abort(404, description="User not found")
    db.session.delete(user)
    db.session.commit()
    return jsonify(msg="User deleted")


# ──────────────────────────────────────────────
# Application Factory
# ──────────────────────────────────────────────
def create_app(config_name="development"):
    """Application factory pattern — the recommended way to create Flask apps."""
    app = Flask(__name__)

    # ── Configuration ──
    app.config.update(
        SECRET_KEY=os.environ.get("SECRET_KEY", "dev-secret-key-change-me"),
        SQLALCHEMY_DATABASE_URI=os.environ.get("DATABASE_URL", "sqlite:///app.db"),
        SQLALCHEMY_TRACK_MODIFICATIONS=False,
        JWT_SECRET_KEY=os.environ.get("JWT_SECRET", "jwt-secret-change-me"),
        JWT_ACCESS_TOKEN_EXPIRES=3600,       # 1 hour
        JWT_REFRESH_TOKEN_EXPIRES=2592000,   # 30 days
        CACHE_TYPE="SimpleCache",
        CACHE_DEFAULT_TIMEOUT=300,
    )

    if config_name == "testing":
        app.config["TESTING"] = True
        app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///:memory:"

    # ── Initialize Extensions ──
    db.init_app(app)
    jwt.init_app(app)
    cache.init_app(app)
    CORS(app)

    # ── Register Blueprints ──
    app.register_blueprint(auth_bp)
    app.register_blueprint(posts_bp)
    app.register_blueprint(admin_bp)

    # ── Before/After Request Hooks (Middleware) ──
    @app.before_request
    def before_request_hook():
        """Runs before every request — good for logging, timing."""
        g.start_time = datetime.now(timezone.utc)

    @app.after_request
    def after_request_hook(response):
        """Runs after every request — add headers, log duration."""
        if hasattr(g, "start_time"):
            duration = (datetime.now(timezone.utc) - g.start_time).total_seconds()
            response.headers["X-Response-Time"] = f"{duration:.4f}s"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        return response

    # ── Error Handlers ──
    @app.errorhandler(400)
    def bad_request(e):
        return jsonify(error="Bad Request", message=str(e.description)), 400

    @app.errorhandler(404)
    def not_found(e):
        return jsonify(error="Not Found", message=str(e.description)), 404

    @app.errorhandler(403)
    def forbidden(e):
        return jsonify(error="Forbidden", message=str(e.description)), 403

    @app.errorhandler(422)
    def unprocessable(e):
        return jsonify(error="Unprocessable Entity", message=str(e.description)), 422

    @app.errorhandler(500)
    def internal_error(e):
        db.session.rollback()
        return jsonify(error="Internal Server Error"), 500

    # ── JWT Error Handlers ──
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify(msg="Token has expired"), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify(msg="Invalid token"), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify(msg="Authorization required"), 401

    # ── Health Check ──
    @app.route("/health")
    def health_check():
        return jsonify(status="healthy", timestamp=datetime.now(timezone.utc).isoformat())

    # ── Root ──
    @app.route("/")
    def index():
        return jsonify(
            message="Flask Interview Demo API",
            version="1.0.0",
            endpoints={
                "auth": "/api/auth  (register, login, refresh, me)",
                "posts": "/api/posts (CRUD, paginated, cached)",
                "admin": "/api/admin (user management)",
                "health": "/health",
            },
        )

    # ── Create tables on first run ──
    with app.app_context():
        db.create_all()

    return app


# ──────────────────────────────────────────────
# Entry Point
# ──────────────────────────────────────────────
app = create_app()

if __name__ == "__main__":
    app.run(debug=True, port=5000)
