import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async record(params: {
    workspaceId: string;
    ticketId?: string;
    leadId?: string;
    actorId?: string;
    action: string;
    metadata?: Record<string, any>;
  }) {
    return this.prisma.activity.create({
      data: {
        workspaceId: params.workspaceId,
        ticketId: params.ticketId,
        leadId: params.leadId,
        actorId: params.actorId,
        action: params.action,
        metadata: params.metadata || {},
      },
    });
  }
}