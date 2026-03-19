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

export function App() {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Exercise 1: JSX and Rendering</h1>
      <PageHeader/>
      <ExpressionsDemo/>
      {
      /* TODO 6: Render all five components below in order:
          PageHeader, ExpressionsDemo, SpreadDemo, FragmentsDemo, SkillsList
          Separate each with an <hr /> element */}
    </div>
  );
}
