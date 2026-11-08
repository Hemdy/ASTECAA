import { Injectable, signal, effect } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AdminState {
  theme = signal<'light' | 'dark'>('light');
  collapsed = signal(false);
  mobileOpen = signal(false);
  notifOpen = signal(false);
  search = signal('');

  private themeEffect = effect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', this.theme());
    }
  });

  toggleTheme() {
    this.theme.update((t) => (t === 'light' ? 'dark' : 'light'));
  }

  toggleCollapsed() {
    this.collapsed.update((c) => !c);
  }

  toggleMobile() {
    this.mobileOpen.update((m) => !m);
  }

  toggleNotif() {
    this.notifOpen.update((n) => !n);
  }

  closeNotif() {
    this.notifOpen.set(false);
  }
}
