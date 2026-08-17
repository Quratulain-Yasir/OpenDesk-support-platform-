import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { Role } from '@prisma/client';

@Injectable()
export class WorkspacesService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private mailService: MailService,
  ) {}

  async create(userId: string, dto: CreateWorkspaceDto) {
    const exists = await this.prisma.workspace.findUnique({
      where: { slug: dto.slug },
    });
    if (exists) throw new ConflictException('Slug already taken');

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
    const memberships = await this.prisma.membership.findMany({
      where: { userId },
      include: { workspace: true },
    });

    return memberships.map((m) => ({
      ...m.workspace,
      myRole: m.role,
    }));
  }

  async findOne(id: string) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async update(id: string, name: string) {
    return this.prisma.workspace.update({
      where: { id },
      data: { name },
    });
  }

  // NEW: members list for Team page
  async getMembers(workspaceId: string) {
    const memberships = await this.prisma.membership.findMany({
      where: { workspaceId },
      include: { user: { select: { id: true, name: true, email: true } } },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      id: m.id,
      role: m.role,
      status: 'MEMBER',
      user: m.user,
    }));
  }

  // NEW: pending invites list for Team page
  async getPendingInvites(workspaceId: string) {
    const invites = await this.prisma.invite.findMany({
      where: { workspaceId, usedAt: null },
      orderBy: { createdAt: 'desc' },
    });

    return invites.map((inv) => ({
      id: inv.id,
      role: inv.role,
      status: 'PENDING',
      email: inv.email,
      expiresAt: inv.expiresAt,
    }));
  }

  async inviteToWorkspace(workspaceId: string, dto: InviteMemberDto) {
    const workspace = await this.prisma.workspace.findUnique({
      where: { id: workspaceId },
    });
    if (!workspace) throw new NotFoundException('Workspace not found');

    const invite = await this.prisma.invite.create({
      data: {
        workspaceId,
        email: dto.email,
        role: dto.role,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const frontendUrl =
      this.configService.get<string>('FRONTEND_URL') ||
      'https://open-desk-support-platform.vercel.app';
    const cleanUrl = frontendUrl.replace(/\/$/, '');
    const acceptLink = `${cleanUrl}/invite/${invite.token}`;

    // Fire the email — doesn't block invite creation if it fails
    await this.mailService.sendInviteEmail({
      to: dto.email,
      workspaceName: workspace.name,
      role: dto.role,
      acceptLink,
    });

    return {
      message: 'Invite sent',
      token: invite.token,
      acceptLink,
    };
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
    });

    if (!invite) throw new NotFoundException('Invalid invite');
    if (invite.usedAt) throw new ConflictException('Invite already used');
    if (invite.expiresAt < new Date())
      throw new ConflictException('Invite expired');

    const alreadyMember = await this.prisma.membership.findUnique({
      where: {
        userId_workspaceId: { userId, workspaceId: invite.workspaceId },
      },
    });
    if (alreadyMember) {
      await this.prisma.invite.update({
        where: { id: invite.id },
        data: { usedAt: new Date() },
      });
      return { message: 'Already a member', workspaceId: invite.workspaceId };
    }

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

    return {
      message: 'Joined workspace successfully',
      workspaceId: invite.workspaceId,
    };
  }
}
