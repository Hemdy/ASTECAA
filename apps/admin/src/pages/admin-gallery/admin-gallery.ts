import { Component, signal, computed, inject, OnInit, DestroyRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdmConfirm } from '../../components/adm-confirm/adm-confirm';
import { ToastService } from '@astec/ui';
import { CmsApiService } from '@astec/api-client';
import type { CmsGalleryItem } from '@astec/types';
import {
  formatFileSize,
  inferMediaMimeType,
  isSupportedMediaFile,
  prepareMediaUploadPayload,
  titleFromFilename,
} from '../../shared/media-upload.util';

export interface BulkUploadEntry {
  id: string;
  file: File;
  title: string;
  isVideo: boolean;
  sizeLabel: string;
  previewUrl: string | null;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

@Component({
  selector: 'app-admin-gallery',
  standalone: true,
  imports: [FormsModule, AdmConfirm],
  templateUrl: './admin-gallery.html',
})
export class AdminGallery implements OnInit {
  private readonly cmsApi = inject(CmsApiService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);

  items = signal<CmsGalleryItem[]>([]);
  loading = signal(false);
  query = signal('');
  albumFilter = signal('');
  typeFilter = signal('');
  featFilter = signal('');
  selected = signal<string[]>([]);
  uploadModal = signal(false);
  bulkModal = signal(false);
  confirmDelete = signal(false);
  uploading = signal(false);
  uploadError = signal<string | null>(null);
  bulkError = signal<string | null>(null);

  // Single Upload Form State
  selectedFile = signal<File | null>(null);
  selectedFilePreview = signal<string | null>(null);
  uploadTitle = signal('');
  uploadCaption = signal('');
  uploadAlbum = signal('Annual Reunions');
  uploadYear = signal(new Date().getFullYear());
  uploadFeatured = signal(false);

  // Bulk Upload State
  bulkEntries = signal<BulkUploadEntry[]>([]);
  bulkAlbum = signal('Annual Reunions');
  bulkYear = signal(new Date().getFullYear());
  bulkFeatured = signal(false);
  bulkProgress = signal<{ current: number; total: number } | null>(null);

  pendingBulkCount = computed(
    () => this.bulkEntries().filter((entry) => entry.status !== 'done').length,
  );

  featuredCount = computed(() => this.items().filter((item) => item.featured).length);

  albums = computed(() => {
    const fromItems = [...new Set(this.items().map((g) => g.album).filter(Boolean))];
    const defaultAlbums = [
      'Annual Reunions',
      'Campus Life',
      'Sports & Culture',
      'Milestones',
      'Voices & History',
    ];
    return [...new Set([...defaultAlbums, ...fromItems])];
  });

  deleteCount = computed(() => (this.confirmDelete() ? this.selected().length : 0));

  totalStorage = computed(() => {
    return this.items().reduce((acc, item) => {
      const match = item.size?.match(/([\d.]+)\s*(MB|KB|GB)/i);
      if (!match) return acc;
      const num = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      if (unit === 'GB') return acc + num * 1024;
      if (unit === 'KB') return acc + num / 1024;
      return acc + num;
    }, 0);
  });

  storageFormatted = computed(() => {
    const mb = this.totalStorage();
    if (mb > 1024) return `${(mb / 1024).toFixed(1)} GB`;
    return `${mb.toFixed(1)} MB`;
  });

  filtered = computed(() => {
    const q = this.query().toLowerCase();
    const a = this.albumFilter();
    const t = this.typeFilter();
    const f = this.featFilter();
    return this.items().filter((item) => {
      const caption = item.caption || item.description || '';
      const kind = item.type || item.mediaType || 'photo';
      const mq =
        !q || item.title.toLowerCase().includes(q) || caption.toLowerCase().includes(q);
      const ma = !a || item.album === a;
      const mt = !t || kind === t;
      const mf = f === '' || (f === 'true' ? item.featured : !item.featured);
      return mq && ma && mt && mf;
    });
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.revokePreview(this.selectedFilePreview());
      this.revokeBulkPreviews(this.bulkEntries());
    });
  }

  ngOnInit() {
    void this.loadGallery();
  }

  async loadGallery() {
    this.loading.set(true);
    try {
      const data = await this.cmsApi.adminListGallery();
      this.items.set(data);
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to load gallery items');
    } finally {
      this.loading.set(false);
    }
  }

  itemType(item: CmsGalleryItem): 'photo' | 'video' {
    return (item.type || item.mediaType) === 'video' ? 'video' : 'photo';
  }

