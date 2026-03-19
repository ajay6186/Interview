# JSX - Interview Q&A

---

### Q1: What is JSX?
**A:** JSX stands for JavaScript XML. It is a syntax extension for JavaScript that lets you write HTML-like markup inside JavaScript files. JSX is not valid JavaScript -- it must be compiled (typically by Babel or the TypeScript compiler) into regular function calls. It makes React component code more readable by colocating markup with logic.

---

### Q2: Why do we use JSX in React?
**A:** JSX provides a familiar, declarative syntax for describing UI structure. It allows you to embed JavaScript expressions directly in the markup using `{}`, making dynamic content easy to express. While you *can* write React without JSX using `React.createElement()`, JSX is far more readable, less verbose, and is the standard in the React ecosystem.

---

### Q3: Is JSX mandatory in React?
**A:** No. JSX is syntactic sugar for `React.createElement(type, props, ...children)`. You can write React entirely without JSX by calling `createElement` directly. However, JSX is strongly recommended because it is more concise, readable, and virtually all React tooling, documentation, and community code uses it.

```jsx
// JSX
const el = <h1 className="title">Hello</h1>;

// Without JSX
const el = React.createElement('h1', { className: 'title' }, 'Hello');
```

---

### Q4: What are the differences between JSX and HTML?
**A:** Key differences: (1) `class` becomes `className`, (2) `for` becomes `htmlFor`, (3) attributes use camelCase (`onClick`, `tabIndex`, `onChange`), (4) self-closing tags must have a slash (`<img />`, `<br />`), (5) JSX must return a single root element (or use fragments), (6) inline styles use objects with camelCase properties, not strings, and (7) JSX allows embedding JavaScript expressions with `{}`.

---

### Q5: Why does JSX use `className` instead of `class`?
**A:** `class` is a reserved keyword in JavaScript (used for class declarations). Since JSX is JavaScript under the hood, using `class` as an attribute would create a conflict. React uses `className` to map to the DOM's `element.className` property. This applies to other reserved words too -- `for` becomes `htmlFor`.

---

### Q6: How do you embed JavaScript expressions in JSX?
**A:** Wrap any valid JavaScript expression in curly braces `{}`. You can use variables, function calls, ternary operators, array methods, and more. Note that *statements* (like `if`, `for`, `switch`) cannot be used directly inside `{}` -- only expressions that return a value.

```jsx
const name = "World";
return (
  <div>
    <h1>Hello, {name}!</h1>
    <p>{2 + 2}</p>
    <p>{items.length > 0 ? 'Has items' : 'Empty'}</p>
  </div>
);
```

---

### Q7: How does JSX get compiled?
**A:** Babel (or TypeScript) transforms JSX into JavaScript function calls. With the **classic** transform, `<div>Hello</div>` becomes `React.createElement('div', null, 'Hello')`, which requires `React` to be in scope. With the **new JSX transform** (React 17+), it becomes `_jsx('div', { children: 'Hello' })`, automatically importing from `react/jsx-runtime` -- no need to import React.

---

### Q8: What are React Fragments?
**A:** Fragments let you group multiple elements without adding an extra DOM node. Instead of wrapping children in a `<div>`, use `<React.Fragment>...</React.Fragment>` or the shorthand `<>...</>`. This keeps the DOM clean and avoids unnecessary wrapper elements that can break CSS layouts (like flexbox or grid).

```jsx
return (
  <>
    <h1>Title</h1>
    <p>Content</p>
  </>
);
```

---

### Q9: Why do Fragments exist? What problem do they solve?
**A:** JSX requires a single root element. Before fragments, developers wrapped siblings in a `<div>`, which added meaningless DOM nodes, could break CSS layouts (flex, grid, table rows), and increased DOM depth. Fragments solve this by grouping elements without rendering any extra markup.

---

### Q10: When should you use `<React.Fragment>` over the shorthand `<>`?
**A:** Use the full `<React.Fragment>` syntax when you need to pass a `key` prop, which is required when rendering fragments inside a list. The shorthand `<>...</>` does not support any props.

```jsx
{items.map(item => (
  <React.Fragment key={item.id}>
    <dt>{item.term}</dt>
    <dd>{item.definition}</dd>
  </React.Fragment>
))}
```

---

### Q11: What are spread attributes in JSX?
**A:** You can use the JavaScript spread operator `{...obj}` to pass all properties of an object as individual props. This is useful for forwarding props or when working with dynamic prop objects. Be careful not to spread unnecessary or unrecognized props onto DOM elements, as React will warn.

```jsx
const buttonProps = { type: 'submit', disabled: true, onClick: handleClick };
return <button {...buttonProps}>Submit</button>;
```

---

