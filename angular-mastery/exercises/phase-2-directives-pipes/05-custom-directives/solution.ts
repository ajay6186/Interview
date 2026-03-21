import {
  Component, Directive, Input, Output, EventEmitter,
  HostListener, ElementRef, TemplateRef, ViewContainerRef, Renderer2,
} from '@angular/core';

// ============================================================
// Solution 2.5 — Custom Directives
// ============================================================

// SOLUTION 1: HighlightDirective
@Directive({ selector: '[appHighlight]', standalone: true })
class HighlightDirective {
  @Input('appHighlight') highlightColor = 'yellow';

  constructor(private el: ElementRef) {}

  @HostListener('mouseenter') onEnter() {
    (this.el.nativeElement as HTMLElement).style.backgroundColor = this.highlightColor;
  }
  @HostListener('mouseleave') onLeave() {
    (this.el.nativeElement as HTMLElement).style.backgroundColor = '';
  }
}

// SOLUTION 2: ClickOutsideDirective
@Directive({ selector: '[appClickOutside]', standalone: true })
class ClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<void>();

  constructor(private el: ElementRef) {}

  @HostListener('document:click', ['$event.target'])
  onDocClick(target: HTMLElement) {
    if (!(this.el.nativeElement as HTMLElement).contains(target)) {
      this.clickOutside.emit();
    }
  }
}

// SOLUTION 3: LetDirective
interface LetContext { $implicit: unknown }

@Directive({ selector: '[appLet]', standalone: true })
class LetDirective {
  private view = this.vcr.createEmbeddedView(this.tpl, { $implicit: undefined as unknown });

  @Input('appLet') set value(v: unknown) {
    (this.view.context as LetContext).$implicit = v;
  }

  constructor(private tpl: TemplateRef<LetContext>, private vcr: ViewContainerRef) {}
}

// SOLUTION 4: RepeatDirective
@Directive({ selector: '[appRepeat]', standalone: true })
class RepeatDirective {
  @Input('appRepeat') set count(n: number) {
    this.vcr.clear();
    for (let i = 0; i < n; i++) {
      this.vcr.createEmbeddedView(this.tpl, { $implicit: i });
    }
  }
  constructor(private tpl: TemplateRef<{ $implicit: number }>, private vcr: ViewContainerRef) {}
}

// SOLUTION 5: TooltipDirective
@Directive({ selector: '[appTooltip]', exportAs: 'tooltip', standalone: true })
class TooltipDirective {
  @Input('appTooltip') text = '';
  isVisible = false;
  private tooltipEl: HTMLElement | null = null;

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  show() {
    if (this.tooltipEl) return;
    const tip = this.renderer.createElement('div') as HTMLElement;
    this.renderer.appendChild(tip, this.renderer.createText(this.text));
    this.renderer.setStyle(tip, 'position', 'absolute');
    this.renderer.setStyle(tip, 'background', '#333');
    this.renderer.setStyle(tip, 'color', '#fff');
    this.renderer.setStyle(tip, 'padding', '4px 10px');
    this.renderer.setStyle(tip, 'borderRadius', '4px');
    this.renderer.setStyle(tip, 'fontSize', '13px');
    this.renderer.setStyle(tip, 'whiteSpace', 'nowrap');
    this.renderer.setStyle(tip, 'zIndex', '9999');
    this.renderer.setStyle(tip, 'pointerEvents', 'none');
    const host = this.el.nativeElement as HTMLElement;
    const rect = host.getBoundingClientRect();
    this.renderer.setStyle(tip, 'top',  (rect.top + window.scrollY - 34) + 'px');
    this.renderer.setStyle(tip, 'left', (rect.left + window.scrollX) + 'px');
    this.renderer.appendChild(document.body, tip);
    this.tooltipEl = tip;
    this.isVisible = true;
  }

  hide() {
    if (this.tooltipEl) {
      this.renderer.removeChild(document.body, this.tooltipEl);
      this.tooltipEl = null;
    }
    this.isVisible = false;
  }

