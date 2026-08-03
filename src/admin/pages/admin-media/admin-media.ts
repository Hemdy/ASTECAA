import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../ui-state';

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
  templateUrl: './admin-media.html',
  styleUrl: './admin-media.css',
})
export class AdminMedia {
  private toast = inject(ToastService);
  items = signal<MediaItem[]>([
    { id: 'me1', name: 'harvest-table-1988.jpg', type: 'image', size: '2.4 MB', folder: 'Harvest', url: '/images/harvest-table.jpg', tags: ['harvest', '1988'], date: '2026-06-12' },
    { id: 'me2', name: 'choir-snow-2026.jpg', type: 'image', size: '1.8 MB', folder: 'Carols', url: '/images/concert.jpg', tags: ['choir', 'winter'], date: '2026-06-12' },
    { id: 'me3', name: 'fiddle-circle.mp4', type: 'video', size: '48.2 MB', folder: 'Harvest', url: '/images/fiddle-circle.jpg', tags: ['fiddle', 'music'], date: '2026-06-15' },
    { id: 'me4', name: 'grandmother-hands.jpg', type: 'image', size: '2.0 MB', folder: 'Voices', url: '/images/voices-oral-history.jpg', tags: ['voices', 'portrait'], date: '2026-06-18' },
    { id: 'me5', name: 'old-gym-1982.jpg', type: 'image', size: '1.6 MB', folder: 'Reunions', url: '/images/reunion.jpg', tags: ['school', '1982'], date: '2026-06-20' },
    { id: 'me6', name: 'lantern-procession.mp4', type: 'video', size: '32.6 MB', folder: 'Harvest', url: '/images/lantern-procession.jpg', tags: ['lanterns', 'night'], date: '2026-06-22' },
    { id: 'me7', name: 'market-stalls.jpg', type: 'image', size: '2.7 MB', folder: 'Harvest', url: '/images/market-stalls.jpg', tags: ['market'], date: '2026-06-25' },
    { id: 'me8', name: 'class-of-64.jpg', type: 'image', size: '1.9 MB', folder: 'Reunions', url: '/images/ASTECAA.jpg', tags: ['class', '1964'], date: '2026-07-01' },
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

