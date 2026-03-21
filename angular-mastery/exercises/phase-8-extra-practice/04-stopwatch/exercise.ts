import { Component } from '@angular/core';

// ============================================================
// Exercise 8.4 — Stopwatch
// ============================================================
// Topics:
//   • Signals-based timer with setInterval
//   • Computed formatting (MM:SS:ms)
//   • Lap tracking with delta times
//   • Component decomposition
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: TimerService
// ---------------------------------------------------------------------------
// Create a TimerService decorated with @Injectable({ providedIn: 'root' }).
// Signals:
//   - elapsed: number (ms since start / since last resume)
//   - startTime: number | null (Date.now() when started/resumed)
//   - isRunning: boolean
//   - laps: number[] (array of elapsed ms at time of each lap)
// Methods:
//   - start() — set isRunning, record startTime, begin incrementing elapsed
//   - stop() — pause, save accumulated elapsed
//   - reset() — clear everything
//   - lap() — push current elapsed to laps array
// Use setInterval for the timer, clearInterval on stop.
//
// @Injectable({ providedIn: 'root' })
// export class TimerService { ... }

// ---------------------------------------------------------------------------
// TODO 2: StopwatchDisplayComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-stopwatch-display'.
// Inject TimerService.
// Compute formatted time from elapsed ms → MM:SS.ms format.
// Display in a large monospace font.
//
// Helper: formatTime(ms: number): string
//   mins = Math.floor(ms / 60000)
//   secs = Math.floor((ms % 60000) / 1000)
//   centis = Math.floor((ms % 1000) / 10)
//
// @Component({ selector: 'app-stopwatch-display', standalone: true, ... })
// export class StopwatchDisplayComponent { ... }

// ---------------------------------------------------------------------------
// TODO 3: ControlsComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-stopwatch-controls'.
// Inject TimerService.
// Buttons:
//   - Start / Stop (toggle based on isRunning)
//   - Reset (disabled while running)
//   - Lap (only enabled while running)
//
// @Component({ selector: 'app-stopwatch-controls', standalone: true, ... })
// export class ControlsComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: LapListComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-lap-list'.
// Inject TimerService.
// Display each lap time formatted as MM:SS.ms.
// Show the delta time (difference from previous lap).
// Show lap number (Lap 1, Lap 2, ...).
//
// @Component({ selector: 'app-lap-list', standalone: true, ... })
// export class LapListComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: Full Stopwatch App
// ---------------------------------------------------------------------------
// The AppComponent assembles all sub-components:
//   - StopwatchDisplayComponent (top)
//   - ControlsComponent (middle)
//   - LapListComponent (bottom)

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add StopwatchDisplayComponent, ControlsComponent, LapListComponent
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 400px; margin: 0 auto; padding: 20px; text-align: center;">
      <h1>Exercise 8.4 — Stopwatch</h1>
      <!-- TODO: render stopwatch components -->
    </div>
  `,
})
export class AppComponent {}
