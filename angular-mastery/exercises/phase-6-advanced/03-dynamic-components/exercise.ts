// Phase 6 - Exercise 03: Dynamic Components
// Topics: ViewContainerRef.createComponent(), ComponentRef, NgComponentOutlet,
//         dynamic import, ComponentRef.setInput()

import { Component } from '@angular/core';

// ─────────────────────────────────────────────
// TODO 1: DynamicLoader — ViewContainerRef.createComponent()
//
// Create AlertComponent: selector 'app-alert'
//   - @Input() type: 'info' | 'success' | 'warning' | 'error' = 'info'
//   - @Input() message = ''
//   - Renders a styled alert box
//
// Create DynamicLoaderComponent:
//   - Has a <div #container></div> as the insertion point
//   - @ViewChild('container', { read: ViewContainerRef }) container!: ViewContainerRef
//   - Methods:
//     showInfo()    → viewContainerRef.createComponent(AlertComponent) + componentRef.setInput('type','info')
//     showSuccess() → ... type: 'success'
//     clearAll()    → viewContainerRef.clear()
//   - Each createComponent call appends to the container (or use viewContainerRef.clear() first)
// ─────────────────────────────────────────────

// TODO 1a: AlertComponent
// @Component({ ... })
// export class AlertComponent { }

// TODO 1b: DynamicLoaderComponent
// @Component({ ... })
// export class DynamicLoaderComponent { }

// ─────────────────────────────────────────────
// TODO 2: NgComponentOutlet — switch between components
//
// Create 3 simple components: WidgetA, WidgetB, WidgetC
// Create ComponentSwitcherComponent:
//   - Has a selectedComponent signal: Type<unknown> | null
//   - 3 buttons to set selectedComponent
//   - Uses NgComponentOutlet: <ng-container *ngComponentOutlet="selectedComponent()" />
//
// NgComponentOutlet options:
//   *ngComponentOutlet="comp; injector: customInjector; inputs: inputObj"
// ─────────────────────────────────────────────

// TODO 2: WidgetA, WidgetB, WidgetC + ComponentSwitcherComponent
// @Component({ ... })
// export class ComponentSwitcherComponent { }

// ─────────────────────────────────────────────
// TODO 3: DynamicFormField — create inputs dynamically based on config
//
// Define interface FieldConfig { type: 'text' | 'email' | 'number' | 'select'; label: string; key: string; options?: string[] }
//
// Create DynamicFormComponent:
//   - Has a fields: FieldConfig[] config array
//   - Uses ViewContainerRef.createComponent() to create:
//     TextFieldComponent, SelectFieldComponent
//   - After creating each component, call componentRef.setInput('config', fieldConfig)
//   - Listen to (valueChange) output: componentRef.instance.valueChange.subscribe(...)
// ─────────────────────────────────────────────

// TODO 3: FieldConfig + TextFieldComponent + SelectFieldComponent + DynamicFormComponent
// @Component({ ... })
// export class DynamicFormComponent { }

// ─────────────────────────────────────────────
// TODO 4: PortalComponent — render in a different DOM location
//
// Simple "portal" pattern using ViewContainerRef:
// - PortalOutletComponent: has a ViewContainerRef, registers itself in a service
// - PortalService: holds reference to the portal outlet's ViewContainerRef
// - PortalTriggerComponent: injects PortalService, calls createComponent(ModalComponent)
//   which renders into PortalOutletComponent's location (e.g. fixed overlay at bottom)
// ─────────────────────────────────────────────

// TODO 4: PortalService + PortalOutletComponent + PortalTriggerComponent + ModalComponent
// @Component({ ... })
// export class PortalTriggerComponent { }

// ─────────────────────────────────────────────
// TODO 5: ComponentRef communication — setInput() + @ViewChild
//
// Create a ProgressBarComponent:
//   - @Input() progress = 0 (0–100)
//   - Renders a progress bar
//
// Create DynamicProgressComponent:
//   - Creates ProgressBarComponent dynamically via ViewContainerRef
//   - Stores the ComponentRef
//   - Animates the progress: uses setInterval to call componentRef.setInput('progress', value)
//   - Destroys the component with componentRef.destroy()
// ─────────────────────────────────────────────

// TODO 5: ProgressBarComponent + DynamicProgressComponent
// @Component({ ... })
// export class DynamicProgressComponent { }

// ─────────────────────────────────────────────
// TODO 6: Add all components to imports[] in AppComponent
// ─────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO 6: import components here
  ],
  template: `
    <h1>Dynamic Components Exercise</h1>
    <!-- TODO 6: render components here -->
  `,
})
export class AppComponent {}
