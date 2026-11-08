import { Injectable, Logger } from '@nestjs/common';
import { and, desc, eq, inArray, sql } from 'drizzle-orm';
import { createHash, randomInt } from 'node:crypto';
import {
  candidates,
  elections,
  electionVoters,
  positions,
  voterOtpRequests,
  votes,
} from '@astec/database';
import { DatabaseService } from '../database/database.service.js';
import { AppError } from '../core/app-error.js';

function computeVoterHash(electionId: string, email: string): string {
  return createHash('sha256')
    .update(`${electionId}:${email.trim().toLowerCase()}`)
    .digest('hex');
}

function hashOtp(otp: string): string {
  return createHash('sha256').update(otp.trim()).digest('hex');
}

@Injectable()
export class VotingService {
  private readonly logger = new Logger(VotingService.name);

  constructor(private readonly database: DatabaseService) {}

  // --- Elections (Admin & Public) ---

  async listElections(activeOnly = false) {
    const db = this.database.db;
    const now = new Date();

    const allElections = await db
      .select()
      .from(elections)
      .orderBy(desc(elections.startDate));

    if (activeOnly) {
      return allElections.filter((e) => e.isActive && new Date(e.startDate) <= now);
    }
    return allElections;
  }

  async getElectionDetails(electionId: string, voterEmail?: string) {
    const db = this.database.db;

    const [election] = await db
      .select()
      .from(elections)
      .where(eq(elections.id, electionId))
      .limit(1);

    if (!election) {
      throw new AppError(404, 'Election not found.', 'NOT_FOUND');
    }

    const posList = await db
      .select()
      .from(positions)
      .where(eq(positions.electionId, electionId))
      .orderBy(positions.sortOrder);

    const posIds = posList.map((p) => p.id);
    let candList: Array<typeof candidates.$inferSelect> = [];
    if (posIds.length > 0) {
      candList = await db
        .select()
        .from(candidates)
        .where(inArray(candidates.positionId, posIds))
        .orderBy(candidates.sortOrder);
    }

    // Tally votes if results are published or for admin stats
    let voteCountsMap = new Map<string, number>();
    const voteRows = await db
      .select({
        candidateId: votes.candidateId,
        count: sql<number>`count(*)::int`,
      })
      .from(votes)
      .where(eq(votes.electionId, electionId))
      .groupBy(votes.candidateId);

    for (const v of voteRows) {
      voteCountsMap.set(v.candidateId, v.count);
    }

    let hasVoted = false;
    if (voterEmail) {
      const vHash = computeVoterHash(electionId, voterEmail);
      const [votedRecord] = await db
        .select({ id: electionVoters.id })
        .from(electionVoters)
        .where(
          and(
            eq(electionVoters.electionId, electionId),
            eq(electionVoters.voterHash, vHash),
          ),
        )
        .limit(1);
      hasVoted = !!votedRecord;
    }

    const positionsWithCandidates = posList.map((pos) => {
      const posCandidates = candList
        .filter((c) => c.positionId === pos.id)
        .map((c) => {
          const voteCount = election.resultsPublished ? (voteCountsMap.get(c.id) ?? 0) : 0;
          return {
            id: c.id,
            position_id: c.positionId,
            full_name: c.fullName,
            graduation_year: c.graduationYear ?? undefined,
            department: c.department ?? undefined,
            biography: c.biography,
            manifesto: c.manifesto,
            photo_url: c.photoUrl,
            sort_order: c.sortOrder,
            vote_count: voteCount,
          };
        });

      const totalVotes = posCandidates.reduce((sum, c) => sum + c.vote_count, 0);

      return {
        id: pos.id,
        election_id: pos.electionId,
        title: pos.title,
        description: pos.description,
        sort_order: pos.sortOrder,
        candidates: posCandidates,
        total_votes: totalVotes,
      };
    });

    const totalVotes = positionsWithCandidates.reduce((sum, p) => sum + p.total_votes, 0);

    return {
      id: election.id,
      title: election.title,
      description: election.description,
      start_date: election.startDate.toISOString(),
      end_date: election.endDate.toISOString(),
      is_active: election.isActive,
      results_published: election.resultsPublished,
      created_at: election.createdAt.toISOString(),
      positions: positionsWithCandidates,
      total_votes: totalVotes,
      has_voted: hasVoted,
    };
  }

