export type Role =
  | 'Super Administrator'
  | 'Content Manager'
  | 'Event Manager'
  | 'Community Moderator'
  | 'Gallery Manager'
  | 'Editor'
  | 'Membership Manager';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: Role;
  status: 'active' | 'suspended' | 'pending';
  joined: string;
  lastActive: string;
  events: number;
  posts: number;
}

export interface AdminEvent {
  id: string;
  title: string;
  date: string;
  time?: string;
  venue: string;
  category: string;
  status: 'published' | 'draft' | 'scheduled' | 'archived';
  registered: number;
  capacity: number;
  featured: boolean;
  poster: string;
  description?: string;
}

export interface AdminGalleryItem {
  id: string;
  title: string;
  thumb: string;
  album: string;
  year: number;
  type: 'photo' | 'video';
  featured: boolean;
  uploaded: string;
  size: string;
}

export interface AdminStory {
  id: string;
  title: string;
  excerpt: string;
  author: string;
  authorAvatar: string;
  category: string;
  status: 'published' | 'draft' | 'archived';
  date: string;
  views: number;
  comments: number;
  cover: string;
}

export interface AdminComment {
  id: string;
  author: string;
  avatar: string;
  message: string;
  page: string;
  date: string;
  status: 'approved' | 'pending' | 'reported' | 'spam';
  likes: number;
  reports: number;
}

export interface AdminNotification {
  id: string;
  type: 'user' | 'event' | 'comment' | 'gallery' | 'system';
  text: string;
  time: string;
  unread: boolean;
}

export interface AdminActivity {
  id: string;
  user: string;
  avatar: string;
  action: string;
  target: string;
  time: string;
  icon: string;
}

export interface AdminContactMsg {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  date: string;
  status: 'new' | 'read' | 'replied' | 'closed';
}

const img = (file: string) => `/images/${file}`;

export const ADMIN_USER: { name: string; role: Role; avatar: string } = {
  name: 'ASTECAA Admin',
  role: 'Super Administrator',
  avatar: img('ASTECAA.jpg'),
};

export const ADMIN_USERS: AdminUser[] = [
  {
    id: 'u1',
    name: 'Chinedu Okafor',
    email: 'chinedu@astecaa.org',
    avatar: img('avatar-chinedu.jpg'),
    role: 'Super Administrator',
    status: 'active',
    joined: '2014-03-02',
    lastActive: '2 min ago',
    events: 38,
    posts: 142,
  },

  {
    id: 'u2',
    name: 'Daniel Okonkwo',
    email: 'daniel@astecaa.org',
    avatar: img('avatar-daniel.jpg'),
    role: 'Content Manager',
    status: 'active',
    joined: '2020-01-14',
    lastActive: '1 hr ago',
    events: 12,
    posts: 86,
  },

  {
    id: 'u3',
    name: 'Emmanuel Adeyemi',
    email: 'emmanuel@astecaa.org',
    avatar: img('avatar-emmanuel.jpg'),
    role: 'Event Manager',
    status: 'active',
    joined: '2004-09-22',
    lastActive: '3 hr ago',
    events: 64,
    posts: 23,
  },

  {
    id: 'u4',
    name: 'Grace Nwankwo',
    email: 'grace@astecaa.org',
    avatar: img('avatar-grace.jpg'),
    role: 'Editor',
    status: 'active',
    joined: '2018-05-11',
    lastActive: 'yesterday',
    events: 8,
    posts: 54,
  },

  {
    id: 'u5',
    name: 'Esther Chukwu',
    email: 'esther@astecaa.org',
    avatar: img('avatar-esther.jpg'),
    role: 'Community Moderator',
    status: 'active',
    joined: '2022-07-30',
    lastActive: '5 min ago',
    events: 0,
    posts: 31,
  },

  {
    id: 'u6',
    name: 'Samuel Eze',
    email: 'samuel@astecaa.org',
    avatar: img('avatar-samuel.jpg'),
    role: 'Content Manager',
    status: 'pending',
    joined: '2026-07-12',
    lastActive: 'never',
    events: 0,
    posts: 0,
  },

  {
    id: 'u7',
    name: 'ASTECAA Education Committee',
    email: 'education@astecaa.org',
    avatar: img('reading-room.jpg'),
    role: 'Membership Manager',
    status: 'active',
    joined: '2023-02-18',
    lastActive: '4 hr ago',
    events: 0,
    posts: 12,
  },

  {
    id: 'u8',
    name: 'ASTECAA Social & Welfare Committee',
    email: 'welfare@astecaa.org',
    avatar: img('reunion.jpg'),
    role: 'Community Moderator',
    status: 'suspended',
    joined: '2021-11-04',
    lastActive: '2 weeks ago',
    events: 0,
    posts: 7,
  },

  {
    id: 'u9',
    name: 'ASTECAA Executive Committee',
    email: 'executive@astecaa.org',
    avatar: img('ASTECAA.jpg'),
    role: 'Event Manager',
    status: 'active',
    joined: '2024-06-01',
    lastActive: '20 min ago',
    events: 14,
    posts: 9,
  },

  {
    id: 'u10',
    name: 'ASTECAA Communications Team',
    email: 'communications@astecaa.org',
    avatar: img('avatar-daniel.jpg'),
    role: 'Content Manager',
    status: 'pending',
    joined: '2026-07-20',
    lastActive: 'never',
    events: 0,
    posts: 0,
  },
];

