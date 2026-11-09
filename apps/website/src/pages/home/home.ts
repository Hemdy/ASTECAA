import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { RevealDirective } from '../../reveal.directive';
import { Countdown } from '../../components/countdown/countdown';
import { ORGANIZERS } from '../../data';
import { UiState } from '../../ui-state';
import { EventsApiService, CmsApiService } from '@astec/api-client';
import type {
  PublicEvent,
  CmsGalleryItem,
  CmsTimelineMilestone,
  CmsCommunityMessage,
  CmsHomepageSettings,
} from '@astec/types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, RevealDirective, Countdown, DecimalPipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit {
  private eventsApi = inject(EventsApiService);
  private cmsApi = inject(CmsApiService);

  ui = new UiState();
  events = signal<PublicEvent[]>([]);
  homepage = signal<CmsHomepageSettings | null>(null);

  featured = computed(() => {
    const list = this.events();
    const featId = this.homepage()?.featured?.eventId;
    if (featId) {
      const match = list.find((e) => e.id === featId);
      if (match) return match;
    }
    return list.find((event) => event.featured) ?? list[0] ?? null;
  });

  featuredBanner = computed(() => {
    return this.featured()?.banner || this.homepage()?.hero?.bgImage || '/images/empty/image-fallback.jpg';
  });

  upcoming = computed(() =>
    this.events()
      .filter((event) => event.id !== this.featured()?.id && event.date >= new Date().toISOString().slice(0, 10))
      .slice(0, 4)
  );

  eventsError = signal<string | null>(null);
  latestMemories = signal<CmsGalleryItem[]>([]);
  galleryPreview = signal<CmsGalleryItem[]>([]);
  timelinePreview = signal<CmsTimelineMilestone[]>([]);
  messagesPreview = signal<CmsCommunityMessage[]>([]);
  organizers = ORGANIZERS;
  rotations = [-3, 2, -1.5, 3, -2.5, 1.8, -2, 2.5];

  ngOnInit() {
    void this.loadAll();
  }

  private async loadAll(): Promise<void> {
    await Promise.allSettled([this.loadEvents(), this.loadCmsContent()]);
  }

  private async loadEvents(): Promise<void> {
    try {
      this.events.set(await this.eventsApi.listPublic());
    } catch (error) {
      this.eventsError.set(error instanceof Error ? error.message : 'Events could not be loaded.');
    }
  }

  private async loadCmsContent(): Promise<void> {
    try {
      const [hp, gallery, timeline, messages] = await Promise.all([
        this.cmsApi.getHomepage().catch(() => null),
        this.cmsApi.getGallery().catch(() => []),
        this.cmsApi.getTimeline().catch(() => []),
        this.cmsApi.getCommunityMessages('community', 'approved').catch(() => []),
      ]);

      if (hp) this.homepage.set(hp);
      if (gallery && gallery.length > 0) {
        this.latestMemories.set(gallery.slice(0, 4));
        this.galleryPreview.set(gallery.slice(4, 11));
      }
      if (timeline && timeline.length > 0) {
        this.timelinePreview.set(timeline.slice(0, 4));
      }
      if (messages && messages.length > 0) {
        this.messagesPreview.set(messages.slice(0, 3));
      }
    } catch {
      // Empty arrays handled by signals
    }
  }

  dateMonthYear(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  onAvatarImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/empty/avatar-fallback.jpg';
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/empty/image-fallback.jpg';
  }
}
