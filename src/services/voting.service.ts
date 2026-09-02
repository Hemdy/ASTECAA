import { Injectable, signal } from '@angular/core';

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
}

export interface Position {
  id: string;
  election_id: string;
  title: string;
  description: string | null;
  sort_order: number;
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

const MOCK_ELECTIONS: Election[] = [
  {
    id: 'mock-2026-alumni',
    title: '2026 Alumni Association Election',
    description: 'Vote for the next Alumni Association executive committee.',
    start_date: '2026-09-01T00:00:00.000Z',
    end_date: '2026-09-15T23:59:59.000Z',
    is_active: true,
    results_published: false,
    created_at: '2026-08-01T08:00:00.000Z',
  },
  {
    id: 'mock-2026-programmes',
    title: 'Alumni Programmes Committee',
    description: 'Help shape the events, mentoring and outreach programmes for the year ahead.',
    start_date: '2026-10-01T00:00:00.000Z',
    end_date: '2026-10-20T23:59:59.000Z',
    is_active: true,
    results_published: false,
    created_at: '2026-08-04T08:00:00.000Z',
  },
  {
    id: 'mock-2025-board',
    title: '2025 Alumni Executive Election',
    description: 'The previous executive committee election.',
    start_date: '2025-09-01T00:00:00.000Z',
    end_date: '2025-09-15T23:59:59.000Z',
    is_active: true,
    results_published: true,
    created_at: '2025-08-01T08:00:00.000Z',
  },
];

const MOCK_POSITIONS: Position[] = [
  { id: 'mock-president', election_id: 'mock-2026-alumni', title: 'President', description: 'The principal representative of the alumni association.', sort_order: 1 },
  { id: 'mock-vice-president', election_id: 'mock-2026-alumni', title: 'Vice President', description: 'Supports the president and leads member engagement.', sort_order: 2 },
  { id: 'mock-secretary', election_id: 'mock-2026-alumni', title: 'General Secretary', description: 'Keeps our community connected and moving forward.', sort_order: 3 },
  { id: 'mock-programmes', election_id: 'mock-2026-programmes', title: 'Programmes Lead', description: 'Coordinates meaningful events for every generation.', sort_order: 1 },
  { id: 'mock-old-president', election_id: 'mock-2025-board', title: 'President', description: 'The principal representative of the alumni association.', sort_order: 1 },
];

const MOCK_CANDIDATES: Candidate[] = [
  { id: 'mock-amina', position_id: 'mock-president', full_name: 'Amina Okafor', graduation_year: 2012, department: 'Business Administration', biography: 'Community organiser and social impact strategist who has led three alumni outreach programmes.', manifesto: 'Build a more connected, generous and visible alumni network.', photo_url: '/images/avatar-imelda.jpg', sort_order: 1 },
  { id: 'mock-james', position_id: 'mock-president', full_name: 'James Adeyemi', graduation_year: 2008, department: 'Engineering', biography: 'Social entrepreneur with a decade of experience building youth and professional networks.', manifesto: 'Turn alumni expertise into practical opportunities for every member.', photo_url: '/images/avatar-daniel.jpg', sort_order: 2 },
  { id: 'mock-nneka', position_id: 'mock-vice-president', full_name: 'Nneka Mensah', graduation_year: 2015, department: 'Computer Science', biography: 'Product designer passionate about making association services simple and welcoming.', manifesto: 'Make participation simple, welcoming and transparent.', photo_url: '/images/avatar-marlene.jpg', sort_order: 1 },
  { id: 'mock-david', position_id: 'mock-vice-president', full_name: 'David Cole', graduation_year: 2006, department: 'Economics', biography: 'Education advocate and mentor who coordinates a national alumni scholarship network.', manifesto: 'Create dependable support for alumni at every stage of life.', photo_url: '/images/avatar-theodore.jpg', sort_order: 2 },
  { id: 'mock-grace', position_id: 'mock-secretary', full_name: 'Grace Eze', graduation_year: 2014, department: 'Mass Communication', biography: 'Communications lead known for clear storytelling, thoughtful listening and reliable delivery.', manifesto: 'Keep every member informed, heard and involved.', photo_url: '/images/avatar-imelda.jpg', sort_order: 1 },
  { id: 'mock-tunde', position_id: 'mock-secretary', full_name: 'Tunde Bello', graduation_year: 2009, department: 'Political Science', biography: 'Programme manager with a track record of building accountable community systems.', manifesto: 'Create a dependable rhythm of communication and support.', photo_url: '/images/avatar-daniel.jpg', sort_order: 2 },
  { id: 'mock-zainab', position_id: 'mock-programmes', full_name: 'Zainab Bello', graduation_year: 2018, department: 'Hospitality Management', biography: 'Events producer creating inclusive gatherings for young alumni and established professionals.', manifesto: 'More useful gatherings, stronger mentoring and wider reach.', photo_url: '/images/avatar-imelda.jpg', sort_order: 1 },
  { id: 'mock-oliver', position_id: 'mock-programmes', full_name: 'Oliver Grant', graduation_year: 2010, department: 'Marketing', biography: 'Partnerships lead connecting alumni communities with people and ideas that matter.', manifesto: 'Connect our alumni community with meaningful opportunities.', photo_url: '/images/avatar-daniel.jpg', sort_order: 2 },
];

@Injectable({ providedIn: 'root' })
export class VotingService {
  elections = signal<Election[]>(MOCK_ELECTIONS.map((e) => ({ ...e })));
  loading = signal(false);
  error = signal<string | null>(null);
  private votedElections = new Set<string>();
  private votes = new Map<string, number>();

