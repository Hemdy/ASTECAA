import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AdminAuthService } from '../../auth.service';

@Component({
  selector: 'app-admin-not-found',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './admin-not-found.html',
})
export class AdminNotFound {
  readonly auth = inject(AdminAuthService);
}
