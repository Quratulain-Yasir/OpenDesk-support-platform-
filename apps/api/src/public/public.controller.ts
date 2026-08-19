import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MessagesService } from '../messages/messages.service';
import { CreateMessageDto } from '../messages/dto/create-message.dto';
import { FormsService } from '../forms/forms.service';
import { SubmitLeadDto } from '../forms/dto/submit-lead.dto';
import { TicketStatus, TicketPriority } from '@prisma/client';

@Controller('public')
export class PublicController {
  constructor(
    private prisma: PrismaService,
    private messagesService: MessagesService,
    private formsService: FormsService, // NEW
  ) {}

  @Post('tickets')
  async createTicket(
    @Body()
    body: {
      subject: string;
      description: string;
      customerEmail: string;
      customerName?: string;
      priority?: string;
      workspaceId?: string;
    },
  ) {
    let workspaceId = body.workspaceId;

    if (!workspaceId) {
      const workspace = await this.prisma.workspace.findFirst();
      if (!workspace) {
        return { error: 'No workspace configured' };
      }
      workspaceId = workspace.id;
    } else {
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
        workspaceId,
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

  // NEW — embed script yeh call karega form ka structure fetch karne ke liye 
  @Get('forms/:formId')
  async getPublicForm(@Param('formId') formId: string) {
    return this.formsService.findPublicForm(formId);
  }

  // NEW — jab visitor form submit kare, yeh endpoint hit hoga
  @Post('forms/:formId/submit')
  async submitFormLead(
    @Param('formId') formId: string,
    @Body() dto: SubmitLeadDto,
  ) {
    return this.formsService.submitLead(formId, dto.data);
  }
}
