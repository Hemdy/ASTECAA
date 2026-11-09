import { Component, computed, signal, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RevealDirective } from '../../reveal.directive';
import { CmsApiService } from '@astec/api-client';
import type { CmsGalleryItem } from '@astec/types';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [FormsModule, RevealDirective],
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
})
export class Gallery implements OnInit {
  private cmsApi = inject(CmsApiService);

  memories = signal<CmsGalleryItem[]>([]);
  loading = signal(false);
  style = signal<'scrapbook' | 'polaroid'>('scrapbook');
  album = signal('');
  year = signal<number | ''>('');

  albums = computed(() => [...new Set(this.memories().map((m) => m.album).filter(Boolean))]);
  years = computed(() => [...new Set(this.memories().map((m) => m.year))].sort((a, b) => b - a));

  filtered = computed(() => {
    const a = this.album();
    const y = this.year();
    return this.memories().filter((m) => {
      const matchAlbum = !a || m.album === a;
      const matchYear = y === '' || m.year === y;
      return matchAlbum && matchYear;
    });
  });

  rotations = [-3, 2, -1.5, 3, -2.5, 1.8, -2, 2.5, -1, 2.2, -2.8, 1.4];
  rot(i: number) {
    return this.rotations[i % this.rotations.length];
  }

  ngOnInit() {
    void this.loadGallery();
  }

  async loadGallery() {
    this.loading.set(true);
    try {
      const list = await this.cmsApi.getGallery();
      this.memories.set(list);
    } catch {
      this.memories.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  clear() {
    this.album.set('');
    this.year.set('');
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'images/empty/image-fallback.jpg';
  }
}
