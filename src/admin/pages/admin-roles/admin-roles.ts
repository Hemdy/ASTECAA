import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../ui-state';
import { ADMIN_ROLES, RolePermission, Role } from '../../admin-data';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-roles.html',
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
