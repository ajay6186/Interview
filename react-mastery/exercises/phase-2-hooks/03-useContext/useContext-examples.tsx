import { useState, useContext, createContext, useReducer, useCallback, useMemo, memo, ReactNode } from "react";

// ─────────────────────────────────────────
// CONTEXTS
// ─────────────────────────────────────────

const ThemeCtx    = createContext<{ theme: string; toggle: () => void }>({ theme: "light", toggle: () => {} });
const UserCtx     = createContext<{ name: string; role: string }>({ name: "Guest", role: "user" });
const CountCtx    = createContext<{ count: number; inc: () => void; dec: () => void }>({ count: 0, inc: () => {}, dec: () => {} });
const LangCtx     = createContext<{ lang: string; setLang: (l: string) => void }>({ lang: "EN", setLang: () => {} });
const CartCtx     = createContext<{ items: string[]; add: (i: string) => void; remove: (i: string) => void }>({ items: [], add: () => {}, remove: () => {} });
const NotifCtx    = createContext<{ notify: (msg: string) => void }>({ notify: () => {} });
const AuthCtx     = createContext<{ user: string | null; login: (u: string) => void; logout: () => void }>({ user: null, login: () => {}, logout: () => {} });
const ModalCtx    = createContext<{ open: (content: string) => void; close: () => void }>({ open: () => {}, close: () => {} });
const SidebarCtx  = createContext<{ collapsed: boolean; toggle: () => void }>({ collapsed: false, toggle: () => {} });

// ─────────────────────────────────────────
// BASIC (1–12)
// ─────────────────────────────────────────

// 01 — Simple value
const GreetCtx = createContext("Hello");
function Ex01_SimpleValue() {
  return <GreetCtx.Provider value="Hello, World!"><GreetConsumer /></GreetCtx.Provider>;
}
function GreetConsumer() { const msg = useContext(GreetCtx); return <p>{msg}</p>; }

// 02 — Default value (no provider)
const DefaultCtx = createContext("I am the default");
function Ex02_DefaultValue() { const val = useContext(DefaultCtx); return <p>No provider → {val}</p>; }

