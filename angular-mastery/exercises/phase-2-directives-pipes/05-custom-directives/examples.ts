import {
  Component,
  Directive,
  HostListener,
  HostBinding,
  Input,
  Output,
  EventEmitter,
  ElementRef,
  Renderer2,
  AfterViewInit,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  EmbeddedViewRef,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';

// ============================================================
// Examples 2.5 — Custom Directives (50 examples)
// BASIC (1–13) | INTERMEDIATE (14–26) | NESTED (27–38) | ADVANCED (39–50)
// ============================================================

// ─── BASIC (1–13) ───────────────────────────────────────────

// 1. Attribute directive changes background color
@Directive({ selector: '[appHighlight]', standalone: true })
class AppHighlightDirective {
  private el = inject(ElementRef);
  constructor() {
    this.el.nativeElement.style.backgroundColor = '#fff9c4';
  }
}

@Component({
  selector: 'ex-01',
  standalone: true,
  imports: [AppHighlightDirective],
  template: `<p appHighlight style="padding:6px">I have a yellow background via directive.</p>`,
})
class Ex01 {}

// 2. @HostListener('click') toggles class
@Directive({ selector: '[appToggleClass]', standalone: true })
class AppToggleClassDirective {
  private el = inject(ElementRef);
  private active = false;

  @HostListener('click')
  onClick() {
    this.active = !this.active;
    this.el.nativeElement.style.outline = this.active ? '2px solid #2196F3' : '';
  }
}

@Component({
  selector: 'ex-02',
  standalone: true,
  imports: [AppToggleClassDirective],
  template: `<button appToggleClass style="padding:6px 12px">Click to toggle outline</button>`,
})
class Ex02 {}

// 3. @HostBinding('style.color') sets color
@Directive({ selector: '[appRed]', standalone: true })
class AppRedDirective {
  @HostBinding('style.color') color = 'red';
}

@Component({
  selector: 'ex-03',
  standalone: true,
  imports: [AppRedDirective],
  template: `<span appRed>This text is red via @HostBinding.</span>`,
})
class Ex03 {}

// 4. @Input() receives highlight color
@Directive({ selector: '[appColor]', standalone: true })
class AppColorDirective {
  private el = inject(ElementRef);

  @Input() set appColor(color: string) {
    this.el.nativeElement.style.backgroundColor = color || 'transparent';
  }
}

@Component({
  selector: 'ex-04',
  standalone: true,
  imports: [AppColorDirective],
  template: `<p [appColor]="'#bbdefb'" style="padding:6px">Background set via @Input directive.</p>`,
})
class Ex04 {}

// 5. @HostListener('mouseenter') / ('mouseleave') hover
@Directive({ selector: '[appHover]', standalone: true })
class AppHoverDirective {
  private el = inject(ElementRef);

  @HostListener('mouseenter')
  onEnter() { this.el.nativeElement.style.backgroundColor = '#c8e6c9'; }

  @HostListener('mouseleave')
  onLeave() { this.el.nativeElement.style.backgroundColor = ''; }
}

@Component({
  selector: 'ex-05',
  standalone: true,
  imports: [AppHoverDirective],
  template: `<p appHover style="padding:6px;cursor:pointer">Hover to change background.</p>`,
})
class Ex05 {}

// 6. Directive adds CSS class on click
@Directive({ selector: '[appAddClass]', standalone: true })
class AppAddClassDirective {
  @HostBinding('class.selected') selected = false;

  @HostListener('click')
  onClick() { this.selected = !this.selected; }
}

@Component({
  selector: 'ex-06',
  standalone: true,
  imports: [AppAddClassDirective],
  template: `
    <style>.selected { font-weight:bold; color:#673AB7; }</style>
    <span appAddClass style="cursor:pointer;padding:4px">Click to add .selected class</span>
  `,
})
class Ex06 {}

// 7. Directive uses inject(ElementRef) to access DOM
@Directive({ selector: '[appBorder]', standalone: true })
class AppBorderDirective {
  private el = inject(ElementRef);
  constructor() {
    this.el.nativeElement.style.border = '2px dashed #FF9800';
    this.el.nativeElement.style.padding = '4px';
  }
}

@Component({
  selector: 'ex-07',
  standalone: true,
  imports: [AppBorderDirective],
  template: `<div appBorder>Direct DOM access via inject(ElementRef).</div>`,
})
class Ex07 {}

// 8. Directive uses inject(Renderer2) safely
@Directive({ selector: '[appSafe]', standalone: true })
class AppSafeDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  constructor() {
    this.renderer.setStyle(this.el.nativeElement, 'border-radius', '8px');
    this.renderer.setStyle(this.el.nativeElement, 'background', '#e8f5e9');
    this.renderer.setStyle(this.el.nativeElement, 'padding', '6px');
  }
}

@Component({
  selector: 'ex-08',
  standalone: true,
  imports: [AppSafeDirective],
  template: `<div appSafe>Styled safely using inject(Renderer2).</div>`,
})
class Ex08 {}

// 9. Auto-focus directive (ngAfterViewInit + .focus())
@Directive({ selector: '[appAutoFocus]', standalone: true })
class AppAutoFocusDirective implements AfterViewInit {
  private el = inject(ElementRef);
  ngAfterViewInit() {
    this.el.nativeElement.focus();
  }
}

@Component({
  selector: 'ex-09',
  standalone: true,
  imports: [AppAutoFocusDirective],
  template: `<input appAutoFocus placeholder="Auto-focused on init" style="padding:4px;border:1px solid #2196F3;outline:none" />`,
})
class Ex09 {}

// 10. Tooltip on hover directive (title attribute)
@Directive({ selector: '[appTooltip]', standalone: true })
class AppTooltipDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  @Input() appTooltip = '';

  @HostListener('mouseenter')
  onEnter() {
    this.renderer.setAttribute(this.el.nativeElement, 'title', this.appTooltip);
  }
}

@Component({
  selector: 'ex-10',
  standalone: true,
  imports: [AppTooltipDirective],
  template: `<span [appTooltip]="'I am a tooltip!'" style="text-decoration:underline dotted;cursor:help">Hover for tooltip</span>`,
})
class Ex10 {}