export const ADMIN_EVENTS: AdminEvent[] = [
  {
    id: 'astecaa-annual-reunion-2026',
    title: 'ASTECAA Annual Alumni Reunion 2026',
    date: '2026-12-19',
    venue: 'ASTEC Campus',
    category: 'Reunion',
    status: 'scheduled',
    registered: 287,
    capacity: 500,
    featured: true,
    poster: img('reunion.jpg'),
  },

  {
    id: 'astecaa-career-networking-2026',
    title: 'ASTECAA Career & Networking Forum',
    date: '2026-09-26',
    venue: 'ASTEC Alumni Hall',
    category: 'Networking',
    status: 'scheduled',
    registered: 164,
    capacity: 250,
    featured: true,
    poster: img('reading-room.jpg'),
  },

  {
    id: 'astecaa-agm-2026',
    title: 'ASTECAA Annual General Meeting 2026',
    date: '2026-11-28',
    venue: 'ASTECAA Secretariat',
    category: 'AGM',
    status: 'scheduled',
    registered: 192,
    capacity: 300,
    featured: false,
    poster: img('ASTECAA.jpg'),
  },

  {
    id: 'astecaa-fundraising-dinner-2027',
    title: 'ASTECAA Legacy & Fundraising Dinner 2027',
    date: '2027-02-27',
    venue: 'Grand Event Centre',
    category: 'Fundraiser',
    status: 'scheduled',
    registered: 236,
    capacity: 400,
    featured: false,
    poster: img('open-fire-feast.jpg'),
  },

  {
    id: 'astecaa-sports-day-2027',
    title: 'ASTECAA Alumni Sports & Family Day',
    date: '2027-04-17',
    venue: 'ASTEC Sports Field',
    category: 'Sports',
    status: 'draft',
    registered: 341,
    capacity: 600,
    featured: false,
    poster: img('market-stalls.jpg'),
  },

  {
    id: 'astecaa-mentorship-day-2027',
    title: 'ASTECAA Mentorship & Scholarship Day',
    date: '2027-06-12',
    venue: 'ASTEC Assembly Hall',
    category: 'Mentorship',
    status: 'draft',
    registered: 218,
    capacity: 300,
    featured: false,
    poster: img('reading-room.jpg'),
  },
];

