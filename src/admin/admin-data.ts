export type Role =
  | 'Super Administrator'
  | 'Content Manager'
  | 'Event Manager'
  | 'Community Moderator'
  | 'Gallery Manager'
  | 'Editor';

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
  name: 'Marlene Whitfield',
  role: 'Super Administrator',
  avatar: img('avatar-marlene.jpg'),
};

export const ADMIN_USERS: AdminUser[] = [
  { id: 'u1', name: 'Marlene Whitfield', email: 'marlene@echoes.example', avatar: img('avatar-marlene.jpg'), role: 'Super Administrator', status: 'active', joined: '2014-03-02', lastActive: '2 min ago', events: 38, posts: 142 },
  { id: 'u2', name: 'Daniel Okonkwo', email: 'daniel@echoes.example', avatar: img('avatar-daniel.jpg'), role: 'Content Manager', status: 'active', joined: '2020-01-14', lastActive: '1 hr ago', events: 12, posts: 86 },
  { id: 'u3', name: 'Imelda Fossett', email: 'imelda@echoes.example', avatar: img('avatar-imelda.jpg'), role: 'Event Manager', status: 'active', joined: '2004-09-22', lastActive: '3 hr ago', events: 64, posts: 23 },
  { id: 'u4', name: 'Theodore Marsh', email: 'theo@echoes.example', avatar: img('avatar-theodore.jpg'), role: 'Editor', status: 'active', joined: '2018-05-11', lastActive: 'yesterday', events: 8, posts: 54 },
  { id: 'u5', name: 'Hannah Brey', email: 'hannah@example.com', avatar: img('avatar-marlene.jpg'), role: 'Community Moderator', status: 'active', joined: '2022-07-30', lastActive: '5 min ago', events: 0, posts: 31 },
  { id: 'u6', name: 'George Alcott', email: 'george@example.com', avatar: img('avatar-daniel.jpg'), role: 'Editor', status: 'pending', joined: '2026-07-12', lastActive: 'never', events: 0, posts: 0 },
  { id: 'u7', name: 'Lila Okonkwo', email: 'lila@example.com', avatar: img('reading-room.jpg'), role: 'Gallery Manager', status: 'active', joined: '2023-02-18', lastActive: '4 hr ago', events: 0, posts: 12 },
  { id: 'u8', name: 'Tom Vetch', email: 'tom@example.com', avatar: img('avatar-theodore.jpg'), role: 'Community Moderator', status: 'suspended', joined: '2021-11-04', lastActive: '2 weeks ago', events: 0, posts: 7 },
  { id: 'u9', name: 'Aisha Patel', email: 'aisha@example.com', avatar: img('avatar-imelda.jpg'), role: 'Event Manager', status: 'active', joined: '2024-06-01', lastActive: '20 min ago', events: 14, posts: 9 },
  { id: 'u10', name: 'Caleb Roux', email: 'caleb@example.com', avatar: img('avatar-daniel.jpg'), role: 'Gallery Manager', status: 'pending', joined: '2026-07-20', lastActive: 'never', events: 0, posts: 0 },
];

export const ADMIN_EVENTS: AdminEvent[] = [
{
  id: 'worship-concert-2026',
  title: 'Sounds of Worship Concert 2026',
  date: '2026-11-14',
  venue: 'City Convention Arena',
  category: 'Concert',
  status: 'published',
  registered: 3248,
  capacity: 5000,
  featured: true,
  poster: img('music.jpg'),
},  { id: 'voices-oral-history-2026', title: 'Voices: An Oral History Evening', date: '2026-10-11', venue: 'Community Hall', category: 'Storytelling', status: 'published', registered: 96, capacity: 120, featured: false, poster: img('voices-oral-history.jpg') },
  { id: 'winter-carol-night-2026', title: 'Winter Carol Night', date: '2026-12-19', venue: 'Town Square', category: 'Concert', status: 'published', registered: 611, capacity: 800, featured: true, poster: img('concert.jpg') },
  { id: 'spring-reunion-2027', title: 'Spring Alumni Reunion', date: '2027-04-24', venue: 'Maple Hollow High', category: 'Reunion', status: 'scheduled', registered: 287, capacity: 500, featured: false, poster: img('reunion.jpg') },
  { id: 'archive-open-day', title: 'Archive Open Day', date: '2026-08-09', venue: 'Community Hall', category: 'Community', status: 'draft', registered: 0, capacity: 200, featured: false, poster: img('market-stalls.jpg') },
  { id: 'remembrance-chapel', title: 'Remembrance Chapel', date: '2027-04-25', venue: 'St. Aldous Chapel', category: 'Community', status: 'draft', registered: 0, capacity: 300, featured: false, poster: img('square-at-dusk.jpg') },
];

