export type EventStatus = 'draft' | 'published' | 'scheduled' | 'archived';

export interface EventScheduleItem {
  time: string;
  title: string;
  detail: string;
}

export interface CmsEvent {
  id: string;
  slug: string;
  title: string;
  subtitle: string;
  description: string;
  longDescription: string;
  date: string;
  endDate?: string;
  time: string;
  venue: string;
  city: string;
  category: string;
  poster: string;
  banner: string;
  gallery: string[];
  schedule: EventScheduleItem[];
  organizer: string;
  organizerRole: string;
  organizerPhoto: string;
  capacity: number;
  registered: number;
  tags: string[];
  status: EventStatus;
  featured: boolean;
}

export type PublicEvent = Omit<CmsEvent, 'status'>;
export type EventInput = Omit<CmsEvent, 'id' | 'slug' | 'registered'>;
