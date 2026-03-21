import { Component } from '@angular/core';

// ============================================================
// Exercise 8.7 — Custom Utility Services
// ============================================================
// Topics:
//   • Signal-based notification/toast service
//   • Programmatic modal service
//   • Type-safe localStorage wrapper
//   • Online/offline detection
//   • Clipboard API
// ============================================================

// ---------------------------------------------------------------------------
// TODO 1: NotificationService
// ---------------------------------------------------------------------------
// Create a NotificationService decorated with @Injectable({ providedIn: 'root' }).
// interface Notification { id: string; message: string; type: 'info'|'success'|'error'; }
// Signal: notifications: Notification[].
// Methods:
//   - show(message, type) — adds notification, auto-removes after 3 seconds
//   - dismiss(id) — removes by id
//
// @Injectable({ providedIn: 'root' })
// export class NotificationService { ... }

// ---------------------------------------------------------------------------
// TODO 2: ModalService
// ---------------------------------------------------------------------------
// Create a ModalService decorated with @Injectable({ providedIn: 'root' }).
// Signal: isOpen: boolean, title: string, content: string.
// Methods:
//   - open(title, content)
//   - close()
//
// @Injectable({ providedIn: 'root' })
// export class ModalService { ... }

// ---------------------------------------------------------------------------
// TODO 3: StorageService
// ---------------------------------------------------------------------------
// Create a StorageService decorated with @Injectable({ providedIn: 'root' }).
// Type-safe wrapper around localStorage:
//   - get<T>(key: string, defaultValue: T): T
//   - set<T>(key: string, value: T): void
//   - remove(key: string): void
//   - clear(): void
// Also provide a reactive getSignal<T>(key, defaultValue): WritableSignal<T>
// that auto-syncs to localStorage.
//
// @Injectable({ providedIn: 'root' })
// export class StorageService { ... }

// ---------------------------------------------------------------------------
// TODO 4: NetworkService
// ---------------------------------------------------------------------------
// Create a NetworkService decorated with @Injectable({ providedIn: 'root' }).
// Signal: isOnline: boolean — initialized with navigator.onLine.
// Listen to window 'online' and 'offline' events to update the signal.
// Clean up event listeners on destroy.
//
// @Injectable({ providedIn: 'root' })
// export class NetworkService { ... }

// ---------------------------------------------------------------------------
// TODO 5: ClipboardService
// ---------------------------------------------------------------------------
// Create a ClipboardService decorated with @Injectable({ providedIn: 'root' }).
// Method: copy(text: string): Promise<void>
//   - Uses navigator.clipboard.writeText()
//   - Signal: lastCopied: string
//   - Signal: showCopied: boolean — true for 2 seconds after each copy
//
// @Injectable({ providedIn: 'root' })
// export class ClipboardService { ... }

// ROOT COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    // TODO: Add demo components for each service
  ],
  template: `
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h1>Exercise 8.7 — Custom Services</h1>
      <!-- TODO: render demo components for each service -->
    </div>
  `,
})
export class AppComponent {}
