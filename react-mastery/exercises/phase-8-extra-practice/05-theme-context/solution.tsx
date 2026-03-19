import React, { createContext, useContext, useState } from "react";

// =============================================================
// SOLUTION 5: Theme Switcher (useContext)
// =============================================================

const THEME = {
  light: {
    bg: "#ffffff",
    cardBg: "#f9fafb",
    text: "#111827",
    border: "#e5e7eb",
    navBg: "#4f46e5",
    navText: "#ffffff",
  },
  dark: {
    bg: "#111827",
    cardBg: "#1f2937",
    text: "#f9fafb",
    border: "#374151",
    navBg: "#1e1b4b",
    navText: "#e0e7ff",
  },
};

// TODO 1 ✅ — Define context type and create context
type ThemeContextType = {
  theme: "light" | "dark";
  toggleTheme: () => void;
};

// The default value is only used when a component is rendered OUTSIDE the Provider
// In practice, this almost never happens if you use the Provider at the root
const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

// TODO 2 ✅ — ThemeProvider wraps children with the context value
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  const toggleTheme = () =>
    setTheme((prev) => (prev === "light" ? "dark" : "light"));

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

// TODO 3 ✅ — Custom hook for convenience (avoids repeating useContext(ThemeContext))
function useTheme() {
  return useContext(ThemeContext);
}

// TODO 4 ✅ — Header: reads theme + has toggle button
function Header() {
  const { theme, toggleTheme } = useTheme();
  const colors = THEME[theme];

  return (
    <nav
      style={{
        background: colors.navBg,
        color: colors.navText,
        padding: "14px 24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <span style={{ fontSize: 20, fontWeight: "bold" }}>My App</span>
      <button
        onClick={toggleTheme}
        style={{
          background: "rgba(255,255,255,0.2)",
          color: colors.navText,
          border: "1px solid rgba(255,255,255,0.3)",
          borderRadius: 6,
          padding: "6px 14px",
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        Switch to {theme === "light" ? "Dark" : "Light"} Mode
      </button>
    </nav>
  );
}

// TODO 5 ✅ — MainContent: reads theme
function MainContent() {
  const { theme } = useTheme();
  const colors = THEME[theme];

  return (
    <main style={{ padding: "32px 24px" }}>
      <div
        style={{
          background: colors.cardBg,
          border: `1px solid ${colors.border}`,
          borderRadius: 12,
          padding: "24px 28px",
          maxWidth: 560,
          margin: "0 auto",
        }}
      >
        <h2 style={{ color: colors.text, margin: "0 0 12px" }}>
          Welcome to the Theme Demo
        </h2>
        <p style={{ color: colors.text, lineHeight: 1.6, margin: 0 }}>
          This page uses React Context to share the current theme across all
          components. No prop drilling needed — any component can read or change
          the theme by calling <code>useTheme()</code>.
        </p>
        <p style={{ color: colors.text, lineHeight: 1.6, marginTop: 12 }}>
          Current theme: <strong>{theme}</strong>
        </p>
      </div>
    </main>
  );
}

// TODO 5 ✅ — Footer: reads theme
function Footer() {
  const { theme } = useTheme();
  const colors = THEME[theme];

  return (
    <footer
      style={{
        borderTop: `1px solid ${colors.border}`,
        padding: "16px 24px",
        textAlign: "center",
        color: colors.text,
        fontSize: 13,
        opacity: 0.7,
      }}
    >
      © 2026 React Mastery — {theme} mode active
    </footer>
  );
}

function Page() {
  const { theme } = useTheme();
  const colors = THEME[theme];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: colors.bg,
        fontFamily: "sans-serif",
        display: "flex",
        flexDirection: "column",
        transition: "background 0.3s, color 0.3s",
      }}
    >
      <Header />
      <div style={{ flex: 1 }}>
        <MainContent />
      </div>
      <Footer />
    </div>
  );
}

export function App() {
  return (
    // ThemeProvider wraps the entire app — all children can access the context
    <ThemeProvider>
      <Page />
    </ThemeProvider>
  );
}

// --- KEY CONCEPTS ---
// 1. createContext(defaultValue)  — creates the context object
//    - defaultValue is used only when there is NO matching Provider above
//
// 2. <Context.Provider value={...}>  — makes value available to all descendants
//    - Re-renders all consumers whenever the value changes
//
// 3. useContext(Context)  — subscribes a component to context updates
//    - Component re-renders when the context value changes
//
// 4. Custom useTheme() hook  — wraps useContext for cleaner usage
//    - Prevents forgetting to import the context object everywhere
//
// 5. Avoid prop drilling:
//    BAD:  App → Page(theme) → Header(theme) → Button(theme)
//    GOOD: App (provides context) → Header calls useTheme() directly
