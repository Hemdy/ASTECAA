import { Component, signal, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdmBars, AdmDonut, AdmLine } from '../../components/adm-charts/adm-charts';
import { AdmModal } from '../../components/adm-modal/adm-modal';
import {
  ADMIN_ACTIVITY,
  ADMIN_COMMENTS,
  ADMIN_EVENTS,
  ADMIN_STORIES,
  ADMIN_USERS,
  GROWTH_DATA,
  ENGAGEMENT_DATA,
  TRAFFIC_DATA,
} from '../../admin-data';
import { ToastService } from '../../../ui-state';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [RouterLink, AdmBars, AdmDonut, AdmLine, AdmModal],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class AdminDashboard {
  private toast = inject(ToastService);
  growthData = GROWTH_DATA;
  engagementData = ENGAGEMENT_DATA;
  trafficData = TRAFFIC_DATA;
  activity = ADMIN_ACTIVITY;
  pendingComments = ADMIN_COMMENTS.filter((c) => c.status === 'pending').slice(0, 4);
  upcomingEvents = ADMIN_EVENTS.filter((e) => e.status === 'published' || e.status === 'scheduled').slice(0, 4);
  newUsers = ADMIN_USERS.slice(0, 4);

  quickModal = signal('');
  quickModalTitle = signal('');

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

  approve(id: string) {
    this.toast.show('Comment approved and published to the wall.');
  }

  reject(id: string) {
    this.toast.show('Comment rejected.');
  }
}
