import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdmModal } from '../components/adm-modal';
import { AdmConfirm } from '../components/adm-confirm';
import { ADMIN_EVENTS, AdminEvent } from '../admin-data';
import { ToastService } from '../../ui-state';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [FormsModule, AdmModal, AdmConfirm],
  template: `
    <div class="adm-toolbar">
      <div>
        <div class="adm-section-title">Event Management</div>
        <div class="adm-section-sub">Create, schedule, and manage all community gatherings.</div>
      </div>
      <div style="margin-left: auto; display: flex; gap: 10px">
        <button class="adm-btn adm-btn-outline" [class.adm-btn-active]="view() === 'calendar'" (click)="view.set('calendar')">📅 Calendar</button>
        <button class="adm-btn adm-btn-outline" [class.adm-btn-active]="view() === 'list'" (click)="view.set('list')">☰ List</button>
        <button class="adm-btn adm-btn-primary" (click)="openCreate()">+ New Event</button>
      </div>
    </div>

    <!-- Filters -->
    <div class="adm-card adm-card-pad" style="margin-bottom: 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end">
      <div class="adm-field" style="margin: 0; flex: 1; min-width: 200px">
        <label class="adm-field-label">Search</label>
        <input class="adm-input" [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Search events…" />
      </div>
      <div class="adm-field" style="margin: 0; min-width: 160px">
        <label class="adm-field-label">Status</label>
        <select class="adm-select" [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)">
          <option value="">All statuses</option>
          <option value="published">Published</option>
          <option value="draft">Draft</option>
          <option value="scheduled">Scheduled</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      <div class="adm-field" style="margin: 0; min-width: 160px">
        <label class="adm-field-label">Category</label>
        <select class="adm-select" [ngModel]="catFilter()" (ngModelChange)="catFilter.set($event)">
          <option value="">All categories</option>
          @for (c of categories; track c) { <option [value]="c">{{ c }}</option> }
        </select>
      </div>
    </div>

    @if (view() === 'list') {
      <div class="adm-card">
        <div class="adm-table-wrap">
          <table class="adm-table">
            <thead>
              <tr>
                <th style="width: 36px"><input type="checkbox" class="adm-cb" /></th>
                <th>Event</th>
                <th>Date</th>
                <th>Venue</th>
                <th>Category</th>
                <th>Registered</th>
                <th>Status</th>
                <th>Featured</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (e of filtered(); track e.id) {
                <tr>
                  <td><input type="checkbox" class="adm-cb" /></td>
                  <td>
                    <div class="adm-cell-user">
                      <img class="adm-thumb" [src]="e.poster" [alt]="e.title" style="width: 44px; height: 56px; object-fit: cover" />
                      <div>
                        <div class="adm-cell-user-name">{{ e.title }}</div>
                        <div class="adm-cell-user-sub">{{ e.id }}</div>
                      </div>
                    </div>
                  </td>
                  <td>{{ shortDate(e.date) }}</td>
                  <td>{{ e.venue }}</td>
                  <td><span class="adm-badge adm-badge-gold">{{ e.category }}</span></td>
                  <td>
                    <div>{{ e.registered }}/{{ e.capacity }}</div>
                    <div class="adm-progress" style="margin-top: 4px; width: 100px">
                      <div class="adm-progress-bar" [style.width.%]="pct(e)"></div>
                    </div>
                  </td>
                  <td>
                    <span class="adm-badge" [class.adm-badge-success]="e.status === 'published'" [class.adm-badge-warning]="e.status === 'draft'" [class.adm-badge-info]="e.status === 'scheduled'" [class.adm-badge-muted]="e.status === 'archived'">{{ e.status }}</span>
                  </td>
                  <td>
                    @if (e.featured) {
                      <span class="adm-badge adm-badge-gold">★ Featured</span>
                    } @else {
                      <span class="adm-badge adm-badge-muted">—</span>
                    }
                  </td>
                  <td>
                    <div class="adm-table-actions">
                      <button class="adm-btn adm-btn-ghost adm-btn-icon" (click)="openEdit(e)" title="Edit">✎</button>
                      <button class="adm-btn adm-btn-ghost adm-btn-icon" (click)="togglePublish(e)" title="Publish/Unpublish">{{ e.status === 'published' ? '⊘' : '↑' }}</button>
                      <button class="adm-btn adm-btn-ghost adm-btn-icon" (click)="askDelete(e)" title="Delete">🗑</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
        <div class="adm-card-head" style="border-top: 1px solid var(--ad-border); border-bottom: none">
          <span class="adm-card-sub">{{ filtered().length }} events</span>
          <div class="adm-pagination">
            <button class="adm-page-btn" [disabled]="true">‹</button>
            <button class="adm-page-btn active">1</button>
            <button class="adm-page-btn">2</button>
            <button class="adm-page-btn">›</button>
          </div>
        </div>
      </div>
    } @else {
      <!-- Calendar view -->
      <div class="adm-card adm-card-pad">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px">
          <strong style="font-family: var(--font-display); font-size: 1.1rem">{{ monthLabel() }}</strong>
          <div style="display: flex; gap: 6px">
            <button class="adm-page-btn" (click)="prevMonth()">‹</button>
            <button class="adm-page-btn" (click)="nextMonth()">›</button>
          </div>
        </div>
        <div class="adm-cal">
          @for (d of weekDays; track d) {
            <div class="adm-cal-head">{{ d }}</div>
          }
          @for (cell of calendarCells(); track cell.key) {
            <div class="adm-cal-cell" [class.muted]="!cell.inMonth" [class.today]="cell.isToday">
              <span class="adm-cal-cell-num">{{ cell.day }}</span>
              @for (ev of cell.events; track ev.id) {
                <span class="adm-cal-event">{{ ev.title }}</span>
              }
            </div>
          }
        </div>
      </div>
    }

    @if (showModal()) {
      <app-adm-modal [title]="editing() ? 'Edit Event' : 'Create New Event'" size="lg" (close)="showModal.set(false)">
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
          <div class="adm-field" style="grid-column: 1 / -1">
            <label class="adm-field-label">Event Title</label>
<input
  class="adm-input"
  [(ngModel)]="form.title"
  placeholder="e.g. Sounds of Worship Concert 2026"
/>          </div>
          <div class="adm-field">
            <label class="adm-field-label">Start Date</label>
            <input class="adm-input" type="date" [(ngModel)]="form.date" />
          </div>
          <div class="adm-field">
            <label class="adm-field-label">Time</label>
            <input class="adm-input" [(ngModel)]="form.time" placeholder="e.g. 7:00 PM" />
          </div>
          <div class="adm-field">
            <label class="adm-field-label">Venue</label>
            <input class="adm-input" [(ngModel)]="form.venue" placeholder="e.g. Community Hall" />
          </div>
          <div class="adm-field">
            <label class="adm-field-label">Category</label>
            <select class="adm-select" [(ngModel)]="form.category">
              @for (c of categories; track c) { <option [value]="c">{{ c }}</option> }
            </select>
          </div>
          <div class="adm-field">
            <label class="adm-field-label">Capacity</label>
            <input class="adm-input" type="number" [(ngModel)]="form.capacity" />
          </div>
          <div class="adm-field">
            <label class="adm-field-label">Status</label>
            <select class="adm-select" [(ngModel)]="form.status">
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          <div class="adm-field" style="grid-column: 1 / -1">
            <label class="adm-field-label">Description</label>
            <textarea class="adm-textarea" [(ngModel)]="form.description" placeholder="Tell the story of this gathering…"></textarea>
          </div>
          <div class="adm-toggle-row" style="grid-column: 1 / -1; border: none; padding: 0">
            <div class="adm-toggle-row-text">
              <div class="adm-toggle-row-title">Feature this event</div>
              <div class="adm-toggle-row-desc">Featured events appear prominently on the homepage.</div>
            </div>
            <label class="adm-switch">
              <input type="checkbox" [(ngModel)]="form.featured" />
              <span class="adm-switch-slider"></span>
            </label>
          </div>
        </div>
        <div foot>
          <button class="adm-btn adm-btn-outline" (click)="showModal.set(false)">Cancel</button>
          <button class="adm-btn adm-btn-primary" (click)="save()">{{ editing() ? 'Save changes' : 'Create event' }}</button>
        </div>
      </app-adm-modal>
    }

    @if (deleteTarget()) {
      <app-adm-confirm
        [message]="'Delete ' + deleteTarget()!.title + '? This cannot be undone.'"
        confirmLabel="Delete"
        (confirm)="confirmDelete()"
        (cancel)="deleteTarget.set(null)"
      ></app-adm-confirm>
    }
  `,
})
export class AdminEvents {
  private toast = inject(ToastService);
  events = signal<AdminEvent[]>(ADMIN_EVENTS);
  query = signal('');
  statusFilter = signal('');
  catFilter = signal('');
  view = signal<'list' | 'calendar'>('list');
  showModal = signal(false);
  editing = signal(false);
  deleteTarget = signal<AdminEvent | null>(null);