  toggleSelect(id: string) {
    this.selected.update((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  allSelected = computed(() => {
    const list = this.filtered();
    return list.length > 0 && list.every((item) => this.selected().includes(item.id));
  });

  toggleSelectAll(checked: boolean): void {
    if (checked) {
      this.selected.set(this.filtered().map((item) => item.id));
    } else {
      this.selected.set([]);
    }
  }

  async bulkFeature() {
    const sel = this.selected();
    if (sel.length === 0) return;
    try {
      await Promise.all(sel.map((id) => this.cmsApi.updateGalleryItem(id, { featured: true })));
      this.toast.show(`${sel.length} item(s) featured.`);
      this.selected.set([]);
      await this.loadGallery();
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to update items');
    }
  }

  bulkDelete() {
    if (this.selected().length === 0) return;
    this.confirmDelete.set(true);
  }

  async doBulkDelete() {
    const sel = this.selected();
    this.confirmDelete.set(false);
    try {
      await Promise.all(sel.map((id) => this.cmsApi.deleteGalleryItem(id)));
      this.toast.show(`${sel.length} item(s) deleted.`);
      this.selected.set([]);
      await this.loadGallery();
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to delete items');
    }
  }

  openSingleUpload() {
    this.resetUploadForm();
    this.uploadModal.set(true);
  }

  closeSingleUpload() {
    if (this.uploading()) return;
    this.uploadModal.set(false);
    this.resetUploadForm();
  }

  openBulkUpload() {
    this.clearBulkEntries();
    this.bulkProgress.set(null);
    this.bulkError.set(null);
    this.bulkFeatured.set(false);
    this.bulkModal.set(true);
  }

  closeBulkUpload() {
    if (this.uploading()) return;
    this.bulkModal.set(false);
    this.clearBulkEntries();
    this.bulkProgress.set(null);
    this.bulkError.set(null);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.setSingleFile(input.files[0]);
    }
    input.value = '';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.setSingleFile(event.dataTransfer.files[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  private setSingleFile(file: File) {
    if (!isSupportedMediaFile(file)) {
      const msg = `Unsupported file "${file.name}". Choose an image or video file.`;
      this.uploadError.set(msg);
      this.toast.show(msg);
      return;
    }
    this.uploadError.set(null);
    this.revokePreview(this.selectedFilePreview());
    this.selectedFile.set(file);
    if (!this.uploadTitle()) {
      this.uploadTitle.set(titleFromFilename(file.name));
    }
    const mime = inferMediaMimeType(file);
    if (mime.startsWith('image/')) {
      this.selectedFilePreview.set(URL.createObjectURL(file));
    } else {
      this.selectedFilePreview.set(null);
    }
  }

  async confirmUpload() {
    const file = this.selectedFile();
    if (!file) {
      this.toast.show('Please select an image or video file to upload.');
      return;
    }
    this.uploadError.set(null);
    this.uploading.set(true);
    try {
      await this.uploadGalleryEntry(file, {
        title: this.uploadTitle().trim() || titleFromFilename(file.name),
        caption: this.uploadCaption().trim() || null,
        album: this.uploadAlbum() || 'Annual Reunions',
        year: Number(this.uploadYear()) || new Date().getFullYear(),
        featured: this.uploadFeatured(),
      });

      this.toast.show('Media uploaded successfully to gallery.');
      this.uploadModal.set(false);
      this.resetUploadForm();
      await this.loadGallery();
    } catch (err: any) {
      const message = err?.message || 'Upload failed';
      this.uploadError.set(message);
      this.toast.show(message);
    } finally {
      this.uploading.set(false);
    }
  }

  onBulkFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.appendBulkFiles(input.files);
    }
    input.value = '';
  }

  onBulkDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.appendBulkFiles(event.dataTransfer.files);
    }
  }

  private appendBulkFiles(fileList: FileList) {
    const existing = this.bulkEntries();
    const seen = new Set(existing.map((e) => e.id));
    const additions: BulkUploadEntry[] = [];
    let skipped = 0;

    for (const file of Array.from(fileList)) {
      if (!isSupportedMediaFile(file)) {
        skipped++;
        continue;
      }
      const id = `${file.name}:${file.size}:${file.lastModified}`;
      if (seen.has(id)) continue;
      seen.add(id);

      const mime = inferMediaMimeType(file);
      const isVideo = mime.startsWith('video/');
      additions.push({
        id,
        file,
        title: titleFromFilename(file.name),
        isVideo,
        sizeLabel: formatFileSize(file.size),
        previewUrl: !isVideo ? URL.createObjectURL(file) : null,
        status: 'pending',
      });
    }

    if (skipped > 0) {
      this.toast.show(`Skipped ${skipped} unsupported file(s). Only images and videos are supported.`);
    }
    if (additions.length > 0) {
      this.bulkEntries.update((list) => [...list, ...additions]);
    }
  }

  updateBulkTitle(id: string, title: string) {
    this.bulkEntries.update((list) =>
      list.map((entry) => (entry.id === id ? { ...entry, title } : entry)),
    );
  }

  removeBulkEntry(id: string) {
    if (this.uploading()) return;
    const target = this.bulkEntries().find((e) => e.id === id);
    if (target) this.revokePreview(target.previewUrl);
    this.bulkEntries.update((list) => list.filter((e) => e.id !== id));
  }

  clearBulkEntries() {
    if (this.uploading()) return;
    this.revokeBulkPreviews(this.bulkEntries());
    this.bulkEntries.set([]);
  }

  async confirmBulkUpload() {
    const queue = this.bulkEntries().filter((e) => e.status !== 'done');
    if (queue.length === 0) {
      this.toast.show('Please choose at least one image or video file to upload.');
      return;
    }

    this.uploading.set(true);
    this.bulkError.set(null);
    this.bulkProgress.set({ current: 0, total: queue.length });

    let succeeded = 0;
    let failed = 0;
    let firstError = '';

    try {
      for (let i = 0; i < queue.length; i++) {
        const entry = queue[i];
        this.bulkProgress.set({ current: i + 1, total: queue.length });
        this.setBulkEntryStatus(entry.id, 'uploading');

        try {
          await this.uploadGalleryEntry(entry.file, {
            title: entry.title.trim() || titleFromFilename(entry.file.name),
            album: this.bulkAlbum() || 'Annual Reunions',
            year: Number(this.bulkYear()) || new Date().getFullYear(),
            featured: this.bulkFeatured(),
          });
          this.setBulkEntryStatus(entry.id, 'done');
          succeeded++;
        } catch (err: any) {
          const message = err?.message || 'Upload failed';
          if (!firstError) firstError = message;
          this.setBulkEntryStatus(entry.id, 'error', message);
          failed++;
        }
      }

      if (succeeded > 0) {
        await this.loadGallery();
      }

      if (failed === 0) {
        this.toast.show(`${succeeded} file(s) uploaded successfully to gallery.`);
        this.bulkModal.set(false);
        this.clearBulkEntries();
      } else if (succeeded > 0) {
        const msg = `Uploaded ${succeeded} file(s); ${failed} failed (${firstError}). Retry the remaining items.`;
        this.bulkError.set(msg);
        this.toast.show(msg);
      } else {
        const msg = firstError || 'Bulk upload failed.';
        this.bulkError.set(msg);
        this.toast.show(msg);
      }
    } finally {
      this.uploading.set(false);
      this.bulkProgress.set(null);
    }
  }

  private setBulkEntryStatus(
    id: string,
    status: BulkUploadEntry['status'],
    error?: string,
  ) {
    this.bulkEntries.update((list) =>
      list.map((entry) => (entry.id === id ? { ...entry, status, error } : entry)),
    );
  }

  private async uploadGalleryEntry(
    file: File,
    meta: { title: string; caption?: string | null; album: string; year: number; featured: boolean },
  ): Promise<CmsGalleryItem> {
    const prepared = await prepareMediaUploadPayload(file);
    const media = await this.cmsApi.adminUploadMedia(
      prepared.dataUrl,
      prepared.name,
      prepared.mimeType,
      'gallery',
    );
    const isVideo = prepared.mimeType.startsWith('video/');
    const caption = meta.caption?.trim() || null;

    try {
      return await this.cmsApi.createGalleryItem({
        title: meta.title.trim() || titleFromFilename(file.name),
        caption,
        description: caption,
        album: meta.album || 'Annual Reunions',
        year: Number(meta.year) || new Date().getFullYear(),
        type: isVideo ? 'video' : 'photo',
        mediaType: isVideo ? 'video' : 'photo',
        url: media.url,
        thumb: media.url,
        size: media.size || prepared.sizeFormatted,
        featured: meta.featured,
        sortOrder: 0,
      });
    } catch (err) {
      // Avoid orphaned storage objects / media records if gallery metadata insert fails
      await this.cmsApi.adminDeleteMedia(media.id).catch(() => {});
      throw err;
    }
  }

  private resetUploadForm() {
    this.revokePreview(this.selectedFilePreview());
    this.selectedFile.set(null);
    this.selectedFilePreview.set(null);
    this.uploadTitle.set('');
    this.uploadCaption.set('');
    this.uploadFeatured.set(false);
    this.uploadError.set(null);
  }

  private revokePreview(url: string | null) {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }

  private revokeBulkPreviews(entries: BulkUploadEntry[]) {
    for (const entry of entries) {
      this.revokePreview(entry.previewUrl);
    }
  }

  onThumbError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/empty/image-fallback.jpg';
  }
}
