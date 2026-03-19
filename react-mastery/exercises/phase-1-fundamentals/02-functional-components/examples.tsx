import React from "react";

// ============================================================
// Examples 1.2 — Functional Components (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ============================================================
// BASIC — minimal components, typed props, defaults (1–13)
// ============================================================

// 1. Component with no props
function Ex01_NoPropsBanner() {
  return <div style={{ background: "#3498db", color: "#fff", padding: 12 }}>Welcome!</div>;
}

// 2. Single string prop
function Ex02_StringProp({ title }: { title: string }) {
  return <h2>{title}</h2>;
}

// 3. Single number prop
function Ex03_NumberProp({ count }: { count: number }) {
  return <p>Count: {count}</p>;
}

// 4. Boolean prop — controls rendering style
function Ex04_BooleanProp({ active }: { active: boolean }) {
  return <span style={{ color: active ? "green" : "gray" }}>{active ? "Active" : "Inactive"}</span>;
}

// 5. Multiple primitive props
function Ex05_MultipleProps({ name, age, city }: { name: string; age: number; city: string }) {
  return <p>{name}, age {age}, from {city}</p>;
}

// 6. Optional prop — rendered only when present
function Ex06_OptionalProp({ label, hint }: { label: string; hint?: string }) {
  return (
    <div>
      <strong>{label}</strong>
      {hint && <small style={{ color: "gray", marginLeft: 8 }}>{hint}</small>}
    </div>
  );
}

// 7. Default prop value
function Ex07_DefaultProp({ greeting = "Hello", name }: { greeting?: string; name: string }) {
  return <p>{greeting}, {name}!</p>;
}

// 8. Array prop — rendered as list
function Ex08_ArrayProp({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item) => <li key={item}>{item}</li>)}
    </ul>
  );
}

// 9. Object prop
type Address = { street: string; city: string; zip: string };
function Ex09_ObjectProp({ address }: { address: Address }) {
  return <p>{address.street}, {address.city} {address.zip}</p>;
}

// 10. Function prop (event callback)
function Ex10_FunctionProp({ onClick, label }: { onClick: () => void; label: string }) {
  return <button onClick={onClick}>{label}</button>;
}

// 11. children prop (React.ReactNode)
function Ex11_ChildrenProp({ children }: { children: React.ReactNode }) {
  return <div style={{ border: "1px solid #ccc", padding: 12 }}>{children}</div>;
}

// 12. ReactNode vs ReactElement — ReactNode is broader
function Ex12_ReactNodeProp({ slot }: { slot: React.ReactNode }) {
  return <aside>{slot}</aside>;
}

// 13. Component with computed value inside body
function Ex13_ComputedInBody({ price, taxRate = 0.1 }: { price: number; taxRate?: number }) {
  const total = (price * (1 + taxRate)).toFixed(2);
  return <p>Price: ${price.toFixed(2)} → With tax: ${total}</p>;
}

// ============================================================
// INTERMEDIATE — type aliases, generics, early returns, memos (14–26)
// ============================================================

// 14. Type alias for props
type BadgeProps = { text: string; color: string };
function Ex14_TypeAlias({ text, color }: BadgeProps) {
  return (
    <span style={{ background: color, color: "#fff", padding: "2px 8px", borderRadius: 12, fontSize: 12 }}>
      {text}
    </span>
  );
}

// 15. Interface for props (same capability, different syntax)
interface AvatarProps {
  src: string;
  alt: string;
  size?: number;
}
function Ex15_InterfaceProps({ src, alt, size = 48 }: AvatarProps) {
  return <img src={src} alt={alt} width={size} height={size} style={{ borderRadius: "50%" }} />;
}

// 16. Union prop — controls appearance
type Variant = "info" | "success" | "warning" | "error";
const variantColors: Record<Variant, string> = {
  info: "#3498db", success: "#27ae60", warning: "#f39c12", error: "#e74c3c",
};
function Ex16_UnionProp({ variant, message }: { variant: Variant; message: string }) {
  return (
    <div style={{ background: variantColors[variant], color: "#fff", padding: 10, borderRadius: 4 }}>
      {message}
    </div>
  );
}

// 17. Discriminated union props
type ButtonProps =
  | { kind: "primary"; label: string; onClick: () => void }
  | { kind: "link";    label: string; href: string };
function Ex17_DiscriminatedProps(props: ButtonProps) {
  if (props.kind === "link") return <a href={props.href}>{props.label}</a>;
  return <button onClick={props.onClick}>{props.label}</button>;
}

// 18. Generic component
function Ex18_GenericList<T extends { id: number; label: string }>({ items }: { items: T[] }) {
  return (
    <ul>
      {items.map((item) => <li key={item.id}>{item.label}</li>)}
    </ul>
  );
}

