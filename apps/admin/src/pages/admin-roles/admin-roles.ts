import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ToastService } from '@astec/ui';
import { UsersApiService } from '@astec/api-client';
import type { RolePermission } from '../../admin-data';

@Component({
  selector: 'app-admin-roles',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './admin-roles.html',
})
export class AdminRoles {
  private toast = inject(ToastService);
  private usersApi = inject(UsersApiService);

  roles = signal<RolePermission[]>([]);
  loading = signal(true);

  audit = [
    { id: 'al1', user: 'Super Administrator', action: 'initialized system RBAC permissions', time: 'Recently', icon: '🛡' },
    { id: 'al2', user: 'System', action: 'verified role permissions against Neon database', time: 'Recently', icon: '⚙' },
  ];

  constructor() {
    this.loadRoles();
  }

  async loadRoles() {
    this.loading.set(true);
    try {
      const list = await this.usersApi.listRoles();
      this.roles.set(list as unknown as RolePermission[]);
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to load roles.');
    } finally {
      this.loading.set(false);
    }
  }

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

  async save() {
    try {
      for (const r of this.roles()) {
        await this.usersApi.updateRolePermissions(r.role, {
          users: r.users,
          events: r.events,
          gallery: r.gallery,
          stories: r.stories,
          comments: r.comments,
          announcements: r.announcements,
          settings: r.settings,
        });
      }
      this.toast.show('Role permissions saved to database.');
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to save role permissions.');
    }
  }
}
