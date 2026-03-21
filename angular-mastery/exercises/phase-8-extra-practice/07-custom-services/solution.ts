import { Component, Injectable, inject, signal, WritableSignal,
         OnDestroy, ChangeDetectionStrategy } from '@angular/core';

// ============================================================
// Solution 8.7 — Custom Utility Services
// ============================================================

// SOLUTION 1: NotificationService
interface Notification { id: string; message: string; type: 'info' | 'success' | 'error'; }

@Injectable({ providedIn: 'root' })
class NotificationService {
  private _notifications = signal<Notification[]>([]);
  notifications = this._notifications.asReadonly();

  show(message: string, type: 'info' | 'success' | 'error' = 'info') {
    const id = crypto.randomUUID();
    this._notifications.update(n => [...n, { id, message, type }]);
    setTimeout(() => this.dismiss(id), 3000);
  }

  dismiss(id: string) { this._notifications.update(n => n.filter(x => x.id !== id)); }
}

// SOLUTION 2: ModalService
@Injectable({ providedIn: 'root' })
class ModalService {
  isOpen  = signal(false);
  title   = signal('');
  content = signal('');

  open(title: string, content: string) { this.title.set(title); this.content.set(content); this.isOpen.set(true); }
  close() { this.isOpen.set(false); }
}

// SOLUTION 3: StorageService
@Injectable({ providedIn: 'root' })
class StorageService {
  get<T>(key: string, defaultValue: T): T {
    try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? defaultValue; }
    catch { return defaultValue; }
  }
  set<T>(key: string, value: T) { localStorage.setItem(key, JSON.stringify(value)); }
  remove(key: string)  { localStorage.removeItem(key); }
  clear()              { localStorage.clear(); }

  getSignal<T>(key: string, defaultValue: T): WritableSignal<T> {
    const s = signal<T>(this.get(key, defaultValue));
    // Auto-sync: caller should call storage.set() manually after updating signal,
    // or wrap in effect() at call site.
    return s;
  }
}

// SOLUTION 4: NetworkService
@Injectable({ providedIn: 'root' })
class NetworkService implements OnDestroy {
  isOnline = signal(navigator.onLine);
  private onOnline  = () => this.isOnline.set(true);
  private onOffline = () => this.isOnline.set(false);

  constructor() {
    window.addEventListener('online',  this.onOnline);
    window.addEventListener('offline', this.onOffline);
  }

  ngOnDestroy() {
    window.removeEventListener('online',  this.onOnline);
    window.removeEventListener('offline', this.onOffline);
  }
}

// SOLUTION 5: ClipboardService
@Injectable({ providedIn: 'root' })
class ClipboardService {
  lastCopied  = signal('');
  showCopied  = signal(false);

  async copy(text: string) {
    await navigator.clipboard.writeText(text);
    this.lastCopied.set(text);
    this.showCopied.set(true);
    setTimeout(() => this.showCopied.set(false), 2000);
  }
}

// Demo components
@Component({ selector: 'app-notification-demo', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>NotificationService</h3>
      <button (click)="svc.show('Hello!', 'info')">Info</button>
      <button (click)="svc.show('Saved!', 'success')" style="margin-left:8px">Success</button>
      <button (click)="svc.show('Error!', 'error')" style="margin-left:8px">Error</button>
      <div style="position:fixed;top:16px;right:16px;z-index:1000;">
        @for (n of svc.notifications(); track n.id) {
          <div [style.background]="n.type === 'error' ? '#e74c3c' : n.type === 'success' ? '#2ecc71' : '#3498db'"
               style="color:#fff;padding:10px 16px;border-radius:4px;margin-bottom:8px;min-width:200px;display:flex;justify-content:space-between;">
            {{ n.message }}
            <button (click)="svc.dismiss(n.id)" style="background:none;border:none;color:#fff;cursor:pointer;">×</button>
          </div>
        }
      </div>
    </section>
  `,
})
class NotificationDemoComponent { svc = inject(NotificationService); }

@Component({ selector: 'app-modal-demo', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>ModalService</h3>
      <button (click)="modal.open('Hello Modal', 'This is the modal content.')">Open Modal</button>
      @if (modal.isOpen()) {
        <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:2000;">
          <div style="background:#fff;border-radius:8px;padding:24px;min-width:300px;">
            <h4>{{ modal.title() }}</h4>
            <p>{{ modal.content() }}</p>
            <button (click)="modal.close()">Close</button>
          </div>
        </div>
      }
    </section>
  `,
})
class ModalDemoComponent { modal = inject(ModalService); }

@Component({ selector: 'app-storage-demo', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>StorageService</h3>
      <input #inp placeholder="Value to save..." />
      <button (click)="storage.set('demo-key', inp.value)">Save</button>
      <button (click)="read()" style="margin-left:8px">Read</button>
      <p>Read: <strong>{{ saved() }}</strong></p>
    </section>
  `,
})
class StorageDemoComponent {
  storage = inject(StorageService);
  saved   = signal('');
  read()  { this.saved.set(this.storage.get('demo-key', '(empty)')); }
}

@Component({ selector: 'app-network-demo', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>NetworkService</h3>
      <p [style.color]="network.isOnline() ? 'green' : 'red'">
        Status: <strong>{{ network.isOnline() ? 'Online' : 'Offline' }}</strong>
      </p>
    </section>
  `,
})
class NetworkDemoComponent { network = inject(NetworkService); }

@Component({ selector: 'app-clipboard-demo', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section>
      <h3>ClipboardService</h3>
      <button (click)="cb.copy('Hello from Angular!')">Copy "Hello from Angular!"</button>
      @if (cb.showCopied()) { <span style="color:green;margin-left:8px"> Copied!</span> }
      <p>Last copied: {{ cb.lastCopied() }}</p>
    </section>
  `,
})
class ClipboardDemoComponent { cb = inject(ClipboardService); }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NotificationDemoComponent, ModalDemoComponent, StorageDemoComponent,
            NetworkDemoComponent, ClipboardDemoComponent],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Solution 8.7 — Custom Services</h1>
      <app-notification-demo /><hr />
      <app-modal-demo /><hr />
      <app-storage-demo /><hr />
      <app-network-demo /><hr />
      <app-clipboard-demo />
    </div>
  `,
})
export class AppComponent {}
