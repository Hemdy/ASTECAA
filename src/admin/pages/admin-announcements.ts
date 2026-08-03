import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdmModal } from '../components/adm-modal';
import { ToastService } from '../../ui-state';

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
  template: `
    <div class="adm-toolbar">
      <div>
        <div class="adm-section-title">Announcements & News</div>
        <div class="adm-section-sub">Publish community updates, news, and scheduled notifications.</div>
      </div>
      <button class="adm-btn adm-btn-primary" style="margin-left: auto" (click)="openCreate()">+ New Announcement</button>
    </div>

    <div style="display: flex; flex-direction: column; gap: 12px">
      @for (a of items(); track a.id) {
        <div class="adm-card adm-card-pad">
          <div style="display: flex; gap: 16px; align-items: flex-start">
            <div style="flex: 1; min-width: 0">
              <div style="display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 6px">
                @if (a.pinned) { <span class="adm-badge adm-badge-gold">★ Pinned</span> }
                <span class="adm-badge" [class.adm-badge-success]="a.status === 'published'" [class.adm-badge-info]="a.status === 'scheduled'" [class.adm-badge-warning]="a.status === 'draft'">{{ a.status }}</span>
                <span class="adm-badge adm-badge-muted">{{ channelLabel(a.channel) }}</span>
                <span style="margin-left: auto" class="adm-card-sub">{{ shortDate(a.date) }}</span>
              </div>
              <h3 style="font-family: var(--font-display); margin-bottom: 6px">{{ a.title }}</h3>
              <p style="color: var(--ad-text-soft); margin: 0; line-height: 1.5">{{ a.body }}</p>
            </div>
            <div style="display: flex; gap: 4px">
              <button class="adm-btn adm-btn-ghost adm-btn-icon" (click)="togglePin(a)" title="Pin/unpin">{{ a.pinned ? '★' : '☆' }}</button>
              <button class="adm-btn adm-btn-ghost adm-btn-icon" (click)="edit(a)" title="Edit">✎</button>
              <button class="adm-btn adm-btn-ghost adm-btn-icon" (click)="remove(a)" title="Delete">🗑</button>
            </div>
          </div>
        </div>
      }
    </div>

    @if (showModal()) {
      <app-adm-modal [title]="editing() ? 'Edit Announcement' : 'New Announcement'" size="lg" (close)="showModal.set(false)">
        <div style="display: grid; gap: 16px">
          <div class="adm-field">
            <label class="adm-field-label">Title</label>
            <input class="adm-input" [(ngModel)]="form.title" placeholder="An announcement title…" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div class="adm-field">
              <label class="adm-field-label">Channel</label>
              <select class="adm-select" [(ngModel)]="form.channel">
                <option value="site">Website only</option>
                <option value="email">Email newsletter</option>
                <option value="push">Push notification</option>
              </select>
            </div>
            <div class="adm-field">
              <label class="adm-field-label">Schedule for</label>
              <input class="adm-input" type="date" [(ngModel)]="form.date" />
            </div>
          </div>
          <div class="adm-field">
            <label class="adm-field-label">Message</label>
            <textarea class="adm-textarea" [(ngModel)]="form.body" placeholder="Write the announcement…"></textarea>
          </div>
          <div class="adm-toggle-row" style="border: none; padding: 0">
            <div class="adm-toggle-row-text">
              <div class="adm-toggle-row-title">Pin to top</div>
              <div class="adm-toggle-row-desc">Pinned announcements appear at the top of the community feed.</div>
            </div>
            <label class="adm-switch"><input type="checkbox" [(ngModel)]="form.pinned" /><span class="adm-switch-slider"></span></label>
          </div>
        </div>
        <div foot>
          <button class="adm-btn adm-btn-outline" (click)="showModal.set(false)">Cancel</button>
          <button class="adm-btn adm-btn-outline" (click)="save(true)">Save draft</button>
          <button class="adm-btn adm-btn-primary" (click)="save(false)">{{ form.date ? 'Schedule' : 'Publish now' }}</button>
        </div>
      </app-adm-modal>
    }
  `,
})
export class AdminAnnouncements {
  private toast = inject(ToastService);
  items = signal<Announcement[]>([
{
  id: 'an1',
  title: 'Sounds of Worship Concert 2026 registration is now open',
  body: 'Registration for Sounds of Worship Concert 2026 is now open. Reserve your seat early and prepare for an unforgettable evening of powerful worship, inspiring gospel music, and life-changing moments. Spaces are limited.',
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
