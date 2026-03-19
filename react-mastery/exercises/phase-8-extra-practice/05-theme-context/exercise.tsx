import React, { createContext, useContext, useState } from "react";

// =============================================================
// EXERCISE 5: Theme Switcher (useContext)
// =============================================================
// WHAT YOU WILL PRACTICE:
//   - createContext to create a context object
//   - Context Provider to share state down the tree
//   - useContext to consume context anywhere in the tree
//   - Lifting state up vs passing through context
//
// GOAL: Build a dark/light theme toggle that:
//   1. Stores theme ("light" | "dark") in a Context
//   2. Has a toggle button accessible from any component
//   3. Applies the theme styles to the entire page
//   4. Any component can read AND toggle the theme via context
//      WITHOUT prop drilling
//
// COMPONENT TREE:
//   App (provides context)
//     └── Page
//           ├── Header    ← reads theme, has toggle button
//           ├── MainContent ← reads theme, shows a card
//           └── Footer    ← reads theme
//
// RULE: Do NOT pass theme or toggleTheme as props.
//       All components must get them from useContext.
// =============================================================

// =============================================================
// TODO 1: Define the context type and create the context
//   type ThemeContextType = {
//     theme: "light" | "dark";
//     toggleTheme: () => void;
//   }
//   const ThemeContext = createContext<ThemeContextType>(...)
//   What should the default value be? (hint: it's rarely used)
// =============================================================

// =============================================================
// TODO 2: Create a ThemeProvider component
//   - Holds theme state (useState, starts as "light")
//   - Provides { theme, toggleTheme } via ThemeContext.Provider
//   - Renders its children inside the provider
// =============================================================

// =============================================================
// TODO 3: Create a useTheme() custom hook
//   - Calls useContext(ThemeContext) and returns the result
//   - This is a convenience wrapper — cleaner than calling
//     useContext(ThemeContext) everywhere
// =============================================================

// =============================================================
// TODO 4: Build the Header component
//   - Uses useTheme() to get theme and toggleTheme
//   - Renders a nav bar with the app title
//   - Has a button: "Switch to Dark" / "Switch to Light"
//   - Apply theme colors (see THEME object below)
// =============================================================

// =============================================================
// TODO 5: Build MainContent and Footer
//   - Both use useTheme() to read the theme
//   - Apply theme background and text colors
//   - MainContent: show a card with some lorem ipsum text
//   - Footer: show copyright text
// =============================================================

// --- Theme colors (use these) ---
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

// TODO 1: context here

// TODO 2: ThemeProvider here

// TODO 3: useTheme hook here

// TODO 4: Header here

// TODO 5: MainContent and Footer here

function Page() {
  return (
    <div style={{ minHeight: "100vh" /* TODO: apply theme bg color */ }}>
      {/* TODO: render Header, MainContent, Footer */}
    </div>
  );
}

export function App() {
  return (
    // TODO: wrap Page in ThemeProvider
    <Page />
  );
}