export const ADMIN_GALLERY: AdminGalleryItem[] = [
  {
    id: 'g1',
    title: 'ASTECAA Founding Gathering',
    thumb: img('ASTECAA.jpg'),
    album: 'ASTECAA Beginnings',
    year: 1998,
    type: 'photo',
    featured: true,
    uploaded: '2026-06-12',
    size: '2.4 MB',
  },

  {
    id: 'g2',
    title: 'The First Alumni Reunion',
    thumb: img('reunion.jpg'),
    album: 'Reunions',
    year: 1998,
    type: 'photo',
    featured: true,
    uploaded: '2026-06-12',
    size: '2.1 MB',
  },

  {
    id: 'g3',
    title: 'Alumni Homecoming',
    thumb: img('reunion.jpg'),
    album: 'Homecoming',
    year: 2003,
    type: 'photo',
    featured: false,
    uploaded: '2026-06-15',
    size: '3.1 MB',
  },

  {
    id: 'g4',
    title: 'Graduating Sets Together',
    thumb: img('class-photograph.jpg'),
    album: 'Graduating Sets',
    year: 2008,
    type: 'photo',
    featured: true,
    uploaded: '2026-06-18',
    size: '2.0 MB',
  },

  {
    id: 'g5',
    title: 'ASTECAA Executive Committee',
    thumb: img('ASTECAA.jpg'),
    album: 'Leadership',
    year: 2012,
    type: 'photo',
    featured: false,
    uploaded: '2026-06-20',
    size: '1.9 MB',
  },

  {
    id: 'g6',
    title: 'Alumni Career Forum',
    thumb: img('reading-room.jpg'),
    album: 'Networking',
    year: 2016,
    type: 'photo',
    featured: true,
    uploaded: '2026-06-22',
    size: '2.8 MB',
  },

  {
    id: 'g7',
    title: 'Giving Back to ASTEC',
    thumb: img('market-stalls.jpg'),
    album: 'Community Projects',
    year: 2018,
    type: 'photo',
    featured: false,
    uploaded: '2026-06-25',
    size: '2.7 MB',
  },

  {
    id: 'g8',
    title: 'Alumni Sports Day',
    thumb: img('market-stalls.jpg'),
    album: 'Sports & Family',
    year: 2019,
    type: 'photo',
    featured: true,
    uploaded: '2026-07-01',
    size: '3.4 MB',
  },

  {
    id: 'g9',
    title: 'Mentorship with the Next Generation',
    thumb: img('reading-room.jpg'),
    album: 'Mentorship',
    year: 2021,
    type: 'photo',
    featured: false,
    uploaded: '2026-07-03',
    size: '2.2 MB',
  },

  {
    id: 'g10',
    title: 'ASTECAA Annual General Meeting',
    thumb: img('ASTECAA.jpg'),
    album: 'AGM',
    year: 2022,
    type: 'photo',
    featured: false,
    uploaded: '2026-07-05',
    size: '2.6 MB',
  },

  {
    id: 'g11',
    title: 'Alumni Reunion Dinner',
    thumb: img('open-fire-feast.jpg'),
    album: 'Reunions',
    year: 2024,
    type: 'photo',
    featured: true,
    uploaded: '2026-07-08',
    size: '3.4 MB',
  },

  {
    id: 'g12',
    title: 'ASTECAA Homecoming 2025',
    thumb: img('reunion.jpg'),
    album: 'Homecoming',
    year: 2025,
    type: 'video',
    featured: true,
    uploaded: '2026-07-10',
    size: '42.8 MB',
  },

  {
    id: 'g13',
    title: 'ASTECAA Alumni Reunion 2026',
    thumb: img('reunion.jpg'),
    album: 'Reunions',
    year: 2026,
    type: 'photo',
    featured: true,
    uploaded: '2026-07-18',
    size: '3.8 MB',
  },

  {
    id: 'g14',
    title: 'Career & Networking Forum 2026',
    thumb: img('reading-room.jpg'),
    album: 'Networking',
    year: 2026,
    type: 'photo',
    featured: false,
    uploaded: '2026-07-20',
    size: '2.9 MB',
  },

  {
    id: 'g15',
    title: 'ASTECAA Annual General Meeting 2026',
    thumb: img('ASTECAA.jpg'),
    album: 'AGM',
    year: 2026,
    type: 'photo',
    featured: false,
    uploaded: '2026-07-22',
    size: '2.5 MB',
  },

  {
    id: 'g16',
    title: 'Alumni Stories & Memories',
    thumb: img('voices-oral-history.jpg'),
    album: 'Alumni Stories',
    year: 2026,
    type: 'video',
    featured: false,
    uploaded: '2026-07-25',
    size: '36.4 MB',
  },
];

