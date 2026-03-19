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
// Exercise: React Router v6
// ============================================================
// Learn the core features of React Router v6: Routes, Route,
// Link, NavLink, nested routes, Outlet, dynamic segments,
// programmatic navigation, search params, and protected routes.
//
// Instructions:
// 1. Build a RootLayout with a <nav> and <Outlet>.
// 2. Create a HomePage (path "/") and an AboutPage (path "/about").
// 3. Create a ProductsPage (path "/products") that lists products.
// 4. Create a ProductDetailPage (path "/products/:id") using useParams.
// 5. Create a SearchPage (path "/search") using useSearchParams.
// 6. Create a ProtectedRoute guard that redirects to "/login" if not logged in.
// 7. Create a DashboardPage (path "/dashboard") behind ProtectedRoute.
// 8. Create a LoginPage (path "/login") that sets the auth flag.
// 9. Handle a 404 NotFoundPage (path "*").
// ============================================================

const products = [
  { id: 1, name: "React Mastery Course", price: 49 },
  { id: 2, name: "TypeScript Handbook", price: 29 },
  { id: 3, name: "Node.js Bootcamp", price: 39 },
];

// Shared auth state (in a real app, this would be in Context or Redux)
// For this exercise, use a simple module-level variable toggled by LoginPage.
let isAuthenticated = false;

// TODO 1: Create a RootLayout component
// - Render a <nav> with NavLinks to: Home ("/"), About ("/about"),
//   Products ("/products"), Search ("/search"), Dashboard ("/dashboard")
// - NavLink should apply an "active" style/class when the route is active
//   (use the `className` function prop or `style` function prop)
// - Render <Outlet /> below the nav to display child routes
// function RootLayout() { ... }

// TODO 2: Create a HomePage
// - Render an <h1> "Home" and a brief welcome paragraph
// function HomePage() { ... }

// TODO 3: Create an AboutPage
// - Render an <h1> "About" and a paragraph describing the app
// function AboutPage() { ... }

// TODO 4: Create a ProductsPage
// - Render an <h1> "Products"
// - Render a <ul> of product names as <Link>s pointing to "/products/:id"
// function ProductsPage() { ... }

// TODO 5: Create a ProductDetailPage
// - Use useParams() to get the `id` from the URL
// - Find the product in the products array by id
// - If not found, render a "Product not found" message
// - Otherwise render the product name and price
// - Render a "← Back to Products" link pointing to "/products"
// function ProductDetailPage() { ... }

// TODO 6: Create a SearchPage
// - Use useSearchParams() to read and update the `q` query parameter
// - Render a controlled <input> whose value is the `q` param
// - When the input changes, update the URL search params
// - Filter the products array by name (case-insensitive) based on `q`
// - Render the filtered products as a list
// function SearchPage() { ... }

// TODO 7: Create a ProtectedRoute component
// - If isAuthenticated is true, render <Outlet /> (allow through)
// - Otherwise, redirect to "/login" using <Navigate replace />
// function ProtectedRoute() { ... }

// TODO 8: Create a DashboardPage
// - Render an <h1> "Dashboard"
// - Show a message: "Welcome, authenticated user!"
// - Render a "Logout" button that sets isAuthenticated = false and navigates to "/"
//   using useNavigate()
// function DashboardPage() { ... }

// TODO 9: Create a LoginPage
// - Render an <h1> "Login"
// - Render a "Login" button that sets isAuthenticated = true and navigates to "/dashboard"
//   using useNavigate()
// function LoginPage() { ... }

// TODO 10: Create a NotFoundPage
// - Render an <h1> "404 - Page Not Found"
// - Render a Link back to "/"
// function NotFoundPage() { ... }

export function App() {
  return (
    <BrowserRouter>
      {/* TODO 11: Set up the route tree:
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
      */}
      <div style={{ padding: 20 }}>
        <p style={{ color: "gray" }}>Complete the TODOs above to see routing in action.</p>
      </div>
    </BrowserRouter>
  );
}