  async getAdminResults(electionId: string) {
    const db = this.database.db;
    const [election] = await db
      .select()
      .from(elections)
      .where(eq(elections.id, electionId))
      .limit(1);

    if (!election) {
      throw new AppError(404, 'Election not found.', 'NOT_FOUND');
    }

    const posList = await db
      .select()
      .from(positions)
      .where(eq(positions.electionId, electionId))
      .orderBy(positions.sortOrder);

    const posIds = posList.map((p) => p.id);
    let candList: Array<typeof candidates.$inferSelect> = [];
    if (posIds.length > 0) {
      candList = await db
        .select()
        .from(candidates)
        .where(inArray(candidates.positionId, posIds))
        .orderBy(candidates.sortOrder);
    }

    const voteCountsMap = new Map<string, number>();
    const voteRows = await db
      .select({
        candidateId: votes.candidateId,
        count: sql<number>`count(*)::int`,
      })
      .from(votes)
      .where(eq(votes.electionId, electionId))
      .groupBy(votes.candidateId);

    for (const v of voteRows) {
      voteCountsMap.set(v.candidateId, v.count);
    }

    const positionsWithCandidates = posList.map((pos) => {
      const posCandidates = candList
        .filter((c) => c.positionId === pos.id)
        .map((c) => ({
          id: c.id,
          position_id: c.positionId,
          full_name: c.fullName,
          graduation_year: c.graduationYear ?? undefined,
          department: c.department ?? undefined,
          biography: c.biography,
          manifesto: c.manifesto,
          photo_url: c.photoUrl,
          sort_order: c.sortOrder,
          vote_count: voteCountsMap.get(c.id) ?? 0,
        }));

      const totalVotes = posCandidates.reduce((sum, c) => sum + c.vote_count, 0);

      return {
        id: pos.id,
        election_id: pos.electionId,
        title: pos.title,
        description: pos.description,
        sort_order: pos.sortOrder,
        candidates: posCandidates,
        total_votes: totalVotes,
      };
    });

    const totalVotes = positionsWithCandidates.reduce((sum, p) => sum + p.total_votes, 0);

    return {
      id: election.id,
      title: election.title,
      description: election.description,
      start_date: election.startDate.toISOString(),
      end_date: election.endDate.toISOString(),
      is_active: election.isActive,
      results_published: election.resultsPublished,
      created_at: election.createdAt.toISOString(),
      positions: positionsWithCandidates,
      total_votes: totalVotes,
      has_voted: false,
    };
  }

  async createElection(data: {
    title: string;
    description?: string;
    start_date?: string;
    end_date?: string;
    is_active?: boolean;
    results_published?: boolean;
  }) {
    const db = this.database.db;
    const startDate = data.start_date ? new Date(data.start_date) : new Date();
    const endDate = data.end_date
      ? new Date(data.end_date)
      : new Date(Date.now() + 7 * 86400000);

    const [election] = await db
      .insert(elections)
      .values({
        title: data.title,
        description: data.description,
        startDate,
        endDate,
        isActive: data.is_active ?? false,
        resultsPublished: data.results_published ?? false,
      })
      .returning();

    return {
      id: election.id,
      title: election.title,
      description: election.description,
      start_date: election.startDate.toISOString(),
      end_date: election.endDate.toISOString(),
      is_active: election.isActive,
      results_published: election.resultsPublished,
      created_at: election.createdAt.toISOString(),
    };
  }

  async updateElection(id: string, updates: Partial<{
    title: string;
    description: string | null;
    start_date: string;
    end_date: string;
    is_active: boolean;
    results_published: boolean;
  }>) {
    const patch: any = { updatedAt: new Date() };
    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.start_date !== undefined) patch.startDate = new Date(updates.start_date);
    if (updates.end_date !== undefined) patch.endDate = new Date(updates.end_date);
    if (updates.is_active !== undefined) patch.isActive = updates.is_active;
    if (updates.results_published !== undefined) patch.resultsPublished = updates.results_published;

