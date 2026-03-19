import React, { Fragment } from "react";

// ============================================================
// Examples 1.1 — JSX and Rendering (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ============================================================
// BASIC — static JSX, expressions, attributes, fragments (1–13)
// ============================================================

// 1. Static JSX — plain HTML-like structure
function Ex01_StaticHeading() {
  return <h1>Hello, World!</h1>;
}

// 2. String expression interpolation
const appName = "React Mastery";
function Ex02_StringExpression() {
  return <p>Welcome to {appName}!</p>;
}

// 3. Number expression
const itemCount = 42;
function Ex03_NumberExpression() {
  return <p>You have {itemCount} notifications.</p>;
}

// 4. Arithmetic expression
function Ex04_ArithmeticExpression() {
  const price = 19.99;
  const qty = 3;
  return <p>Total: ${(price * qty).toFixed(2)}</p>;
}

// 5. Ternary inside JSX
function Ex05_TernaryExpression() {
  const isOnline = true;
  return <span>{isOnline ? "Online" : "Offline"}</span>;
}

// 6. Function call in JSX
function formatDate(d: Date) {
  return d.toLocaleDateString("en-US");
}
function Ex06_FunctionCall() {
  return <p>Today: {formatDate(new Date())}</p>;
}

// 7. className (not class)
function Ex07_ClassName() {
  return <button className="btn btn-primary">Click me</button>;
}

// 8. Inline style object
function Ex08_InlineStyle() {
  return (
    <p style={{ color: "tomato", fontWeight: "bold", fontSize: 18 }}>
      Styled text
    </p>
  );
}

// 9. Self-closing tags
function Ex09_SelfClosing() {
  return (
    <div>
      <img src="https://via.placeholder.com/100" alt="placeholder" />
      <br />
      <hr />
      <input type="text" placeholder="Type here" />
    </div>
  );
}

// 10. Explicit Fragment (<Fragment>)
function Ex10_ExplicitFragment() {
  return (
    <Fragment>
      <h2>Title</h2>
      <p>Paragraph — no extra wrapper div.</p>
    </Fragment>
  );
}

// 11. Short fragment syntax (<>)
function Ex11_ShortFragment() {
  return (
    <>
      <dt>Term</dt>
      <dd>Definition</dd>
    </>
  );
}

// 12. JSX comment (inside expression braces)
function Ex12_Comment() {
  return (
    <div>
      {/* This comment is invisible in the DOM */}
      <p>Visible text</p>
    </div>
  );
}

// 13. Rendering null / undefined / false — all produce nothing
function Ex13_NothingValues() {
  const show = false;
  return (
    <div>
      {null}
      {undefined}
      {false}
      {show && <span>Never shown</span>}
      <span>Always shown</span>
    </div>
  );
}

// ============================================================
// INTERMEDIATE — spread attrs, map+keys, computed props (14–26)
// ============================================================

// 14. Spread attributes onto an element
const anchorDefaults = {
  target: "_blank" as const,
  rel: "noopener noreferrer",
};
function Ex14_SpreadAttrs() {
  return <a {...anchorDefaults} href="https://react.dev">React Docs</a>;
}

// 15. Spread with override (later prop wins)
function Ex15_SpreadOverride() {
  const base = { href: "https://react.dev", className: "link" };
  return <a {...base} href="https://typescriptlang.org">TypeScript Docs</a>;
}

// 16. Computed className
function Ex16_ComputedClassName() {
  const isActive = true;
  return <li className={`item ${isActive ? "active" : ""}`}>Menu Item</li>;
}

// 17. Conditional attribute (disabled)
function Ex17_ConditionalAttr() {
  const isLoading = true;
  return <button disabled={isLoading}>{isLoading ? "Loading…" : "Submit"}</button>;
}

// 18. data-* attribute
function Ex18_DataAttr() {
  return <div data-testid="my-widget" data-version="2">Widget</div>;
}

// 19. aria-* attributes
function Ex19_AriaAttrs() {
  return (
    <button aria-label="Close dialog" aria-pressed={false}>
      ✕
    </button>
  );
}

// 20. Template literal in JSX
function Ex20_TemplateLiteral() {
  const user = { first: "Jane", last: "Doe" };
  return <h3>{`${user.first} ${user.last}`}</h3>;
}

// 21. .map() with key prop
const colors = ["Red", "Green", "Blue"];
function Ex21_MapWithKey() {
  return (
    <ul>
      {colors.map((color) => (
        <li key={color}>{color}</li>
      ))}
    </ul>
  );
}

