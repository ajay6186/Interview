import React, { createContext, useContext, useState, type ReactNode } from "react";

// ============================================================
// Exercise: useContext — Theme System
// ============================================================
// Build a complete theme system using React Context. You will
// create a context, a provider, a custom hook, and consumer
// components that visually react to theme changes.
//
// Instructions:
// 1. Define theme types and create a ThemeContext.
// 2. Build a ThemeProvider that holds theme state.
// 3. Build a useTheme custom hook to consume the context.
// 4. Build a ThemedCard that styles itself based on theme.
// 5. Build a ThemeToggle button to switch themes.
// 6. Wire everything together in App.
// ============================================================

// TODO 1: Define theme types and create context
// - Define a Theme type that is "light" | "dark"
// - Define a ThemeContextType with:
//     theme: Theme
//     toggleTheme: () => void
//     colors: { background: string; text: string; card: string; border: string }
// - Create ThemeContext using createContext<ThemeContextType | null>(null)

// type Theme = ...
// interface ThemeContextType { ... }
// const ThemeContext = ...

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

// TODO 2: Define theme color maps
// - Create a THEMES object mapping "light" and "dark" to their color sets:
//   light: { background: "#ffffff", text: "#1a1a1a", card: "#f5f5f5", border: "#ddd" }
//   dark:  { background: "#1a1a1a", text: "#f5f5f5", card: "#2d2d2d", border: "#555" }

// const THEMES = ...

// TODO 3: ThemeProvider component
// - Accept { children: ReactNode } as props
// - Maintain theme state initialized to "light"
// - Create a toggleTheme function that flips between "light" and "dark"
// - Look up colors from THEMES based on current theme
// - Provide { theme, toggleTheme, colors } through ThemeContext.Provider
// - Wrap children with a <div> that applies background and text color from the theme

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

const ThemeContext = createContext<ThemeContextType | null>(null);

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

// TODO 4: useTheme custom hook
// - Call useContext(ThemeContext)
// - If the context is null (used outside of a provider), throw an Error:
//   "useTheme must be used within a ThemeProvider"
// - Return the context value

// function useTheme(): ThemeContextType { ... }

function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === null) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

// TODO 5: ThemedCard component
// - Use the useTheme hook to access colors and theme
// - Render a styled <div> with:
//     backgroundColor: colors.card
//     border: `1px solid ${colors.border}`
//     color: colors.text
//     padding, borderRadius, marginBottom
// - Accept { title: string; children: ReactNode } as props
// - Render the title in an <h3> and children below it


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

// TODO 6: ThemeToggle component
// - Use the useTheme hook to get theme and toggleTheme
// - Render a button that calls toggleTheme on click
// - Button text: "Switch to Dark" when light, "Switch to Light" when dark
// - Style the button to look good in both themes (use colors from context)


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


// TODO 7: ThemeInfo component
// - Use useTheme to display the current theme name and all color values
// - This demonstrates a deeply nested component consuming context
//   without prop drilling

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

// const ThemeCtx = createContext<{theme: string; toggle: () => void}>({theme:"light", toggle: () => {}})
// const UserCtx = createContext<{name: string; role: string}>({name: "Guest", role: "user"})
// const CountCtx = createContext<{count: number; inc: () => void; dec: () => void}>({count: 0, inc: () => {}, dec: () => {}})
const LongCtx = createContext<{lang: string; setLang: (l: string) => void}>({lang:"EN", setLang: () => {}})
const CartCtx = createContext<{items: string[]; add:(i: string) => void; remove:(i: string) => void}>({items: [], add: () => {}, remove: () => {}})
const NotifCtx = createContext<{notify: (msg: string) => void}>({ notify: () => {}})
const AuthCtx = createContext<{user: string | null; login: (u: string) => void; logout: () => void}>({user: null, login: () => {}, logout: () => {}})
const ModalCtx = createContext<{ open: (content: string) => void; close: ()=> void}>({open: () => {}, close: () => {}})
const SidebarCtx = createContext<{ collapsed: boolean; toggle: () => void}>({collapsed: false, toggle: () => {}})

// -------------------------
//  BASIC (1-12)
// -------------------------
// 01 -- Simple value
const GreetCtx = createContext("Hello");

function GreetConsumer() {
  const msg = useContext(GreetCtx);
  return <p>{msg}</p>
}