### Q12: How do you apply inline styles in JSX?
**A:** Inline styles in JSX use a JavaScript object with camelCase property names, not a CSS string. The `style` attribute accepts an object where keys are camelCased CSS properties and values are strings (or numbers for pixel values).

```jsx
const styles = {
  backgroundColor: 'blue',
  fontSize: '16px',
  padding: 10 // interpreted as '10px'
};
return <div style={styles}>Styled</div>;

// Or inline:
return <div style={{ color: 'red', marginTop: 20 }}>Red text</div>;
```

---

### Q13: How do you do conditional rendering in JSX?
**A:** Common patterns include: (1) **ternary operator** for if/else, (2) **logical AND `&&`** for show/hide, (3) **early return** in the component body. Avoid using `&&` with numbers on the left side (`count && <Component />`) because `0` is falsy but renders as `"0"` in React.

```jsx
// Ternary
{isLoggedIn ? <Dashboard /> : <Login />}

// Logical AND
{showBanner && <Banner />}

// Early return
if (isLoading) return <Spinner />;
return <Content />;
```

---

### Q14: How do you write comments in JSX?
**A:** Inside JSX markup, use JavaScript block comments wrapped in curly braces: `{/* comment */}`. Regular `//` comments work outside of JSX expressions or on their own line within a curly brace block. HTML-style `<!-- -->` comments do not work in JSX.

```jsx
return (
  <div>
    {/* This is a JSX comment */}
    <h1>Title</h1>
    {
      // This also works (line comment inside expression)
    }
  </div>
);
```

---

### Q15: Can you return multiple elements from a component without a wrapper?
**A:** Yes, using Fragments (`<>...</>` or `<React.Fragment>...</React.Fragment>`). You can also return an array of elements with keys, though this is less common and less readable:

```jsx
// Array (requires keys)
return [
  <h1 key="title">Title</h1>,
  <p key="body">Body</p>
];
```

---

### Q16: What happens if you forget to close a JSX tag?
**A:** JSX is stricter than HTML -- every tag must be properly closed. Self-closing tags like `<img>`, `<br>`, and `<input>` must use `<img />`, `<br />`, `<input />`. Forgetting to close a tag results in a compilation error from Babel or TypeScript, and your code will not build.

---

### Q17: How do you render a list in JSX?
**A:** Use `Array.map()` to transform data into JSX elements. Each element in the list must have a unique `key` prop for React's reconciliation algorithm. The key should be a stable identifier from the data, not the array index (unless the list is static and will never reorder).

```jsx
const fruits = ['Apple', 'Banana', 'Cherry'];
return (
  <ul>
    {fruits.map(fruit => (
      <li key={fruit}>{fruit}</li>
    ))}
  </ul>
);
```

---

### Q18: What is the dangerouslySetInnerHTML attribute?
**A:** `dangerouslySetInnerHTML` is React's replacement for setting `innerHTML`. It takes an object with a `__html` key. The name is intentionally scary to remind developers that injecting raw HTML is a security risk (XSS). Only use it with sanitized, trusted content.

```jsx
const markup = { __html: '<strong>Bold text</strong>' };
return <div dangerouslySetInnerHTML={markup} />;
```

---

### [BONUS] Q19: What is the new JSX Transform (React 17+)?
**A:** The new JSX transform, introduced in React 17, compiles JSX to `_jsx()` calls from `react/jsx-runtime` instead of `React.createElement()`. The key benefit is that you no longer need to `import React from 'react'` in every file that uses JSX. The compiler automatically adds the import. This also enables minor performance improvements and simplifies the JSX output.

```jsx
// Old transform (classic) - requires React in scope
import React from 'react';
const el = React.createElement('div', null, 'Hello');

// New transform - automatic import
import { jsx as _jsx } from 'react/jsx-runtime';
const el = _jsx('div', { children: 'Hello' });
```

---

### [BONUS] Q20: What is the JSX runtime and how does it differ from `createElement`?
**A:** The JSX runtime (`react/jsx-runtime`) exports `jsx`, `jsxs` (for static children), and `Fragment`. Unlike `createElement`, children are passed as a prop in the props object rather than as separate arguments, and `key` is extracted as a separate argument. This enables better performance optimizations and is the default compilation target in modern React tooling. You never call these functions directly -- the compiler handles it.

---

### [BONUS] Q21: How does TypeScript handle JSX?
**A:** TypeScript supports JSX natively through its `jsx` compiler option. Settings include `"react"` (classic transform to `React.createElement`), `"react-jsx"` (new transform to `_jsx`), and `"preserve"` (outputs `.jsx` for another tool to handle). TypeScript type-checks JSX elements, props, and children using the `JSX.IntrinsicElements` interface for HTML elements and component prop types for custom components.
