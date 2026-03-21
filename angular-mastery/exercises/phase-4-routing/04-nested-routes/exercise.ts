// Phase 4 - Exercise 04: Nested Routes
// Topics: children routes, RouterOutlet inside child components,
//         relative RouterLink, ActivatedRoute snapshot vs observable,
//         named router outlets (auxiliary routes)
//
// Docs: https://angular.dev/guide/routing/router-tutorial-toh#child-routing-component

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: Dashboard layout with sidebar nav + nested <router-outlet>
//
// Create DashboardComponent:
// - selector: 'app-dashboard'
// - Sidebar with links to /dashboard/profile, /dashboard/settings, /dashboard/stats
// - A <router-outlet> inside the main content area for child routes
// - Layout: flex row (sidebar on left, content on right)
//
// Route config reference:
//   {
//     path: 'dashboard',
//     component: DashboardComponent,
//     children: [
//       { path: 'profile',  component: ProfileComponent },
//       { path: 'settings', component: SettingsComponent },
//       { path: 'stats',    component: StatsComponent },
//       { path: '',         redirectTo: 'profile', pathMatch: 'full' },
//     ]
//   }
// ─────────────────────────────────────────────

// TODO 1: DashboardComponent
// @Component({ ... })
// export class DashboardComponent { }

// ─────────────────────────────────────────────
// TODO 2: Nested route child components
//
// Create ProfileComponent, SettingsComponent, StatsComponent:
// - Each is a standalone component with a simple template
// - Use relative RouterLink in DashboardComponent sidebar:
//   <a routerLink="profile">Profile</a>   ← relative to /dashboard
//   <a routerLink="./settings">Settings</a>
// ─────────────────────────────────────────────

// TODO 2a: ProfileComponent
// @Component({ ... })
// export class ProfileComponent { }

// TODO 2b: SettingsComponent
// @Component({ ... })
// export class SettingsComponent { }

// TODO 2c: StatsComponent
// @Component({ ... })
// export class StatsComponent { }

// ─────────────────────────────────────────────
// TODO 3: ActivatedRoute.params — Observable vs snapshot
//
// Create ParamDemoComponent:
// - Shows both approaches for reading :userId param
// - SNAPSHOT: this.route.snapshot.paramMap.get('userId') — read once on load
// - OBSERVABLE: this.route.params.subscribe(p => ...) — reacts to changes
//   (important when navigating from /users/1 to /users/2 without leaving the component)
// - Display the user ID and explain when to use each approach
// ─────────────────────────────────────────────

// TODO 3: ParamDemoComponent
// @Component({ ... })
// export class ParamDemoComponent { }

// ─────────────────────────────────────────────
// TODO 4: Relative navigation
//
// Create RelativeNavComponent that demonstrates:
// - router.navigate(['../sibling'], { relativeTo: route })
//   navigates to a sibling route relative to current route
// - router.navigate(['./child'], { relativeTo: route })
//   navigates to a child route
// - router.navigate(['../../parent'], { relativeTo: route })
//   navigates two levels up
// Add 3 buttons demonstrating each navigation type.
// ─────────────────────────────────────────────

// TODO 4: RelativeNavComponent
// @Component({ ... })
// export class RelativeNavComponent { }

// ─────────────────────────────────────────────
// TODO 5: Named router outlets (auxiliary routes)
//
// Create:
// - ChatComponent — to be shown in a named outlet 'sidebar'
// - NotificationPanelComponent — to be shown in named outlet 'popup'
// - Show how to link to a named outlet:
//   <a [routerLink]="[{ outlets: { sidebar: ['chat'] } }]">Open Chat</a>
//   <a [routerLink]="[{ outlets: { sidebar: null } }]">Close Chat</a>
// - Show how to define named outlet routes:
//   { path: 'chat', component: ChatComponent, outlet: 'sidebar' }
// ─────────────────────────────────────────────

// TODO 5a: ChatComponent
// @Component({ ... })
// export class ChatComponent { }

// TODO 5b: NotificationPanelComponent
// @Component({ ... })
// export class NotificationPanelComponent { }

// ─────────────────────────────────────────────
// TODO 6: Add all components to imports[] and render them in AppComponent
// ─────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: import components here
  ],
  template: `
    <h1>Nested Routes Exercise</h1>
    <!-- TODO 6: render components here -->
  `,
})
export class AppComponent {}
