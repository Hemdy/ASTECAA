import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdmModal } from '../../components/adm-modal/adm-modal';
import { UsersApiService, DashboardApiService } from '@astec/api-client';
import { ToastService } from '@astec/ui';
import type { AdminUser, Role } from '../../admin-data';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, AdmModal],
  templateUrl: './admin-users.html',
})
export class AdminUsers {
  private toast = inject(ToastService);
  private usersApi = inject(UsersApiService);
  private dashboardApi = inject(DashboardApiService);

  users = signal<AdminUser[]>([]);
  loading = signal(true);
  query = signal('');
  roleFilter = signal('');
  statusFilter = signal('');
  selected = signal<string[]>([]);
  inviteModal = signal(false);
  inviteEmail = '';
  inviteRole: Role = 'Editor';
  editTarget = signal<AdminUser | null>(null);
  editRole: Role = 'Editor';

  roles: Role[] = [
    'Super Administrator',
    'Content Manager',
    'Event Manager',
    'Community Moderator',
    'Gallery Manager',
    'Editor',
    'Membership Manager',
  ];

  filtered = computed(() => {
    const q = this.query().toLowerCase();
    const r = this.roleFilter();
    const s = this.statusFilter();
    return this.users().filter((u) => {
      const mq = !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const mr = !r || u.role === r;
      const ms = !s || u.status === s;
      return mq && mr && ms;
    });
  });

  constructor() {
    this.loadUsers();
  }

  async loadUsers() {
    this.loading.set(true);
    try {
      const list = await this.usersApi.listUsers();
      this.users.set(list as unknown as AdminUser[]);
      void this.dashboardApi.refreshSidebarCounts();
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to load users from database.');
    } finally {
      this.loading.set(false);
    }
  }

  countStatus(s: string): number {
    return this.users().filter((u) => u.status === s).length;
  }

  shortDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  toggleAll(e: Event) {
    const checked = (e.target as HTMLInputElement).checked;
    this.selected.set(checked ? this.filtered().map((u) => u.id) : []);
  }

  toggleSelect(id: string) {
    this.selected.update((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  }

  async approve(u: AdminUser) {
    try {
      await this.usersApi.updateUserStatus(u.id, 'active');
      this.users.update((list) => list.map((x) => (x.id === u.id ? { ...x, status: 'active' } : x)));
      this.toast.show(`${u.name} approved.`);
      void this.dashboardApi.refreshSidebarCounts(true);
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to approve user.');
    }
  }

  async toggleSuspend(u: AdminUser) {
    const nextStatus = u.status === 'suspended' ? 'active' : 'suspended';
    try {
      await this.usersApi.updateUserStatus(u.id, nextStatus);
      this.users.update((list) =>
        list.map((x) => (x.id === u.id ? { ...x, status: nextStatus } : x))
      );
      this.toast.show(u.status === 'suspended' ? `${u.name} reactivated.` : `${u.name} suspended.`);
      void this.dashboardApi.refreshSidebarCounts(true);
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to change status.');
    }
  }

  openEdit(u: AdminUser) {
    this.editTarget.set(u);
    this.editRole = u.role;
  }

  async saveRole() {
    const t = this.editTarget();
    if (t) {
      try {
        await this.usersApi.updateUserRole(t.id, this.editRole);
        this.users.update((list) => list.map((u) => (u.id === t.id ? { ...u, role: this.editRole } : u)));
        this.toast.show('Role updated successfully.');
      } catch (err: any) {
        this.toast.show(err.message || 'Failed to update role.');
      }
    }
    this.editTarget.set(null);
  }

  async sendInvite() {
    if (!this.inviteEmail.trim()) {
      this.toast.show('Please enter an email address.');
      return;
    }
    try {
      await this.usersApi.createInvitation(this.inviteEmail.trim(), this.inviteRole);
      this.toast.show(`Invitation sent to ${this.inviteEmail}.`);
      this.inviteModal.set(false);
      this.inviteEmail = '';
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to send invitation.');
    }
  }

  exportCsv() {
    const header = ['ID', 'Name', 'Email', 'Role', 'Status', 'Joined'];
    const rows = this.filtered().map((u) => [u.id, u.name, u.email, u.role, u.status, u.joined]);
    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [header.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'astecaa-members.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toast.show('User list exported as CSV.');
  }

  onAvatarImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/ASTECAA.jpg';
  }
}
