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
  id: 'worship-concert-2026',
  title: 'Sounds of Worship Concert 2026',
  subtitle: 'An unforgettable night of praise, worship, and live music',
  description:
    'Experience an inspiring evening of powerful worship, uplifting performances, and life-changing moments as renowned gospel artists come together for one unforgettable concert.',
  longDescription:
    'Sounds of Worship Concert 2026 is a premier live gospel music experience designed to bring people together in an atmosphere of heartfelt praise and worship. Featuring an exciting lineup of talented worship leaders, gospel choirs, and live musicians, the concert promises an evening filled with inspiring music, powerful testimonies, and moments of spiritual reflection. Whether you come with family, friends, or your church community, prepare to encounter an atmosphere of hope, unity, and celebration through music.',

  date: '2026-11-14',
  endDate: '2026-11-14',
  time: '5:00 PM - 10:00 PM',

  venue: 'City Convention Arena',
  city: 'Lagos',

  category: 'Concert',

  poster: img('music.jpg'),
  banner: img('music.jpg'),

  gallery: [
    img('harvest-table.jpg'),
    img('fiddle-circle.jpg'),
    img('open-fire-feast.jpg'),
    img('music.jpg'),
    img('lantern-procession.jpg'),
    img('market-stalls.jpg'),
  ],

  schedule: [
    {
      time: '5:00 PM',
      title: 'Doors Open',
      detail: 'Registration, seating, and pre-show music',
    },
    {
      time: '6:00 PM',
      title: 'Opening Worship',
      detail: 'Mass choir and live band lead the opening session',
    },
    {
      time: '7:00 PM',
      title: 'Guest Artist Performances',
      detail: 'Special ministrations from featured gospel artists',
    },
    {
      time: '8:15 PM',
      title: 'Worship Experience',
      detail: 'An extended atmosphere of praise, worship, and prayer',
    },
    {
      time: '9:15 PM',
      title: 'Special Message',
      detail: 'A short message of hope and encouragement',
    },
    {
      time: '9:45 PM',
      title: 'Grand Finale',
      detail: 'A powerful closing worship session featuring all guest artists',
    },
  ],

  organizer: 'Kingdom Music Network',
  organizerRole: 'Concert Organizer',
  organizerPhoto: img('avatar-marlene.jpg'),

  capacity: 5000,
  registered: 3248,

  tags: ['Concert', 'Gospel', 'Live Music', 'Worship', 'Family Friendly'],
},
  {
    id: 'voices-oral-history-2026',
    title: 'Voices: An Oral History Evening',
    subtitle: 'Living memory, recorded in real time',
    description:
      'An intimate evening where elders from the community share stories of the town as it once was — accompanied by archival photographs and a live recording for the archive.',
    longDescription:
      'Voices is our flagship oral history programme: a slow, intimate evening where community elders recount the town as they remember it — the corner shops now gone, the dances at the old hall, the winter of the great freeze. Each story is accompanied by photographs from our archive, and the entire evening is recorded for preservation in the Echoes digital archive. Tea is served. Listening is the only requirement.',
    date: '2026-10-11',
    time: '7:00 PM',
    venue: 'Community Hall, 42 Elm Street',
    city: 'Maple Hollow',
    category: 'Storytelling',
    poster: img('voices-oral-history.jpg'),
    banner: img('voices-oral-history.jpg'),
    gallery: [
      img('voices-oral-history.jpg'),
      img('square-at-dusk.jpg'),
      img('tea-stories.jpg'),
      img('tea-stories.jpg'),
    ],
    schedule: [
      { time: '6:30 PM', title: 'Doors & Tea', detail: 'Arrive early — seating is limited' },
      { time: '7:00 PM', title: 'Welcome', detail: 'A short introduction to the archive project' },
      { time: '7:15 PM', title: 'Voices', detail: 'Three elders share their stories' },
      { time: '8:30 PM', title: 'Open Floor', detail: 'Attendees are invited to add a memory' },
      { time: '9:00 PM', title: 'Close', detail: 'Recording ends; conversation continues' },
    ],
    organizer: 'Daniel Okonkwo',
    organizerRole: 'Archive Curator',
    organizerPhoto: img('avatar-daniel.jpg'),
    capacity: 120,
    registered: 96,
    tags: ['Storytelling', 'Archive', 'Indoor', 'Tea Served'],
  },
  {
    id: 'winter-carol-night-2026',
    title: 'Winter Carol Night',
    subtitle: 'A century of song under candlelight',
    description:
      'The community choir leads a candlelit evening of carols and winter songs from around the world, concluding with the lantern lighting of the square.',
    longDescription:
      'For one hundred and twelve years, the people of this town have gathered on the longest nights to sing. Winter Carol Night continues that tradition — a candlelit evening of carols led by the community choir, joined by songs from the many cultures that now call this valley home. The evening closes with the lighting of the square, where every attendee places a lantern along the low stone wall. Warm drinks and spiced bread are served throughout.',
    date: '2026-12-19',
    time: '6:30 PM',
    venue: 'Town Square',
    city: 'Maple Hollow',
    category: 'Concert',
    poster: img('concert.jpg'),
    banner: img('concert.jpg'),
    gallery: [
      img('concert.jpg'),
      img('square-at-dusk.jpg'),
      img('tea-stories.jpg'),
    ],
    schedule: [
      { time: '6:00 PM', title: 'Lantern Distribution', detail: 'Collect your lantern at the gate' },
      { time: '6:30 PM', title: 'First Set', detail: 'Traditional carols with the choir' },
      { time: '7:30 PM', title: 'Songs of the World', detail: 'Carols from across the community' },
      { time: '8:15 PM', title: 'Lighting of the Square', detail: 'Place your lantern along the wall' },
      { time: '8:45 PM', title: 'Final Song', detail: 'A single voice, then silence' },
    ],
    organizer: 'Imelda Fossett',
    organizerRole: 'Choir Director, 22 years',
    organizerPhoto: img('avatar-imelda.jpg'),
    capacity: 800,
    registered: 611,
    tags: ['Concert', 'Candlelit', 'Family', 'Free Entry'],
  },
  {
    id: 'spring-reunion-2027',
    title: 'Spring Alumni Reunion',
    subtitle: 'Classes of every year, together again',
    description:
      'A weekend reunion for all graduating classes of Maple Hollow High — campus walks, a memory wall, class photographs, and a Saturday night dinner in the old gymnasium.',
    longDescription:
      'Every spring, alumni from across the decades return to walk the old halls, find their names on the class boards, and share a meal in the gymnasium where they once danced. The reunion welcomes every graduating class — from the newest to those whose yearbooks are now themselves artifacts. A memory wall runs the length of the entrance hall, where attendees pin photographs, notes, and names of classmates they are remembering.',
    date: '2027-04-24',
    endDate: '2027-04-25',
    time: 'All day',
    venue: 'Maple Hollow High School',
    city: 'Maple Hollow',
    category: 'Reunion',
    poster: img('reunion.jpg'),
    banner: img('reunion.jpg'),
    gallery: [
      img('reunion.jpg'),
      img('ASTECAA.jpg'),
      img('reading-room.jpg'),
    ],
    schedule: [
      { time: 'Sat 10:00 AM', title: 'Campus Doors Open', detail: 'Walking tours and the memory wall' },
      { time: 'Sat 2:00 PM', title: 'Class Photographs', detail: 'Group photos by decade on the front steps' },
      { time: 'Sat 7:00 PM', title: 'Reunion Dinner', detail: 'A long table in the old gymnasium' },
      { time: 'Sun 11:00 AM', title: 'Remembrance Chapel', detail: 'A quiet service for classmates no longer with us' },
    ],
    organizer: 'Theodore Marsh',
    organizerRole: 'Alumni Association President',
    organizerPhoto: img('avatar-theodore.jpg'),
    capacity: 500,
    registered: 287,
    tags: ['Reunion', 'Alumni', 'Weekend', 'Ticketed'],
  },
];

