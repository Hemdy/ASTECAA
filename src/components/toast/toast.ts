import { Component, inject } from '@angular/core';
import { ToastService } from '../../ui-state';

@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.html',
  styleUrl: './toast.css',
})
export class Toast {
  toast = inject(ToastService);
}
