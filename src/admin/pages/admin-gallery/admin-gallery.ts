import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdmConfirm } from '../../components/adm-confirm/adm-confirm';
import { ADMIN_GALLERY, AdminGalleryItem } from '../../admin-data';
import { ToastService } from '../../../ui-state';

@Component({
  selector: 'app-admin-gallery',
  standalone: true,
  imports: [FormsModule, AdmConfirm],
  templateUrl: './admin-gallery.html',
})
export class AdminGallery {
  private toast = inject(ToastService);
  items = signal<AdminGalleryItem[]>(ADMIN_GALLERY);
  query = signal('');
  albumFilter = signal('');
  typeFilter = signal('');
  featFilter = signal('');
  selected = signal<string[]>([]);
  uploadModal = signal(false);
  bulkModal = signal(false);
  confirmDelete = signal(false);

  albums = [...new Set(ADMIN_GALLERY.map((g) => g.album))];

  deleteCount = computed(() => (this.confirmDelete() ? this.selected().length : 0));

  filtered = computed(() => {
    const q = this.query().toLowerCase();
    const a = this.albumFilter();
    const t = this.typeFilter();
    const f = this.featFilter();
    return this.items().filter((item) => {
      const mq = !q || item.title.toLowerCase().includes(q);
      const ma = !a || item.album === a;
      const mt = !t || item.type === t;
      const mf = f === '' || (f === 'true' ? item.featured : !item.featured);
      return mq && ma && mt && mf;
    });
  });

  toggleSelect(id: string) {
    this.selected.update((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  bulkFeature() {
    const sel = this.selected();
    this.items.update((list) => list.map((i) => (sel.includes(i.id) ? { ...i, featured: true } : i)));
    this.toast.show(`${sel.length} item(s) featured.`);
    this.selected.set([]);
  }

  bulkDelete() {
    if (this.selected().length === 0) return;
    this.confirmDelete.set(true);
  }

  doBulkDelete() {
    const sel = this.selected();
    this.items.update((list) => list.filter((i) => !sel.includes(i.id)));
    this.toast.show(`${sel.length} item(s) deleted.`);
    this.selected.set([]);
    this.confirmDelete.set(false);
  }

  confirmUpload() {
    this.uploadModal.set(false);
    this.bulkModal.set(false);
    this.toast.show('Files uploaded to the gallery.');
  }
}
