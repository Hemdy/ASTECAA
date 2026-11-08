import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-adm-confirm',
  standalone: true,
  template: `
    <div class="adm-modal-backdrop" (click)="onBackdrop()">
      <div class="adm-modal" style="max-width: 420px" (click)="$event.stopPropagation()">
        <div class="adm-modal-body">
          <div class="adm-confirm-ico">⚠</div>
          <p class="adm-confirm-text">{{ message }}</p>
        </div>
        <div class="adm-modal-foot">
          <button class="adm-btn adm-btn-outline" (click)="cancel.emit()">Cancel</button>
          <button class="adm-btn adm-btn-danger" (click)="confirm.emit()">{{ confirmLabel }}</button>
        </div>
      </div>
    </div>
  `,
})
export class AdmConfirm {
  @Input() message = 'Are you sure?';
  @Input() confirmLabel = 'Delete';
  @Input() backdropClose = true;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onBackdrop() {
    if (this.backdropClose) this.cancel.emit();
  }
}