export const ADMIN_GALLERY: AdminGalleryItem[] = [
  { id: 'g1', title: 'The First Harvest Table', thumb: img('harvest-table.jpg'), album: 'Harvest', year: 1988, type: 'photo', featured: true, uploaded: '2026-06-12', size: '2.4 MB' },
  { id: 'g2', title: 'Choir in the Snow', thumb: img('concert.jpg'), album: 'Carols', year: 2026, type: 'photo', featured: true, uploaded: '2026-06-12', size: '1.8 MB' },
  { id: 'g3', title: 'Fiddle Circle', thumb: img('fiddle-circle.jpg'), album: 'Harvest', year: 2003, type: 'photo', featured: false, uploaded: '2026-06-15', size: '3.1 MB' },
  { id: 'g4', title: 'Grandmother\'s Hands', thumb: img('voices-oral-history.jpg'), album: 'Voices', year: 1995, type: 'photo', featured: true, uploaded: '2026-06-18', size: '2.0 MB' },
  { id: 'g5', title: 'The Old Gymnasium', thumb: img('reunion.jpg'), album: 'Reunions', year: 1982, type: 'photo', featured: false, uploaded: '2026-06-20', size: '1.6 MB' },
  { id: 'g6', title: 'Lantern Procession', thumb: img('lantern-procession.jpg'), album: 'Harvest', year: 2019, type: 'video', featured: true, uploaded: '2026-06-22', size: '48.2 MB' },
  { id: 'g7', title: 'The Market Stalls', thumb: img('market-stalls.jpg'), album: 'Harvest', year: 2010, type: 'photo', featured: false, uploaded: '2026-06-25', size: '2.7 MB' },
  { id: 'g8', title: 'Class of \'64', thumb: img('ASTECAA.jpg'), album: 'Reunions', year: 1964, type: 'photo', featured: true, uploaded: '2026-07-01', size: '1.9 MB' },
  { id: 'g9', title: 'Tea & Stories', thumb: img('tea-stories.jpg'), album: 'Voices', year: 2018, type: 'photo', featured: false, uploaded: '2026-07-03', size: '2.2 MB' },
  { id: 'g10', title: 'Square at Dusk', thumb: img('square-at-dusk.jpg'), album: 'Carols', year: 1992, type: 'video', featured: false, uploaded: '2026-07-05', size: '32.6 MB' },
  { id: 'g11', title: 'Open Fire Feast', thumb: img('open-fire-feast.jpg'), album: 'Harvest', year: 2015, type: 'photo', featured: false, uploaded: '2026-07-08', size: '3.4 MB' },
  { id: 'g12', title: 'The Reading Room', thumb: img('square-at-dusk.jpg'), album: 'Voices', year: 2001, type: 'photo', featured: false, uploaded: '2026-07-10', size: '1.5 MB' },
];

export const ADMIN_STORIES: AdminStory[] = [
  { id: 's1', title: 'The Supper That Started It All', excerpt: 'In the autumn of 1993, twenty-three families carried a table made of barn planks into the old orchard…', author: 'Daniel Okonkwo', authorAvatar: img('avatar-daniel.jpg'), category: 'History', status: 'published', date: '2026-07-10', views: 2841, comments: 42, cover: img('ASTECAA.jpg') },
  { id: 's2', title: 'Voices: Preserving the Spoken Word', excerpt: 'How a borrowed cassette deck in 1995 became the start of our oral history archive…', author: 'Daniel Okonkwo', authorAvatar: img('avatar-daniel.jpg'), category: 'Archive', status: 'published', date: '2026-07-05', views: 1923, comments: 28, cover: img('voices-oral-history.jpg') },
  { id: 's3', title: 'A Century of Carol Nights', excerpt: 'From an informal sing-along to a candlelit tradition that has endured for over a hundred years…', author: 'Imelda Fossett', authorAvatar: img('avatar-imelda.jpg'), category: 'Tradition', status: 'published', date: '2026-06-28', views: 3672, comments: 67, cover: img('concert.jpg') },
  { id: 's4', title: 'The Lantern Walk', excerpt: 'A draft about how the orchard procession became the closing rite of the harvest festival…', author: 'Theodore Marsh', authorAvatar: img('avatar-theodore.jpg'), category: 'Festival', status: 'draft', date: '2026-07-18', views: 0, comments: 0, cover: img('lantern-procession.jpg') },
  { id: 's5', title: 'Remembering Mrs. Aldous', excerpt: 'A tribute to the woman whose voice anchored the Voices programme for three decades…', author: 'Marlene Whitfield', authorAvatar: img('avatar-marlene.jpg'), category: 'Tribute', status: 'published', date: '2026-06-20', views: 4108, comments: 91, cover: img('tea-stories.jpg') },
  { id: 's6', title: 'The Class Boards Project', excerpt: 'A draft for the upcoming restoration of the century-old class photograph boards…', author: 'Theodore Marsh', authorAvatar: img('avatar-theodore.jpg'), category: 'Archive', status: 'draft', date: '2026-07-22', views: 0, comments: 0, cover: img('reunion.jpg') },
];

