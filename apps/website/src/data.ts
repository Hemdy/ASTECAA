export interface EventItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  date: string; // ISO
  endDate?: string;
  time: string;
  venue: string;
  city: string;
  category: string;
  poster: string;
  banner: string;
  gallery: string[];
  schedule: { time: string; title: string; detail: string }[];
  organizer: string;
  organizerRole: string;
  organizerPhoto: string;
  capacity: number;
  registered: number;
  tags: string[];
}

export interface MemoryItem {
  id: string;
  title: string;
  year: number;
  event: string;
  image: string;
  caption: string;
  format: 'photo' | 'video';
  album: string;
}

export interface TimelineMilestone {
  id: string;
  year: number;
  title: string;
  story: string;
  image: string;
  quote?: string;
  quoteAuthor?: string;
  hasVideo?: boolean;
}

export interface CommunityMessage {
  id: string;
  author: string;
  location: string;
  avatar: string;
  message: string;
  date: string;
  likes: number;
  liked?: boolean;
  pinned?: boolean;
  replies?: CommunityMessage[];
}

export interface Organizer {
  id: string;
  name: string;
  role: string;
  photo: string;
  years: string;
  bio: string;
}

export interface Milestone {
  year: string;
  title: string;
  text: string;
}

const img = (file: string) => `/images/${file}`;

