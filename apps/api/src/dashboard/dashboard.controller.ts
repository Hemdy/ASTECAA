import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../auth/admin.guard.js';
import { DashboardService } from './dashboard.service.js';

@Controller('api/admin/v1/dashboard')
@UseGuards(AdminGuard)
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get('stats')
  async getStats(@Query('period') period?: string) {
    return this.dashboard.getStats(period || '6m');
  }

  @Get('activity')
  async getRecentActivity(@Query('limit') limit?: string) {
    const parsed = Number(limit);
    const safeLimit = Number.isFinite(parsed) && parsed > 0 ? Math.min(Math.floor(parsed), 250) : 100;
    return this.dashboard.getRecentActivity(safeLimit);
  }

  @Get('sidebar-counts')
  async getSidebarCounts() {
    return this.dashboard.getSidebarCounts();
  }
}

