import React, { Fragment } from "react";

// ============================================================
// Exercise 1: JSX and Rendering
// ============================================================
// In this exercise you will learn about JSX syntax, embedding
// expressions, spread attributes, fragments, and list rendering.
//
// Instructions:
// 1. Create a nested JSX structure for a page header
// 2. Use JavaScript expressions inside JSX (variables, calls, templates)
// 3. Use the spread operator to pass attributes to an element
// 4. Use both <Fragment> and <> short syntax
// 5. Render an array of items using .map() with proper keys
// ============================================================

const user = {
  firstName: "Jane",
  lastName: "Doe",
  role: "Senior Developer",
  yearsOfExperience: 7,
};

const skills = ["React", "TypeScript", "Node.js", "GraphQL", "CSS"];

function formatName(first: string, last: string): string {
  return `${first} ${last}`;
}

const linkProps = {
  href: "https://react.dev",
  target: "_blank" as const,
  rel: "noopener noreferrer",
  className: "docs-link",
};

// TODO 1: Create a PageHeader component that returns nested JSX.
// It should render:
//   <header>
//     <nav> with a <ul> containing 3 <li> items: "Home", "About", "Contact"
//     <h2> with the text "Welcome to JSX Mastery"
//   </header>
// function PageHeader() { ... }

function PageHeader() { 
   return (   
   <header>
    <nav> 
          <ul> 
            <li>Home</li>
            <li>About</li>
            <li>Contact</li>
          </ul>
        </nav>
   </header>
   );
 }

// TODO 2: Create an ExpressionsDemo component that demonstrates
// JSX expressions. It should render a <section> containing:
//   - An <h3> with the title "User Profile"
//   - A <p> showing the user's full name using formatName()
//   - A <p> showing the user's role from the user object
//   - A <p> using a template literal: `Experience: ${yearsOfExperience} years`
//   - A <p> showing a computed value: yearsOfExperience * 12 + " months"
//   - A <p> that conditionally shows "Senior" if yearsOfExperience >= 5, else "Junior"

const user1 = {
    firstName: "Ajay",
    lastName: "Yadav",
    role: "Senior Developer",
    yearsOfExperience: 7,
};

function formateName(firstName: string, lastName: string) : string {
  return `${firstName} ${lastName}`;
}

function ExpressionsDemo() { 
  return (
    <section>
      <h3>User Profile</h3>
      <p><strong>Name: </strong>{formateName(user1.firstName, user1.lastName)}</p>
    </section>
  );
 }

// TODO 3: Create a SpreadDemo component that uses JSX spread attributes.
// It should render:
//   - An <a> element that receives all properties from linkProps via spread: {...linkProps}
//     with the text "React Documentation"
//   - A second <a> that spreads linkProps but overrides href to "https://typescriptlang.org"
//     with the text "TypeScript Documentation"
// function SpreadDemo() { ... }

// TODO 4: Create a FragmentsDemo component that demonstrates both fragment syntaxes.
// It should return a <Fragment> (long form, imported from React) containing:
//   - An <h3> "Fragment Demo"
//   - A <p> "This uses the explicit Fragment syntax"
//   - Then, inside a <div>, render a short-syntax fragment <> containing:
//       - A <strong> "Bold text"
//       - A <em> " and italic text"
//       - A <span> " side by side without a wrapper"
// function FragmentsDemo() { ... }

// TODO 5: Create a SkillsList component that renders the skills array.
// It should render:
//   - An <h3> "Skills"
//   - A <ul> where each skill from the skills array is rendered as an <li>
//   - Each <li> must have a unique key prop (use the skill string itself)
//   - Each <li> should show the index + 1 and the skill name, e.g., "1. React"
// function SkillsList() { ... }

// Examples
// 1. Static JSX — plain HTML-like structure
function Ex01_StaticHeading() {
  return <h1>Hello, World!</h1>;
}

// 2. String expression interpolation
const appName = "React Mastery";
function Ex02_StringExpression() {
  return <p>Welcome to {appName}!</p>
}

// 3. Number expression
const itemCount = 42;
function Ex03_NumberExpression() {
  return <p>Nuber Expression {itemCount}</p>
}

// 4. Arithmetic expression
function Ex04_ArithmeticExpression() {
  const price = 19.99;
  const qty = 3;
  return <p>Total: ${(price * qty).toFixed(2)}</p>;
}

// 5. Ternary inside JSX
function Ex05_TernaryExpression() {
  const isOnline = false;
  return <p>{isOnline ? "Online" : "Offline"}</p>
}

// 6. Function call in JSX
function formatDate(d: Date) {
  return d.toLocaleDateString("en-US");
}

function Ex06_FunctionCall() {
  return <p>Today Date : {formatDate(new Date())} </p>
}

// 7. className (not class)
function Ex07_ClassName() {
  return <button className="btn btn-primary">Click On</button>
}
//  color: "tomato", fontWeight: "bold", fontSize: 18 
// 8. Inline style object
function Ex08_InlineStyle() {
  return <p style={{color:"tomato", fontWeight: "bold", fontSize: 18}}>Styled text</p>
}

// 9. Self-closing tags
function Ex09_SelfClosing() {
  return (
    <div>
      <img src="https://via.placeholder.com/100" alt="placeholder"/>
      <br/>
      <hr/>
      <input type="text" placeholder="Type here"/>
    </div>
  )
}

// 10. Explicit Fragment (<Fragment>)
function Ex10_ExplicitFragment() {
  return (
    <Fragment>
      <h2>Tittle</h2>
      <p>Paragraph - no extra wrapper div.</p>
    </Fragment>
  );
}

// 11. Short fragment syntax (<>)
function Ex11_shortFragment() {
  return (
    <>
      <dt>Term</dt>
      <dd>Definition</dd>
    </>
  )
}

// 12. JSX comment (inside expression braces)

function Ex12_Comment() {
  return (
    <div>
      {/* This comment is invisible in the DOM */}
      <p>Visible text</p>
    </div>
  )
}

// 13. Rendering null / undefined / false — all produce nothing
function Ex13_NothingValues() {
  const show = false;
  return <div>
    {null}
    {undefined}
    {false}
    {show && <span>Never shown</span>}
    <span>Always shown</span>
  </div>
}

// 14. Spread attributes onto an element
const anchorDefaults = {
  targte: "_blank" as const,
  rel: "noopner noreferrer",
}
function Ex14_SpreadAttrs() {
  return <a {...anchorDefaults} href="https://react.dev">React Docs</a>
}

export function App() {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Exercise 1: JSX and Rendering</h1>
      {/* <PageHeader/>
      <ExpressionsDemo/> */}
      {
      /* TODO 6: Render all five components below in order:
          PageHeader, ExpressionsDemo, SpreadDemo, FragmentsDemo, SkillsList
          Separate each with an <hr /> element */}
          {/* <Ex01_StaticHeading/> */}
          {/* <Ex02_StringExpression/> */}
          {/* <Ex03_NumberExpression/> */}
          {/* <Ex04_ArithmeticExpression/> */}
          {/* <Ex05_TernaryExpression/> */}
          {/* <Ex06_FunctionCall/> */}
          {/* <Ex07_ClassName/> */}
          {/* <Ex08_InlineStyle/> */}
          {/* <Ex09_SelfClosing/> */}
          {/* <Ex10_ExplicitFragment/> */}
          {/* <Ex12_Comment/> */}
          {/* <Ex13_NothingValues/> */}
          <Ex14_SpreadAttrs/>
    </div>
  );
}
