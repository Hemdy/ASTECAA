import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../reveal.directive';
import { CmsApiService } from '@astec/api-client';
import type { CmsTimelineMilestone } from '@astec/types';

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [RouterLink, RevealDirective],
  templateUrl: './timeline.html',
  styleUrl: './timeline.css',
})
export class Timeline implements OnInit {
  private cmsApi = inject(CmsApiService);

  all = signal<CmsTimelineMilestone[]>([]);
  loading = signal(false);
  era = signal('');

  eras = [
    { label: '1993–2003', from: 1993, to: 2003 },
    { label: '2004–2014', from: 2004, to: 2014 },
    { label: '2015–2026', from: 2015, to: 2026 },
  ];

  filtered = signal<CmsTimelineMilestone[]>([]);

  ngOnInit() {
    void this.loadTimeline();
  }

  async loadTimeline() {
    this.loading.set(true);
    try {
      const data = await this.cmsApi.getTimeline();
      this.all.set(data);
      this.applyFilter();
    } catch {
      this.all.set([]);
      this.filtered.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  eraActive(e: { from: number; to: number }): boolean {
    const current = this.eras.find((x) => x.label === this.era());
    return current === e;
  }

  setEra(label: string) {
    this.era.set(label);
    this.applyFilter();
  }

  private applyFilter() {
    const label = this.era();
    const items = this.all();
    if (!label) {
      this.filtered.set(items);
      return;
    }
    const e = this.eras.find((x) => x.label === label);
    if (e) {
      this.filtered.set(items.filter((m) => m.year >= e.from && m.year <= e.to));
    }
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/empty/image-fallback.jpg';
  }
}