  toggle() { this.isVisible ? this.hide() : this.show(); }
}

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HighlightDirective, ClickOutsideDirective, LetDirective, RepeatDirective, TooltipDirective],
  template: `
    <div style="font-family: sans-serif; max-width: 700px; margin: 0 auto; padding: 20px;">
      <h1>Solution 2.5 — Custom Directives</h1>

      <h2>1. [appHighlight] — hover effect</h2>
      <div style="display: flex; gap: 10px; flex-wrap: wrap;">
        <p appHighlight style="padding: 8px 14px; border: 1px solid #ddd; border-radius: 6px; cursor: default;">
          Hover me (default yellow)
        </p>
        <p [appHighlight]="'#d4edda'" style="padding: 8px 14px; border: 1px solid #ddd; border-radius: 6px; cursor: default;">
          Hover me (green)
        </p>
        <p [appHighlight]="'#cce5ff'" style="padding: 8px 14px; border: 1px solid #ddd; border-radius: 6px; cursor: default;">
          Hover me (blue)
        </p>
      </div>
      <hr />

      <h2>2. [appClickOutside] — dropdown</h2>
      <div style="position: relative; display: inline-block;">
        <button (click)="dropOpen = !dropOpen"
                style="padding: 8px 16px; border-radius: 4px; cursor: pointer;">
          Menu {{ dropOpen ? '▲' : '▼' }}
        </button>
        @if (dropOpen) {
          <div appClickOutside (clickOutside)="dropOpen = false"
               style="position: absolute; top: 38px; left: 0; background: white;
                      border: 1px solid #ddd; border-radius: 6px; padding: 8px;
                      box-shadow: 0 4px 12px rgba(0,0,0,.15); z-index: 10; min-width: 150px;">
            <p style="margin: 4px 0; cursor: pointer; padding: 4px 8px;">Profile</p>
            <p style="margin: 4px 0; cursor: pointer; padding: 4px 8px;">Settings</p>
            <p style="margin: 4px 0; cursor: pointer; padding: 4px 8px;">Logout</p>
          </div>
        }
      </div>
      <p style="color: gray; font-size: 13px;">Click outside the dropdown to close it.</p>
      <hr />

      <h2>3. *appLet — local variable binding</h2>
      <ng-container *appLet="heavyComputation; let result">
        <p>Computed once: <strong>{{ result }}</strong></p>
        <p>Used again: <em>{{ result }}</em></p>
      </ng-container>
      <hr />

      <h2>4. *appRepeat — structural repeat</h2>
      <div style="display: flex; gap: 4px; font-size: 1.4rem; flex-wrap: wrap;">
        <ng-container *appRepeat="starCount; let i">
          <span title="Star {{ i + 1 }}">⭐</span>
        </ng-container>
      </div>
      <div style="margin-top: 8px; display: flex; gap: 6px; align-items: center;">
        <button (click)="starCount = starCount > 0 ? starCount - 1 : 0"
                style="padding: 4px 10px; cursor: pointer;">−</button>
        <span>{{ starCount }}</span>
        <button (click)="starCount = starCount + 1"
                style="padding: 4px 10px; cursor: pointer;">+</button>
      </div>
      <hr />

      <h2>5. [appTooltip] + exportAs</h2>
      <div style="display: flex; gap: 16px; flex-wrap: wrap;">
        <button appTooltip="I'm a tooltip!" #tip1="tooltip"
                (mouseenter)="tip1.show()" (mouseleave)="tip1.hide()"
                style="padding: 8px 16px; cursor: pointer; border-radius: 4px; border: 1px solid #ccc;">
          Hover for tooltip
        </button>
        <button appTooltip="Click me to toggle" #tip2="tooltip"
                (click)="tip2.toggle()"
                style="padding: 8px 16px; cursor: pointer; border-radius: 4px; border: 1px solid #3498db; color: #3498db;">
          Click toggle ({{ tip2.isVisible ? 'visible' : 'hidden' }})
        </button>
      </div>
    </div>
  `,
})
export class AppComponent {
  dropOpen          = false;
  heavyComputation  = 'Result of expensive calculation: 42';
  starCount         = 5;
}
