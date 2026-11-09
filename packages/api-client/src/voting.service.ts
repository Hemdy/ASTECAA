import { Injectable, signal } from '@angular/core';
import { getAstecApiUrl } from '@astec/config';
import type {
  Candidate,
  CandidateWithVotes,
  Election,
  ElectionWithDetails,
  Position,
  PositionWithCandidates,
  VoterDetails,
} from '@astec/types';

export type {
  Candidate,
  CandidateWithVotes,
  Election,
  ElectionStatus,
  ElectionWithDetails,
  Position,
  PositionWithCandidates,
  VoterDetails,
} from '@astec/types';

function normalizeElection(raw: any): Election {
  if (!raw) return raw;
  return {
    ...raw,
    start_date: raw.start_date || raw.startDate || '',
    startDate: raw.startDate || raw.start_date || '',
    end_date: raw.end_date || raw.endDate || '',
    endDate: raw.endDate || raw.end_date || '',
    is_active: raw.is_active !== undefined ? Boolean(raw.is_active) : Boolean(raw.isActive),
    isActive: raw.isActive !== undefined ? Boolean(raw.isActive) : Boolean(raw.is_active),
    results_published: raw.results_published !== undefined ? Boolean(raw.results_published) : Boolean(raw.resultsPublished),
    resultsPublished: raw.resultsPublished !== undefined ? Boolean(raw.resultsPublished) : Boolean(raw.results_published),
    created_at: raw.created_at || raw.createdAt || '',
    createdAt: raw.createdAt || raw.created_at || '',
  } as Election;
}

function normalizePosition(raw: any): Position {
  if (!raw) return raw;
  return {
    ...raw,
    election_id: raw.election_id || raw.electionId || '',
    electionId: raw.electionId || raw.election_id || '',
    sort_order: raw.sort_order ?? raw.sortOrder ?? 0,
    sortOrder: raw.sortOrder ?? raw.sort_order ?? 0,
  } as Position;
}

function normalizeCandidate(raw: any): Candidate {
  if (!raw) return raw;
  return {
    ...raw,
    position_id: raw.position_id || raw.positionId || '',
    positionId: raw.positionId || raw.position_id || '',
    full_name: raw.full_name || raw.fullName || raw.name || '',
    fullName: raw.fullName || raw.full_name || raw.name || '',
    photo_url: raw.photo_url || raw.photoUrl || null,
    photoUrl: raw.photoUrl || raw.photo_url || null,
    sort_order: raw.sort_order ?? raw.sortOrder ?? 0,
    sortOrder: raw.sortOrder ?? raw.sort_order ?? 0,
    vote_count: raw.vote_count ?? raw.voteCount ?? 0,
    voteCount: raw.voteCount ?? raw.vote_count ?? 0,
  } as Candidate;
}

function normalizeElectionWithDetails(raw: any): ElectionWithDetails {
  if (!raw) return raw;
  const norm = normalizeElection(raw) as ElectionWithDetails;
  norm.positions = (raw.positions || []).map((p: any) => {
    const normP = normalizePosition(p) as PositionWithCandidates;
    normP.candidates = (p.candidates || []).map((c: any) => normalizeCandidate(c) as CandidateWithVotes);
    normP.total_votes = p.total_votes ?? p.totalVotes ?? 0;
    return normP;
  });
  norm.total_votes = raw.total_votes ?? raw.totalVotes ?? 0;
  norm.has_voted = raw.has_voted ?? raw.hasVoted ?? false;
  return norm;
}

