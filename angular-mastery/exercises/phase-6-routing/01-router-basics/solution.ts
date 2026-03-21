import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, Routes } from '@angular/router';

// ============================================================
// Solution 6.1 — Router Basics
// ============================================================

// SOLUTION 2: Page components
@Component({ selector: 'app-home', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h2>Welcome Home!</h2><p>This is the home page.</p>` })
class HomeComponent {}

@Component({ selector: 'app-about', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h2>About Us</h2><p>We build Angular apps.</p>` })
class AboutComponent {}

@Component({ selector: 'app-contact', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h2>Contact Us</h2><p>Email: hello@example.com</p>` })
class ContactComponent {}

// SOLUTION 1: NavComponent
@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`a { margin-right: 12px; text-decoration: none; color: #333; }
            a.active { font-weight: bold; color: #007bff; }`],
  template: `
    <nav>
      <a routerLink="/home"    routerLinkActive="active">Home</a>
      <a routerLink="/about"   routerLinkActive="active">About</a>
      <a routerLink="/contact" routerLinkActive="active">Contact</a>
    </nav>
  `,
})
class NavComponent {}

// SOLUTION 4: Programmatic navigation
@Component({
  selector: 'app-programmatic-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div style="margin-top:8px;">
      <button (click)="go('/home')">Go Home</button>
      <button (click)="go('/about')" style="margin-left:8px">Go About</button>
      <button (click)="go('/contact')" style="margin-left:8px">Go Contact</button>
    </div>
  `,
})
class ProgrammaticNavComponent {
  private router = inject(Router);
  go(path: string) { this.router.navigate([path]); }
}

// SOLUTION 3: Shell component
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [NavComponent, RouterOutlet, ProgrammaticNavComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-nav />
    <app-programmatic-nav />
    <hr />
    <router-outlet />
  `,
})
class ShellComponent {}

// SOLUTION 5: Routes configuration
// NOTE: In a real app these would be passed to provideRouter() in main.ts.
// For this standalone demo we show the config as a comment:
//
// export const APP_ROUTES: Routes = [
//   { path: '',        redirectTo: 'home', pathMatch: 'full' },
//   { path: 'home',    component: HomeComponent },
//   { path: 'about',   component: AboutComponent },
//   { path: 'contact', component: ContactComponent },
// ];

// ROOT COMPONENT
// Note: For routing to work, provideRouter(APP_ROUTES) must be in main.ts.
// This demo uses a simplified in-place router setup.
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ShellComponent, RouterOutlet],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 6.1 — Router Basics</h1>
      <p><em>To fully demo routing, configure provideRouter in main.ts with:</em></p>
      <pre style="background:#f4f4f4;padding:8px;border-radius:4px;font-size:12px;">
{ path: '',        redirectTo: 'home', pathMatch: 'full' },
{ path: 'home',    component: HomeComponent },
{ path: 'about',   component: AboutComponent },
{ path: 'contact', component: ContactComponent },</pre>
      <app-shell />
    </div>
  `,
})
export class AppComponent {}