// 19. Component that returns null (renders nothing)
function Ex19_ReturnsNull({ show }: { show: boolean }) {
  if (!show) return null;
  return <p>Now you see me!</p>;
}

// 20. Component with early return for loading state
function Ex20_EarlyReturn({ loading, text }: { loading: boolean; text: string }) {
  if (loading) return <p>Loading…</p>;
  return <p>{text}</p>;
}

// 21. Component returning an array of elements
function Ex21_ReturnsArray() {
  return (
    <>
      <li>Item 1</li>
      <li>Item 2</li>
      <li>Item 3</li>
    </>
  );
}

// 22. Memoized component (React.memo)
const Ex22_MemoComponent = React.memo(function Stat({ label, value }: { label: string; value: number }) {
  return <div><strong>{label}:</strong> {value}</div>;
});

// 23. displayName for debugging
function Ex23_WithDisplayName(props: { text: string }) {
  return <span>{props.text}</span>;
}
Ex23_WithDisplayName.displayName = "LabeledText";

// 24. Component with defaultProps-style pattern via destructuring
function Ex24_DefaultsViaDestructure({
  size = "md",
  rounded = false,
  children,
}: {
  size?: "sm" | "md" | "lg";
  rounded?: boolean;
  children: React.ReactNode;
}) {
  const padding = { sm: 4, md: 8, lg: 16 }[size];
  return (
    <div style={{ padding, borderRadius: rounded ? 8 : 0, border: "1px solid #ccc" }}>
      {children}
    </div>
  );
}

// 25. Props spreading onto a child component
type UserCardProps = { name: string; email: string; role: string };
function Ex25_UserCard({ name, email, role }: UserCardProps) {
  return <div><strong>{name}</strong> — {email} ({role})</div>;
}
const userData: UserCardProps = { name: "Alice", email: "alice@ex.com", role: "Admin" };
function Ex25_Wrapper() {
  return <Ex25_UserCard {...userData} />;
}

// 26. Component accepting className and style for external customisation
function Ex26_Customisable({
  className,
  style,
  children,
}: {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}) {
  return <div className={className} style={{ padding: 8, ...style }}>{children}</div>;
}

// ============================================================
// NESTED — composition, layouts, slot patterns (27–38)
// ============================================================

// 27. Basic composition (Header + Main + Footer)
function Ex27_Header({ title }: { title: string }) {
  return <header style={{ background: "#2c3e50", color: "#fff", padding: 12 }}><h1>{title}</h1></header>;
}
function Ex27_Footer({ year = new Date().getFullYear() }: { year?: number }) {
  return <footer style={{ textAlign: "center", padding: 8, color: "#666" }}>© {year}</footer>;
}
function Ex27_Layout({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: 200 }}>
      <Ex27_Header title={title} />
      <main style={{ flex: 1, padding: 16 }}>{children}</main>
      <Ex27_Footer />
    </div>
  );
}

// 28. Card with named slots via props
function Ex28_Card({
  header,
  body,
  footer,
}: {
  header: React.ReactNode;
  body: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden" }}>
      <div style={{ background: "#f5f5f5", padding: "8px 12px" }}>{header}</div>
      <div style={{ padding: 12 }}>{body}</div>
      {footer && <div style={{ borderTop: "1px solid #ddd", padding: "8px 12px" }}>{footer}</div>}
    </div>
  );
}

// 29. Compound component skeleton — parent knows about children by convention
function Ex29_Tabs({ children }: { children: React.ReactNode }) {
  return <div className="tabs">{children}</div>;
}
function Ex29_Tab({ label, active = false }: { label: string; active?: boolean }) {
  return <button style={{ fontWeight: active ? "bold" : "normal", borderBottom: active ? "2px solid blue" : "none" }}>{label}</button>;
}
function Ex29_TabPanel({ children }: { children: React.ReactNode }) {
  return <div style={{ padding: 12 }}>{children}</div>;
}

// 30. List with dedicated item component
type Product = { id: number; name: string; price: number };
function Ex30_ProductItem({ product }: { product: Product }) {
  return (
    <li style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #eee" }}>
      <span>{product.name}</span>
      <strong>${product.price.toFixed(2)}</strong>
    </li>
  );
}
function Ex30_ProductList({ products }: { products: Product[] }) {
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {products.map((p) => <Ex30_ProductItem key={p.id} product={p} />)}
    </ul>
  );
}

// 31. Table with typed row component
type Employee = { id: number; name: string; department: string; salary: number };
function Ex31_EmployeeRow({ employee }: { employee: Employee }) {
  return (
    <tr>
      <td>{employee.name}</td>
      <td>{employee.department}</td>
      <td>${employee.salary.toLocaleString()}</td>
    </tr>
  );
}
function Ex31_EmployeeTable({ employees }: { employees: Employee[] }) {
  return (
    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead><tr><th>Name</th><th>Dept</th><th>Salary</th></tr></thead>
      <tbody>
        {employees.map((e) => <Ex31_EmployeeRow key={e.id} employee={e} />)}
      </tbody>
    </table>
  );
}

