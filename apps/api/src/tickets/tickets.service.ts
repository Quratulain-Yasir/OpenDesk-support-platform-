import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketStatus } from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private activity: ActivityService,
  ) {}

  async create(workspaceId: string | null, dto: CreateTicketDto) {
    // Pehle DTO mein workspaceId check karo, warna param se lo, warna first workspace
    let targetWorkspaceId = dto.workspaceId || workspaceId;

    if (!targetWorkspaceId) {
      const workspace = await this.prisma.workspace.findFirst({
        orderBy: { createdAt: 'desc' },
      });
      if (!workspace)
        throw new NotFoundException('No workspace found to assign ticket');
      targetWorkspaceId = workspace.id;
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        workspaceId: targetWorkspaceId,
        subject: dto.subject,
        description: dto.description,
        customerEmail: dto.customerEmail,
        customerName: dto.customerName,
        priority: dto.priority,
        status: TicketStatus.OPEN,
      },
    });

    await this.activity.record({
      workspaceId: targetWorkspaceId,
      ticketId: ticket.id,
      action: 'ticket_created',
      metadata: { subject: dto.subject },
    });

    return ticket;
  }

  async findAll(
    workspaceId: string,
    filters: {
      status?: string;
      priority?: string;
      assigneeId?: string;
      search?: string;
      mine?: boolean;
      userId?: string;
    },
  ) {
    const where: any = { workspaceId };

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.mine && filters.userId) where.assigneeId = filters.userId;

    if (filters.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { customerEmail: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        _count: { select: { messages: true } },
      },
    });
  }

  async findOne(workspaceId: string, ticketId: string) {
    const ticket = await this.prisma.ticket.findFirst({
      where: { id: ticketId, workspaceId },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        messages: {
          orderBy: { createdAt: 'asc' },
          include: { author: { select: { id: true, name: true } } },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          include: { actor: { select: { id: true, name: true } } },
        },
      },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async update(
    workspaceId: string,
    ticketId: string,
    dto: UpdateTicketDto,
    actorId?: string,
  ) {
    const existing = await this.prisma.ticket.findFirst({
      where: { id: ticketId, workspaceId },
    });
    if (!existing) throw new NotFoundException('Ticket not found');

    const ticket = await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        ...(dto.status && { status: dto.status }),
        ...(dto.priority && { priority: dto.priority }),
        ...(dto.assigneeId !== undefined && { assigneeId: dto.assigneeId }),
        ...(dto.status === TicketStatus.RESOLVED && { resolvedAt: new Date() }),
      },
    });

    if (dto.status && dto.status !== existing.status) {
      await this.activity.record({
        workspaceId,
        ticketId,
        actorId,
        action: 'status_changed',
        metadata: { from: existing.status, to: dto.status },
      });
    }

    if (
      dto.assigneeId !== undefined &&
      dto.assigneeId !== existing.assigneeId
    ) {
      await this.activity.record({
        workspaceId,
        ticketId,
        actorId,
        action: 'assigned',
        metadata: { assigneeId: dto.assigneeId },
      });
    }

    if (dto.priority && dto.priority !== existing.priority) {
      await this.activity.record({
        workspaceId,
        ticketId,
        actorId,
        action: 'priority_changed',
        metadata: { from: existing.priority, to: dto.priority },
      });
    }

    return ticket;
  }
}
