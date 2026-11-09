import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
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
  CmsAnnouncement,
} from '@astec/types';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink, RevealDirective, Countdown, DecimalPipe],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
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
  announcements = signal<CmsAnnouncement[]>([]);
  currentAnnouncementIndex = signal(0);
  isAnnouncementPaused = signal(false);
  private announcementInterval: any = null;
  private touchStartX = 0;
  private mouseStartX = 0;
  private isMouseDown = false;

  currentAnnouncement = computed(() => {
    const list = this.announcements();
    if (list.length === 0) return null;
    return list[this.currentAnnouncementIndex() % list.length];
  });

  organizers = ORGANIZERS;
  rotations = [-3, 2, -1.5, 3, -2.5, 1.8, -2, 2.5];

  ngOnInit() {
    void this.loadAll();
    this.startAnnouncementRotation();
  }

  ngOnDestroy() {
    this.stopAnnouncementRotation();
  }

  startAnnouncementRotation() {
    this.stopAnnouncementRotation();
    this.announcementInterval = setInterval(() => {
      if (!this.isAnnouncementPaused() && this.announcements().length > 1) {
        this.nextAnnouncement();
      }
    }, 5000);
  }

  stopAnnouncementRotation() {
    if (this.announcementInterval) {
      clearInterval(this.announcementInterval);
      this.announcementInterval = null;
    }
  }

  nextAnnouncement() {
    const total = this.announcements().length;
    if (total <= 1) return;
    this.currentAnnouncementIndex.update((i) => (i + 1) % total);
  }

  prevAnnouncement() {
    const total = this.announcements().length;
    if (total <= 1) return;
    this.currentAnnouncementIndex.update((i) => (i - 1 + total) % total);
  }

  goToAnnouncement(index: number) {
    this.currentAnnouncementIndex.set(index);
  }

  pauseAnnouncements() {
    this.isAnnouncementPaused.set(true);
  }

  resumeAnnouncements() {
    this.isAnnouncementPaused.set(false);
  }

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].clientX;
  }

  onTouchEnd(e: TouchEvent) {
    const deltaX = e.changedTouches[0].clientX - this.touchStartX;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) this.nextAnnouncement();
      else this.prevAnnouncement();
    }
  }

  onMouseDown(e: MouseEvent) {
    this.mouseStartX = e.clientX;
    this.isMouseDown = true;
  }

  onMouseUp(e: MouseEvent) {
    if (this.isMouseDown) {
      this.isMouseDown = false;
      const deltaX = e.clientX - this.mouseStartX;
      if (Math.abs(deltaX) > 40) {
        if (deltaX < 0) this.nextAnnouncement();
        else this.prevAnnouncement();
      }
    }
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
    try {
      this.events.set(await this.eventsApi.listPublic());
    } catch (error) {
      this.eventsError.set(error instanceof Error ? error.message : 'Events could not be loaded.');
    }
  }

  private async loadCmsContent(): Promise<void> {
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
