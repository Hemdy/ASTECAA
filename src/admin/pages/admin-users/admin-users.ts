import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdmModal } from '../../components/adm-modal/adm-modal';
import { AdmConfirm } from '../../components/adm-confirm/adm-confirm';
import { ADMIN_USERS, AdminUser, Role } from '../../admin-data';
import { ToastService } from '../../../ui-state';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, AdmModal],
  templateUrl: './admin-users.html',
})
export class AdminUsers {
  private toast = inject(ToastService);
  users = signal<AdminUser[]>(ADMIN_USERS);
  query = signal('');
  roleFilter = signal('');
  statusFilter = signal('');
  selected = signal<string[]>([]);
  inviteModal = signal(false);
  inviteEmail = '';
  inviteRole: Role = 'Editor';
  editTarget = signal<AdminUser | null>(null);
  editRole: Role = 'Editor';

  roles: Role[] = ['Super Administrator', 'Content Manager', 'Event Manager', 'Community Moderator', 'Gallery Manager', 'Editor'];

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

  approve(u: AdminUser) {
    this.users.update((list) => list.map((x) => (x.id === u.id ? { ...x, status: 'active' } : x)));
    this.toast.show(`${u.name} approved.`);
  }

  toggleSuspend(u: AdminUser) {
    this.users.update((list) =>
      list.map((x) => (x.id === u.id ? { ...x, status: x.status === 'suspended' ? 'active' : 'suspended' } : x))
    );
    this.toast.show(u.status === 'suspended' ? `${u.name} reactivated.` : `${u.name} suspended.`);
  }

  openEdit(u: AdminUser) {
    this.editTarget.set(u);
    this.editRole = u.role;
  }

  saveRole() {
    const t = this.editTarget();
    if (t) {
      this.users.update((list) => list.map((u) => (u.id === t.id ? { ...u, role: this.editRole } : u)));
      this.toast.show('Role updated.');
    }
    this.editTarget.set(null);
  }

  sendInvite() {
    if (!this.inviteEmail.trim()) {
      this.toast.show('Please enter an email address.');
      return;
    }
    this.toast.show(`Invitation sent to ${this.inviteEmail}.`);
    this.inviteModal.set(false);
    this.inviteEmail = '';
  }

  exportCsv() {
    this.toast.show('User list exported as CSV.');
  }
}
