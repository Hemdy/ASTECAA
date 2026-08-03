import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-adm-confirm',
  standalone: true,
  templateUrl: './adm-confirm.html',
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
