import { Module } from '@nestjs/common';
import { VotingService } from './voting.service.js';
import { VotingController } from './voting.controller.js';
import { EmailModule } from '../email/email.module.js';

@Module({
  imports: [EmailModule],
  providers: [VotingService],
  controllers: [VotingController],
  exports: [VotingService],
})
export class VotingModule {}