export const ADMIN_COMMENTS: AdminComment[] = [
  { id: 'c1', author: 'Hannah Brey', avatar: img('avatar-imelda.jpg'), message: 'My grandmother sang in the choir for forty-one years. The first carol night without her, the choir sang her favourite — and the whole square did too.', page: 'Winter Carol Night', date: '2026-07-14', status: 'approved', likes: 142, reports: 0 },
  { id: 'c2', author: 'George Alcott', avatar: img('avatar-theodore.jpg'), message: 'I left in 1983 and have not been back. Finding these photographs — the old gym, the market stalls — I am twenty again.', page: 'Gallery', date: '2026-07-12', status: 'approved', likes: 89, reports: 0 },
{
  id: 'c3',
  author: 'Sarah Johnson',
  avatar: img('avatar-daniel.jpg'),
  message: 'Sounds of Worship Concert 20265 was an incredible experience. The atmosphere of worship, the live performances, and the powerful message left a lasting impact on me. I cannot wait to attend again this year!',
  page: 'Sounds of Worship Concert 2026',
  date: '2026-09-28',
  status: 'approved',
  likes: 211,
  reports: 0,
},
{
  id: 'c4',
  author: 'Anonymous',
  avatar: img('reading-room.jpg'),
  message: 'This concert is overrated. Visit my website for better events: [link removed]',
  page: 'Sounds of Worship Concert 2026',
  date: '2026-10-05',
  status: 'spam',
  likes: 0,
  reports: 3,
},  { id: 'c5', author: 'Lila Okonkwo', avatar: img('avatar-marlene.jpg'), message: 'Listening to the Voices recording of Mrs. Aldous, I heard my own grandmother\'s way of speaking.', page: 'Voices Evening', date: '2026-07-05', status: 'pending', likes: 0, reports: 0 },
  { id: 'c6', author: 'Tom Vetch', avatar: img('avatar-theodore.jpg'), message: 'I am in the class of \'64 photograph — back row, third from the left, the one grinning.', page: 'Gallery', date: '2026-07-01', status: 'pending', likes: 0, reports: 0 },
  { id: 'c7', author: 'Concerned Visitor', avatar: img('avatar-daniel.jpg'), message: 'This comment contains language that may be offensive to some readers.', page: 'Community Wall', date: '2026-07-16', status: 'reported', likes: 1, reports: 5 },
  { id: 'c8', author: 'Aisha Patel', avatar: img('avatar-imelda.jpg'), message: 'Will there be a recording of the Voices evening available afterwards? I cannot attend in person.', page: 'Voices Evening', date: '2026-07-13', status: 'pending', likes: 0, reports: 0 },
];

export const ADMIN_NOTIFICATIONS: AdminNotification[] = [
  { id: 'n1', type: 'comment', text: 'Aisha Patel asked about recording availability on Voices Evening', time: '12 min ago', unread: true },
  { id: 'n2', type: 'user', text: 'Caleb Roux requested an account as Gallery Manager', time: '1 hr ago', unread: true },
  { id: 'n3', type: 'comment', text: 'A comment on the Community Wall was reported 5 times', time: '3 hr ago', unread: true },
  { id: 'n4', type: 'gallery', text: 'Lila Okonkwo uploaded 3 new photos to the Harvest album', time: '5 hr ago', unread: false },
{
  id: 'n5',
  type: 'event',
  text: 'Sounds of Worship Concert 2026 has reached 80% capacity',
  time: 'yesterday',
  unread: false,
},  { id: 'n6', type: 'system', text: 'Weekly backup of the archive completed successfully', time: 'yesterday', unread: false },
  { id: 'n7', type: 'user', text: 'George Alcott requested an account as Editor', time: '2 days ago', unread: false },
];

