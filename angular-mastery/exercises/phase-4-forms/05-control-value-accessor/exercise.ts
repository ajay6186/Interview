import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

// ============================================================
// Exercise 4.5 — ControlValueAccessor
// ============================================================
// Topics:
//   • ControlValueAccessor interface
//   • NG_VALUE_ACCESSOR provider
//   • forwardRef()
//   • writeValue, registerOnChange, registerOnTouched, setDisabledState
//   • Integrating custom controls with FormGroup
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: StarRatingComponent
// ---------------------------------------------------------------------------
// Create a CVA component with selector 'app-star-rating'.
// It renders 5 clickable stars (★ / ☆).
// Implement ControlValueAccessor: writeValue(val), registerOnChange, registerOnTouched.
// Provide it via NG_VALUE_ACCESSOR.
// Use it inside a FormGroup with formControlName="rating".
//
// @Component({ selector: 'app-star-rating', standalone: true, ... })
// export class StarRatingComponent implements ControlValueAccessor { ... }

// ---------------------------------------------------------------------------
// TODO 2: PhoneInputComponent
// ---------------------------------------------------------------------------
// Create a CVA component with selector 'app-phone-input'.
// It formats phone numbers as (xxx) xxx-xxxx while the user types.
// Internally work with just digits, expose formatted string to the form.
// Implement ControlValueAccessor.
//
// @Component({ selector: 'app-phone-input', standalone: true, ... })
// export class PhoneInputComponent implements ControlValueAccessor { ... }

// ---------------------------------------------------------------------------
// TODO 3: ColorPickerComponent
// ---------------------------------------------------------------------------
// Create a CVA component with selector 'app-color-picker'.
// Display a palette of 6 preset colors as clickable swatches.
// Store and emit the selected hex color string.
// Implement ControlValueAccessor.
//
// @Component({ selector: 'app-color-picker', standalone: true, ... })
// export class ColorPickerComponent implements ControlValueAccessor { ... }

// ---------------------------------------------------------------------------
// TODO 4: ChipInputComponent
// ---------------------------------------------------------------------------
// Create a CVA component with selector 'app-chip-input'.
// User types text and presses Enter to add a chip/tag.
// Chips can be removed by clicking ×.
// The control value is string[].
// Implement ControlValueAccessor.
//
// @Component({ selector: 'app-chip-input', standalone: true, ... })
// export class ChipInputComponent implements ControlValueAccessor { ... }

// ---------------------------------------------------------------------------
// TODO 5: DateRangeComponent
// ---------------------------------------------------------------------------
// Create a CVA component with selector 'app-date-range'.
// Renders two date inputs: start and end.
// The control value is { start: string; end: string }.
// Implement ControlValueAccessor.
// Validate that end >= start and mark as invalid otherwise.
//
// @Component({ selector: 'app-date-range', standalone: true, ... })
// export class DateRangeComponent implements ControlValueAccessor { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add all exercise components
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 4.5 — ControlValueAccessor</h1>
      <!-- TODO: render all components -->
    </div>
  `,
})
export class AppComponent {}
