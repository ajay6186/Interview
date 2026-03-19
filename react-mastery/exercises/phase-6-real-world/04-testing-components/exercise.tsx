import React, { useState } from "react";

// ============================================================
// Exercise: Testing Components
// ============================================================
// Build testable React components and learn what tests to write
// for each one. Since we cannot run a test runner inside a
// component file, this exercise focuses on building components
// with testing in mind and adding TODO comments that describe
// the tests you would write.
//
// Instructions:
// 1. Build a Counter component with increment/decrement
// 2. Build a SearchFilter component that filters a list
// 3. Build a ToggleContent component for show/hide
// 4. Build a Form component with validation
// 5. Add TODO comments describing tests for each component
// 6. Think about: what to test, how to query elements,
//    what user interactions to simulate, and what assertions
//    to make
// ============================================================

// TODO 1: Create a Counter component
// - Display a count value in an element with a "count" test label
// - "Increment" button that adds 1
// - "Decrement" button that subtracts 1
// - "Reset" button that sets count back to 0
// - The count should not go below 0 (decrement does nothing at 0)
//
// TESTING TODOs:
// - TODO TEST: Renders initial count of 0
// - TODO TEST: Increment button increases count by 1
// - TODO TEST: Decrement button decreases count by 1
// - TODO TEST: Count does not go below 0
// - TODO TEST: Reset button sets count back to 0 from any value
function Counter() {
  return (
    <div>
      <h3>Counter</h3>
      <p>Implement the Counter component</p>
    </div>
  );
}

// TODO 2: Create a SearchFilter component
// - Accept a prop: items (string[])
// - Render a text input for search
// - Filter items to only show those containing the search text (case-insensitive)
// - Display matching items as <li> elements
// - Show a "No results found" message when nothing matches
// - Show the count of results: "Showing X of Y items"
//
// TESTING TODOs:
// - TODO TEST: Renders all items initially
// - TODO TEST: Filters items as user types
// - TODO TEST: Search is case-insensitive
// - TODO TEST: Shows "No results found" when no items match
// - TODO TEST: Shows correct count "Showing X of Y items"
// - TODO TEST: Clearing the search shows all items again
function SearchFilter({ items }: { items: string[] }) {
  return (
    <div>
      <h3>Search Filter</h3>
      <p>Implement the SearchFilter component</p>
    </div>
  );
}

// TODO 3: Create a ToggleContent component
// - Accept props: title (string), children (ReactNode)
// - Render a button that shows/hides the children
// - Button text: "Show {title}" when hidden, "Hide {title}" when visible
// - Content is hidden by default
// - Add a smooth height transition (optional)
//
// TESTING TODOs:
// - TODO TEST: Content is hidden by default
// - TODO TEST: Clicking the button shows the content
// - TODO TEST: Clicking the button again hides the content
// - TODO TEST: Button text changes based on visibility state
// - TODO TEST: Children content renders correctly when visible
function ToggleContent({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3>Toggle Content</h3>
      <p>Implement the ToggleContent component</p>
    </div>
  );
}

// TODO 4: Create a Form component with validation
// - Fields: name (required, min 2 chars), email (required, must contain @),
//   message (required, min 10 chars)
// - Show inline validation errors below each field
// - "Submit" button that validates all fields
// - Show success message on valid submission
// - Disable submit button while any field is invalid
// - Accept an onSubmit prop: (data: { name: string; email: string; message: string }) => void
//
// TESTING TODOs:
// - TODO TEST: Renders all three input fields
// - TODO TEST: Shows error when name is too short
// - TODO TEST: Shows error when email doesn't contain @
// - TODO TEST: Shows error when message is too short
// - TODO TEST: Submit button is disabled when form is invalid
// - TODO TEST: Calls onSubmit with form data on valid submission
// - TODO TEST: Shows success message after submission
// - TODO TEST: Clears errors when user corrects input
function Form({ onSubmit }: { onSubmit: (data: { name: string; email: string; message: string }) => void }) {
  return (
    <div>
      <h3>Contact Form</h3>
      <p>Implement the Form component with validation</p>
    </div>
  );
}

// TODO 5: Wire all components together in App
// - Render each component in its own section
// - Provide sample items to SearchFilter
// - Provide an onSubmit handler to Form that logs the data
// - Add a note explaining the testing approach
export function App() {
  return (
    <div style={{ padding: "20px", fontFamily: "sans-serif" }}>
      <h1>Exercise: Testing Components</h1>
      <p>Build testable components and describe the tests you would write.</p>
    </div>
  );
}
