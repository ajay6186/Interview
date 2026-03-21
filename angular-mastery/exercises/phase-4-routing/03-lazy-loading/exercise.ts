// Phase 4 - Exercise 03: Lazy Loading
// Topics: loadComponent(), loadChildren(), lazy routes, preloading strategies,
//         withPreloading, PreloadAllModules, route data, ResolveFn
//
// Docs: https://angular.dev/guide/routing/lazy-loading

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: Explain and demonstrate loadComponent() pattern
//
// In your routes array, use loadComponent to lazy-load a standalone component:
//
//   { path: 'feature', loadComponent: () => import('./feature/feature.component').then(m => m.FeatureComponent) }
//
// - Create a FeatureComponent with selector 'app-feature'
// - Add a simple template explaining it was loaded lazily
// - Add to routes using loadComponent pattern (shown in comment)
// ─────────────────────────────────────────────

// TODO 1: FeatureComponent
// @Component({ ... })
// export class FeatureComponent { }

// ─────────────────────────────────────────────
// TODO 2: Simulate a lazy-loaded button
//
// Create a LazyDemoComponent with:
// - A "Load Feature" button
// - When clicked, dynamically import a component using:
//   const { FeatureComponent } = await import('./feature/feature.component');
//   this.lazyComponent.set(FeatureComponent);
// - Display the lazy component using NgComponentOutlet
// ─────────────────────────────────────────────

// TODO 2: LazyDemoComponent
// @Component({ ... })
// export class LazyDemoComponent { }

// ─────────────────────────────────────────────
// TODO 3: Preloading Strategies
//
// Create a PreloadingInfoComponent that explains:
// - Default: no preloading (lazy chunks only load on demand)
// - PreloadAllModules: preloads all lazy routes after the app loads
// - Custom preloading strategy: implements PreloadingStrategy, checks route.data['preload']
//
// Show the configuration in a comment block:
//   provideRouter(routes, withPreloading(PreloadAllModules))
//
// Create a PreloadingDemoComponent to display the explanation in the template.
// ─────────────────────────────────────────────

// TODO 3: PreloadingDemoComponent
// @Component({ ... })
// export class PreloadingDemoComponent { }

// ─────────────────────────────────────────────
// TODO 4: Route Data + ActivatedRoute.data
//
// Create a RouteDataComponent that:
// - Reads { data: { title: 'My Page', breadcrumb: 'Home' } } from route config
// - Injects ActivatedRoute and subscribes to route.data observable
// - Displays the title and breadcrumb from route data in the template
//
// Route config example:
//   { path: 'my-page', component: RouteDataComponent, data: { title: 'My Page', breadcrumb: 'Home' } }
// ─────────────────────────────────────────────

// TODO 4: RouteDataComponent
// @Component({ ... })
// export class RouteDataComponent { }

// ─────────────────────────────────────────────
// TODO 5: Route Resolvers — ResolveFn<T>
//
// - Define interface Post { id: number; title: string; body: string; }
// - Create a postResolver: ResolveFn<Post> that:
//     - injects HttpClient
//     - reads :id from the route snapshot
//     - fetches from https://jsonplaceholder.typicode.com/posts/:id
//     - returns the Observable
// - Create a PostDetailComponent that:
//     - reads resolved data via inject(ActivatedRoute).data (access post as data['post'])
//     - displays title and body
//
// Route config:
//   { path: 'posts/:id', component: PostDetailComponent, resolve: { post: postResolver } }
// ─────────────────────────────────────────────

// TODO 5: postResolver + PostDetailComponent
// export const postResolver: ResolveFn<Post> = (route, state) => { ... }
// @Component({ ... })
// export class PostDetailComponent { }

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
    <h1>Lazy Loading Exercise</h1>
    <!-- TODO 6: render components here -->
  `,
})
export class AppComponent {}