// 11. Click-outside detection directive
@Directive({ selector: '[appClickOutside]', standalone: true })
class AppClickOutsideDirective {
  @Output() clickOutside = new EventEmitter<void>();
  private el = inject(ElementRef);

  @HostListener('document:click', ['$event.target'])
  onClick(target: HTMLElement) {
    if (!this.el.nativeElement.contains(target)) {
      this.clickOutside.emit();
    }
  }
}

@Component({
  selector: 'ex-11',
  standalone: true,
  imports: [AppClickOutsideDirective],
  template: `
    <div appClickOutside (clickOutside)="msg='Clicked outside!'" style="border:1px solid #ccc;padding:8px;display:inline-block">
      <span>Click outside this box</span>
    </div>
    <span style="margin-left:8px;color:#F44336">{{ msg }}</span>
  `,
})
class Ex11 {
  msg = '';
}

// 12. Disable right-click directive
@Directive({ selector: '[appNoRightClick]', standalone: true })
class AppNoRightClickDirective {
  @HostListener('contextmenu', ['$event'])
  onContextMenu(e: Event) { e.preventDefault(); }
}

@Component({
  selector: 'ex-12',
  standalone: true,
  imports: [AppNoRightClickDirective],
  template: `<div appNoRightClick style="border:1px solid #ccc;padding:8px">Right-click is disabled on this element.</div>`,
})
class Ex12 {}

// 13. Copy-to-clipboard on click directive
@Directive({ selector: '[appCopyClipboard]', standalone: true })
class AppCopyClipboardDirective {
  @Input() appCopyClipboard = '';
  @Output() copied = new EventEmitter<void>();

  @HostListener('click')
  onClick() {
    navigator.clipboard?.writeText(this.appCopyClipboard).then(() => this.copied.emit());
  }
}

@Component({
  selector: 'ex-13',
  standalone: true,
  imports: [AppCopyClipboardDirective],
  template: `
    <button [appCopyClipboard]="'Hello Angular!'" (copied)="msg='Copied!'" style="padding:4px 10px">
      Copy "Hello Angular!"
    </button>
    <span style="margin-left:8px;color:green">{{ msg }}</span>
  `,
})
class Ex13 {
  msg = '';
}

// ─── INTERMEDIATE (14–26) ────────────────────────────────────

// 14. Directive with multiple @HostListener events
@Directive({ selector: '[appMultiEvent]', standalone: true })
class AppMultiEventDirective {
  @Output() eventLog = new EventEmitter<string>();

  @HostListener('click') onClick() { this.eventLog.emit('click'); }
  @HostListener('mouseenter') onEnter() { this.eventLog.emit('mouseenter'); }
  @HostListener('mouseleave') onLeave() { this.eventLog.emit('mouseleave'); }
}

@Component({
  selector: 'ex-14',
  standalone: true,
  imports: [AppMultiEventDirective],
  template: `
    <button appMultiEvent (eventLog)="last=$event" style="padding:6px 12px">Interact with me</button>
    <span style="margin-left:8px;color:#555">Last event: {{ last }}</span>
  `,
})
class Ex14 {
  last = '';
}

// 15. Directive with @HostBinding class + style
@Directive({ selector: '[appStatus]', standalone: true })
class AppStatusDirective {
  @Input() appStatus: 'success' | 'error' | 'info' = 'info';

  @HostBinding('style.background')
  get bg() {
    return { success: '#e8f5e9', error: '#ffebee', info: '#e3f2fd' }[this.appStatus];
  }

  @HostBinding('style.borderLeft')
  get border() {
    return { success: '4px solid #4CAF50', error: '4px solid #F44336', info: '4px solid #2196F3' }[this.appStatus];
  }
}

@Component({
  selector: 'ex-15',
  standalone: true,
  imports: [AppStatusDirective],
  template: `
    <div [appStatus]="'success'" style="padding:6px;margin-bottom:4px">Success message</div>
    <div [appStatus]="'error'" style="padding:6px;margin-bottom:4px">Error message</div>
    <div [appStatus]="'info'" style="padding:6px">Info message</div>
  `,
})
class Ex15 {}

// 16. Directive with @Input alias
@Directive({ selector: '[appSize]', standalone: true })
class AppSizeDirective {
  private el = inject(ElementRef);

  @Input('appSize') set size(v: 'sm' | 'md' | 'lg') {
    const map = { sm: '12px', md: '16px', lg: '22px' };
    this.el.nativeElement.style.fontSize = map[v] ?? '16px';
  }
}

@Component({
  selector: 'ex-16',
  standalone: true,
  imports: [AppSizeDirective],
  template: `
    <p [appSize]="'sm'">Small text via alias</p>
    <p [appSize]="'md'">Medium text via alias</p>
    <p [appSize]="'lg'">Large text via alias</p>
  `,
})
class Ex16 {}

// 17. Directive emitting @Output event
@Directive({ selector: '[appDoubleClick]', standalone: true })
class AppDoubleClickDirective {
  @Output() appDoubleClick = new EventEmitter<void>();

  @HostListener('dblclick')
  onDbl() { this.appDoubleClick.emit(); }
}

@Component({
  selector: 'ex-17',
  standalone: true,
  imports: [AppDoubleClickDirective],
  template: `
    <div appDoubleClick (appDoubleClick)="count++" style="padding:8px;border:1px dashed #9C27B0;cursor:pointer">
      Double-click me!
    </div>
    <span style="color:#9C27B0">Count: {{ count }}</span>
  `,
})
class Ex17 {
  count = 0;
}

// 18. Debounced click directive (prevents rapid clicks)
@Directive({ selector: '[appDebouncedClick]', standalone: true })
class AppDebouncedClickDirective implements OnDestroy {
  @Input() debounceMs = 300;
  @Output() debouncedClick = new EventEmitter<void>();
  private timer: ReturnType<typeof setTimeout> | null = null;

