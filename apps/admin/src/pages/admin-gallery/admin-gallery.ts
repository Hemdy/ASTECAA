import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdmConfirm } from '../../components/adm-confirm/adm-confirm';
import { ToastService } from '@astec/ui';
import { CmsApiService } from '@astec/api-client';
import type { CmsGalleryItem } from '@astec/types';

@Component({
  selector: 'app-admin-gallery',
  standalone: true,
  imports: [FormsModule, AdmConfirm],
  templateUrl: './admin-gallery.html',
})
export class AdminGallery implements OnInit {
  private cmsApi = inject(CmsApiService);
  private toast = inject(ToastService);

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

  // Upload Form State
  selectedFile = signal<File | null>(null);
  selectedFilePreview = signal<string | null>(null);
  uploadTitle = signal('');
  uploadCaption = signal('');
  uploadAlbum = signal('Annual Reunions');
  uploadYear = signal(new Date().getFullYear());
  uploadFeatured = signal(false);

  // Bulk Upload State
  bulkFiles = signal<File[]>([]);
  bulkAlbum = signal('Annual Reunions');
  bulkYear = signal(new Date().getFullYear());

  albums = computed(() => {
    const fromItems = [...new Set(this.items().map((g) => g.album).filter(Boolean))];
    const defaultAlbums = ['Annual Reunions', 'Campus Life', 'Sports & Culture', 'Milestones', 'Voices & History'];
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
    return `${Math.max(mb, 12).toFixed(1)} MB`;
  });

  filtered = computed(() => {
    const q = this.query().toLowerCase();
    const a = this.albumFilter();
    const t = this.typeFilter();
    const f = this.featFilter();
    return this.items().filter((item) => {
      const mq = !q || item.title.toLowerCase().includes(q) || (item.caption && item.caption.toLowerCase().includes(q));
      const ma = !a || item.album === a;
      const mt = !t || item.type === t;
      const mf = f === '' || (f === 'true' ? item.featured : !item.featured);
      return mq && ma && mt && mf;
    });
  });

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

  toggleSelect(id: string) {
    this.selected.update((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.setSingleFile(input.files[0]);
    }
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
    this.selectedFile.set(file);
    if (!this.uploadTitle()) {
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      this.uploadTitle.set(nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1));
    }
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => this.selectedFilePreview.set(e.target?.result as string);
      reader.readAsDataURL(file);
    } else {
      this.selectedFilePreview.set(null);
    }
  }

  async confirmUpload() {
    const file = this.selectedFile();
    if (!file) {
      this.toast.show('Please select a file to upload from your computer.');
      return;
    }
    this.uploading.set(true);
    try {
      const base64 = await this.readFileAsDataUrl(file);
      const media = await this.cmsApi.adminUploadMedia(base64, file.name, file.type, 'gallery');

      const isVideo = file.type.startsWith('video');
      await this.cmsApi.createGalleryItem({
        title: this.uploadTitle().trim() || file.name,
        caption: this.uploadCaption().trim() || null,
        album: this.uploadAlbum() || 'General',
        year: Number(this.uploadYear()) || new Date().getFullYear(),
        type: isVideo ? 'video' : 'photo',
        url: media.url,
        thumb: media.url,
        size: media.size || `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
        featured: this.uploadFeatured(),
        sortOrder: 0,
      });

      this.toast.show('Media uploaded successfully to gallery.');
      this.uploadModal.set(false);
      this.resetUploadForm();
      await this.loadGallery();
    } catch (err: any) {
      this.toast.show(err.message || 'Upload failed');
    } finally {
      this.uploading.set(false);
    }
  }

  onBulkFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.bulkFiles.set(Array.from(input.files));
    }
  }

  onBulkDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.bulkFiles.set(Array.from(event.dataTransfer.files));
    }
  }

  async confirmBulkUpload() {
    const files = this.bulkFiles();
    if (files.length === 0) {
      this.toast.show('Please choose files to upload.');
      return;
    }
    this.uploading.set(true);
    try {
      let count = 0;
      for (const file of files) {
        const base64 = await this.readFileAsDataUrl(file);
        const media = await this.cmsApi.adminUploadMedia(base64, file.name, file.type, 'gallery');
        const isVideo = file.type.startsWith('video');
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');

        await this.cmsApi.createGalleryItem({
          title: nameWithoutExt.charAt(0).toUpperCase() + nameWithoutExt.slice(1),
          album: this.bulkAlbum() || 'General',
          year: Number(this.bulkYear()) || new Date().getFullYear(),
          type: isVideo ? 'video' : 'photo',
          url: media.url,
          thumb: media.url,
          size: media.size || `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
          featured: false,
          sortOrder: 0,
        });
        count++;
      }
      this.toast.show(`${count} file(s) uploaded successfully.`);
      this.bulkModal.set(false);
      this.bulkFiles.set([]);
      await this.loadGallery();
    } catch (err: any) {
      this.toast.show(err.message || 'Bulk upload failed');
    } finally {
      this.uploading.set(false);
    }
  }

  private resetUploadForm() {
    this.selectedFile.set(null);
    this.selectedFilePreview.set(null);
    this.uploadTitle.set('');
    this.uploadCaption.set('');
    this.uploadFeatured.set(false);
  }

  private readFileAsDataUrl(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }
}
