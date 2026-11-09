import { Module } from '@nestjs/common';
import { CmsService } from './cms.service.js';
import { CmsController } from './cms.controller.js';
import { StorageModule } from '../storage/storage.module.js';

@Module({
  imports: [StorageModule],
  controllers: [CmsController],
  providers: [CmsService],
  exports: [CmsService],
})
export class CmsModule {}