  private delay<T>(value: T, ms = 250): Promise<T> {
    return new Promise((resolve) => setTimeout(() => resolve(value), ms));
  }

  async loadElections(): Promise<void> {
    this.loading.set(true);
    await this.delay(undefined);
    this.loading.set(false);
  }

  async getActiveElections(): Promise<Election[]> {
    await this.delay(undefined);
    return this.elections().filter((e) => e.is_active);
  }

  async getElectionsForMember(): Promise<Election[]> {
    return this.getActiveElections();
  }

  async getElectionDetails(electionId: string): Promise<ElectionWithDetails | null> {
    await this.delay(undefined);
    const election = this.elections().find((item) => item.id === electionId);
    if (!election) return null;
    const positions = MOCK_POSITIONS.filter((p) => p.election_id === electionId).map((position) => {
      const candidates = MOCK_CANDIDATES.filter((c) => c.position_id === position.id).map((candidate) => ({
        ...candidate,
        vote_count: this.votes.get(candidate.id) ?? 0,
      }));
      return { ...position, candidates, total_votes: candidates.reduce((sum, c) => sum + c.vote_count, 0) };
    });
    return {
      ...election,
      positions,
      total_votes: positions.reduce((sum, p) => sum + p.total_votes, 0),
      has_voted: this.votedElections.has(electionId),
    };
  }

  async requestOtp(voter: VoterDetails): Promise<{ success: boolean; maskedPhone: string }> {
    await this.delay(undefined, 500);
    if (!voter.name.trim() || !voter.email.trim() || !voter.phone.trim() || !voter.graduationYear.trim()) {
      return { success: false, maskedPhone: '' };
    }
    return { success: true, maskedPhone: `${voter.phone.slice(0, 3)}••••${voter.phone.slice(-2)}` };
  }

  async verifyOtp(_voter: VoterDetails, otp: string): Promise<{ success: boolean; error?: string }> {
    await this.delay(undefined, 500);
    return otp === '123456'
      ? { success: true }
      : { success: false, error: 'That code is not correct. Try 123456 for this demo.' };
  }

