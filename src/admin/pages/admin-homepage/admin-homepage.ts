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
    headline: 'Reconnect. Celebrate. Give Back.',
    subheadline:
      'The official digital home of ASTECAA alumni — connecting former students, celebrating our shared journey, and building a stronger future together.',
    tagline: 'ASTECAA · Alumni Association',
    primaryBtn: 'Explore Upcoming Events',
    secondaryBtn: 'Discover ASTECAA',
  };

  featured = {
    eventId: 'astecaa-annual-reunion-2026',
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
    {
      id: 'hero',
      name: 'Hero Banner',
      description:
        'The main opening section introducing ASTECAA and highlighting the alumni community.',
      enabled: true,
    },
    {
      id: 'featured',
      name: 'Featured Event',
      description:
        'Highlights the next major ASTECAA event with event details and registration information.',
      enabled: true,
    },
    {
      id: 'memories',
      name: 'Alumni Memories',
      description:
        'A preview of photographs, school memories, and moments shared by ASTECAA alumni.',
      enabled: true,
    },
    {
      id: 'events',
      name: 'Upcoming Events',
      description:
        'Displays upcoming ASTECAA reunions, networking forums, AGMs, fundraisers, and other programmes.',
      enabled: true,
    },
    {
      id: 'timeline',
      name: 'ASTECAA Timeline',
      description:
        'Highlights important milestones in the history and development of ASTECAA.',
      enabled: true,
    },
    {
      id: 'gallery',
      name: 'Alumni Gallery',
      description:
        'A visual collection of alumni reunions, school memories, events, and ASTECAA activities.',
      enabled: true,
    },
    {
      id: 'community',
      name: 'Alumni Community Wall',
      description:
        'Displays messages, memories, congratulations, and reflections shared by alumni.',
      enabled: true,
    },
    {
      id: 'organizers',
      name: 'ASTECAA Leadership',
      description:
        'Profiles of the association executives, committees, and members helping to drive ASTECAA forward.',
      enabled: true,
    },
    {
      id: 'newsletter',
      name: 'Alumni Updates',
      description:
        'Newsletter subscription for ASTECAA announcements, events, opportunities, and alumni news.',
      enabled: true,
    },
  ]);

  footer = {
    mission:
      'ASTECAA connects alumni across generations, celebrates our shared heritage, supports our school community, and creates opportunities for members to reconnect, contribute, and grow together.',
    copyright:
      '© 2026 ASTECAA · Alumni Association · Reconnecting Generations, Building the Future',
    instagram: '#',
    facebook: '#',
    twitter: '#',
  };

  toggleSection(id: string) {
    this.sections.update((list) =>
      list.map((s) =>
        s.id === id ? { ...s, enabled: !s.enabled } : s
      )
    );
  }

  toggleStory(s: string) {
    this.featured.stories = this.featured.stories.includes(s)
      ? this.featured.stories.filter((x) => x !== s)
      : [...this.featured.stories, s];
  }

  saveAll() {
    this.toast.show('ASTECAA homepage content saved. Changes are now live.');
  }
}
