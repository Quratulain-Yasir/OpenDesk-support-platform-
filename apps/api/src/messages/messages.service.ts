import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateMessageDto } from './dto/create-message.dto';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    private activity: ActivityService,
  ) {}

  async create(
    workspaceId: string,
    ticketId: string,
    dto: CreateMessageDto,
    authorId?: string,
    authorName?: string,
  ) {
    // Verify ticket exists in workspace
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, workspaceId },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    // Create message
    const message = await this.prisma.message.create({
      data: {
        ticketId,
        workspaceId,
        content: dto.content,
        isInternal: dto.isInternal ?? false,
        authorId: authorId || null,
        authorName: authorName || null,
      },
      include: {
        author: { select: { id: true, name: true } },
      },
    });

    // If this is the first AGENT public reply, set firstReplyAt
    if (authorId && !dto.isInternal && !ticket.firstReplyAt) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { firstReplyAt: new Date() },
      });
    }

    // Activity log
    await this.activity.record({
      workspaceId,
      ticketId,
      actorId: authorId || undefined,
      action: dto.isInternal ? 'note_added' : 'replied',
      metadata: { messageId: message.id },
    });

    return message;
  }

  // Public view — customer sees only non-internal messages
  async findPublicMessages(ticketId: string, publicToken: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, publicToken },
    });
    if (!ticket) throw new NotFoundException('Ticket not found');

    return this.prisma.message.findMany({
      where: {
        ticketId,
        isInternal: false, // ← KEY: Customer can NEVER see internal notes
      },
      orderBy: { createdAt: 'asc' },
      include: {
        author: { select: { id: true, name: true } },
      },
    });
  }
}
