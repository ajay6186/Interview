// ============================================================
// Angular Mastery — Exercise Runner
// ============================================================
// HOW TO RUN AN EXERCISE:
//   1. Comment out the currently active import
//   2. Uncomment ONE exercise import below
//   3. Save — ng serve reloads automatically
//
// RULE: Only ONE import can be active at a time.
//       Every exercise file exports a class named AppComponent.
// ============================================================

import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { provideStore } from '@ngrx/store';
import { provideEffects } from '@ngrx/effects';
import { provideStoreDevtools } from '@ngrx/store-devtools';
import { ApplicationConfig } from '@angular/core';

// ── Default welcome screen ──────────────────────────────────
import { AppComponent } from './app/app.component';

// ── Phase 1: Fundamentals ───────────────────────────────────
// import { AppComponent } from '../exercises/phase-1-fundamentals/01-templates-interpolation/exercise';
// import { AppComponent } from '../exercises/phase-1-fundamentals/01-templates-interpolation/solution';
// import { AppComponent } from '../exercises/phase-1-fundamentals/01-templates-interpolation/examples';
// import { AppComponent } from '../exercises/phase-1-fundamentals/02-components/exercise';
// import { AppComponent } from '../exercises/phase-1-fundamentals/02-components/solution';
// import { AppComponent } from '../exercises/phase-1-fundamentals/02-components/examples';
// import { AppComponent } from '../exercises/phase-1-fundamentals/03-input-output/exercise';
// import { AppComponent } from '../exercises/phase-1-fundamentals/03-input-output/solution';
// import { AppComponent } from '../exercises/phase-1-fundamentals/03-input-output/examples';
// import { AppComponent } from '../exercises/phase-1-fundamentals/04-conditional-rendering/exercise';
// import { AppComponent } from '../exercises/phase-1-fundamentals/04-conditional-rendering/solution';
// import { AppComponent } from '../exercises/phase-1-fundamentals/04-conditional-rendering/examples';
// import { AppComponent } from '../exercises/phase-1-fundamentals/05-lists-for/exercise';
// import { AppComponent } from '../exercises/phase-1-fundamentals/05-lists-for/solution';
// import { AppComponent } from '../exercises/phase-1-fundamentals/05-lists-for/examples';

// ── Phase 2: Directives & Pipes ─────────────────────────────
// import { AppComponent } from '../exercises/phase-2-directives-pipes/01-built-in-directives/exercise';
// import { AppComponent } from '../exercises/phase-2-directives-pipes/01-built-in-directives/solution';
// import { AppComponent } from '../exercises/phase-2-directives-pipes/02-pipes/exercise';
// import { AppComponent } from '../exercises/phase-2-directives-pipes/02-pipes/solution';
// import { AppComponent } from '../exercises/phase-2-directives-pipes/03-template-variables/exercise';
// import { AppComponent } from '../exercises/phase-2-directives-pipes/03-template-variables/solution';
// import { AppComponent } from '../exercises/phase-2-directives-pipes/04-content-projection/exercise';
// import { AppComponent } from '../exercises/phase-2-directives-pipes/04-content-projection/solution';
// import { AppComponent } from '../exercises/phase-2-directives-pipes/05-custom-directives/exercise';
// import { AppComponent } from '../exercises/phase-2-directives-pipes/05-custom-directives/solution';

// ── Phase 3: Services & Lifecycle ───────────────────────────
// import { AppComponent } from '../exercises/phase-3-services-lifecycle/01-lifecycle-hooks/exercise';
// import { AppComponent } from '../exercises/phase-3-services-lifecycle/01-lifecycle-hooks/solution';
// import { AppComponent } from '../exercises/phase-3-services-lifecycle/02-services-di/exercise';
// import { AppComponent } from '../exercises/phase-3-services-lifecycle/02-services-di/solution';
// import { AppComponent } from '../exercises/phase-3-services-lifecycle/03-httpclient/exercise';
// import { AppComponent } from '../exercises/phase-3-services-lifecycle/03-httpclient/solution';
// import { AppComponent } from '../exercises/phase-3-services-lifecycle/04-signals/exercise';
// import { AppComponent } from '../exercises/phase-3-services-lifecycle/04-signals/solution';
// import { AppComponent } from '../exercises/phase-3-services-lifecycle/05-interceptors-guards/exercise';
// import { AppComponent } from '../exercises/phase-3-services-lifecycle/05-interceptors-guards/solution';

// ── Phase 4: Forms ──────────────────────────────────────────
// import { AppComponent } from '../exercises/phase-4-forms/01-template-driven/exercise';
// import { AppComponent } from '../exercises/phase-4-forms/01-template-driven/solution';
// import { AppComponent } from '../exercises/phase-4-forms/02-reactive-forms/exercise';
// import { AppComponent } from '../exercises/phase-4-forms/02-reactive-forms/solution';
// import { AppComponent } from '../exercises/phase-4-forms/03-validation/exercise';
// import { AppComponent } from '../exercises/phase-4-forms/03-validation/solution';
// import { AppComponent } from '../exercises/phase-4-forms/04-form-array/exercise';
// import { AppComponent } from '../exercises/phase-4-forms/04-form-array/solution';
// import { AppComponent } from '../exercises/phase-4-forms/05-control-value-accessor/exercise';
// import { AppComponent } from '../exercises/phase-4-forms/05-control-value-accessor/solution';

