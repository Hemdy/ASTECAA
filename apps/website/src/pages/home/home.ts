import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { DecimalPipe } from '@angular/common';
import { RevealDirective } from '../../reveal.directive';
import { Countdown } from '../../components/countdown/countdown';
import { AnnouncementsBar } from '../../components/announcements-bar/announcements-bar';
import { ORGANIZERS } from '../../data';
import { UiState } from '../../ui-state';
import { EventsApiService, CmsApiService } from '@astec/api-client';
import type {
  PublicEvent,
  CmsGalleryItem,
  CmsTimelineMilestone,
  CmsCommunityMessage,
  CmsHomepageSettings,
  CmsAnnouncement,
} from '@astec/types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, RevealDirective, Countdown, AnnouncementsBar, DecimalPipe],
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
    return this.homepage()?.hero?.bgImage || this.featured()?.banner || '/images/empty/image-fallback.jpg';
  });

  featuredMediaImage = computed(() => {
    const ev = this.featured();
    return ev?.banner || ev?.poster || '/images/empty/image-fallback.jpg';
  });

  upcoming = computed(() =>
    this.events()
      .filter((event) => event.id !== this.featured()?.id && event.date >= new Date().toISOString().slice(0, 10))
      .slice(0, 4)
  );

  eventsError = signal<string | null>(null);
  eventsLoading = signal(true);
  galleryLoading = signal(true);
  homepageLoading = signal(true);
  latestMemories = signal<CmsGalleryItem[]>([]);
  galleryPreview = signal<CmsGalleryItem[]>([]);
  timelinePreview = signal<CmsTimelineMilestone[]>([]);
  messagesPreview = signal<CmsCommunityMessage[]>([]);
  announcements = signal<CmsAnnouncement[]>([]);

  organizers = ORGANIZERS;
  rotations = [-3, 2, -1.5, 3, -2.5, 1.8, -2, 2.5];

  ngOnInit() {
    void this.loadAll();
  }

  isSectionEnabled(id: string): boolean {
    const list = this.homepage()?.sections;
    if (!list || list.length === 0) return true;
    const item = list.find((s) => s.id === id);
    return item ? item.enabled !== false : true;
  }

  private async loadAll(): Promise<void> {
    await Promise.allSettled([this.loadEvents(), this.loadCmsContent()]);
  }

  private async loadEvents(): Promise<void> {
    this.eventsLoading.set(true);
    try {
      this.events.set(await this.eventsApi.listPublic());
    } catch (error) {
      this.eventsError.set(error instanceof Error ? error.message : 'Events could not be loaded.');
    } finally {
      this.eventsLoading.set(false);
    }
  }

  private async loadCmsContent(): Promise<void> {
    this.galleryLoading.set(true);
    this.homepageLoading.set(true);
    try {
      const [hp, gallery, timeline, messages, ann] = await Promise.all([
        this.cmsApi.getHomepage().catch(() => null),
        this.cmsApi.getGallery().catch(() => []),
        this.cmsApi.getTimeline().catch(() => []),
        this.cmsApi.getCommunityMessages('community', 'approved').catch(() => []),
        this.cmsApi.getAnnouncements().catch(() => []),
      ]);

      if (hp) this.homepage.set(hp);
      if (ann && ann.length > 0) {
        this.announcements.set(ann.filter((a) => a.status === 'published'));
      }
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
    } finally {
      this.galleryLoading.set(false);
      this.homepageLoading.set(false);
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
