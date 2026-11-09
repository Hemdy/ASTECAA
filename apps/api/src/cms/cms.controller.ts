import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CmsService } from './cms.service.js';
import { AdminGuard } from '../auth/admin.guard.js';
import { AppError } from '../core/app-error.js';

@Controller('api')
export class CmsController {
  constructor(private readonly cms: CmsService) {}

  // ==================== PUBLIC ENDPOINTS ====================

  @Get('v1/gallery')
  async getGallery(
    @Query('album') album?: string,
    @Query('year') year?: string,
    @Query('featured') featured?: string
  ) {
    return this.cms.listGallery(
      album,
      year ? parseInt(year, 10) : undefined,
      featured !== undefined ? featured === 'true' : undefined
    );
  }

  @Get('v1/timeline')
  async getTimeline() {
    return this.cms.listTimeline();
  }

  @Get('v1/community')
  async getCommunityMessages(
    @Query('page') page?: string,
    @Query('status') status?: string
  ) {
    return this.cms.listCommunityMessages(page, status || 'approved');
  }

  @Post('v1/community')
  async postCommunityMessage(
    @Body()
    body: {
      name?: string;
      author?: string;
      email: string;
      phone?: string;
      graduationYear?: string;
      location?: string;
      message: string;
      page?: string;
    }
  ) {
    return this.cms.createCommunityMessage({
      author: body.author || body.name || 'Alumnus',
      email: body.email,
      phone: body.phone,
      graduationYear: body.graduationYear,
      location: body.location,
      message: body.message,
      page: body.page || 'community',
    });
  }

  @Post('v1/community/:id/like')
  async likeCommunityMessage(@Param('id') id: string) {
    return this.cms.likeCommunityMessage(id);
  }

  @Get('v1/announcements')
  async getAnnouncements() {
    return this.cms.listAnnouncements('published');
  }

  @Get('v1/stories')
  async getStories(@Query('category') category?: string) {
    return this.cms.listStories('published', category);
  }

  @Get('v1/site-content/:key')
  async getSiteContent(@Param('key') key: string) {
    return this.cms.getSiteContent(key);
  }

  // ==================== ADMIN CMS ENDPOINTS ====================

  // Gallery
  @Get('admin/v1/gallery')
  @UseGuards(AdminGuard)
  async adminListGallery(@Query('album') album?: string) {
    return this.cms.listGallery(album);
  }

  @Post('admin/v1/gallery')
  @UseGuards(AdminGuard)
  async adminCreateGalleryItem(@Body() body: any) {
    return this.cms.createGalleryItem(body);
  }

  @Patch('admin/v1/gallery/:id')
  @UseGuards(AdminGuard)
  async adminUpdateGalleryItem(@Param('id') id: string, @Body() body: any) {
    return this.cms.updateGalleryItem(id, body);
  }

  @Delete('admin/v1/gallery/:id')
  @UseGuards(AdminGuard)
  async adminDeleteGalleryItem(@Param('id') id: string) {
    return this.cms.deleteGalleryItem(id);
  }

  // Timeline
  @Post('admin/v1/timeline')
  @UseGuards(AdminGuard)
  async adminCreateMilestone(@Body() body: any) {
    return this.cms.createMilestone(body);
  }

  @Patch('admin/v1/timeline/:id')
  @UseGuards(AdminGuard)
  async adminUpdateMilestone(@Param('id') id: string, @Body() body: any) {
    return this.cms.updateMilestone(id, body);
  }

  @Delete('admin/v1/timeline/:id')
  @UseGuards(AdminGuard)
  async adminDeleteMilestone(@Param('id') id: string) {
    return this.cms.deleteMilestone(id);
  }

  // Comments / Moderation
  @Get('admin/v1/comments')
  @UseGuards(AdminGuard)
  async adminListComments(
    @Query('status') status?: string,
    @Query('page') page?: string
  ) {
    return this.cms.adminListCommunityMessages(status, page);
  }

  @Patch('admin/v1/comments/:id/status')
  @UseGuards(AdminGuard)
  async adminUpdateCommentStatus(
    @Param('id') id: string,
    @Body() body: { status: 'approved' | 'pending' | 'reported' | 'spam' }
  ) {
    return this.cms.updateMessageStatus(id, body.status);
  }

  @Delete('admin/v1/comments/:id')
  @UseGuards(AdminGuard)
  async adminDeleteComment(@Param('id') id: string) {
    return this.cms.deleteCommunityMessage(id);
  }

  // Stories
  @Get('admin/v1/stories')
  @UseGuards(AdminGuard)
  async adminListStories() {
    return this.cms.listStories();
  }

  @Post('admin/v1/stories')
  @UseGuards(AdminGuard)
  async adminCreateStory(@Body() body: any) {
    return this.cms.createStory(body);
  }

  @Patch('admin/v1/stories/:id')
  @UseGuards(AdminGuard)
  async adminUpdateStory(@Param('id') id: string, @Body() body: any) {
    return this.cms.updateStory(id, body);
  }

  @Delete('admin/v1/stories/:id')
  @UseGuards(AdminGuard)
  async adminDeleteStory(@Param('id') id: string) {
    return this.cms.deleteStory(id);
  }

  // Announcements
  @Get('admin/v1/announcements')
  @UseGuards(AdminGuard)
  async adminListAnnouncements() {
    return this.cms.listAnnouncements('');
  }

  @Post('admin/v1/announcements')
  @UseGuards(AdminGuard)
  async adminCreateAnnouncement(@Body() body: any) {
    return this.cms.createAnnouncement(body);
  }

  @Patch('admin/v1/announcements/:id')
  @UseGuards(AdminGuard)
  async adminUpdateAnnouncement(@Param('id') id: string, @Body() body: any) {
    return this.cms.updateAnnouncement(id, body);
  }

  @Delete('admin/v1/announcements/:id')
  @UseGuards(AdminGuard)
  async adminDeleteAnnouncement(@Param('id') id: string) {
    return this.cms.deleteAnnouncement(id);
  }

  // Homepage Settings
  @Get('admin/v1/homepage')
  @UseGuards(AdminGuard)
  async adminGetHomepage() {
    return this.cms.getSiteContent('homepage');
  }

  @Put('admin/v1/homepage')
  @UseGuards(AdminGuard)
  async adminUpdateHomepage(@Body() body: any) {
    return this.cms.updateSiteContent('homepage', body);
  }

  // Media
  @Get('admin/v1/media')
  @UseGuards(AdminGuard)
  async adminListMedia(@Query('folder') folder?: string) {
    return this.cms.listMedia(folder);
  }

  @Post('admin/v1/media/upload')
  @UseGuards(AdminGuard)
  async adminUploadMedia(
    @Body()
    body: {
      file: string; // base64 or data URL
      name: string;
      type?: string;
      folder?: string;
    }
  ) {
    if (!body.file || !body.name) {
      throw new AppError(400, 'File data and file name are required.', 'INVALID_INPUT');
    }

    let base64Data = body.file;
    let mimeType = body.type || 'image/jpeg';

    if (body.file.startsWith('data:')) {
      const match = body.file.match(/^data:([^;]+);base64,(.+)$/);
      if (match) {
        mimeType = match[1];
        base64Data = match[2];
      }
    }

    const buffer = Buffer.from(base64Data, 'base64');
    return this.cms.saveMedia(buffer, body.name, mimeType, body.folder || 'General');
  }

  @Delete('admin/v1/media/:id')
  @UseGuards(AdminGuard)
  async adminDeleteMedia(@Param('id') id: string) {
    return this.cms.deleteMedia(id);
  }
}
