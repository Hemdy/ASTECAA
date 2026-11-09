import { Component, signal, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdmBars, AdmDonut, AdmLine } from '../../components/adm-charts/adm-charts';
import { AdmModal } from '../../components/adm-modal/adm-modal';
import { ToastService } from '@astec/ui';
import { DashboardApiService, CmsApiService } from '@astec/api-client';
import { AdminAuthService } from '../../auth.service';
import type { DashboardStatsItem } from '@astec/types';
import {
  ADMIN_ACTIVITY,
  ENGAGEMENT_DATA,
  TRAFFIC_DATA,
} from '../../admin-data';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, AdmBars, AdmDonut, AdmLine, AdmModal],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class AdminDashboard {
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

  engagementData = computed(() =>
    this.stats().engagementData && this.stats().engagementData!.length > 0
      ? this.stats().engagementData!
      : ENGAGEMENT_DATA
  );

  trafficData = computed(() =>
    this.stats().trafficData && this.stats().trafficData!.length > 0
      ? this.stats().trafficData!
      : TRAFFIC_DATA
  );

  activity = computed(() =>
    this.stats().recentActivity && this.stats().recentActivity!.length > 0
      ? this.stats().recentActivity!
      : ADMIN_ACTIVITY
  );

  pendingComments = computed(() => this.stats().pendingApprovalsList || []);

  quickModal = signal('');
  quickModalTitle = signal('');

  constructor() {
    this.loadStats();
  }

  async loadStats() {
    try {
      const data = await this.dashboardApi.getStats();
      this.stats.set(data);
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
    this.toast.show('Opening the editor for this action.');
    this.quickModal.set('');
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
