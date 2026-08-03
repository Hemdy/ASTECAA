import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../ui-state';
import { NAV_ITEMS } from '../../data';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './footer.html',
  styleUrl: './footer.css',
})
export class Footer {
  private toast = inject(ToastService);
  items = NAV_ITEMS;
  email = '';
  name = '';

  subscribe() {
    if (!this.email) return;
    this.toast.show(`Welcome to the dispatch. We will write to ${this.email}.`);
    this.email = '';
    this.name = '';
  }
}
