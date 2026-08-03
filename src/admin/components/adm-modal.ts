import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-adm-modal',
  standalone: true,
  template: `
    <div class="adm-modal-backdrop" (click)="onBackdrop()">
      <div class="adm-modal" [class.adm-modal-lg]="size === 'lg'" (click)="$event.stopPropagation()">
        <div class="adm-modal-head">
          <h3 class="adm-modal-title">{{ title }}</h3>
          <button class="adm-btn adm-btn-ghost adm-btn-icon" (click)="close.emit()" aria-label="Close">✕</button>
        </div>
        <div class="adm-modal-body">
          <ng-content />
        </div>
        <div class="adm-modal-foot">
          <ng-content select="[foot]" />
        </div>
      </div>
    </div>
  `,
})
export class AdmModal {
  @Input() title = '';
  @Input() size: 'md' | 'lg' = 'md';
  @Input() backdropClose = true;
  @Output() close = new EventEmitter<void>();

  onBackdrop() {
    if (this.backdropClose) this.close.emit();
  }
}
