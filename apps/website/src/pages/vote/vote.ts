import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Election, ElectionWithDetails, VoterDetails, VotingService } from '@astec/api-client';
import { ToastService } from '@astec/ui';

@Component({
  selector: 'app-vote',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './vote.html',
  styleUrl: './vote.css',
})
export class Vote {
  private voting = inject(VotingService);
  private toast = inject(ToastService);

  activeElections = signal<Election[]>([]);
  selectedElection = signal<ElectionWithDetails | null>(null);
  loading = signal(true);
  submitting = signal(false);
  hasVoted = signal(false);
  selections = signal<Record<string, string>>({});
  showReview = signal(false);
  verificationStep = signal<'details' | 'otp' | 'verified'>('details');
  verificationOpen = signal(false);
  otp = '';
  otpLoading = signal(false);
  voter: VoterDetails = { name: '', email: '', phone: '', graduationYear: '' };
  maskedPhone = '';
  closedElection = computed(() => {
    const election = this.selectedElection();
    return !!election && new Date(election.end_date) < new Date();
  });

  constructor() {
    this.loadActiveElections();
  }

  async loadActiveElections() {
    this.loading.set(true);
    try {
      const elections = await this.voting.getActiveElections();
      const now = new Date();
      this.activeElections.set(elections);
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to load elections');
    }
    this.loading.set(false);
  }

  async openElection(e: Election) {
    this.loading.set(true);
    try {
      const details = await this.voting.getElectionDetails(e.id);
      this.selectedElection.set(details);
      this.hasVoted.set(details?.has_voted ?? false);
      this.selections.set({});
      this.showReview.set(false);
      this.verificationOpen.set(false);
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to load election');
    }
    this.loading.set(false);
  }

  backToList() {
    this.selectedElection.set(null);
    this.selections.set({});
    this.showReview.set(false);
    this.verificationOpen.set(false);
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
    this.verificationOpen.set(true);
    this.verificationStep.set('details');
  }

  async requestOtp() {
    this.otpLoading.set(true);
    const result = await this.voting.requestOtp(this.voter);
    this.otpLoading.set(false);
    if (!result.success) return;
    this.maskedPhone = result.maskedPhone;
    this.verificationStep.set('otp');
  }

  async verifyOtp() {
    this.otpLoading.set(true);
    const result = await this.voting.verifyOtp(this.voter, this.otp);
    this.otpLoading.set(false);
    if (!result.success) {
      this.toast.show(result.error ?? 'Verification failed.');
      return;
    }
    this.verificationStep.set('verified');
    this.showReview.set(true);
  }

  closeVerification() {
    this.verificationOpen.set(false);
    this.otp = '';
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
    if (!details || !this.allPositionsSelected() || this.verificationStep() !== 'verified') return;
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
      await this.voting.finalizeVote(details.id);
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

  statusLabel(election: Election): string {
    const now = new Date();
    if (new Date(election.end_date) < now) return 'Closed';
    if (new Date(election.start_date) > now) return 'Upcoming';
    return 'Open';
  }

  trackPosition(_: number, p: { id: string }): string {
    return p.id;
  }

  selectedCount = computed(() => Object.keys(this.selections()).length);

  trackCandidate(_: number, c: { id: string }): string {
    return c.id;
  }
}
