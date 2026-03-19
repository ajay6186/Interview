import React, { useState } from "react";

// ============================================================
// Examples 1.4 — Conditional Rendering (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ============================================================
// BASIC — &&, ternary, if/else helper, early return null (1–13)
// ============================================================

// 1. && with boolean guard
function Ex01_ShowIf({ show }: { show: boolean }) {
  return <div>{show && <p>Visible!</p>}</div>;
}

// 2. && with count > 0 (avoids rendering "0")
function Ex02_CountBadge({ count }: { count: number }) {
  return <span>{count > 0 && <strong>({count})</strong>}</span>;
}

// 3. Ternary — two branches
function Ex03_OnlineStatus({ online }: { online: boolean }) {
  return <span style={{ color: online ? "green" : "gray" }}>{online ? "Online" : "Offline"}</span>;
}

// 4. Ternary in attribute
function Ex04_DisabledButton({ loading }: { loading: boolean }) {
  return <button disabled={loading} style={{ opacity: loading ? 0.5 : 1 }}>{loading ? "Loading…" : "Submit"}</button>;
}

// 5. if/else helper function returning JSX
type Role = "admin" | "editor" | "viewer";
function getRoleBadge(role: Role): React.ReactNode {
  if (role === "admin")  return <span style={{ color: "red",   fontWeight: "bold" }}>Admin</span>;
  if (role === "editor") return <span style={{ color: "blue"              }}>Editor</span>;
  return                        <span style={{ color: "gray"              }}>Viewer</span>;
}
function Ex05_RoleBadge({ role }: { role: Role }) {
  return <p>Access: {getRoleBadge(role)}</p>;
}

// 6. Early return null — hides component completely
function Ex06_WarningBanner({ visible, message }: { visible: boolean; message: string }) {
  if (!visible) return null;
  return <div style={{ background: "#fff3cd", padding: 10, borderRadius: 4 }}>⚠ {message}</div>;
}

// 7. Toggle show/hide with useState
function Ex07_Toggle() {
  const [show, setShow] = useState(false);
  return (
    <div>
      <button onClick={() => setShow((v) => !v)}>{show ? "Hide" : "Show"}</button>
      {show && <p>Revealed content!</p>}
    </div>
  );
}

// 8. Conditional className
function Ex08_ConditionalClass({ active }: { active: boolean }) {
  return <li className={active ? "active" : "inactive"} style={{ fontWeight: active ? "bold" : "normal" }}>Menu item</li>;
}

// 9. Conditional inline style
function Ex09_ConditionalStyle({ error }: { error: boolean }) {
  return <input style={{ borderColor: error ? "red" : "#ccc", outline: error ? "1px solid red" : "none" }} />;
}

// 10. aria-hidden conditional
function Ex10_AriaHidden({ decorative }: { decorative: boolean }) {
  return <img src="icon.png" alt={decorative ? "" : "Chart icon"} aria-hidden={decorative} />;
}

// 11. Conditional placeholder
function Ex11_DynamicPlaceholder({ loggedIn }: { loggedIn: boolean }) {
  return <input placeholder={loggedIn ? "Search your files…" : "Login to search"} disabled={!loggedIn} />;
}

// 12. Nullish coalescing for default display value
function Ex12_NullishDefault({ value }: { value: string | null | undefined }) {
  return <p>{value ?? "N/A"}</p>;
}

// 13. Optional chaining in JSX
type Profile = { bio?: { tagline?: string } };
function Ex13_OptionalChain({ profile }: { profile: Profile }) {
  return <p>{profile.bio?.tagline ?? "No tagline set."}</p>;
}

// ============================================================
// INTERMEDIATE — switch, loading/error/success, role guards (14–26)
// ============================================================

