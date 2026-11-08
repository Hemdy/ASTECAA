import { Injectable } from '@angular/core';
import { getAstecApiUrl } from '@astec/config';
import type { AdminUserItem, RolePermissionItem, InvitationItem, MemberProfile } from '@astec/types';

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  async listUsers(query?: string, role?: string, status?: string): Promise<AdminUserItem[]> {
    const params = new URLSearchParams();
    if (query?.trim()) params.set('q', query.trim());
    if (role?.trim()) params.set('role', role.trim());
    if (status?.trim()) params.set('status', status.trim());

    const qs = params.toString() ? `?${params.toString()}` : '';
    return this.request<AdminUserItem[]>(`/api/admin/v1/users${qs}`);
  }

  async updateUserRole(userId: string, role: string): Promise<{ success: boolean; role: string }> {
    return this.request<{ success: boolean; role: string }>(`/api/admin/v1/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    });
  }

  async updateUserStatus(
    userId: string,
    status: 'active' | 'suspended' | 'pending',
  ): Promise<{ success: boolean; status: string }> {
    return this.request<{ success: boolean; status: string }>(`/api/admin/v1/users/${userId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  async listRoles(): Promise<RolePermissionItem[]> {
    return this.request<RolePermissionItem[]>('/api/admin/v1/roles');
  }

  async updateRolePermissions(
    roleIdOrName: string,
    permissions: Partial<Omit<RolePermissionItem, 'id' | 'code' | 'role' | 'description' | 'systemManaged'>>,
  ): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/admin/v1/roles/${roleIdOrName}`, {
      method: 'PATCH',
      body: JSON.stringify(permissions),
    });
  }

  async listInvitations(): Promise<InvitationItem[]> {
    return this.request<InvitationItem[]>('/api/admin/v1/invitations');
  }

  async createInvitation(email: string, role: string): Promise<InvitationItem> {
    return this.request<InvitationItem>('/api/admin/v1/invitations', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    });
  }

  async revokeInvitation(id: string): Promise<{ success: boolean }> {
    return this.request<{ success: boolean }>(`/api/admin/v1/invitations/${id}`, {
      method: 'DELETE',
    });
  }

  async getProfile(): Promise<MemberProfile> {
    return this.request<MemberProfile>('/api/v1/profile');
  }

  async updateProfile(updates: {
    fullName?: string;
    phone?: string;
    graduationSet?: string;
    department?: string;
    avatarUrl?: string;
    bio?: string;
  }): Promise<MemberProfile> {
    return this.request<MemberProfile>('/api/v1/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (init.body) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${getAstecApiUrl()}${path}`, {
      ...init,
      headers,
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const msg =
        typeof body === 'object' && body !== null && 'error' in body
          ? (body as any).error?.message || (body as any).error
          : `Request failed (${response.status})`;
      throw new Error(msg);
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }
}
