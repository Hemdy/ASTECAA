import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdmModal } from '../../components/adm-modal/adm-modal';
import { ToastService } from '../../../ui-state';

interface Announcement {
  id: string;
  title: string;
  body: string;
  date: string;
  status: 'published' | 'scheduled' | 'draft';
  pinned: boolean;
  channel: 'email' | 'push' | 'site';
}

@Component({
  selector: 'app-admin-announcements',
  standalone: true,
  imports: [FormsModule, AdmModal],
  templateUrl: './admin-announcements.html',
})
export class AdminAnnouncements {
  private toast = inject(ToastService);
  items = signal<Announcement[]>([
{
  id: 'an1',
  title: 'Sounds of Worship Concert 2026 Registration Now Open',
  body: 'Registration for Sounds of Worship Concert 2026 is officially open. Secure your spot today and join us for an unforgettable evening of powerful worship, inspiring gospel music, and an uplifting live concert experience. Reserve your seat early as attendance is expected to reach capacity.',
  date: '2026-09-20',
  status: 'published',
  pinned: true,
  channel: 'email',
},    { id: 'an2', title: 'Archive open day in August', body: 'The archive reading room will be open to the public on August 9th. Drop in to see original photographs and recordings from the collection.', date: '2026-07-18', status: 'published', pinned: false, channel: 'site' },
    { id: 'an3', title: 'Scheduled: Carol Night reminder', body: 'A reminder that Winter Carol Night is approaching on December 19th. Lanterns are distributed from 6pm.', date: '2026-12-15', status: 'scheduled', pinned: false, channel: 'push' },
    { id: 'an4', title: 'Draft: Volunteer call for the reunion', body: 'A draft announcement seeking volunteers for the spring alumni reunion weekend.', date: '', status: 'draft', pinned: false, channel: 'site' },
  ]);
  showModal = signal(false);
  editing = signal(false);
  form: Partial<Announcement> = { title: '', body: '', date: '', channel: 'site', pinned: false, status: 'draft' };

  shortDate(iso: string): string {
    if (!iso) return 'Not scheduled';
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  channelLabel(c: string): string {
    return c === 'email' ? 'Email' : c === 'push' ? 'Push' : 'Website';
  }

  openCreate() {
    this.editing.set(false);
    this.form = { title: '', body: '', date: '', channel: 'site', pinned: false, status: 'draft' };
    this.showModal.set(true);
  }

  edit(a: Announcement) {
    this.editing.set(true);
    this.form = { ...a };
    this.showModal.set(true);
  }

  save(asDraft: boolean) {
    if (!this.form.title) {
      this.toast.show('Please give the announcement a title.');
      return;
    }
    const status = asDraft ? 'draft' : this.form.date ? 'scheduled' : 'published';
    if (this.editing() && this.form.id) {
      this.items.update((list) => list.map((a) => (a.id === this.form.id ? { ...a, ...this.form, status } as Announcement : a)));
      this.toast.show('Announcement updated.');
    } else {
      const newA: Announcement = {
        id: 'an' + Date.now(),
        title: this.form.title || '',
        body: this.form.body || '',
        date: this.form.date || '',
        status,
        pinned: !!this.form.pinned,
        channel: (this.form.channel as Announcement['channel']) || 'site',
      };
      this.items.update((list) => [newA, ...list]);
      this.toast.show(asDraft ? 'Draft saved.' : status === 'scheduled' ? 'Announcement scheduled.' : 'Announcement published.');
    }
    this.showModal.set(false);
  }

  togglePin(a: Announcement) {
    this.items.update((list) => list.map((x) => (x.id === a.id ? { ...x, pinned: !x.pinned } : x)));
    this.toast.show(a.pinned ? 'Unpinned.' : 'Pinned to top.');
  }

  remove(a: Announcement) {
    this.items.update((list) => list.filter((x) => x.id !== a.id));
    this.toast.show('Announcement deleted.');
  }
}
