import { Component, inject, computed, signal, OnInit, DestroyRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationEnd } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { filter } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AdminState } from './admin-state';
import { AdminAuthService } from './auth.service';
import { CmsApiService, DashboardApiService } from '@astec/api-client';
import { ADMIN_NAV, ADMIN_USER, type AdminNavItem } from './admin-data';
import type { AdminNotificationItem } from '@astec/types';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './admin-layout.html',
})
export class AdminLayout implements OnInit {
  private destroyRef = inject(DestroyRef);
  state = inject(AdminState);
  auth = inject(AdminAuthService);
  cmsApi = inject(CmsApiService);
  dashboardApi = inject(DashboardApiService);
  router = inject(Router);
  nav = ADMIN_NAV;
  notifications = signal<AdminNotificationItem[]>([]);
  unreadCount = computed(() => this.notifications().filter((n) => !n.read).length);

  navBadge(item: AdminNavItem): string | null {
    if (!item.countKey) return null;
    const counts = this.dashboardApi.sidebarCounts();
    if (!counts) return null;
    const value = counts[item.countKey];
    return item.showZero || value > 0 ? String(value) : null;
  }

  get user() {
    const p = this.auth.profile();
    return {
      name: p?.full_name || ADMIN_USER.name,
      role: p?.role === 'super_admin' ? 'Super Administrator' : (p?.role === 'admin' ? 'Administrator' : ADMIN_USER.role),
      avatar: p?.avatar_url || ADMIN_USER.avatar,
    };
  }

  crumbs = computed(() => {
    const url = this.router.url;
    const parts = url.split('/').filter(Boolean);
    if (parts[0] === 'admin') parts.shift();
    const list = ['Admin'];
    for (const p of parts) {
      list.push(p.charAt(0).toUpperCase() + p.slice(1).replace(/-/g, ' '));
    }
    return list;
  });

  crumbPath(crumb: string): string {
    if (crumb === 'Admin') return '/admin/dashboard';
    const slug = crumb.toLowerCase().replace(/\s/g, '-');
    return `/admin/${slug}`;
  }

  ngOnInit() {
    void this.loadNotifications();
    void this.dashboardApi.refreshSidebarCounts();
    if (typeof document !== 'undefined') {
      const onVisibility = () => {
        if (document.visibilityState === 'visible') {
          void this.dashboardApi.refreshSidebarCounts();
        }
      };
      document.addEventListener('visibilitychange', onVisibility);
      this.destroyRef.onDestroy(() => document.removeEventListener('visibilitychange', onVisibility));
    }
  }

  async loadNotifications() {
    try {
      const list = await this.cmsApi.adminListNotifications();
      this.notifications.set(list);
    } catch {
      // Keep empty if unauthenticated or error
    }
  }

  async onNotifClick(n: AdminNotificationItem) {
    if (!n.read) {
      try {
        await this.cmsApi.adminMarkNotificationRead(n.id);
        this.notifications.update((list) =>
          list.map((item) => (item.id === n.id ? { ...item, read: true } : item))
        );
      } catch {}
    }
    if (n.link) {
      this.state.closeNotif();
      void this.router.navigateByUrl(n.link);
    }
  }

  async markAllRead() {
    try {
      await this.cmsApi.adminMarkAllNotificationsRead();
      this.notifications.update((list) =>
        list.map((item) => ({ ...item, read: true }))
      );
    } catch {}
  }

  shortDate(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  toggleNotif(e: Event) {
    e.stopPropagation();
    this.state.toggleNotif();
    if (this.state.notifOpen()) {
      void this.loadNotifications();
    }
  }

  closeMobile() {
    this.state.mobileOpen.set(false);
  }

  notifIcon(type: string): string {
    switch (type) {
      case 'user': return 'ri-user-line';
      case 'event': return 'ri-calendar-line';
      case 'comment': return 'ri-chat-3-line';
      case 'contact': return 'ri-mail-line';
      case 'vote': return 'ri-checkbox-circle-line';
      case 'gallery': return 'ri-image-line';
      default: return 'ri-notification-3-line';
    }
  }

  logout() {
    this.auth.signOut();
  }

  constructor() {
    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.state.closeNotif();
        this.closeMobile();
        void this.dashboardApi.refreshSidebarCounts();
      });
  }
}
