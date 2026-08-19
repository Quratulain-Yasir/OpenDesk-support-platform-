import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { MessagesModule } from '../messages/messages.module';
import { FormsModule } from '../forms/forms.module';

@Module({
  imports: [MessagesModule, FormsModule],
  controllers: [PublicController],
})
export class PublicModule {}