  @HostListener('click')
  onClick() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.debouncedClick.emit(), this.debounceMs);
  }

  ngOnDestroy() { if (this.timer) clearTimeout(this.timer); }
}

@Component({
  selector: 'ex-18',
  standalone: true,
  imports: [AppDebouncedClickDirective],
  template: `
    <button appDebouncedClick [debounceMs]="400" (debouncedClick)="clicks++" style="padding:4px 10px">
      Debounced Click
    </button>
    <span style="margin-left:8px">Debounced fires: {{ clicks }}</span>
  `,
})
class Ex18 {
  clicks = 0;
}

// 19. Long-press detection directive (touchstart timer)
@Directive({ selector: '[appLongPress]', standalone: true })
class AppLongPressDirective implements OnDestroy {
  @Input() longPressMs = 600;
  @Output() longPress = new EventEmitter<void>();
  private timer: ReturnType<typeof setTimeout> | null = null;

  @HostListener('mousedown')
  onDown() {
    this.timer = setTimeout(() => this.longPress.emit(), this.longPressMs);
  }

  @HostListener('mouseup')
  @HostListener('mouseleave')
  onUp() { if (this.timer) clearTimeout(this.timer); }

  ngOnDestroy() { if (this.timer) clearTimeout(this.timer); }
}

@Component({
  selector: 'ex-19',
  standalone: true,
  imports: [AppLongPressDirective],
  template: `
    <button appLongPress [longPressMs]="800" (longPress)="fired=true" style="padding:6px 12px">
      Hold for 800ms
    </button>
    @if (fired) { <span style="color:green;margin-left:8px">Long press fired!</span> }
  `,
})
class Ex19 {
  fired = false;
}

// 20. Drag-handle directive (mousedown + mousemove)
@Directive({ selector: '[appDragHandle]', standalone: true })
class AppDragHandleDirective implements OnDestroy {
  private el = inject(ElementRef);
  private startX = 0;
  private startLeft = 0;
  private dragging = false;
  private moveListener?: () => void;
  private upListener?: () => void;

  @HostListener('mousedown', ['$event'])
  onDown(e: MouseEvent) {
    this.dragging = true;
    this.startX = e.clientX;
    this.startLeft = parseInt(this.el.nativeElement.style.left || '0', 10);
    this.moveListener = this.onMove.bind(this) as () => void;
    this.upListener = this.onUp.bind(this) as () => void;
    document.addEventListener('mousemove', this.moveListener as EventListener);
    document.addEventListener('mouseup', this.upListener as EventListener);
  }

  onMove(e: MouseEvent) {
    if (!this.dragging) return;
    const dx = e.clientX - this.startX;
    this.el.nativeElement.style.left = (this.startLeft + dx) + 'px';
  }

  onUp() {
    this.dragging = false;
    if (this.moveListener) document.removeEventListener('mousemove', this.moveListener as EventListener);
    if (this.upListener) document.removeEventListener('mouseup', this.upListener as EventListener);
  }

  ngOnDestroy() { this.onUp(); }
}

@Component({
  selector: 'ex-20',
  standalone: true,
  imports: [AppDragHandleDirective],
  template: `
    <div style="position:relative;height:40px;border:1px dashed #ccc">
      <div appDragHandle style="position:absolute;left:0;top:4px;background:#2196F3;color:#fff;padding:4px 10px;cursor:grab;border-radius:3px;user-select:none">
        Drag me →
      </div>
    </div>
  `,
})
class Ex20 {}

// 21. Only-numbers input directive (keydown filter)
@Directive({ selector: '[appOnlyNumbers]', standalone: true })
class AppOnlyNumbersDirective {
  @HostListener('keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    const allowed = ['Backspace', 'Tab', 'ArrowLeft', 'ArrowRight', 'Delete', 'Enter'];
    if (!allowed.includes(e.key) && !/^\d$/.test(e.key)) {
      e.preventDefault();
    }
  }
}

@Component({
  selector: 'ex-21',
  standalone: true,
  imports: [AppOnlyNumbersDirective],
  template: `<input appOnlyNumbers placeholder="Numbers only (try typing letters)" style="padding:4px;border:1px solid #ccc;width:240px" />`,
})
class Ex21 {}

// 22. Trim-on-blur directive
@Directive({ selector: '[appTrimBlur]', standalone: true })
class AppTrimBlurDirective {
  private el = inject(ElementRef);

  @HostListener('blur')
  onBlur() {
    this.el.nativeElement.value = this.el.nativeElement.value.trim();
  }
}

@Component({
  selector: 'ex-22',
  standalone: true,
  imports: [AppTrimBlurDirective],
  template: `<input appTrimBlur placeholder="Type spaces around text, then blur" style="padding:4px;border:1px solid #ccc;width:280px" />`,
})
class Ex22 {}

// 23. Max-length with counter directive
@Directive({ selector: '[appMaxLengthCounter]', standalone: true })
class AppMaxLengthCounterDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private counter!: HTMLSpanElement;

  @Input() appMaxLengthCounter = 50;

  constructor() {
    setTimeout(() => {
      this.counter = this.renderer.createElement('span');
      this.renderer.setStyle(this.counter, 'font-size', '11px');
      this.renderer.setStyle(this.counter, 'color', '#999');
      this.renderer.setStyle(this.counter, 'marginLeft', '4px');
      this.renderer.insertBefore(this.el.nativeElement.parentNode, this.counter, this.el.nativeElement.nextSibling);
      this.updateCount();
    });
  }

  @HostListener('input')
  onInput() { this.updateCount(); }

  private updateCount() {
    const len = this.el.nativeElement.value.length;
    this.renderer.setProperty(this.counter, 'textContent', `${len}/${this.appMaxLengthCounter}`);
    this.renderer.setStyle(this.counter, 'color', len >= this.appMaxLengthCounter ? 'red' : '#999');
  }
}

@Component({
  selector: 'ex-23',
  standalone: true,
  imports: [AppMaxLengthCounterDirective],
  template: `
    <div style="display:inline-flex;align-items:center">
      <input [appMaxLengthCounter]="30" maxlength="30" placeholder="Type here..." style="padding:4px;border:1px solid #ccc" />
    </div>
  `,
})
class Ex23 {}

