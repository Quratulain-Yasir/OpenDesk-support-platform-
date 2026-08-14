import { Module } from '@nestjs/common';
import { SavedResponsesService } from './saved-responses.service';
import { SavedResponsesController } from './saved-responses.controller';

@Module({
  controllers: [SavedResponsesController],
  providers: [SavedResponsesService],
})
export class SavedResponsesModule {}