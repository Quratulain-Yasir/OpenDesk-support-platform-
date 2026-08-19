import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadsService {
  constructor(private prisma: PrismaService) {}

  async findAll(workspaceId: string) {
    return this.prisma.lead.findMany({
      where: { form: { workspaceId } },
      include: { form: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(workspaceId: string, leadId: string) {
    const lead = await this.prisma.lead.findFirst({
      where: { id: leadId, form: { workspaceId } },
      include: { form: { select: { name: true, fields: true } } },
    });
    if (!lead) throw new NotFoundException('Lead not found');
    return lead;
  }

  async updateStatus(workspaceId: string, leadId: string, dto: UpdateLeadDto) {
    const existing = await this.prisma.lead.findFirst({
      where: { id: leadId, form: { workspaceId } },
    });
    if (!existing) throw new NotFoundException('Lead not found');

    return this.prisma.lead.update({
      where: { id: leadId },
      data: { status: dto.status },
    });
  }
}
