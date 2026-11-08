import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { RevealDirective } from '../../reveal.directive';
import { Countdown } from '../../components/countdown/countdown';
import { MEMORIES, TIMELINE, MESSAGES, ORGANIZERS } from '../../data';
import { UiState } from '../../ui-state';
import { EventsApiService } from '@astec/api-client';
import type { PublicEvent } from '@astec/types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, RevealDirective, Countdown, DecimalPipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private eventsApi = inject(EventsApiService);
  ui = new UiState();
  events = signal<PublicEvent[]>([]);
  featured = computed(() => this.events().find((event) => event.featured) ?? this.events()[0] ?? null);
  featuredBanner = computed(() => this.featured()?.banner || '/images/empty/image-fallback.jpg');
  upcoming = computed(() =>
    this.events()
      .filter((event) => event.id !== this.featured()?.id && event.date >= new Date().toISOString().slice(0, 10))
      .slice(0, 4)
  );
  eventsError = signal<string | null>(null);
  latestMemories = MEMORIES.slice(0, 4);
  galleryPreview = MEMORIES.slice(4, 11);
  timelinePreview = TIMELINE.filter((_, i) => i % 2 === 0).slice(0, 4);
  messagesPreview = MESSAGES.slice(0, 3);
  organizers = ORGANIZERS;
  rotations = [-3, 2, -1.5, 3, -2.5, 1.8, -2, 2.5];

  constructor() {
    void this.loadEvents();
  }

  private async loadEvents(): Promise<void> {
    try {
      this.events.set(await this.eventsApi.listPublic());
    } catch (error) {
      this.eventsError.set(error instanceof Error ? error.message : 'Events could not be loaded.');
    }
  }

  dateMonthYear(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  onAvatarImageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  img.src = 'images/empty/avatar-fallback.jpg';
}

onImageError(event: Event): void {
  const img = event.target as HTMLImageElement;
  img.src = 'images/empty/image-fallback.jpg';
}

}