// 14. switch-case rendering
type Status = "idle" | "loading" | "success" | "error";
function Ex14_StatusPanel({ status, message }: { status: Status; message?: string }) {
  switch (status) {
    case "idle":    return <p style={{ color: "gray" }}>Waiting…</p>;
    case "loading": return <p>Loading…</p>;
    case "success": return <p style={{ color: "green" }}>✓ {message}</p>;
    case "error":   return <p style={{ color: "red" }}>✗ {message ?? "Error"}</p>;
  }
}

// 15. Loading / error / data pattern
function Ex15_AsyncView<T>({
  loading,
  error,
  data,
  render,
}: {
  loading: boolean;
  error: string | null;
  data: T | null;
  render: (d: T) => React.ReactNode;
}) {
  if (loading) return <p>Loading…</p>;
  if (error)   return <p style={{ color: "red" }}>{error}</p>;
  if (!data)   return <p style={{ color: "gray" }}>No data.</p>;
  return <>{render(data)}</>;
}

// 16. Role-based render guard
function Ex16_AdminOnly({ role, children }: { role: Role; children: React.ReactNode }) {
  if (role !== "admin") return null;
  return <>{children}</>;
}

// 17. Feature flag guard
const FEATURES = { darkMode: true, betaEditor: false };
function Ex17_FeatureFlag({ flag, children }: { flag: keyof typeof FEATURES; children: React.ReactNode }) {
  if (!FEATURES[flag]) return null;
  return <>{children}</>;
}

// 18. Permission-based render
function Ex18_PermissionGuard({
  permissions,
  required,
  fallback,
  children,
}: {
  permissions: string[];
  required: string;
  fallback?: React.ReactNode;
  children: React.ReactNode;
}) {
  return permissions.includes(required) ? <>{children}</> : <>{fallback ?? null}</>;
}

// 19. Short-circuit with string (truthy string renders)
function Ex19_ShortCircuitString({ name }: { name: string }) {
  return <p>{name && `Hello, ${name}!`}</p>;
}

// 20. Conditional rendering inside a .map
type Item = { id: number; label: string; featured: boolean };
function Ex20_FeaturedList({ items }: { items: Item[] }) {
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>
          {item.label}
          {item.featured && <span style={{ color: "gold", marginLeft: 4 }}>★</span>}
        </li>
      ))}
    </ul>
  );
}

// 21. .filter() then .map()
function Ex21_ActiveOnly({ items }: { items: { id: number; label: string; active: boolean }[] }) {
  return (
    <ul>
      {items.filter((i) => i.active).map((i) => <li key={i.id}>{i.label}</li>)}
    </ul>
  );
}

// 22. Null guard before accessing nested property
function Ex22_NullGuard({ user }: { user: { name: string; address?: { city: string } } | null }) {
  if (!user) return <p>No user.</p>;
  return <p>{user.name} — {user.address?.city ?? "City unknown"}</p>;
}

// 23. Conditional children
function Ex23_Section({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <section>
      <h3>{title}</h3>
      {children ? children : <p style={{ color: "gray" }}>No content provided.</p>}
    </section>
  );
}

// 24. Multiple && conditions stacked
function Ex24_MultipleAnd({
  authenticated,
  verified,
  hasPlan,
}: {
  authenticated: boolean;
  verified: boolean;
  hasPlan: boolean;
}) {
  return (
    <div>
      {authenticated && <span> Logged in</span>}
      {authenticated && verified && <span> ✓ Verified</span>}
      {authenticated && verified && hasPlan && <span> 🏆 Pro</span>}
    </div>
  );
}

// 25. Ternary — conditional whole section
function Ex25_AuthWall({ loggedIn, children }: { loggedIn: boolean; children: React.ReactNode }) {
  return loggedIn ? <>{children}</> : <p>Please log in to continue.</p>;
}

// 26. Conditional render with computed value
function Ex26_ScoreBadge({ score }: { score: number }) {
  const grade = score >= 90 ? "A" : score >= 70 ? "B" : score >= 50 ? "C" : "F";
  const color  = score >= 70 ? "green" : score >= 50 ? "orange" : "red";
  return <span style={{ background: color, color: "#fff", padding: "2px 8px", borderRadius: 4 }}>{grade} ({score})</span>;
}

