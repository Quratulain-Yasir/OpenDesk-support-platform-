import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { Role } from '@prisma/client';

@Injectable()
export class WorkspacesService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateWorkspaceDto) {
    // Slug unique honi chahiye
    const exists = await this.prisma.workspace.findUnique({
      where: { slug: dto.slug },
    });
    if (exists) throw new ConflictException('Slug already taken');

    // Transaction: Workspace banao + Membership banao (OWNER) 
    const workspace = await this.prisma.$transaction(async (tx) => {
      const ws = await tx.workspace.create({
        data: { name: dto.name, slug: dto.slug },
      });

      await tx.membership.create({
        data: {
          userId,
          workspaceId: ws.id,
          role: Role.OWNER,
        },
      });

      return ws;
    });

    return workspace;
  }

  async findMyWorkspaces(userId: string) {
    // User ke saare workspaces lao + role bhi batao
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { workspace: true },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      myRole: m.role,
    }));
  }

  async inviteToWorkspace(workspaceId: string, dto: InviteMemberDto) {
    // Invite token banao
    const invite = await this.prisma.invite.create({
      data: {
        workspaceId,
        email: dto.email,
        role: dto.role,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });
 
    return {
      message: 'Invite created',
      token: invite.token,
   
      acceptLink: `http://localhost:3000/invite/${invite.token}`,
    };
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
    });

    if (!invite) throw new NotFoundException('Invalid invite');
    if (invite.usedAt) throw new ConflictException('Invite already used');
    if (invite.expiresAt < new Date()) throw new ConflictException('Invite expired');

    // Transaction: Membership banao + Invite mark as used
    await this.prisma.$transaction(async (tx) => {
      await tx.membership.create({
        data: {
          userId,
          workspaceId: invite.workspaceId,
          role: invite.role,
        },
      });

      await tx.invite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });
    });

    return { message: 'Joined workspace successfully' };
  }
}