// 32. Tree node component (recursive)
type TreeNode = { label: string; children?: TreeNode[] };
function Ex32_TreeNode({ node, depth = 0 }: { node: TreeNode; depth?: number }) {
  return (
    <div style={{ paddingLeft: depth * 16 }}>
      <span>{'—'.repeat(depth)} {node.label}</span>
      {node.children?.map((child) => (
        <Ex32_TreeNode key={child.label} node={child} depth={depth + 1} />
      ))}
    </div>
  );
}

// 33. Wrapper component that injects extra props
function Ex33_WithBorder({ borderColor = "#ccc", children }: { borderColor?: string; children: React.ReactNode }) {
  return (
    <div style={{ border: `2px solid ${borderColor}`, padding: 12, borderRadius: 4 }}>
      {children}
    </div>
  );
}

// 34. Section component with heading level
function Ex34_Section({
  level = 2,
  title,
  children,
}: {
  level?: 1 | 2 | 3 | 4;
  title: string;
  children: React.ReactNode;
}) {
  const Tag = `h${level}` as "h1" | "h2" | "h3" | "h4";
  return (
    <section>
      <Tag>{title}</Tag>
      {children}
    </section>
  );
}

// 35. Form field wrapper with label + input
function Ex35_FormField({
  id,
  label,
  children,
  error,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
  error?: string;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label htmlFor={id} style={{ display: "block", marginBottom: 4, fontWeight: "bold" }}>{label}</label>
      {children}
      {error && <p style={{ color: "red", margin: "4px 0 0", fontSize: 12 }}>{error}</p>}
    </div>
  );
}

// 36. Page component composed from smaller pieces
function Ex36_Page() {
  const products: Product[] = [
    { id: 1, name: "Keyboard", price: 79.99 },
    { id: 2, name: "Mouse", price: 39.99 },
  ];
  return (
    <Ex27_Layout title="Product Catalog">
      <Ex28_Card
        header={<h3>Products</h3>}
        body={<Ex30_ProductList products={products} />}
        footer={<small>{products.length} items</small>}
      />
    </Ex27_Layout>
  );
}

// 37. Notification stack
type Notification = { id: number; message: string; variant: Variant };
function Ex37_NotificationItem({ notification }: { notification: Notification }) {
  return <Ex16_UnionProp variant={notification.variant} message={notification.message} />;
}
function Ex37_NotificationStack({ notifications }: { notifications: Notification[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {notifications.map((n) => <Ex37_NotificationItem key={n.id} notification={n} />)}
    </div>
  );
}

// 38. Stats dashboard grid
type Stat = { label: string; value: number };
function Ex38_StatCard({ stat }: { stat: Stat }) {
  return (
    <div style={{ padding: 16, background: "#f8f9fa", borderRadius: 8, textAlign: "center" }}>
      <p style={{ fontSize: 28, fontWeight: "bold", margin: 0 }}>{stat.value.toLocaleString()}</p>
      <p style={{ color: "#666", margin: "4px 0 0" }}>{stat.label}</p>
    </div>
  );
}
function Ex38_StatsGrid({ stats }: { stats: Stat[] }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: 12 }}>
      {stats.map((s) => <Ex38_StatCard key={s.label} stat={s} />)}
    </div>
  );
}

// ============================================================
// ADVANCED — generics, polymorphic, utility types, rest props (39–50)
// ============================================================

// 39. Generic component with constraint
function Ex39_KeyValueList<T extends Record<string, string | number>>({ data }: { data: T }) {
  return (
    <dl>
      {(Object.entries(data) as [string, string | number][]).map(([k, v]) => (
        <React.Fragment key={k}>
          <dt style={{ fontWeight: "bold" }}>{k}</dt>
          <dd>{v}</dd>
        </React.Fragment>
      ))}
    </dl>
  );
}

// 40. Polymorphic "as" prop (render as any HTML tag)
type PolymorphicProps<T extends React.ElementType> = {
  as?: T;
  children: React.ReactNode;
} & React.ComponentPropsWithoutRef<T>;

function Ex40_Polymorphic<T extends React.ElementType = "div">({
  as,
  children,
  ...rest
}: PolymorphicProps<T>) {
  const Component = as ?? "div";
  return <Component {...rest}>{children}</Component>;
}

// 41. ComponentPropsWithoutRef — extend native element props
type InputProps = React.ComponentPropsWithoutRef<"input"> & { label: string };
function Ex41_ExtendedInput({ label, id, ...rest }: InputProps) {
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input id={id} {...rest} />
    </div>
  );
}