export const ADMIN_STORIES: AdminStory[] = [
  {
    id: 's1',
    title: 'From ASTEC to the World',
    excerpt:
      'Across different graduating sets, ASTECAA alumni have built careers, businesses, and communities while carrying the values of their school with them.',
    author: 'Daniel Okonkwo',
    authorAvatar: img('avatar-daniel.jpg'),
    category: 'Alumni Journey',
    status: 'published',
    date: '2026-07-10',
    views: 2841,
    comments: 42,
    cover: img('ASTECAA.jpg'),
  },

  {
    id: 's2',
    title: 'The Memories We Still Carry',
    excerpt:
      'Old classrooms, familiar faces, school assemblies, friendships, and the moments that made our years at ASTEC unforgettable.',
    author: 'Daniel Okonkwo',
    authorAvatar: img('avatar-daniel.jpg'),
    category: 'Memories',
    status: 'published',
    date: '2026-07-05',
    views: 1923,
    comments: 28,
    cover: img('reading-room.jpg'),
  },

  {
    id: 's3',
    title: 'Why ASTECAA Still Matters',
    excerpt:
      'Years after graduation, the alumni bond continues to create opportunities for connection, mentorship, support, and meaningful contribution.',
    author: 'Chinedu Okafor',
    authorAvatar: img('avatar-daniel.jpg'),
    category: 'Community',
    status: 'published',
    date: '2026-06-28',
    views: 3672,
    comments: 67,
    cover: img('reunion.jpg'),
  },

  {
    id: 's4',
    title: 'Building the Next Generation',
    excerpt:
      'How ASTECAA alumni are using their experience and professional knowledge to mentor students, guide young graduates, and create new opportunities.',
    author: 'ASTECAA Education Committee',
    authorAvatar: img('avatar-daniel.jpg'),
    category: 'Mentorship',
    status: 'draft',
    date: '2026-07-18',
    views: 0,
    comments: 0,
    cover: img('reading-room.jpg'),
  },

  {
    id: 's5',
    title: 'Remembering Those Who Came Before Us',
    excerpt:
      'A tribute to the teachers, classmates, and alumni whose contributions helped shape the ASTEC community and the generations that followed.',
    author: 'Marlene Whitfield',
    authorAvatar: img('avatar-marlene.jpg'),
    category: 'Tribute',
    status: 'published',
    date: '2026-06-20',
    views: 4108,
    comments: 91,
    cover: img('class-photograph.jpg'),
  },

  {
    id: 's6',
    title: 'Our Legacy, Our Responsibility',
    excerpt:
      'A look at the projects, ideas, and commitments that can help ASTECAA preserve its history while investing in the future of ASTEC and its alumni.',
    author: 'ASTECAA Executive Committee',
    authorAvatar: img('avatar-daniel.jpg'),
    category: 'Legacy',
    status: 'draft',
    date: '2026-07-22',
    views: 0,
    comments: 0,
    cover: img('reunion.jpg'),
  },
];