export const MEMORIES: MemoryItem[] = [
  { id: 'm1', title: 'The First Harvest Table', year: 1988, event: 'Harvest Festival', image: img('harvest-table.jpg'), caption: 'The long table, set for seventy', format: 'photo', album: 'Harvest' },
  { id: 'm2', title: 'Choir in the Snow', year: 2026, event: 'Carol Night', image: img('concert.jpg'), caption: 'The choir, December 2026', format: 'photo', album: 'Carols' },
  { id: 'm3', title: 'Fiddle Circle', year: 2003, event: 'Harvest Festival', image: img('fiddle-circle.jpg'), caption: 'The fiddle circle, dusk', format: 'photo', album: 'Harvest' },
  { id: 'm4', title: 'Grandmother\'s Hands', year: 1995, event: 'Voices Evening', image: img('voices-oral-history.jpg'), caption: 'Mrs. Aldous, telling her story', format: 'photo', album: 'Voices' },
  { id: 'm5', title: 'The Old Gymnasium', year: 1982, event: 'Spring Reunion', image: img('reunion.jpg'), caption: 'The gym, before the renovation', format: 'photo', album: 'Reunions' },
  { id: 'm6', title: 'Lantern Procession', year: 2019, event: 'Harvest Festival', image: img('lantern-procession.jpg'), caption: 'The orchard walk, 2019', format: 'photo', album: 'Harvest' },
  { id: 'm7', title: 'The Market Stalls', year: 2010, event: 'Harvest Festival', image: img('market-stalls.jpg'), caption: 'Heirloom tomatoes, 2010', format: 'photo', album: 'Harvest' },
  { id: 'm8', title: 'Class of \'64', year: 1964, event: 'Spring Reunion', image: img('ASTECAA.jpg'), caption: 'Class of 1964, front steps', format: 'photo', album: 'Reunions' },
  { id: 'm9', title: 'Tea & Stories', year: 2018, event: 'Voices Evening', image: img('tea-stories.jpg'), caption: 'The tea table, set for stories', format: 'photo', album: 'Voices' },
  { id: 'm10', title: 'Square at Dusk', year: 1992, event: 'Carol Night', image: img('square-at-dusk.jpg'), caption: 'The square, before the lights', format: 'video', album: 'Carols' },
  { id: 'm11', title: 'Open Fire Feast', year: 2015, event: 'Harvest Festival', image: img('open-fire-feast.jpg'), caption: 'The fire, and the feast', format: 'photo', album: 'Harvest' },
  { id: 'm12', title: 'The Reading Room', year: 2001, event: 'Voices Evening', image: img('reading-room.jpg'), caption: 'Where the recordings are made', format: 'photo', album: 'Voices' },
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
    id: 'c1',
    author: 'Hannah Brey',
    location: 'Maple Hollow',
    avatar: img('avatar-imelda.jpg'),
    message:
      'My grandmother sang in the choir for forty-one years. The first carol night without her, the choir sang her favourite — and the whole square did too. I will never forget that sound.',
    date: '2026-07-14',
    likes: 142,
    pinned: true,
  },
  {
    id: 'c2',
    author: 'George Alcott',
    location: 'Now in Edinburgh',
    avatar: img('avatar-theodore.jpg'),
    message:
      'I left in 1983 and have not been back. Finding these photographs — the old gym, the market stalls — I am twenty again, and homesick for a place I hardly recognise now. Thank you for keeping this.',
    date: '2026-07-12',
    likes: 89,
  },
  {
    id: 'c3',
    author: 'The Mahoney Family',
    location: 'Maple Hollow',
    avatar: img('avatar-daniel.jpg'),
    message:
      'We came to the harvest festival for the first time last year, knowing no one. By Sunday we had been fed three meals, taught two songs, and invited to a stranger\'s kitchen for tea. This is what a community is.',
    date: '2026-07-09',
    likes: 211,
  },
  {
    id: 'c4',
    author: 'Lila Okonkwo',
    location: 'Visiting from Lagos',
    avatar: img('avatar-marlene.jpg'),
    message:
      'Listening to the Voices recording of Mrs. Aldous, I heard my own grandmother\'s way of speaking — the same rhythm, the same pauses. Memory travels further than we think.',
    date: '2026-07-05',
    likes: 67,
  },
  {
    id: 'c5',
    author: 'Tom Vetch',
    location: 'Maple Hollow',
    avatar: img('reading-room.jpg'),
    message:
      'I am in the class of \'64 photograph — back row, third from the left, the one grinning. I have been looking for this picture for thirty years.',
    date: '2026-07-01',
    likes: 158,
  },
];