// 42. PropsWithChildren utility type
function Ex42_PropsWithChildren({ title, children }: React.PropsWithChildren<{ title: string }>) {
  return (
    <section>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

// 43. forwardRef — expose internal DOM ref
const Ex43_FancyInput = React.forwardRef<HTMLInputElement, { placeholder?: string }>(
  ({ placeholder }, ref) => (
    <input
      ref={ref}
      placeholder={placeholder}
      style={{ border: "2px solid #3498db", borderRadius: 4, padding: 6 }}
    />
  )
);
Ex43_FancyInput.displayName = "FancyInput";

// 44. Component that accepts render prop
function Ex44_RenderProp<T>({
  data,
  render,
}: {
  data: T[];
  render: (item: T, index: number) => React.ReactNode;
}) {
  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {data.map((item, i) => <li key={i}>{render(item, i)}</li>)}
    </ul>
  );
}

// 45. Omit to block certain HTML props
type SafeLinkProps = Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
  to: string;
};
function Ex45_SafeLink({ to, children, ...rest }: SafeLinkProps) {
  // Forces using "to" prop instead of raw "href"
  return <a href={to} {...rest}>{children}</a>;
}

// 46. Pick to allow only specific HTML props
type LimitedButtonProps = Pick<React.ButtonHTMLAttributes<HTMLButtonElement>, "onClick" | "disabled" | "type"> & {
  label: string;
};
function Ex46_LimitedButton({ label, ...rest }: LimitedButtonProps) {
  return <button {...rest}>{label}</button>;
}

// 47. Required<T> to make all props mandatory
type PartialConfig = { host?: string; port?: number };
type FullConfig = Required<PartialConfig>;
function Ex47_FullConfigDisplay({ host, port }: FullConfig) {
  return <code>{host}:{port}</code>;
}

// 48. Discriminated union — component behaves entirely differently per variant
type AlertProps =
  | { type: "toast"; message: string; duration: number }
  | { type: "modal"; title: string; body: string; onClose: () => void };

function Ex48_AlertComponent(props: AlertProps) {
  if (props.type === "toast")
    return <div style={{ position: "fixed", bottom: 16, right: 16, background: "#333", color: "#fff", padding: "8px 16px" }}>{props.message}</div>;
  return (
    <div style={{ background: "rgba(0,0,0,0.5)", position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ background: "#fff", padding: 24, borderRadius: 8 }}>
        <h3>{props.title}</h3>
        <p>{props.body}</p>
        <button onClick={props.onClose}>Close</button>
      </div>
    </div>
  );
}

// 49. Strict children — only accept a single ReactElement child
function Ex49_SingleChild({ children }: { children: React.ReactElement }) {
  return React.cloneElement(children, { "data-wrapped": "true" } as object);
}

// 50. Full composition showcase
export function App() {
  const tree: TreeNode = {
    label: "Root",
    children: [
      { label: "Branch A", children: [{ label: "Leaf A1" }, { label: "Leaf A2" }] },
      { label: "Branch B" },
    ],
  };

  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 800, margin: "0 auto", padding: 20 }}>
      <h1>Examples 1.2 — Functional Components</h1>

      <Ex27_Layout title="Demo App">
        <Ex38_StatsGrid stats={[{ label: "Users", value: 1250 }, { label: "Sales", value: 847 }, { label: "Revenue", value: 52400 }]} />

        <Ex28_Card
          header={<strong>Notifications</strong>}
          body={
            <Ex37_NotificationStack notifications={[
              { id: 1, message: "Build passed ✓", variant: "success" },
              { id: 2, message: "Disk usage high", variant: "warning" },
            ]} />
          }
        />

        <Ex34_Section level={3} title="File Tree">
          <Ex32_TreeNode node={tree} />
        </Ex34_Section>

        <Ex34_Section level={3} title="Key-Value List">
          <Ex39_KeyValueList data={{ Name: "Alice", Role: "Admin", Score: 95 }} />
        </Ex34_Section>

        <Ex34_Section level={3} title="Polymorphic Component">
          <Ex40_Polymorphic as="p" style={{ color: "gray" }}>
            Rendered as a paragraph element.
          </Ex40_Polymorphic>
          <Ex40_Polymorphic as="button" onClick={() => alert("clicked")}>
            Rendered as a button.
          </Ex40_Polymorphic>
        </Ex34_Section>

        <Ex34_Section level={3} title="Render Prop">
          <Ex44_RenderProp
            data={["React", "TypeScript", "Node.js"]}
            render={(skill, i) => <span><strong>{i + 1}.</strong> {skill}</span>}
          />
        </Ex34_Section>

        <Ex47_FullConfigDisplay host="localhost" port={3000} />
      </Ex27_Layout>
    </div>
  );
}
