import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdmModal } from '../../components/adm-modal/adm-modal';
import { AdmConfirm } from '../../components/adm-confirm/adm-confirm';
import { ToastService } from '@astec/ui';
import { EventsApiService } from '@astec/api-client';
import type { CmsEvent, EventInput, EventScheduleItem, EventStatus } from '@astec/types';

interface EventEditor {
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  date: string;
  endDate: string;
  time: string;
  venue: string;
  city: string;
  category: string;
  capacity: number;
  status: EventStatus;
  featured: boolean;
  poster: string;
  banner: string;
  galleryText: string;
  scheduleText: string;
  organizer: string;
  organizerRole: string;
  organizerPhoto: string;
  tagsText: string;
}

const blankEditor = (): EventEditor => ({
  title: '',
  subtitle: '',
  description: '',
  longDescription: '',
  date: '',
  endDate: '',
  time: '',
  venue: '',
  city: '',
  category: 'Reunion',
  capacity: 200,
  status: 'draft',
  featured: false,
  poster: '',
  banner: '',
  galleryText: '',
  scheduleText: '[]',
  organizer: '',
  organizerRole: '',
  organizerPhoto: '',
  tagsText: '',
});

@Component({
  selector: 'app-admin-events',
  standalone: true,
  imports: [FormsModule, AdmModal, AdmConfirm],
  templateUrl: './admin-events.html',
})
export class AdminEvents {
  private toast = inject(ToastService);
  private eventsApi = inject(EventsApiService);

  events = signal<CmsEvent[]>([]);
  loading = signal(true);
  saving = signal(false);
  query = signal('');
  statusFilter = signal('');
  catFilter = signal('');
  view = signal<'list' | 'calendar'>('list');
  showModal = signal(false);
  editing = signal(false);
  deleteTarget = signal<CmsEvent | null>(null);

  categories = computed(() => [
    ...new Set([
      'Reunion',
      'Networking',
      'AGM',
      'Fundraiser',
      'Sports',
      'Mentorship',
      ...this.events().map((event) => event.category),
    ]),
  ]);
  weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  calMonth = signal(new Date(new Date().getFullYear(), new Date().getMonth(), 1));

  form = blankEditor();
  private editingId: string | null = null;

  filtered = computed(() => {
    const q = this.query().toLowerCase();
    const status = this.statusFilter();
    const category = this.catFilter();
    return this.events().filter((event) => {
      const matchesQuery =
        !q || event.title.toLowerCase().includes(q) || event.venue.toLowerCase().includes(q);
      return (
        matchesQuery &&
        (!status || event.status === status) &&
        (!category || event.category === category)
      );
    });
  });

  monthLabel = computed(() =>
    this.calMonth().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  );

