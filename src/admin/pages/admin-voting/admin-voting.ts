import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdmModal } from '../../components/adm-modal/adm-modal';
import { AdmConfirm } from '../../components/adm-confirm/adm-confirm';
import { ToastService } from '../../../ui-state';
import { VotingService, Election, Position, Candidate } from '../../../services/voting.service';

@Component({
  selector: 'app-admin-voting',
  standalone: true,
  imports: [FormsModule, AdmModal, AdmConfirm],
  templateUrl: './admin-voting.html',
})
export class AdminVoting {
  private toast = inject(ToastService);
  private voting = inject(VotingService);

  elections = signal<Election[]>([]);
  loading = signal(true);
  query = signal('');

  selectedElection = signal<Election | null>(null);
  positions = signal<Position[]>([]);
  candidatesByPosition = signal<Record<string, Candidate[]>>({});

  showElectionModal = signal(false);
  editingElection = signal(false);
  deleteTarget = signal<Election | null>(null);

  showPositionModal = signal(false);
  editingPosition = signal(false);
  deletePositionTarget = signal<Position | null>(null);

  showCandidateModal = signal(false);
  editingCandidate = signal(false);
  deleteCandidateTarget = signal<Candidate | null>(null);
  candidatePositionId = signal<string>('');

  electionForm: Partial<Election> = {};
  positionForm: Partial<Position> = {};
  candidateForm: Partial<Candidate> & { position_id?: string } = {};

  filtered = computed(() => {
    const q = this.query().toLowerCase();
    return this.elections().filter((e) => !q || e.title.toLowerCase().includes(q));
  });

  constructor() {
    this.load();
  }

  async load() {
    this.loading.set(true);
    try {
      await this.voting.loadElections();
      this.elections.set(this.voting.elections());
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to load elections');
    }
    this.loading.set(false);
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  electionStatus(e: Election): string {
    if (!e.is_active) return 'Inactive';
    const now = new Date();
    if (new Date(e.end_date) < now) return 'Closed';
    if (new Date(e.start_date) > now) return 'Scheduled';
    return 'Active';
  }

  // ---- Election CRUD ----

  openCreateElection() {
    this.editingElection.set(false);
    this.electionForm = {
      title: '',
      description: '',
      start_date: new Date().toISOString().slice(0, 16),
      end_date: new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 16),
      is_active: false,
      results_published: false,
    };
    this.showElectionModal.set(true);
  }

  openEditElection(e: Election) {
    this.editingElection.set(true);
    this.electionForm = {
      ...e,
      start_date: e.start_date.slice(0, 16),
      end_date: e.end_date.slice(0, 16),
    };
    this.showElectionModal.set(true);
  }

  async saveElection() {
    if (!this.electionForm.title) {
      this.toast.show('Please give the election a title.');
      return;
    }
    if (!this.electionForm.start_date || !this.electionForm.end_date) {
      this.toast.show('Start and end dates are required.');
      return;
    }
    try {
      const payload = {
        ...this.electionForm,
        start_date: new Date(this.electionForm.start_date).toISOString(),
        end_date: new Date(this.electionForm.end_date).toISOString(),
      };
      if (this.editingElection() && this.electionForm.id) {
        await this.voting.updateElection(this.electionForm.id, payload);
        this.toast.show('Election updated.');
      } else {
        await this.voting.createElection(payload);
        this.toast.show('Election created.');
      }
      this.showElectionModal.set(false);
      await this.load();
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to save election');
    }
  }

  async toggleActive(e: Election) {
    try {
      await this.voting.toggleActive(e.id, !e.is_active);
      this.toast.show(e.is_active ? 'Election deactivated.' : 'Election activated — voting is now live!');
      await this.load();
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to toggle election');
    }
  }

  async toggleResults(e: Election) {
    try {
      await this.voting.toggleResults(e.id, !e.results_published);
      this.toast.show(e.results_published ? 'Results hidden.' : 'Results published.');
      await this.load();
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to toggle results');
    }
  }

  askDeleteElection(e: Election) {
    this.deleteTarget.set(e);
  }

  async confirmDeleteElection() {
    const t = this.deleteTarget();
    if (!t) return;
    try {
      await this.voting.deleteElection(t.id);
      this.toast.show('Election deleted.');
      if (this.selectedElection()?.id === t.id) {
        this.selectedElection.set(null);
      }
      await this.load();
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to delete election');
    }
    this.deleteTarget.set(null);
  }

  // ---- Election detail / positions / candidates ----

  async selectElection(e: Election) {
    this.selectedElection.set(e);
    await this.loadPositions(e.id);
  }

