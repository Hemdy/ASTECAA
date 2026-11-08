export type UserRole = 'alumni' | 'admin' | 'super_admin';

export interface MemberProfile {
  id: string;
  full_name: string;
  graduation_set: string;
  email: string;
  phone: string | null;
  department?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
}

export interface AdminProfile {
  id: string;
  full_name: string;
  role: UserRole;
  roles?: string[];
  permissions?: string[];
  is_active: boolean;
  email?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AdminUserItem {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: string;
  status: 'active' | 'suspended' | 'pending';
  joined: string;
  lastActive: string;
  events: number;
  posts: number;
}

export interface RolePermissionItem {
  id?: string;
  code?: string;
  role: string;
  description?: string;
  systemManaged?: boolean;
  users: boolean;
  events: boolean;
  gallery: boolean;
  stories: boolean;
  comments: boolean;
  announcements: boolean;
  settings: boolean;
}

export interface DashboardStatsItem {
  totalUsers: number;
  upcomingEvents: number;
  pendingApprovals: number;
  activeElections: number;
  totalVotes: number;
  growthData: Array<{ label: string; value: number }>;
  recentUsers: AdminUserItem[];
  upcomingEventsList: Array<{
    id: string;
    title: string;
    date: string;
    venue: string;
    category: string;
    status: string;
    registered: number;
    capacity: number;
    featured: boolean;
    poster: string;
  }>;
}

export interface InvitationItem {
  id: string;
  email: string;
  roleCode?: string;
  role?: string;
  token: string;
  status: string;
  expiresAt: string;
  createdAt?: string;
}
