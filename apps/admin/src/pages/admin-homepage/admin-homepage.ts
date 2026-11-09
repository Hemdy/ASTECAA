import { Component, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '@astec/ui';
import { CmsApiService, EventsApiService } from '@astec/api-client';
import type { CmsHomepageSettings, CmsEvent } from '@astec/types';

interface HomeSection {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
}

@Component({
  selector: 'app-admin-homepage',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-homepage.html',
})
export class AdminHomepage implements OnInit {
  private cmsApi = inject(CmsApiService);
  private eventsApi = inject(EventsApiService);
  private toast = inject(ToastService);

  tab = signal<'hero' | 'featured' | 'sections' | 'footer'>('hero');
  saving = signal(false);
  availableEvents = signal<CmsEvent[]>([]);

  hero = {
    headline: 'Reconnect. Celebrate. Give Back.',
    subheadline:
      'The official digital home of ASTECAA alumni — connecting former students, celebrating our shared journey, and building a stronger future together.',
    tagline: 'ASTECAA · Alumni Association',
    primaryBtn: 'Explore Upcoming Events',
    secondaryBtn: 'Discover ASTECAA',
    bgImage: '/images/empty/image-fallback.jpg',
  };

  featured = {
    eventId: '',
    stories: [
      'The ASTECAA Journey: From School Days to Alumni Community',
      'Why ASTECAA Still Matters: Connecting Generations of Alumni',
    ],
  };

  storyOptions = [
    'The ASTECAA Journey: From School Days to Alumni Community',
    'Why ASTECAA Still Matters: Connecting Generations of Alumni',
    'Remembering Our School Days: Stories from ASTECAA Alumni',
    'Giving Back: How Alumni Are Supporting the Next Generation',
  ];

  stats = [
    { label: 'Alumni community', value: '1000+' },
    { label: 'Graduating sets', value: '50+' },
    { label: 'Annual programmes', value: '6+' },
  ];

  sections = signal<HomeSection[]>([
    { id: 'hero', name: 'Hero Banner', description: 'The main opening section introducing ASTECAA and highlighting the alumni community.', enabled: true },
    { id: 'featured', name: 'Featured Event', description: 'Highlights the next major ASTECAA event with event details and registration information.', enabled: true },
    { id: 'memories', name: 'Alumni Memories', description: 'A preview of photographs, school memories, and moments shared by ASTECAA alumni.', enabled: true },
    { id: 'events', name: 'Upcoming Events', description: 'Displays upcoming ASTECAA reunions, networking forums, AGMs, fundraisers, and other programmes.', enabled: true },
    { id: 'timeline', name: 'ASTECAA Timeline', description: 'Highlights important milestones in the history and development of ASTECAA.', enabled: true },
    { id: 'gallery', name: 'Alumni Gallery', description: 'A visual collection of alumni reunions, school memories, events, and ASTECAA activities.', enabled: true },
    { id: 'community', name: 'Alumni Community Wall', description: 'Displays messages, memories, congratulations, and reflections shared by alumni.', enabled: true },
    { id: 'organizers', name: 'ASTECAA Leadership', description: 'Profiles of the association executives, committees, and members helping to drive ASTECAA forward.', enabled: true },
    { id: 'newsletter', name: 'Alumni Updates', description: 'Newsletter subscription for ASTECAA announcements, events, opportunities, and alumni news.', enabled: true },
  ]);

  footer = {
    mission:
      'ASTECAA connects alumni across generations, celebrates our shared heritage, supports our school community, and creates opportunities for members to reconnect, contribute, and grow together.',
    copyright: '© 2026 ASTECAA · Alumni Association · Reconnecting Generations, Building the Future',
    instagram: '#',
    facebook: '#',
    twitter: '#',
  };

  ngOnInit() {
    void this.loadData();
  }

  async loadData() {
    try {
      const [settings, events] = await Promise.all([
        this.cmsApi.adminGetHomepage().catch(() => null),
        this.eventsApi.listAdmin().catch(() => []),
      ]);

      if (settings) {
        if (settings.hero) {
          this.hero = { ...this.hero, ...settings.hero };
        }
        if (settings.featured) {
          this.featured = { ...this.featured, ...settings.featured };
        }
        if (settings.sections && settings.sections.length > 0) {
          const savedMap = new Map((settings.sections as HomeSection[]).map((s) => [s.id, s.enabled]));
          this.sections.update((curr) =>
            curr.map((s) => ({
              ...s,
              enabled: savedMap.has(s.id) ? (savedMap.get(s.id) as boolean) : s.enabled,
            }))
          );
        }
        if (settings.footer) {
          this.footer = { ...this.footer, ...settings.footer };
        }
      }

      if (events && events.length > 0) {
        this.availableEvents.set(events as any);
        if (!this.featured.eventId) {
          const feat = events.find((e: any) => e.featured) || events[0];
          this.featured.eventId = feat.id;
        }
      }
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to load homepage settings');
    }
  }

  toggleSection(id: string) {
    this.sections.update((list) => list.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  }

  toggleStory(s: string) {
    this.featured.stories = this.featured.stories.includes(s)
      ? this.featured.stories.filter((x) => x !== s)
      : [...this.featured.stories, s];
  }

  async onHeroBgSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const base64 = e.target?.result as string;
          const media = await this.cmsApi.adminUploadMedia(base64, file.name, file.type, 'homepage');
          this.hero.bgImage = media.url;
          this.toast.show('Hero background uploaded.');
        } catch (err: any) {
          this.toast.show(err.message || 'Upload failed');
        }
      };
      reader.readAsDataURL(file);
    }
  }

  async saveAll() {
    this.saving.set(true);
    try {
      const payload: CmsHomepageSettings = {
        hero: this.hero,
        featured: this.featured,
        sections: this.sections(),
        footer: this.footer,
      };
      await this.cmsApi.adminUpdateHomepage(payload);
      this.toast.show('ASTECAA homepage content saved to Neon. Changes are now live.');
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to save homepage');
    } finally {
      this.saving.set(false);
    }
  }
}