export const ORGANIZERS: Organizer[] = [
  {
    id: 'o1',
    name: 'Marlene Whitfield',
    role: 'Festival Director',
    photo: img('avatar-marlene.jpg'),
    years: '12 years',
    bio: 'Marlene grew up on the orchard and has directed the harvest festival since 2014. She believes a good festival is one where a stranger is fed within the first hour.',
  },
  {
    id: 'o2',
    name: 'Daniel Okonkwo',
    role: 'Archive Curator',
    photo: img('avatar-daniel.jpg'),
    years: '6 years',
    bio: 'Daniel leads the Voices oral history programme and oversees the digitisation of the archive. A historian by training, he is most happy in a basement full of old recordings.',
  },
  {
    id: 'o3',
    name: 'Imelda Fossett',
    role: 'Choir Director',
    photo: img('avatar-imelda.jpg'),
    years: '22 years',
    bio: 'Imelda has directed the community choir since 2004. She has sung at every carol night since she was nine years old.',
  },
  {
    id: 'o4',
    name: 'Theodore Marsh',
    role: 'Alumni Association President',
    photo: img('avatar-theodore.jpg'),
    years: '8 years',
    bio: 'Theodore, class of \'78, returned to the valley after a career abroad and now leads the alumni association and the spring reunion.',
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
