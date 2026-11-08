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
      const list = await this.request<Election[]>('/api/admin/v1/elections').catch(
        () => this.request<Election[]>('/api/v1/elections'),
      );
      this.elections.set(list || []);
    } catch (err: any) {
      this.error.set(err.message || 'Failed to load elections.');
      throw err;
    } finally {
      this.loading.set(false);
    }
  }

  async getActiveElections(): Promise<Election[]> {
    const list = await this.request<Election[]>('/api/v1/elections');
    return (list || []).filter((e) => e.is_active);
  }

  async getElectionsForMember(): Promise<Election[]> {
    return this.getActiveElections();
  }

  async getElectionDetails(electionId: string): Promise<ElectionWithDetails | null> {
    const voterEmail = this.currentVoter?.email;
    const query = voterEmail ? `?voterEmail=${encodeURIComponent(voterEmail)}` : '';

    // First try admin results endpoint, then public endpoint
    try {
      const details = await this.request<ElectionWithDetails>(
        `/api/admin/v1/elections/${electionId}/results`,
      );
      if (details) return details;
    } catch {
      // Fallback to public election details
    }

    return this.request<ElectionWithDetails>(`/api/v1/elections/${electionId}${query}`);
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
    return this.request<Position[]>(`/api/admin/v1/elections/${electionId}/positions`);
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
    return this.request<Candidate[]>(`/api/admin/v1/positions/${positionId}/candidates`);
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