export const EVENTS: EventItem[] = [
  {
    id: 'astecaa-annual-reunion-2026',
    title: 'ASTECAA Annual Alumni Reunion 2026',
    subtitle: 'Reconnect. Celebrate. Give back.',
    description:
      'A gathering of ASTECAA alumni from different graduating sets to reconnect with old classmates, celebrate achievements, share memories, and strengthen the bond that unites us.',
    longDescription:
      'The ASTECAA Annual Alumni Reunion brings together graduates from across the years for a weekend of reconnection, celebration, and fellowship. Alumni will have the opportunity to reconnect with classmates, meet members from other sets, revisit memories from their school days, and discuss ways to contribute to the continued growth of ASTECAA and the school community. The programme includes alumni networking, class photographs, recognition of distinguished members, a gala dinner, and a special session celebrating the history and legacy of ASTECAA.',
    date: '2026-12-19',
    endDate: '2026-12-20',
    time: '10:00 AM - 8:00 PM',
    venue: 'ASTEC Campus',
    city: 'Owerrinta',
    category: 'Reunion',

    poster: img('reunion.jpg'),
    banner: img('reunion.jpg'),

    gallery: [
      img('reunion.jpg'),
      img('ASTECAA.jpg'),
      img('reading-room.jpg'),
      img('market-stalls.jpg'),
    ],

    schedule: [
      {
        time: '10:00 AM',
        title: 'Registration & Welcome',
        detail: 'Alumni registration, welcome packs, and reconnecting with fellow members.',
      },
      {
        time: '11:00 AM',
        title: 'Campus Walk',
        detail: 'A guided walk through familiar places and memorable spots around the school.',
      },
      {
        time: '1:00 PM',
        title: 'Alumni Networking',
        detail: 'Reconnect with classmates and meet alumni from other graduating sets.',
      },
      {
        time: '3:00 PM',
        title: 'ASTECAA Legacy Session',
        detail: 'A look at the history, achievements, and future direction of the association.',
      },
      {
        time: '5:00 PM',
        title: 'Recognition & Awards',
        detail: 'Celebrating alumni who have made outstanding contributions to their communities and professions.',
      },
      {
        time: '7:00 PM',
        title: 'Alumni Dinner',
        detail: 'An evening of fellowship, music, photographs, and shared memories.',
      },
    ],

    organizer: 'Chinedu Okafor',
    organizerRole: 'ASTECAA President',
    organizerPhoto: img(''),

    capacity: 500,
    registered: 287,

    tags: ['Reunion', 'Alumni', 'Networking', 'Annual Event'],
  },

  {
    id: 'astecaa-career-networking-2026',
    title: 'ASTECAA Career & Networking Forum',
    subtitle: 'Connecting experience with opportunity',
    description:
      'An interactive career forum bringing together ASTECAA professionals, entrepreneurs, young alumni, and recent graduates for mentorship, networking, and professional development.',
    longDescription:
      'The ASTECAA Career & Networking Forum creates a platform for alumni across different professions and generations to connect. Senior professionals and entrepreneurs will share practical lessons from their careers, while younger alumni and recent graduates can build meaningful professional relationships. The forum will include career conversations, mentorship opportunities, entrepreneurship discussions, and an open networking session.',
    date: '2026-09-26',
    time: '10:00 AM - 4:00 PM',
    venue: 'ASTEC Alumni Hall',
    city: 'Owerrinta',
    category: 'Networking',

    poster: img('reading-room.jpg'),
    banner: img('reading-room.jpg'),

    gallery: [
      img('reading-room.jpg'),
      img('reunion.jpg'),
      img('ASTECAA.jpg'),
    ],

    schedule: [
      {
        time: '10:00 AM',
        title: 'Registration & Networking',
        detail: 'Meet fellow alumni and connect with professionals across different industries.',
      },
      {
        time: '11:00 AM',
        title: 'Career Conversations',
        detail: 'Alumni leaders share lessons from their professional journeys.',
      },
      {
        time: '12:30 PM',
        title: 'Mentorship Session',
        detail: 'Young alumni connect with experienced professionals for guidance and advice.',
      },
      {
        time: '2:00 PM',
        title: 'Entrepreneurship Panel',
        detail: 'Alumni entrepreneurs discuss building businesses and creating opportunities.',
      },
      {
        time: '3:15 PM',
        title: 'Open Networking',
        detail: 'An informal opportunity to build professional connections.',
      },
    ],

    organizer: 'Chinedu Okafor',
    organizerRole: 'ASTECAA President',
    organizerPhoto: img(''),

    capacity: 250,
    registered: 164,

    tags: ['Networking', 'Career', 'Mentorship', 'Professional Development'],
  },

  {
    id: 'astecaa-agm-2026',
    title: 'ASTECAA Annual General Meeting 2026',
    subtitle: 'Reviewing our progress and shaping our future',
    description:
      'The annual meeting of ASTECAA members to review the association’s activities, discuss ongoing projects, receive financial reports, and agree on priorities for the coming year.',
    longDescription:
      'The ASTECAA Annual General Meeting provides members with an opportunity to review the progress of the association, receive reports from the leadership, discuss ongoing initiatives, and contribute ideas for the future. Members will receive updates on alumni projects, welfare initiatives, school support programmes, membership growth, and financial activities. The meeting will also provide an opportunity for members to raise questions and make proposals.',
    date: '2026-11-28',
    time: '11:00 AM - 3:00 PM',
    venue: 'ASTECAA Secretariat',
    city: 'Owerrinta',
    category: 'AGM',

    poster: img('ASTECAA.jpg'),
    banner: img('ASTECAA.jpg'),

    gallery: [
      img('ASTECAA.jpg'),
      img('reading-room.jpg'),
      img('reunion.jpg'),
    ],

    schedule: [
      {
        time: '11:00 AM',
        title: 'Registration',
        detail: 'Member registration and confirmation of attendance.',
      },
      {
        time: '11:30 AM',
        title: 'Opening Session',
        detail: 'Welcome address from the ASTECAA leadership.',
      },
      {
        time: '12:00 PM',
        title: 'Annual Reports',
        detail: 'Review of the association’s activities, projects, and financial position.',
      },
      {
        time: '1:00 PM',
        title: 'Members’ Forum',
        detail: 'Members share questions, proposals, and recommendations.',
      },
      {
        time: '2:00 PM',
        title: 'Future Priorities',
        detail: 'Discussion of upcoming programmes and ASTECAA development projects.',
      },
      {
        time: '2:45 PM',
        title: 'Closing',
        detail: 'Resolutions, announcements, and closing remarks.',
      },
    ],

    organizer: 'Chinedu Okafor',
    organizerRole: 'ASTECAA President',
    organizerPhoto: img(''),

    capacity: 300,
    registered: 192,

    tags: ['AGM', 'Members', 'Leadership', 'Association'],
  },

  {
    id: 'astecaa-fundraising-dinner-2027',
    title: 'ASTECAA Legacy & Fundraising Dinner 2027',
    subtitle: 'Celebrating our past, investing in the future',
    description:
      'A special evening bringing alumni, friends, and supporters together to celebrate ASTECAA’s legacy and raise support for projects that will benefit future generations.',
    longDescription:
      'The ASTECAA Legacy & Fundraising Dinner is an evening dedicated to celebrating the achievements of the alumni community while supporting projects that create lasting impact. Alumni and invited guests will gather for dinner, recognition of outstanding members, stories from different generations, and the presentation of priority projects requiring alumni support. Contributions from the event will support approved ASTECAA initiatives and programmes.',
    date: '2027-02-27',
    time: '6:00 PM - 11:00 PM',
    venue: 'Grand Event Centre',
    city: 'Owerrinta',
    category: 'Fundraiser',

    poster: img('open-fire-feast.jpg'),
    banner: img('open-fire-feast.jpg'),

    gallery: [
      img('open-fire-feast.jpg'),
      img('reunion.jpg'),
      img('ASTECAA.jpg'),
      img('market-stalls.jpg'),
    ],

    schedule: [
      {
        time: '6:00 PM',
        title: 'Red Carpet & Welcome',
        detail: 'Guest arrival, photographs, and welcome reception.',
      },
      {
        time: '7:00 PM',
        title: 'Opening Dinner',
        detail: 'Welcome remarks and dinner service.',
      },
      {
        time: '8:00 PM',
        title: 'ASTECAA Legacy Stories',
        detail: 'Alumni share memorable stories from their school and professional journeys.',
      },
      {
        time: '8:45 PM',
        title: 'Recognition of Alumni',
        detail: 'Celebrating distinguished alumni and outstanding contributions.',
      },
      {
        time: '9:15 PM',
        title: 'Fundraising Presentation',
        detail: 'Presentation of priority ASTECAA projects and opportunities to support them.',
      },
      {
        time: '10:00 PM',
        title: 'Alumni Celebration',
        detail: 'Music, networking, photographs, and continued fellowship.',
      },
    ],

    organizer: 'ASTECAA Executive Committee',
    organizerRole: 'Alumni Association',
    organizerPhoto: img(''),

    capacity: 400,
    registered: 236,

    tags: ['Fundraiser', 'Dinner', 'Alumni', 'Legacy'],
  },

  {
    id: 'astecaa-sports-day-2027',
    title: 'ASTECAA Alumni Sports & Family Day',
    subtitle: 'Old friends. New memories. One ASTECAA family.',
    description:
      'A relaxed day of football, athletics, games, family activities, and fellowship bringing alumni and their families together.',
    longDescription:
      'ASTECAA Sports & Family Day is a celebration of friendship, fitness, and community. Alumni from different graduating sets will compete in friendly football matches, relay races, volleyball, and other recreational activities. Families are welcome, with activities planned for children and adults throughout the day. The focus is simple: reconnect, have fun, and strengthen the relationships that make ASTECAA a family.',
    date: '2027-04-17',
    time: '9:00 AM - 5:00 PM',
    venue: 'ASTEC Sports Field',
    city: 'Owerrinta',
    category: 'Sports',

    poster: img('market-stalls.jpg'),
    banner: img('market-stalls.jpg'),

    gallery: [
      img('market-stalls.jpg'),
      img('reunion.jpg'),
      img('ASTECAA.jpg'),
    ],

    schedule: [
      {
        time: '9:00 AM',
        title: 'Arrival & Registration',
        detail: 'Alumni and families arrive and collect event materials.',
      },
      {
        time: '10:00 AM',
        title: 'Opening Ceremony',
        detail: 'Welcome remarks and team introductions.',
      },
      {
        time: '10:30 AM',
        title: 'Alumni Football',
        detail: 'Friendly matches between graduating sets.',
      },
      {
        time: '1:00 PM',
        title: 'Family Games',
        detail: 'Fun activities for alumni, families, and children.',
      },
      {
        time: '2:30 PM',
        title: 'Final Matches',
        detail: 'Final sporting activities and friendly competitions.',
      },
      {
        time: '4:00 PM',
        title: 'Awards & Closing',
        detail: 'Presentation of medals, photographs, and closing fellowship.',
      },
    ],

    organizer: 'ASTECAA Social & Welfare Committee',
    organizerRole: 'Events Committee',
    organizerPhoto: img(''),

    capacity: 600,
    registered: 341,

    tags: ['Sports', 'Family', 'Alumni', 'Football', 'Community'],
  },

  {
    id: 'astecaa-mentorship-day-2027',
    title: 'ASTECAA Mentorship & Scholarship Day',
    subtitle: 'Inspiring the next generation',
    description:
      'An alumni-led mentorship programme connecting students and young graduates with ASTECAA professionals while supporting educational opportunities for deserving students.',
    longDescription:
      'The ASTECAA Mentorship & Scholarship Day reflects the association’s commitment to giving back. Alumni professionals from different fields will spend the day engaging students and young graduates through career talks, mentoring sessions, and practical conversations about education and work. The programme will also recognise scholarship beneficiaries and highlight ways alumni can support future educational initiatives.',
    date: '2027-06-12',
    time: '10:00 AM - 3:00 PM',
    venue: 'ASTEC Assembly Hall',
    city: 'Owerrinta',
    category: 'Mentorship',

    poster: img('reading-room.jpg'),
    banner: img('reading-room.jpg'),

    gallery: [
      img('reading-room.jpg'),
      img('ASTECAA.jpg'),
      img('reunion.jpg'),
    ],

    schedule: [
      {
        time: '10:00 AM',
        title: 'Welcome',
        detail: 'Introduction to the ASTECAA mentorship programme.',
      },
      {
        time: '10:30 AM',
        title: 'Career Talks',
        detail: 'Alumni professionals share their experiences and lessons.',
      },
      {
        time: '12:00 PM',
        title: 'Mentorship Circles',
        detail: 'Small-group conversations between students and alumni mentors.',
      },
      {
        time: '1:00 PM',
        title: 'Scholarship Presentation',
        detail: 'Recognition and presentation to scholarship beneficiaries.',
      },
      {
        time: '2:00 PM',
        title: 'Questions & Networking',
        detail: 'Open conversation between students, alumni, and mentors.',
      },
    ],

    organizer: 'ASTECAA Education Committee',
    organizerRole: 'Mentorship & Scholarship Coordinator',
    organizerPhoto: img(''),

    capacity: 300,
    registered: 218,

    tags: ['Mentorship', 'Education', 'Scholarship', 'Students', 'Alumni'],
  },
];