  categories = [...new Set(ADMIN_EVENTS.map((e) => e.category))];
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  calMonth = signal(new Date(2026, 8, 1)); // September 2026

  form: Partial<AdminEvent> = { title: '', date: '', time: '', venue: '', category: 'Festival', capacity: 200, status: 'draft', featured: false, description: '' };

  filtered = computed(() => {
    const q = this.query().toLowerCase();
    const s = this.statusFilter();
    const c = this.catFilter();
    return this.events().filter((e) => {
      const mq = !q || e.title.toLowerCase().includes(q) || e.venue.toLowerCase().includes(q);
      const ms = !s || e.status === s;
      const mc = !c || e.category === c;
      return mq && ms && mc;
    });
  });

  monthLabel = computed(() =>
    this.calMonth().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );

  calendarCells = computed(() => {
    const month = this.calMonth();
    const year = month.getFullYear();
    const m = month.getMonth();
    const first = new Date(year, m, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const daysInPrev = new Date(year, m, 0).getDate();
    const today = new Date();
    const events = this.events();
    const cells: { key: string; day: number; inMonth: boolean; isToday: boolean; events: AdminEvent[] }[] = [];
    for (let i = 0; i < 42; i++) {
      let dayNum: number;
      let inMonth = true;
      const cellDate = new Date(year, m, i - startDay + 1);
      if (i < startDay) {
        dayNum = daysInPrev - startDay + i + 1;
        inMonth = false;
      } else if (i >= startDay + daysInMonth) {
        dayNum = i - startDay - daysInMonth + 1;
        inMonth = false;
      } else {
        dayNum = i - startDay + 1;
      }
      const iso = cellDate.toISOString().slice(0, 10);
      const dayEvents = events.filter((e) => e.date === iso);
      cells.push({
        key: `${cellDate.getFullYear()}-${cellDate.getMonth()}-${cellDate.getDate()}`,
        day: dayNum,
        inMonth,
        isToday: cellDate.toDateString() === today.toDateString(),
        events: inMonth ? dayEvents : [],
      });
    }
    return cells;
  });

  prevMonth() {
    this.calMonth.update((d) => new Date(d.getFullYear(), d.getMonth() - 1, 1));
  }
  nextMonth() {
    this.calMonth.update((d) => new Date(d.getFullYear(), d.getMonth() + 1, 1));
  }

  shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  pct(e: AdminEvent): number {
    return Math.min(100, Math.round((e.registered / e.capacity) * 100));
  }

  openCreate() {
    this.editing.set(false);
    this.form = { title: '', date: '', time: '', venue: '', category: 'Festival', capacity: 200, status: 'draft', featured: false, description: '' };
    this.showModal.set(true);
  }

  openEdit(e: AdminEvent) {
    this.editing.set(true);
    this.form = { ...e };
    this.showModal.set(true);
  }

  save() {
    if (!this.form.title) {
      this.toast.show('Please give the event a title.');
      return;
    }
    if (this.editing() && this.form.id) {
      this.events.update((list) => list.map((e) => (e.id === this.form.id ? { ...e, ...this.form } as AdminEvent : e)));
      this.toast.show('Event updated.');
    } else {
      const newEv: AdminEvent = {
        id: (this.form.title || '').toLowerCase().replace(/\s+/g, '-'),
        title: this.form.title || '',
        date: this.form.date || new Date().toISOString().slice(0, 10),
        venue: this.form.venue || '',
        category: this.form.category || 'Festival',
        status: (this.form.status as AdminEvent['status']) || 'draft',
        capacity: this.form.capacity || 100,
        registered: 0,
        featured: !!this.form.featured,
        poster: 'https://images.pexels.com/photos/207662/pexels-photo-207662.jpeg?auto=compress&cs=tinysrgb&w=200&h=260&fit=crop',
      };
      this.events.update((list) => [newEv, ...list]);
      this.toast.show('Event created.');
    }
    this.showModal.set(false);
  }

  togglePublish(e: AdminEvent) {
    this.events.update((list) =>
      list.map((ev) => (ev.id === e.id ? { ...ev, status: ev.status === 'published' ? 'draft' : 'published' } : ev))
    );
    this.toast.show(e.status === 'published' ? 'Event unpublished.' : 'Event published.');
  }

  askDelete(e: AdminEvent) {
    this.deleteTarget.set(e);
  }

  confirmDelete() {
    const t = this.deleteTarget();
    if (t) {
      this.events.update((list) => list.filter((e) => e.id !== t.id));
      this.toast.show('Event deleted.');
    }
    this.deleteTarget.set(null);
  }
}