// ============================================================
// NESTED — conditional nested lists, modals, step wizards (27–38)
// ============================================================

// 27. Nested ternaries (kept readable with variables)
function Ex27_StatusIcon({ status }: { status: Status }) {
  const icon = status === "success" ? "✓"
             : status === "error"   ? "✗"
             : status === "loading" ? "↻"
             : "–";
  const color = status === "success" ? "green"
              : status === "error"   ? "red"
              : status === "loading" ? "blue"
              : "gray";
  return <span style={{ color, fontWeight: "bold", fontSize: 18 }}>{icon}</span>;
}

// 28. Conditional nested list (show only if non-empty)
function Ex28_CategoryList({ groups }: { groups: { name: string; items: string[] }[] }) {
  return (
    <div>
      {groups.map((g) => (
        <div key={g.name}>
          <h4>{g.name}</h4>
          {g.items.length > 0
            ? <ul>{g.items.map((i) => <li key={i}>{i}</li>)}</ul>
            : <p style={{ color: "gray" }}>Empty</p>
          }
        </div>
      ))}
    </div>
  );
}

// 29. Conditional form fields based on selection
function Ex29_DynamicForm() {
  const [type, setType] = useState<"email" | "phone">("email");
  return (
    <form>
      <select value={type} onChange={(e) => setType(e.target.value as "email" | "phone")}>
        <option value="email">Email</option>
        <option value="phone">Phone</option>
      </select>
      {type === "email" && <input type="email" placeholder="Enter email" style={{ marginLeft: 8 }} />}
      {type === "phone" && <input type="tel" placeholder="Enter phone" style={{ marginLeft: 8 }} />}
    </form>
  );
}