// 03 — Theme toggle
function ThemeProvider03({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState("light");
  return <ThemeCtx.Provider value={{ theme, toggle: () => setTheme((t) => t === "light" ? "dark" : "light") }}>{children}</ThemeCtx.Provider>;
}
function Ex03_ThemeContext() {
  return <ThemeProvider03><ThemeConsumer03 /></ThemeProvider03>;
}
function ThemeConsumer03() {
  const { theme, toggle } = useContext(ThemeCtx);
  return <div style={{ background: theme === "dark" ? "#222" : "#eee", color: theme === "dark" ? "#fff" : "#000", padding: 12 }}>Theme: {theme} <button onClick={toggle}>Toggle</button></div>;
}

// 04 — User context
function Ex04_UserContext() {
  return <UserCtx.Provider value={{ name: "Ajay", role: "admin" }}><UserInfo /></UserCtx.Provider>;
}
function UserInfo() { const { name, role } = useContext(UserCtx); return <p>Welcome, {name} ({role})</p>; }

// 05 — Counter context
function CountProvider05({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  return <CountCtx.Provider value={{ count, inc: () => setCount((c) => c + 1), dec: () => setCount((c) => c - 1) }}>{children}</CountCtx.Provider>;
}
function Ex05_CounterContext() {
  return <CountProvider05><CountDisplay05 /><CountButtons05 /></CountProvider05>;
}
function CountDisplay05() { const { count } = useContext(CountCtx); return <p>Count: {count}</p>; }
function CountButtons05() { const { inc, dec } = useContext(CountCtx); return <div><button onClick={inc}>+</button><button onClick={dec}>–</button></div>; }

// 06 — Language context
function LangProvider06({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState("EN");
  return <LangCtx.Provider value={{ lang, setLang }}>{children}</LangCtx.Provider>;
}
function Ex06_LanguageContext() {
  return <LangProvider06><LangSwitcher06 /><LangDisplay06 /></LangProvider06>;
}
function LangSwitcher06() { const { setLang } = useContext(LangCtx); return <div>{["EN", "AR", "FR"].map((l) => <button key={l} onClick={() => setLang(l)}>{l}</button>)}</div>; }
function LangDisplay06() { const { lang } = useContext(LangCtx); return <p>Language: {lang}</p>; }

// 07 — Boolean flag context
const DebugCtx = createContext(false);
function Ex07_BooleanFlag() {
  return <DebugCtx.Provider value={true}><DebugComponent /></DebugCtx.Provider>;
}
function DebugComponent() { const debug = useContext(DebugCtx); return <p>Debug mode: {debug ? "ON 🛠️" : "OFF"}</p>; }

// 08 — Number context
const FontSizeCtx = createContext(16);
function Ex08_NumberContext() {
  return <FontSizeCtx.Provider value={20}><FontDisplay /></FontSizeCtx.Provider>;
}
function FontDisplay() { const size = useContext(FontSizeCtx); return <p style={{ fontSize: size }}>Font size: {size}px</p>; }

// 09 — Object context (read-only config)
const ConfigCtx = createContext({ apiUrl: "https://api.example.com", timeout: 5000 });
function Ex09_ConfigContext() { const config = useContext(ConfigCtx); return <pre>{JSON.stringify(config, null, 2)}</pre>; }

// 10 — Array context
const TagsCtx = createContext<string[]>([]);
function Ex10_ArrayContext() {
  return <TagsCtx.Provider value={["react", "typescript", "hooks"]}><TagsDisplay /></TagsCtx.Provider>;
}
function TagsDisplay() { const tags = useContext(TagsCtx); return <div>{tags.map((t) => <span key={t} style={{ marginRight: 4 }}>#{t}</span>)}</div>; }

// 11 — Null-check safe context
const SafeCtx = createContext<{ value: string } | null>(null);
function useSafe() {
  const ctx = useContext(SafeCtx);
  if (!ctx) throw new Error("useSafe must be inside SafeProvider");
  return ctx;
}
function Ex11_NullSafeContext() {
  return <SafeCtx.Provider value={{ value: "Safe value" }}><SafeConsumer /></SafeCtx.Provider>;
}
function SafeConsumer() { const { value } = useSafe(); return <p>{value}</p>; }

// 12 — Context with function
const AlertCtx = createContext<(msg: string) => void>(() => {});
function Ex12_FunctionContext() {
  return <AlertCtx.Provider value={(msg) => alert(msg)}><AlertButton /></AlertCtx.Provider>;
}
function AlertButton() { const showAlert = useContext(AlertCtx); return <button onClick={() => showAlert("Hello from context!")}>Alert via context</button>; }

// ─────────────────────────────────────────
// INTERMEDIATE (13–25)
// ─────────────────────────────────────────

// 13 — Context with updater function
function Ex13_ContextWithUpdater() {
  const [name, setName] = useState("Guest");
  return (
    <UserCtx.Provider value={{ name, role: "user" }}>
      <div>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Change name" />
        <UserInfo />
      </div>
    </UserCtx.Provider>
  );
}

// 14 — Multiple providers
function Ex14_MultipleProviders() {
  return (
    <ThemeProvider03>
      <UserCtx.Provider value={{ name: "Sara", role: "admin" }}>
        <MultiConsumer14 />
      </UserCtx.Provider>
    </ThemeProvider03>
  );
}
function MultiConsumer14() {
  const { theme } = useContext(ThemeCtx);
  const { name } = useContext(UserCtx);
  return <p style={{ background: theme === "dark" ? "#333" : "#eee" }}>{name} — {theme} theme</p>;
}

// 15 — Cart context
function CartProvider15({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>([]);
  return <CartCtx.Provider value={{ items, add: (i) => setItems((prev) => [...prev, i]), remove: (i) => setItems((prev) => prev.filter((x) => x !== i)) }}>{children}</CartCtx.Provider>;
}
function Ex15_CartContext() {
  return <CartProvider15><CartUI /></CartProvider15>;
}
function CartUI() {
  const { items, add, remove } = useContext(CartCtx);
  return (
    <div>
      {["Apple", "Banana", "Cherry"].map((f) => <button key={f} onClick={() => add(f)}>Add {f}</button>)}
      <ul>{items.map((item, i) => <li key={i}>{item} <button onClick={() => remove(item)}>✕</button></li>)}</ul>
    </div>
  );
}

// 16 — Notification context
function NotifProvider16({ children }: { children: ReactNode }) {
  const [msg, setMsg] = useState("");
  return (
    <NotifCtx.Provider value={{ notify: (m) => { setMsg(m); setTimeout(() => setMsg(""), 2000); } }}>
      {children}
      {msg && <div style={{ position: "fixed", bottom: 20, right: 20, background: "#333", color: "#fff", padding: 8, borderRadius: 4 }}>{msg}</div>}
    </NotifCtx.Provider>
  );
}
function Ex16_NotificationContext() {
  return <NotifProvider16><NotifButton /></NotifProvider16>;
}
function NotifButton() { const { notify } = useContext(NotifCtx); return <button onClick={() => notify("Hello from notification!")}>Show notification</button>; }

// 17 — Auth context
function AuthProvider17({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<string | null>(null);
  return <AuthCtx.Provider value={{ user, login: (u) => setUser(u), logout: () => setUser(null) }}>{children}</AuthCtx.Provider>;
}
function Ex17_AuthContext() {
  return <AuthProvider17><AuthUI /></AuthProvider17>;
}
function AuthUI() {
  const { user, login, logout } = useContext(AuthCtx);
  return user
    ? <div>Welcome, {user}! <button onClick={logout}>Logout</button></div>
    : <button onClick={() => login("Ajay")}>Login as Ajay</button>;
}

// 18 — Modal context
function ModalProvider18({ children }: { children: ReactNode }) {
  const [content, setContent] = useState<string | null>(null);
  return (
    <ModalCtx.Provider value={{ open: setContent, close: () => setContent(null) }}>
      {children}
      {content && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ background: "#fff", padding: 24, borderRadius: 8 }}>
            <p>{content}</p><button onClick={() => setContent(null)}>Close</button>
          </div>
        </div>
      )}
    </ModalCtx.Provider>
  );
}
function Ex18_ModalContext() {
  return <ModalProvider18><ModalTrigger /></ModalProvider18>;
}
function ModalTrigger() { const { open } = useContext(ModalCtx); return <button onClick={() => open("Modal content here!")}>Open Modal</button>; }

// 19 — Sidebar context
function SidebarProvider19({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  return <SidebarCtx.Provider value={{ collapsed, toggle: () => setCollapsed((c) => !c) }}>{children}</SidebarCtx.Provider>;
}
function Ex19_SidebarContext() {
  return <SidebarProvider19><SidebarUI /></SidebarProvider19>;
}
function SidebarUI() {
  const { collapsed, toggle } = useContext(SidebarCtx);
  return (
    <div style={{ display: "flex" }}>
      <div style={{ width: collapsed ? 40 : 150, background: "#e5e7eb", padding: 8, transition: "width 0.2s" }}>
        {collapsed ? "☰" : "Sidebar content"}
      </div>
      <div style={{ padding: 8 }}><button onClick={toggle}>{collapsed ? "Expand" : "Collapse"}</button></div>
    </div>
  );
}

// 20 — Context with useCallback
const StableActionCtx = createContext<{ doAction: () => void }>({ doAction: () => {} });
function StableProvider20({ children }: { children: ReactNode }) {
  const doAction = useCallback(() => alert("Stable action!"), []);
  return <StableActionCtx.Provider value={{ doAction }}>{children}</StableActionCtx.Provider>;
}
function Ex20_ContextWithCallback() {
  return <StableProvider20><ActionBtn /></StableProvider20>;
}
function ActionBtn() { const { doAction } = useContext(StableActionCtx); return <button onClick={doAction}>Do stable action</button>; }

// 21 — Context with useMemo
const ComputedCtx = createContext<{ doubled: number }>({ doubled: 0 });
function ComputedProvider21({ n, children }: { n: number; children: ReactNode }) {
  const value = useMemo(() => ({ doubled: n * 2 }), [n]);
  return <ComputedCtx.Provider value={value}>{children}</ComputedCtx.Provider>;
}
function Ex21_ContextWithMemo() {
  const [n, setN] = useState(5);
  return (
    <ComputedProvider21 n={n}>
      <button onClick={() => setN(n + 1)}>n: {n}</button>
      <ComputedConsumer />
    </ComputedProvider21>
  );
}
function ComputedConsumer() { const { doubled } = useContext(ComputedCtx); return <p>Doubled: {doubled}</p>; }

// 22 — Context re-render prevention with memo
const ValueCtx = createContext(0);
const MemoChild22 = memo(() => {
  const v = useContext(ValueCtx);
  return <p>Memoized child sees: {v}</p>;
});
function Ex22_MemoWithContext() {
  const [count, setCount] = useState(0);
  const [other, setOther] = useState(0);
  return (
    <ValueCtx.Provider value={count}>
      <button onClick={() => setCount(c => c + 1)}>Count: {count} (re-renders child)</button>
      <button onClick={() => setOther(o => o + 1)}>Other: {other} (no child re-render)</button>
      <MemoChild22 />
    </ValueCtx.Provider>
  );
}

// 23 — Provide from outside to multiple children
function Ex23_SharedProvider() {
  const [theme, setTheme] = useState("blue");
  return (
    <ThemeCtx.Provider value={{ theme, toggle: () => setTheme((t) => t === "blue" ? "green" : "blue") }}>
      <Header23 />
      <Sidebar23 />
      <Footer23 />
    </ThemeCtx.Provider>
  );
}
function Header23()  { const { theme, toggle } = useContext(ThemeCtx); return <div style={{ background: theme, color: "#fff", padding: 8 }}>Header <button onClick={toggle}>Toggle</button></div>; }
function Sidebar23() { const { theme } = useContext(ThemeCtx); return <div style={{ background: theme, color: "#fff", padding: 8, opacity: 0.7 }}>Sidebar</div>; }
function Footer23()  { const { theme } = useContext(ThemeCtx); return <div style={{ background: theme, color: "#fff", padding: 8, opacity: 0.5 }}>Footer</div>; }

// 24 — Context that exposes dispatch
type Action24 = { type: "inc" } | { type: "dec" } | { type: "reset" };
const DispatchCtx = createContext<React.Dispatch<Action24>>(() => {});
const StateCtx24 = createContext(0);
function DispatchProvider24({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer((s: number, a: Action24) => a.type === "inc" ? s + 1 : a.type === "dec" ? s - 1 : 0, 0);
  return <StateCtx24.Provider value={state}><DispatchCtx.Provider value={dispatch}>{children}</DispatchCtx.Provider></StateCtx24.Provider>;
}
function Ex24_DispatchContext() {
  return <DispatchProvider24><StateDisplay24 /><StateControls24 /></DispatchProvider24>;
}
function StateDisplay24() { const s = useContext(StateCtx24); return <p>State: {s}</p>; }
function StateControls24() {
  const dispatch = useContext(DispatchCtx);
  return <div><button onClick={() => dispatch({ type: "inc" })}>+</button><button onClick={() => dispatch({ type: "dec" })}>–</button><button onClick={() => dispatch({ type: "reset" })}>Reset</button></div>;
}

// 25 — Custom hook wrapping useContext
function useTheme() {
  const ctx = useContext(ThemeCtx);
  return ctx;
}
function Ex25_CustomHookContext() {
  return (
    <ThemeProvider03>
      <ThemedButton />
    </ThemeProvider03>
  );
}
function ThemedButton() {
  const { theme, toggle } = useTheme();
  return <button style={{ background: theme === "dark" ? "#222" : "#eee", color: theme === "dark" ? "#fff" : "#000" }} onClick={toggle}>Theme: {theme}</button>;
}

// ─────────────────────────────────────────
// NESTED (26–37)
// ─────────────────────────────────────────

// 26 — Nested providers
function Ex26_NestedProviders() {
  return (
    <AuthProvider17>
      <ThemeProvider03>
        <CartProvider15>
          <NestedConsumer26 />
        </CartProvider15>
      </ThemeProvider03>
    </AuthProvider17>
  );
}
function NestedConsumer26() {
  const { user } = useContext(AuthCtx);
  const { theme } = useContext(ThemeCtx);
  const { items } = useContext(CartCtx);
  return <p>User: {user ?? "Guest"} | Theme: {theme} | Cart: {items.length} items</p>;
}

// 27 — Context in deeply nested tree
const DeepCtx = createContext("deep value");
function Ex27_DeepNesting() {
  return (
    <DeepCtx.Provider value="🎯 Found deep!">
      <Level1 />
    </DeepCtx.Provider>
  );
}
function Level1() { return <div style={{ padding: 8, border: "1px solid #ccc" }}>Level 1 <Level2 /></div>; }
function Level2() { return <div style={{ padding: 8, border: "1px solid #ccc" }}>Level 2 <Level3 /></div>; }
function Level3() { const val = useContext(DeepCtx); return <div style={{ padding: 8, border: "1px solid #ccc" }}>Level 3: {val}</div>; }

// 28 — Overriding context at different levels
const NumberCtx = createContext(0);
function Ex28_ContextOverride() {
  return (
    <NumberCtx.Provider value={10}>
      <ShowNumber label="Outer" />
      <NumberCtx.Provider value={999}>
        <ShowNumber label="Inner (overridden)" />
      </NumberCtx.Provider>
      <ShowNumber label="Outer again" />
    </NumberCtx.Provider>
  );
}
function ShowNumber({ label }: { label: string }) { const n = useContext(NumberCtx); return <p>{label}: {n}</p>; }

// 29 — Siblings sharing context
function Ex29_SiblingContext() {
  const [selected, setSelected] = useState("");
  const Ctx = createContext<{ selected: string; setSelected: (s: string) => void }>({ selected: "", setSelected: () => {} });
  return (
    <Ctx.Provider value={{ selected, setSelected }}>
      <SiblingList Ctx={Ctx} />
      <SiblingDetail Ctx={Ctx} />
    </Ctx.Provider>
  );
}
function SiblingList({ Ctx }: { Ctx: React.Context<{ selected: string; setSelected: (s: string) => void }> }) {
  const { setSelected } = useContext(Ctx);
  return <div>{["Apple", "Banana"].map((f) => <button key={f} onClick={() => setSelected(f)}>{f}</button>)}</div>;
}
function SiblingDetail({ Ctx }: { Ctx: React.Context<{ selected: string; setSelected: (s: string) => void }> }) {
  const { selected } = useContext(Ctx);
  return <p>Selected: {selected || "none"}</p>;
}

// 30 — Dynamic provider value
function Ex30_DynamicProvider() {
  const [items] = useState([{ id: 1, name: "React" }, { id: 2, name: "TypeScript" }]);
  const [activeId, setActiveId] = useState(1);
  const ActiveCtx = createContext<{ id: number; name: string }>({ id: 0, name: "" });
  const active = items.find((i) => i.id === activeId) ?? items[0];
  return (
    <ActiveCtx.Provider value={active}>
      {items.map((item) => <button key={item.id} style={{ fontWeight: activeId === item.id ? "bold" : "normal" }} onClick={() => setActiveId(item.id)}>{item.name}</button>)}
      <ActiveConsumer Ctx={ActiveCtx} />
    </ActiveCtx.Provider>
  );
}
function ActiveConsumer({ Ctx }: { Ctx: React.Context<{ id: number; name: string }> }) {
  const { name } = useContext(Ctx);
  return <p>Active: {name}</p>;
}

// 31 — Context with array reducer
type Item31 = { id: number; name: string };
type Action31 = { type: "add"; name: string } | { type: "remove"; id: number };
const ListCtx31 = createContext<{ items: Item31[]; dispatch: React.Dispatch<Action31> }>({ items: [], dispatch: () => {} });
function ListProvider31({ children }: { children: ReactNode }) {
  const [items, dispatch] = useReducer((state: Item31[], action: Action31): Item31[] => {
    if (action.type === "add") return [...state, { id: Date.now(), name: action.name }];
    return state.filter((i) => i.id !== action.id);
  }, []);
  return <ListCtx31.Provider value={{ items, dispatch }}>{children}</ListCtx31.Provider>;
}
function Ex31_ListReducerContext() {
  return <ListProvider31><ListInput31 /><ListDisplay31 /></ListProvider31>;
}
function ListInput31() {
  const { dispatch } = useContext(ListCtx31);
  const [v, setV] = useState("");
  return <div><input value={v} onChange={(e) => setV(e.target.value)} /><button onClick={() => { dispatch({ type: "add", name: v }); setV(""); }}>Add</button></div>;
}
function ListDisplay31() {
  const { items, dispatch } = useContext(ListCtx31);
  return <ul>{items.map((i) => <li key={i.id}>{i.name} <button onClick={() => dispatch({ type: "remove", id: i.id })}>✕</button></li>)}</ul>;
}

// 32 — Step wizard with context
type WizardCtx32Type = { step: number; next: () => void; prev: () => void };
const WizardCtx32 = createContext<WizardCtx32Type>({ step: 0, next: () => {}, prev: () => {} });
function WizardProvider32({ children }: { children: ReactNode }) {
  const [step, setStep] = useState(0);
  return <WizardCtx32.Provider value={{ step, next: () => setStep((s) => s + 1), prev: () => setStep((s) => s - 1) }}>{children}</WizardCtx32.Provider>;
}
function Ex32_WizardContext() {
  return <WizardProvider32><WizardStep32 step={0} label="Info" /><WizardStep32 step={1} label="Address" /><WizardStep32 step={2} label="Review" /><WizardNav32 /></WizardProvider32>;
}
function WizardStep32({ step, label }: { step: number; label: string }) {
  const { step: current } = useContext(WizardCtx32);
  if (current !== step) return null;
  return <div style={{ padding: 16, background: "#e0f2fe", borderRadius: 8 }}>Step {step + 1}: {label}</div>;
}
function WizardNav32() {
  const { step, next, prev } = useContext(WizardCtx32);
  return <div style={{ marginTop: 8 }}><button disabled={step === 0} onClick={prev}>Back</button><button disabled={step === 2} onClick={next}>Next</button></div>;
}

// 33 — Accordion group using context
const AccordionCtx = createContext<{ open: number | null; setOpen: (i: number | null) => void }>({ open: null, setOpen: () => {} });
function AccordionProvider33({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState<number | null>(null);
  return <AccordionCtx.Provider value={{ open, setOpen }}>{children}</AccordionCtx.Provider>;
}
function AccordionItem33({ index, title, content }: { index: number; title: string; content: string }) {
  const { open, setOpen } = useContext(AccordionCtx);
  const isOpen = open === index;
  return (
    <div>
      <button onClick={() => setOpen(isOpen ? null : index)}>{isOpen ? "▼" : "▶"} {title}</button>
      {isOpen && <p style={{ padding: "4px 16px" }}>{content}</p>}
    </div>
  );
}
function Ex33_AccordionContext() {
  return (
    <AccordionProvider33>
      <AccordionItem33 index={0} title="What is React?" content="A UI library." />
      <AccordionItem33 index={1} title="What is Context?" content="A way to share state." />
      <AccordionItem33 index={2} title="What is useReducer?" content="A state management hook." />
    </AccordionProvider33>
  );
}

// 34 — Form context for multi-step
type FormState34 = { name: string; email: string; city: string };
const FormCtx34 = createContext<{ data: FormState34; set: (k: keyof FormState34, v: string) => void }>({ data: { name: "", email: "", city: "" }, set: () => {} });
function FormProvider34({ children }: { children: ReactNode }) {
  const [data, setData] = useState<FormState34>({ name: "", email: "", city: "" });
  return <FormCtx34.Provider value={{ data, set: (k, v) => setData((d) => ({ ...d, [k]: v })) }}>{children}</FormCtx34.Provider>;
}
function Ex34_FormContext() {
  return (
    <FormProvider34>
      <NameField />
      <EmailField />
      <CityField />
      <FormSummary />
    </FormProvider34>
  );
}
function NameField()    { const { data, set } = useContext(FormCtx34); return <input value={data.name} onChange={(e) => set("name", e.target.value)} placeholder="Name" />; }
function EmailField()   { const { data, set } = useContext(FormCtx34); return <input value={data.email} onChange={(e) => set("email", e.target.value)} placeholder="Email" />; }
function CityField()    { const { data, set } = useContext(FormCtx34); return <input value={data.city} onChange={(e) => set("city", e.target.value)} placeholder="City" />; }
function FormSummary()  { const { data } = useContext(FormCtx34); return <pre>{JSON.stringify(data, null, 2)}</pre>; }

// 35 — Tabs using context
const TabCtx = createContext<{ active: string; setActive: (t: string) => void }>({ active: "", setActive: () => {} });
function TabProvider35({ defaultTab, children }: { defaultTab: string; children: ReactNode }) {
  const [active, setActive] = useState(defaultTab);
  return <TabCtx.Provider value={{ active, setActive }}>{children}</TabCtx.Provider>;
}
function Tab({ name }: { name: string }) { const { active, setActive } = useContext(TabCtx); return <button style={{ fontWeight: active === name ? "bold" : "normal", borderBottom: active === name ? "2px solid #4f46e5" : "none" }} onClick={() => setActive(name)}>{name}</button>; }
function TabPanel({ name, children }: { name: string; children: ReactNode }) { const { active } = useContext(TabCtx); return active === name ? <div style={{ padding: 12 }}>{children}</div> : null; }
function Ex35_TabContext() {
  return (
    <TabProvider35 defaultTab="Home">
      <div style={{ display: "flex", gap: 8 }}><Tab name="Home" /><Tab name="Profile" /><Tab name="Settings" /></div>
      <TabPanel name="Home">🏠 Home content</TabPanel>
      <TabPanel name="Profile">👤 Profile content</TabPanel>
      <TabPanel name="Settings">⚙️ Settings content</TabPanel>
    </TabProvider35>
  );
}

// 36 — Toast stack with context
type Toast = { id: number; msg: string };
const ToastCtx = createContext<{ addToast: (msg: string) => void }>({ addToast: () => {} });
function ToastProvider36({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const addToast = (msg: string) => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, msg }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 2500);
  };
  return (
    <ToastCtx.Provider value={{ addToast }}>
      {children}
      <div style={{ position: "fixed", bottom: 16, right: 16, display: "flex", flexDirection: "column", gap: 4 }}>
        {toasts.map((t) => <div key={t.id} style={{ background: "#333", color: "#fff", padding: "8px 12px", borderRadius: 4 }}>{t.msg}</div>)}
      </div>
    </ToastCtx.Provider>
  );
}
function Ex36_ToastContext() {
  return <ToastProvider36><ToastTrigger /></ToastProvider36>;
}
function ToastTrigger() { const { addToast } = useContext(ToastCtx); return <button onClick={() => addToast(`Toast at ${new Date().toLocaleTimeString()}`)}>Show toast</button>; }

// 37 — Permission/Role based rendering
const RoleCtx = createContext<{ role: "admin" | "user" | "guest" }>("user" as unknown as { role: "admin" | "user" | "guest" });
function Ex37_RoleBasedContext() {
  const [role, setRole] = useState<"admin" | "user" | "guest">("user");
  return (
    <RoleCtx.Provider value={{ role }}>
      <select value={role} onChange={(e) => setRole(e.target.value as "admin" | "user" | "guest")}>
        <option value="admin">Admin</option><option value="user">User</option><option value="guest">Guest</option>
      </select>
      <AdminPanel /><UserPanel /><GuestPanel />
    </RoleCtx.Provider>
  );
}
function AdminPanel() { const { role } = useContext(RoleCtx); return role === "admin" ? <p>🔒 Admin panel</p> : null; }
function UserPanel()  { const { role } = useContext(RoleCtx); return (role === "admin" || role === "user") ? <p>👤 User panel</p> : null; }
function GuestPanel() { return <p>🌐 Public content</p>; }

// ─────────────────────────────────────────
// ADVANCED (38–50)
// ─────────────────────────────────────────

// 38 — Split context (state + dispatch) to prevent unnecessary re-renders
const CountStateCtx = createContext(0);
const CountDispatchCtx = createContext<React.Dispatch<number>>(() => {});
function SplitProvider38({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);
  return <CountStateCtx.Provider value={count}><CountDispatchCtx.Provider value={setCount}>{children}</CountDispatchCtx.Provider></CountStateCtx.Provider>;
}
const SplitDisplay38 = memo(() => { const c = useContext(CountStateCtx); return <p>Count: {c}</p>; });
const SplitButtons38 = memo(() => { const set = useContext(CountDispatchCtx); return <div><button onClick={() => set((c) => c + 1)}>+</button><button onClick={() => set((c) => c - 1)}>–</button></div>; });
function Ex38_SplitContext() { return <SplitProvider38><SplitDisplay38 /><SplitButtons38 /></SplitProvider38>; }

// 39 — Context composition (provider tree builder)
function compose(...providers: Array<(props: { children: ReactNode }) => JSX.Element>) {
  return ({ children }: { children: ReactNode }) =>
    providers.reduceRight((acc, Provider) => <Provider>{acc}</Provider>, <>{children}</>);
}
const AppProviders = compose(
  ({ children }) => <ThemeProvider03>{children}</ThemeProvider03>,
  ({ children }) => <AuthProvider17>{children}</AuthProvider17>,
);
function Ex39_ProviderComposition() {
  return (
    <AppProviders>
      <ThemeConsumer03 />
      <AuthUI />
    </AppProviders>
  );
}

// 40 — useContext + localStorage persistence
const PersistCtx = createContext<{ val: string; setVal: (v: string) => void }>({ val: "", setVal: () => {} });
function PersistProvider40({ children }: { children: ReactNode }) {
  const [val, setValState] = useState(() => localStorage.getItem("ex40") ?? "");
  const setVal = (v: string) => { setValState(v); localStorage.setItem("ex40", v); };
  return <PersistCtx.Provider value={{ val, setVal }}>{children}</PersistCtx.Provider>;
}
function Ex40_PersistedContext() {
  return <PersistProvider40><PersistUI /></PersistProvider40>;
}
function PersistUI() {
  const { val, setVal } = useContext(PersistCtx);
  return <div><input value={val} onChange={(e) => setVal(e.target.value)} placeholder="Persisted in localStorage" /><p>{val}</p></div>;
}

// 41 — Context with optimistic state
const OptimCtx = createContext<{ items: string[]; addItem: (i: string) => void }>({ items: [], addItem: () => {} });
function OptimProvider41({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<string[]>([]);
  const addItem = (i: string) => {
    setItems((prev) => [...prev, `${i} (saving...)`]);
    setTimeout(() => setItems((prev) => prev.map((x) => x === `${i} (saving...)` ? i : x)), 1000);
  };
  return <OptimCtx.Provider value={{ items, addItem }}>{children}</OptimCtx.Provider>;
}
function Ex41_OptimisticContext() {
  return <OptimProvider41><OptimUI /></OptimProvider41>;
}
function OptimUI() {
  const { items, addItem } = useContext(OptimCtx);
  const [v, setV] = useState("");
  return (
    <div>
      <input value={v} onChange={(e) => setV(e.target.value)} /><button onClick={() => { addItem(v); setV(""); }}>Add</button>
      <ul>{items.map((i, idx) => <li key={idx}>{i}</li>)}</ul>
    </div>
  );
}

// 42 — Context with WebSocket-like updates
const LiveCtx = createContext<{ messages: string[] }>({ messages: [] });
function LiveProvider42({ children }: { children: ReactNode }) {
  const [messages, setMessages] = useState<string[]>([]);
  useState(() => {
    const id = setInterval(() => {
      setMessages((prev) => [...prev.slice(-4), `Live @ ${new Date().toLocaleTimeString()}`]);
    }, 2000);
    return () => clearInterval(id);
  });
  return <LiveCtx.Provider value={{ messages }}>{children}</LiveCtx.Provider>;
}
function Ex42_LiveContext() {
  return <LiveProvider42><LiveDisplay /></LiveProvider42>;
}
function LiveDisplay() { const { messages } = useContext(LiveCtx); return <div>{messages.map((m, i) => <p key={i}>{m}</p>)}</div>; }

// 43 — Context with undo/redo
type HistoryState43 = { past: string[]; present: string; future: string[] };
const HistoryCtx43 = createContext<{ state: HistoryState43; push: (v: string) => void; undo: () => void; redo: () => void }>({ state: { past: [], present: "", future: [] }, push: () => {}, undo: () => {}, redo: () => {} });
function HistoryProvider43({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HistoryState43>({ past: [], present: "", future: [] });
  const push = (v: string) => setState(({ past, present }) => ({ past: [...past, present], present: v, future: [] }));
  const undo = () => setState(({ past, present, future }) => ({ past: past.slice(0, -1), present: past[past.length - 1] ?? "", future: [present, ...future] }));
  const redo = () => setState(({ past, present, future }) => ({ past: [...past, present], present: future[0] ?? "", future: future.slice(1) }));
  return <HistoryCtx43.Provider value={{ state, push, undo, redo }}>{children}</HistoryCtx43.Provider>;
}
function Ex43_UndoRedoContext() {
  return <HistoryProvider43><HistoryUI /></HistoryProvider43>;
}
function HistoryUI() {
  const { state, push, undo, redo } = useContext(HistoryCtx43);
  return (
    <div>
      <input value={state.present} onChange={(e) => push(e.target.value)} placeholder="Type something" />
      <button onClick={undo} disabled={!state.past.length}>Undo</button>
      <button onClick={redo} disabled={!state.future.length}>Redo</button>
      <p>Past: [{state.past.join(", ")}]</p>
    </div>
  );
}

// 44 — Feature flags via context
const FeatureCtx = createContext<Record<string, boolean>>({});
function Ex44_FeatureFlags() {
  const flags = { darkMode: true, betaFeature: false, newDashboard: true };
  return (
    <FeatureCtx.Provider value={flags}>
      <FeatureFlag name="darkMode" fallback={<span>Dark mode off</span>}><span>🌙 Dark mode ON</span></FeatureFlag>
      <FeatureFlag name="betaFeature" fallback={<span>Beta not enabled</span>}><span>🧪 Beta feature</span></FeatureFlag>
    </FeatureCtx.Provider>
  );
}
function FeatureFlag({ name, children, fallback }: { name: string; children: ReactNode; fallback: ReactNode }) {
  const flags = useContext(FeatureCtx);
  return <div>{flags[name] ? children : fallback}</div>;
}

// 45 — i18n (internationalization) context
const i18nData: Record<string, Record<string, string>> = {
  EN: { greeting: "Hello!", farewell: "Goodbye!" },
  AR: { greeting: "مرحبا!", farewell: "وداعا!" },
  FR: { greeting: "Bonjour!", farewell: "Au revoir!" },
};
const I18nCtx = createContext<{ t: (key: string) => string; lang: string; setLang: (l: string) => void }>({ t: () => "", lang: "EN", setLang: () => {} });
function I18nProvider45({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState("EN");
  const t = (key: string) => i18nData[lang]?.[key] ?? key;
  return <I18nCtx.Provider value={{ t, lang, setLang }}>{children}</I18nCtx.Provider>;
}
function Ex45_I18nContext() {
  return <I18nProvider45><I18nUI /></I18nProvider45>;
}
function I18nUI() {
  const { t, lang, setLang } = useContext(I18nCtx);
  return (
    <div>
      {["EN", "AR", "FR"].map((l) => <button key={l} style={{ fontWeight: lang === l ? "bold" : "normal" }} onClick={() => setLang(l)}>{l}</button>)}
      <p>{t("greeting")} {t("farewell")}</p>
    </div>
  );
}

// 46 — Context with lazy initialization
const HeavyCtx = createContext<{ data: number[] }>({ data: [] });
function HeavyProvider46({ children }: { children: ReactNode }) {
  const [data] = useState(() => Array.from({ length: 100 }, (_, i) => i * 2)); // computed once
  return <HeavyCtx.Provider value={{ data }}>{children}</HeavyCtx.Provider>;
}
function Ex46_LazyContext() {
  return <HeavyProvider46><HeavyDisplay /></HeavyProvider46>;
}
function HeavyDisplay() { const { data } = useContext(HeavyCtx); return <p>First 5: {data.slice(0, 5).join(", ")} ... ({data.length} items)</p>; }

// 47 — Context with selector pattern
const BigStateCtx = createContext({ count: 0, name: "Ali", theme: "light" });
function useSelector<T>(selector: (state: { count: number; name: string; theme: string }) => T): T {
  const state = useContext(BigStateCtx);
  return selector(state);
}
function Ex47_SelectorPattern() {
  return (
    <BigStateCtx.Provider value={{ count: 42, name: "Ajay", theme: "dark" }}>
      <CountOnly />
      <NameOnly />
    </BigStateCtx.Provider>
  );
}
function CountOnly() { const count = useSelector((s) => s.count); return <p>Count: {count}</p>; }
function NameOnly()  { const name = useSelector((s) => s.name);  return <p>Name: {name}</p>; }

// 48 — Context reset
const ResetCtx = createContext<{ value: string; reset: () => void }>({ value: "", reset: () => {} });
function ResetProvider48({ children }: { children: ReactNode }) {
  const [value, setValue] = useState("initial");
  const [key, setKey] = useState(0);
  const reset = () => { setValue("initial"); setKey((k) => k + 1); };
  return <ResetCtx.Provider value={{ value: `${value}-${key}`, reset }}>{children}</ResetCtx.Provider>;
}
function Ex48_ResetContext() {
  return <ResetProvider48><ResetUI /></ResetProvider48>;
}
function ResetUI() { const { value, reset } = useContext(ResetCtx); return <div><p>{value}</p><button onClick={reset}>Reset context</button></div>; }

// 49 — Derived context
const PricesCtx = createContext<number[]>([]);
function Ex49_DerivedContext() {
  const prices = [10, 20, 30, 40, 50];
  return <PricesCtx.Provider value={prices}><PriceSummary /></PricesCtx.Provider>;
}
function PriceSummary() {
  const prices = useContext(PricesCtx);
  const total = useMemo(() => prices.reduce((a, b) => a + b, 0), [prices]);
  const avg = useMemo(() => total / prices.length, [total, prices.length]);
  return <p>Total: ${total} | Avg: ${avg.toFixed(2)}</p>;
}

// 50 — Full app context system
function Ex50_FullAppContext() {
  return (
    <ThemeProvider03>
      <AuthProvider17>
        <CartProvider15>
          <NotifProvider16>
            <FullAppUI />
          </NotifProvider16>
        </CartProvider15>
      </AuthProvider17>
    </ThemeProvider03>
  );
}
function FullAppUI() {
  const { theme, toggle } = useContext(ThemeCtx);
  const { user, login, logout } = useContext(AuthCtx);
  const { items, add } = useContext(CartCtx);
  const { notify } = useContext(NotifCtx);
  return (
    <div style={{ background: theme === "dark" ? "#1f2937" : "#f9fafb", color: theme === "dark" ? "#fff" : "#000", padding: 16 }}>
      <button onClick={toggle}>🎨 Theme</button>
      <button onClick={() => user ? logout() : login("Ajay")}>{user ? `Logout ${user}` : "Login"}</button>
      <button onClick={() => { add("Item"); notify("Added to cart!"); }}>🛒 Add to cart ({items.length})</button>
    </div>
  );
}

// ─────────────────────────────────────────
// MAIN APP
// ─────────────────────────────────────────

const examples: { label: string; component: JSX.Element }[] = [
  { label: "01 [Basic] Simple Value",              component: <Ex01_SimpleValue /> },
  { label: "02 [Basic] Default Value",             component: <Ex02_DefaultValue /> },
  { label: "03 [Basic] Theme Toggle",              component: <Ex03_ThemeContext /> },
  { label: "04 [Basic] User Context",              component: <Ex04_UserContext /> },
  { label: "05 [Basic] Counter Context",           component: <Ex05_CounterContext /> },
  { label: "06 [Basic] Language Context",          component: <Ex06_LanguageContext /> },
  { label: "07 [Basic] Boolean Flag",              component: <Ex07_BooleanFlag /> },
  { label: "08 [Basic] Number Context",            component: <Ex08_NumberContext /> },
  { label: "09 [Basic] Config Context",            component: <Ex09_ConfigContext /> },
  { label: "10 [Basic] Array Context",             component: <Ex10_ArrayContext /> },
  { label: "11 [Basic] Null-Safe Context",         component: <Ex11_NullSafeContext /> },
  { label: "12 [Basic] Function Context",          component: <Ex12_FunctionContext /> },
  { label: "13 [Intermediate] Context + Updater",  component: <Ex13_ContextWithUpdater /> },
  { label: "14 [Intermediate] Multiple Providers", component: <Ex14_MultipleProviders /> },
  { label: "15 [Intermediate] Cart Context",       component: <Ex15_CartContext /> },
  { label: "16 [Intermediate] Notification",       component: <Ex16_NotificationContext /> },
  { label: "17 [Intermediate] Auth Context",       component: <Ex17_AuthContext /> },
  { label: "18 [Intermediate] Modal Context",      component: <Ex18_ModalContext /> },
  { label: "19 [Intermediate] Sidebar Context",    component: <Ex19_SidebarContext /> },
  { label: "20 [Intermediate] Context+useCallback",component: <Ex20_ContextWithCallback /> },
  { label: "21 [Intermediate] Context+useMemo",    component: <Ex21_ContextWithMemo /> },
  { label: "22 [Intermediate] memo+Context",       component: <Ex22_MemoWithContext /> },
  { label: "23 [Intermediate] Shared Provider",    component: <Ex23_SharedProvider /> },
  { label: "24 [Intermediate] Dispatch Context",   component: <Ex24_DispatchContext /> },
  { label: "25 [Intermediate] Custom Hook",        component: <Ex25_CustomHookContext /> },
  { label: "26 [Nested] Nested Providers",         component: <Ex26_NestedProviders /> },
  { label: "27 [Nested] Deep Nesting",             component: <Ex27_DeepNesting /> },
  { label: "28 [Nested] Context Override",         component: <Ex28_ContextOverride /> },
  { label: "29 [Nested] Sibling Context",          component: <Ex29_SiblingContext /> },
  { label: "30 [Nested] Dynamic Provider",         component: <Ex30_DynamicProvider /> },
  { label: "31 [Nested] List Reducer Context",     component: <Ex31_ListReducerContext /> },
  { label: "32 [Nested] Step Wizard Context",      component: <Ex32_WizardContext /> },
  { label: "33 [Nested] Accordion Context",        component: <Ex33_AccordionContext /> },
  { label: "34 [Nested] Form Context",             component: <Ex34_FormContext /> },
  { label: "35 [Nested] Tab Context",              component: <Ex35_TabContext /> },
  { label: "36 [Nested] Toast Stack",              component: <Ex36_ToastContext /> },
  { label: "37 [Nested] Role-Based Rendering",     component: <Ex37_RoleBasedContext /> },
  { label: "38 [Advanced] Split State+Dispatch",   component: <Ex38_SplitContext /> },
  { label: "39 [Advanced] Provider Composition",   component: <Ex39_ProviderComposition /> },
  { label: "40 [Advanced] Persisted Context",      component: <Ex40_PersistedContext /> },
  { label: "41 [Advanced] Optimistic Context",     component: <Ex41_OptimisticContext /> },
  { label: "42 [Advanced] Live Updates Context",   component: <Ex42_LiveContext /> },
  { label: "43 [Advanced] Undo/Redo Context",      component: <Ex43_UndoRedoContext /> },
  { label: "44 [Advanced] Feature Flags",          component: <Ex44_FeatureFlags /> },
  { label: "45 [Advanced] i18n Context",           component: <Ex45_I18nContext /> },
  { label: "46 [Advanced] Lazy Context",           component: <Ex46_LazyContext /> },
  { label: "47 [Advanced] Selector Pattern",       component: <Ex47_SelectorPattern /> },
  { label: "48 [Advanced] Reset Context",          component: <Ex48_ResetContext /> },
  { label: "49 [Advanced] Derived Context",        component: <Ex49_DerivedContext /> },
  { label: "50 [Advanced] Full App Context",       component: <Ex50_FullAppContext /> },
];

export default function UseContextExamples() {
  return (
    <div style={{ fontFamily: "sans-serif", padding: 24 }}>
      <h1>50 useContext Examples — Basic · Intermediate · Nested · Advanced</h1>
      {examples.map(({ label, component }) => (
        <section key={label} style={{ border: "1px solid #ddd", borderRadius: 8, padding: 16, marginBottom: 20 }}>
          <h2 style={{ marginTop: 0, fontSize: 14, color: "#555" }}>{label}</h2>
          {component}
        </section>
      ))}
    </div>
  );
}
