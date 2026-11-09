import { Component, signal, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '@astec/ui';
import { EventsApiService, CmsApiService, VotingService } from '@astec/api-client';
import { MemberAuthService } from '../../services/member-auth';
import type { Election, MemberProfile } from '@astec/types';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  readonly auth = inject(MemberAuthService);
  private readonly eventsApi = inject(EventsApiService);
  private readonly cmsApi = inject(CmsApiService);
  private readonly votingApi = inject(VotingService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  activeTab = signal<'overview' | 'events' | 'elections' | 'notes' | 'profile'>('overview');
  loading = signal(true);
  savingProfile = signal(false);

  registeredEvents = signal<any[]>([]);
  myNotes = signal<any[]>([]);
  activeElections = signal<Election[]>([]);

  profileForm = {
    fullName: '',
    phone: '',
    graduationSet: '',
    department: '',
    bio: '',
    avatarUrl: '',
  };

  ngOnInit() {
    void this.initialize();
  }

  async initialize() {
    await this.auth.ready();
    if (!this.auth.isAuthenticated()) {
      void this.router.navigate(['/login'], { queryParams: { redirect: '/dashboard' } });
      return;
    }

    const p = this.auth.profile();
    if (p) {
      this.populateForm(p);
    }

    await this.loadAllData();
  }

  populateForm(p: MemberProfile) {
    this.profileForm = {
      fullName: p.full_name || '',
      phone: p.phone || '',
      graduationSet: p.graduation_set || '',
      department: p.department || '',
      bio: p.bio || '',
      avatarUrl: p.avatar_url || '',
    };
  }

  async loadAllData() {
    this.loading.set(true);
    const profile = this.auth.profile();
    if (!profile) {
      this.loading.set(false);
      return;
    }

    try {
      const [events, notes, elections] = await Promise.all([
        this.eventsApi.getUserRegistrations(profile.id || profile.email).catch(() => []),
        this.cmsApi.getUserCommunityNotes(profile.id || profile.email).catch(() => []),
        this.votingApi.getActiveElections().catch(() => []),
      ]);

      this.registeredEvents.set(events);
      this.myNotes.set(notes);
      this.activeElections.set(elections);
    } catch (err: any) {
      this.toast.show(err.message || 'Could not load your dashboard activities.');
    } finally {
      this.loading.set(false);
    }
  }

  async saveProfile() {
    if (this.savingProfile()) return;
    this.savingProfile.set(true);

    try {
      const success = await this.auth.updateProfile({
        fullName: this.profileForm.fullName.trim(),
        phone: this.profileForm.phone.trim(),
        graduationSet: this.profileForm.graduationSet.trim(),
        department: this.profileForm.department.trim(),
        bio: this.profileForm.bio.trim(),
        avatarUrl: this.profileForm.avatarUrl.trim(),
      });

      if (success) {
        this.toast.show('Your profile was successfully updated.');
        const updated = this.auth.profile();
        if (updated) this.populateForm(updated);
        this.activeTab.set('overview');
      } else {
        this.toast.show(this.auth.authError() || 'Could not update profile.');
      }
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to update profile.');
    } finally {
      this.savingProfile.set(false);
    }
  }

  onAvatarImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/empty/avatar-fallback.jpg';
  }

  signOut() {
    void this.auth.signOut();
  }
}
