import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '@astec/ui';
import { CmsApiService } from '@astec/api-client';
import type { CmsHomepageSettings } from '@astec/types';
import { NAV_ITEMS } from '../../data';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer implements OnInit {
  private cmsApi = inject(CmsApiService);
  private toast = inject(ToastService);

  homepage = signal<CmsHomepageSettings | null>(null);

  mission = computed(
    () =>
      this.homepage()?.footer?.mission ||
      'A living digital archive where communities celebrate their heritage while building excitement for what\'s next.',
  );

  copyright = computed(
    () =>
      this.homepage()?.footer?.copyright ||
      '© 2026 ASTECAA Community Archive · A non-profit preservation project',
  );

  socials = computed(() => {
    const f = this.homepage()?.footer;
    return [
      {
        name: 'Facebook',
        icon: 'icons/facebook.png',
        url: f?.facebook && f.facebook !== '#' ? f.facebook : 'https://www.facebook.com/groups/111173245611375/',
      },
      {
        name: 'Instagram',
        icon: 'icons/instagram.png',
        url: f?.instagram && f.instagram !== '#' ? f.instagram : 'https://www.instagram.com/astec_alumni?igsh=MWc5ZWRqOGJlc2lyZg==',
      },
      {
        name: 'Twitter',
        icon: 'icons/twitter.png',
        url: f?.twitter && f.twitter !== '#' ? f.twitter : 'https://x.com/astecaa',
      },
    ];
  });

  items = NAV_ITEMS;
  email = '';
  name = '';

  async ngOnInit() {
    try {
      const data = await this.cmsApi.getHomepage();
      if (data) {
        this.homepage.set(data);
      }
    } catch {
      // use default values
    }
  }

  subscribe() {
    if (!this.email) return;
    this.toast.show(`Welcome to the dispatch. We will write to ${this.email}.`);
    this.email = '';
    this.name = '';
  }
}
