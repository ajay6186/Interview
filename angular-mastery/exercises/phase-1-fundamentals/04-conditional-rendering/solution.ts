import { Component, Input, Output, EventEmitter } from '@angular/core';

// ============================================================
// Solution 1.4 — Conditional Rendering
// ============================================================

type Role          = 'admin' | 'editor' | 'viewer';
type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

// SOLUTION 1: @if / @else-if / @else
@Component({
  selector: 'app-role-badge',
  standalone: true,
  template: `
    <div>
      <strong>Access level: </strong>
      @if (role === 'admin') {
        <span style="color: red; font-weight: bold;">Administrator – Full Access</span>
      } @else if (role === 'editor') {
        <span style="color: #3498db;">Editor – Can edit content</span>
      } @else {
        <span style="color: gray;">Viewer – Read only</span>
      }
    </div>
  `,
})
class RoleBadgeComponent {
  @Input() role: Role = 'viewer';
}

// SOLUTION 2: @if / @else login toggle
@Component({
  selector: 'app-login-status',
  standalone: true,
  template: `
    @if (isLoggedIn) {
      <div>
        Welcome back, <strong>{{ userName }}</strong>!
        <button (click)="toggled.emit()" style="margin-left: 8px;">Logout</button>
      </div>
    } @else {
      <div>
        Please <button (click)="toggled.emit()">Login</button> to continue.
      </div>
    }
  `,
})
class LoginStatusComponent {
  @Input()  isLoggedIn = false;
  @Input()  userName   = '';
  @Output() toggled    = new EventEmitter<void>();
}

// SOLUTION 3: && equivalent via @if (count > 0)
@Component({
  selector: 'app-notification-badge',
  standalone: true,
  template: `
    @if (count > 0) {
      <span style="background: red; color: white; border-radius: 50%;
                   padding: 2px 7px; font-size: 12px; font-weight: bold;">
        {{ count }}
      </span>
    }
  `,
})
class NotificationBadgeComponent {
  @Input() count = 0;
}

// SOLUTION 4: @switch — four-state async display
@Component({
  selector: 'app-status-display',
  standalone: true,
  template: `
    @switch (status) {
      @case ('idle') {
        <div style="color: gray; padding: 16px;">Click "Fetch" to load data.</div>
      }
      @case ('loading') {
        <div style="padding: 16px; display: flex; align-items: center; gap: 10px;">
          <div style="width: 28px; height: 28px; border: 4px solid #eee;
                      border-top-color: #3498db; border-radius: 50%;
                      animation: spin 0.8s linear infinite;"></div>
          Loading…
        </div>
      }
      @case ('success') {
        <div style="padding: 16px; background: #d4edda; border-radius: 8px;">
          <h3 style="margin-top: 0; color: #155724;">Dashboard</h3>
          <p>Total users: <strong>{{ data!.users }}</strong></p>
          <p>Revenue: <strong>{{ data!.revenue }}</strong></p>
        </div>
      }
      @case ('error') {
        <div style="padding: 16px; background: #f8d7da; color: #721c24; border-radius: 8px;">
          <strong>Error:</strong> {{ errorMessage || 'Something went wrong.' }}
        </div>
      }
    }
  `,
  styles: [`@keyframes spin { to { transform: rotate(360deg); } }`],
})
class StatusDisplayComponent {
  @Input() status: RequestStatus = 'idle';
  @Input() data: { users: number; revenue: string } | null = null;
  @Input() errorMessage = '';
}

// SOLUTION 5: @if(!isVisible) → renders nothing
@Component({
  selector: 'app-warning-banner',
  standalone: true,
  template: `
    @if (isVisible) {
      <div style="background: #fff3cd; border: 1px solid #ffc107;
                  padding: 12px; border-radius: 4px; margin-bottom: 12px;">
        <strong>Warning:</strong> {{ message }}
      </div>
    }
  `,
})
class WarningBannerComponent {
  @Input() message   = '';
  @Input() isVisible = false;
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RoleBadgeComponent,
    LoginStatusComponent,
    NotificationBadgeComponent,
    StatusDisplayComponent,
    WarningBannerComponent,
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 1.4 — Conditional Rendering</h1>

      <app-warning-banner message="This is a demo environment" [isVisible]="showWarning" />
      <button (click)="showWarning = !showWarning">Toggle Warning</button>
      <hr />

      <h2>Role Badge (@if/@else-if)</h2>
      <app-role-badge [role]="role" />
      <select [(ngModel)]="role" style="margin-left: 8px;">
        <option value="admin">Admin</option>
        <option value="editor">Editor</option>
        <option value="viewer">Viewer</option>
      </select>
      <hr />

      <h2>Login Status (@if/@else)</h2>
      <app-login-status [isLoggedIn]="isLoggedIn" [userName]="'Jane Doe'"
                        (toggled)="isLoggedIn = !isLoggedIn" />
      <hr />

      <h2>Notifications (@if count &gt; 0)</h2>
      <p>Inbox <app-notification-badge [count]="5" /></p>
      <p>Sent  <app-notification-badge [count]="0" /></p>
      <hr />

      <h2>Dashboard (@switch)</h2>
      <div style="margin-bottom: 12px;">
        <button (click)="simulateFetch()" [disabled]="status === 'loading'">Fetch Data</button>
        <button (click)="status = 'idle'" style="margin-left: 8px;">Reset</button>
      </div>
      <app-status-display [status]="status" [data]="status === 'success' ? mockData : null"
                          errorMessage="Failed to fetch." />
    </div>
  `,
  // ngModel needs FormsModule — adding for the select demo
  // (Real exercise: import FormsModule from @angular/forms)
})
export class AppComponent {
  role: Role         = 'admin';
  isLoggedIn         = true;
  showWarning        = false;
  status: RequestStatus = 'idle';
  mockData           = { users: 1250, revenue: '$52,400' };

  simulateFetch() {
    this.status = 'loading';
    setTimeout(() => {
      this.status = Math.random() > 0.3 ? 'success' : 'error';
    }, 1200);
  }
}
