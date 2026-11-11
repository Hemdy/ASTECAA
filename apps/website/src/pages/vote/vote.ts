import { Component, signal, computed, inject, OnDestroy, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Election, ElectionWithDetails, VoterDetails, VotingService, Candidate } from '@astec/api-client';
import { ToastService } from '@astec/ui';

@Component({
  selector: 'app-vote',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './vote.html',
  styleUrl: './vote.css',
})
export class Vote implements OnDestroy {
  private voting = inject(VotingService);
  private toast = inject(ToastService);

  activeElections = signal<Election[]>([]);
  selectedElection = signal<ElectionWithDetails | null>(null);
  loading = signal(true);
  submitting = signal(false);
  hasVoted = signal(false);
  selections = signal<Record<string, string>>({});
  showReview = signal(false);

  // Dedicated Manifesto Reader Modal state
  activeManifestoCandidate = signal<{ candidate: Candidate; positionTitle: string; positionId: string } | null>(null);

  // Verification & OTP state
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

  upcomingElection = computed(() => {
    const election = this.selectedElection();
    return !!election && new Date(election.start_date) > new Date();
  });

  selectedCount = computed(() => Object.keys(this.selections()).length);
  totalPositions = computed(() => this.selectedElection()?.positions.length || 0);

  constructor() {
    this.loadActiveElections();
  }

  ngOnDestroy(): void {
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  async loadActiveElections() {
    this.loading.set(true);
    try {
      const elections = await this.voting.getActiveElections();
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
      this.activeManifestoCandidate.set(null);
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
    this.activeManifestoCandidate.set(null);
  }

  selectCandidate(positionId: string, candidateId: string, event?: Event) {
    if (event) event.stopPropagation();
    this.selections.update((s) => ({ ...s, [positionId]: candidateId }));
  }

  isCandidateSelected(positionId: string, candidateId: string): boolean {
    return this.selections()[positionId] === candidateId;
  }

  isPositionComplete(positionId: string): boolean {
    return Boolean(this.selections()[positionId]);
  }

  openManifesto(candidate: Candidate, positionTitle: string, positionId: string, event?: Event): void {
    if (event) event.stopPropagation();
    this.activeManifestoCandidate.set({ candidate, positionTitle, positionId });
    if (typeof document !== 'undefined') {
      document.body.style.overflow = 'hidden';
    }
  }

  closeManifesto(): void {
    this.activeManifestoCandidate.set(null);
    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
  }

  selectCandidateFromManifesto(): void {
    const item = this.activeManifestoCandidate();
    if (item) {
      this.selectCandidate(item.positionId, item.candidate.id);
      this.closeManifesto();
      this.toast.show(`Selected ${item.candidate.full_name} for ${item.positionTitle}`);
    }
  }

  allPositionsSelected(): boolean {
    const details = this.selectedElection();
    if (!details || details.positions.length === 0) return false;
    return details.positions.every((p) => this.selections()[p.id]);
  }

  reviewVotes() {
    this.verificationOpen.set(true);
    this.verificationStep.set('details');
  }

  async requestOtp() {
    this.otpLoading.set(true);
    try {
      const result = await this.voting.requestOtp(this.voter, this.selectedElection()?.id);
      this.otpLoading.set(false);
      if (!result.success) {
        this.toast.show('Could not send verification code.');
        return;
      }
      this.maskedPhone = result.maskedPhone;
      if (result.debugOtp) {
        this.otp = result.debugOtp;
      }
      this.verificationStep.set('otp');
    } catch (err: any) {
      this.otpLoading.set(false);
      this.toast.show(err.message || 'Could not send verification code.');
    }
  }

  async verifyOtp() {
    this.otpLoading.set(true);
    try {
      const result = await this.voting.verifyOtp(this.voter, this.otp, this.selectedElection()?.id);
      this.otpLoading.set(false);
      if (!result.success) {
        this.toast.show(result.error ?? 'Verification failed.');
        return;
      }
      this.verificationStep.set('verified');
      this.showReview.set(true);
    } catch (err: any) {
      this.otpLoading.set(false);
      this.toast.show(err.message || 'Verification failed.');
    }
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
    return cand?.full_name ?? 'No selection';
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
      this.toast.show('Your official ballot has been submitted successfully!');
    } else {
      this.toast.show(errMsg);
    }
  }

  formatDate(iso: string): string {
    if (!iso) return '';
    return new Date(iso).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  statusLabel(election: Election): 'Open' | 'Upcoming' | 'Closed' {
    const now = new Date();
    if (new Date(election.end_date) < now) return 'Closed';
    if (new Date(election.start_date) > now) return 'Upcoming';
    return 'Open';
  }

  onCandidatePhotoError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = '/images/empty/avatar-fallback.jpg';
  }

  @HostListener('window:keydown.escape')
  onEscape(): void {
    if (this.activeManifestoCandidate()) {
      this.closeManifesto();
    } else if (this.verificationOpen()) {
      this.closeVerification();
    }
  }
}
