import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSavedResponseDto } from './dto/create-saved-response.dto';

@Injectable()
export class SavedResponsesService {
  constructor(private prisma: PrismaService) {}

  async findAll(workspaceId: string) {
    return this.prisma.savedResponse.findMany({
      where: { workspaceId },
      orderBy: { updatedAt: 'desc' },
      include: { createdBy: { select: { name: true } } },
    });
  }

  async create(workspaceId: string, userId: string, dto: CreateSavedResponseDto) {
    return this.prisma.savedResponse.create({
      data: { ...dto, workspaceId, createdById: userId },
    });
  }

  async update(workspaceId: string, id: string, dto: CreateSavedResponseDto) {
    const existing = await this.prisma.savedResponse.findFirst({ where: { id, workspaceId } });
    if (!existing) throw new NotFoundException('Not found');
    return this.prisma.savedResponse.update({ where: { id }, data: dto });
  }

  async delete(workspaceId: string, id: string) {
    const existing = await this.prisma.savedResponse.findFirst({ where: { id, workspaceId } });
    if (!existing) throw new NotFoundException('Not found');
    await this.prisma.savedResponse.delete({ where: { id } });
  }
}