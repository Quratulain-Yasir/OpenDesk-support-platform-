import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { MessagesModule } from '../messages/messages.module';

@Module({
  imports: [MessagesModule],
  controllers: [PublicController],
})
export class PublicModule {}