// 24. Lazy image load directive (Intersection Observer)
@Directive({ selector: '[appLazyImg]', standalone: true })
class AppLazyImgDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  @Input() appLazyImg = '';
  private observer?: IntersectionObserver;

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        this.el.nativeElement.src = this.appLazyImg;
        this.observer?.disconnect();
      }
    });
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() { this.observer?.disconnect(); }
}

@Component({
  selector: 'ex-24',
  standalone: true,
  imports: [AppLazyImgDirective],
  template: `
    <img [appLazyImg]="'https://via.placeholder.com/200x60?text=Lazy+Loaded'"
         alt="lazy" style="width:200px;height:60px;border:1px solid #ccc;background:#f5f5f5" />
    <p style="font-size:11px;color:#999;margin:2px 0">Image loads via IntersectionObserver when in viewport.</p>
  `,
})
class Ex24 {}

// 25. Scroll-to-top on click directive
@Directive({ selector: '[appScrollTop]', standalone: true })
class AppScrollTopDirective {
  @HostListener('click')
  onClick() { window.scrollTo({ top: 0, behavior: 'smooth' }); }
}

@Component({
  selector: 'ex-25',
  standalone: true,
  imports: [AppScrollTopDirective],
  template: `<button appScrollTop style="padding:4px 10px">↑ Scroll to Top</button>`,
})
class Ex25 {}

// 26. Sticky element directive (position observer)
@Directive({ selector: '[appSticky]', standalone: true })
class AppStickyDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  private observer?: IntersectionObserver;
  @HostBinding('class.is-sticky') isSticky = false;

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(
      ([e]) => { this.isSticky = e.intersectionRatio < 1; },
      { threshold: [1] }
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() { this.observer?.disconnect(); }
}

@Component({
  selector: 'ex-26',
  standalone: true,
  imports: [AppStickyDirective],
  template: `
    <style>.is-sticky { box-shadow: 0 2px 8px rgba(0,0,0,.2); }</style>
    <div appSticky style="background:#fff;padding:6px;top:-1px;position:sticky;border:1px solid #eee;transition:box-shadow .2s">
      Sticky header (scroll to test stickiness)
    </div>
  `,
})
class Ex26 {}

// ─── NESTED (27–38) ──────────────────────────────────────────

// 27. Directive applied to a child component host
@Component({
  selector: 'ex-27-inner',
  standalone: true,
  imports: [AppHighlightDirective],
  template: `<div appHighlight style="padding:6px">Child component with appHighlight on its internal element.</div>`,
})
class Ex27Inner {}

@Component({
  selector: 'ex-27',
  standalone: true,
  imports: [Ex27Inner],
  template: `<ex-27-inner />`,
})
class Ex27 {}

// 28. Multiple directives on the same element
@Component({
  selector: 'ex-28',
  standalone: true,
  imports: [AppHighlightDirective, AppHoverDirective, AppBorderDirective],
  template: `<p appHighlight appHover appBorder style="padding:6px;cursor:pointer">Three directives on one element. Hover to change BG.</p>`,
})
class Ex28 {}

// 29. Highlight directive used on every @for list item
@Component({
  selector: 'ex-29',
  standalone: true,
  imports: [AppHoverDirective],
  template: `
    <ul style="list-style:none;padding:0">
      @for (item of items; track item) {
        <li appHover style="padding:4px;cursor:pointer;border-bottom:1px solid #eee">{{ item }}</li>
      }
    </ul>
  `,
})
class Ex29 {
  items = ['Dashboard', 'Analytics', 'Users', 'Settings'];
}

// 30. Directive that reads parent component via inject()
@Directive({ selector: '[appReadParent]', standalone: true })
class AppReadParentDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  constructor() {
    this.renderer.setAttribute(this.el.nativeElement, 'title', 'Directive injected into parent context');
    this.renderer.setStyle(this.el.nativeElement, 'cursor', 'help');
  }
}

@Component({
  selector: 'ex-30',
  standalone: true,
  imports: [AppReadParentDirective],
  template: `<span appReadParent>Hover to see injected title attribute.</span>`,
})
class Ex30 {}

// 31. Click-outside used for dropdown close
@Component({
  selector: 'ex-31',
  standalone: true,
  imports: [AppClickOutsideDirective],
  template: `
    <div style="position:relative;display:inline-block">
      <button (click)="open=!open" style="padding:4px 10px">Menu ▾</button>
      @if (open) {
        <div appClickOutside (clickOutside)="open=false"
             style="position:absolute;top:100%;left:0;background:#fff;border:1px solid #ccc;padding:4px;min-width:120px;z-index:10;box-shadow:0 2px 6px rgba(0,0,0,.15)">
          <div style="padding:3px 6px;cursor:pointer">Item A</div>
          <div style="padding:3px 6px;cursor:pointer">Item B</div>
          <div style="padding:3px 6px;cursor:pointer">Item C</div>
        </div>
      }
    </div>
  `,
})
class Ex31 {
  open = false;
}

// 32. Tooltip directive on table cells
@Component({
  selector: 'ex-32',
  standalone: true,
  imports: [AppTooltipDirective],
  template: `
    <table style="border-collapse:collapse;font-size:13px">
      <tr>
        <th style="border:1px solid #ddd;padding:4px">Field</th>
        <th style="border:1px solid #ddd;padding:4px">Value</th>
      </tr>
      @for (row of rows; track row.field) {
        <tr>
          <td [appTooltip]="row.tip" style="border:1px solid #ddd;padding:4px;cursor:help;text-decoration:underline dotted">{{ row.field }}</td>
          <td style="border:1px solid #ddd;padding:4px">{{ row.value }}</td>
        </tr>
      }
    </table>
  `,
})
class Ex32 {
  rows = [
    { field: 'Status', value: 'Active', tip: 'User is currently active' },
    { field: 'Role', value: 'Admin', tip: 'Has full system access' },
  ];
}

