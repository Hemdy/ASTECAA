import { Component, signal, computed, inject } from '@angular/core';
import { AdmConfirm } from '../../components/adm-confirm/adm-confirm';
import { ToastService } from '../../../ui-state';
import { VotingService, ElectionWithDetails } from '../../../services/voting.service';

@Component({
  selector: 'app-admin-voting-results',
  standalone: true,
  imports: [AdmConfirm],
  templateUrl: './admin-voting-results.html',
})


export class AdminVotingResults {
  private toast = inject(ToastService);
  private voting = inject(VotingService);

  elections = signal<{ id: string; title: string; is_active: boolean; results_published: boolean }[]>([]);
  selectedId = signal<string | null>(null);
  details = signal<ElectionWithDetails | null>(null);
  loading = signal(false);

  constructor() {
    this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      await this.voting.loadElections();
      this.elections.set(
        this.voting.elections().map((e) => ({
          id: e.id,
          title: e.title,
          is_active: e.is_active,
          results_published: e.results_published,
        }))
      );
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to load elections');
    }
    this.loading.set(false);
  }

  async selectElection(id: string) {
    this.selectedId.set(id);
    this.loading.set(true);
    try {
      const detail = await this.voting.getElectionDetails(id);
      this.details.set(detail);
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to load results');
    }
    this.loading.set(false);
  }

  async togglePublish(e: { id: string; results_published: boolean }) {
    try {
      await this.voting.toggleResults(e.id, !e.results_published);
      this.toast.show(e.results_published ? 'Results hidden from public.' : 'Results published to public.');
      await this.load();
      if (this.selectedId() === e.id) await this.selectElection(e.id);
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to toggle results');
    }
  }

  maxVotes(pos: ElectionWithDetails['positions'][number]): number {
    return Math.max(1, ...pos.candidates.map((c) => c.vote_count));
  }

  pct(count: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((count / total) * 100);
  }

  winner(pos: ElectionWithDetails['positions'][number]): string | null {
    if (pos.candidates.length === 0 || pos.total_votes === 0) return null;
    const sorted = [...pos.candidates].sort((a, b) => b.vote_count - a.vote_count);
    if (sorted[0].vote_count === sorted[1]?.vote_count) return null;
    return sorted[0].full_name;
  }

  totalVoters(): number {
    return this.details()?.total_votes ?? 0;
  }

  trackCandidate(_: number, c: { id: string }): string {
    return c.id;
  }
}