// 30. Modal show/hide pattern
function Ex30_Modal({ open, title, onClose, children }: { open: boolean; title: string; onClose: () => void; children: React.ReactNode }) {
  if (!open) return null;
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
      <div style={{ background: "#fff", borderRadius: 8, padding: 24, minWidth: 300 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
          <strong>{title}</strong>
          <button onClick={onClose}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
function Ex30_App() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button onClick={() => setOpen(true)}>Open Modal</button>
      <Ex30_Modal open={open} title="Confirm" onClose={() => setOpen(false)}>
        <p>Are you sure?</p>
        <button onClick={() => setOpen(false)}>Yes</button>
      </Ex30_Modal>
    </div>
  );
}

// 31. Toast notification (temporary visibility)
function Ex31_Toast({ visible, message }: { visible: boolean; message: string }) {
  if (!visible) return null;
  return (
    <div style={{ position: "fixed", bottom: 24, right: 24, background: "#333", color: "#fff", padding: "10px 20px", borderRadius: 6, zIndex: 200 }}>
      {message}
    </div>
  );
}
function Ex31_App() {
  const [show, setShow] = useState(false);
  return (
    <div>
      <button onClick={() => { setShow(true); setTimeout(() => setShow(false), 2000); }}>Show Toast</button>
      <Ex31_Toast visible={show} message="Saved successfully!" />
    </div>
  );
}

// 32. Step wizard — render only current step
function Ex32_Wizard() {
  const [step, setStep] = useState(1);
  return (
    <div>
      <p>Step {step} of 3</p>
      {step === 1 && <div><p>Enter your name.</p><button onClick={() => setStep(2)}>Next</button></div>}
      {step === 2 && <div><p>Choose your plan.</p><button onClick={() => setStep(3)}>Next</button></div>}
      {step === 3 && <div><p>Confirm and submit.</p><button onClick={() => setStep(1)}>Restart</button></div>}
    </div>
  );
}

// 33. Conditional table columns
function Ex33_ConditionalTable({
  rows,
  showEmail,
}: {
  rows: { id: number; name: string; email: string; score: number }[];
  showEmail: boolean;
}) {
  return (
    <table style={{ borderCollapse: "collapse", width: "100%" }}>
      <thead>
        <tr>
          <th>Name</th>
          {showEmail && <th>Email</th>}
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id}>
            <td>{r.name}</td>
            {showEmail && <td>{r.email}</td>}
            <td>{r.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 34. Skeleton vs content pattern
function Ex34_Skeleton() {
  return <div style={{ height: 16, background: "#e0e0e0", borderRadius: 4, margin: "4px 0", animation: "pulse 1.5s infinite" }} />;
}
function Ex34_SkeletonOrContent({ loading, children }: { loading: boolean; children: React.ReactNode }) {
  if (loading) return <div>{[1, 2, 3].map((n) => <Ex34_Skeleton key={n} />)}</div>;
  return <>{children}</>;
}

// 35. Async state machine render (4 states)
type FetchState = { status: "idle" } | { status: "loading" } | { status: "success"; data: string[] } | { status: "error"; message: string };
function Ex35_FetchView({ state }: { state: FetchState }) {
  switch (state.status) {
    case "idle":    return <button>Load</button>;
    case "loading": return <p>Fetching…</p>;
    case "success": return <ul>{state.data.map((d) => <li key={d}>{d}</li>)}</ul>;
    case "error":   return <p style={{ color: "red" }}>{state.message}</p>;
  }
}

// 36. Nested loading states (parent + child independently loading)
function Ex36_NestedLoading({ parentLoading, childLoading }: { parentLoading: boolean; childLoading: boolean }) {
  if (parentLoading) return <p>Loading parent…</p>;
  return (
    <div>
      <p>Parent loaded</p>
      {childLoading ? <p>Loading child…</p> : <p>Child loaded</p>}
    </div>
  );
}

// 37. Per-field validation errors
type FormErrors = Partial<Record<"name" | "email" | "password", string>>;
function Ex37_ValidationForm({ errors }: { errors: FormErrors }) {
  return (
    <form>
      <div>
        <input placeholder="Name" style={{ borderColor: errors.name ? "red" : "#ccc" }} />
        {errors.name && <p style={{ color: "red", margin: 0, fontSize: 12 }}>{errors.name}</p>}
      </div>
      <div style={{ marginTop: 8 }}>
        <input placeholder="Email" style={{ borderColor: errors.email ? "red" : "#ccc" }} />
        {errors.email && <p style={{ color: "red", margin: 0, fontSize: 12 }}>{errors.email}</p>}
      </div>
      <div style={{ marginTop: 8 }}>
        <input type="password" placeholder="Password" style={{ borderColor: errors.password ? "red" : "#ccc" }} />
        {errors.password && <p style={{ color: "red", margin: 0, fontSize: 12 }}>{errors.password}</p>}
      </div>
    </form>
  );
}

// 38. Conditional accordion — only open panel renders body
function Ex38_Accordion() {
  const [open, setOpen] = useState<string | null>(null);
  const items = ["Alpha", "Beta", "Gamma"];
  return (
    <div>
      {items.map((label) => (
        <div key={label} style={{ borderBottom: "1px solid #eee" }}>
          <button onClick={() => setOpen(open === label ? null : label)} style={{ width: "100%", textAlign: "left", padding: 8, background: "none", border: "none", cursor: "pointer" }}>
            {open === label ? "▼" : "▶"} {label}
          </button>
          {open === label && <p style={{ padding: "0 8px 8px" }}>Content for {label}</p>}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// ADVANCED — exhaustive switch, discriminated union render (39–50)
// ============================================================

// 39. Exhaustive switch with never
type Shape = { kind: "circle"; radius: number } | { kind: "rect"; w: number; h: number } | { kind: "triangle"; base: number; height: number };
function Ex39_ShapeInfo({ shape }: { shape: Shape }): React.ReactElement {
  switch (shape.kind) {
    case "circle":   return <p>Circle r={shape.radius}</p>;
    case "rect":     return <p>Rect {shape.w}×{shape.h}</p>;
    case "triangle": return <p>Triangle base={shape.base} h={shape.height}</p>;
    default: {
      const _: never = shape;
      throw new Error(`Unhandled shape: ${JSON.stringify(_)}`);
    }
  }
}

// 40. Discriminated union component
type CardVariant =
  | { type: "metric";    label: string; value: number; unit: string }
  | { type: "alert";     message: string; severity: "info" | "warn" | "error" }
  | { type: "progress";  label: string; percent: number };

function Ex40_DashCard(card: CardVariant) {
  if (card.type === "metric")
    return <div style={{ textAlign: "center" }}><p style={{ fontSize: 28, margin: 0 }}>{card.value}{card.unit}</p><small>{card.label}</small></div>;
  if (card.type === "alert") {
    const bg = { info: "#d1ecf1", warn: "#fff3cd", error: "#f8d7da" }[card.severity];
    return <div style={{ background: bg, padding: 10, borderRadius: 4 }}>{card.message}</div>;
  }
  return (
    <div>
      <p>{card.label}: {card.percent}%</p>
      <div style={{ background: "#eee", borderRadius: 4, height: 8 }}>
        <div style={{ width: `${card.percent}%`, background: "#3498db", height: "100%", borderRadius: 4 }} />
      </div>
    </div>
  );
}

// 41. Compound conditional — multiple independent flags
function Ex41_UserStatus({
  online,
  typing,
  away,
}: {
  online: boolean;
  typing: boolean;
  away: boolean;
}) {
  const label = !online ? "Offline" : typing ? "Typing…" : away ? "Away" : "Online";
  const color  = !online ? "gray" : typing ? "blue" : away ? "orange" : "green";
  return <span style={{ color }}>● {label}</span>;
}

// 42. Priority-based render (first truthy wins)
function Ex42_PriorityRender({
  error,
  warning,
  info,
}: {
  error?: string;
  warning?: string;
  info?: string;
}) {
  const content = error
    ? <p style={{ color: "red" }}>Error: {error}</p>
    : warning
    ? <p style={{ color: "orange" }}>Warning: {warning}</p>
    : info
    ? <p style={{ color: "blue" }}>Info: {info}</p>
    : null;
  return <>{content}</>;
}

// 43. render prop with condition
function Ex43_ConditionalRender<T>({
  data,
  condition,
  render,
  fallback,
}: {
  data: T;
  condition: (d: T) => boolean;
  render: (d: T) => React.ReactNode;
  fallback?: React.ReactNode;
}) {
  return <>{condition(data) ? render(data) : (fallback ?? null)}</>;
}

// 44. Suspense-like loading pattern (manual)
function Ex44_Deferred({ ready, fallback, children }: { ready: boolean; fallback: React.ReactNode; children: React.ReactNode }) {
  return <>{ready ? children : fallback}</>;
}

// 45. Guarded render — multiple conditions must ALL pass
function Ex45_AllGuards({
  guards,
  children,
  fallback,
}: {
  guards: boolean[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  if (!guards.every(Boolean)) return <>{fallback ?? null}</>;
  return <>{children}</>;
}

// 46. Conditional animation class
function Ex46_AnimatedItem({ visible, children }: { visible: boolean; children: React.ReactNode }) {
  return (
    <div style={{
      opacity: visible ? 1 : 0,
      transform: visible ? "translateY(0)" : "translateY(-8px)",
      transition: "opacity 0.3s, transform 0.3s",
    }}>
      {children}
    </div>
  );
}

// 47. Conditional portal target (render in place vs portal)
function Ex47_InlineOrPortal({
  inline,
  children,
}: {
  inline: boolean;
  children: React.ReactNode;
}) {
  // When inline=true, renders in place; when false, would use ReactDOM.createPortal
  // Simplified here to avoid DOM dependency
  return <div style={{ position: inline ? "static" : "fixed", top: inline ? undefined : 0, left: inline ? undefined : 0, zIndex: inline ? undefined : 999 }}>{children}</div>;
}

// 48. Multi-flag dashboard section visibility
const SECTIONS = ["overview", "analytics", "settings", "billing"] as const;
type Section = (typeof SECTIONS)[number];
function Ex48_Dashboard({ visibleSections }: { visibleSections: Section[] }) {
  const isVisible = (s: Section) => visibleSections.includes(s);
  return (
    <div style={{ display: "flex", gap: 8 }}>
      {isVisible("overview")   && <div style={{ padding: 12, background: "#eaf" }}>Overview</div>}
      {isVisible("analytics")  && <div style={{ padding: 12, background: "#fea" }}>Analytics</div>}
      {isVisible("settings")   && <div style={{ padding: 12, background: "#afe" }}>Settings</div>}
      {isVisible("billing")    && <div style={{ padding: 12, background: "#fae" }}>Billing</div>}
    </div>
  );
}

// 49. Conditional wrapper — wraps children only when condition is true
function Ex49_ConditionalWrapper({
  wrap,
  wrapper,
  children,
}: {
  wrap: boolean;
  wrapper: (ch: React.ReactNode) => React.ReactElement;
  children: React.ReactNode;
}) {
  return wrap ? wrapper(children) : <>{children}</>;
}
function Ex49_App() {
  const [bordered, setBordered] = useState(false);
  return (
    <div>
      <label><input type="checkbox" checked={bordered} onChange={() => setBordered((v) => !v)} /> Border</label>
      <Ex49_ConditionalWrapper
        wrap={bordered}
        wrapper={(ch) => <div style={{ border: "2px solid #3498db", padding: 8 }}>{ch}</div>}
      >
        <p>This content may or may not be wrapped.</p>
      </Ex49_ConditionalWrapper>
    </div>
  );
}

// 50. Full showcase
export function App() {
  const [role, setRole] = useState<Role>("viewer");
  const [status, setStatus] = useState<Status>("idle");
  const [showModal, setShowModal] = useState(false);

  const simulate = () => {
    setStatus("loading");
    setTimeout(() => setStatus(Math.random() > 0.3 ? "success" : "error"), 1200);
  };

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Examples 1.4 — Conditional Rendering</h1>

      <h2>Basic</h2>
      <Ex02_CountBadge count={5} /><Ex02_CountBadge count={0} />
      <Ex03_OnlineStatus online={true} />
      <Ex05_RoleBadge role={role} />
      <select value={role} onChange={(e) => setRole(e.target.value as Role)} style={{ marginLeft: 8 }}>
        <option value="admin">Admin</option><option value="editor">Editor</option><option value="viewer">Viewer</option>
      </select>
      <Ex06_WarningBanner visible={role === "viewer"} message="Read-only mode" />
      <Ex07_Toggle />

      <h2>Intermediate</h2>
      <Ex14_StatusPanel status={status} message={status === "success" ? "Done!" : "Failed"} />
      <button onClick={simulate}>Simulate Fetch</button>
      <Ex16_AdminOnly role={role}><p style={{ color: "red" }}>Admin panel (only visible to admins)</p></Ex16_AdminOnly>
      <Ex26_ScoreBadge score={85} />

      <h2>Nested</h2>
      <Ex27_StatusIcon status={status} />
      <Ex29_DynamicForm />
      <Ex30_App />
      <Ex31_App />
      <Ex32_Wizard />
      <Ex38_Accordion />

      <h2>Advanced</h2>
      <Ex39_ShapeInfo shape={{ kind: "circle", radius: 5 }} />
      <Ex40_DashCard type="metric" label="Users" value={1250} unit="k" />
      <Ex40_DashCard type="alert" message="Low disk space" severity="warn" />
      <Ex40_DashCard type="progress" label="Upload" percent={67} />
      <Ex41_UserStatus online={true} typing={false} away={false} />
      <Ex42_PriorityRender warning="Check your settings" />
      <Ex48_Dashboard visibleSections={["overview", "analytics"]} />
      <Ex49_App />
    </div>
  );
}
