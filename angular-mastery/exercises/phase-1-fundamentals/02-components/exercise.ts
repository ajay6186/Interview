import { Component } from '@angular/core';

// ============================================================
// Exercise 1.2 — Components
// ============================================================
// Topics:
//   • @Component decorator (selector, template, styles, standalone)
//   • Component class — properties and methods
//   • Component composition — using one component inside another
//   • Component with inputs (basic, no @Input decorator yet)
//   • Inline styles vs styles array
//   • Self-closing component tags  <app-badge />
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: BadgeComponent
// ---------------------------------------------------------------------------
// Create a standalone component selector='app-badge'.
// It should display a coloured pill-shaped badge.
// Declare two class properties: text = 'Default' and color = '#3498db'.
// Template: <span> with inline style background, color: white, padding, border-radius.

// ---------------------------------------------------------------------------
// TODO 2: UserCardComponent
// ---------------------------------------------------------------------------
// Create a standalone component selector='app-user-card'.
// Declare these class properties:
//   name     = 'Alice Johnson'
//   age      = 30
//   email    = 'alice@example.com'
//   bio      = 'Full-stack developer'
//   role     = 'admin'   (one of 'admin' | 'editor' | 'viewer')
// Template:
//   - A card container div with border, padding, border-radius
//   - User name in a <h3>
//   - Age and email in <p> tags
//   - An <em> for bio (render it only if bio is truthy using @if)
//   - A <app-badge> for the role — use it as a child component
// Import BadgeComponent in imports[].

// ---------------------------------------------------------------------------
// TODO 3: HeaderComponent
// ---------------------------------------------------------------------------
// Create selector='app-header'.
// Property: title = 'Angular Mastery'.
// Template: <header> with a dark background, white text, padding.
//   Render the title in an <h1> using interpolation.

// ---------------------------------------------------------------------------
// TODO 4: FooterComponent
// ---------------------------------------------------------------------------
// Create selector='app-footer'.
// Property: year = new Date().getFullYear()
// Template: <footer> with light background, centred text:
//   © {{ year }} Angular Mastery

// ---------------------------------------------------------------------------
// TODO 5: LayoutComponent
// ---------------------------------------------------------------------------
// Create selector='app-layout'.
// Import HeaderComponent and FooterComponent.
// Template: flex-column container, render <app-header />, <main>, <app-footer />.
// In <main>, render a <app-user-card /> component.
// Import all needed components in imports[].

// ---------------------------------------------------------------------------
// ROOT COMPONENT
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: import LayoutComponent (which already uses the others internally)
  ],
  template: `
    <div>
      <h1 style="font-family: sans-serif; padding: 20px;">Exercise 1.2 — Components</h1>
      <!-- TODO 6: Render <app-layout /> here -->
    </div>
  `,
})
export class AppComponent {}
