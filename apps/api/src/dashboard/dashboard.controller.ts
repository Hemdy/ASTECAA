import { Controller, Get, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { DashboardService } from './dashboard.service.js';

@Controller('api/admin/v1/dashboard')
@UseGuards(AdminGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('stats')
  async getStats() {
    return this.dashboard.getStats();
  }
}

