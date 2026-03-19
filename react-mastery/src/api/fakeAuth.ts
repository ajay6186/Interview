// ============================================================
// Fake Authentication API
// Simulates a real backend with a 1-second network delay.
// Valid credentials:
//   admin / password123
//   alice / alice123
//   bob   / bob123
// ============================================================

export type User = {
  id: number;
  username: string;
  email: string;
  token: string;
};

const FAKE_USERS = [
  { id: 1, username: "admin", password: "password123", email: "admin@example.com" },
  { id: 2, username: "alice", password: "alice123",    email: "alice@example.com"  },
  { id: 3, username: "bob",   password: "bob123",      email: "bob@example.com"   },
];

export function fakeLogin(username: string, password: string): Promise<User> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const match = FAKE_USERS.find(
        (u) => u.username === username && u.password === password
      );
      if (match) {
        resolve({
          id: match.id,
          username: match.username,
          email: match.email,
          token: `fake-jwt-${match.id}-${Date.now()}`,
        });
      } else {
        reject(new Error("Invalid username or password"));
      }
    }, 1000);
  });
}

export function fakeLogout(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 300));
}
