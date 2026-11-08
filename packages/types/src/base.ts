export type UserRole = 'alumni' | 'admin' | 'super_admin';

export interface MemberProfile {
  id: string;
  full_name: string;
  graduation_set: string;
  email: string;
  phone: string | null;
}

export interface AdminProfile {
  id: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}
