// Phase 4 - Solution 03: Lazy Loading
// Topics: loadComponent(), loadChildren(), lazy routes, preloading strategies,
//         withPreloading, PreloadAllModules, route data, ResolveFn
//
// NOTE: True lazy loading splits code into separate bundles at build time.
// In this single-file demo we show the patterns with inline explanations.

import { Component, signal, Type, NgModule } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';

// ─────────────────────────────────────────────────────────────────────────────
// 1. FeatureComponent + loadComponent pattern
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-feature',
  standalone: true,
  template: `
    <div style="padding:1rem; background:#e8f5e9; border-radius:8px">
      <h3>Feature Component</h3>
      <p>I was loaded lazily! In a real app, I live in a separate chunk.</p>
    </div>
  `,
})
export class FeatureComponent {}

/*
// REAL loadComponent PATTERN (in routes array):
export const routes: Routes = [
  {
    path: 'feature',
    // Angular compiles this into a separate JS chunk at build time.
    // The chunk is only downloaded when the user first visits /feature.
    loadComponent: () =>
      import('./feature/feature.component').then(m => m.FeatureComponent),
  },
  {
    // loadChildren loads an entire lazy route module / sub-route config
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard.routes').then(m => m.DASHBOARD_ROUTES),
  },
];
*/

// ─────────────────────────────────────────────────────────────────────────────
// 2. LazyDemoComponent — dynamic import simulation
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-lazy-demo',
  standalone: true,
  imports: [NgComponentOutlet],
  template: `
    <div style="padding:1rem; background:#fff3e0; border-radius:8px; margin-bottom:1rem">
      <h3>Dynamic Import Demo</h3>
      <p style="font-size:0.9rem">
        In a real app, click would trigger
        <code>await import('./feature/feature.component')</code>
        which downloads the JS chunk on demand.
      </p>

      @if (!lazyComponent()) {
        <button (click)="loadFeature()"
                style="padding:0.4rem 1rem; background:#e65100; color:white; border:none; border-radius:4px; cursor:pointer">
          Load Feature Component Lazily
        </button>
      } @else {
        <p style="color:#2e7d32">Component loaded!</p>
        <!-- NgComponentOutlet renders a component type dynamically -->
        <ng-container *ngComponentOutlet="lazyComponent()!" />
      }
    </div>
  `,
})
export class LazyDemoComponent {
  lazyComponent = signal<Type<unknown> | null>(null);

