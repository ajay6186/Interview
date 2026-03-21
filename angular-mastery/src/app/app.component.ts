import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 60px auto; padding: 20px; text-align: center;">
      <h1 style="font-size: 2.5rem; color: #dd0031;">🅰 Angular Mastery</h1>
      <p style="font-size: 1.1rem; color: #555; margin-bottom: 32px;">
        A structured practice curriculum — 8 phases, 43 exercises, 350+ examples.
      </p>

      <div style="text-align: left; background: #f9f9f9; border-radius: 8px; padding: 24px; margin-bottom: 32px;">
        <h2 style="margin-top: 0;">How to start an exercise</h2>
        <ol style="line-height: 2;">
          <li>Open <code>src/main.ts</code></li>
          <li>Comment out the current active import</li>
          <li>Uncomment ONE exercise import</li>
          <li>Save — the dev server reloads automatically</li>
        </ol>
        <p><strong>Run type-check on all solutions:</strong> <code>npm run check</code></p>
        <p><strong>Start dev server:</strong> <code>npm start</code></p>
      </div>

      <div style="text-align: left;">
        <h2>Phases</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 0.95rem;">
          <thead>
            <tr style="background: #dd0031; color: white;">
              <th style="padding: 8px 12px; text-align: left;">Phase</th>
              <th style="padding: 8px 12px; text-align: left;">Topic</th>
              <th style="padding: 8px 12px; text-align: left;">Exercises</th>
            </tr>
          </thead>
          <tbody>
            @for (phase of phases; track phase.num; let even = $even) {
              <tr [style.background]="even ? '#f5f5f5' : 'white'">
                <td style="padding: 8px 12px; font-weight: bold;">{{ phase.num }}</td>
                <td style="padding: 8px 12px;">{{ phase.name }}</td>
                <td style="padding: 8px 12px; color: #666;">{{ phase.boxes }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <p style="margin-top: 32px; color: #999; font-size: 0.85rem;">
        Angular 17 · Standalone Components · Signals · NgRx · RxJS 7
      </p>
    </div>
  `,
})
export class AppComponent {
  phases = [
    { num: 1, name: 'Fundamentals',          boxes: '01 Templates · 02 Components · 03 Input/Output · 04 Conditionals · 05 Lists' },
    { num: 2, name: 'Directives & Pipes',    boxes: '01 Built-in Directives · 02 Pipes · 03 Template Vars · 04 Content Projection · 05 Custom Directives' },
    { num: 3, name: 'Services & Lifecycle',  boxes: '01 Lifecycle Hooks · 02 Services & DI · 03 HttpClient · 04 Signals · 05 Interceptors & Guards' },
    { num: 4, name: 'Forms',                 boxes: '01 Template-Driven · 02 Reactive · 03 Validation · 04 FormArray · 05 ControlValueAccessor' },
    { num: 5, name: 'RxJS',                  boxes: '01 Observables · 02 Transformation · 03 Combination · 04 Error Handling · 05 Subjects' },
    { num: 6, name: 'Routing',               boxes: '01 Router Basics · 02 Route Params · 03 Guards · 04 Lazy Loading · 05 Nested Routes' },
    { num: 7, name: 'State Management',      boxes: '01 Signals State · 02 NgRx Basics · 03 NgRx Effects · 04 NgRx Entity · 05 ComponentStore' },
    { num: 8, name: 'Extra Practice',        boxes: 'Todo · Data Fetching · Search · Stopwatch · Theme · Cart · Services · Multi-Step Form' },
  ];
}