@Injectable({ providedIn: 'root' })
export class VotingService {
  elections = signal<Election[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  private currentVoter: VoterDetails | null = null;
  private currentElectionId: string | null = null;

  async loadElections(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const list = await this.request<any[]>('/api/admin/v1/elections').catch(
        () => this.request<any[]>('/api/v1/elections'),
      );
      this.elections.set((list || []).map(normalizeElection));
    } catch (err: any) {
      this.error.set(err.message || 'Failed to load elections.');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async getActiveElections(): Promise<Election[]> {
    const list = await this.request<any[]>('/api/v1/elections');
    const normalized = (list || []).map(normalizeElection);
    return normalized.filter((e) => e.is_active);
  }

  async getElectionsForMember(): Promise<Election[]> {
    return this.getActiveElections();
  }

  async getElectionDetails(electionId: string): Promise<ElectionWithDetails | null> {
    const voterEmail = this.currentVoter?.email;
    const query = voterEmail ? `?voterEmail=${encodeURIComponent(voterEmail)}` : '';

    // First try admin results endpoint, then public endpoint
    try {
      const details = await this.request<any>(
        `/api/admin/v1/elections/${electionId}/results`,
      );
      if (details) return normalizeElectionWithDetails(details);
    } catch {
      // Fallback to public election details
    }

    const res = await this.request<any>(`/api/v1/elections/${electionId}${query}`);
    return normalizeElectionWithDetails(res);
  }

  async requestOtp(voter: VoterDetails, electionId?: string): Promise<{ success: boolean; maskedPhone: string }> {
    this.currentVoter = { ...voter };
    const eId = electionId || this.currentElectionId;
    if (!eId) {
      // If electionId not explicitly given, try the first active election
      const active = this.elections().find((e) => e.is_active);
      if (active) this.currentElectionId = active.id;
    }
    const targetId = electionId || this.currentElectionId;

    if (!targetId) {
      throw new Error('No active election selected for verification.');
    }

    const res = await this.request<{ success: boolean; maskedPhone: string }>(
      `/api/v1/elections/${targetId}/request-otp`,
      {
        method: 'POST',
        body: JSON.stringify(voter),
      },
    );
    return res;
  }

  async verifyOtp(voter: VoterDetails, otp: string, electionId?: string): Promise<{ success: boolean; error?: string }> {
    const targetId = electionId || this.currentElectionId;
    if (!targetId) {
      return { success: false, error: 'No election selected.' };
    }

    try {
      await this.request(`/api/v1/elections/${targetId}/verify-otp`, {
        method: 'POST',
        body: JSON.stringify({ email: voter.email, otp }),
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'OTP verification failed.' };
    }
  }

  async castVote(
    electionId: string,
    positionId: string,
    candidateId: string,
  ): Promise<{ success: boolean; error?: string }> {
    const voterEmail = this.currentVoter?.email;
    if (!voterEmail) {
      return { success: false, error: 'Voter details not found. Please verify with OTP first.' };
    }

    try {
      await this.request(`/api/v1/elections/${electionId}/vote`, {
        method: 'POST',
        body: JSON.stringify({
          positionId,
          candidateId,
          voterEmail,
        }),
      });
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message || 'Failed to cast ballot choice.' };
    }
  }

  async finalizeVote(electionId: string): Promise<void> {
    const voterEmail = this.currentVoter?.email;
    if (!voterEmail) return;

    await this.request(`/api/v1/elections/${electionId}/finalize`, {
      method: 'POST',
      body: JSON.stringify({ voterEmail }),
    });
  }

  // --- Admin CRUD Operations ---

  async createElection(e: Partial<Election>): Promise<Election | null> {
    const created = await this.request<Election>('/api/admin/v1/elections', {
      method: 'POST',
      body: JSON.stringify(e),
    });
    this.elections.update((items) => [created, ...items]);
    return created;
  }

  async updateElection(id: string, updates: Partial<Election>): Promise<void> {
    await this.request(`/api/admin/v1/elections/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    this.elections.update((items) =>
      items.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    );
  }

  async deleteElection(id: string): Promise<void> {
    await this.request(`/api/admin/v1/elections/${id}`, { method: 'DELETE' });
    this.elections.update((items) => items.filter((e) => e.id !== id));
  }

  async toggleActive(id: string, active: boolean): Promise<void> {
    return this.updateElection(id, { is_active: active });
  }

  async toggleResults(id: string, published: boolean): Promise<void> {
    return this.updateElection(id, { results_published: published });
  }

  async getPositions(electionId: string): Promise<Position[]> {
    const res = await this.request<any[]>(`/api/admin/v1/elections/${electionId}/positions`);
    return (res || []).map(normalizePosition);
  }

  async createPosition(
    electionId: string,
    title: string,
    description: string | null,
    sortOrder: number,
  ): Promise<Position | null> {
    return this.request<Position>(`/api/admin/v1/elections/${electionId}/positions`, {
      method: 'POST',
      body: JSON.stringify({ title, description, sort_order: sortOrder }),
    });
  }

  async updatePosition(id: string, updates: Partial<Position>): Promise<void> {
    await this.request(`/api/admin/v1/positions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deletePosition(id: string): Promise<void> {
    await this.request(`/api/admin/v1/positions/${id}`, { method: 'DELETE' });
  }

  async getCandidates(positionId: string): Promise<Candidate[]> {
    const res = await this.request<any[]>(`/api/admin/v1/positions/${positionId}/candidates`);
    return (res || []).map(normalizeCandidate);
  }

  async createCandidate(c: Partial<Candidate> & { position_id: string }): Promise<Candidate | null> {
    return this.request<Candidate>('/api/admin/v1/candidates', {
      method: 'POST',
      body: JSON.stringify(c),
    });
  }

  async updateCandidate(id: string, updates: Partial<Candidate>): Promise<void> {
    await this.request(`/api/admin/v1/candidates/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
  }

  async deleteCandidate(id: string): Promise<void> {
    await this.request(`/api/admin/v1/candidates/${id}`, { method: 'DELETE' });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (init.body) {
      headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${getAstecApiUrl()}${path}`, {
      ...init,
      headers,
      credentials: 'include',
      cache: 'no-store',
    });

    if (!response.ok) {
      const body: unknown = await response.json().catch(() => null);
      const msg =
        typeof body === 'object' && body !== null && 'error' in body
          ? (body as any).error?.message || (body as any).error
          : `Request failed (${response.status})`;
      throw new Error(msg);
    }

    if (response.status === 204) {
      return undefined as T;
    }
    return (await response.json()) as T;
  }
}
