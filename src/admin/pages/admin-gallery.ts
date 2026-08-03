import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdmConfirm } from '../components/adm-confirm';
import { ADMIN_GALLERY, AdminGalleryItem } from '../admin-data';
import { ToastService } from '../../ui-state';

@Component({
  selector: 'app-admin-gallery',
  standalone: true,
  imports: [FormsModule, AdmConfirm],
  template: `
    <div class="adm-toolbar">
      <div>
        <div class="adm-section-title">Gallery Management</div>
        <div class="adm-section-sub">Upload, organize, and feature photographs and videos from community gatherings.</div>
      </div>
      <div style="margin-left: auto; display: flex; gap: 10px">
        <button class="adm-btn adm-btn-outline" (click)="bulkModal.set(true)">Bulk Upload</button>
        <button class="adm-btn adm-btn-primary" (click)="uploadModal.set(true)">+ Upload Media</button>
      </div>
    </div>

    <!-- Storage + filters -->
    <div class="adm-grid-3" style="margin-bottom: 20px">
      <div class="adm-card adm-card-pad">
        <div class="adm-stat-label">Storage Used</div>
        <div class="adm-stat-value">4.8 GB</div>
        <div class="adm-progress" style="margin-top: 10px"><div class="adm-progress-bar" style="width: 48%"></div></div>
        <div class="adm-card-sub" style="margin-top: 6px">48% of 10 GB</div>
      </div>
      <div class="adm-card adm-card-pad">
        <div class="adm-stat-label">Total Media</div>
        <div class="adm-stat-value">312</div>
        <div class="adm-card-sub" style="margin-top: 6px">284 photos · 28 videos</div>
      </div>
      <div class="adm-card adm-card-pad">
        <div class="adm-stat-label">Featured</div>
        <div class="adm-stat-value">24</div>
        <div class="adm-card-sub" style="margin-top: 6px">Shown on homepage & gallery</div>
      </div>
    </div>

    <div class="adm-card adm-card-pad" style="margin-bottom: 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end">
      <div class="adm-field" style="margin: 0; flex: 1; min-width: 200px">
        <label class="adm-field-label">Search</label>
        <input class="adm-input" [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Search by title…" />
      </div>
      <div class="adm-field" style="margin: 0; min-width: 150px">
        <label class="adm-field-label">Album</label>
        <select class="adm-select" [ngModel]="albumFilter()" (ngModelChange)="albumFilter.set($event)">
          <option value="">All albums</option>
          @for (a of albums; track a) { <option [value]="a">{{ a }}</option> }
        </select>
      </div>
      <div class="adm-field" style="margin: 0; min-width: 120px">
        <label class="adm-field-label">Type</label>
        <select class="adm-select" [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event)">
          <option value="">All</option>
          <option value="photo">Photos</option>
          <option value="video">Videos</option>
        </select>
      </div>
      <div class="adm-field" style="margin: 0; min-width: 120px">
        <label class="adm-field-label">Featured</label>
        <select class="adm-select" [ngModel]="featFilter()" (ngModelChange)="featFilter.set($event)">
          <option value="">All</option>
          <option value="true">Featured</option>
          <option value="false">Not featured</option>
        </select>
      </div>
      @if (selected().length > 0) {
        <div style="display: flex; gap: 8px; align-items: center">
          <span class="adm-badge adm-badge-info">{{ selected().length }} selected</span>
          <button class="adm-btn adm-btn-outline adm-btn-sm" (click)="bulkFeature()">★ Feature</button>
          <button class="adm-btn adm-btn-danger adm-btn-sm" (click)="bulkDelete()">Delete</button>
        </div>
      }
    </div>

    <!-- Gallery grid -->
    <div class="adm-card adm-card-pad">
      @if (filtered().length === 0) {
        <div class="adm-empty">
          <div class="adm-empty-ico">🖼</div>
          <p>No media matches your filters.</p>
        </div>
      } @else {
        <div class="adm-gallery-grid">
          @for (item of filtered(); track item.id) {
            <div class="adm-gallery-item" (click)="toggleSelect(item.id)">
              @if (item.type === 'video') {
                <span class="adm-badge adm-badge-info" style="position: absolute; top: 8px; right: 8px; z-index: 2">▶ Video</span>
              }
              <input type="checkbox" class="adm-cb adm-gallery-check" [checked]="selected().includes(item.id)" (click)="$event.stopPropagation(); toggleSelect(item.id)" />
              <img [src]="item.thumb" [alt]="item.title" />
              <div class="adm-gallery-item-overlay">
                <span class="adm-badge adm-badge-gold">{{ item.album }} · {{ item.year }}</span>
              </div>
            </div>
          }
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 16px">
          <span class="adm-card-sub">{{ filtered().length }} items</span>
          <div class="adm-pagination">
            <button class="adm-page-btn" [disabled]="true">‹</button>
            <button class="adm-page-btn active">1</button>
            <button class="adm-page-btn">2</button>
            <button class="adm-page-btn">›</button>
          </div>
        </div>
      }
    </div>

    @if (uploadModal()) {
      <div class="adm-modal-backdrop" (click)="uploadModal.set(false)">
        <div class="adm-modal" (click)="$event.stopPropagation()">
          <div class="adm-modal-head">
            <h3 class="adm-modal-title">Upload Media</h3>
            <button class="adm-btn adm-btn-ghost adm-btn-icon" (click)="uploadModal.set(false)">✕</button>
          </div>
          <div class="adm-modal-body">
            <div class="adm-dropzone">
              <div class="adm-dropzone-ico">📤</div>
              <div><strong>Drag & drop files here</strong></div>
              <div style="font-size: 0.8rem; margin-top: 4px">or click to browse — JPG, PNG, MP4 up to 50MB</div>
            </div>
            <div style="margin-top: 16px">
              <div class="adm-field">
                <label class="adm-field-label">Album</label>
                <select class="adm-select">
                  @for (a of albums; track a) { <option [value]="a">{{ a }}</option> }
                </select>
              </div>
              <div class="adm-field">
                <label class="adm-field-label">Year</label>
                <input class="adm-input" type="number" placeholder="e.g. 2026" />
              </div>
              <div class="adm-toggle-row" style="border: none; padding: 0">
                <div class="adm-toggle-row-text">
                  <div class="adm-toggle-row-title">Feature after upload</div>
                </div>
                <label class="adm-switch"><input type="checkbox" /><span class="adm-switch-slider"></span></label>
              </div>
            </div>
          </div>
          <div class="adm-modal-foot">
            <button class="adm-btn adm-btn-outline" (click)="uploadModal.set(false)">Cancel</button>
            <button class="adm-btn adm-btn-primary" (click)="confirmUpload()">Upload</button>
          </div>
        </div>
      </div>
    }

    @if (bulkModal()) {
      <div class="adm-modal-backdrop" (click)="bulkModal.set(false)">
        <div class="adm-modal adm-modal-lg" (click)="$event.stopPropagation()">
          <div class="adm-modal-head">
            <h3 class="adm-modal-title">Bulk Upload</h3>
            <button class="adm-btn adm-btn-ghost adm-btn-icon" (click)="bulkModal.set(false)">✕</button>
          </div>
          <div class="adm-modal-body">
            <div class="adm-dropzone" style="min-height: 160px">
              <div class="adm-dropzone-ico">📦</div>
              <div><strong>Drop multiple files to upload at once</strong></div>
              <div style="font-size: 0.8rem; margin-top: 4px">All files will be assigned to the album and year you choose below.</div>
            </div>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 16px">
              <div class="adm-field"><label class="adm-field-label">Album</label><select class="adm-select">@for (a of albums; track a) {<option>{{ a }}</option>}</select></div>
              <div class="adm-field"><label class="adm-field-label">Year</label><input class="adm-input" type="number" placeholder="2026" /></div>
            </div>
          </div>
          <div class="adm-modal-foot">
            <button class="adm-btn adm-btn-outline" (click)="bulkModal.set(false)">Cancel</button>
            <button class="adm-btn adm-btn-primary" (click)="confirmUpload()">Upload all</button>
          </div>
        </div>
      </div>
    }

    @if (confirmDelete()) {
      <app-adm-confirm
        [message]="deleteCount() + ' item(s) will be permanently deleted.'"
        confirmLabel="Delete"
        (confirm)="doBulkDelete()"
        (cancel)="confirmDelete.set(false)"
      ></app-adm-confirm>
    }
  `,
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
