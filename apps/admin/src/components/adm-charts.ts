import { Component, Input, computed, signal } from '@angular/core';
import { ChartPoint } from '../admin-data';

@Component({
  selector: 'app-adm-bars',
  standalone: true,
  template: `
    <div class="adm-chart-bars">
      @for (p of data; track p.label) {
        <div class="adm-chart-bar-col">
          <div
            class="adm-chart-bar"
            [style.height.%]="heights()[p.label]"
            [title]="p.label + ': ' + p.value"
          ></div>
          <span class="adm-chart-bar-label">{{ p.label }}</span>
        </div>
      }
    </div>
  `,
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
  template: `
    <div class="adm-chart-donut">
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="64" fill="none" stroke="var(--ad-surface-3)" stroke-width="18" />
        <circle
          cx="80"
          cy="80"
          r="64"
          fill="none"
          stroke="var(--ad-forest)"
          stroke-width="18"
          stroke-linecap="round"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="offset()"
        />
      </svg>
      <div class="adm-chart-donut-center">
        <div>
          <div class="adm-chart-donut-num">{{ value }}%</div>
          <div class="adm-chart-donut-lbl">{{ label }}</div>
        </div>
      </div>
    </div>
  `,
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
  template: `
    <svg class="adm-chart-line" viewBox="0 0 600 200" preserveAspectRatio="none">
      <defs>
        <linearGradient id="admLineFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--ad-gold)" stop-opacity="0.3" />
          <stop offset="100%" stop-color="var(--ad-gold)" stop-opacity="0" />
        </linearGradient>
      </defs>
      <path [attr.d]="areaPath()" fill="url(#admLineFill)" />
      <path [attr.d]="linePath()" fill="none" stroke="var(--ad-gold)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
      @for (p of points(); track p.label) {
        <circle [attr.cx]="p.x" [attr.cy]="p.y" r="3" fill="var(--ad-gold)" />
      }
    </svg>
  `,
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
