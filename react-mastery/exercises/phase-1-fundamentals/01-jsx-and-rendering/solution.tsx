import React, { Fragment } from "react";

// ============================================================
// Exercise 1: JSX and Rendering (SOLUTION)
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

// SOLUTION 1: Nested JSX structure
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
      <h2>Welcome to JSX Mastery</h2>
    </header>
  );
}

// SOLUTION 2: Expressions in JSX
function ExpressionsDemo() {
  return (
    <section>
      <h3>User Profile</h3>
      <p><strong>Name:</strong> {formatName(user.firstName, user.lastName)}</p>
      <p><strong>Role:</strong> {user.role}</p>
      <p><strong>Experience:</strong> {`Experience: ${user.yearsOfExperience} years`}</p>
      <p><strong>In months:</strong> {user.yearsOfExperience * 12} months</p>
      <p><strong>Level:</strong> {user.yearsOfExperience >= 5 ? "Senior" : "Junior"}</p>
    </section>
  );
}

// SOLUTION 3: Spread attributes
function SpreadDemo() {
  return (
    <section>
      <h3>Spread Attributes</h3>
      <p>
        <a {...linkProps}>React Documentation</a>
      </p>
      <p>
        <a {...linkProps} href="https://typescriptlang.org">
          TypeScript Documentation
        </a>
      </p>
    </section>
  );
}

// SOLUTION 4: Both fragment syntaxes
function FragmentsDemo() {
  return (
    <Fragment>
      <h3>Fragment Demo</h3>
      <p>This uses the explicit Fragment syntax</p>
      <div>
        <>
          <strong>Bold text</strong>
          <em> and italic text</em>
          <span> side by side without a wrapper</span>
        </>
      </div>
    </Fragment>
  );
}

// SOLUTION 5: List rendering with .map() and keys
function SkillsList() {
  return (
    <section>
      <h3>Skills</h3>
      <ul>
        {skills.map((skill, index) => (
          <li key={skill}>
            {index + 1}. {skill}
          </li>
        ))}
      </ul>
    </section>
  );
}

export function App() {
  return (
    <div style={{ fontFamily: "sans-serif", maxWidth: 600, margin: "0 auto", padding: 20 }}>
      <h1>Exercise 1: JSX and Rendering</h1>

      <PageHeader />
      <hr />
      <ExpressionsDemo />
      <hr />
      <SpreadDemo />
      <hr />
      <FragmentsDemo />
      <hr />
      <SkillsList />
    </div>
  );
}
