import { Component } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

// ============================================================
// Exercise 4.4 — FormArray
// ============================================================
// Topics:
//   • FormArray of FormControls
//   • FormArray of FormGroups
//   • Dynamic add/remove fields
//   • Computed totals from FormArray values
//   • Nested FormArrays
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: TagsArrayComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-tags-array'.
// Import ReactiveFormsModule.
// Create a FormArray of FormControl strings for tags.
// Add an input + "Add Tag" button that pushes a new FormControl.
// Add a "Remove" button next to each tag to remove it.
// Display all current tags as a comma-separated list.
//
// @Component({ selector: 'app-tags-array', standalone: true, ... })
// export class TagsArrayComponent { ... }

// ---------------------------------------------------------------------------
// TODO 2: PhoneNumbersComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-phone-numbers'.
// Import ReactiveFormsModule.
// Create a FormArray of FormGroups, each with: type ('home'|'work'|'mobile') and number.
// Add "Add Phone" button. Remove button per entry.
// Display the list of phone numbers.
//
// @Component({ selector: 'app-phone-numbers', standalone: true, ... })
// export class PhoneNumbersComponent { ... }

// ---------------------------------------------------------------------------
// TODO 3: DynamicQuestionsComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-dynamic-questions'.
// Import ReactiveFormsModule.
// Create a FormArray where each item is a FormGroup with:
//   - question: string (required)
//   - type: 'text' | 'number' | 'boolean'
//   - answer: string
// Render a different input control based on the `type` field.
// Add/remove questions dynamically.
//
// @Component({ selector: 'app-dynamic-questions', standalone: true, ... })
// export class DynamicQuestionsComponent { ... }

// ---------------------------------------------------------------------------
// TODO 4: OrderItemsComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-order-items'.
// Import ReactiveFormsModule.
// Create a FormArray of FormGroups with: name, quantity (number), price (number).
// Use valueChanges to compute the order total reactively.
// Display total beneath the items.
//
// @Component({ selector: 'app-order-items', standalone: true, ... })
// export class OrderItemsComponent { ... }

// ---------------------------------------------------------------------------
// TODO 5: NestedFormArrayComponent
// ---------------------------------------------------------------------------
// Create a component with selector 'app-nested-form-array'.
// Import ReactiveFormsModule.
// Create a FormArray of categories. Each category is a FormGroup with:
//   - name: string
//   - items: FormArray of FormControls (strings)
// Allow adding categories and adding items within each category.
//
// @Component({ selector: 'app-nested-form-array', standalone: true, ... })
// export class NestedFormArrayComponent { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add all exercise components
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 4.4 — FormArray</h1>
      <!-- TODO: render all components -->
    </div>
  `,
})
export class AppComponent {}