export const ADMIN_COMMENTS: AdminComment[] = [
  {
    id: 'c1',
    author: 'Grace Nwankwo',
    avatar: img('avatar-grace.jpg'),
    message:
      'I graduated many years ago, but reconnecting with former classmates through ASTECAA made it feel like we had never been apart. There is something special about meeting people who shared the same classrooms, teachers, and memories.',
    page: 'ASTECAA Annual Alumni Reunion 2026',
    date: '2026-07-14',
    status: 'approved',
    likes: 89,
    reports: 0,
  },

  {
    id: 'c2',
    author: 'Samuel Eze',
    avatar: img('avatar-samuel.jpg'),
    message:
      'I never imagined that a school photograph from my graduating year would bring back so many memories. Seeing familiar faces again reminded me of how far we have all come and how important it is to keep these connections alive.',
    page: 'Gallery',
    date: '2026-07-12',
    status: 'approved',
    likes: 158,
    reports: 0,
  },

  {
    id: 'c3',
    author: 'Emmanuel Adeyemi',
    avatar: img('avatar-emmanuel.jpg'),
    message:
      'ASTECAA has shown me that an alumni association is more than a network. It is a community where we can support one another, celebrate our achievements, and give back to the institution that helped shape us.',
    page: 'ASTECAA Community',
    date: '2026-07-09',
    status: 'approved',
    likes: 211,
    reports: 0,
  },

  {
    id: 'c4',
    author: 'Anonymous',
    avatar: img('avatar-daniel.jpg'),
    message:
      'This message contains promotional content unrelated to ASTECAA and has been removed by the moderation team.',
    page: 'Community Wall',
    date: '2026-07-15',
    status: 'spam',
    likes: 0,
    reports: 3,
  },

  {
    id: 'c5',
    author: 'Esther Chukwu',
    avatar: img('avatar-esther.jpg'),
    message:
      'One of my fondest memories of ASTEC is the sense of family among students and teachers. Years later, those friendships remain strong. I am looking forward to seeing more members of my set at the reunion.',
    page: 'ASTECAA Annual Alumni Reunion 2026',
    date: '2026-07-05',
    status: 'pending',
    likes: 0,
    reports: 0,
  },

  {
    id: 'c6',
    author: 'Chinedu Okafor',
    avatar: img('avatar-chinedu.jpg'),
    message:
      'The goal should be to make sure the next generation benefits from the same opportunities, discipline, and values that shaped us. I am especially excited about the mentorship and scholarship initiatives.',
    page: 'ASTECAA Mentorship & Scholarship Day',
    date: '2026-07-01',
    status: 'pending',
    likes: 0,
    reports: 0,
  },

  {
    id: 'c7',
    author: 'Concerned Alumni',
    avatar: img('avatar-daniel.jpg'),
    message:
      'Please ensure that important decisions, project updates, and financial information are communicated clearly to members. Transparency will help strengthen confidence in the association.',
    page: 'ASTECAA Annual General Meeting 2026',
    date: '2026-07-16',
    status: 'reported',
    likes: 1,
    reports: 5,
  },

  {
    id: 'c8',
    author: 'Grace Nwankwo',
    avatar: img('avatar-grace.jpg'),
    message:
      'Will alumni living outside Owerrinta be able to participate in the reunion and other ASTECAA programmes remotely? It would be wonderful to include members who cannot attend physically.',
    page: 'ASTECAA Annual Alumni Reunion 2026',
    date: '2026-07-13',
    status: 'pending',
    likes: 0,
    reports: 0,
  },
];

export const ADMIN_NOTIFICATIONS: AdminNotification[] = [
  { id: 'n1', type: 'comment', text: 'Aisha Patel asked about recording availability on Voices Evening', time: '12 min ago', unread: true },
  { id: 'n2', type: 'user', text: 'Caleb Roux requested an account as Gallery Manager', time: '1 hr ago', unread: true },
  { id: 'n3', type: 'comment', text: 'A comment on the Community Wall was reported 5 times', time: '3 hr ago', unread: true },
  { id: 'n4', type: 'gallery', text: 'Lila Okonkwo uploaded 3 new photos to the Harvest album', time: '5 hr ago', unread: false },
  { id: 'n5', type: 'event', text: 'Harvest Heritage Festival reached 80% capacity', time: 'yesterday', unread: false },
  { id: 'n6', type: 'system', text: 'Weekly backup of the archive completed successfully', time: 'yesterday', unread: false },
  { id: 'n7', type: 'user', text: 'George Alcott requested an account as Editor', time: '2 days ago', unread: false },
];

