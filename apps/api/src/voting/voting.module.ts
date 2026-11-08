import { Module } from '@nestjs/common';
import { VotingService } from './voting.service.js';
import { VotingController } from './voting.controller.js';

@Module({
  providers: [VotingService],
  controllers: [VotingController],
  exports: [VotingService],
})
export class VotingModule {}

