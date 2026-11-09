export type ElectionStatus = 'OPEN' | 'SCHEDULED' | 'CLOSED';

export interface Election {
  id: string;
  title: string;
  description: string | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
  results_published: boolean;
  created_at: string;
  // Aliases for Drizzle camelCase compatibility
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  resultsPublished?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Position {
  id: string;
  election_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  electionId?: string;
  sortOrder?: number;
}

export interface Candidate {
  id: string;
  position_id: string;
  full_name: string;
  graduation_year?: number;
  department?: string;
  biography: string | null;
  manifesto: string | null;
  photo_url: string | null;
  sort_order: number;
  positionId?: string;
  fullName?: string;
  photoUrl?: string | null;
  sortOrder?: number;
}

export interface CandidateWithVotes extends Candidate {
  vote_count: number;
}

export interface PositionWithCandidates extends Position {
  candidates: CandidateWithVotes[];
  total_votes: number;
}

export interface ElectionWithDetails extends Election {
  positions: PositionWithCandidates[];
  total_votes: number;
  has_voted: boolean;
}

export interface VoterDetails {
  name: string;
  email: string;
  phone: string;
  graduationYear: string;
}
