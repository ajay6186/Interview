import React from "react";

// ============================================================
// Exercise 2: Functional Components
// ============================================================
// In this exercise you will learn about creating functional
// components, typing props, component composition, default
// props, optional props, and destructuring.
//
// Instructions:
// 1. Create a basic Greeting component
// 2. Create a UserCard component with typed props
// 3. Build a Layout using component composition
// 4. Handle default and optional props
// 5. Practice destructuring props in function signatures
// ============================================================

// --- Data for the exercise ---
const users = [
  { name: "Alice Johnson", age: 30, email: "alice@example.com", bio: "Full-stack developer" },
  { name: "Bob Smith", age: 25, email: "bob@example.com" },
  { name: "Carol Williams", age: 35, email: "carol@example.com", bio: "DevOps engineer" },
];

// TODO 1: Create a Greeting component.
// It should accept a single prop "name" (string) and render:
//   <h2>Hello, {name}! Welcome to React.</h2>
// Use an inline type annotation for the props: { name: string }
// Destructure the prop in the function parameter.
// function Greeting({ name }: { name: string }) { ... }

// TODO 2: Define a type UserCardProps with:
//   name: string
//   age: number
//   email: string
//   bio?: string         (optional)
//   avatarUrl?: string   (optional)
// Then create a UserCard component that:
//   - Destructures all props in the function signature
//   - Provides a default value for avatarUrl: "https://via.placeholder.com/80"
//   - Renders a <div> styled as a card (border, padding, margin) containing:
//       <img> with src={avatarUrl} and alt={name}
//       <h3>{name}</h3>
//       <p>Age: {age}</p>
//       <p>Email: {email}</p>
//       If bio exists, render <p><em>{bio}</em></p>, otherwise render nothing
//
// type UserCardProps = { ... };
// function UserCard({ name, age, email, bio, avatarUrl = "..." }: UserCardProps) { ... }

// TODO 3: Create a Header component that renders:
//   <header style={{ background: "#282c34", color: "white", padding: 16 }}>
//     <h1>{title}</h1>
//   </header>
// Props: { title: string }
// function Header({ title }: { title: string }) { ... }

// TODO 4: Create a Footer component that renders:
//   <footer style={{ background: "#eee", padding: 12, textAlign: "center" as const }}>
//     <p>&copy; {year} {companyName}</p>
//   </footer>
// Props: { year?: number; companyName?: string }
// Use default values: year = current year (new Date().getFullYear()), companyName = "React Mastery"
// function Footer({ year = ..., companyName = ... }: { ... }) { ... }

// TODO 5: Create a Layout component that uses component composition.
// It should accept props: { title: string; children: React.ReactNode }
// It should render:
//   <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" as const }}>
//     <Header title={title} />
//     <main style={{ flex: 1, padding: 20 }}>{children}</main>
//     <Footer />
//   </div>
// function Layout({ title, children }: { title: string; children: React.ReactNode }) { ... }

// TODO 6: Create a UserList component that maps over the users array
// and renders a UserCard for each user. Spread the user object into UserCard props.
// Wrap it in a <div> with display: "flex", gap: 16, flexWrap: "wrap".
// function UserList() { ... }

export function App() {
  return (
    <div>
      <h1>Exercise 2: Functional Components</h1>
      {/* TODO 7: Compose everything together:
          Render a <Layout> with title="Functional Components Demo"
          Inside the Layout, render:
            - <Greeting name="Developer" />
            - <UserList />
      */}
      <p style={{ color: "gray" }}>Complete the TODOs to see the results here.</p>
    </div>
  );
}