function Ex01_SimpleValue() {
  return <GreetCtx.Provider value = "Hello, World! akfsdhfidfh">
              <GreetConsumer/>
         </GreetCtx.Provider>
}

// 02 — Default value (no provider)
const DefualtCtx = createContext("I am the default")
function Ex02_Defualtvalue() {
  const val = useContext(DefualtCtx);
  return <p>No Provider -- {val}</p>
}

// 03 — Theme toggle
const ThemeCtx = createContext<{theme: string; toggle: () => void}>({theme: "light",  toggle: () => {}})

function ThemeProvider03({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState("light");
  return <ThemeCtx.Provider value={{ theme, toggle: () => setTheme((t) => t === "light" ? "dark" : "light") }}>{children}</ThemeCtx.Provider>;
}

function ThemeConsumer03() {
  const { theme, toggle } = useContext(ThemeCtx);
  return <div style={{ background: theme === "dark" ? "#222" : "#eee", color: theme === "dark" ? "#fff" : "#000", padding: 12 }}>Theme: {theme} <button onClick={toggle}>Toggle</button></div>;
}


function Ex03_ThemeContext() {
  return <ThemeProvider03>
    <ThemeConsumer03/>
  </ThemeProvider03>
}

// 04 — User context
const UserCtx = createContext<{ name: string; role: string}>({ name: "Guest", role: "user"});


function Ex04_UserContext() {
  return <UserCtx.Provider value={{name:"Ajay", role:"admin"}}>
      <UserInfo/>
  </UserCtx.Provider>
}

function UserInfo() {
  const {name, role} = useContext(UserCtx);
  return (
    <p>Welcome, {name} ({role})</p>
  )
}

// 05 — Counter context
const CountCtx = createContext<{count: number; inc: ()=> void; dec: ()=> void}>(
  {
    count : 0,
    inc : () => {},
    dec : () => {}
  }
)



function CountProvider05({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  return <CountCtx.Provider value={{ count, inc: () => setCount((c) => c + 1), dec: () => setCount((c) => c - 1) }}>{children}</CountCtx.Provider>;
}

function CountDisplay05() {
  const {count} = useContext(CountCtx);
  return <p>Count: {count}</p>
}

function CountButton05() {
  const {inc, dec} = useContext(CountCtx);
  return <div><button onClick={inc}>+</button><button onClick={dec}>–</button></div>;
}

function Ex05_CounterContext() {
  return <CountProvider05>
            <CountDisplay05/>
            <CountButton05 />
        </CountProvider05>
}

// 06 — Language context

const LangCtx = createContext<{lang: string, setLang: (l: string) => void}>({lang: "EN", setLang: () => {}})

function LangProvider06({children}: {children: ReactNode}){
  const [lang, setLang] = useState("EN");
  return <LangCtx.Provider value={{lang, setLang}}>{children}</LangCtx.Provider>
}

function LangSwitcher06() { const { setLang } = useContext(LangCtx); return <div>{["EN", "AR", "FR"].map((l) => <button key={l} onClick={() => setLang(l)}>{l}</button>)}</div>; }

function LangDisplay06() { const { lang } = useContext(LangCtx); return <p>Language: {lang}</p>; }

function Ex06_LanguageContext() {
  return <LangProvider06><LangSwitcher06 /><LangDisplay06 /></LangProvider06>;
}

export function App(){
  return(
  // <Ex01_SimpleValue/>
  // <Ex02_Defualtvalue/>
  // <Ex03_ThemeContext/>
  // <Ex04_UserContext/>
  // <Ex05_CounterContext/>
  )
}



// export function App() {
//   return (
//     <ThemeProvider>
//       <div style={{ maxWidth: 600, margin: "0 auto" }}>
//         <h1>Exercise: useContext — Theme System</h1>
//         <ThemeToggle />
//         <ThemedCard title="Welcome">
//           <p>
//             This card automatically adapts its background, text color, and border
//             based on the current theme. Try clicking the toggle button above!
//           </p>
//         </ThemedCard>
//         <ThemedCard title="Theme Info">
//           <ThemeInfo />
//         </ThemedCard>
//         <ThemedCard title="About Context">
//           <p>
//             React Context lets you pass data through the component tree without
//             manually threading props at every level. Combined with a custom hook,
//             it provides a clean API for consuming shared state like themes,
//             authentication, or locale settings.
//           </p>
//         </ThemedCard>
//       </div>
//     </ThemeProvider>
//   );
// }