// 33. Directive for form field error border
@Directive({ selector: '[appErrorBorder]', standalone: true })
class AppErrorBorderDirective {
  @Input() set appErrorBorder(hasError: boolean) {
    this._el.nativeElement.style.borderColor = hasError ? 'red' : '#ccc';
    this._el.nativeElement.style.outline = hasError ? '1px solid red' : '';
  }
  private _el = inject(ElementRef);
}

@Component({
  selector: 'ex-33',
  standalone: true,
  imports: [AppErrorBorderDirective],
  template: `
    <input [appErrorBorder]="!value" [(ngModel)]="value" placeholder="Required field" style="padding:4px;border:1px solid #ccc;width:220px" />
    @if (!value) { <span style="font-size:11px;color:red;margin-left:4px">Required</span> }
  `,
})
class Ex33 {
  value = '';
}

// 34. Directive coordinating with sibling directive
@Directive({ selector: '[appBoldOnHover]', standalone: true })
class AppBoldOnHoverDirective {
  @HostBinding('style.fontWeight')
  fw = 'normal';

  @HostListener('mouseenter') onEnter() { this.fw = 'bold'; }
  @HostListener('mouseleave') onLeave() { this.fw = 'normal'; }
}

@Component({
  selector: 'ex-34',
  standalone: true,
  imports: [AppBoldOnHoverDirective, AppHoverDirective],
  template: `<p appHover appBoldOnHover style="padding:6px;cursor:pointer">Hover: bg changes (appHover) + bold (appBoldOnHover) — two directives coordinating.</p>`,
})
class Ex34 {}

// 35. Directive on dynamically added elements
@Directive({ selector: '[appPulse]', standalone: true })
class AppPulseDirective implements AfterViewInit {
  private el = inject(ElementRef);
  ngAfterViewInit() {
    this.el.nativeElement.animate(
      [{ opacity: 1 }, { opacity: 0.4 }, { opacity: 1 }],
      { duration: 1200, iterations: Infinity }
    );
  }
}

@Component({
  selector: 'ex-35',
  standalone: true,
  imports: [AppPulseDirective],
  template: `
    <div style="display:flex;flex-wrap:wrap;gap:6px">
      @for (i of items; track i) {
        <span appPulse style="background:#2196F3;color:#fff;padding:3px 8px;border-radius:12px;font-size:12px">{{ i }}</span>
      }
    </div>
  `,
})
class Ex35 {
  items = ['Live', 'Updating', 'Data'];
}

// 36. Row-click directive selecting items in a list
@Directive({ selector: '[appSelectRow]', standalone: true })
class AppSelectRowDirective {
  @Output() selected = new EventEmitter<void>();
  @HostBinding('style.background') bg = '';

  @Input() set isSelected(v: boolean) {
    this.bg = v ? '#e3f2fd' : '';
  }

  @HostListener('click')
  onClick() { this.selected.emit(); }
}

@Component({
  selector: 'ex-36',
  standalone: true,
  imports: [AppSelectRowDirective],
  template: `
    <ul style="list-style:none;padding:0;border:1px solid #ccc">
      @for (item of items; track item; let i = $index) {
        <li appSelectRow [isSelected]="selectedIdx===i" (selected)="selectedIdx=i"
            style="padding:6px 8px;cursor:pointer;border-bottom:1px solid #eee">
          {{ item }}
        </li>
      }
    </ul>
    <p style="font-size:12px;color:#555">Selected: {{ items[selectedIdx] }}</p>
  `,
})
class Ex36 {
  items = ['Row Alpha', 'Row Beta', 'Row Gamma'];
  selectedIdx = 0;
}

// 37. Animate-on-enter directive with @for
@Directive({ selector: '[appFadeIn]', standalone: true })
class AppFadeInDirective implements AfterViewInit {
  private el = inject(ElementRef);
  ngAfterViewInit() {
    this.el.nativeElement.animate(
      [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'translateY(0)' }],
      { duration: 400, fill: 'forwards' }
    );
  }
}

@Component({
  selector: 'ex-37',
  standalone: true,
  imports: [AppFadeInDirective],
  template: `
    <div style="display:flex;flex-direction:column;gap:4px">
      @for (item of items; track item) {
        <div appFadeIn style="background:#f3e5f5;padding:5px 8px;border-radius:3px">{{ item }}</div>
      }
    </div>
  `,
})
class Ex37 {
  items = ['Animated Item 1', 'Animated Item 2', 'Animated Item 3'];
}

// 38. Directive hierarchy: parent applies to child elements
@Directive({ selector: '[appTheme]', standalone: true })
class AppThemeDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  @Input() set appTheme(theme: 'dark' | 'light') {
    const bg = theme === 'dark' ? '#1a1a2e' : '#fff';
    const color = theme === 'dark' ? '#fff' : '#333';
    this.renderer.setStyle(this.el.nativeElement, 'background', bg);
    this.renderer.setStyle(this.el.nativeElement, 'color', color);
    this.renderer.setStyle(this.el.nativeElement, 'padding', '8px');
    this.renderer.setStyle(this.el.nativeElement, 'borderRadius', '4px');
  }
}

@Component({
  selector: 'ex-38',
  standalone: true,
  imports: [AppThemeDirective],
  template: `
    <div [appTheme]="'dark'">
      <h4 style="margin:0 0 4px">Dark Theme</h4>
      <p style="margin:0;font-size:13px">Parent directive sets theme for all children.</p>
    </div>
  `,
})
class Ex38 {}

// ─── ADVANCED (39–50) ────────────────────────────────────────

// 39. Structural directive — custom *appIf
@Directive({ selector: '[appIf]', standalone: true })
class AppIfDirective {
  private tpl = inject(TemplateRef<unknown>);
  private vcr = inject(ViewContainerRef);
  private view: EmbeddedViewRef<unknown> | null = null;

  @Input() set appIf(condition: boolean) {
    if (condition && !this.view) {
      this.view = this.vcr.createEmbeddedView(this.tpl);
    } else if (!condition && this.view) {
      this.vcr.clear();
      this.view = null;
    }
  }
}