export const MEMORIES: MemoryItem[] = [
  {
    id: 'm1',
    title: 'The Beginning of ASTECAA',
    year: 1998,
    event: 'ASTECAA Formation',
    image: img('harvest-table.jpg'),
    caption: 'The beginning of a new chapter for former students',
    format: 'photo',
    album: 'ASTECAA History',
  },
  {
    id: 'm2',
    title: 'Our First Alumni Gathering',
    year: 1999,
    event: 'First Alumni Reunion',
    image: img('concert.jpg'),
    caption: 'Former students coming together for the first alumni gathering',
    format: 'photo',
    album: 'Reunions',
  },
  {
    id: 'm3',
    title: 'Building the Alumni Family',
    year: 2002,
    event: 'Alumni Convention',
    image: img('fiddle-circle.jpg'),
    caption: 'Alumni strengthening friendships and building the association',
    format: 'photo',
    album: 'Conventions',
  },
  {
    id: 'm4',
    title: 'Remembering Where We Started',
    year: 2005,
    event: 'Homecoming',
    image: img('voices-oral-history.jpg'),
    caption: 'Alumni sharing memories of their school days',
    format: 'photo',
    album: 'Alumni Stories',
  },
  {
    id: 'm5',
    title: 'A Growing Alumni Network',
    year: 2008,
    event: 'National Alumni Meeting',
    image: img('reunion.jpg'),
    caption: 'ASTECAA members gathering as the association continued to grow',
    format: 'photo',
    album: 'ASTECAA History',
  },
  {
    id: 'm6',
    title: 'Stronger Together',
    year: 2011,
    event: 'Annual Convention',
    image: img('lantern-procession.jpg'),
    caption: 'Alumni united in fellowship and service',
    format: 'photo',
    album: 'Conventions',
  },
  {
    id: 'm7',
    title: 'Celebrating Our Alumni',
    year: 2014,
    event: 'Alumni Celebration',
    image: img('market-stalls.jpg'),
    caption: 'Celebrating the achievements and contributions of ASTECAA members',
    format: 'photo',
    album: 'Alumni Celebrations',
  },
  {
    id: 'm8',
    title: 'Years of Friendship',
    year: 2017,
    event: 'Class Reunion',
    image: img('ASTECAA.jpg'),
    caption: 'Old classmates reunited and making new memories',
    format: 'photo',
    album: 'Class Reunions',
  },
  {
    id: 'm9',
    title: 'Passing the Legacy Forward',
    year: 2019,
    event: 'Alumni Fellowship',
    image: img('tea-stories.jpg'),
    caption: 'Alumni sharing experiences and inspiring the next generation',
    format: 'photo',
    album: 'Alumni Stories',
  },
  {
    id: 'm10',
    title: 'A New Generation of Alumni',
    year: 2021,
    event: 'Virtual Alumni Gathering',
    image: img('square-at-dusk.jpg'),
    caption: 'Staying connected and keeping the ASTECAA family together',
    format: 'video',
    album: 'ASTECAA History',
  },
  {
    id: 'm11',
    title: 'Together Again',
    year: 2023,
    event: 'National Convention',
    image: img('open-fire-feast.jpg'),
    caption: 'Alumni reconnecting through fellowship, celebration, and service',
    format: 'photo',
    album: 'Conventions',
  },
  {
    id: 'm12',
    title: 'The ASTECAA Legacy Continues',
    year: 2026,
    event: 'Annual Alumni Convention',
    image: img('reading-room.jpg'),
    caption: 'Celebrating our journey and looking ahead to the future',
    format: 'photo',
    album: 'ASTECAA History',
  },
];

