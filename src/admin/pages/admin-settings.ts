import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../ui-state';

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
  template: `
    <div class="adm-toolbar">
      <div>
        <div class="adm-section-title">Settings</div>
        <div class="adm-section-sub">Configure the website, branding, SEO, and platform-wide options.</div>
      </div>
    </div>

    <div class="adm-tabs">
      <button class="adm-tab" [class.active]="tab() === 'general'" (click)="tab.set('general')">General</button>
      <button class="adm-tab" [class.active]="tab() === 'branding'" (click)="tab.set('branding')">Branding</button>
      <button class="adm-tab" [class.active]="tab() === 'seo'" (click)="tab.set('seo')">SEO</button>
      <button class="adm-tab" [class.active]="tab() === 'nav'" (click)="tab.set('nav')">Navigation</button>
      <button class="adm-tab" [class.active]="tab() === 'legal'" (click)="tab.set('legal')">Legal</button>
      <button class="adm-tab" [class.active]="tab() === 'email'" (click)="tab.set('email')">Email Templates</button>
    </div>

    @if (tab() === 'general') {
      <div class="adm-card adm-card-pad" style="max-width: 680px">
        <div style="display: grid; gap: 16px">
          <div class="adm-field"><label class="adm-field-label">Site Name</label><input class="adm-input" [(ngModel)]="general.siteName" /></div>
          <div class="adm-field"><label class="adm-field-label">Tagline</label><input class="adm-input" [(ngModel)]="general.tagline" /></div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div class="adm-field"><label class="adm-field-label">Contact Email</label><input class="adm-input" [(ngModel)]="general.contactEmail" /></div>
            <div class="adm-field"><label class="adm-field-label">Contact Phone</label><input class="adm-input" [(ngModel)]="general.contactPhone" /></div>
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div class="adm-field"><label class="adm-field-label">Timezone</label><select class="adm-select"><option>America/New_York</option><option>Europe/London</option></select></div>
            <div class="adm-field"><label class="adm-field-label">Language</label><select class="adm-select"><option>English (US)</option></select></div>
          </div>
          @for (opt of generalToggles; track opt.key) {
            <div class="adm-toggle-row">
              <div class="adm-toggle-row-text"><div class="adm-toggle-row-title">{{ opt.title }}</div><div class="adm-toggle-row-desc">{{ opt.desc }}</div></div>
              <label class="adm-switch"><input type="checkbox" [checked]="general[opt.key]" (change)="toggleGeneral(opt.key)" /><span class="adm-switch-slider"></span></label>
            </div>
          }
        </div>
      </div>
    }

    @if (tab() === 'branding') {
      <div class="adm-card adm-card-pad" style="max-width: 680px">
        <div style="display: grid; gap: 16px">
          <div class="adm-field">
            <label class="adm-field-label">Logo</label>
            <div style="display: flex; gap: 16px; align-items: center">
              <div style="width: 60px; height: 60px; display: grid; place-items: center; font-family: var(--font-cinzel); font-weight: 800; font-size: 1.6rem; color: var(--ad-gold); background: radial-gradient(circle at 35% 30%, var(--ad-burgundy), #5a2a2a); border-radius: 50%">E</div>
              <button class="adm-btn adm-btn-outline">Replace logo</button>
            </div>
          </div>
          <div class="adm-field">
            <label class="adm-field-label">Brand Colors</label>
            <div style="display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px">
              @for (c of colors; track c.name) {
                <div style="text-align: center">
                  <div style="width: 100%; aspect-ratio: 1; border-radius: var(--ad-radius-sm); border: 1px solid var(--ad-border); margin-bottom: 6px" [style.background]="c.value"></div>
                  <div class="adm-cell-user-sub" style="font-size: 0.7rem">{{ c.name }}</div>
                </div>
              }
            </div>
          </div>
          <div class="adm-field">
            <label class="adm-field-label">Heading Font</label>
            <select class="adm-select"><option>Playfair Display</option><option>Cormorant Garamond</option><option>Cinzel</option></select>
          </div>
          <div class="adm-field">
            <label class="adm-field-label">Body Font</label>
            <select class="adm-select"><option>Lora</option><option>Libre Baskerville</option></select>
          </div>
        </div>
      </div>
    }

    @if (tab() === 'seo') {
      <div class="adm-card adm-card-pad" style="max-width: 680px">
        <div style="display: grid; gap: 16px">
          <div class="adm-field"><label class="adm-field-label">Meta Title</label><input class="adm-input" [(ngModel)]="seo.title" /><span class="adm-field-hint">{{ seo.title.length }}/60 characters</span></div>
          <div class="adm-field"><label class="adm-field-label">Meta Description</label><textarea class="adm-textarea" [(ngModel)]="seo.description" style="min-height: 80px"></textarea><span class="adm-field-hint">{{ seo.description.length }}/160 characters</span></div>
          <div class="adm-field"><label class="adm-field-label">OG Image</label><div class="adm-dropzone" style="padding: 20px">🖼 Click to upload social share image (1200×630)</div></div>
          <div class="adm-field"><label class="adm-field-label">Keywords</label><input class="adm-input" value="community, archive, heritage, events, maple hollow" /></div>
          <div class="adm-toggle-row"><div class="adm-toggle-row-text"><div class="adm-toggle-row-title">Generate sitemap automatically</div></div><label class="adm-switch"><input type="checkbox" checked /><span class="adm-switch-slider"></span></label></div>
          <div class="adm-toggle-row"><div class="adm-toggle-row-text"><div class="adm-toggle-row-title">Structured data (schema.org)</div></div><label class="adm-switch"><input type="checkbox" checked /><span class="adm-switch-slider"></span></label></div>
        </div>
      </div>
    }

    @if (tab() === 'nav') {
      <div class="adm-card adm-card-pad" style="max-width: 680px">
        <div class="adm-field-label" style="margin-bottom: 12px">Menu Items (drag to reorder)</div>
        <div style="display: flex; flex-direction: column; gap: 8px">
          @for (item of nav; track item.label; let i = $index) {
            <div style="display: flex; gap: 10px; align-items: center; padding: 10px 12px; background: var(--ad-surface-2); border-radius: var(--ad-radius-sm); cursor: grab">
              <span style="color: var(--ad-text-muted)">⋮⋮</span>
              <span style="flex: 1">{{ item.label }}</span>
              <span class="adm-cell-user-sub">{{ item.path }}</span>
              <button class="adm-btn adm-btn-ghost adm-btn-icon">✎</button>
              <button class="adm-btn adm-btn-ghost adm-btn-icon">🗑</button>
            </div>
          }
        </div>
        <button class="adm-btn adm-btn-outline adm-btn-sm" style="margin-top: 12px">+ Add menu item</button>
      </div>
    }

    @if (tab() === 'legal') {
      <div class="adm-card adm-card-pad" style="max-width: 680px">
        <div style="display: grid; gap: 16px">
          <div class="adm-field"><label class="adm-field-label">Privacy Policy</label><textarea class="adm-textarea" style="min-height: 140px" placeholder="Paste your privacy policy…"></textarea></div>
          <div class="adm-field"><label class="adm-field-label">Terms & Conditions</label><textarea class="adm-textarea" style="min-height: 140px" placeholder="Paste your terms…"></textarea></div>
          <div class="adm-field"><label class="adm-field-label">Cookie Notice</label><textarea class="adm-textarea" style="min-height: 80px" placeholder="Cookie usage text…"></textarea></div>
        </div>
      </div>
    }

    @if (tab() === 'email') {
      <div class="adm-card adm-card-pad" style="max-width: 680px">
        <div class="adm-field">
          <label class="adm-field-label">Template</label>
          <select class="adm-select" [(ngModel)]="emailTemplate">
            <option value="welcome">Welcome email</option>
            <option value="newsletter">Newsletter dispatch</option>
            <option value="event">Event reminder</option>
            <option value="registration">Registration confirmation</option>
            <option value="comment">Comment approved</option>
          </select>
        </div>
        <div class="adm-field"><label class="adm-field-label">Subject Line</label><input class="adm-input" [(ngModel)]="emailSubject" /></div>
        <div class="adm-field"><label class="adm-field-label">Body</label><textarea class="adm-textarea" style="min-height: 180px" [(ngModel)]="emailBody"></textarea></div>
        <span class="adm-field-hint">Use {{ '{name}' }}, {{ '{event}' }}, {{ '{date}' }} as placeholders.</span>
      </div>
    }

    <div style="margin-top: 20px; display: flex; gap: 10px; max-width: 680px">
      <button class="adm-btn adm-btn-primary" (click)="save()">Save changes</button>
      <button class="adm-btn adm-btn-outline">Discard</button>
    </div>
  `,
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
