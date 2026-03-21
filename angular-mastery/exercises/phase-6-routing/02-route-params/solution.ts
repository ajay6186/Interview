import { Component, inject, Input, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs/operators';

// ============================================================
// Solution 6.2 — Route Parameters
// ============================================================

const USERS = [
  { id: 1, name: 'Alice', role: 'Admin' },
  { id: 2, name: 'Bob',   role: 'User' },
  { id: 3, name: 'Carol', role: 'Editor' },
];

// SOLUTION 1: UserListComponent
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>User List</h3>
      <ul>
        @for (user of users; track user.id) {
          <li><a [routerLink]="['/users', user.id]">{{ user.name }} ({{ user.role }})</a></li>
        }
      </ul>
    </section>
  `,
})
class UserListComponent {
  users = USERS;
}

// SOLUTION 2: UserDetailComponent
@Component({
  selector: 'app-user-detail',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>User Detail</h3>
      @if (user()) {
        <p><strong>Name:</strong> {{ user()!.name }}</p>
        <p><strong>Role:</strong> {{ user()!.role }}</p>
        <p><strong>ID:</strong> {{ user()!.id }}</p>
      } @else {
        <p>User not found.</p>
      }
      <a routerLink="/users">← Back to list</a>
    </section>
  `,
})
class UserDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  user = signal<(typeof USERS)[0] | undefined>(undefined);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = Number(params.get('id'));
      this.user.set(USERS.find(u => u.id === id));
    });
  }
}

// SOLUTION 3: SearchComponent with query params
const ITEMS = ['Angular', 'React', 'Vue', 'Svelte', 'TypeScript', 'JavaScript', 'CSS'];

@Component({
  selector: 'app-search',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Query Params Search</h3>
      <p>q={{ q() }} | Filtered: {{ filtered().join(', ') }}</p>
      <button (click)="search('ang')">Search "ang"</button>
      <button (click)="search('s')" style="margin-left:8px">Search "s"</button>
      <button (click)="search('')" style="margin-left:8px">Clear</button>
    </section>
  `,
})
class SearchComponent {
  private route  = inject(ActivatedRoute);
  private router = inject(Router);

  q        = toSignal(this.route.queryParamMap.pipe(map(p => p.get('q') ?? '')), { initialValue: '' });
  filtered = signal(ITEMS);

  search(q: string) {
    this.router.navigate([], { queryParams: { q }, relativeTo: this.route });
    this.filtered.set(q ? ITEMS.filter(i => i.toLowerCase().includes(q.toLowerCase())) : ITEMS);
  }
}

// SOLUTION 4: withComponentInputBinding
@Component({
  selector: 'app-input-binding',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>withComponentInputBinding</h3>
      <p>Route :id received as @Input: <strong>{{ id }}</strong></p>
      <p><em>Requires withComponentInputBinding() in provideRouter(...).</em></p>
    </section>
  `,
})
class InputBindingComponent {
  @Input() id = '';
}

// SOLUTION 5: Breadcrumb
@Component({
  selector: 'app-breadcrumb',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Breadcrumb</h3>
      <p>{{ breadcrumb() }}</p>
      <p><em>Built from ActivatedRoute snapshot hierarchy.</em></p>
    </section>
  `,
})
class BreadcrumbComponent implements OnInit {
  private route  = inject(ActivatedRoute);
  breadcrumb     = signal('');

  ngOnInit() {
    const parts: string[] = ['Home'];
    let r: ActivatedRoute | null = this.route.root;
    while (r) {
      const seg = r.snapshot.url.map(s => s.path).join('/');
      if (seg) parts.push(seg);
      r = r.firstChild;
    }
    this.breadcrumb.set(parts.join(' > '));
  }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [UserListComponent, UserDetailComponent, SearchComponent,
            InputBindingComponent, BreadcrumbComponent, RouterOutlet],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 6.2 — Route Parameters</h1>
      <p><em>Configure routes in main.ts: /users → UserListComponent, /users/:id → UserDetailComponent</em></p>
      <app-breadcrumb />
      <hr />
      <app-user-list />
      <hr />
      <app-search />
      <hr />
      <app-input-binding [id]="'42'" />
      <router-outlet />
    </div>
  `,
})
export class AppComponent {}
