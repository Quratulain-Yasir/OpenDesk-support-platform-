import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { WorkspacesModule } from './workspaces/workspaces.module';
import { TicketsModule } from './tickets/tickets.module';
import { ActivityModule } from './activity/activity.module';
import { MessagesModule } from './messages/messages.module';
import { PublicModule } from './public/public.module';
import { SavedResponsesModule } from './saved-responses/saved-responses.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { TeamModule } from './team/team.module';
import { MailModule } from './mail/mail.module';
import { FormsModule } from './forms/forms.module';
import { LeadsModule } from './leads/leads.module';  
import { AiModule } from './ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    WorkspacesModule,
    ActivityModule,
    TicketsModule,
    MessagesModule,
    PublicModule,
    SavedResponsesModule,
    AnalyticsModule,
    TeamModule,
    MailModule,
    FormsModule,
    LeadsModule, 
    AiModule,
  ],
})
export class AppModule {}