export const TIMELINE: TimelineMilestone[] = [
  {
    id: 't1',
    year: 1993,
    title: 'The Foundation in Owerrinta',
    story: 'Adventist Secondary Technical College (ASTEC) officially opens its doors in Abia State, Nigeria. A pioneer group of students and passionate educators gather to begin a legacy built on technical skill and spiritual values.',
    image: img('ASTECAA.jpg'),
    quote: 'We set out to build not just a school, but a foundational sanctuary for character and competence.',
    quoteAuthor: 'Pioneer Principal Statement, 1993',
  },
  {
    id: 't2',
    year: 1998,
    title: 'The Inaugural Graduation',
    story: 'History is made as the very first set of ASTECians completes their final secondary school certificates. This pioneer set steps out into the world, laying the first structural bricks of what would become our global alumni network.',
    image: img('reunion.jpg'),
    quote: 'We were the first fruits of a great vision, paving the way for thousands to follow.',
    quoteAuthor: 'Class of 1998 Representative',
  },
  {
    id: 't3',
    year: 2004,
    title: 'Expanding the Technical Workshops',
    story: 'To support growing enrollment, the campus introduces upgraded technical and science laboratories. The alumni network steps in formally for the first time to help mentor students entering engineering and sciences.',
    image: img('concert.jpg'),
  },
  {
    id: 't4',
    year: 2010,
    title: 'The Digital Alumni Hub',
    story: 'With the rise of social networks, various graduating classes—spearheaded by the highly active Class of 2010—organize formal digital chapters, reconnecting hundreds of long-lost classmates across continents.',
    image: img('market-stalls.jpg'),
    hasVideo: true,
  },
  {
    id: 't5',
    year: 2015,
    title: 'The Lavatory Infrastructure Project',
    story: 'ASTECAA chapters coordinate a major community development project on campus. The association funds and commissions an ultra-modern lavatory facility to significantly improve student health and well-being.',
    image: img('voices-oral-history.jpg'),
    quote: 'Giving back to the place that shaped us is not an option; it is our lifelong responsibility.',
    quoteAuthor: 'ASTECAA Project Committee Lead',
  },
  {
    id: 't6',
    year: 2018,
    title: 'Global Chapters Formalized',
    story: 'Alumni bases solidify regional chapters across Nigeria, the United Kingdom, and North America. Cross-generational networking and corporate mentorship programs become an official backbone of the association.',
    image: img('reading-room.jpg'),
  },
  {
    id: 't7',
    year: 2023,
    title: 'The Silver Jubilee Era',
    story: 'Celebrating over 25 years since the pioneer set graduated, ASTECAA returns to Owerrinta for massive landmark homecoming ceremonies, funding new scholarship programs for outstanding technical students.',
    image: img('lantern-procession.jpg'),
    hasVideo: true,
  },
  {
    id: 't8',
    year: 2026,
    title: 'The Living Archive Portal',
    story: 'The ASTECAA dynamic portal goes live globally. Decades of school records, graduation photographs, professional milestone listings, and historical campus memories are preserved in one central digital home.',
    image: img('tea-stories.jpg'),
  },
];


