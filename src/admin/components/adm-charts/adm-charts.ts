import { Component, Input, computed, signal } from '@angular/core';
import { ChartPoint } from '../../admin-data';

@Component({
  selector: 'app-adm-bars',
  standalone: true,
  templateUrl: './adm-bars.html',
})
export class AdmBars {
  @Input({ required: true }) data: ChartPoint[] = [];
  heights = computed(() => {
    const max = Math.max(...this.data.map((d) => d.value), 1);
    const map: Record<string, number> = {};
    for (const d of this.data) map[d.label] = (d.value / max) * 100;
    return map;
  });
}

@Component({
  selector: 'app-adm-donut',
  standalone: true,
  templateUrl: './adm-donut.html',
})
export class AdmDonut {
  @Input() value = 0;
  @Input() label = '';
  circumference = 2 * Math.PI * 64;
  offset = computed(() => this.circumference * (1 - this.value / 100));
}

@Component({
  selector: 'app-adm-line',
  standalone: true,
  templateUrl: './adm-line.html',
})
export class AdmLine {
  @Input({ required: true }) data: ChartPoint[] = [];
  @Input() padding = 8;

  points = computed(() => {
    const max = Math.max(...this.data.map((d) => d.value), 1);
    const min = Math.min(...this.data.map((d) => d.value), 0);
    const range = max - min || 1;
    const w = 600;
    const h = 200;
    const pad = this.padding;
    const innerW = w - pad * 2;
    const innerH = h - pad * 2;
    return this.data.map((d, i) => {
      const x = pad + (i / Math.max(this.data.length - 1, 1)) * innerW;
      const y = pad + (1 - (d.value - min) / range) * innerH;
      return { x, y, label: d.label, value: d.value };
    });
  });

  linePath = computed(() => {
    const pts = this.points();
    return pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  });

  areaPath = computed(() => {
    const pts = this.points();
    if (!pts.length) return '';
    const first = pts[0];
    const last = pts[pts.length - 1];
    const line = pts.map((p) => `L ${p.x} ${p.y}`).join(' ');
    return `M ${first.x} 200 ${line} L ${last.x} 200 Z`;
  });
}