  async loadFeature() {
    /*
    // REAL PATTERN — dynamic import (actual lazy loading):
    const { FeatureComponent } = await import('./feature/feature.component');
    this.lazyComponent.set(FeatureComponent);
    */

    // Simulated — component is already in memory but shows the pattern:
    await new Promise(r => setTimeout(r, 500)); // simulate network delay
    this.lazyComponent.set(FeatureComponent);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Preloading Strategies
// ─────────────────────────────────────────────────────────────────────────────

/*
// REAL PRELOADING SETUP in main.ts:
import { PreloadAllModules, withPreloading } from '@angular/router';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(
      routes,
      withPreloading(PreloadAllModules) // or custom strategy
    )
  ]
});

// CUSTOM PRELOADING STRATEGY:
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SelectivePreloadingStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    // Only preload routes with data.preload === true
    return route.data?.['preload'] === true ? load() : of(null);
  }
}

// Routes with preload flag:
// { path: 'feature', loadComponent: ..., data: { preload: true } }
*/

@Component({
  selector: 'app-preloading-demo',
  standalone: true,
  template: `
    <div style="padding:1rem; background:#e8eaf6; border-radius:8px; margin-bottom:1rem">
      <h3>Preloading Strategies</h3>
      <table style="width:100%; border-collapse:collapse; font-size:0.9rem">
        <thead>
          <tr style="background:#3949ab; color:white">
            <th style="padding:0.5rem; text-align:left">Strategy</th>
            <th style="padding:0.5rem; text-align:left">Behaviour</th>
            <th style="padding:0.5rem; text-align:left">Use When</th>
          </tr>
        </thead>
        <tbody>
          @for (row of strategies; track row.name) {
            <tr style="border-bottom:1px solid #ddd">
              <td style="padding:0.5rem"><code>{{ row.name }}</code></td>
              <td style="padding:0.5rem">{{ row.behaviour }}</td>
              <td style="padding:0.5rem">{{ row.useWhen }}</td>
            </tr>
          }
        </tbody>
      </table>

      <p style="margin-top:0.75rem; font-size:0.85rem; color:#555">
        Setup: <code>provideRouter(routes, withPreloading(PreloadAllModules))</code>
      </p>
    </div>
  `,
})
export class PreloadingDemoComponent {
  strategies = [
    {
      name: 'NoPreloading (default)',
      behaviour: 'Lazy chunks download only when user navigates to them',
      useWhen: 'Mobile / bandwidth-sensitive apps',
    },
    {
      name: 'PreloadAllModules',
      behaviour: 'After app loads, all lazy chunks download in background',
      useWhen: 'Desktop apps where bandwidth is plentiful',
    },
    {
      name: 'SelectivePreloadingStrategy',
      behaviour: 'Only preloads routes with data.preload === true',
      useWhen: 'Fine-grained control over which routes to preload',
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Route Data + ActivatedRoute.data
// ─────────────────────────────────────────────────────────────────────────────

/*
// Route with static data:
{
  path: 'my-page',
  component: RouteDataComponent,
  data: { title: 'My Page', breadcrumb: 'Home' },
}
*/

@Component({
  selector: 'app-route-data',
  standalone: true,
  template: `
    <div style="padding:1rem; background:#fce4ec; border-radius:8px; margin-bottom:1rem">
      <h3>Route Data Demo</h3>
      <p>
        Route data lets you attach static metadata to a route.
        Accessed via <code>inject(ActivatedRoute).data</code> Observable.
      </p>

      <div style="background:white; padding:0.75rem; border-radius:4px; font-size:0.9rem">
        <p><strong>Simulated route.data:</strong></p>
        <p>Title: <code>{{ routeData().title }}</code></p>
        <p>Breadcrumb: <code>{{ routeData().breadcrumb }}</code></p>
      </div>

      <pre style="background:#f5f5f5; padding:0.75rem; border-radius:4px; font-size:0.8rem; overflow:auto">{{ codeSnippet }}</pre>
    </div>
  `,
})
export class RouteDataComponent {
  // Simulated data — in real app comes from ActivatedRoute:
  routeData = signal({ title: 'My Page', breadcrumb: 'Home' });

  codeSnippet = `
// Real pattern:
export class RouteDataComponent implements OnInit {
  private route = inject(ActivatedRoute);
  routeData = signal<{ title: string; breadcrumb: string }>({ title: '', breadcrumb: '' });

  ngOnInit() {
    this.route.data.subscribe(data => {
      this.routeData.set(data as any);
    });
  }
}`.trim();
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Route Resolvers — ResolveFn<T>
// ─────────────────────────────────────────────────────────────────────────────

interface Post { id: number; title: string; body: string; }

/*
// REAL RESOLVER:
import { ResolveFn } from '@angular/router';
import { inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

export const postResolver: ResolveFn<Post> = (route, state) => {
  const http = inject(HttpClient);
  const id   = route.paramMap.get('id');
  return http.get<Post>(`https://jsonplaceholder.typicode.com/posts/${id}`);
};

// Register in routes:
// {
//   path: 'posts/:id',
//   component: PostDetailComponent,
//   resolve: { post: postResolver },
// }

// Component reads resolved data:
export class PostDetailComponent {
  private route = inject(ActivatedRoute);
  post = signal<Post | null>(null);

  ngOnInit() {
    this.route.data.subscribe(data => this.post.set(data['post']));
  }
}
*/

@Component({
  selector: 'app-post-detail',
  standalone: true,
  template: `
    <div style="padding:1rem; background:#f3e5f5; border-radius:8px; margin-bottom:1rem">
      <h3>Route Resolver Demo</h3>
      <p>
        <code>ResolveFn&lt;T&gt;</code> pre-fetches data before the component activates.
        The router waits for the Observable/Promise to complete, then passes the result
        via <code>route.data</code>.
      </p>

      <div style="background:white; padding:0.75rem; border-radius:4px">
        <p><strong>Resolved post (simulated):</strong></p>
        <p><strong>{{ post().title }}</strong></p>
        <p>{{ post().body }}</p>
      </div>

      <p style="font-size:0.85rem; color:#555; margin-top:0.75rem">
        Benefit: component never renders with empty/loading state — data is always ready.
        Trade-off: navigation appears "stuck" while resolving; use skeleton loaders for UX.
      </p>
    </div>
  `,
})
export class PostDetailComponent {
  // Simulated resolved data
  post = signal<Post>({
    id: 1,
    title: 'sunt aut facere repellat provident occaecati',
    body: 'quia et suscipit\nsuscipit recusandae consequuntur expedita...',
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// ROOT COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    LazyDemoComponent,
    PreloadingDemoComponent,
    RouteDataComponent,
    PostDetailComponent,
  ],
  template: `
    <div style="font-family:sans-serif; max-width:800px; margin:2rem auto; padding:0 1rem">
      <h1>Phase 4 – Lazy Loading Demo</h1>

      <app-lazy-demo />
      <app-preloading-demo />
      <app-route-data />
      <app-post-detail />

      <div style="margin-top:2rem; padding:1rem; background:#f5f5f5; border-radius:8px; font-size:0.85rem">
        <strong>Lazy Loading Cheat Sheet:</strong>
        <ul>
          <li><code>loadComponent: () => import(...).then(m => m.Comp)</code> — lazy standalone component</li>
          <li><code>loadChildren: () => import(...).then(m => m.ROUTES)</code> — lazy sub-route config</li>
          <li><code>withPreloading(PreloadAllModules)</code> — pre-download lazy chunks in background</li>
          <li><code>resolve: &#123; post: postResolver &#125;</code> — pre-fetch data before component renders</li>
          <li><code>data: &#123; title: 'X' &#125;</code> — attach static metadata to a route</li>
        </ul>
      </div>
    </div>
  `,
})
export class AppComponent {}
