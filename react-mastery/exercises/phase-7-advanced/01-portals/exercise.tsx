import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

// ============================================================
// Exercise: React Portals
// ============================================================
// Portals let you render a component's output into a different
// DOM node than its parent. Common use cases: modals, tooltips,
// dropdowns, and toasts that need to escape parent overflow/z-index.
//
// Note: React event bubbling still works through the React tree,
// NOT the DOM tree. A click inside a portal bubbles to the
// portal's React parent, not the DOM parent.
//
// Instructions:
// 1. Create a ModalPortal component using createPortal.
// 2. Create a Modal component with open/close and keyboard (Escape) support.
// 3. Create a Toast system that renders notifications into a portal.
// 4. Create a Tooltip component that positions itself near a trigger.
// 5. Demonstrate that events bubble through the React tree.
// ============================================================

// TODO 1: Create a ModalPortal component
// - Use createPortal to render children into document.body
// - This allows the modal to escape parent overflow:hidden or z-index issues
//
// function ModalPortal({ children }: { children: React.ReactNode }) {
//   return createPortal(children, document.body);
// }

// TODO 2: Create a Modal component
// Props:
//   - isOpen: boolean
//   - onClose: () => void
//   - title: string
//   - children: React.ReactNode
//
// Requirements:
//   - Only render when isOpen is true
//   - Use ModalPortal to render into document.body
//   - Render an overlay (semi-transparent backdrop, position: fixed, inset: 0)
//   - Render a dialog box centered on screen
//   - Render a title and close button (X)
//   - Close when clicking the overlay (but NOT the dialog box itself)
//   - Close when pressing the Escape key (useEffect + keydown event listener)
//   - Trap focus inside the modal while open (optional bonus)
//
// function Modal({ isOpen, onClose, title, children }: ModalProps) { ... }

// TODO 3: Create a ToastPortal + Toast system
// A toast is a temporary notification that appears at a fixed position.
//
// Types:
//   type ToastMessage = { id: number; message: string; type: "success" | "error" | "info" };
//
// Create a useToast hook:
//   - Maintains a list of ToastMessage items in state
//   - Returns { toasts, addToast, removeToast }
//   - addToast(message: string, type) pushes a new toast with a unique id
//   - removeToast(id) removes a toast by id
//
// Create a ToastContainer component:
//   - Renders all toasts into a portal at the bottom-right of the screen
//   - Each toast should auto-dismiss after 3 seconds (useEffect with setTimeout)
//   - Color-code by type: green=success, red=error, blue=info
//
// function useToast() { ... }
// function ToastContainer({ toasts, onRemove }: ToastContainerProps) { ... }

// TODO 4: Create a Tooltip component
// - Renders children (the trigger element) normally
// - On hover, renders the tooltip text in a portal near the trigger
// - Use a useRef on the trigger to get its position (getBoundingClientRect)
// - Position the tooltip above the trigger using position: fixed + top/left
//
// function Tooltip({ text, children }: { text: string; children: React.ReactNode }) { ... }

// TODO 5: EventBubblingDemo
// Demonstrates that React events bubble through the React tree, not the DOM tree.
// - Wrap the entire demo in a div with an onClick that logs "React parent clicked"
// - Inside a ModalPortal, render a button that says "Click me (in portal)"
// - Clicking the button should log "Button clicked" AND "React parent clicked"
//   even though the button is rendered in document.body, not inside the parent div
//
// function EventBubblingDemo() { ... }

export function App() {
  // TODO 6: Wire up all demos:
  // - A button to open/close the Modal (useState for isOpen)
  // - Toast demo with 3 buttons: "Add Success", "Add Error", "Add Info"
  // - Tooltip demo wrapping some text
  // - EventBubblingDemo section

  return (
    <div style={{ maxWidth: 700, margin: "0 auto", padding: 20 }}>
      <h1>Exercise: React Portals</h1>
      <p style={{ color: "gray" }}>Complete the TODOs to see portals in action.</p>
    </div>
  );
}
