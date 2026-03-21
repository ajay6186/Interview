import { Component, Input, Output, EventEmitter } from '@angular/core';

// ============================================================
// Exercise 1.3 — @Input / @Output (Data Flow)
// ============================================================
// Topics:
//   • @Input()  — parent passes data down to child
//   • @Output() — child emits events up to parent
//   • EventEmitter<T> — typed event bus
//   • Input with transform (booleanAttribute)
//   • Required @Input — @Input({ required: true })
//   • Two-way binding with a matching @Input / @Output pair
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: StatusBarComponent
// ---------------------------------------------------------------------------
// Create a child component selector='app-status-bar'.
// @Input() count: number = 0
// @Input() theme: 'light' | 'dark' = 'light'
// Template: a div whose background changes based on theme,
//   showing: "<count> tasks remaining"

// ---------------------------------------------------------------------------
// TODO 2: TodoItemComponent
// ---------------------------------------------------------------------------
// Create selector='app-todo-item'.
// @Input({ required: true }) todo!: { id: number; text: string; done: boolean }
// @Output() toggled = new EventEmitter<number>()   (emits todo.id)
// @Output() deleted = new EventEmitter<number>()   (emits todo.id)
// Template: a <li> with checkbox, text (strikethrough if done), and a Delete button.
//   checkbox (change) calls toggled.emit(todo.id)
//   button   (click)  calls deleted.emit(todo.id)

// ---------------------------------------------------------------------------
// TODO 3: ThemeToggleComponent
// ---------------------------------------------------------------------------
// Create selector='app-theme-toggle'.
// @Input()  theme: 'light' | 'dark' = 'light'
// @Output() themeChange = new EventEmitter<'light' | 'dark'>()
// Template: a button that, on click, emits the opposite theme.
//   Label: "Switch to {{ theme === 'light' ? 'Dark' : 'Light' }}"

// ---------------------------------------------------------------------------
// TODO 4: CounterChildComponent
// ---------------------------------------------------------------------------
// Create selector='app-counter-child'.
// @Input()  value: number = 0
// @Output() valueChange = new EventEmitter<number>()   // two-way convention
// Template: display value, buttons +/- that emit the new value.

// ---------------------------------------------------------------------------
// TODO 5: UserListComponent
// ---------------------------------------------------------------------------
// Create selector='app-user-list'.
// Data: users array with id, name, email objects.
// @Output() userSelected = new EventEmitter<{ id: number; name: string; email: string }>()
// Template: a <ul> where each <li> is a button showing user.name.
//   On click, emit the full user object.

// ---------------------------------------------------------------------------
// ROOT COMPONENT — manages all state, passes props down, handles emissions
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: add all child components
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 1.3 — @Input / @Output</h1>
      <!-- TODO 6: render each child component, bind inputs and output handlers -->
    </div>
  `,
})
export class AppComponent {}
