import React, { createContext, useContext, useState, type ReactNode } from "react";

// ============================================================
// Solution: useContext — Theme System
// ============================================================

type Theme = "light" | "dark";

interface ThemeColors {
  background: string;
  text: string;
  card: string;
  border: string;
}

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  colors: ThemeColors;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

const THEMES: Record<Theme, ThemeColors> = {
  light: {
    background: "#ffffff",
    text: "#1a1a1a",
    card: "#f5f5f5",
    border: "#ddd",
  },
  dark: {
    background: "#1a1a1a",
    text: "#f5f5f5",
    card: "#2d2d2d",
    border: "#555",
  },
};

function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  const colors = THEMES[theme];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, colors }}>
      <div
        style={{
          background: colors.background,
          color: colors.text,
          minHeight: "100vh",
          padding: 20,
          transition: "background 0.3s, color 0.3s",
        }}
      >
        {children}
      </div>
    </ThemeContext.Provider>
  );
}

function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

function ThemedCard({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useTheme();

  return (
    <div
      style={{
        backgroundColor: colors.card,
        border: `1px solid ${colors.border}`,
        color: colors.text,
        padding: 20,
        borderRadius: 8,
        marginBottom: 16,
        transition: "all 0.3s",
      }}
    >
      <h3 style={{ marginTop: 0 }}>{title}</h3>
      {children}
    </div>
  );
}

function ThemeToggle() {
  const { theme, toggleTheme, colors } = useTheme();

  return (
    <div style={{ marginBottom: 16 }}>
      <button
        onClick={toggleTheme}
        style={{
          padding: "10px 20px",
          fontSize: 16,
          cursor: "pointer",
          backgroundColor: colors.card,
          color: colors.text,
          border: `2px solid ${colors.border}`,
          borderRadius: 6,
          transition: "all 0.3s",
        }}
      >
        {theme === "light" ? "Switch to Dark" : "Switch to Light"}
      </button>
    </div>
  );
}

function ThemeInfo() {
  const { theme, colors } = useTheme();

  return (
    <div>
      <p>
        Current theme: <strong>{theme}</strong>
      </p>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        <thead>
          <tr>
            <th style={{ textAlign: "left", padding: 4 }}>Property</th>
            <th style={{ textAlign: "left", padding: 4 }}>Value</th>
            <th style={{ textAlign: "left", padding: 4 }}>Preview</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(colors).map(([key, value]) => (
            <tr key={key}>
              <td style={{ padding: 4 }}>{key}</td>
              <td style={{ padding: 4, fontFamily: "monospace" }}>{value}</td>
              <td style={{ padding: 4 }}>
                <div
                  style={{
                    width: 30,
                    height: 20,
                    backgroundColor: value,
                    border: "1px solid #999",
                    borderRadius: 3,
                  }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 13, color: "#888", marginTop: 8 }}>
        This component is deeply nested but accesses the theme directly via
        useContext — no prop drilling needed.
      </p>
    </div>
  );
}

export function App() {
  return (
    <ThemeProvider>
      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <h1>Exercise: useContext — Theme System</h1>
        <ThemeToggle />
        <ThemedCard title="Welcome">
          <p>
            This card automatically adapts its background, text color, and border
            based on the current theme. Try clicking the toggle button above!
          </p>
        </ThemedCard>
        <ThemedCard title="Theme Info">
          <ThemeInfo />
        </ThemedCard>
        <ThemedCard title="About Context">
          <p>
            React Context lets you pass data through the component tree without
            manually threading props at every level. Combined with a custom hook,
            it provides a clean API for consuming shared state like themes,
            authentication, or locale settings.
          </p>
        </ThemedCard>
      </div>
    </ThemeProvider>
  );
}