  backToList() {
    this.selectedElection.set(null);
    this.positions.set([]);
    this.candidatesByPosition.set({});
  }

  async loadPositions(electionId: string) {
    try {
      const positions = await this.voting.getPositions(electionId);
      this.positions.set(positions);
      const map: Record<string, Candidate[]> = {};
      for (const p of positions) {
        map[p.id] = await this.voting.getCandidates(p.id);
      }
      this.candidatesByPosition.set(map);
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to load positions');
    }
  }

  // ---- Position CRUD ----

  openCreatePosition() {
    this.editingPosition.set(false);
    this.positionForm = {
      title: '',
      description: '',
      sort_order: this.positions().length,
    };
    this.showPositionModal.set(true);
  }

  openEditPosition(p: Position) {
    this.editingPosition.set(true);
    this.positionForm = { ...p };
    this.showPositionModal.set(true);
  }

  async savePosition() {
    if (!this.positionForm.title) {
      this.toast.show('Please give the position a title.');
      return;
    }
    const e = this.selectedElection();
    if (!e) return;
    try {
      if (this.editingPosition() && this.positionForm.id) {
        await this.voting.updatePosition(this.positionForm.id, {
          title: this.positionForm.title,
          description: this.positionForm.description,
          sort_order: this.positionForm.sort_order,
        });
        this.toast.show('Position updated.');
      } else {
        await this.voting.createPosition(
          e.id,
          this.positionForm.title!,
          this.positionForm.description ?? null,
          this.positionForm.sort_order ?? 0
        );
        this.toast.show('Position added.');
      }
      this.showPositionModal.set(false);
      await this.loadPositions(e.id);
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to save position');
    }
  }

  askDeletePosition(p: Position) {
    this.deletePositionTarget.set(p);
  }

  async confirmDeletePosition() {
    const t = this.deletePositionTarget();
    if (!t) return;
    try {
      await this.voting.deletePosition(t.id);
      this.toast.show('Position deleted.');
      const e = this.selectedElection();
      if (e) await this.loadPositions(e.id);
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to delete position');
    }
    this.deletePositionTarget.set(null);
  }

  // ---- Candidate CRUD ----

  openCreateCandidate(positionId: string) {
    this.editingCandidate.set(false);
    this.candidatePositionId.set(positionId);
    this.candidateForm = {
      full_name: '',
      biography: '',
      manifesto: '',
      photo_url: '',
      sort_order: this.candidatesByPosition()[positionId]?.length ?? 0,
    };
    this.showCandidateModal.set(true);
  }

  openEditCandidate(c: Candidate, positionId: string) {
    this.editingCandidate.set(true);
    this.candidatePositionId.set(positionId);
    this.candidateForm = { ...c };
    this.showCandidateModal.set(true);
  }

  async saveCandidate() {
    if (!this.candidateForm.full_name) {
      this.toast.show('Please give the candidate a name.');
      return;
    }
    const positionId = this.candidatePositionId();
    if (!positionId) return;
    try {
      if (this.editingCandidate() && this.candidateForm.id) {
        await this.voting.updateCandidate(this.candidateForm.id, {
          full_name: this.candidateForm.full_name,
          biography: this.candidateForm.biography,
          manifesto: this.candidateForm.manifesto,
          photo_url: this.candidateForm.photo_url,
          sort_order: this.candidateForm.sort_order,
        });
        this.toast.show('Candidate updated.');
      } else {
        await this.voting.createCandidate({
          position_id: positionId,
          full_name: this.candidateForm.full_name,
          biography: this.candidateForm.biography,
          manifesto: this.candidateForm.manifesto,
          photo_url: this.candidateForm.photo_url,
          sort_order: this.candidateForm.sort_order ?? 0,
        });
        this.toast.show('Candidate added.');
      }
      this.showCandidateModal.set(false);
      const e = this.selectedElection();
      if (e) await this.loadPositions(e.id);
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to save candidate');
    }
  }

  askDeleteCandidate(c: Candidate) {
    this.deleteCandidateTarget.set(c);
  }

  async confirmDeleteCandidate() {
    const t = this.deleteCandidateTarget();
    if (!t) return;
    try {
      await this.voting.deleteCandidate(t.id);
      this.toast.show('Candidate deleted.');
      const e = this.selectedElection();
      if (e) await this.loadPositions(e.id);
    } catch (err: any) {
      this.toast.show(err.message || 'Failed to delete candidate');
    }
    this.deleteCandidateTarget.set(null);
  }

  placeholderPhoto(name: string): string {
    const encoded = encodeURIComponent(name);
    return `data:image/svg+xml,${encoded}`;
  }
}