export const ADMIN_ACTIVITY: AdminActivity[] = [
  { id: 'a1', user: 'Daniel Okonkwo', avatar: img('avatar-daniel.jpg'), action: 'published a story', target: 'The Supper That Started It All', time: '12 min ago', icon: '✎' },
  { id: 'a2', user: 'Imelda Fossett', avatar: img('avatar-imelda.jpg'), action: 'updated the event', target: 'Winter Carol Night', time: '47 min ago', icon: '📅' },
  { id: 'a3', user: 'Lila Okonkwo', avatar: img('avatar-marlene.jpg'), action: 'uploaded 3 photos to', target: 'Harvest album', time: '2 hr ago', icon: '🖼' },
  { id: 'a4', user: 'Marlene Whitfield', avatar: img('avatar-marlene.jpg'), action: 'approved a comment by', target: 'Hannah Brey', time: '3 hr ago', icon: '✓' },
  { id: 'a5', user: 'Theodore Marsh', avatar: img('avatar-theodore.jpg'), action: 'saved a draft', target: 'The Lantern Walk', time: '5 hr ago', icon: '✎' },
  { id: 'a6', user: 'Marlene Whitfield', avatar: img('avatar-marlene.jpg'), action: 'pinned a message on', target: 'Community Wall', time: 'yesterday', icon: '★' },
  { id: 'a7', user: 'Aisha Patel', avatar: img('avatar-imelda.jpg'), action: 'created a new event', target: 'Archive Open Day', time: 'yesterday', icon: '📅' },
];

export const ADMIN_CONTACT: AdminContactMsg[] = [
  { id: 'm1', name: 'Eleanor Voss', email: 'eleanor@example.com', subject: 'I have photographs to donate', message: 'My late mother kept an album of the harvest festivals from the 1960s onwards. I would love to donate scans to the archive.', date: '2026-07-26', status: 'new' },
  { id: 'm2', name: 'Rev. Thomas Hale', email: 't.hale@parish.example', subject: 'Remembrance Chapel collaboration', message: 'We would like to discuss partnering on the remembrance service for the spring reunion weekend.', date: '2026-07-24', status: 'read' },
  { id: 'm3', name: 'Maya Singh', email: 'maya@press.example', subject: 'Press inquiry — feature on community archives', message: 'I am writing a feature for a regional magazine on living community archives and would love to interview the Echoes team.', date: '2026-07-22', status: 'replied' },
  { id: 'm4', name: 'Owen Frye', email: 'owen@example.com', subject: 'Volunteering for the harvest festival', message: 'I would like to help set up the lantern procession this year. I have experience with event logistics.', date: '2026-07-20', status: 'replied' },
  { id: 'm5', name: 'Bridget Cole', email: 'bridget@example.com', subject: 'Lost and found from the last reunion', message: 'I believe I left a shawl at the school during the spring reunion. Has anything been handed in?', date: '2026-07-18', status: 'closed' },
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
  { role: 'Super Administrator', users: true, events: true, gallery: true, stories: true, comments: true, announcements: true, settings: true, members: 2, color: 'burgundy' },
  { role: 'Content Manager', users: false, events: true, gallery: true, stories: true, comments: true, announcements: true, settings: false, members: 1, color: 'gold' },
  { role: 'Event Manager', users: false, events: true, gallery: false, stories: false, comments: false, announcements: false, settings: false, members: 2, color: 'forest' },
  { role: 'Community Moderator', users: false, events: false, gallery: false, stories: false, comments: true, announcements: false, settings: false, members: 2, color: 'info' },
  { role: 'Gallery Manager', users: false, events: false, gallery: true, stories: false, comments: false, announcements: false, settings: false, members: 2, color: 'info' },
  { role: 'Editor', users: false, events: false, gallery: false, stories: true, comments: true, announcements: false, settings: false, members: 2, color: 'info' },
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
    section: 'System',
    items: [
      { label: 'Homepage', path: '/admin/homepage', icon: '⌂' },
      { label: 'Media Library', path: '/admin/media', icon: '🗂' },
      { label: 'Settings', path: '/admin/settings', icon: '⚙' },
      { label: 'Roles', path: '/admin/roles', icon: '🛡' },
    ],
  },
];
