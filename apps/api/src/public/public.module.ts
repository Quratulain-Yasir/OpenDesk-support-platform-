import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { EmbedController } from './embed.controller';
import { MessagesModule } from '../messages/messages.module';
import { FormsModule } from '../forms/forms.module';

@Module({
  imports: [MessagesModule, FormsModule],
  controllers: [PublicController, EmbedController],
})
export class PublicModule {}
