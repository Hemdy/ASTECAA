import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../ui-state';

interface MediaItem {
  id: string;
  name: string;
  type: 'image' | 'video';
  size: string;
  folder: string;
  url: string;
  tags: string[];
  date: string;
}

@Component({
  selector: 'app-admin-media',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="adm-toolbar">
      <div>
        <div class="adm-section-title">Media Library</div>
        <div class="adm-section-sub">Centralized management of all images, videos, and files across the platform.</div>
      </div>
      <button class="adm-btn adm-btn-primary" style="margin-left: auto" (click)="upload()">+ Upload File</button>
    </div>

    <div style="display: grid; grid-template-columns: 240px 1fr; gap: 20px; align-items: flex-start">
      <!-- Folders sidebar -->
      <div class="adm-card adm-card-pad">
        <div class="adm-field-label" style="margin-bottom: 10px">Folders</div>
        <div style="display: flex; flex-direction: column; gap: 2px">
          <button class="folder-btn" [class.active]="folder() === 'all'" (click)="folder.set('all')">
            <span>🗂</span> All files <span class="adm-cell-user-sub" style="margin-left: auto">{{ items().length }}</span>
          </button>
          @for (f of folders; track f) {
            <button class="folder-btn" [class.active]="folder() === f" (click)="folder.set(f)">
              <span>📁</span> {{ f }} <span class="adm-cell-user-sub" style="margin-left: auto">{{ countFolder(f) }}</span>
            </button>
          }
        </div>
        <div style="margin-top: 20px; padding-top: 16px; border-top: 1px solid var(--ad-border)">
          <div class="adm-field-label" style="margin-bottom: 8px">Storage</div>
          <div class="adm-progress"><div class="adm-progress-bar" style="width: 48%"></div></div>
          <div class="adm-cell-user-sub" style="margin-top: 6px">4.8 GB of 10 GB used</div>
        </div>
      </div>

      <!-- Media grid -->
      <div class="adm-card">
        <div class="adm-card-pad" style="display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end; border-bottom: 1px solid var(--ad-border)">
          <div class="adm-search" style="flex: 1; width: auto; max-width: none">
            <span class="adm-search-ico">⌕</span>
            <input type="search" [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Search media by name or tag…" />
          </div>
          <select class="adm-select" style="width: auto" [ngModel]="typeFilter()" (ngModelChange)="typeFilter.set($event)">
            <option value="">All types</option>
            <option value="image">Images</option>
            <option value="video">Videos</option>
          </select>
        </div>
        <div class="adm-card-pad">
          @if (filtered().length === 0) {
            <div class="adm-empty"><div class="adm-empty-ico">🗂</div><p>No files found.</p></div>
          } @else {
            <div class="adm-gallery-grid">
              @for (m of filtered(); track m.id) {
                <div class="adm-gallery-item" (click)="select(m)">
                  @if (m.type === 'video') {
                    <span class="adm-badge adm-badge-info" style="position: absolute; top: 8px; right: 8px; z-index: 2">▶</span>
                  }
                  <img [src]="m.url" [alt]="m.name" />
                  <div class="adm-gallery-item-overlay">
                    <span class="adm-badge adm-badge-muted" style="font-size: 0.62rem">{{ m.size }}</span>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>

    @if (selected(); as m) {
      <div class="adm-modal-backdrop" (click)="selected.set(null)">
        <div class="adm-modal" (click)="$event.stopPropagation()">
          <div class="adm-modal-head">
            <h3 class="adm-modal-title">{{ m.name }}</h3>
            <button class="adm-btn adm-btn-ghost adm-btn-icon" (click)="selected.set(null)">✕</button>
          </div>
          <div class="adm-modal-body">
            <img [src]="m.url" [alt]="m.name" style="width: 100%; border-radius: var(--ad-radius-sm); margin-bottom: 16px" />
            <div class="adm-grid-2" style="gap: 12px">
              <div><span class="adm-field-label">Type</span><div>{{ m.type }}</div></div>
              <div><span class="adm-field-label">Size</span><div>{{ m.size }}</div></div>
              <div><span class="adm-field-label">Folder</span><div>{{ m.folder }}</div></div>
              <div><span class="adm-field-label">Uploaded</span><div>{{ m.date }}</div></div>
            </div>
            <div style="margin-top: 14px">
              <span class="adm-field-label">Tags</span>
              <div style="display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px">
                @for (t of m.tags; track t) { <span class="adm-badge adm-badge-muted">{{ t }}</span> }
              </div>
            </div>
          </div>
          <div class="adm-modal-foot">
            <button class="adm-btn adm-btn-ghost" (click)="remove(m)">🗑 Delete</button>
            <button class="adm-btn adm-btn-outline">Copy URL</button>
            <button class="adm-btn adm-btn-primary">Insert into page</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [
    `
      .folder-btn {
        display: flex;
        align-items: center;
        gap: 8px;
        padding: 8px 10px;
        border-radius: var(--ad-radius-sm);
        color: var(--ad-text-soft);
        font-size: 0.86rem;
        text-align: left;
        cursor: pointer;
        transition: all var(--ad-transition);
        width: 100%;
      }
      .folder-btn:hover {
        background: var(--ad-surface-2);
        color: var(--ad-text);
      }
      .folder-btn.active {
        background: var(--ad-primary-soft);
        color: var(--ad-primary);
        font-weight: 600;
      }
      @media (max-width: 768px) {
        :host > div[style*='grid-template-columns: 240px'] {
          grid-template-columns: 1fr !important;
        }
      }
    `,
  ],
})
export class AdminMedia {
  private toast = inject(ToastService);
  items = signal<MediaItem[]>([
    { id: 'me1', name: 'harvest-table-1988.jpg', type: 'image', size: '2.4 MB', folder: 'Harvest', url: 'https://images.pexels.com/photos/1029599/pexels-photo-1029599.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', tags: ['harvest', '1988'], date: '2026-06-12' },
    { id: 'me2', name: 'choir-snow-2026.jpg', type: 'image', size: '1.8 MB', folder: 'Carols', url: 'https://images.pexels.com/photos/260223/pexels-photo-260223.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', tags: ['choir', 'winter'], date: '2026-06-12' },
    { id: 'me3', name: 'fiddle-circle.mp4', type: 'video', size: '48.2 MB', folder: 'Harvest', url: 'https://images.pexels.com/photos/3184460/pexels-photo-3184460.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', tags: ['fiddle', 'music'], date: '2026-06-15' },
    { id: 'me4', name: 'grandmother-hands.jpg', type: 'image', size: '2.0 MB', folder: 'Voices', url: 'https://images.pexels.com/photos/6963617/pexels-photo-6963617.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', tags: ['voices', 'portrait'], date: '2026-06-18' },
    { id: 'me5', name: 'old-gym-1982.jpg', type: 'image', size: '1.6 MB', folder: 'Reunions', url: 'https://images.pexels.com/photos/207662/pexels-photo-207662.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', tags: ['school', '1982'], date: '2026-06-20' },
    { id: 'me6', name: 'lantern-procession.mp4', type: 'video', size: '32.6 MB', folder: 'Harvest', url: 'https://images.pexels.com/photos/2387866/pexels-photo-2387866.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', tags: ['lanterns', 'night'], date: '2026-06-22' },
    { id: 'me7', name: 'market-stalls.jpg', type: 'image', size: '2.7 MB', folder: 'Harvest', url: 'https://images.pexels.com/photos/1595104/pexels-photo-1595104.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', tags: ['market'], date: '2026-06-25' },
    { id: 'me8', name: 'class-of-64.jpg', type: 'image', size: '1.9 MB', folder: 'Reunions', url: 'https://images.pexels.com/photos/15970572/pexels-photo-15970572.jpeg?auto=compress&cs=tinysrgb&w=300&h=300&fit=crop', tags: ['class', '1964'], date: '2026-07-01' },
  ]);
  folder = signal('all');
  query = signal('');
  typeFilter = signal('');
  selected = signal<MediaItem | null>(null);

  folders = ['Harvest', 'Carols', 'Voices', 'Reunions'];

  filtered = computed(() => {
    const f = this.folder();
    const q = this.query().toLowerCase();
    const t = this.typeFilter();
    return this.items().filter((m) => {
      const mf = f === 'all' || m.folder === f;
      const mq = !q || m.name.toLowerCase().includes(q) || m.tags.some((t) => t.toLowerCase().includes(q));
      const mt = !t || m.type === t;
      return mf && mq && mt;
    });
  });

  countFolder(f: string): number {
    return this.items().filter((m) => m.folder === f).length;
  }

  select(m: MediaItem) {
    this.selected.set(m);
  }

  upload() {
    this.toast.show('File upload started.');
  }

  remove(m: MediaItem) {
    this.items.update((list) => list.filter((x) => x.id !== m.id));
    this.selected.set(null);
    this.toast.show('File deleted.');
  }
}