export const MESSAGES: CommunityMessage[] = [
  {
    id: 'a1',
    author: 'Chinedu Okafor',
    location: 'Lagos, Nigeria',
    avatar: img('avatar-chinedu.jpg'),
    message:
      'My years at ASTECAA taught me more than academics. The discipline, friendships, and values I gained there have continued to guide me throughout my career. Being part of ASTECAA again reminds me where so much of my journey began.',
    date: '2026-07-14',
    likes: 142,
    pinned: true,
  },
  {
    id: 'a2',
    author: 'Grace Nwankwo',
    location: 'Abuja, Nigeria',
    avatar: img('avatar-grace.jpg'),
    message:
      'I graduated many years ago, but reconnecting with former classmates through ASTECAA made it feel like we had never been apart. There is something special about meeting people who shared the same classrooms, teachers, and memories.',
    date: '2026-07-12',
    likes: 89,
  },
  {
    id: 'a3',
    author: 'Emmanuel Adeyemi',
    location: 'Ibadan, Nigeria',
    avatar: img('avatar-emmanuel.jpg'),
    message:
      'ASTECAA has shown me that an alumni association is more than a network. It is a community where we can support one another, celebrate our achievements, and give back to the institution that helped shape us.',
    date: '2026-07-09',
    likes: 211,
  },
  {
    id: 'a4',
    author: 'Esther Chukwu',
    location: 'Port Harcourt, Nigeria',
    avatar: img('avatar-esther.jpg'),
    message:
      'One of my fondest memories of ASTECAA is the sense of family among students and teachers. Years later, those friendships remain strong. Reconnecting with fellow alumni has brought back memories I thought I had forgotten.',
    date: '2026-07-05',
    likes: 67,
  },
  {
    id: 'a5',
    author: 'Samuel Eze',
    location: 'Enugu, Nigeria',
    avatar: img('avatar-samuel.jpg'),
    message:
      'I never imagined that a school photograph from my graduating year would bring back so many memories. Seeing familiar faces again reminded me of how far we have all come and how important it is to keep these connections alive.',
    date: '2026-07-01',
    likes: 158,
  },
];



