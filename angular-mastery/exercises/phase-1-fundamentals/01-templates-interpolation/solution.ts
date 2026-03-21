import { Component } from '@angular/core';
import { DatePipe, UpperCasePipe } from '@angular/common';

// ============================================================
// Solution 1.1 — Templates & Interpolation
// ============================================================

const user = {
  firstName: 'Jane',
  lastName: 'Doe',
  role: 'Senior Developer',
  yearsOfExperience: 7,
  joinDate: new Date('2022-03-15'),
};

const skills = ['Angular', 'TypeScript', 'RxJS', 'NgRx', 'CSS'];

// SOLUTION 1: String interpolation
@Component({
  selector: 'app-greeting',
  standalone: true,
  template: `<h2>Hello, {{ firstName }} {{ lastName }}!</h2>`,
})
class GreetingComponent {
  firstName = user.firstName;
  lastName  = user.lastName;
}

// SOLUTION 2: Expressions in interpolation
@Component({
  selector: 'app-user-profile',
  standalone: true,
  template: `
    <section>
      <h3>User Profile</h3>
      <p><strong>Role:</strong> {{ role }}</p>
      <p><strong>Experience:</strong> {{ yearsOfExperience }} years
         ({{ yearsOfExperience * 12 }} months)</p>
      <p><strong>Level:</strong> {{ yearsOfExperience >= 5 ? 'Senior' : 'Junior' }}</p>
    </section>
  `,
})
class UserProfileComponent {
  role = user.role;
  yearsOfExperience = user.yearsOfExperience;
}

// SOLUTION 3: Property binding
@Component({
  selector: 'app-property-binding',
  standalone: true,
  template: `
    <section>
      <h3>Property Binding</h3>
      <img [src]="imgSrc" [alt]="imgAlt"
           style="border-radius: 50%; width: 80px; height: 80px;" />
      <p>
        <button [disabled]="isDisabled">I am {{ isDisabled ? 'disabled' : 'enabled' }}</button>
        <button (click)="isDisabled = !isDisabled" style="margin-left: 8px;">Toggle</button>
      </p>
      <div [class.highlight]="highlight"
           style="padding: 8px; border: 1px solid #ccc; display: inline-block;">
        highlight = {{ highlight }}
      </div>
      <button (click)="highlight = !highlight" style="margin-left: 8px;">Toggle highlight</button>
    </section>
  `,
  styles: [`.highlight { background: #ffeeba; font-weight: bold; }`],
})
class PropertyBindingComponent {
  imgSrc    = 'https://via.placeholder.com/80';
  imgAlt    = 'User avatar';
  isDisabled = true;
  highlight  = false;
}

// SOLUTION 4: Event binding
@Component({
  selector: 'app-event-binding',
  standalone: true,
  template: `
    <section>
      <h3>Event Binding — Counter</h3>
      <p style="font-size: 2rem; margin: 0;">{{ count }}</p>
      <button (click)="increment()">+</button>
      <button (click)="decrement()" style="margin: 0 8px;">−</button>
      <button (click)="reset()">Reset</button>
    </section>
  `,
})
class EventBindingComponent {
  count = 0;
  increment() { this.count++; }
  decrement() { this.count--; }
  reset()     { this.count = 0; }
}

// SOLUTION 5: Safe navigation operator and pipes
@Component({
  selector: 'app-safe-nav',
  standalone: true,
  imports: [DatePipe, UpperCasePipe],
  template: `
    <section>
      <h3>Safe Navigation &amp; Pipes</h3>
      <p>Name:    {{ activeUser?.name ?? 'No user logged in' }}</p>
      <p>Email:   {{ activeUser?.email | uppercase }}</p>
      <p>Joined:  {{ joinDate | date:'mediumDate' }}</p>
      <button (click)="toggleUser()">{{ activeUser ? 'Logout' : 'Login' }}</button>
    </section>
  `,
})
class SafeNavAndPipesComponent {
  activeUser: { name: string; email: string } | null = null;
  joinDate = user.joinDate;

  toggleUser() {
    this.activeUser = this.activeUser
      ? null
      : { name: 'Jane Doe', email: 'jane@example.com' };
  }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    GreetingComponent,
    UserProfileComponent,
    PropertyBindingComponent,
    EventBindingComponent,
    SafeNavAndPipesComponent,
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 1.1 — Templates &amp; Interpolation</h1>
      <app-greeting />
      <hr />
      <app-user-profile />
      <hr />
      <app-property-binding />
      <hr />
      <app-event-binding />
      <hr />
      <app-safe-nav />
    </div>
  `,
})
export class AppComponent {}
