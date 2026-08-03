import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdmModal } from '../components/adm-modal';
import { AdmConfirm } from '../components/adm-confirm';
import { ADMIN_USERS, AdminUser, Role } from '../admin-data';
import { ToastService } from '../../ui-state';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [FormsModule, AdmModal],
  template: `
    <div class="adm-toolbar">
      <div>
        <div class="adm-section-title">User Management</div>
        <div class="adm-section-sub">Manage administrators, community members, roles, and account status.</div>
      </div>
      <div style="margin-left: auto; display: flex; gap: 10px">
        <button class="adm-btn adm-btn-outline" (click)="exportCsv()">⬇ Export CSV</button>
        <button class="adm-btn adm-btn-primary" (click)="inviteModal.set(true)">+ Invite User</button>
      </div>
    </div>

    <div class="adm-grid-3" style="margin-bottom: 20px">
      <div class="adm-stat"><div class="adm-stat-top"><div><div class="adm-stat-label">Total Users</div><div class="adm-stat-value">{{ users().length }}</div></div><div class="adm-stat-ico">👥</div></div></div>
      <div class="adm-stat forest"><div class="adm-stat-top"><div><div class="adm-stat-label">Active</div><div class="adm-stat-value">{{ countStatus('active') }}</div></div><div class="adm-stat-ico">✓</div></div></div>
      <div class="adm-stat burgundy"><div class="adm-stat-top"><div><div class="adm-stat-label">Pending Approval</div><div class="adm-stat-value">{{ countStatus('pending') }}</div></div><div class="adm-stat-ico">⏳</div></div></div>
    </div>

    <div class="adm-card adm-card-pad" style="margin-bottom: 20px; display: flex; gap: 12px; flex-wrap: wrap; align-items: flex-end">
      <div class="adm-field" style="margin: 0; flex: 1; min-width: 200px">
        <label class="adm-field-label">Search</label>
        <input class="adm-input" [ngModel]="query()" (ngModelChange)="query.set($event)" placeholder="Search by name or email…" />
      </div>
      <div class="adm-field" style="margin: 0; min-width: 160px">
        <label class="adm-field-label">Role</label>
        <select class="adm-select" [ngModel]="roleFilter()" (ngModelChange)="roleFilter.set($event)">
          <option value="">All roles</option>
          @for (r of roles; track r) { <option [value]="r">{{ r }}</option> }
        </select>
      </div>
      <div class="adm-field" style="margin: 0; min-width: 140px">
        <label class="adm-field-label">Status</label>
        <select class="adm-select" [ngModel]="statusFilter()" (ngModelChange)="statusFilter.set($event)">
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>
      @if (selected().length > 0) {
        <span class="adm-badge adm-badge-info">{{ selected().length }} selected</span>
      }
    </div>

    <div class="adm-card">
      <div class="adm-table-wrap">
        <table class="adm-table">
          <thead>
            <tr>
              <th style="width: 36px"><input type="checkbox" class="adm-cb" (change)="toggleAll($event)" /></th>
              <th>User</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Last Active</th>
              <th>Activity</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            @for (u of filtered(); track u.id) {
              <tr>
                <td><input type="checkbox" class="adm-cb" [checked]="selected().includes(u.id)" (change)="toggleSelect(u.id)" /></td>
                <td>
                  <div class="adm-cell-user">
                    <img class="adm-avatar" [src]="u.avatar" [alt]="u.name" />
                    <div>
                      <div class="adm-cell-user-name">{{ u.name }}</div>
                      <div class="adm-cell-user-sub">{{ u.email }}</div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="adm-badge" [class.adm-badge-burgundy]="u.role === 'Super Administrator'" [class.adm-badge-gold]="u.role === 'Content Manager'" [class.adm-badge-success]="u.role === 'Event Manager'" [class.adm-badge-info]="u.role === 'Community Moderator' || u.role === 'Gallery Manager' || u.role === 'Editor'">{{ u.role }}</span>
                </td>
                <td>
                  <span class="adm-badge" [class.adm-badge-success]="u.status === 'active'" [class.adm-badge-warning]="u.status === 'pending'" [class.adm-badge-danger]="u.status === 'suspended'">
                    <span class="adm-dot" [class.adm-dot-success]="u.status === 'active'" [class.adm-dot-warning]="u.status === 'pending'" [class.adm-dot-danger]="u.status === 'suspended'"></span>
                    {{ u.status }}
                  </span>
                </td>
                <td>{{ shortDate(u.joined) }}</td>
                <td>{{ u.lastActive }}</td>
                <td><span class="adm-card-sub">{{ u.events }} events · {{ u.posts }} posts</span></td>
                <td>
                  <div class="adm-table-actions">
                    @if (u.status === 'pending') {
                      <button class="adm-btn adm-btn-ghost adm-btn-icon" (click)="approve(u)" title="Approve">✓</button>
                    }
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" (click)="openEdit(u)" title="Edit role">✎</button>
                    <button class="adm-btn adm-btn-ghost adm-btn-icon" (click)="toggleSuspend(u)" title="Suspend/Activate">{{ u.status === 'suspended' ? '↑' : '⊘' }}</button>
                  </div>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <div class="adm-card-head" style="border-top: 1px solid var(--ad-border); border-bottom: none">
        <span class="adm-card-sub">{{ filtered().length }} users</span>
        <div class="adm-pagination">
          <button class="adm-page-btn" [disabled]="true">‹</button>
          <button class="adm-page-btn active">1</button>
          <button class="adm-page-btn">›</button>
        </div>
      </div>
    </div>

    @if (inviteModal()) {
      <app-adm-modal title="Invite User" (close)="inviteModal.set(false)">
        <div class="adm-field">
          <label class="adm-field-label">Email Address</label>
          <input class="adm-input" [(ngModel)]="inviteEmail" placeholder="colleague@example.com" />
          <span class="adm-field-hint">An invitation will be sent to this address.</span>
        </div>
        <div class="adm-field">
          <label class="adm-field-label">Role</label>
          <select class="adm-select" [(ngModel)]="inviteRole">
            @for (r of roles; track r) { <option [value]="r">{{ r }}</option> }
          </select>
        </div>
        <div foot>
          <button class="adm-btn adm-btn-outline" (click)="inviteModal.set(false)">Cancel</button>
          <button class="adm-btn adm-btn-primary" (click)="sendInvite()">Send invitation</button>
        </div>
      </app-adm-modal>
    }

    @if (editTarget()) {
      <app-adm-modal title="Edit User Role" (close)="editTarget.set(null)">
        <div style="display: flex; gap: 12px; align-items: center; margin-bottom: 16px">
          <img class="adm-avatar adm-avatar-lg" [src]="editTarget()!.avatar" [alt]="editTarget()!.name" />
          <div>
            <strong style="font-size: 1.05rem">{{ editTarget()!.name }}</strong>
            <div class="adm-cell-user-sub">{{ editTarget()!.email }}</div>
          </div>
        </div>
        <div class="adm-field">
          <label class="adm-field-label">Role</label>
          <select class="adm-select" [(ngModel)]="editRole">
            @for (r of roles; track r) { <option [value]="r">{{ r }}</option> }
          </select>
        </div>
        <div foot>
          <button class="adm-btn adm-btn-outline" (click)="editTarget.set(null)">Cancel</button>
          <button class="adm-btn adm-btn-primary" (click)="saveRole()">Save</button>
        </div>
      </app-adm-modal>
    }
  `,
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