@Component({
  selector: 'ex-39',
  standalone: true,
  imports: [AppIfDirective],
  template: `
    <button (click)="show=!show" style="padding:4px 10px;margin-bottom:6px">Toggle (*appIf)</button>
    <div *appIf="show" style="background:#e8f5e9;padding:6px;border-radius:3px">
      Rendered by custom *appIf structural directive!
    </div>
  `,
})
class Ex39 {
  show = true;
}

// 40. Structural directive — custom *appRepeat (n times)
@Directive({ selector: '[appRepeat]', standalone: true })
class AppRepeatDirective {
  private tpl = inject(TemplateRef<{ $implicit: number }>);
  private vcr = inject(ViewContainerRef);

  @Input() set appRepeat(n: number) {
    this.vcr.clear();
    for (let i = 0; i < n; i++) {
      this.vcr.createEmbeddedView(this.tpl, { $implicit: i + 1 });
    }
  }
}

@Component({
  selector: 'ex-40',
  standalone: true,
  imports: [AppRepeatDirective],
  template: `
    <div style="display:flex;gap:4px">
      <span *appRepeat="5; let i" style="background:#2196F3;color:#fff;border-radius:50%;width:24px;height:24px;display:flex;align-items:center;justify-content:center;font-size:12px">
        {{ i }}
      </span>
    </div>
  `,
})
class Ex40 {}

// 41. Structural directive with embedded view context
@Directive({ selector: '[appWithData]', standalone: true })
class AppWithDataDirective {
  private tpl = inject(TemplateRef<{ $implicit: { name: string; score: number } }>);
  private vcr = inject(ViewContainerRef);

  @Input() set appWithData(data: { name: string; score: number }) {
    this.vcr.clear();
    this.vcr.createEmbeddedView(this.tpl, { $implicit: data });
  }
}

@Component({
  selector: 'ex-41',
  standalone: true,
  imports: [AppWithDataDirective],
  template: `
    <ng-container *appWithData="userData; let ctx">
      <div style="background:#e3f2fd;padding:6px;border-radius:3px">
        {{ ctx.name }} — Score: {{ ctx.score }}
      </div>
    </ng-container>
  `,
})
class Ex41 {
  userData = { name: 'Alice', score: 98 };
}

// 42. Directive using inject(DestroyRef) for cleanup
@Directive({ selector: '[appDestroyClean]', standalone: true })
class AppDestroyCleanDirective {
  private el = inject(ElementRef);
  private destroyRef = inject(DestroyRef);
  private interval: ReturnType<typeof setInterval>;

  constructor() {
    let count = 0;
    this.interval = setInterval(() => {
      this.el.nativeElement.textContent = `Tick: ${++count}`;
    }, 1000);

    this.destroyRef.onDestroy(() => clearInterval(this.interval));
  }
}

@Component({
  selector: 'ex-42',
  standalone: true,
  imports: [AppDestroyCleanDirective],
  template: `<span appDestroyClean style="font-family:monospace;font-size:13px">Tick: 0</span><span style="color:#999;font-size:11px;margin-left:6px">(auto-clears via DestroyRef)</span>`,
})
class Ex42 {}

// 43. Directive using inject(DOCUMENT)
@Directive({ selector: '[appDocTitle]', standalone: true })
class AppDocTitleDirective {
  private doc = inject(DOCUMENT);
  @Input() set appDocTitle(title: string) {
    if (title) this.doc.title = title;
  }
}

@Component({
  selector: 'ex-43',
  standalone: true,
  imports: [AppDocTitleDirective],
  template: `
    <input [appDocTitle]="titleVal" [(ngModel)]="titleVal" placeholder="Type to set page title" style="padding:4px;border:1px solid #ccc;width:240px" />
    <p style="font-size:11px;color:#999;margin:2px 0">Changes document.title (check browser tab).</p>
  `,
})
class Ex43 {
  titleVal = 'Angular Directives Demo';
}

// 44. Directive with signal-based internal state
@Directive({ selector: '[appCounter]', standalone: true })
class AppCounterDirective {
  private el = inject(ElementRef);
  private count = signal(0);

  @HostListener('click')
  increment() {
    this.count.update(c => c + 1);
    this.el.nativeElement.textContent = `Clicked ${this.count()} time${this.count() === 1 ? '' : 's'}`;
  }
}

@Component({
  selector: 'ex-44',
  standalone: true,
  imports: [AppCounterDirective],
  template: `<button appCounter style="padding:6px 12px;cursor:pointer">Clicked 0 times</button>`,
})
class Ex44 {}

// 45. Resize observation directive (ResizeObserver)
@Directive({ selector: '[appResize]', standalone: true })
class AppResizeDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  @Output() resized = new EventEmitter<{ w: number; h: number }>();
  private observer?: ResizeObserver;

  ngAfterViewInit() {
    this.observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      this.resized.emit({ w: Math.round(width), h: Math.round(height) });
    });
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() { this.observer?.disconnect(); }
}

@Component({
  selector: 'ex-45',
  standalone: true,
  imports: [AppResizeDirective],
  template: `
    <div appResize (resized)="size=$event" style="border:1px dashed #ccc;padding:8px;resize:both;overflow:auto;min-width:200px">
      Resize this box
    </div>
    <p style="font-size:12px;color:#555;margin:4px 0">Size: {{ size?.w }}×{{ size?.h }}</p>
  `,
})
class Ex45 {
  size?: { w: number; h: number };
}

// 46. Mutation observation directive (MutationObserver)
@Directive({ selector: '[appMutationWatch]', standalone: true })
class AppMutationWatchDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  @Output() mutated = new EventEmitter<string>();
  private observer?: MutationObserver;

  ngAfterViewInit() {
    this.observer = new MutationObserver(mutations => {
      for (const m of mutations) {
        this.mutated.emit(`${m.type} on ${(m.target as HTMLElement).tagName}`);
      }
    });
    this.observer.observe(this.el.nativeElement, { childList: true, attributes: true, subtree: true });
  }

  ngOnDestroy() { this.observer?.disconnect(); }
}