export const ADMIN_ACTIVITY: AdminActivity[] = [
  {
    id: 'a1',
    user: 'Chinedu Okafor',
    avatar: img('avatar-chinedu.jpg'),
    action: 'updated the event',
    target: 'ASTECAA Annual Alumni Reunion 2026',
    time: '12 min ago',
    icon: '📅',
  },
  {
    id: 'a2',
    user: 'Grace Nwankwo',
    avatar: img('avatar-grace.jpg'),
    action: 'registered for',
    target: 'ASTECAA Career & Networking Forum',
    time: '47 min ago',
    icon: '✓',
  },
  {
    id: 'a3',
    user: 'Emmanuel Adeyemi',
    avatar: img('avatar-emmanuel.jpg'),
    action: 'uploaded photos to',
    target: 'Alumni Gallery',
    time: '2 hr ago',
    icon: '🖼',
  },
  {
    id: 'a4',
    user: 'Chinedu Okafor',
    avatar: img('avatar-chinedu.jpg'),
    action: 'approved a community message by',
    target: 'Esther Chukwu',
    time: '3 hr ago',
    icon: '✓',
  },
  {
    id: 'a5',
    user: 'Esther Chukwu',
    avatar: img('avatar-esther.jpg'),
    action: 'published a story',
    target: 'Remembering Our School Days',
    time: '5 hr ago',
    icon: '✎',
  },
  {
    id: 'a6',
    user: 'Chinedu Okafor',
    avatar: img('avatar-chinedu.jpg'),
    action: 'pinned a message on',
    target: 'Alumni Community Wall',
    time: 'yesterday',
    icon: '★',
  },
  {
    id: 'a7',
    user: 'Samuel Eze',
    avatar: img('avatar-samuel.jpg'),
    action: 'registered for',
    target: 'ASTECAA Annual General Meeting 2026',
    time: 'yesterday',
    icon: '📅',
  },
];

export const ADMIN_CONTACT: AdminContactMsg[] = [
  {
    id: 'm1',
    name: 'Grace Nwankwo',
    email: 'grace.nwankwo@example.com',
    subject: 'Submitting old ASTEC photographs',
    message:
      'I have several photographs from my time at ASTEC, including my graduating set and some old school events. I would like to know how I can submit them to the ASTECAA archive.',
    date: '2026-07-26',
    status: 'new',
  },
  {
    id: 'm2',
    name: 'Emmanuel Adeyemi',
    email: 'emmanuel.adeyemi@example.com',
    subject: 'ASTECAA Annual Reunion',
    message:
      'I would like to confirm the programme and registration details for the ASTECAA Annual Alumni Reunion 2026. I am looking forward to reconnecting with members of my graduating set.',
    date: '2026-07-24',
    status: 'read',
  },
  {
    id: 'm3',
    name: 'Esther Chukwu',
    email: 'esther.chukwu@example.com',
    subject: 'Career & Networking Forum',
    message:
      'I am interested in participating in the ASTECAA Career & Networking Forum as a mentor. Please let me know how alumni professionals can volunteer for the mentorship sessions.',
    date: '2026-07-22',
    status: 'replied',
  },
  {
    id: 'm4',
    name: 'Samuel Eze',
    email: 'samuel.eze@example.com',
    subject: 'Supporting ASTECAA projects',
    message:
      'I would like to learn more about the projects ASTECAA is currently supporting at the school and how alumni can contribute financially or through professional services.',
    date: '2026-07-20',
    status: 'replied',
  },
  {
    id: 'm5',
    name: 'Aisha Patel',
    email: 'aisha.patel@example.com',
    subject: 'ASTECAA Mentorship & Scholarship Day',
    message:
      'I would like to volunteer for the ASTECAA Mentorship & Scholarship Day. I have experience in career mentoring and would be happy to support students and young alumni during the programme.',
    date: '2026-07-18',
    status: 'closed',
  },
];

export interface RolePermission {
  role: Role;
  users: boolean;
  events: boolean;
  gallery: boolean;
  stories: boolean;
  comments: boolean;
  announcements: boolean;
  settings: boolean;
  members: number;
  color: string;
}

