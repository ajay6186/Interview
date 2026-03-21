import { Component } from '@angular/core';

// ============================================================
// Exercise 2.5 — Custom Directives
// ============================================================
// Topics:
//   • @Directive({ selector: '[appX]', standalone: true })
//   • Attribute directives: inject ElementRef, HostListener, HostBinding
//   • Input on directive: @Input('appHighlight') color = 'yellow'
//   • Structural directives: createEmbeddedView / viewContainerRef
//   • exportAs — accessing directive instance in template
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: HighlightDirective
// ---------------------------------------------------------------------------
// @Directive({ selector: '[appHighlight]', standalone: true })
// @Input('appHighlight') highlightColor = 'yellow'
// @HostListener('mouseenter') onEnter() — sets background to highlightColor
// @HostListener('mouseleave') onLeave() — resets background to ''
// Inject ElementRef; use el.nativeElement.style.backgroundColor

// ---------------------------------------------------------------------------
// TODO 2: ClickOutsideDirective
// ---------------------------------------------------------------------------
// @Directive({ selector: '[appClickOutside]', standalone: true })
// @Output() clickOutside = new EventEmitter<void>()
// @HostListener('document:click', ['$event.target']) onDocClick(target: HTMLElement)
//   If this.el.nativeElement.contains(target) === false → emit clickOutside
// Demo: a dropdown that closes when clicking outside.

// ---------------------------------------------------------------------------
// TODO 3: LetDirective (structural — local variable binding)
// ---------------------------------------------------------------------------
// @Directive({ selector: '[appLet]', standalone: true })
// @Input('appLet') set value(v: unknown) { ... }
// Creates an embedded view with { $implicit: v } so the template can use
//   *appLet="expr as x" to bind expr to x locally.
// Inject: TemplateRef, ViewContainerRef

// ---------------------------------------------------------------------------
// TODO 4: RepeatDirective (structural)
// ---------------------------------------------------------------------------
// @Directive({ selector: '[appRepeat]', standalone: true })
// @Input('appRepeat') set count(n: number) { ... }
//   Clears the view container, then creates n embedded views,
//   each passing { $implicit: i } (index) to the template.
// Demo: <ng-container *appRepeat="5; let i">⭐ {{ i + 1 }}</ng-container>

// ---------------------------------------------------------------------------
// TODO 5: TooltipDirective (exportAs)
// ---------------------------------------------------------------------------
// @Directive({ selector: '[appTooltip]', exportAs: 'tooltip', standalone: true })
// @Input('appTooltip') text = ''
// isVisible = false
// show() / hide() / toggle() methods
// Creates a tooltip element dynamically (via Renderer2) positioned above the host.
// exportAs lets template do: <button appTooltip="Hi" #tip="tooltip" (click)="tip.toggle()">

// ---------------------------------------------------------------------------
// ROOT COMPONENT
// ---------------------------------------------------------------------------
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 2.5 — Custom Directives</h1>
      <!-- TODO 6: import directives and demo each one -->
    </div>
  `,
})
export class AppComponent {}
