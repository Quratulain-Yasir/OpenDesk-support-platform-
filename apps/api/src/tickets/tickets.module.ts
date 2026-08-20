import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { ActivityModule } from '../activity/activity.module';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [ActivityModule, AiModule],
  controllers: [TicketsController],
  providers: [TicketsService],
})
export class TicketsModule {}