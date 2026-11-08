import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { RequirePermissions } from '../auth/permissions.decorator.js';
import { VotingService } from './voting.service.js';
import { AppError } from '../core/app-error.js';

@Controller('api')
export class VotingController {
  constructor(private readonly voting: VotingService) {}

  // ==========================================
  // Public & Alumni Voting Endpoints
  // ==========================================

  @Get('v1/elections')
  async listPublicElections() {
    return this.voting.listElections(false);
  }

  @Get('v1/elections/:id')
  async getPublicElectionDetails(
    @Param('id') id: string,
    @Query('voterEmail') voterEmail?: string,
  ) {
    return this.voting.getElectionDetails(id, voterEmail);
  }

  @Post('v1/elections/:id/request-otp')
  async requestOtp(
    @Param('id') id: string,
    @Body()
    body: {
      name: string;
      email: string;
      phone: string;
      graduationYear: string;
    },
  ) {
    return this.voting.requestOtp(id, body);
  }

  @Post('v1/elections/:id/verify-otp')
  async verifyOtp(
    @Param('id') id: string,
    @Body() body: { email: string; otp: string },
  ) {
    if (!body.email || !body.otp) {
      throw new AppError(400, 'Email and OTP code are required.', 'INVALID_INPUT');
    }
    return this.voting.verifyOtp(id, body.email, body.otp);
  }

  @Post('v1/elections/:id/vote')
  async castVote(
    @Param('id') id: string,
    @Body()
    body: {
      positionId: string;
      candidateId: string;
      voterEmail: string;
    },
  ) {
    if (!body.positionId || !body.candidateId || !body.voterEmail) {
      throw new AppError(400, 'Position, candidate, and voter email are required.', 'INVALID_INPUT');
    }
    return this.voting.castVote(id, body.positionId, body.candidateId, body.voterEmail);
  }

  @Post('v1/elections/:id/finalize')
  async finalizeVote(
    @Param('id') id: string,
    @Body() body: { voterEmail: string },
  ) {
    if (!body.voterEmail) {
      throw new AppError(400, 'Voter email is required.', 'INVALID_INPUT');
    }
    return this.voting.finalizeVote(id, body.voterEmail);
  }

  // ==========================================
  // Admin Elections Management Endpoints
  // ==========================================

  @Get('admin/v1/elections')
  @UseGuards(AdminGuard)
  @RequirePermissions('elections:read')
  async listAdminElections() {
    return this.voting.listElections(false);
  }

  @Post('admin/v1/elections')
  @UseGuards(AdminGuard)
  @RequirePermissions('elections:write')
  async createElection(
    @Body()
    body: {
      title: string;
      description?: string;
      start_date?: string;
      end_date?: string;
      is_active?: boolean;
      results_published?: boolean;
    },
  ) {
    if (!body.title?.trim()) {
      throw new AppError(400, 'Election title is required.', 'INVALID_INPUT');
    }
    return this.voting.createElection(body);
  }

  @Patch('admin/v1/elections/:id')
  @UseGuards(AdminGuard)
  @RequirePermissions('elections:write')
  async updateElection(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.voting.updateElection(id, body);
  }

  @Delete('admin/v1/elections/:id')
  @UseGuards(AdminGuard)
  @RequirePermissions('elections:write')
  async deleteElection(@Param('id') id: string) {
    return this.voting.deleteElection(id);
  }

  @Get('admin/v1/elections/:id/results')
  @UseGuards(AdminGuard)
  @RequirePermissions('elections:read')
  async getElectionResults(@Param('id') id: string) {
    return this.voting.getAdminResults(id);
  }

  // Positions
  @Get('admin/v1/elections/:id/positions')
  @UseGuards(AdminGuard)
  @RequirePermissions('elections:read')
  async getPositions(@Param('id') id: string) {
    return this.voting.getPositions(id);
  }

  @Post('admin/v1/elections/:id/positions')
  @UseGuards(AdminGuard)
  @RequirePermissions('elections:write')
  async createPosition(
    @Param('id') id: string,
    @Body()
    body: {
      title: string;
      description?: string | null;
      sort_order?: number;
    },
  ) {
    if (!body.title?.trim()) {
      throw new AppError(400, 'Position title is required.', 'INVALID_INPUT');
    }
    return this.voting.createPosition(id, body.title, body.description ?? null, body.sort_order ?? 0);
  }

  @Patch('admin/v1/positions/:id')
  @UseGuards(AdminGuard)
  @RequirePermissions('elections:write')
  async updatePosition(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.voting.updatePosition(id, body);
  }

  @Delete('admin/v1/positions/:id')
  @UseGuards(AdminGuard)
  @RequirePermissions('elections:write')
  async deletePosition(@Param('id') id: string) {
    return this.voting.deletePosition(id);
  }

  // Candidates
  @Get('admin/v1/positions/:id/candidates')
  @UseGuards(AdminGuard)
  @RequirePermissions('elections:read')
  async getCandidates(@Param('id') id: string) {
    return this.voting.getCandidates(id);
  }

  @Post('admin/v1/candidates')
  @UseGuards(AdminGuard)
  @RequirePermissions('elections:write')
  async createCandidate(@Body() body: any) {
    if (!body.position_id) {
      throw new AppError(400, 'Position ID is required.', 'INVALID_INPUT');
    }
    return this.voting.createCandidate(body);
  }

  @Patch('admin/v1/candidates/:id')
  @UseGuards(AdminGuard)
  @RequirePermissions('elections:write')
  async updateCandidate(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.voting.updateCandidate(id, body);
  }

  @Delete('admin/v1/candidates/:id')
  @UseGuards(AdminGuard)
  @RequirePermissions('elections:write')
  async deleteCandidate(@Param('id') id: string) {
    return this.voting.deleteCandidate(id);
  }
}