export const ORGANIZERS: Organizer[] = [
  {
    id: 'o1',
    name: 'Chinedu Okafor',
    role: 'National President',
    photo: img(''),
    years: '8 years',
    bio: 'Chinedu is a dedicated ASTECAA leader who coordinates alumni activities and works to strengthen the association’s relationship with the school and its members.',
  },
  {
    id: 'o2',
    name: 'Lilian Ogechi Thomas',
    role: 'National Secretary-General',
    photo: img(''),
    years: '6 years',
    bio: 'Lilian has served in alumni leadership and brings strong administrative and organizational experience to ASTECAA, helping coordinate communications, records, and association programmes.',
  },
  {
    id: 'o3',
    name: 'Leesi Stephanie Elekwa',
    role: 'National Vice President',
    photo: img(''),
    years: '7 years',
    bio: 'Leesi is passionate about alumni engagement and community building. She supports the executive council in coordinating members, programmes, and initiatives across the association.',
  },
  {
    id: 'o4',
    name: 'Emeka Nwosu',
    role: 'National Treasurer',
    photo: img(''),
    years: '5 years',
    bio: 'Emeka oversees financial planning and accountability for the association, supporting ASTECAA programmes and ensuring responsible management of alumni resources.',
  },
];

export const ABOUT_MILESTONES: Milestone[] = [
  {
    year: '1993',
    title: 'The Foundation',
    text: 'Adventist Secondary Technical College (ASTEC) is established in Owerrinta, pioneering a unique blend of technical education, academic excellence, and Christian values.'
  },
  {
    year: '1998',
    title: 'The Pioneer Set',
    text: 'The first graduating class successfully completes their studies, laying the foundation for generations of proud ASTEC alumni.'
  },
  {
    year: '2003',
    title: 'Growing Legacy',
    text: 'The school continues to expand its academic programs, facilities, and student population while producing graduates who excel in diverse professions.'
  },
  {
    year: '2008',
    title: 'A Decade of Impact',
    text: 'Ten years after the pioneer graduation, alumni networks begin strengthening connections and supporting the development of the school community.'
  },
  {
    year: '2013',
    title: 'Twenty Years of Excellence',
    text: 'ASTEC celebrates two decades of educational excellence, reflecting on its achievements and the success of its alumni worldwide.'
  },
  {
    year: '2018',
    title: 'Alumni Collaboration',
    text: 'Former students increase collaboration through reunions, mentorship, and initiatives that promote fellowship and give back to the school.'
  },
  {
    year: '2020',
    title: 'Connected Digitally',
    text: 'The alumni community embraces digital platforms to stay connected, organize virtual meetings, and strengthen relationships across the globe.'
  },
  {
    year: '2023',
    title: '30 Years of ASTEC',
    text: 'The school marks its 30th anniversary, celebrating three decades of excellence, leadership, and lasting impact on students and society.'
  },
  {
    year: '2025',
    title: 'The 28th Graduation Era',
    text: 'The alumni family continues to grow as new graduating sets join the association, strengthening a vibrant and expanding global community.'
  },
  {
    year: '2026',
    title: 'Building the Future',
    text: 'ASTECAA continues to unite alumni across the world through technology, mentorship, community projects, and preparations for future reunions and initiatives.'
  }
];

export const NAV_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Events', path: '/events' },
  { label: 'Timeline', path: '/timeline' },
  { label: 'Gallery', path: '/gallery' },
  { label: 'Community', path: '/community' },
  { label: 'Contact', path: '/contact' },
];
