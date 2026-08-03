import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../ui-state';
import { ADMIN_ROLES, RolePermission, Role } from '../admin-data';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="adm-toolbar">
      <div>
        <div class="adm-section-title">Roles & Permissions</div>
        <div class="adm-section-sub">Define what each administrator role can access and manage across the platform.</div>
      </div>
      <button class="adm-btn adm-btn-primary" style="margin-left: auto" (click)="save()">Save permissions</button>
    </div>

    <!-- Role cards -->
    <div class="adm-grid-3" style="margin-bottom: 24px">
      @for (r of roles(); track r.role) {
        <div class="adm-card adm-card-pad">
          <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 12px">
            <span class="adm-badge" [class.adm-badge-burgundy]="r.color === 'burgundy'" [class.adm-badge-gold]="r.color === 'gold'" [class.adm-badge-success]="r.color === 'forest'" [class.adm-badge-info]="r.color === 'info'">{{ r.role }}</span>
            <span class="adm-cell-user-sub" style="margin-left: auto">{{ r.members }} member{{ r.members === 1 ? '' : 's' }}</span>
          </div>
          <div style="display: flex; flex-wrap: wrap; gap: 6px">
            @for (perm of permissions(r); track perm.key) {
              @if (perm.value) {
                <span class="adm-badge adm-badge-success">{{ perm.key }}</span>
              }
            }
          </div>
        </div>
      }
    </div>

    <!-- Permission matrix -->
    <div class="adm-card">
      <div class="adm-card-head">
        <div class="adm-card-title">Permission Matrix</div>
        <span class="adm-card-sub">Toggle access for each module per role</span>
      </div>
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th>Role</th>
              <th style="text-align: center">Users</th>
              <th style="text-align: center">Events</th>
              <th style="text-align: center">Gallery</th>
              <th style="text-align: center">Stories</th>
              <th style="text-align: center">Comments</th>
              <th style="text-align: center">Announcements</th>
              <th style="text-align: center">Settings</th>
            </tr>
          </thead>
          <tbody>
            @for (r of roles(); track r.role) {
              <tr>
                <td>
                  <span class="adm-badge" [class.adm-badge-burgundy]="r.color === 'burgundy'" [class.adm-badge-gold]="r.color === 'gold'" [class.adm-badge-success]="r.color === 'forest'" [class.adm-badge-info]="r.color === 'info'">{{ r.role }}</span>
                </td>
                <td style="text-align: center"><label class="adm-switch"><input type="checkbox" [checked]="r.users" (change)="toggle(r, 'users')" [disabled]="r.role === 'Super Administrator'" /><span class="adm-switch-slider"></span></label></td>
                <td style="text-align: center"><label class="adm-switch"><input type="checkbox" [checked]="r.events" (change)="toggle(r, 'events')" [disabled]="r.role === 'Super Administrator'" /><span class="adm-switch-slider"></span></label></td>
                <td style="text-align: center"><label class="adm-switch"><input type="checkbox" [checked]="r.gallery" (change)="toggle(r, 'gallery')" [disabled]="r.role === 'Super Administrator'" /><span class="adm-switch-slider"></span></label></td>
                <td style="text-align: center"><label class="adm-switch"><input type="checkbox" [checked]="r.stories" (change)="toggle(r, 'stories')" [disabled]="r.role === 'Super Administrator'" /><span class="adm-switch-slider"></span></label></td>
                <td style="text-align: center"><label class="adm-switch"><input type="checkbox" [checked]="r.comments" (change)="toggle(r, 'comments')" [disabled]="r.role === 'Super Administrator'" /><span class="adm-switch-slider"></span></label></td>
                <td style="text-align: center"><label class="adm-switch"><input type="checkbox" [checked]="r.announcements" (change)="toggle(r, 'announcements')" [disabled]="r.role === 'Super Administrator'" /><span class="adm-switch-slider"></span></label></td>
                <td style="text-align: center"><label class="adm-switch"><input type="checkbox" [checked]="r.settings" (change)="toggle(r, 'settings')" [disabled]="r.role === 'Super Administrator'" /><span class="adm-switch-slider"></span></label></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Audit log -->
    <div class="adm-card" style="margin-top: 20px">
      <div class="adm-card-head">
        <div class="adm-card-title">Audit Log</div>
        <span class="adm-card-sub">Recent changes to roles and permissions</span>
      </div>
      <div class="adm-card-pad">
        <div class="adm-feed">
          @for (log of audit; track log.id) {
            <div class="adm-feed-item">
              <div class="adm-feed-ico">{{ log.icon }}</div>
              <div style="flex: 1">
                <div class="adm-feed-text"><strong>{{ log.user }}</strong> {{ log.action }}</div>
                <div class="adm-feed-time">{{ log.time }}</div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
})
export class AdminRoles {
  private toast = inject(ToastService);
  roles = signal<RolePermission[]>([...ADMIN_ROLES]);

  audit = [
    { id: 'al1', user: 'Marlene Whitfield', action: 'granted Gallery Manager upload permissions', time: '2 days ago', icon: '🛡' },
    { id: 'al2', user: 'Marlene Whitfield', action: 'created the Event Manager role', time: '1 week ago', icon: '✎' },
    { id: 'al3', user: 'Daniel Okonkwo', action: 'removed Settings access from the Editor role', time: '2 weeks ago', icon: '⊘' },
    { id: 'al4', user: 'System', action: 'logged a permission change by Theodore Marsh', time: '3 weeks ago', icon: '⚙' },
  ];

  permissions(r: RolePermission): { key: string; value: boolean }[] {
    return [
      { key: 'Users', value: r.users },
      { key: 'Events', value: r.events },
      { key: 'Gallery', value: r.gallery },
      { key: 'Stories', value: r.stories },
      { key: 'Comments', value: r.comments },
      { key: 'Announcements', value: r.announcements },
      { key: 'Settings', value: r.settings },
    ];
  }

  toggle(r: RolePermission, key: keyof RolePermission) {
    this.roles.update((list) =>
      list.map((x) => (x.role === r.role ? { ...x, [key]: !x[key as keyof RolePermission] } : x))
    );
  }

  save() {
    this.toast.show('Role permissions saved.');
  }
}
