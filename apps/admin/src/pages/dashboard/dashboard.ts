import { Component, signal, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AdmBars, AdmDonut, AdmLine } from '../../components/adm-charts/adm-charts';
import { AdmModal } from '../../components/adm-modal/adm-modal';
import { ToastService } from '@astec/ui';
import { DashboardApiService, CmsApiService } from '@astec/api-client';
import { AdminAuthService } from '../../auth.service';
import type { DashboardStatsItem } from '@astec/types';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, AdmBars, AdmDonut, AdmLine, AdmModal],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class AdminDashboard {
  private router = inject(Router);
  private toast = inject(ToastService);
  private dashboardApi = inject(DashboardApiService);
  private cmsApi = inject(CmsApiService);
  private auth = inject(AdminAuthService);

  stats = signal<DashboardStatsItem>({
    totalUsers: 0,
    upcomingEvents: 0,
    pendingApprovals: 0,
    activeElections: 0,
    totalVotes: 0,
    engagementRate: 100,
    engagedUsersCount: 0,
    inactiveUsersCount: 0,
    growthData: [],
    recentUsers: [],
    upcomingEventsList: [],
    recentActivity: [],
    pendingApprovalsList: [],
  });

  adminName = computed(() => this.auth.profile()?.full_name || 'Administrator');
  growthData = computed(() => this.stats().growthData);
  upcomingEvents = computed(() => this.stats().upcomingEventsList as any[]);
  newUsers = computed(() => this.stats().recentUsers as any[]);

  engagementRate = computed(() => this.stats().engagementRate ?? 85);
  engagedCount = computed(() => this.stats().engagedUsersCount ?? Math.max(1, this.stats().totalUsers));
  inactiveCount = computed(() => this.stats().inactiveUsersCount ?? 0);

  engagementData = computed(() => this.stats().engagementData || []);
  trafficData = computed(() => this.stats().trafficData || []);
  activity = computed(() => this.stats().recentActivity || []);

  pendingComments = computed(() => this.stats().pendingApprovalsList || []);

  quickModal = signal('');
  quickModalTitle = signal('');

  growthPeriod = signal<'12m' | '6m' | '3m' | '1m' | '2w'>('6m');
  growthPeriodLabel = computed(() => {
    switch (this.growthPeriod()) {
      case '12m':
        return '12 months';
      case '6m':
        return '6 months';
      case '3m':
        return '3 months';
      case '1m':
        return '1 month';
      case '2w':
        return '2 weeks';
    }
  });

  constructor() {
    this.loadStats();
  }

  onPeriodSelect(event: Event) {
    const val = (event.target as HTMLSelectElement).value as '12m' | '6m' | '3m' | '1m' | '2w';
    this.growthPeriod.set(val);
    void this.loadStats();
  }

  async loadStats() {
    try {
      const data = await this.dashboardApi.getStats(this.growthPeriod());
      this.stats.set(data);
      void this.dashboardApi.refreshSidebarCounts();
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to load dashboard metrics.');
    }
  }

  shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  truncate(s: string): string {
    return s.length > 60 ? s.slice(0, 60) + '…' : s;
  }

  quickNew(kind: string) {
    const titles: Record<string, string> = {
      event: 'Create New Event',
      story: 'Write a New Story',
      upload: 'Upload Media',
      announce: 'Publish Announcement',
    };
    this.quickModal.set(kind);
    this.quickModalTitle.set(titles[kind] ?? 'New');
  }

  confirmQuick() {
    const kind = this.quickModal();
    this.quickModal.set('');
    if (kind === 'event') {
      void this.router.navigate(['/admin/events'], { queryParams: { action: 'new' } });
    } else if (kind === 'story') {
      void this.router.navigate(['/admin/stories'], { queryParams: { action: 'new' } });
    } else if (kind === 'upload') {
      void this.router.navigate(['/admin/media'], { queryParams: { action: 'upload' } });
    } else if (kind === 'announce') {
      void this.router.navigate(['/admin/announcements'], { queryParams: { action: 'new' } });
    }
  }

  async approve(id: string) {
    try {
      await this.cmsApi.updateCommentStatus(id, 'approved');
      this.toast.show('Note approved and published to the wall.');
      await this.loadStats();
    } catch (err: any) {
      this.toast.show(err.message || 'Could not approve note.');
    }
  }

  async reject(id: string) {
    try {
      await this.cmsApi.updateCommentStatus(id, 'reported');
      this.toast.show('Note rejected and removed.');
      await this.loadStats();
    } catch (err: any) {
      this.toast.show(err.message || 'Could not reject note.');
    }
  }

  onAvatarImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/ASTECAA.jpg';
  }
}
