import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdmModal } from '../../components/adm-modal/adm-modal';
import { AdmConfirm } from '../../components/adm-confirm/adm-confirm';
import { ADMIN_EVENTS, AdminEvent } from '../../admin-data';
import { ToastService } from '../../../ui-state';

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [FormsModule, AdmModal, AdmConfirm],
  templateUrl: './admin-events.html',
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
        poster: '/images/reunion.jpg',
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
