import { Component, inject, computed } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdminState } from './admin-state';
import { AdminAuthService } from './auth.service';
import { ADMIN_NAV, ADMIN_USER, ADMIN_NOTIFICATIONS } from './admin-data';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, FormsModule],
  templateUrl: './admin-layout.html',
})
export class AdminLayout {
  state = inject(AdminState);
  auth = inject(AdminAuthService);
  router = inject(Router);
  nav = ADMIN_NAV;
  notifications = ADMIN_NOTIFICATIONS;
  unreadCount = computed(() => this.notifications.filter((n) => n.unread).length);

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

  toggleNotif(e: Event) {
    e.stopPropagation();
    this.state.toggleNotif();
  }

  closeMobile() {
    this.state.mobileOpen.set(false);
  }

  notifIcon(type: string): string {
    switch (type) {
      case 'user': return 'ri-user-line';
      case 'event': return 'ri-calendar-line';
      case 'comment': return 'ri-chat-3-line';
      case 'gallery': return 'ri-image-line';
      default: return 'ri-settings-line';
    }
  }

  logout() {
    this.auth.signOut();
  }

  constructor() {
    this.router.events.subscribe(() => this.state.closeNotif());
  }
}
