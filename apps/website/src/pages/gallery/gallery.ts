import { Component, computed, signal, inject, OnInit, OnDestroy, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RevealDirective } from '../../reveal.directive';
import { CustomSelect, SelectOption } from '../../components/custom-select/custom-select';
import { CmsApiService } from '@astec/api-client';
import type { CmsGalleryItem } from '@astec/types';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [FormsModule, RevealDirective, CustomSelect],
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
})
export class Gallery implements OnInit, OnDestroy {
  private cmsApi = inject(CmsApiService);

  memories = signal<CmsGalleryItem[]>([]);
  loading = signal(false);
  style = signal<'scrapbook' | 'polaroid'>('scrapbook');
  album = signal('');
  year = signal<number | ''>('');

  lightboxItem = signal<CmsGalleryItem | null>(null);

  albums = computed(() => [...new Set(this.memories().map((m) => m.album).filter(Boolean))]);
  years = computed(() => [...new Set(this.memories().map((m) => m.year))].sort((a, b) => b - a));

  albumOptions = computed<SelectOption[]>(() => [
    { label: 'All albums', value: '', icon: 'ri-gallery-line' },
    ...this.albums().map((a) => ({ label: a, value: a })),
  ]);

  yearOptions = computed<SelectOption[]>(() => [
    { label: 'All years', value: '', icon: 'ri-calendar-line' },
    ...this.years().map((y) => ({ label: String(y), value: y })),
  ]);

  filtered = computed(() => {
    const a = this.album();
    const y = this.year();
    return this.memories().filter((m) => {
      const matchAlbum = !a || m.album === a;
      const matchYear = y === '' || m.year === y;
      return matchAlbum && matchYear;
    });
  });

  lightboxIndex = computed(() => {
    const current = this.lightboxItem();
    if (!current) return -1;
    return this.filtered().findIndex((m) => m.id === current.id);
  });

  rotations = [-3, 2, -1.5, 3, -2.5, 1.8, -2, 2.5, -1, 2.2, -2.8, 1.4];
  rot(i: number) {
    return this.rotations[i % this.rotations.length];
  }

  ngOnInit() {
    void this.loadGallery();
  }

  ngOnDestroy() {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
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

  openLightbox(item: CmsGalleryItem, event?: Event): void {
    if (event) event.stopPropagation();
    this.lightboxItem.set(item);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  closeLightbox(): void {
    this.lightboxItem.set(null);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  prevLightbox(event?: Event): void {
    if (event) event.stopPropagation();
    const list = this.filtered();
    if (list.length <= 1) return;
    const idx = this.lightboxIndex();
    const newIdx = (idx - 1 + list.length) % list.length;
    this.lightboxItem.set(list[newIdx]);
  }

  nextLightbox(event?: Event): void {
    if (event) event.stopPropagation();
    const list = this.filtered();
    if (list.length <= 1) return;
    const idx = this.lightboxIndex();
    const newIdx = (idx + 1) % list.length;
    this.lightboxItem.set(list[newIdx]);
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (!this.lightboxItem()) return;
    if (event.key === 'Escape') {
      this.closeLightbox();
    } else if (event.key === 'ArrowLeft') {
      this.prevLightbox();
    } else if (event.key === 'ArrowRight') {
      this.nextLightbox();
    }
  }

  clear() {
    this.album.set('');
    this.year.set('');
  }

  onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/empty/image-fallback.jpg';
  }
}
