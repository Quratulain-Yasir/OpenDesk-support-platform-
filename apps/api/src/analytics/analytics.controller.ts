import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from '../auth/guards/workspace-member.guard';

@Controller('workspaces/:workspaceId/analytics')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class AnalyticsController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async getAnalytics(@Param('workspaceId') workspaceId: string) {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // 1. Resolved this week
    const resolvedThisWeek = await this.prisma.ticket.count({
      where: {
        workspaceId,
        status: 'RESOLVED',
        resolvedAt: { gte: weekAgo },
      },
    });

    // 2. Avg first response time (in minutes)
    const ticketsWithReply = await this.prisma.ticket.findMany({
      where: {
        workspaceId,
        firstReplyAt: { not: null },
      },
      select: {
        createdAt: true,
        firstReplyAt: true,
      },
    });

    let avgResponseTime = 0;
    if (ticketsWithReply.length > 0) {
      const totalMinutes = ticketsWithReply.reduce((sum, t) => {
        const diff =
          new Date(t.firstReplyAt!).getTime() - new Date(t.createdAt).getTime();
        return sum + diff / (1000 * 60);
      }, 0);
      avgResponseTime = Math.round(totalMinutes / ticketsWithReply.length);
    }

    // 3. Tickets per agent
    const ticketsPerAgent = await this.prisma.ticket.groupBy({
      by: ['assigneeId'],
      where: { workspaceId },
      _count: { id: true },
    });

    const assigneeIds = ticketsPerAgent
      .map((t) => t.assigneeId)
      .filter((id): id is string => id !== null);

    const agents = await this.prisma.user.findMany({
      where: {
        id: { in: assigneeIds },
      },
      select: { id: true, name: true },
    });

    const ticketsPerAgentFormatted = ticketsPerAgent
      .filter((t) => t.assigneeId)
      .map((t) => ({
        agentName: agents.find((a) => a.id === t.assigneeId)?.name || 'Unknown',
        count: t._count.id,
      }));

    return {
      resolvedThisWeek,
      avgResponseTime,
      ticketsPerAgent: ticketsPerAgentFormatted,
    };
  }
}