@Component({
  selector: 'ex-46',
  standalone: true,
  imports: [AppMutationWatchDirective],
  template: `
    <div appMutationWatch (mutated)="log=$event" style="border:1px solid #ccc;padding:8px">
      <button (click)="items.push('Item '+items.length)" style="padding:3px 8px;font-size:12px">Add item</button>
      @for (i of items; track i) { <span style="margin:0 3px">{{ i }}</span> }
    </div>
    <p style="font-size:11px;color:#777;margin:2px 0">Mutation: {{ log }}</p>
  `,
})
class Ex46 {
  items: string[] = [];
  log = '';
}

// 47. Keyboard shortcut binding directive
@Directive({ selector: '[appShortcut]', standalone: true })
class AppShortcutDirective {
  @Input() appShortcut = '';
  @Output() shortcutFired = new EventEmitter<void>();

  @HostListener('document:keydown', ['$event'])
  onKey(e: KeyboardEvent) {
    const parts = this.appShortcut.toLowerCase().split('+');
    const ctrl = parts.includes('ctrl') ? e.ctrlKey : true;
    const shift = parts.includes('shift') ? e.shiftKey : true;
    const key = parts[parts.length - 1];
    if (ctrl && shift && e.key.toLowerCase() === key) {
      e.preventDefault();
      this.shortcutFired.emit();
    }
  }
}

@Component({
  selector: 'ex-47',
  standalone: true,
  imports: [AppShortcutDirective],
  template: `
    <div appShortcut appShortcut="ctrl+shift+s" (shortcutFired)="fired=true" style="border:1px solid #ccc;padding:8px">
      Press <kbd>Ctrl+Shift+S</kbd> to trigger shortcut
    </div>
    @if (fired) { <span style="color:green;font-size:13px">Shortcut fired!</span> }
  `,
})
class Ex47 {
  fired = false;
}

// 48. Infinite scroll trigger directive
@Directive({ selector: '[appInfiniteScroll]', standalone: true })
class AppInfiniteScrollDirective implements AfterViewInit, OnDestroy {
  private el = inject(ElementRef);
  @Output() loadMore = new EventEmitter<void>();
  private observer?: IntersectionObserver;

  ngAfterViewInit() {
    this.observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) this.loadMore.emit();
    });
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() { this.observer?.disconnect(); }
}

@Component({
  selector: 'ex-48',
  standalone: true,
  imports: [AppInfiniteScrollDirective],
  template: `
    <div style="height:100px;overflow-y:auto;border:1px solid #ccc;padding:4px">
      @for (item of items; track item) {
        <div style="padding:3px;font-size:13px">{{ item }}</div>
      }
      <div appInfiniteScroll (loadMore)="addMore()" style="height:1px"></div>
    </div>
    <p style="font-size:11px;color:#999;margin:2px 0">Scroll down inside box to load more</p>
  `,
})
class Ex48 {
  items = Array.from({ length: 5 }, (_, i) => `Item ${i + 1}`);
  addMore() {
    const next = this.items.length;
    this.items = [...this.items, ...Array.from({ length: 3 }, (_, i) => `Item ${next + i + 1}`)];
  }
}

// 49. Print-only visibility directive
@Directive({ selector: '[appPrintOnly]', standalone: true })
class AppPrintOnlyDirective {
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  constructor() {
    // Hide on screen via class
    this.renderer.setStyle(this.el.nativeElement, 'display', 'none');
    // In real use, a @media print CSS rule would show it
    this.renderer.setAttribute(this.el.nativeElement, 'data-print-only', 'true');
  }
}

@Component({
  selector: 'ex-49',
  standalone: true,
  imports: [AppPrintOnlyDirective],
  template: `
    <style>@media print { [data-print-only] { display:block !important; } }</style>
    <p>This paragraph is visible on screen.</p>
    <p appPrintOnly>This paragraph is print-only (hidden on screen).</p>
    <p style="font-size:11px;color:#999">The paragraph above is hidden via appPrintOnly directive.</p>
  `,
})
class Ex49 {}

// 50. Full reusable directive library pattern (4 directives composed)
@Directive({ selector: '[libTooltip]', standalone: true })
class LibTooltipDirective {
  @Input() libTooltip = '';
  @HostListener('mouseenter') onEnter() { (inject(ElementRef)).nativeElement.title = this.libTooltip; }
  private _el = inject(ElementRef);
}

@Directive({ selector: '[libBadge]', standalone: true })
class LibBadgeDirective implements AfterViewInit {
  @Input() libBadge = '';
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  ngAfterViewInit() {
    const badge = this.renderer.createElement('span');
    this.renderer.setProperty(badge, 'textContent', this.libBadge);
    this.renderer.setStyle(badge, 'background', '#F44336');
    this.renderer.setStyle(badge, 'color', '#fff');
    this.renderer.setStyle(badge, 'borderRadius', '10px');
    this.renderer.setStyle(badge, 'padding', '1px 6px');
    this.renderer.setStyle(badge, 'fontSize', '11px');
    this.renderer.setStyle(badge, 'marginLeft', '4px');
    this.renderer.appendChild(this.el.nativeElement, badge);
  }
}

@Directive({ selector: '[libRipple]', standalone: true })
class LibRippleDirective {
  private el = inject(ElementRef);
  @HostListener('click')
  onClick() {
    this.el.nativeElement.animate(
      [{ boxShadow: '0 0 0 0 rgba(33,150,243,0.4)' }, { boxShadow: '0 0 0 10px rgba(33,150,243,0)' }],
      { duration: 400 }
    );
  }
}

@Directive({ selector: '[libDisabled]', standalone: true })
class LibDisabledDirective {
  @Input() set libDisabled(v: boolean) {
    (inject(ElementRef)).nativeElement.style.opacity = v ? '0.4' : '1';
    (inject(ElementRef)).nativeElement.style.pointerEvents = v ? 'none' : '';
  }
  private _el = inject(ElementRef);
}

