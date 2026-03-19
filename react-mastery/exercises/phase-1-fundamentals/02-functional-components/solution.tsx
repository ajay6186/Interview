import React from "react";

// ============================================================
// Exercise 2: Functional Components (SOLUTION)
// ============================================================

const users = [
  { name: "Alice Johnson", age: 30, email: "alice@example.com", bio: "Full-stack developer" },
  { name: "Bob Smith", age: 25, email: "bob@example.com" },
  { name: "Carol Williams", age: 35, email: "carol@example.com", bio: "DevOps engineer" },
];

// SOLUTION 1: Basic Greeting component with destructured props
function Greeting({ name }: { name: string }) {
  return <h2>Hello, {name}! Welcome to React.</h2>;
}

// SOLUTION 2: UserCard with typed props, optional props, and defaults
type UserCardProps = {
  name: string;
  age: number;
  email: string;
  bio?: string;
  avatarUrl?: string;
};

function UserCard({
  name,
  age,
  email,
  bio,
  avatarUrl = "https://via.placeholder.com/80",
}: UserCardProps) {
  return (
    <div
      style={{
        border: "1px solid #ccc",
        borderRadius: 8,
        padding: 16,
        margin: 8,
        maxWidth: 250,
      }}
    >
      <img
        src={avatarUrl}
        alt={name}
        style={{ borderRadius: "50%", width: 80, height: 80 }}
      />
      <h3>{name}</h3>
      <p>Age: {age}</p>
      <p>Email: {email}</p>
      {bio && (
        <p>
          <em>{bio}</em>
        </p>
      )}
    </div>
  );
}

// SOLUTION 3: Header component
function Header({ title }: { title: string }) {
  return (
    <header style={{ background: "#282c34", color: "white", padding: 16 }}>
      <h1>{title}</h1>
    </header>
  );
}

// SOLUTION 4: Footer with default prop values
function Footer({
  year = new Date().getFullYear(),
  companyName = "React Mastery",
}: {
  year?: number;
  companyName?: string;
}) {
  return (
    <footer style={{ background: "#eee", padding: 12, textAlign: "center" as const }}>
      <p>
        &copy; {year} {companyName}
      </p>
    </footer>
  );
}

// SOLUTION 5: Layout with component composition and children
function Layout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" as const }}>
      <Header title={title} />
      <main style={{ flex: 1, padding: 20 }}>{children}</main>
      <Footer />
    </div>
  );
}

// SOLUTION 6: UserList mapping over data and spreading props
function UserList() {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" as const }}>
      {users.map((user) => (
        <UserCard key={user.email} {...user} />
      ))}
    </div>
  );
}

// SOLUTION 7: Full composition
export function App() {
  return (
    <Layout title="Functional Components Demo">
      <Greeting name="Developer" />
      <UserList />
    </Layout>
  );
}
