import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RevealDirective } from '../../reveal.directive';
import { UiState } from '../../ui-state';
import { EventsApiService } from '@astec/api-client';
import type { PublicEvent } from '@astec/types';

@Component({
  selector: 'app-events',
  standalone: true,
  imports: [RouterLink, FormsModule, RevealDirective],
  templateUrl: './events.html',
  styleUrl: './events.css',
})
export class Events {
  private eventsApi = inject(EventsApiService);
  ui = new UiState();
  all = signal<PublicEvent[]>([]);
  loading = signal(true);
  error = signal<string | null>(null);
  query = signal('');
  category = signal('');
  sort = signal<'date' | 'title' | 'popular'>('date');

  categories = computed(() => [...new Set(this.all().map((event) => event.category))]);

  filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    const cat = this.category();
    let list = this.all().filter((e) => {
      const matchesCat = !cat || e.category === cat;
      const matchesQ =
        !q ||
        e.title.toLowerCase().includes(q) ||
        e.subtitle.toLowerCase().includes(q) ||
        e.venue.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.tags.some((t) => t.toLowerCase().includes(q));
      return matchesCat && matchesQ;
    });
    const s = this.sort();
    if (s === 'date') list = [...list].sort((a, b) => +new Date(a.date) - +new Date(b.date));
    if (s === 'title') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (s === 'popular') list = [...list].sort((a, b) => b.registered - a.registered);
    return list;
  });

  constructor() {
    void this.load();
  }

  private async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.all.set(await this.eventsApi.listPublic());
    } catch (error) {
      this.error.set(error instanceof Error ? error.message : 'Events could not be loaded.');
    } finally {
      this.loading.set(false);
    }
  }

  clear() {
    this.query.set('');
    this.category.set('');
    this.sort.set('date');
  }
}
