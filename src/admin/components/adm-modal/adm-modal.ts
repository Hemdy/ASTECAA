import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-adm-modal',
  standalone: true,
  templateUrl: './adm-modal.html',
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
