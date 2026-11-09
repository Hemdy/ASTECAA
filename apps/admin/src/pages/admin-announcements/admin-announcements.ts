import { Component, signal, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AdmModal } from '../../components/adm-modal/adm-modal';
import { ToastService } from '@astec/ui';
import { CmsApiService } from '@astec/api-client';
import type { CmsAnnouncement } from '@astec/types';

@Component({
  selector: 'app-admin-announcements',
  standalone: true,
  imports: [FormsModule, AdmModal],
  templateUrl: './admin-announcements.html',
})
export class AdminAnnouncements implements OnInit {
  private route = inject(ActivatedRoute);
  private cmsApi = inject(CmsApiService);
  private toast = inject(ToastService);

  items = signal<CmsAnnouncement[]>([]);
  loading = signal(false);
  showModal = signal(false);
  editing = signal(false);

  form: Partial<CmsAnnouncement> = {
    title: '',
    body: '',
    date: new Date().toISOString().slice(0, 10),
    channel: 'site',
    pinned: false,
    status: 'published',
  };

  ngOnInit() {
    void this.loadAnnouncements();
    this.route.queryParams.subscribe((params) => {
      if (params['action'] === 'new') {
        this.openCreate();
      }
    });
  }

  async loadAnnouncements() {
    this.loading.set(true);
    try {
      const list = await this.cmsApi.adminListAnnouncements();
      this.items.set(list);
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to load announcements');
    } finally {
      this.loading.set(false);
    }
  }

  shortDate(d?: string | null): string {
    if (!d) return 'Draft';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  channelLabel(ch?: string | null): string {
    switch (ch) {
      case 'email':
        return 'Email newsletter';
      case 'push':
        return 'Push notification';
      default:
        return 'Website';
    }
  }

  openCreate() {
    this.editing.set(false);
    this.form = {
      title: '',
      body: '',
      date: new Date().toISOString().slice(0, 10),
      channel: 'site',
      pinned: false,
      status: 'published',
    };
    this.showModal.set(true);
  }

  edit(a: CmsAnnouncement) {
    this.editing.set(true);
    this.form = { ...a };
    this.showModal.set(true);
  }

  async save() {
    if (!this.form.title?.trim()) {
      this.toast.show('Please provide a title.');
      return;
    }
    try {
      if (this.editing() && this.form.id) {
        await this.cmsApi.updateAnnouncement(this.form.id, this.form);
        this.toast.show('Announcement updated.');
      } else {
        await this.cmsApi.createAnnouncement(this.form);
        this.toast.show('Announcement published.');
      }
      this.showModal.set(false);
      await this.loadAnnouncements();
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to save announcement');
    }
  }

  async togglePin(a: CmsAnnouncement) {
    try {
      await this.cmsApi.updateAnnouncement(a.id, { pinned: !a.pinned });
      this.toast.show(a.pinned ? 'Announcement unpinned.' : 'Announcement pinned to top.');
      await this.loadAnnouncements();
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to toggle pin');
    }
  }

  async remove(a: CmsAnnouncement) {
    try {
      await this.cmsApi.deleteAnnouncement(a.id);
      this.toast.show('Announcement deleted.');
      await this.loadAnnouncements();
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to delete announcement');
    }
  }
}