// 22. .map() with object array — id as key
const fruits = [
  { id: 1, name: "Apple" },
  { id: 2, name: "Banana" },
  { id: 3, name: "Cherry" },
];
function Ex22_ObjectArrayKey() {
  return (
    <ul>
      {fruits.map((f) => (
        <li key={f.id}>{f.name}</li>
      ))}
    </ul>
  );
}

// 23. Rendering an array of JSX elements directly
function Ex23_ArrayOfElements() {
  const items = [<strong key="a">Bold</strong>, <em key="b"> Italic</em>];
  return <p>{items}</p>;
}

// 24. Multi-line JSX with parentheses
function Ex24_MultiLine() {
  return (
    <article>
      <header>
        <h2>Article Title</h2>
      </header>
      <section>
        <p>Article body goes here.</p>
      </section>
    </article>
  );
}

// 25. htmlFor on label (not "for")
function Ex25_HtmlFor() {
  return (
    <div>
      <label htmlFor="email">Email</label>
      <input id="email" type="email" />
    </div>
  );
}

// 26. Rendering a number 0 safely (avoid falsy render bug)
function Ex26_ZeroRender() {
  const count = 0;
  return (
    <p>
      {/* WRONG: count && <span>{count}</span> renders "0" */}
      {count > 0 && <span>Has items: {count}</span>}
      {/* RIGHT: explicit boolean guard */}
      {count === 0 && <span>Empty</span>}
    </p>
  );
}

// ============================================================
// NESTED — nested lists, tables, forms, layouts (27–38)
// ============================================================

