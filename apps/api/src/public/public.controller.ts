import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';
import { CreateMessageDto } from '../messages/dto/create-message.dto';
import { TicketStatus, TicketPriority } from '@prisma/client';

@Controller('public')
export class PublicController {
  constructor(
    private prisma: PrismaService,
    private messagesService: MessagesService,
  ) {}

  // Customer creates ticket without login
  @Post('tickets')
  async createTicket(
    @Body()
    body: {
      subject: string;
      description: string;
      customerEmail: string;
      customerName?: string;
      priority?: string;
      workspaceId?: string; // ← YEH ADD KIYA
    },
  ) {
    let workspaceId = body.workspaceId;

    // Agar frontend se workspaceId nahi aayi → fallback pehli workspace
    if (!workspaceId) {
      const workspace = await this.prisma.workspace.findFirst();
      if (!workspace) {
        return { error: 'No workspace configured' };
      }
      workspaceId = workspace.id;
    } else {
      // Verify ke ye workspace exist karti hai
      const workspace = await this.prisma.workspace.findUnique({
        where: { id: body.workspaceId },
      });
      if (!workspace) {
        return { error: 'Invalid workspace selected' };
      }
      workspaceId = workspace.id;
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        workspaceId: workspaceId, // ← AB SELECTED WORKSPACE USE HOGI
        subject: body.subject,
        description: body.description,
        customerEmail: body.customerEmail,
        customerName: body.customerName,
        priority: (body.priority as TicketPriority) || TicketPriority.MEDIUM,
        status: TicketStatus.OPEN,
      },
    });

    return ticket;
  }

  // Customer views ticket via public token — NO login needed
  @Get('tickets/:token')
  async getTicket(@Param('token') token: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { publicToken: token },
      include: {
        messages: {
          where: { isInternal: false },
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true } } },
        },
      },
    });

    if (!ticket) return { error: 'Ticket not found' };
    return ticket;
  }

  // Customer replies via public token — NO login needed
  @Post('tickets/:token/messages')
  async addMessage(
    @Param('token') token: string,
    @Body() dto: CreateMessageDto,
  ) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { publicToken: token },
    });
    if (!ticket) return { error: 'Ticket not found' };

    return this.messagesService.create(
      ticket.workspaceId,
      ticket.id,
      { content: dto.content, isInternal: false },
      undefined,
      ticket.customerName || 'Customer',
    );
  }
}
