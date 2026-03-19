import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  NavLink,
  useParams,
  useNavigate,
  useSearchParams,
  Navigate,
  Outlet,
} from "react-router-dom";

// ============================================================
// Solution: React Router v6
// ============================================================

const products = [
  { id: 1, name: "React Mastery Course", price: 49 },
  { id: 2, name: "TypeScript Handbook", price: 29 },
  { id: 3, name: "Node.js Bootcamp", price: 39 },
];

// Simple module-level auth flag for demo purposes
// In a real app, use AuthContext
let isAuthenticated = false;

// 1. RootLayout — provides nav + Outlet
function RootLayout() {
  const navStyle: React.CSSProperties = {
    display: "flex",
    gap: 16,
    padding: "12px 20px",
    backgroundColor: "#f3f4f6",
    borderBottom: "1px solid #d1d5db",
    marginBottom: 20,
  };

  const activeStyle = ({ isActive }: { isActive: boolean }) => ({
    fontWeight: isActive ? "bold" : "normal",
    color: isActive ? "#2563eb" : "#374151",
    textDecoration: "none",
  });

  return (
    <div>
      <nav style={navStyle}>
        <NavLink to="/" end style={activeStyle}>Home</NavLink>
        <NavLink to="/about" style={activeStyle}>About</NavLink>
        <NavLink to="/products" style={activeStyle}>Products</NavLink>
        <NavLink to="/search" style={activeStyle}>Search</NavLink>
        <NavLink to="/dashboard" style={activeStyle}>Dashboard</NavLink>
      </nav>
      <main style={{ maxWidth: 700, margin: "0 auto", padding: "0 20px" }}>
        <Outlet />
      </main>
    </div>
  );
}

// 2. HomePage
function HomePage() {
  return (
    <>
      <h1>Home</h1>
      <p>Welcome to React Router v6 Mastery! Use the nav links above to explore routes.</p>
    </>
  );
}

// 3. AboutPage
function AboutPage() {
  return (
    <>
      <h1>About</h1>
      <p>This app demonstrates React Router v6 features: nested routes, dynamic segments, search params, and protected routes.</p>
    </>
  );
}

// 4. ProductsPage — list of products as links
function ProductsPage() {
  return (
    <>
      <h1>Products</h1>
      <ul>
        {products.map((p) => (
          <li key={p.id} style={{ marginBottom: 8 }}>
            <Link to={`/products/${p.id}`}>{p.name}</Link>
          </li>
        ))}
      </ul>
    </>
  );
}

// 5. ProductDetailPage — reads :id from URL
function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const product = products.find((p) => p.id === Number(id));

  if (!product) {
    return (
      <>
        <h1>Product Not Found</h1>
        <Link to="/products">← Back to Products</Link>
      </>
    );
  }

  return (
    <>
      <h1>{product.name}</h1>
      <p>Price: ${product.price}</p>
      <Link to="/products">← Back to Products</Link>
    </>
  );
}

// 6. SearchPage — uses useSearchParams
function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get("q") ?? "";

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <h1>Search</h1>
      <input
        type="text"
        placeholder="Search products..."
        value={query}
        onChange={(e) => {
          if (e.target.value) {
            setSearchParams({ q: e.target.value });
          } else {
            setSearchParams({});
          }
        }}
        style={{ padding: "8px 12px", width: "100%", marginBottom: 16, boxSizing: "border-box" }}
      />
      {query && (
        <p style={{ color: "#6b7280" }}>
          {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{query}"
        </p>
      )}
      <ul>
        {filtered.map((p) => (
          <li key={p.id}>
            <Link to={`/products/${p.id}`}>{p.name}</Link> — ${p.price}
          </li>
        ))}
      </ul>
    </>
  );
}

// 7. ProtectedRoute — renders Outlet if authenticated, else redirects
function ProtectedRoute() {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

// 8. DashboardPage — only visible when authenticated
function DashboardPage() {
  const navigate = useNavigate();

  function handleLogout() {
    isAuthenticated = false;
    navigate("/");
  }

  return (
    <>
      <h1>Dashboard</h1>
      <p>Welcome, authenticated user! This page is protected.</p>
      <button onClick={handleLogout} style={{ padding: "8px 16px" }}>
        Logout
      </button>
    </>
  );
}

// 9. LoginPage — sets auth flag and navigates to dashboard
function LoginPage() {
  const navigate = useNavigate();

  function handleLogin() {
    isAuthenticated = true;
    navigate("/dashboard");
  }

  return (
    <>
      <h1>Login</h1>
      <p>Click Login to authenticate and access the protected Dashboard.</p>
      <button onClick={handleLogin} style={{ padding: "8px 16px" }}>
        Login
      </button>
    </>
  );
}

// 10. NotFoundPage
function NotFoundPage() {
  return (
    <>
      <h1>404 - Page Not Found</h1>
      <p>The page you're looking for doesn't exist.</p>
      <Link to="/">← Go Home</Link>
    </>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<HomePage />} />
          <Route path="about" element={<AboutPage />} />
          <Route path="products" element={<ProductsPage />} />
          <Route path="products/:id" element={<ProductDetailPage />} />
          <Route path="search" element={<SearchPage />} />
          <Route path="login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="dashboard" element={<DashboardPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
