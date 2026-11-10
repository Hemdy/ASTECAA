import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { ToastService } from '@astec/ui';
import { CmsApiService } from '@astec/api-client';
import type { CmsMediaItem } from '@astec/types';
import { prepareMediaUploadPayload } from '../../shared/media-upload.util';

@Component({
  selector: 'app-admin-media',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './admin-media.html',
  styleUrl: './admin-media.css',
})
export class AdminMedia implements OnInit {
  private route = inject(ActivatedRoute);
  private cmsApi = inject(CmsApiService);
  private toast = inject(ToastService);

  items = signal<CmsMediaItem[]>([]);
  loading = signal(false);
  folder = signal('all');
  query = signal('');
  typeFilter = signal('');
  selected = signal<CmsMediaItem | null>(null);

  // Folders state
  folders = signal<string[]>(['General', 'Gallery', 'Reunions', 'Concerts', 'Harvest']);
  newFolderModal = signal(false);
  newFolderName = '';

  // Upload modal state
  uploadModal = signal(false);
  uploading = signal(false);
  uploadFolder = signal('General');
  selectedFiles = signal<File[]>([]);

  filtered = computed(() => {
    const f = this.folder();
    const q = this.query().toLowerCase();
    const t = this.typeFilter();
    return this.items().filter((m) => {
      const mf = f === 'all' || m.folder === f;
      const mq = !q || m.name.toLowerCase().includes(q) || (m.tags && m.tags.some((tag) => tag.toLowerCase().includes(q)));
      const mt = !t || m.type === t || (t === 'image' && m.type?.startsWith('image/')) || (t === 'video' && m.type?.startsWith('video/'));
      return mf && mq && mt;
    });
  });

  totalStorageFormatted = computed(() => {
    const totalMb = this.items().reduce((acc, item) => {
      const match = item.size?.match(/([\d.]+)\s*(MB|KB|GB)/i);
      if (!match) return acc;
      const num = parseFloat(match[1]);
      const unit = match[2].toUpperCase();
      if (unit === 'GB') return acc + num * 1024;
      if (unit === 'KB') return acc + num / 1024;
      return acc + num;
    }, 0);
    if (totalMb > 1024) return `${(totalMb / 1024).toFixed(1)} GB`;
    return `${Math.max(totalMb, 8).toFixed(1)} MB`;
  });

  ngOnInit() {
    void this.loadMedia();
    this.route.queryParams.subscribe((params) => {
      if (params['action'] === 'upload') {
        this.openUpload();
      }
    });
  }

  async loadMedia() {
    this.loading.set(true);
    try {
      const [mediaData, folderData] = await Promise.all([
        this.cmsApi.adminListMedia(),
        this.cmsApi.adminListMediaFolders().catch(() => ['General', 'Gallery', 'Reunions', 'Concerts', 'Harvest']),
      ]);
      this.items.set(mediaData);
      if (folderData && folderData.length > 0) {
        this.folders.set(folderData);
      }
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to load media files');
    } finally {
      this.loading.set(false);
    }
  }

  openNewFolder() {
    this.newFolderName = '';
    this.newFolderModal.set(true);
  }

  async createFolder() {
    const name = this.newFolderName.trim();
    if (!name) {
      this.toast.show('Please provide a folder name.');
      return;
    }
    try {
      await this.cmsApi.adminCreateMediaFolder(name);
      this.toast.show(`Folder "${name}" created.`);
      this.newFolderModal.set(false);
      this.newFolderName = '';
      const updatedFolders = await this.cmsApi.adminListMediaFolders();
      this.folders.set(updatedFolders);
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to create folder');
    }
  }

  async deleteFolder(folderName: string) {
    if (folderName.toLowerCase() === 'general') {
      this.toast.show('Default General folder cannot be deleted.');
      return;
    }
    if (!confirm(`Are you sure you want to delete category "${folderName}"? Any files will be moved to "General".`)) {
      return;
    }
    try {
      await this.cmsApi.adminDeleteMediaFolder(folderName);
      this.toast.show(`Folder "${folderName}" deleted.`);
      if (this.folder() === folderName) {
        this.folder.set('all');
      }
      await this.loadMedia();
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to delete folder');
    }
  }

  countFolder(f: string): number {
    return this.items().filter((m) => m.folder === f).length;
  }

  select(m: CmsMediaItem) {
    this.selected.set(m);
  }

  openUpload() {
    this.selectedFiles.set([]);
    this.uploadFolder.set(this.folder() !== 'all' ? this.folder() : 'General');
    this.uploadModal.set(true);
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedFiles.set(Array.from(input.files));
    }
    input.value = '';
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer?.files) {
      this.selectedFiles.set(Array.from(event.dataTransfer.files));
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  async confirmUpload() {
    const files = this.selectedFiles();
    if (files.length === 0) {
      this.toast.show('Please select at least one file from your computer.');
      return;
    }
    this.uploading.set(true);
    try {
      let count = 0;
      for (const file of files) {
        const prepared = await prepareMediaUploadPayload(file, { allowDocuments: true });
        await this.cmsApi.adminUploadMedia(
          prepared.dataUrl,
          prepared.name,
          prepared.mimeType,
          this.uploadFolder(),
        );
        count++;
      }
      this.toast.show(`${count} file(s) uploaded.`);
      this.uploadModal.set(false);
      this.selectedFiles.set([]);
      await this.loadMedia();
    } catch (err: any) {
      this.toast.show(err.message || 'Upload failed');
    } finally {
      this.uploading.set(false);
    }
  }

  async remove(m: CmsMediaItem) {
    try {
      await this.cmsApi.adminDeleteMedia(m.id);
      this.items.update((list) => list.filter((x) => x.id !== m.id));
      this.selected.set(null);
      this.toast.show('File deleted from database and storage.');
    } catch (err: any) {
      this.toast.show(err.message || 'Delete failed');
    }
  }

  copyUrl(url: string) {
    navigator.clipboard.writeText(url).then(
      () => this.toast.show('URL copied to clipboard!'),
      () => this.toast.show('Failed to copy URL.')
    );
  }
}
