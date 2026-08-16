import { Injectable, signal } from '@angular/core';
import { supabase } from '../supabase';

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

@Injectable({ providedIn: 'root' })
export class VotingService {
  elections = signal<Election[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  async loadElections(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      this.error.set(error.message);
    } else {
      this.elections.set((data as Election[]) ?? []);
    }
    this.loading.set(false);
  }

  async getActiveElections(): Promise<Election[]> {
    const { data, error } = await supabase
      .from('elections')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data as Election[]) ?? [];
  }

  async getElectionDetails(electionId: string, userId?: string): Promise<ElectionWithDetails | null> {
    const { data: election, error: eErr } = await supabase
      .from('elections')
      .select('*')
      .eq('id', electionId)
      .maybeSingle();
    if (eErr) throw eErr;
    if (!election) return null;

    const { data: positions, error: pErr } = await supabase
      .from('positions')
      .select('*')
      .eq('election_id', electionId)
      .order('sort_order', { ascending: true });
    if (pErr) throw pErr;

    const positionsWithCandidates: PositionWithCandidates[] = [];
    let totalVotes = 0;
    let hasVoted = false;

    for (const pos of positions ?? []) {
      const { data: candidates, error: cErr } = await supabase
        .from('candidates')
        .select('*')
        .eq('position_id', pos.id)
        .order('sort_order', { ascending: true });
      if (cErr) throw cErr;

      const candidatesWithVotes: CandidateWithVotes[] = [];
      let posTotal = 0;

      for (const cand of candidates ?? []) {
        const { count } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('candidate_id', cand.id);
        const vc = count ?? 0;
        posTotal += vc;
        candidatesWithVotes.push({ ...(cand as Candidate), vote_count: vc });
      }

      totalVotes += posTotal;

      if (userId) {
        const { count: myVote } = await supabase
          .from('votes')
          .select('*', { count: 'exact', head: true })
          .eq('position_id', pos.id)
          .eq('voter_id', userId);
        if ((myVote ?? 0) > 0) hasVoted = true;
      }

      positionsWithCandidates.push({
        ...(pos as Position),
        candidates: candidatesWithVotes,
        total_votes: posTotal,
      });
    }

    return { ...(election as Election), positions: positionsWithCandidates, total_votes: totalVotes, has_voted: hasVoted };
  }

  async castVote(electionId: string, positionId: string, candidateId: string): Promise<{ success: boolean; error?: string }> {
    const { data, error } = await supabase.rpc('cast_vote', {
      p_election_id: electionId,
      p_position_id: positionId,
      p_candidate_id: candidateId,
    });
    if (error) return { success: false, error: error.message };
    return data as { success: boolean; error?: string };
  }

  // ---- Admin CRUD ----

  async createElection(e: Partial<Election>): Promise<Election | null> {
    const { data, error } = await supabase
      .from('elections')
      .insert({
        title: e.title,
        description: e.description,
        start_date: e.start_date,
        end_date: e.end_date,
        is_active: e.is_active ?? false,
        results_published: e.results_published ?? false,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Election;
  }

  async updateElection(id: string, updates: Partial<Election>): Promise<void> {
    const { error } = await supabase.from('elections').update(updates).eq('id', id);
    if (error) throw error;
  }

  async deleteElection(id: string): Promise<void> {
    const { error } = await supabase.from('elections').delete().eq('id', id);
    if (error) throw error;
  }

  async toggleActive(id: string, active: boolean): Promise<void> {
    const { error } = await supabase.from('elections').update({ is_active: active }).eq('id', id);
    if (error) throw error;
  }

  async toggleResults(id: string, published: boolean): Promise<void> {
    const { error } = await supabase.from('elections').update({ results_published: published }).eq('id', id);
    if (error) throw error;
  }

  // ---- Positions ----

  async getPositions(electionId: string): Promise<Position[]> {
    const { data, error } = await supabase
      .from('positions')
      .select('*')
      .eq('election_id', electionId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data as Position[]) ?? [];
  }

  async createPosition(electionId: string, title: string, description: string | null, sortOrder: number): Promise<Position | null> {
    const { data, error } = await supabase
      .from('positions')
      .insert({ election_id: electionId, title, description, sort_order: sortOrder })
      .select()
      .single();
    if (error) throw error;
    return data as Position;
  }

  async updatePosition(id: string, updates: Partial<Position>): Promise<void> {
    const { error } = await supabase.from('positions').update(updates).eq('id', id);
    if (error) throw error;
  }

  async deletePosition(id: string): Promise<void> {
    const { error } = await supabase.from('positions').delete().eq('id', id);
    if (error) throw error;
  }

  // ---- Candidates ----

  async getCandidates(positionId: string): Promise<Candidate[]> {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .eq('position_id', positionId)
      .order('sort_order', { ascending: true });
    if (error) throw error;
    return (data as Candidate[]) ?? [];
  }

  async createCandidate(c: Partial<Candidate> & { position_id: string }): Promise<Candidate | null> {
    const { data, error } = await supabase
      .from('candidates')
      .insert({
        position_id: c.position_id,
        full_name: c.full_name,
        biography: c.biography,
        manifesto: c.manifesto,
        photo_url: c.photo_url,
        sort_order: c.sort_order ?? 0,
      })
      .select()
      .single();
    if (error) throw error;
    return data as Candidate;
  }

  async updateCandidate(id: string, updates: Partial<Candidate>): Promise<void> {
    const { error } = await supabase.from('candidates').update(updates).eq('id', id);
    if (error) throw error;
  }

  async deleteCandidate(id: string): Promise<void> {
    const { error } = await supabase.from('candidates').delete().eq('id', id);
    if (error) throw error;
  }

  // ---- Stats ----

  async getStats(): Promise<{
    totalElections: number;
    activeElections: number;
    totalCandidates: number;
    totalVotes: number;
  }> {
    const [{ count: totalElections }, { count: activeElections }, { count: totalVotes }] = await Promise.all([
      supabase.from('elections').select('*', { count: 'exact', head: true }),
      supabase.from('elections').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('votes').select('*', { count: 'exact', head: true }),
    ]);

    let totalCandidates = 0;
    const { data: positions } = await supabase.from('positions').select('id');
    if (positions) {
      for (const p of positions) {
        const { count } = await supabase
          .from('candidates')
          .select('*', { count: 'exact', head: true })
          .eq('position_id', p.id);
        totalCandidates += count ?? 0;
      }
    }

    return {
      totalElections: totalElections ?? 0,
      activeElections: activeElections ?? 0,
      totalCandidates,
      totalVotes: totalVotes ?? 0,
    };
  }

  async getVoteCountByCandidate(candidateId: string): Promise<number> {
    const { count } = await supabase
      .from('votes')
      .select('*', { count: 'exact', head: true })
      .eq('candidate_id', candidateId);
    return count ?? 0;
  }
}
