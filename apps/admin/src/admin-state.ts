import { Injectable, signal, effect, DestroyRef, inject } from '@angular/core';

type AdminTheme = 'light' | 'dark';
const THEME_STORAGE_KEY = 'astec_admin_theme';

@Injectable({ providedIn: 'root' })
export class AdminState {
  private readonly destroyRef = inject(DestroyRef);
  private readonly storedPreference = signal<AdminTheme | null>(this.readStoredTheme());

  theme = signal<AdminTheme>(this.resolveInitialTheme());
  collapsed = signal(false);
  mobileOpen = signal(false);
  notifOpen = signal(false);
  search = signal('');

  constructor() {
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const mql = window.matchMedia('(prefers-color-scheme: dark)');
      const onMediaChange = (e: MediaQueryListEvent) => {
        if (this.storedPreference() === null) {
          this.theme.set(e.matches ? 'dark' : 'light');
        }
      };
      mql.addEventListener('change', onMediaChange);

      const onStorage = (e: StorageEvent) => {
        if (e.key !== THEME_STORAGE_KEY) return;
        const nextPref = e.newValue === 'light' || e.newValue === 'dark' ? e.newValue : null;
        this.storedPreference.set(nextPref);
        this.theme.set(nextPref ?? (mql.matches ? 'dark' : 'light'));
      };
      window.addEventListener('storage', onStorage);

      this.destroyRef.onDestroy(() => {
        mql.removeEventListener('change', onMediaChange);
        window.removeEventListener('storage', onStorage);
      });
    }
  }

  private themeEffect = effect(() => {
    const active = this.theme();
    const pref = this.storedPreference();
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', active);
      const colorSchemeMeta = document.querySelector('meta[name="color-scheme"]');
      if (colorSchemeMeta) {
        colorSchemeMeta.setAttribute('content', pref ?? 'light dark');
      }
      const themeColorMeta = document.querySelector('meta[name="theme-color"]');
      if (themeColorMeta) {
        themeColorMeta.setAttribute('content', active === 'dark' ? '#1c1612' : '#f6f1e6');
      }
    }
  });

  private readStoredTheme(): AdminTheme | null {
    try {
      const val = typeof localStorage !== 'undefined' ? localStorage.getItem(THEME_STORAGE_KEY) : null;
      return val === 'light' || val === 'dark' ? val : null;
    } catch {
      return null;
    }
  }

  private resolveInitialTheme(): AdminTheme {
    const stored = this.readStoredTheme();
    if (stored) return stored;
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  }

  toggleTheme() {
    const next: AdminTheme = this.theme() === 'light' ? 'dark' : 'light';
    this.storedPreference.set(next);
    this.theme.set(next);
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      }
    } catch {
      // Ignore storage write errors in restricted browsing modes
    }
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
