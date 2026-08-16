import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { RevealDirective } from '../../reveal.directive';
import { MemberAuthService } from '../../services/member-auth';
import { VotingService, Election, ElectionWithDetails } from '../../services/voting.service';
import { ToastService } from '../../ui-state';

@Component({
  selector: 'app-vote',
  standalone: true,
  imports: [FormsModule, RouterLink, RevealDirective],
  templateUrl: './vote.html',
  styleUrl: './vote.css',
})
export class Vote {
  auth = inject(MemberAuthService);
  private voting = inject(VotingService);
  private toast = inject(ToastService);

  activeElections = signal<Election[]>([]);
  selectedElection = signal<ElectionWithDetails | null>(null);
  loading = signal(true);
  submitting = signal(false);
  hasVoted = signal(false);
  selections = signal<Record<string, string>>({});
  showReview = signal(false);

  constructor() {
    this.loadActiveElections();
  }

  async loadActiveElections() {
    this.loading.set(true);
    try {
      const elections = await this.voting.getActiveElections();
      const now = new Date();
      const open = elections.filter(
        (e) => new Date(e.start_date) <= now && new Date(e.end_date) >= now
      );
      this.activeElections.set(open);
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to load elections');
    }
    this.loading.set(false);
  }

  async openElection(e: Election) {
    this.loading.set(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      const details = await this.voting.getElectionDetails(e.id, userId);
      this.selectedElection.set(details);
      this.hasVoted.set(details?.has_voted ?? false);
      this.selections.set({});
      this.showReview.set(false);
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to load election');
    }
    this.loading.set(false);
  }

  backToList() {
    this.selectedElection.set(null);
    this.selections.set({});
    this.showReview.set(false);
  }

  selectCandidate(positionId: string, candidateId: string) {
    this.selections.update((s) => ({ ...s, [positionId]: candidateId }));
  }

  allPositionsSelected(): boolean {
    const details = this.selectedElection();
    if (!details) return false;
    return details.positions.every((p) => this.selections()[p.id]);
  }

  reviewVotes() {
    this.showReview.set(true);
  }

  candidateName(positionId: string): string {
    const details = this.selectedElection();
    if (!details) return '';
    const pos = details.positions.find((p) => p.id === positionId);
    const candId = this.selections()[positionId];
    const cand = pos?.candidates.find((c) => c.id === candId);
    return cand?.full_name ?? '';
  }

  async submitVotes() {
    const details = this.selectedElection();
    if (!details || !this.allPositionsSelected()) return;
    this.submitting.set(true);
    let allOk = true;
    let errMsg = '';
    for (const [positionId, candidateId] of Object.entries(this.selections())) {
      const result = await this.voting.castVote(details.id, positionId, candidateId);
      if (!result.success) {
        allOk = false;
        errMsg = result.error || 'Failed to cast vote';
        break;
      }
    }
    this.submitting.set(false);
    if (allOk) {
      this.hasVoted.set(true);
      this.showReview.set(false);
      this.toast.show('Your vote has been submitted successfully!');
    } else {
      this.toast.show(errMsg);
    }
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  trackPosition(_: number, p: { id: string }): string {
    return p.id;
  }

  selectedCount = computed(() => Object.keys(this.selections()).length);

  trackCandidate(_: number, c: { id: string }): string {
    return c.id;
  }
}

import { supabase } from '../../supabase';
