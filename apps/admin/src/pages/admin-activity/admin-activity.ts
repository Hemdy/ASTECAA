import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { DashboardApiService } from '@astec/api-client';
import { ToastService } from '@astec/ui';
import type { AdminActivityCategory, AdminActivityItem } from '@astec/types';

type TimeRangeFilter = 'all' | '24h' | '7d' | '30d';

const CATEGORY_LABELS: Record<AdminActivityCategory, string> = {
  registration: 'Registrations',
  community: 'Community',
  user: 'Members',
  event: 'Events',
  story: 'Stories',
  announcement: 'Announcements',
  contact: 'Contact',
  gallery: 'Gallery',
};

@Component({
  selector: 'app-admin-activity',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './admin-activity.html',
})
export class AdminActivity implements OnInit {
  private readonly dashboardApi = inject(DashboardApiService);
  private readonly toast = inject(ToastService);

  activities = signal<AdminActivityItem[]>([]);
  loading = signal(true);
  query = signal('');
  categoryFilter = signal<'' | AdminActivityCategory>('');
  timeFilter = signal<TimeRangeFilter>('all');
  page = signal(1);
  readonly pageSize = 20;

  readonly categoryOptions: Array<{ value: '' | AdminActivityCategory; label: string }> = [
    { value: '', label: 'All categories' },
    { value: 'registration', label: 'Registrations' },
    { value: 'community', label: 'Community' },
    { value: 'user', label: 'Members' },
    { value: 'event', label: 'Events' },
    { value: 'story', label: 'Stories' },
    { value: 'announcement', label: 'Announcements' },
    { value: 'contact', label: 'Contact' },
    { value: 'gallery', label: 'Gallery' },
  ];

  counts = computed(() => {
    const all = this.activities();
    const dayAgo = Date.now() - 24 * 60 * 60 * 1000;
    let last24h = 0;
    let communityAndRegs = 0;
    let members = 0;

    for (const item of all) {
      if ((item.timestamp ?? 0) >= dayAgo) {
        last24h += 1;
      }
      if (item.category === 'registration' || item.category === 'community') {
        communityAndRegs += 1;
      }
      if (item.category === 'user') {
        members += 1;
      }
    }

    return {
      total: all.length,
      last24h,
      communityAndRegs,
      members,
    };
  });

  filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    const cat = this.categoryFilter();
    const range = this.timeFilter();
    const now = Date.now();
    const cutoff =
      range === '24h'
        ? now - 24 * 60 * 60 * 1000
        : range === '7d'
          ? now - 7 * 24 * 60 * 60 * 1000
          : range === '30d'
            ? now - 30 * 24 * 60 * 60 * 1000
            : 0;

    return this.activities().filter((item) => {
      if (cat && item.category !== cat) return false;
      if (cutoff && (item.timestamp ?? 0) < cutoff) return false;
      if (!q) return true;

      const haystack = `${item.user} ${item.action} ${item.target} ${item.detail ?? ''} ${item.category ?? ''}`.toLowerCase();
      return haystack.includes(q);
    });
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.filtered().length / this.pageSize)));

  paged = computed(() => {
    const safePage = Math.min(this.page(), this.totalPages());
    const start = (safePage - 1) * this.pageSize;
    return this.filtered().slice(start, start + this.pageSize);
  });

  pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = Math.min(this.page(), total);
    const start = Math.max(1, current - 2);
    const end = Math.min(total, start + 4);
    const pages: number[] = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  });

  hasActiveFilters = computed(
    () => Boolean(this.query().trim() || this.categoryFilter() || this.timeFilter() !== 'all')
  );

  ngOnInit(): void {
    void this.loadActivity();
  }

  async loadActivity(): Promise<void> {
    this.loading.set(true);
    try {
      const list = await this.dashboardApi.getRecentActivity(150);
      this.activities.set(list);
      this.page.set(1);
    } catch (err: any) {
      this.toast.show(err?.message || 'Failed to load recent activity.');
    } finally {
      this.loading.set(false);
    }
  }

  onSearchChange(value: string): void {
    this.query.set(value);
    this.page.set(1);
  }

  onCategoryChange(value: '' | AdminActivityCategory): void {
    this.categoryFilter.set(value);
    this.page.set(1);
  }

  onTimeChange(value: TimeRangeFilter): void {
    this.timeFilter.set(value);
    this.page.set(1);
  }

  clearFilters(): void {
    this.query.set('');
    this.categoryFilter.set('');
    this.timeFilter.set('all');
    this.page.set(1);
  }

  setPage(next: number): void {
    if (next < 1 || next > this.totalPages()) return;
    this.page.set(next);
  }

  categoryLabel(category?: AdminActivityCategory): string {
    return category ? CATEGORY_LABELS[category] ?? category : 'Activity';
  }

  categoryBadgeClass(category?: AdminActivityCategory): string {
    switch (category) {
      case 'registration':
      case 'event':
        return 'adm-badge-info';
      case 'community':
      case 'story':
        return 'adm-badge-gold';
      case 'user':
        return 'adm-badge-success';
      case 'contact':
        return 'adm-badge-warning';
      case 'announcement':
        return 'adm-badge-burgundy';
      default:
        return 'adm-badge-muted';
    }
  }

  formatTimestamp(iso?: string): string {
    if (!iso) return '';
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  linkPath(link?: string): string {
    if (!link) return '/admin/dashboard';
    return link.split('?')[0] || '/admin/dashboard';
  }

  linkQuery(link?: string): Record<string, string> | null {
    if (!link || !link.includes('?')) return null;
    const query = link.split('?')[1];
    if (!query) return null;
    const params: Record<string, string> = {};
    new URLSearchParams(query).forEach((value, key) => {
      params[key] = value;
    });
    return params;
  }
}
