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

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface AuthSessionResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
    roleCode?: string;
    permissions?: string[];
    status?: string;
  } | null;
}

export interface PendingInvite {
  id: string;
  email: string;
  roleCode?: string;
  role?: string;
  token: string;
  status: string;
  expiresAt: string;
  createdAt?: string;
}

export interface CmsGalleryItem {
  id: string;
  title: string;
  caption?: string | null;
  description?: string | null;
  url: string;
  thumb?: string | null;
  image?: string | null;
  album: string;
  year: number;
  type?: 'photo' | 'video';
  mediaType?: 'photo' | 'video';
  format?: 'photo' | 'video';
  featured: boolean;
  size?: string | null;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CmsTimelineMilestone {
  id: string;
  year: number;
  title: string;
  subtitle?: string | null;
  story: string;
  description?: string | null;
  quote?: string | null;
  quoteAuthor?: string | null;
  imageUrl?: string | null;
  image?: string | null;
  url?: string | null;
  hasVideo?: boolean;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CmsCommunityMessage {
  id: string;
  author: string;
  email: string;
  phone?: string | null;
  graduationYear?: string | null;
  location?: string | null;
  avatar?: string | null;
  message: string;
  page?: string;
  targetId?: string | null;
  status: 'approved' | 'pending' | 'reported' | 'spam';
  likes: number;
  reports?: number;
  pinned: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CmsStory {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  cover?: string | null;
  author: string;
  authorAvatar?: string | null;
  status: 'published' | 'draft' | 'archived';
  views: number;
  comments?: number;
  commentsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CmsAnnouncement {
  id: string;
  title: string;
  body: string;
  date: string;
  status: 'published' | 'scheduled' | 'draft';
  pinned: boolean;
  channel: 'email' | 'push' | 'site';
  createdAt?: string;
  updatedAt?: string;
}

export interface CmsHomepageSettings {
  hero?: {
    headline?: string;
    subheadline?: string;
    tagline?: string;
    primaryBtn?: string;
    secondaryBtn?: string;
    bgImage?: string;
  };
  featured?: {
    eventId?: string;
    stories?: string[];
  };
  sections?: Array<{
    id: string;
    name: string;
    description: string;
    enabled: boolean;
  }>;
  footer?: {
    mission?: string;
    copyright?: string;
    instagram?: string;
    facebook?: string;
    twitter?: string;
  };
  heroHeadline?: string;
  heroSubheadline?: string;
  heroTagline?: string;
  heroPrimaryBtn?: string;
  heroSecondaryBtn?: string;
  stats?: Array<{ label: string; value: string | number }>;
  featuredEventId?: string;
}

export interface CmsMediaItem {
  id: string;
  name: string;
  url: string;
  type: string;
  size?: string | null;
  folder: string;
  storageKey?: string | null;
  tags?: string[];
  createdAt?: string;
  date?: string;
}
