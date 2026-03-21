import { Component, inject, signal, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, ActivatedRoute, Router } from '@angular/router';

// ============================================================
// Solution 6.5 — Nested Routes
// ============================================================

const PRODUCTS = [
  { id: 1, name: 'Laptop',  price: 999 },
  { id: 2, name: 'Monitor', price: 399 },
  { id: 3, name: 'Keyboard', price: 79 },
];

// SOLUTION 2: Product components
@Component({ selector: 'app-product-list', standalone: true, imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul>
      @for (p of products; track p.id) {
        <li><a [routerLink]="[p.id]">{{ p.name }} — ${{ p.price }}</a></li>
      }
    </ul>
  ` })
class ProductListComponent { products = PRODUCTS; }

@Component({ selector: 'app-product-detail', standalone: true, imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (product()) {
      <h4>{{ product()!.name }}</h4><p>Price: ${{ product()!.price }}</p>
    }
    <a routerLink="..">← Back to Products</a>
  ` })
class ProductDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  product = signal<(typeof PRODUCTS)[0] | undefined>(undefined);
  ngOnInit() { this.route.paramMap.subscribe(p => this.product.set(PRODUCTS.find(x => x.id === +p.get('id')!))); }
}

// SOLUTION 1: Products shell
@Component({ selector: 'app-products-shell', standalone: true, imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h3>Products</h3><router-outlet />` })
class ProductsShellComponent {}

// SOLUTION 3: Settings with children
@Component({ selector: 'app-settings-profile', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h4>Profile Settings</h4><p>Edit your name and email.</p>` })
class SettingsProfileComponent {}

@Component({ selector: 'app-settings-security', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<h4>Security Settings</h4><p>Change password and 2FA.</p>` })
class SettingsSecurityComponent {}

@Component({ selector: 'app-settings', standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`a { margin-right: 12px; } a.active { font-weight: bold; }`],
  template: `
    <h3>Settings</h3>
    <nav>
      <a routerLink="profile"  routerLinkActive="active">Profile</a>
      <a routerLink="security" routerLinkActive="active">Security</a>
    </nav>
    <router-outlet />
  ` })
class SettingsComponent {}

// SOLUTION 4: Tabs with child routes
@Component({ selector: 'app-overview', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>Product overview content.</p>` })
class OverviewComponent {}

@Component({ selector: 'app-reviews', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>4.5 ★ — "Great product!"</p>` })
class ReviewsComponent {}

@Component({ selector: 'app-specs', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<p>RAM: 16GB | CPU: i7 | SSD: 512GB</p>` })
class SpecsComponent {}

@Component({
  selector: 'app-tabs',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: [`.tab { padding: 6px 12px; cursor: pointer; border-bottom: 2px solid transparent; text-decoration: none; color: #333; }
            .tab.active { border-bottom-color: #007bff; color: #007bff; font-weight: bold; }`],
  template: `
    <h3>Tabbed Interface (Child Routes)</h3>
    <nav style="display:flex;border-bottom:1px solid #ccc;margin-bottom:8px;">
      <a class="tab" routerLink="overview"  routerLinkActive="active">Overview</a>
      <a class="tab" routerLink="reviews"   routerLinkActive="active">Reviews</a>
      <a class="tab" routerLink="specs"     routerLinkActive="active">Specs</a>
    </nav>
    <router-outlet />
  `,
})
class TabsComponent {}

// SOLUTION 5: Relative navigation
@Component({
  selector: 'app-relative-nav',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>Relative Navigation</h3>
      <p>Current URL: <code>{{ currentUrl }}</code></p>
      <button (click)="goSibling()">../sibling (relative)</button>
      <button (click)="goChild()"   style="margin-left:8px">./child (relative)</button>
      <p><em>Relative navigation uses ActivatedRoute as a reference point.</em></p>
    </section>
  `,
})
class RelativeNavComponent {
  private router = inject(Router);
  private route  = inject(ActivatedRoute);
  currentUrl     = this.router.url;

  goSibling() { this.router.navigate(['../sibling'], { relativeTo: this.route }); }
  goChild()   { this.router.navigate(['./child'],    { relativeTo: this.route }); }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ProductsShellComponent, ProductListComponent, SettingsComponent,
            SettingsProfileComponent, TabsComponent, RelativeNavComponent, RouterOutlet],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 6.5 — Nested Routes</h1>
      <p><em>Nested route config:</em></p>
      <pre style="background:#f4f4f4;padding:8px;border-radius:4px;font-size:11px;">
{ path: 'products', component: ProductsShellComponent, children: [
  { path: '',   component: ProductListComponent },
  { path: ':id', component: ProductDetailComponent },
]}</pre>
      <app-products-shell />
      <app-product-list />
      <hr />
      <app-settings />
      <app-settings-profile />
      <hr />
      <app-tabs />
      <hr />
      <app-relative-nav />
    </div>
  `,
})
export class AppComponent {}