export const ADMIN_ROLES: RolePermission[] = [
  {
    role: 'Super Administrator',
    users: true,
    events: true,
    gallery: true,
    stories: true,
    comments: true,
    announcements: true,
    settings: true,
    members: 2,
    color: 'burgundy',
  },

  {
    role: 'Content Manager',
    users: false,
    events: true,
    gallery: true,
    stories: true,
    comments: true,
    announcements: true,
    settings: false,
    members: 2,
    color: 'gold',
  },

  {
    role: 'Event Manager',
    users: false,
    events: true,
    gallery: false,
    stories: false,
    comments: false,
    announcements: true,
    settings: false,
    members: 2,
    color: 'forest',
  },

  {
    role: 'Community Moderator',
    users: false,
    events: false,
    gallery: false,
    stories: false,
    comments: true,
    announcements: false,
    settings: false,
    members: 2,
    color: 'info',
  },

  {
    role: 'Gallery Manager',
    users: false,
    events: false,
    gallery: true,
    stories: false,
    comments: false,
    announcements: false,
    settings: false,
    members: 1,
    color: 'info',
  },

  {
    role: 'Editor',
    users: false,
    events: false,
    gallery: false,
    stories: true,
    comments: true,
    announcements: true,
    settings: false,
    members: 2,
    color: 'info',
  },

  {
    role: 'Membership Manager',
    users: false,
    events: false,
    gallery: false,
    stories: false,
    comments: false,
    announcements: true,
    settings: false,
    members: 1,
    color: 'forest',
  },
];

export interface ChartPoint { label: string; value: number; }
export const GROWTH_DATA: ChartPoint[] = [
  { label: 'Jan', value: 1240 }, { label: 'Feb', value: 1380 }, { label: 'Mar', value: 1490 },
  { label: 'Apr', value: 1620 }, { label: 'May', value: 1810 }, { label: 'Jun', value: 2050 },
  { label: 'Jul', value: 2380 },
];
export const ENGAGEMENT_DATA: ChartPoint[] = [
  { label: 'Mon', value: 320 }, { label: 'Tue', value: 410 }, { label: 'Wed', value: 480 },
  { label: 'Thu', value: 390 }, { label: 'Fri', value: 620 }, { label: 'Sat', value: 880 },
  { label: 'Sun', value: 740 },
];
export const TRAFFIC_DATA: ChartPoint[] = [
  { label: 'W1', value: 4200 }, { label: 'W2', value: 5100 }, { label: 'W3', value: 4800 },
  { label: 'W4', value: 6300 }, { label: 'W5', value: 7200 }, { label: 'W6', value: 8900 },
];

export const ADMIN_NAV = [
  {
    section: 'Overview',
    items: [
      { label: 'Dashboard', path: '/admin/dashboard', icon: '◈' },
    ],
  },
  {
    section: 'Content',
    items: [
      { label: 'Events', path: '/admin/events', icon: '📅', badge: 6 },
      { label: 'Gallery', path: '/admin/gallery', icon: '🖼' },
      { label: 'Stories', path: '/admin/stories', icon: '✎' },
      { label: 'Comments', path: '/admin/comments', icon: '💬', badge: 4 },
      { label: 'Announcements', path: '/admin/announcements', icon: '📢' },
    ],
  },
  {
    section: 'People',
    items: [
      { label: 'Users', path: '/admin/users', icon: '👥' },
      { label: 'Contact', path: '/admin/contact', icon: '✉', badge: 1 },
    ],
  },
  {
    section: 'Voting',
    items: [
      { label: 'Elections', path: '/admin/voting', icon: '🗳' },
      { label: 'Results', path: '/admin/voting-results', icon: '📊' },
    ],
  },
  {
    section: 'System',
    items: [
      { label: 'Homepage', path: '/admin/homepage', icon: '⌂' },
      { label: 'Media Library', path: '/admin/media', icon: '🗂' },
      { label: 'Settings', path: '/admin/settings', icon: '⚙' },
      { label: 'Roles', path: '/admin/roles', icon: '🛡' },
    ],
  },
];
