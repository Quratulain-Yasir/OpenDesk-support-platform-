import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { Role } from '@prisma/client';

// Email sending — install: npm install resend
import { Resend } from 'resend';

@Injectable()
export class WorkspacesService {
  private resend: Resend | null = null;

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {
    const apiKey = this.configService.get<string>('RESEND_API_KEY');
    if (apiKey) this.resend = new Resend(apiKey);
  }

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
        data: { userId, workspaceId: ws.id, role: Role.OWNER },
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
    const workspace = await this.prisma.workspace.findUnique({ where: { id } });
    if (!workspace) throw new NotFoundException('Workspace not found');
    return workspace;
  }

  async update(id: string, name: string) {
    return this.prisma.workspace.update({ where: { id }, data: { name } });
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

    // Send email if Resend is configured
    if (this.resend) {
      const fromEmail =
        this.configService.get<string>('RESEND_FROM_EMAIL') ||
        'onboarding@resend.dev';

      try {
        await this.resend.emails.send({
          from: fromEmail,
          to: dto.email,
          subject: `You've been invited to join ${workspace.name} on OpenDesk`,
          html: `
            <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
              <h2>Join ${workspace.name} on OpenDesk</h2>
              <p>You've been invited to join the workspace <strong>${workspace.name}</strong> as a <strong>${dto.role}</strong>.</p>
              <p>Click the button below to accept your invitation:</p>
              <a href="${acceptLink}" style="display: inline-block; padding: 12px 24px; background: #1B4F72; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">Accept Invitation</a>
              <p style="color: #666; font-size: 12px;">This link expires in 7 days. If you didn't expect this, you can ignore this email.</p>
            </div>
          `,
        });
      } catch (err) {
        console.error('Email send failed:', err);
        // Don't throw — invite is still created, show link in UI as fallback
      }
    }

    return {
      message: 'Invite created',
      token: invite.token,
      acceptLink,
      emailSent: !!this.resend,
    };
  }

  async findPendingInvites(workspaceId: string) {
    return this.prisma.invite.findMany({
      where: {
        workspaceId,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      select: { id: true, email: true, role: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async acceptInvite(token: string, userId: string) {
    const invite = await this.prisma.invite.findUnique({
      where: { token },
    });

    if (!invite) throw new NotFoundException('Invalid invite');
    if (invite.usedAt) throw new ConflictException('Invite already used');
    if (invite.expiresAt < new Date())
      throw new ConflictException('Invite expired');

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