// 27. Nested ul/li lists
const nav = [
  { label: "Docs", links: ["Getting Started", "API", "Examples"] },
  { label: "Community", links: ["Forums", "Discord", "GitHub"] },
];
function Ex27_NestedList() {
  return (
    <nav>
      {nav.map((section) => (
        <div key={section.label}>
          <strong>{section.label}</strong>
          <ul>
            {section.links.map((link) => (
              <li key={link}>{link}</li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

// 28. HTML table structure
const rows = [
  { name: "Alice", score: 95 },
  { name: "Bob", score: 87 },
];
function Ex28_Table() {
  return (
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Score</th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.name}>
            <td>{r.name}</td>
            <td>{r.score}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// 29. Form with multiple input types
function Ex29_Form() {
  return (
    <form>
      <fieldset>
        <legend>User Info</legend>
        <label htmlFor="uname">Name</label>
        <input id="uname" type="text" />
        <label htmlFor="uage">Age</label>
        <input id="uage" type="number" min={0} />
        <label htmlFor="urole">Role</label>
        <select id="urole">
          <option value="admin">Admin</option>
          <option value="viewer">Viewer</option>
        </select>
        <button type="submit">Save</button>
      </fieldset>
    </form>
  );
}

// 30. Navigation bar with active link state
const navLinks = ["Home", "About", "Services", "Contact"];
function Ex30_Navbar() {
  const active = "About";
  return (
    <header>
      <nav>
        <ul style={{ display: "flex", gap: 16, listStyle: "none" }}>
          {navLinks.map((link) => (
            <li key={link}>
              <a
                href={`#${link.toLowerCase()}`}
                style={{ fontWeight: link === active ? "bold" : "normal" }}
              >
                {link}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
}

// 31. Card grid layout
const cards = [
  { id: 1, title: "Card A", body: "Content A" },
  { id: 2, title: "Card B", body: "Content B" },
  { id: 3, title: "Card C", body: "Content C" },
];
function Ex31_CardGrid() {
  return (
    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
      {cards.map((c) => (
        <div key={c.id} style={{ border: "1px solid #ccc", padding: 16, borderRadius: 8, width: 160 }}>
          <h4>{c.title}</h4>
          <p>{c.body}</p>
        </div>
      ))}
    </div>
  );
}

// 32. Breadcrumb trail
const crumbs = ["Home", "Products", "Electronics", "Laptops"];
function Ex32_Breadcrumb() {
  return (
    <nav aria-label="breadcrumb">
      <ol style={{ display: "flex", gap: 4, listStyle: "none" }}>
        {crumbs.map((crumb, i) => (
          <li key={crumb}>
            {i > 0 && <span aria-hidden="true"> / </span>}
            {i < crumbs.length - 1 ? <a href="#">{crumb}</a> : <strong>{crumb}</strong>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// 33. Definition list
const glossary = [
  { term: "JSX", def: "JavaScript XML — syntax extension for React" },
  { term: "Props", def: "Read-only inputs passed to components" },
];
function Ex33_DefinitionList() {
  return (
    <dl>
      {glossary.map(({ term, def }) => (
        <Fragment key={term}>
          <dt><strong>{term}</strong></dt>
          <dd>{def}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

// 34. Sidebar + main layout
function Ex34_SidebarLayout() {
  return (
    <div style={{ display: "flex", gap: 16 }}>
      <aside style={{ width: 200, background: "#f0f0f0", padding: 12 }}>
        <p>Sidebar</p>
      </aside>
      <main style={{ flex: 1 }}>
        <h2>Main Content</h2>
        <p>Body goes here.</p>
      </main>
    </div>
  );
}

// 35. Tabs HTML skeleton (no state)
const tabs = ["Overview", "Reviews", "FAQ"];
function Ex35_TabsSkeleton() {
  return (
    <div>
      <div role="tablist" style={{ display: "flex", gap: 8 }}>
        {tabs.map((t) => (
          <button key={t} role="tab" aria-selected={t === "Overview"}>
            {t}
          </button>
        ))}
      </div>
      <div role="tabpanel">
        <p>Overview content</p>
      </div>
    </div>
  );
}

// 36. Nested fragments — no extra DOM nodes
function Ex36_NestedFragments() {
  return (
    <>
      <>
        <h2>Section A</h2>
        <p>Paragraph in A</p>
      </>
      <>
        <h2>Section B</h2>
        <p>Paragraph in B</p>
      </>
    </>
  );
}

// 37. Keyed Fragment (when key is needed on fragment)
const sections = [
  { id: "s1", label: "Alpha", content: "Alpha body" },
  { id: "s2", label: "Beta", content: "Beta body" },
];
function Ex37_KeyedFragment() {
  return (
    <dl>
      {sections.map(({ id, label, content }) => (
        <Fragment key={id}>
          <dt>{label}</dt>
          <dd>{content}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

// 38. Rendering SVG inline in JSX
function Ex38_InlineSVG() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
      <circle cx="20" cy="20" r="18" fill="#3498db" />
      <text x="20" y="25" textAnchor="middle" fill="white" fontSize="16">
        R
      </text>
    </svg>
  );
}

// ============================================================
// ADVANCED — dynamic tags, portals, polymorphic JSX (39–50)
// ============================================================

// 39. Dynamic heading level via variable tag
function Ex39_DynamicTag() {
  const level: 1 | 2 | 3 | 4 | 5 | 6 = 2;
  const Tag = `h${level}` as keyof JSX.IntrinsicElements;
  return <Tag>Dynamic H{level}</Tag>;
}

// 40. dangerouslySetInnerHTML (sanitized source)
function Ex40_InnerHTML() {
  const safeHtml = { __html: "<strong>Bold</strong> and <em>italic</em>" };
  return <p dangerouslySetInnerHTML={safeHtml} />;
}

// 41. Rendering JSX from a variable
function Ex41_JSXVariable() {
  const icon: React.ReactNode = <span aria-hidden="true">★</span>;
  return <p>Rating: {icon}{icon}{icon}</p>;
}

// 42. Passing a component as a prop (component injection)
type IconComponent = React.ComponentType<{ size: number }>;
function Ex42_ComponentProp({ Icon }: { Icon: IconComponent }) {
  return <div><Icon size={24} /></div>;
}

// 43. Spread rest props onto native element
type BoxProps = React.HTMLAttributes<HTMLDivElement> & { highlight?: boolean };
function Ex43_RestProps({ highlight, style, ...rest }: BoxProps) {
  return (
    <div
      style={{ background: highlight ? "yellow" : "transparent", ...style }}
      {...rest}
    />
  );
}

// 44. Composite key in list (no single unique id)
const events = [
  { date: "2024-01-01", type: "login" },
  { date: "2024-01-01", type: "logout" },
  { date: "2024-01-02", type: "login" },
];
function Ex44_CompositeKey() {
  return (
    <ul>
      {events.map((e) => (
        <li key={`${e.date}-${e.type}`}>{e.date}: {e.type}</li>
      ))}
    </ul>
  );
}

// 45. Rendering a list of heterogeneous elements via union data
type ListItem =
  | { kind: "text"; content: string }
  | { kind: "divider" }
  | { kind: "badge"; label: string; color: string };

const mixedItems: ListItem[] = [
  { kind: "text", content: "Item One" },
  { kind: "divider" },
  { kind: "badge", label: "NEW", color: "green" },
];

function Ex45_HeterogeneousList() {
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {mixedItems.map((item, i) => {
        if (item.kind === "divider") return <hr key={i} />;
        if (item.kind === "badge")
          return (
            <li key={i}>
              <span style={{ background: item.color, color: "#fff", padding: "2px 8px", borderRadius: 4 }}>
                {item.label}
              </span>
            </li>
          );
        return <li key={i}>{item.content}</li>;
      })}
    </ul>
  );
}

// 46. JSX spread with type narrowing on event handlers
function Ex46_TypedSpread() {
  const inputProps: React.InputHTMLAttributes<HTMLInputElement> = {
    type: "email",
    placeholder: "Enter email",
    required: true,
    autoComplete: "email",
  };
  return <input {...inputProps} />;
}

// 47. Rendering children passed as an array prop
function Ex47_ChildrenArray({ items }: { items: React.ReactNode[] }) {
  return (
    <ul>
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  );
}

// 48. Conditional rendering with multiple expressions in JSX
function Ex48_MultipleConditions() {
  const role = "admin";
  const isVerified = true;
  const hasPlan = false;
  return (
    <div>
      {role === "admin" && <span>Admin badge</span>}
      {isVerified && <span> ✓ Verified</span>}
      {hasPlan ? <span> Pro Plan</span> : <span> Free Plan</span>}
    </div>
  );
}

// 49. Building a style object dynamically
function Ex49_DynamicStyle() {
  const size = "large";
  const variant = "primary";
  const styles: Record<string, React.CSSProperties> = {
    small:  { padding: "4px 8px",   fontSize: 12 },
    medium: { padding: "8px 16px",  fontSize: 14 },
    large:  { padding: "12px 24px", fontSize: 16 },
  };
  const colors: Record<string, React.CSSProperties> = {
    primary:   { background: "#3498db", color: "#fff" },
    secondary: { background: "#95a5a6", color: "#fff" },
  };
  return (
    <button style={{ ...styles[size], ...colors[variant], border: "none", borderRadius: 4, cursor: "pointer" }}>
      Large Primary Button
    </button>
  );
}

// 50. Full page skeleton combining all JSX patterns
export function App() {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h1>Examples 1.1 — JSX &amp; Rendering</h1>

      <section><h2>Basic</h2>
        <Ex01_StaticHeading />
        <Ex02_StringExpression />
        <Ex03_NumberExpression />
        <Ex04_ArithmeticExpression />
        <Ex05_TernaryExpression />
        <Ex06_FunctionCall />
        <Ex07_ClassName />
        <Ex08_InlineStyle />
        <Ex09_SelfClosing />
        <Ex10_ExplicitFragment />
        <Ex11_ShortFragment />
        <Ex12_Comment />
        <Ex13_NothingValues />
      </section>

      <section><h2>Intermediate</h2>
        <Ex14_SpreadAttrs />
        <Ex15_SpreadOverride />
        <Ex16_ComputedClassName />
        <Ex17_ConditionalAttr />
        <Ex18_DataAttr />
        <Ex19_AriaAttrs />
        <Ex20_TemplateLiteral />
        <Ex21_MapWithKey />
        <Ex22_ObjectArrayKey />
        <Ex23_ArrayOfElements />
        <Ex24_MultiLine />
        <Ex25_HtmlFor />
        <Ex26_ZeroRender />
      </section>

      <section><h2>Nested</h2>
        <Ex27_NestedList />
        <Ex28_Table />
        <Ex29_Form />
        <Ex30_Navbar />
        <Ex31_CardGrid />
        <Ex32_Breadcrumb />
        <Ex33_DefinitionList />
        <Ex34_SidebarLayout />
        <Ex35_TabsSkeleton />
        <Ex36_NestedFragments />
        <Ex37_KeyedFragment />
        <Ex38_InlineSVG />
      </section>

      <section><h2>Advanced</h2>
        <Ex39_DynamicTag />
        <Ex40_InnerHTML />
        <Ex41_JSXVariable />
        <Ex42_ComponentProp Icon={({ size }) => <span style={{ fontSize: size }}>★</span>} />
        <Ex43_RestProps highlight>Highlighted box</Ex43_RestProps>
        <Ex44_CompositeKey />
        <Ex45_HeterogeneousList />
        <Ex46_TypedSpread />
        <Ex47_ChildrenArray items={["Apple", "Banana", "Cherry"]} />
        <Ex48_MultipleConditions />
        <Ex49_DynamicStyle />
      </section>
    </div>
  );
}