  calendarCells = computed(() => {
    const month = this.calMonth();
    const year = month.getFullYear();
    const monthIndex = month.getMonth();
    const first = new Date(year, monthIndex, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
    const events = this.events();
    return Array.from({ length: 42 }, (_, index) => {
      const date = new Date(year, monthIndex, index - startDay + 1);
      const inMonth = date.getMonth() === monthIndex;
      return {
        key: `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`,
        day: date.getDate(),
        inMonth,
        isToday: date.toDateString() === new Date().toDateString(),
        events: inMonth ? events.filter((event) => event.date === isoDate(date)) : [],
      };
    });
  });

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.events.set(await this.eventsApi.listAdmin());
    } catch (error) {
      this.toast.show(errorMessage(error, 'Could not load events.'));
    } finally {
      this.loading.set(false);
    }
  }

  prevMonth(): void {
    this.calMonth.update((date) => new Date(date.getFullYear(), date.getMonth() - 1, 1));
  }

  nextMonth(): void {
    this.calMonth.update((date) => new Date(date.getFullYear(), date.getMonth() + 1, 1));
  }

  shortDate(value: string): string {
    return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  pct(event: CmsEvent): number {
    return Math.min(100, Math.round((event.registered / event.capacity) * 100));
  }

  openCreate(): void {
    this.editing.set(false);
    this.editingId = null;
    this.form = blankEditor();
    this.showModal.set(true);
  }

  openEdit(event: CmsEvent): void {
    this.editing.set(true);
    this.editingId = event.id;
    this.form = {
      title: event.title,
      subtitle: event.subtitle,
      description: event.description,
      longDescription: event.longDescription,
      date: event.date,
      endDate: event.endDate ?? '',
      time: event.time,
      venue: event.venue,
      city: event.city,
      category: event.category,
      capacity: event.capacity,
      status: event.status,
      featured: event.featured,
      poster: event.poster,
      banner: event.banner,
      galleryText: event.gallery.join('\n'),
      scheduleText: JSON.stringify(event.schedule, null, 2),
      organizer: event.organizer,
      organizerRole: event.organizerRole,
      organizerPhoto: event.organizerPhoto,
      tagsText: event.tags.join(', '),
    };
    this.showModal.set(true);
  }

  askDelete(event: CmsEvent): void {
    this.deleteTarget.set(event);
  }

  async save(): Promise<void> {
    if (!this.form.title.trim() || !this.form.date || !this.form.venue.trim()) {
      this.toast.show('Title, date, and venue are required.');
      return;
    }

    let input: EventInput;
    try {
      input = this.toInput();
    } catch (error) {
      this.toast.show(errorMessage(error, 'Check the schedule JSON.'));
      return;
    }

    this.saving.set(true);
    try {
      const saved = this.editingId
        ? await this.eventsApi.update(this.editingId, input)
        : await this.eventsApi.create(input);
      this.events.update((items) =>
        this.editingId
          ? items.map((item) => (item.id === saved.id ? saved : item))
          : [saved, ...items]
      );
      this.showModal.set(false);
      this.toast.show(this.editingId ? 'Event updated.' : 'Event created.');
    } catch (error) {
      this.toast.show(errorMessage(error, 'Could not save event.'));
    } finally {
      this.saving.set(false);
    }
  }

  async togglePublish(event: CmsEvent): Promise<void> {
    const input = this.toInput(event);
    input.status = event.status === 'published' ? 'draft' : 'published';
    await this.updateEvent(event.id, input, event.status === 'published' ? 'Event unpublished.' : 'Event published.');
  }

  async confirmDelete(): Promise<void> {
    const target = this.deleteTarget();
    if (target) {
      try {
        await this.eventsApi.delete(target.id);
        this.events.update((items) => items.filter((event) => event.id !== target.id));
        this.toast.show('Event deleted.');
      } catch (error) {
        this.toast.show(errorMessage(error, 'Could not delete event.'));
      }
    }
    this.deleteTarget.set(null);
  }

  private async updateEvent(
    id: string,
    input: EventInput,
    successMessage: string
  ): Promise<void> {
    try {
      const saved = await this.eventsApi.update(id, input);
      this.events.update((items) => items.map((event) => (event.id === id ? saved : event)));
      this.toast.show(successMessage);
    } catch (error) {
      this.toast.show(errorMessage(error, 'Could not update event.'));
    }
  }

  private toInput(event?: CmsEvent): EventInput {
    const editor = event ? editorFromEvent(event) : this.form;
    let schedule: EventScheduleItem[];
    try {
      const parsed: unknown = JSON.parse(editor.scheduleText || '[]');
      if (!Array.isArray(parsed) || !parsed.every(isScheduleItem)) {
        throw new Error('Schedule must be a JSON array with time, title, and detail.');
      }
      schedule = parsed;
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw new Error('Schedule must contain valid JSON.');
      }
      throw error;
    }

    return {
      title: editor.title.trim(),
      subtitle: editor.subtitle.trim(),
      description: editor.description.trim(),
      longDescription: editor.longDescription.trim(),
      date: editor.date,
      ...(editor.endDate ? { endDate: editor.endDate } : {}),
      time: editor.time.trim(),
      venue: editor.venue.trim(),
      city: editor.city.trim(),
      category: editor.category.trim(),
      poster: editor.poster.trim(),
      banner: editor.banner.trim(),
      gallery: editor.galleryText.split(/\r?\n/).map((value) => value.trim()).filter(Boolean),
      schedule,
      organizer: editor.organizer.trim(),
      organizerRole: editor.organizerRole.trim(),
      organizerPhoto: editor.organizerPhoto.trim(),
      capacity: editor.capacity,
      tags: editor.tagsText.split(',').map((value) => value.trim()).filter(Boolean),
      status: editor.status,
      featured: editor.featured,
    };
  }
}

function editorFromEvent(event: CmsEvent): EventEditor {
  return {
    ...event,
    endDate: event.endDate ?? '',
    galleryText: event.gallery.join('\n'),
    scheduleText: JSON.stringify(event.schedule, null, 2),
    tagsText: event.tags.join(', '),
  };
}

function isScheduleItem(value: unknown): value is EventScheduleItem {
  return (
    typeof value === 'object' &&
    value !== null &&
    'time' in value &&
    typeof value.time === 'string' &&
    'title' in value &&
    typeof value.title === 'string' &&
    'detail' in value &&
    typeof value.detail === 'string'
  );
}

function isoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