@Component({
  selector: 'ex-50',
  standalone: true,
  imports: [LibTooltipDirective, LibBadgeDirective, LibRippleDirective, LibDisabledDirective],
  template: `
    <div style="display:flex;flex-direction:column;gap:8px;border:1px solid #ccc;padding:10px;border-radius:4px">
      <p style="font-size:12px;color:#555;margin:0">Directive library: tooltip + badge + ripple + disabled</p>
      <button libRipple [libTooltip]="'Save your work'" libBadge="3" [libDisabled]="false"
              style="padding:6px 14px;background:#2196F3;color:#fff;border:none;border-radius:4px;cursor:pointer">
        Save
      </button>
      <button libRipple [libTooltip]="'Not available'" [libDisabled]="true"
              style="padding:6px 14px;background:#4CAF50;color:#fff;border:none;border-radius:4px">
        Submit (disabled)
      </button>
    </div>
  `,
})
class Ex50 {}

// ─── App Root ────────────────────────────────────────────────

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    Ex01, Ex02, Ex03, Ex04, Ex05, Ex06, Ex07, Ex08, Ex09, Ex10,
    Ex11, Ex12, Ex13, Ex14, Ex15, Ex16, Ex17, Ex18, Ex19, Ex20,
    Ex21, Ex22, Ex23, Ex24, Ex25, Ex26, Ex27, Ex28, Ex29, Ex30,
    Ex31, Ex32, Ex33, Ex34, Ex35, Ex36, Ex37, Ex38, Ex39, Ex40,
    Ex41, Ex42, Ex43, Ex44, Ex45, Ex46, Ex47, Ex48, Ex49, Ex50,
  ],
  template: `
    <div style="font-family:sans-serif;max-width:700px;margin:0 auto;padding:20px">
      <h1>Examples 2.5 — Custom Directives</h1>

      <h4>1. Attribute directive changes background color</h4><ex-01 /><hr />
      <h4>2. @HostListener('click') toggles class</h4><ex-02 /><hr />
      <h4>3. @HostBinding('style.color') sets color</h4><ex-03 /><hr />
      <h4>4. @Input() receives highlight color</h4><ex-04 /><hr />
      <h4>5. @HostListener mouseenter/mouseleave hover</h4><ex-05 /><hr />
      <h4>6. Directive adds CSS class on click</h4><ex-06 /><hr />
      <h4>7. Directive uses inject(ElementRef)</h4><ex-07 /><hr />
      <h4>8. Directive uses inject(Renderer2) safely</h4><ex-08 /><hr />
      <h4>9. Auto-focus directive</h4><ex-09 /><hr />
      <h4>10. Tooltip on hover directive (title attribute)</h4><ex-10 /><hr />
      <h4>11. Click-outside detection directive</h4><ex-11 /><hr />
      <h4>12. Disable right-click directive</h4><ex-12 /><hr />
      <h4>13. Copy-to-clipboard on click directive</h4><ex-13 /><hr />
      <h4>14. Directive with multiple @HostListener events</h4><ex-14 /><hr />
      <h4>15. Directive with @HostBinding class + style</h4><ex-15 /><hr />
      <h4>16. Directive with @Input alias</h4><ex-16 /><hr />
      <h4>17. Directive emitting @Output event</h4><ex-17 /><hr />
      <h4>18. Debounced click directive</h4><ex-18 /><hr />
      <h4>19. Long-press detection directive</h4><ex-19 /><hr />
      <h4>20. Drag-handle directive</h4><ex-20 /><hr />
      <h4>21. Only-numbers input directive</h4><ex-21 /><hr />
      <h4>22. Trim-on-blur directive</h4><ex-22 /><hr />
      <h4>23. Max-length with counter directive</h4><ex-23 /><hr />
      <h4>24. Lazy image load directive (IntersectionObserver)</h4><ex-24 /><hr />
      <h4>25. Scroll-to-top on click directive</h4><ex-25 /><hr />
      <h4>26. Sticky element directive</h4><ex-26 /><hr />
      <h4>27. Directive applied to a child component host</h4><ex-27 /><hr />
      <h4>28. Multiple directives on the same element</h4><ex-28 /><hr />
      <h4>29. Highlight directive used on every @for list item</h4><ex-29 /><hr />
      <h4>30. Directive that reads parent component via inject()</h4><ex-30 /><hr />
      <h4>31. Click-outside used for dropdown close</h4><ex-31 /><hr />
      <h4>32. Tooltip directive on table cells</h4><ex-32 /><hr />
      <h4>33. Directive for form field error border</h4><ex-33 /><hr />
      <h4>34. Directive coordinating with sibling directive</h4><ex-34 /><hr />
      <h4>35. Directive on dynamically added elements</h4><ex-35 /><hr />
      <h4>36. Row-click directive selecting items in a list</h4><ex-36 /><hr />
      <h4>37. Animate-on-enter directive with @for</h4><ex-37 /><hr />
      <h4>38. Directive hierarchy: parent applies theme to children</h4><ex-38 /><hr />
      <h4>39. Structural directive — custom *appIf</h4><ex-39 /><hr />
      <h4>40. Structural directive — custom *appRepeat (n times)</h4><ex-40 /><hr />
      <h4>41. Structural directive with embedded view context</h4><ex-41 /><hr />
      <h4>42. Directive using inject(DestroyRef) for cleanup</h4><ex-42 /><hr />
      <h4>43. Directive using inject(DOCUMENT)</h4><ex-43 /><hr />
      <h4>44. Directive with signal-based internal state</h4><ex-44 /><hr />
      <h4>45. Resize observation directive (ResizeObserver)</h4><ex-45 /><hr />
      <h4>46. Mutation observation directive (MutationObserver)</h4><ex-46 /><hr />
      <h4>47. Keyboard shortcut binding directive</h4><ex-47 /><hr />
      <h4>48. Infinite scroll trigger directive</h4><ex-48 /><hr />
      <h4>49. Print-only visibility directive</h4><ex-49 /><hr />
      <h4>50. Full reusable directive library pattern (4 directives composed)</h4><ex-50 /><hr />
    </div>
  `,
})
export class AppComponent {}
