import { Controller, Get, Patch, Delete, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from '../auth/guards/workspace-member.guard';

@Controller('workspaces/:workspaceId/team')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class TeamController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async list(@Param('workspaceId') wsId: string) {
    return this.prisma.membership.findMany({
      where: { workspaceId: wsId },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    });
  }

  @Patch(':membershipId')
  async updateRole(
    @Param('workspaceId') wsId: string,
    @Param('membershipId') id: string,
    @Body('role') role: string,
    @Request() req: any,
  ) {
    const userId = req.user?.userId || req.user?.id;
    const myMembership = await this.prisma.membership.findFirst({
      where: { workspaceId: wsId, userId },
    });
    if (!myMembership || (myMembership.role !== 'OWNER' && myMembership.role !== 'ADMIN')) {
      throw new ForbiddenException('Only Owner/Admin can change roles');
    }
    return this.prisma.membership.update({
      where: { id },
      data: { role },
    });
  }

  @Delete(':membershipId')
  async remove(
    @Param('workspaceId') wsId: string,
    @Param('membershipId') id: string,
    @Request() req: any,
  ) {
    const userId = req.user?.userId || req.user?.id;
    const myMembership = await this.prisma.membership.findFirst({
      where: { workspaceId: wsId, userId },
    });
    if (!myMembership || (myMembership.role !== 'OWNER' && myMembership.role !== 'ADMIN')) {
      throw new ForbiddenException('Only Owner/Admin can remove members');
    }
    return this.prisma.membership.delete({ where: { id } });
  }
}