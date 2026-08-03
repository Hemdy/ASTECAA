import { Component, inject, computed, HostListener } from '@angular/core';
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
  user = ADMIN_USER;
  notifications = ADMIN_NOTIFICATIONS;
  mobileMenuBtn = 0;

  unreadCount = computed(() => this.notifications.filter((n) => n.unread).length);

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
      case 'user': return '👤';
      case 'event': return '📅';
      case 'comment': return '💬';
      case 'gallery': return '🖼';
      default: return '⚙';
    }
  }

  logout() {
    this.auth.signOut();
  }

  @HostListener('window:resize')
  onResize() {
    this.mobileMenuBtn = window.innerWidth <= 768 ? 1 : 0;
    if (window.innerWidth > 768) this.state.mobileOpen.set(false);
  }

  constructor() {
    this.onResize();
    this.router.events.subscribe(() => this.state.closeNotif());
  }
}
