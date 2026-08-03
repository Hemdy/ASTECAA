import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RevealDirective } from '../../reveal.directive';
import { MEMORIES } from '../../data';

@Component({
  selector: 'app-gallery',
  standalone: true,
  imports: [FormsModule, RevealDirective],
  templateUrl: './gallery.html',
  styleUrl: './gallery.css',
})
export class Gallery {
  all = MEMORIES;
  style = signal<'scrapbook' | 'filmstrip' | 'polaroid'>('scrapbook');
  album = signal('');
  year = signal<number | ''>('');

  albums = [...new Set(MEMORIES.map((m) => m.album))];
  years = [...new Set(MEMORIES.map((m) => m.year))].sort((a, b) => b - a);

  filtered = computed(() => {
    const a = this.album();
    const y = this.year();
    return this.all.filter((m) => {
      const matchAlbum = !a || m.album === a;
      const matchYear = y === '' || m.year === y;
      return matchAlbum && matchYear;
    });
  });

  rotations = [-3, 2, -1.5, 3, -2.5, 1.8, -2, 2.5, -1, 2.2, -2.8, 1.4];
  rot(i: number) {
    return this.rotations[i % this.rotations.length];
  }

  clear() {
    this.album.set('');
    this.year.set('');
  }
}
