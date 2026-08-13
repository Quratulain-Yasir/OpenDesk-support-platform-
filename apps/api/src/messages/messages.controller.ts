import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from '../auth/guards/workspace-member.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('workspaces/:workspaceId/tickets/:ticketId/messages')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Post()
  create(
    @Param('workspaceId') workspaceId: string,
    @Param('ticketId') ticketId: string,
    @Body() dto: CreateMessageDto,
    @GetUser() user: { userId: string; email: string },
  ) {
    return this.messagesService.create(
      workspaceId,
      ticketId,
      dto,
      user.userId,
      undefined, // authorName nahi chahiye agent ke liye
    );
  }

  @Get()
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Param('ticketId') ticketId: string,
  ) {
    // Ticket service mein already messages include hain
    // Ye endpoint direct messages ke liye hai
    return this.messagesService['prisma'].message.findMany({
      where: { ticketId, workspaceId },
      orderBy: { createdAt: 'asc' },
      include: { author: { select: { id: true, name: true } } },
    });
  }
}