// ── Phase 5: RxJS ───────────────────────────────────────────
// import { AppComponent } from '../exercises/phase-5-rxjs/01-observables/exercise';
// import { AppComponent } from '../exercises/phase-5-rxjs/01-observables/solution';
// import { AppComponent } from '../exercises/phase-5-rxjs/02-transformation-operators/exercise';
// import { AppComponent } from '../exercises/phase-5-rxjs/02-transformation-operators/solution';
// import { AppComponent } from '../exercises/phase-5-rxjs/03-combination-operators/exercise';
// import { AppComponent } from '../exercises/phase-5-rxjs/03-combination-operators/solution';
// import { AppComponent } from '../exercises/phase-5-rxjs/04-error-handling/exercise';
// import { AppComponent } from '../exercises/phase-5-rxjs/04-error-handling/solution';
// import { AppComponent } from '../exercises/phase-5-rxjs/05-subjects/exercise';
// import { AppComponent } from '../exercises/phase-5-rxjs/05-subjects/solution';

// ── Phase 6: Routing ────────────────────────────────────────
// import { AppComponent } from '../exercises/phase-6-routing/01-router-basics/exercise';
// import { AppComponent } from '../exercises/phase-6-routing/01-router-basics/solution';
// import { AppComponent } from '../exercises/phase-6-routing/02-route-params/exercise';
// import { AppComponent } from '../exercises/phase-6-routing/02-route-params/solution';
// import { AppComponent } from '../exercises/phase-6-routing/03-guards/exercise';
// import { AppComponent } from '../exercises/phase-6-routing/03-guards/solution';
// import { AppComponent } from '../exercises/phase-6-routing/04-lazy-loading/exercise';
// import { AppComponent } from '../exercises/phase-6-routing/04-lazy-loading/solution';
// import { AppComponent } from '../exercises/phase-6-routing/05-nested-routes/exercise';
// import { AppComponent } from '../exercises/phase-6-routing/05-nested-routes/solution';

// ── Phase 7: State Management ───────────────────────────────
// import { AppComponent } from '../exercises/phase-7-state-management/01-signals-state/exercise';
// import { AppComponent } from '../exercises/phase-7-state-management/01-signals-state/solution';
// import { AppComponent } from '../exercises/phase-7-state-management/02-ngrx-basics/exercise';
// import { AppComponent } from '../exercises/phase-7-state-management/02-ngrx-basics/solution';
// import { AppComponent } from '../exercises/phase-7-state-management/03-ngrx-effects/exercise';
// import { AppComponent } from '../exercises/phase-7-state-management/03-ngrx-effects/solution';
// import { AppComponent } from '../exercises/phase-7-state-management/04-ngrx-entity/exercise';
// import { AppComponent } from '../exercises/phase-7-state-management/04-ngrx-entity/solution';
// import { AppComponent } from '../exercises/phase-7-state-management/05-component-store/exercise';
// import { AppComponent } from '../exercises/phase-7-state-management/05-component-store/solution';

// ── Phase 8: Extra Practice ─────────────────────────────────
// import { AppComponent } from '../exercises/phase-8-extra-practice/01-todo-app/exercise';
// import { AppComponent } from '../exercises/phase-8-extra-practice/01-todo-app/solution';
// import { AppComponent } from '../exercises/phase-8-extra-practice/02-data-fetching/exercise';
// import { AppComponent } from '../exercises/phase-8-extra-practice/02-data-fetching/solution';
// import { AppComponent } from '../exercises/phase-8-extra-practice/03-search-filter/exercise';
// import { AppComponent } from '../exercises/phase-8-extra-practice/03-search-filter/solution';
// import { AppComponent } from '../exercises/phase-8-extra-practice/04-stopwatch/exercise';
// import { AppComponent } from '../exercises/phase-8-extra-practice/04-stopwatch/solution';
// import { AppComponent } from '../exercises/phase-8-extra-practice/05-theme-service/exercise';
// import { AppComponent } from '../exercises/phase-8-extra-practice/05-theme-service/solution';
// import { AppComponent } from '../exercises/phase-8-extra-practice/06-cart/exercise';
// import { AppComponent } from '../exercises/phase-8-extra-practice/06-cart/solution';
// import { AppComponent } from '../exercises/phase-8-extra-practice/07-custom-services/exercise';
// import { AppComponent } from '../exercises/phase-8-extra-practice/07-custom-services/solution';
// import { AppComponent } from '../exercises/phase-8-extra-practice/08-multi-step-form/exercise';
// import { AppComponent } from '../exercises/phase-8-extra-practice/08-multi-step-form/solution';

const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(),
    provideRouter([]),
    provideStore({}),
    provideEffects([]),
    provideStoreDevtools({ maxAge: 25 }),
  ],
};

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err)
);
