import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../ui-state';

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
  template: `
    <div class="adm-toolbar">
      <div>
        <div class="adm-section-title">Homepage Content</div>
        <div class="adm-section-sub">Update every section of the public homepage — no code changes required.</div>
      </div>
      <button class="adm-btn adm-btn-primary" style="margin-left: auto" (click)="saveAll()">Save all changes</button>
    </div>

    <div class="adm-tabs">
      <button class="adm-tab" [class.active]="tab() === 'hero'" (click)="tab.set('hero')">Hero Banner</button>
      <button class="adm-tab" [class.active]="tab() === 'featured'" (click)="tab.set('featured')">Featured Event</button>
      <button class="adm-tab" [class.active]="tab() === 'sections'" (click)="tab.set('sections')">Sections</button>
      <button class="adm-tab" [class.active]="tab() === 'footer'" (click)="tab.set('footer')">Footer</button>
    </div>

    @if (tab() === 'hero') {
      <div class="adm-card adm-card-pad">
        <div style="display: grid; gap: 16px">
          <div class="adm-field">
            <label class="adm-field-label">Headline</label>
            <input class="adm-input" [(ngModel)]="hero.headline" />
          </div>
          <div class="adm-field">
            <label class="adm-field-label">Subheadline</label>
            <input class="adm-input" [(ngModel)]="hero.subheadline" />
          </div>
          <div class="adm-field">
            <label class="adm-field-label">Tagline (small text)</label>
            <input class="adm-input" [(ngModel)]="hero.tagline" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px">
            <div class="adm-field">
              <label class="adm-field-label">Primary Button Text</label>
              <input class="adm-input" [(ngModel)]="hero.primaryBtn" />
            </div>
            <div class="adm-field">
              <label class="adm-field-label">Secondary Button Text</label>
              <input class="adm-input" [(ngModel)]="hero.secondaryBtn" />
            </div>
          </div>
          <div class="adm-field">
            <label class="adm-field-label">Background Image</label>
            <div class="adm-dropzone" style="padding: 24px">
              <div style="font-size: 1.4rem">🖼</div>
              <div style="margin-top: 6px">Current: hero-orchard.jpg · Click to replace</div>
            </div>
          </div>
        </div>
      </div>
    }

    @if (tab() === 'featured') {
      <div class="adm-card adm-card-pad">
        <div style="display: grid; gap: 16px">
          <div class="adm-field">
            <label class="adm-field-label">Featured Event</label>
            <select class="adm-select" [(ngModel)]="featured.eventId">
<option value="worship-concert-2026">Sounds of Worship Concert 2026</option>              <option value="voices-oral-history-2026">Voices: An Oral History Evening</option>
              <option value="winter-carol-night-2026">Winter Carol Night</option>
              <option value="spring-reunion-2027">Spring Alumni Reunion</option>
            </select>
            <span class="adm-field-hint">This event appears in the hero card and the featured section.</span>
          </div>
          <div class="adm-field">
            <label class="adm-field-label">Featured Stories (pick 3)</label>
            <div style="display: flex; flex-direction: column; gap: 8px; padding: 12px; background: var(--ad-surface-2); border-radius: var(--ad-radius-sm)">
              @for (s of storyOptions; track s) {
                <label style="display: flex; align-items: center; gap: 10px; cursor: pointer">
                  <input type="checkbox" class="adm-cb" [checked]="featured.stories.includes(s)" (change)="toggleStory(s)" />
                  <span>{{ s }}</span>
                </label>
              }
            </div>
          </div>
        </div>
      </div>
    }

    @if (tab() === 'sections') {
      <div class="adm-card">
        <div style="display: flex; flex-direction: column">
          @for (s of sections(); track s.id) {
            <div class="adm-toggle-row" style="padding: 16px 20px">
              <div class="adm-toggle-row-text">
                <div class="adm-toggle-row-title">{{ s.name }}</div>
                <div class="adm-toggle-row-desc">{{ s.description }}</div>
              </div>
              <label class="adm-switch">
                <input type="checkbox" [checked]="s.enabled" (change)="toggleSection(s.id)" />
                <span class="adm-switch-slider"></span>
              </label>
            </div>
          }
        </div>
      </div>
      <div class="adm-card adm-card-pad" style="margin-top: 16px">
        <div class="adm-field">
          <label class="adm-field-label">Statistics Displayed</label>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-top: 8px">
            <div class="adm-field" style="margin: 0">
              <input class="adm-input" [(ngModel)]="stats[0].value" placeholder="100+" />
              <span class="adm-field-hint">{{ stats[0].label }}</span>
            </div>
            <div class="adm-field" style="margin: 0">
              <input class="adm-input" [(ngModel)]="stats[1].value" placeholder="4,000+" />
              <span class="adm-field-hint">{{ stats[1].label }}</span>
            </div>
            <div class="adm-field" style="margin: 0">
              <input class="adm-input" [(ngModel)]="stats[2].value" placeholder="38" />
              <span class="adm-field-hint">{{ stats[2].label }}</span>
            </div>
          </div>
        </div>
      </div>
    }

    @if (tab() === 'footer') {
      <div class="adm-card adm-card-pad">
        <div style="display: grid; gap: 16px">
          <div class="adm-field">
            <label class="adm-field-label">Footer Mission Text</label>
            <textarea class="adm-textarea" [(ngModel)]="footer.mission" style="min-height: 80px"></textarea>
          </div>
          <div class="adm-field">
            <label class="adm-field-label">Copyright Line</label>
            <input class="adm-input" [(ngModel)]="footer.copyright" />
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px">
            <div class="adm-field" style="margin: 0"><label class="adm-field-label">Instagram URL</label><input class="adm-input" [(ngModel)]="footer.instagram" /></div>
            <div class="adm-field" style="margin: 0"><label class="adm-field-label">Facebook URL</label><input class="adm-input" [(ngModel)]="footer.facebook" /></div>
            <div class="adm-field" style="margin: 0"><label class="adm-field-label">YouTube URL</label><input class="adm-input" [(ngModel)]="footer.youtube" /></div>
          </div>
        </div>
      </div>
    }
  `,
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
