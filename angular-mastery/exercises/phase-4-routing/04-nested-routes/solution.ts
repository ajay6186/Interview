// Phase 4 - Solution 04: Nested Routes
// Topics: children routes, RouterOutlet inside child components,
//         relative RouterLink, ActivatedRoute snapshot vs observable,
//         named router outlets (auxiliary routes)

import { Component, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

// ─────────────────────────────────────────────────────────────────────────────
// Simulated nested routing state
// ─────────────────────────────────────────────────────────────────────────────
type DashSection = 'profile' | 'settings' | 'stats';
type AuxPanel    = 'chat' | 'notifications' | null;

const dashSection  = signal<DashSection>('profile');
const auxPanel     = signal<AuxPanel>(null);
const userId       = signal<string>('1');

// ─────────────────────────────────────────────────────────────────────────────
// 2. Child components for nested routes
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-profile',
  standalone: true,
  template: `
    <div style="padding:1rem; background:#e8f5e9; border-radius:8px">
      <h3>Profile Page</h3>
      <p>Route: <code>/dashboard/profile</code></p>
      <p>This child component is rendered inside DashboardComponent's &lt;router-outlet&gt;.</p>
    </div>
  `,
})
export class ProfileComponent {}

@Component({
  selector: 'app-settings',
  standalone: true,
  template: `
    <div style="padding:1rem; background:#fff3e0; border-radius:8px">
      <h3>Settings Page</h3>
      <p>Route: <code>/dashboard/settings</code></p>
      <p>Linked with a relative RouterLink from the sidebar: <code>routerLink="settings"</code>.</p>
    </div>
  `,
})
export class SettingsComponent {}

@Component({
  selector: 'app-stats',
  standalone: true,
  template: `
    <div style="padding:1rem; background:#f3e5f5; border-radius:8px">
      <h3>Stats Page</h3>
      <p>Route: <code>/dashboard/stats</code></p>
    </div>
  `,
})
export class StatsComponent {}

// ─────────────────────────────────────────────────────────────────────────────
// 1. DashboardComponent — layout with sidebar + nested <router-outlet>
// ─────────────────────────────────────────────────────────────────────────────

/*
// REAL ROUTE CONFIG:
{
  path: 'dashboard',
  component: DashboardComponent,
  children: [
    { path: 'profile',  component: ProfileComponent  },
    { path: 'settings', component: SettingsComponent },
    { path: 'stats',    component: StatsComponent    },
    { path: '',         redirectTo: 'profile', pathMatch: 'full' },
  ]
}
// In DashboardComponent template:
//   <router-outlet />   ← child components render here
*/

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, ProfileComponent, SettingsComponent, StatsComponent],
  template: `
    <div style="border:2px solid #3949ab; border-radius:8px; overflow:hidden">
      <div style="background:#3949ab; color:white; padding:0.75rem 1rem">
        <strong>Dashboard</strong> — <code>/dashboard</code>
      </div>
      <div style="display:flex">
        <!-- Sidebar with relative RouterLinks -->
        <nav style="width:160px; background:#e8eaf6; padding:1rem; display:flex; flex-direction:column; gap:0.5rem">
          <!--
            REAL: <a routerLink="profile"  routerLinkActive="active">Profile</a>
                  <a routerLink="settings" routerLinkActive="active">Settings</a>
                  <a routerLink="stats"    routerLinkActive="active">Stats</a>

            The relative routerLink resolves against /dashboard automatically.
          -->
          @for (link of links; track link.section) {
            <button
              (click)="navigate(link.section)"
              [style.background]="currentSection() === link.section ? '#3949ab' : 'transparent'"
              [style.color]="currentSection() === link.section ? 'white' : '#333'"
              style="padding:0.4rem 0.75rem; border:1px solid #3949ab; border-radius:4px; cursor:pointer; text-align:left"
            >
              {{ link.label }}
            </button>
          }
        </nav>

        <!-- Content area — in real app this is <router-outlet /> -->
        <main style="flex:1; padding:1rem">
          @switch (currentSection()) {
            @case ('profile')  { <app-profile  /> }
            @case ('settings') { <app-settings /> }
            @case ('stats')    { <app-stats    /> }
          }
        </main>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  links = [
    { section: 'profile'  as DashSection, label: 'Profile'  },
    { section: 'settings' as DashSection, label: 'Settings' },
    { section: 'stats'    as DashSection, label: 'Stats'    },
  ];

  currentSection = dashSection;
  navigate(s: DashSection) { dashSection.set(s); }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. ActivatedRoute.params — snapshot vs Observable
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-param-demo',
  standalone: true,
  template: `
    <div style="padding:1rem; background:#fce4ec; border-radius:8px; margin-bottom:1rem">
      <h3>ActivatedRoute: snapshot vs Observable</h3>

      <p>Current userId: <strong>{{ currentUserId() }}</strong></p>

      <div style="display:flex; gap:0.5rem; margin-bottom:1rem">
        @for (id of ['1','2','3']; track id) {
          <button (click)="changeUser(id)"
                  [style.background]="currentUserId() === id ? '#c62828' : '#eee'"
                  [style.color]="currentUserId() === id ? 'white' : '#333'"
                  style="padding:0.3rem 0.75rem; border:1px solid #ccc; border-radius:4px; cursor:pointer">
            User {{ id }}
          </button>
        }
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; font-size:0.9rem">
        <div style="background:#fff8e1; padding:0.75rem; border-radius:4px">
          <strong>snapshot (one-time read)</strong>
          <pre style="margin:0.5rem 0; font-size:0.8rem">{{ snapshotCode }}</pre>
          <p style="color:#e65100">
            Reads once on component init. Does NOT update if user navigates
            from /users/1 to /users/2 while reusing the same component instance!
          </p>
        </div>
        <div style="background:#f1f8e9; padding:0.75rem; border-radius:4px">
          <strong>Observable (reactive)</strong>
          <pre style="margin:0.5rem 0; font-size:0.8rem">{{ observableCode }}</pre>
          <p style="color:#2e7d32">
            Emits every time the param changes. Required when the same component
            handles /users/1 and /users/2 without re-creating the component.
          </p>
        </div>
      </div>
    </div>
  `,
})
export class ParamDemoComponent implements OnInit, OnDestroy {
  currentUserId = userId;

  snapshotCode = `// One-time read:
const route = inject(ActivatedRoute);
const id = route.snapshot.paramMap.get('id');`;

  observableCode = `// Reactive:
route.params.subscribe(p => {
  this.userId.set(p['id']);
});
// Auto-unsubscribe:
route.params
  .pipe(takeUntilDestroyed())
  .subscribe(...);`;

  ngOnInit() {}
  ngOnDestroy() {}

  changeUser(id: string) { userId.set(id); }
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Relative navigation demo
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-relative-nav',
  standalone: true,
  template: `
    <div style="padding:1rem; background:#e0f7fa; border-radius:8px; margin-bottom:1rem">
      <h3>Relative Navigation</h3>
      <p style="font-size:0.9rem">
        Pass <code>&#123; relativeTo: route &#125;</code> to make navigation relative
        to the current activated route instead of the root.
      </p>

      <table style="width:100%; border-collapse:collapse; font-size:0.85rem">
        <thead>
          <tr style="background:#00838f; color:white">
            <th style="padding:0.4rem">Code</th>
            <th style="padding:0.4rem">Effect (from /dashboard/profile)</th>
          </tr>
        </thead>
        <tbody>
          @for (row of navExamples; track row.code) {
            <tr style="border-bottom:1px solid #ddd">
              <td style="padding:0.4rem"><code>{{ row.code }}</code></td>
              <td style="padding:0.4rem">{{ row.effect }}</td>
            </tr>
          }
        </tbody>
      </table>

      <div style="margin-top:0.75rem; font-size:0.85rem; background:#fff; padding:0.75rem; border-radius:4px">
        <strong>Template relative links:</strong><br/>
        <code>&lt;a routerLink="./settings"&gt;</code> — same directory<br/>
        <code>&lt;a routerLink="../stats"&gt;</code>    — sibling route<br/>
        <code>&lt;a routerLink="../../home"&gt;</code>  — two levels up
      </div>
    </div>
  `,
})
export class RelativeNavComponent {
  navExamples = [
    { code: `router.navigate(['../settings'], { relativeTo: route })`, effect: 'Navigates to /dashboard/settings' },
    { code: `router.navigate(['./stats'],     { relativeTo: route })`, effect: 'Navigates to /dashboard/profile/stats' },
    { code: `router.navigate(['../../home'],  { relativeTo: route })`, effect: 'Navigates to /home' },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Named router outlets (auxiliary routes)
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-chat',
  standalone: true,
  template: `
    <div style="padding:0.75rem; background:#e8f5e9; border-radius:4px">
      <strong>Chat Panel</strong> (auxiliary outlet: 'sidebar')<br/>
      <small>Route: <code>/app(sidebar:chat)</code></small>
    </div>
  `,
})
export class ChatComponent {}

@Component({
  selector: 'app-notifications',
  standalone: true,
  template: `
    <div style="padding:0.75rem; background:#fff3e0; border-radius:4px">
      <strong>Notifications</strong> (auxiliary outlet: 'popup')<br/>
      <small>Route: <code>/app(popup:notifications)</code></small>
    </div>
  `,
})
export class NotificationPanelComponent {}

@Component({
  selector: 'app-named-outlets-demo',
  standalone: true,
  imports: [CommonModule, ChatComponent, NotificationPanelComponent],
  template: `
    <div style="padding:1rem; background:#f8f9fa; border-radius:8px; margin-bottom:1rem">
      <h3>Named Router Outlets (Auxiliary Routes)</h3>

      <div style="font-size:0.9rem; background:#e8eaf6; padding:0.75rem; border-radius:4px; margin-bottom:0.75rem">
        <strong>Real Angular patterns:</strong><br/>
        <code>&#123; path: 'chat', component: ChatComponent, outlet: 'sidebar' &#125;</code><br/><br/>
        Open:  <code>[routerLink]="[&#123; outlets: &#123; sidebar: ['chat'] &#125; &#125;]"</code><br/>
        Close: <code>[routerLink]="[&#123; outlets: &#123; sidebar: null &#125; &#125;]"</code><br/>
        Template: <code>&lt;router-outlet name="sidebar" /&gt;</code>
      </div>

      <div style="display:flex; gap:0.5rem; margin-bottom:0.75rem">
        <button (click)="togglePanel('chat')"
                style="padding:0.3rem 0.75rem; background:#1a237e; color:white; border:none; border-radius:4px; cursor:pointer">
          Toggle Chat Panel
        </button>
        <button (click)="togglePanel('notifications')"
                style="padding:0.3rem 0.75rem; background:#e65100; color:white; border:none; border-radius:4px; cursor:pointer">
          Toggle Notifications
        </button>
      </div>

      <!-- Simulated named outlets -->
      @if (panel() === 'chat') {
        <app-chat />
      } @else if (panel() === 'notifications') {
        <app-notifications />
      } @else {
        <p style="color:#888; font-style:italic">No auxiliary panel open.</p>
      }
    </div>
  `,
})
export class NamedOutletsDemoComponent {
  panel = auxPanel;
  togglePanel(name: 'chat' | 'notifications') {
    auxPanel.set(auxPanel() === name ? null : name);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    DashboardComponent,
    ParamDemoComponent,
    RelativeNavComponent,
    NamedOutletsDemoComponent,
  ],
  template: `
    <div style="font-family:sans-serif; max-width:900px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 4 – Nested Routes Demo</h1>

      <app-dashboard />

      <div style="margin-top:1.5rem">
        <app-param-demo />
        <app-relative-nav />
        <app-named-outlets-demo />
      </div>

      <div style="margin-top:1.5rem; padding:1rem; background:#f5f5f5; border-radius:8px; font-size:0.85rem">
        <strong>Nested Routes Cheat Sheet:</strong>
        <ul>
          <li>Use <code>children: [...]</code> in the route config for nested routes</li>
          <li>Add <code>&lt;router-outlet /&gt;</code> inside the parent component template</li>
          <li>Relative routerLink: <code>routerLink="./child"</code> resolves against current path</li>
          <li>Observable params: subscribe to <code>route.params</code> for same-component param changes</li>
          <li>Snapshot: <code>route.snapshot.paramMap.get('id')</code> — read once, no subscription</li>
          <li>Named outlets: <code>outlet: 'sidebar'</code> in route + <code>&lt;router-outlet name="sidebar"&gt;</code></li>
        </ul>
      </div>
    </div>
  `,
})
export class AppComponent {}
