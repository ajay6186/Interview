// Phase 8 - Extra Practice 01: Full-Featured Todo App
// ══════════════════════════════════════════════════════════════
// Build a complete Todo Application from scratch.
// This is an open-ended project — use any Angular concepts you've learned.
// ══════════════════════════════════════════════════════════════
//
// WHAT TO BUILD:
//   A production-quality todo app with filtering, priorities, tags, persistence,
//   and drag-and-drop reordering.
//
// SUGGESTED COMPONENT ARCHITECTURE:
//   AppComponent
//   ├── HeaderComponent          (app title, user greeting, dark mode toggle)
//   ├── AddTodoFormComponent     (reactive form with validation)
//   ├── FilterBarComponent       (filter by status, priority, tags, search)
//   ├── TodoListComponent        (list container with @for + trackBy)
//   │   └── TodoItemComponent    (individual todo with inline edit)
//   ├── TodoStatsComponent       (completed %, active count, overdue count)
//   └── EmptyStateComponent      (shown when no todos match filter)
//
// FEATURES TO IMPLEMENT:
//   1. Add todo (title, optional due date, priority: low/medium/high, tags)
//   2. Mark todo as complete/incomplete (checkbox)
//   3. Edit todo inline (double-click to edit, Enter/Escape to confirm/cancel)
//   4. Delete todo with confirmation dialog
//   5. Filter by: All / Active / Completed / Overdue
//   6. Filter by priority and search by title
//   7. Sort by: created date, due date, priority, alphabetical
//   8. Persist to localStorage (survive page refresh)
//   9. Undo last delete (keep a deletedTodo buffer for 5 seconds)
//  10. Stats bar: X tasks, Y completed, Z overdue
//
// ANGULAR CONCEPTS TO PRACTICE:
//   - Standalone components with ChangeDetectionStrategy.OnPush
//   - signals + computed for all state management
//   - ReactiveFormsModule (FormGroup, Validators, FormArray for tags)
//   - @for with track, @if, @switch in templates
//   - Custom pipes: FilterPipe (pure), RelativeDatePipe (impure)
//   - @Input() / @Output() for component communication
//   - inject(DOCUMENT) for localStorage access (SSR-safe)
//   - DestroyRef for cleanup
//   - Unit tests: TestBed + fakeAsync for the service
//
// HINTS:
//   - Use a TodoService with signals for state (or NgRx Signal Store)
//   - Use localStorage.setItem('todos', JSON.stringify(todos)) for persistence
//   - Overdue = todo.dueDate < today && !todo.completed
//   - Use DatePipe for formatting dates
//   - Drag-and-drop: CDK DragDropModule (@angular/cdk/drag-drop)

import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  template: `
    <div style="font-family:sans-serif; padding:2rem; max-width:700px; margin:0 auto">
      <h1>Todo App — Exercise 01</h1>
      <p>Build the full todo application described in the comments above.</p>
      <p style="color:#888">Replace this stub with your implementation.</p>
    </div>
  `,
})
export class AppComponent {}
