import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../activity/activity.service';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { CreateLeadCommentDto } from './dto/create-lead-comment.dto';

@Injectable()
export class LeadsService {
  constructor(
    private prisma: PrismaService,
    private activityService: ActivityService,
  ) {}

  async findAll(workspaceId: string) {
    return this.prisma.lead.findMany({
      where: { form: { workspaceId } },
      include: { form: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Ab yeh drawer ke liye poora data deta hai: form fields, comments, activity
  async findOne(workspaceId: string, leadId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, form: { workspaceId } },
      include: {
        form: { select: { name: true, fields: true } },
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
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async updateStatus(
    workspaceId: string,
    leadId: string,
    dto: UpdateLeadDto,
    actorId: string,
  ) {
    const existing = await this.prisma.lead.findFirst({
      where: { id: leadId, form: { workspaceId } },
    });
    if (!existing) throw new NotFoundException('Lead not found');

    const updated = await this.prisma.lead.update({
      where: { id: leadId },
      data: { status: dto.status },
    });

    // Sirf tabhi activity log karo jab status actually badla ho (kanban drag ke baad bhi useful rahega)
    if (dto.status && dto.status !== existing.status) {
      await this.activityService.record({
        workspaceId,
        leadId,
        actorId,
        action: 'status_changed',
        metadata: { from: existing.status, to: dto.status },
      });
    }

    return updated;
  }

  async addComment(
    workspaceId: string,
    leadId: string,
    dto: CreateLeadCommentDto,
    authorId: string,
  ) {
    const existing = await this.prisma.lead.findFirst({
      where: { id: leadId, form: { workspaceId } },
    });
    if (!existing) throw new NotFoundException('Lead not found');

    const message = await this.prisma.message.create({
      data: {
        leadId,
        workspaceId,
        content: dto.content,
        isInternal: true, // Leads ke comments hamesha internal team notes hain, customer-facing nahi
        authorId,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    await this.activityService.record({
      workspaceId,
      leadId,
      actorId: authorId,
      action: 'comment_added',
    });

    return message;
  }
}
