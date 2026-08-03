import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../ui-state';

interface GeneralSettings {
  siteName: string;
  tagline: string;
  contactEmail: string;
  contactPhone: string;
  maintenance: boolean;
  registrations: boolean;
  comments: boolean;
  newsletter: boolean;
}

type GeneralToggleKey = 'maintenance' | 'registrations' | 'comments' | 'newsletter';

@Component({
  selector: 'app-admin-settings',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-settings.html',
})
export class AdminSettings {
  private toast = inject(ToastService);
  tab = signal<'general' | 'branding' | 'seo' | 'nav' | 'legal' | 'email'>('general');

  general: GeneralSettings = {
    siteName: 'ASTECAA',
    tagline: 'Where memories live and new stories begin.',
    contactEmail: 'hello@ASTECAA.example',
    contactPhone: '+1 (555) 555-0123',
    maintenance: false,
    registrations: true,
    comments: true,
    newsletter: true,
  };
  generalToggles: { key: GeneralToggleKey; title: string; desc: string }[] = [
    { key: 'maintenance', title: 'Maintenance mode', desc: 'Show a holding page to visitors while you make changes.' },
    { key: 'registrations', title: 'Allow new registrations', desc: 'Let visitors create accounts on the website.' },
    { key: 'comments', title: 'Allow community comments', desc: 'Accept new messages on the community wall.' },
    { key: 'newsletter', title: 'Newsletter signup', desc: 'Show the dispatch subscription form in the footer.' },
  ];

  colors = [
    { name: 'Background', value: '#F8F3E8' },
    { name: 'Paper', value: '#E8DDC5' },
    { name: 'Brown', value: '#5C4033' },
    { name: 'Gold', value: '#C49A45' },
    { name: 'Forest', value: '#5B6D5B' },
    { name: 'Burgundy', value: '#7A3E3E' },
  ];

  seo = { title: 'ASTECAA — Where memories live and new stories begin', description: 'A living digital archive where communities celebrate their heritage while building excitement for what\'s next.' };

  nav = [
    { label: 'Home', path: '/' },
    { label: 'About', path: '/about' },
    { label: 'Events', path: '/events' },
    { label: 'Timeline', path: '/timeline' },
    { label: 'Gallery', path: '/gallery' },
    { label: 'Community', path: '/community' },
    { label: 'Contact', path: '/contact' },
  ];

  emailTemplate = 'welcome';
  emailSubject = 'Welcome to ASTECAA, {name}';
  emailBody = 'Dear {name},\n\nWelcome to the ASTECAA community archive. We are glad to have you.\n\nEvery month we send a quiet note — upcoming gatherings, a newly digitised memory, and a story from the community.\n\nWith warmth,\nThe ASTECAA Stewards';

  save() {
    this.toast.show('Settings saved.');
  }

  toggleGeneral(key: GeneralToggleKey) {
    this.general[key] = !this.general[key];
  }
}
