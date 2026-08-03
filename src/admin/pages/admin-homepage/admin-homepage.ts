import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../ui-state';

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
export class AdminHomepage {
  private toast = inject(ToastService);
  tab = signal<'hero' | 'featured' | 'sections' | 'footer'>('hero');

  hero = {
    headline: 'Where memories live and new stories begin.',
    subheadline: 'A living archive of a community\'s gatherings.',
    tagline: 'Est. 1993 · Maple Hollow',
    primaryBtn: 'Upcoming Gatherings',
    secondaryBtn: 'Walk the Timeline',
  };

  featured = {
    eventId: 'harvest-festival-2026',
    stories: ['The Supper That Started It All', 'A Century of Carol Nights'],
  };

  storyOptions = ['The Supper That Started It All', 'Voices: Preserving the Spoken Word', 'A Century of Carol Nights', 'Remembering Mrs. Aldous'];

  stats = [
    { label: 'Years of gathering', value: '100+' },
    { label: 'Archive items', value: '4,000+' },
    { label: 'Annual events', value: '38' },
  ];

  sections = signal<HomeSection[]>([
    { id: 'hero', name: 'Hero Banner', description: 'The large opening section with headline and featured event card.', enabled: true },
    { id: 'featured', name: 'Featured Event', description: 'Highlights the next upcoming gathering with a countdown.', enabled: true },
    { id: 'memories', name: 'Latest Memories', description: 'Polaroid-style preview of recently added archive photos.', enabled: true },
    { id: 'events', name: 'Upcoming Events', description: 'Grid of upcoming gatherings with posters and dates.', enabled: true },
    { id: 'timeline', name: 'Timeline Preview', description: 'A century of milestones shown as a center-spine timeline.', enabled: true },
    { id: 'gallery', name: 'Gallery Preview', description: 'Film strip of photographs from the archive.', enabled: true },
    { id: 'community', name: 'Community Messages', description: 'Preview of notes left on the community wall.', enabled: true },
    { id: 'organizers', name: 'Stewards', description: 'Profiles of the team behind the gatherings.', enabled: true },
    { id: 'newsletter', name: 'Newsletter Signup', description: 'The dispatch subscription form in the footer.', enabled: true },
  ]);

  footer = {
    mission: 'A living digital archive where communities celebrate their heritage while building excitement for what\'s next.',
    copyright: '© 2026 ASTECAA Community Archive · A non-profit preservation project',
    instagram: '#',
    facebook: '#',
    youtube: '#',
  };

  toggleSection(id: string) {
    this.sections.update((list) => list.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  }

  toggleStory(s: string) {
    this.featured.stories = this.featured.stories.includes(s)
      ? this.featured.stories.filter((x) => x !== s)
      : [...this.featured.stories, s];
  }

  saveAll() {
    this.toast.show('Homepage content saved. Changes are now live.');
  }
}
