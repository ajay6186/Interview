import { Component } from '@angular/core';

// ============================================================
// Exercise 1.4 — Conditional Rendering
// ============================================================
// Topics:
//   • @if / @else / @else-if
//   • @switch / @case / @default
//   • [hidden] attribute binding (vs @if)
//   • Returning null equivalent — @if(!show) renders nothing
//   • Multiple conditions / compound guards
// ============================================================

type Role          = 'admin' | 'editor' | 'viewer';
type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

// ---------------------------------------------------------------------------
// TODO 1: RoleBadgeComponent
// ---------------------------------------------------------------------------
// Create selector='app-role-badge'.
// Property: role: Role = 'viewer'
// Use @if / @else-if / @else to render different coloured <span> badges:
//   admin  → red   "Administrator – Full Access"
//   editor → blue  "Editor – Can edit content"
//   viewer → gray  "Viewer – Read only"

// ---------------------------------------------------------------------------
// TODO 2: LoginStatusComponent
// ---------------------------------------------------------------------------
// Create selector='app-login-status'.
// @Input() isLoggedIn = false
// @Input() userName = ''
// @Output() toggled = new EventEmitter<void>()
// Use @if / @else:
//   logged in  → "Welcome back, <strong>{{ userName }}</strong>! <button>Logout</button>"
//   logged out → "Please <button>Login</button> to continue."

// ---------------------------------------------------------------------------
// TODO 3: NotificationBadgeComponent
// ---------------------------------------------------------------------------
// Create selector='app-notification-badge'.
// @Input() count = 0
// Use @if (count > 0) to render the badge number.
// IMPORTANT: do NOT use just @if (count) — falsy zero would hide the badge
//   even when count is 0, which is correct here, but be explicit with > 0.

// ---------------------------------------------------------------------------
// TODO 4: StatusDisplayComponent
// ---------------------------------------------------------------------------
// Create selector='app-status-display'.
// @Input() status: RequestStatus = 'idle'
// @Input() data: { users: number; revenue: string } | null = null
// @Input() errorMessage = ''
// Use @switch on status with @case for each state:
//   idle    → "Click Fetch to load data."
//   loading → a spinner div (animated border)
//   success → show data.users and data.revenue
//   error   → red error box with errorMessage

// ---------------------------------------------------------------------------
// TODO 5: WarningBannerComponent
// ---------------------------------------------------------------------------
// Create selector='app-warning-banner'.
// @Input() message = ''
// @Input() isVisible = false
// If isVisible is false, render nothing (use @if(!isVisible) pattern).
// If visible, render a yellow warning box.

// ---------------------------------------------------------------------------
// ROOT COMPONENT
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 1.4 — Conditional Rendering</h1>
      <!-- TODO 6: add all components to imports[] and render them here -->
    </div>
  `,
})
export class AppComponent {}
