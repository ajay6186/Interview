import { Component } from '@angular/core';

// ============================================================
// Solution 1.2 — Components
// ============================================================

type Role = 'admin' | 'editor' | 'viewer';

const roleColors: Record<Role, string> = {
  admin:  '#e74c3c',
  editor: '#3498db',
  viewer: '#95a5a6',
};

const users = [
  { name: 'Alice Johnson', age: 30, email: 'alice@example.com', bio: 'Full-stack developer', role: 'admin'  as Role },
  { name: 'Bob Smith',     age: 25, email: 'bob@example.com',   bio: '',                    role: 'editor' as Role },
  { name: 'Carol W.',      age: 35, email: 'carol@example.com', bio: 'DevOps engineer',     role: 'viewer' as Role },
];

// SOLUTION 1: Badge component
@Component({
  selector: 'app-badge',
  standalone: true,
  template: `
    <span [style.background]="color"
          style="color: white; padding: 2px 10px; border-radius: 12px;
                 font-size: 12px; font-weight: bold; text-transform: uppercase;">
      {{ text }}
    </span>
  `,
})
class BadgeComponent {
  text  = 'badge';
  color = '#3498db';
}

// SOLUTION 2: UserCard using BadgeComponent as child
@Component({
  selector: 'app-user-card',
  standalone: true,
  imports: [BadgeComponent],
  template: `
    <div style="border: 1px solid #ddd; border-radius: 8px; padding: 16px;
                max-width: 260px; font-family: sans-serif;">
      <h3 style="margin: 0 0 8px;">{{ name }}</h3>
      <p style="margin: 4px 0; color: #666;">Age: {{ age }}</p>
      <p style="margin: 4px 0; color: #666;">{{ email }}</p>
      @if (bio) {
        <p style="margin: 8px 0;"><em>{{ bio }}</em></p>
      }
      <app-badge [text]="role" [color]="roleColor" />
    </div>
  `,
})
class UserCardComponent {
  name  = 'Alice Johnson';
  age   = 30;
  email = 'alice@example.com';
  bio   = 'Full-stack developer';
  role: Role = 'admin';
  get roleColor() { return roleColors[this.role]; }
}

// SOLUTION 3: Header
@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header style="background: #2c3e50; color: white; padding: 16px 20px;">
      <h1 style="margin: 0;">{{ title }}</h1>
    </header>
  `,
})
class HeaderComponent {
  title = 'Angular Mastery';
}

// SOLUTION 4: Footer
@Component({
  selector: 'app-footer',
  standalone: true,
  template: `
    <footer style="background: #ecf0f1; padding: 12px 20px; text-align: center; color: #666;">
      &copy; {{ year }} Angular Mastery
    </footer>
  `,
})
class FooterComponent {
  year = new Date().getFullYear();
}

// SOLUTION 5: Layout composing Header + Footer + UserCard
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, UserCardComponent],
  template: `
    <div style="display: flex; flex-direction: column; min-height: 100vh;">
      <app-header />
      <main style="flex: 1; padding: 20px; display: flex; gap: 16px; flex-wrap: wrap;">
        <app-user-card />
      </main>
      <app-footer />
    </div>
  `,
})
class LayoutComponent {}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [LayoutComponent],
  template: `<app-layout />`,
})
export class AppComponent {}