    await this.database.db.update(elections).set(patch).where(eq(elections.id, id));
    return { success: true };
  }

  async deleteElection(id: string) {
    await this.database.db.delete(elections).where(eq(elections.id, id));
    return { success: true };
  }

  // --- Positions ---

  async getPositions(electionId: string) {
    const list = await this.database.db
      .select()
      .from(positions)
      .where(eq(positions.electionId, electionId))
      .orderBy(positions.sortOrder);

    return list.map((p) => ({
      id: p.id,
      election_id: p.electionId,
      title: p.title,
      description: p.description,
      sort_order: p.sortOrder,
    }));
  }

  async createPosition(electionId: string, title: string, description: string | null, sortOrder: number) {
    const [p] = await this.database.db
      .insert(positions)
      .values({
        electionId,
        title,
        description,
        sortOrder,
      })
      .returning();

    return {
      id: p.id,
      election_id: p.electionId,
      title: p.title,
      description: p.description,
      sort_order: p.sortOrder,
    };
  }

  async updatePosition(id: string, updates: Partial<{ title: string; description: string | null; sort_order: number }>) {
    const patch: any = { updatedAt: new Date() };
    if (updates.title !== undefined) patch.title = updates.title;
    if (updates.description !== undefined) patch.description = updates.description;
    if (updates.sort_order !== undefined) patch.sortOrder = updates.sort_order;

    await this.database.db.update(positions).set(patch).where(eq(positions.id, id));
    return { success: true };
  }

  async deletePosition(id: string) {
    await this.database.db.delete(positions).where(eq(positions.id, id));
    return { success: true };
  }

  // --- Candidates ---

  async getCandidates(positionId: string) {
    const list = await this.database.db
      .select()
      .from(candidates)
      .where(eq(candidates.positionId, positionId))
      .orderBy(candidates.sortOrder);

    return list.map((c) => ({
      id: c.id,
      position_id: c.positionId,
      full_name: c.fullName,
      graduation_year: c.graduationYear ?? undefined,
      department: c.department ?? undefined,
      biography: c.biography,
      manifesto: c.manifesto,
      photo_url: c.photoUrl,
      sort_order: c.sortOrder,
    }));
  }

  async createCandidate(c: {
    position_id: string;
    full_name?: string;
    graduation_year?: number;
    department?: string;
    biography?: string | null;
    manifesto?: string | null;
    photo_url?: string | null;
    sort_order?: number;
  }) {
    const [cand] = await this.database.db
      .insert(candidates)
      .values({
        positionId: c.position_id,
        fullName: c.full_name || 'Candidate',
        graduationYear: c.graduation_year,
        department: c.department,
        biography: c.biography,
        manifesto: c.manifesto,
        photoUrl: c.photo_url,
        sortOrder: c.sort_order ?? 0,
      })
      .returning();

    return {
      id: cand.id,
      position_id: cand.positionId,
      full_name: cand.fullName,
      graduation_year: cand.graduationYear ?? undefined,
      department: cand.department ?? undefined,
      biography: cand.biography,
      manifesto: cand.manifesto,
      photo_url: cand.photoUrl,
      sort_order: cand.sortOrder,
    };
  }

  async updateCandidate(id: string, updates: Partial<{
    full_name: string;
    graduation_year: number;
    department: string;
    biography: string | null;
    manifesto: string | null;
    photo_url: string | null;
    sort_order: number;
  }>) {
    const patch: any = { updatedAt: new Date() };
    if (updates.full_name !== undefined) patch.fullName = updates.full_name;
    if (updates.graduation_year !== undefined) patch.graduationYear = updates.graduation_year;
    if (updates.department !== undefined) patch.department = updates.department;
    if (updates.biography !== undefined) patch.biography = updates.biography;
    if (updates.manifesto !== undefined) patch.manifesto = updates.manifesto;
    if (updates.photo_url !== undefined) patch.photoUrl = updates.photo_url;
    if (updates.sort_order !== undefined) patch.sortOrder = updates.sort_order;

    await this.database.db.update(candidates).set(patch).where(eq(candidates.id, id));
    return { success: true };
  }

  async deleteCandidate(id: string) {
    await this.database.db.delete(candidates).where(eq(candidates.id, id));
    return { success: true };
  }

  // --- Voting, OTP & Ballot Casting ---

  async requestOtp(
    electionId: string,
    voter: { name: string; email: string; phone: string; graduationYear: string },
  ) {
    const db = this.database.db;
    const emailNorm = voter.email.trim().toLowerCase();

    if (!voter.name.trim() || !emailNorm || !voter.phone.trim() || !voter.graduationYear.trim()) {
      throw new AppError(400, 'All voter details are required for verification.', 'INVALID_INPUT');
    }

    const [election] = await db
      .select()
      .from(elections)
      .where(eq(elections.id, electionId))
      .limit(1);

    if (!election || !election.isActive) {
      throw new AppError(400, 'This election is not currently open for voting.', 'ELECTION_CLOSED');
    }

    const now = new Date();
    if (election.endDate < now || election.startDate > now) {
      throw new AppError(400, 'This election is outside the voting window.', 'ELECTION_CLOSED');
    }

    const voterHash = computeVoterHash(electionId, emailNorm);
    const [alreadyVoted] = await db
      .select({ id: electionVoters.id })
      .from(electionVoters)
      .where(
        and(
          eq(electionVoters.electionId, electionId),
          eq(electionVoters.voterHash, voterHash),
        ),
      )
      .limit(1);

    if (alreadyVoted) {
      throw new AppError(400, 'You have already voted in this election.', 'ALREADY_VOTED');
    }

    // Generate 6-digit OTP
    const rawOtp = randomInt(100000, 999999).toString();
    const otpHashValue = hashOtp(rawOtp);
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await db.insert(voterOtpRequests).values({
      electionId,
      name: voter.name.trim(),
      emailNormalized: emailNorm,
      phone: voter.phone.trim(),
      graduationYear: voter.graduationYear.trim(),
      otpHash: otpHashValue,
      expiresAt,
      verified: false,
    });

    this.logger.log(`[Voting OTP] Verification OTP generated for ${emailNorm} in election ${electionId}: ${rawOtp}`);

    const cleanPhone = voter.phone.trim();
    const maskedPhone =
      cleanPhone.length >= 4
        ? `${cleanPhone.slice(0, 3)}••••${cleanPhone.slice(-2)}`
        : cleanPhone;

    return {
      success: true,
      maskedPhone,
      // For development ease, include otp in log and response if not production
      ...(process.env.APP_ENV !== 'production' ? { debugOtp: rawOtp } : {}),
    };
  }

  async verifyOtp(electionId: string, email: string, otp: string) {
    const db = this.database.db;
    const emailNorm = email.trim().toLowerCase();
    const inputOtpHash = hashOtp(otp);
    const now = new Date();

    const [validRequest] = await db
      .select()
      .from(voterOtpRequests)
      .where(
        and(
          eq(voterOtpRequests.electionId, electionId),
          eq(voterOtpRequests.emailNormalized, emailNorm),
          eq(voterOtpRequests.otpHash, inputOtpHash),
        ),
      )
      .orderBy(desc(voterOtpRequests.createdAt))
      .limit(1);

    if (!validRequest || validRequest.expiresAt < now) {
      throw new AppError(400, 'The verification code is incorrect or expired.', 'INVALID_OTP');
    }

    await db
      .update(voterOtpRequests)
      .set({ verified: true })
      .where(eq(voterOtpRequests.id, validRequest.id));

    return { success: true };
  }

  async castVote(electionId: string, positionId: string, candidateId: string, voterEmail: string) {
    const db = this.database.db;
    const emailNorm = voterEmail.trim().toLowerCase();
    const voterHash = computeVoterHash(electionId, emailNorm);

    // Ensure voter completed OTP verification
    const [verifiedRequest] = await db
      .select()
      .from(voterOtpRequests)
      .where(
        and(
          eq(voterOtpRequests.electionId, electionId),
          eq(voterOtpRequests.emailNormalized, emailNorm),
          eq(voterOtpRequests.verified, true),
        ),
      )
      .limit(1);

    if (!verifiedRequest) {
      throw new AppError(403, 'Voter verification required before casting a ballot.', 'VERIFICATION_REQUIRED');
    }

    // Check if ballot was already finalized
    const [ballotFinalized] = await db
      .select({ id: electionVoters.id })
      .from(electionVoters)
      .where(
        and(
          eq(electionVoters.electionId, electionId),
          eq(electionVoters.voterHash, voterHash),
        ),
      )
      .limit(1);

    if (ballotFinalized) {
      throw new AppError(400, 'Your ballot has already been submitted.', 'ALREADY_VOTED');
    }

    // Insert vote record (unique per election + position + voterHash)
    try {
      await db.insert(votes).values({
        electionId,
        positionId,
        candidateId,
        voterHash,
      });
    } catch {
      // If already voted for this position, update to new choice
      await db
        .update(votes)
        .set({ candidateId, createdAt: new Date() })
        .where(
          and(
            eq(votes.electionId, electionId),
            eq(votes.positionId, positionId),
            eq(votes.voterHash, voterHash),
          ),
        );
    }

    return { success: true };
  }

  async finalizeVote(electionId: string, voterEmail: string) {
    const db = this.database.db;
    const emailNorm = voterEmail.trim().toLowerCase();
    const voterHash = computeVoterHash(electionId, emailNorm);

    await db
      .insert(electionVoters)
      .values({
        electionId,
        voterHash,
        voterEmailNormalized: emailNorm,
      })
      .onConflictDoNothing();

    return { success: true };
  }
}