  async castVote(electionId: string, positionId: string, candidateId: string): Promise<{ success: boolean; error?: string }> {
    await this.delay(undefined, 600);
    if (this.votedElections.has(electionId)) return { success: false, error: 'You have already voted in this election.' };
    const candidate = MOCK_CANDIDATES.find((c) => c.id === candidateId && c.position_id === positionId);
    if (!candidate) return { success: false, error: 'This candidate is no longer available.' };
    this.votes.set(candidateId, (this.votes.get(candidateId) ?? 0) + 1);
    return { success: true };
  }

  async finalizeVote(electionId: string): Promise<void> {
    this.votedElections.add(electionId);
    await this.delay(undefined, 200);
  }

  async createElection(e: Partial<Election>): Promise<Election | null> {
    const election: Election = { id: `mock-${Date.now()}`, title: e.title ?? 'Untitled election', description: e.description ?? null, start_date: e.start_date ?? new Date().toISOString(), end_date: e.end_date ?? new Date().toISOString(), is_active: e.is_active ?? false, results_published: e.results_published ?? false, created_at: new Date().toISOString() };
    this.elections.update((items) => [election, ...items]);
    return this.delay(election);
  }

  async updateElection(id: string, updates: Partial<Election>): Promise<void> {
    this.elections.update((items) => items.map((e) => (e.id === id ? { ...e, ...updates } : e)));
    await this.delay(undefined);
  }

  async deleteElection(id: string): Promise<void> { this.elections.update((items) => items.filter((e) => e.id !== id)); await this.delay(undefined); }
  async toggleActive(id: string, active: boolean): Promise<void> { return this.updateElection(id, { is_active: active }); }
  async toggleResults(id: string, published: boolean): Promise<void> { return this.updateElection(id, { results_published: published }); }

  async getPositions(electionId: string): Promise<Position[]> { await this.delay(undefined); return MOCK_POSITIONS.filter((p) => p.election_id === electionId); }
  async createPosition(electionId: string, title: string, description: string | null, sortOrder: number): Promise<Position | null> { const p = { id: `mock-${Date.now()}`, election_id: electionId, title, description, sort_order: sortOrder }; MOCK_POSITIONS.push(p); return this.delay(p); }
  async updatePosition(id: string, updates: Partial<Position>): Promise<void> { const p = MOCK_POSITIONS.find((item) => item.id === id); if (p) Object.assign(p, updates); await this.delay(undefined); }
  async deletePosition(id: string): Promise<void> { const index = MOCK_POSITIONS.findIndex((p) => p.id === id); if (index >= 0) MOCK_POSITIONS.splice(index, 1); await this.delay(undefined); }
  async getCandidates(positionId: string): Promise<Candidate[]> { await this.delay(undefined); return MOCK_CANDIDATES.filter((c) => c.position_id === positionId); }
  async createCandidate(c: Partial<Candidate> & { position_id: string }): Promise<Candidate | null> { const candidate = { id: `mock-${Date.now()}`, full_name: c.full_name ?? 'New candidate', position_id: c.position_id, graduation_year: c.graduation_year, department: c.department, biography: c.biography ?? null, manifesto: c.manifesto ?? null, photo_url: c.photo_url ?? null, sort_order: c.sort_order ?? 0 }; MOCK_CANDIDATES.push(candidate); return this.delay(candidate); }
  async updateCandidate(id: string, updates: Partial<Candidate>): Promise<void> { const c = MOCK_CANDIDATES.find((item) => item.id === id); if (c) Object.assign(c, updates); await this.delay(undefined); }
  async deleteCandidate(id: string): Promise<void> { const index = MOCK_CANDIDATES.findIndex((c) => c.id === id); if (index >= 0) MOCK_CANDIDATES.splice(index, 1); await this.delay(undefined); }
  async getStats() { return this.delay({ totalElections: this.elections().length, activeElections: this.elections().filter((e) => e.is_active).length, totalCandidates: MOCK_CANDIDATES.length, totalVotes: Array.from(this.votes.values()).reduce((sum, count) => sum + count, 0) }); }
  async getVoteCountByCandidate(candidateId: string): Promise<number> { return this.delay(this.votes.get(candidateId) ?? 0); }
}
