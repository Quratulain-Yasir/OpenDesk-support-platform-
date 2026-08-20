import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from '../mail/mail.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwt: JwtService,
    private config: ConfigService,
    private mailService: MailService,
  ) {}

  async signup(dto: SignupDto) {
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new ConflictException('Email already registered');

    const hash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hash,
        name: dto.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        avatar: true,
        createdAt: true,
      },
    });

    const pendingInvite = await this.prisma.invite.findFirst({
      where: {
        email: dto.email,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (pendingInvite) {
      await this.prisma.$transaction(async (tx) => {
        await tx.membership.create({
          data: {
            userId: user.id,
            workspaceId: pendingInvite.workspaceId,
            role: pendingInvite.role,
          },
        });
        await tx.invite.update({
          where: { id: pendingInvite.id },
          data: { usedAt: new Date() },
        });
      });
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user,
      ...tokens,
      autoJoinedWorkspace: pendingInvite ? pendingInvite.workspaceId : null,
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const valid = await bcrypt.compare(dto.password, user.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
      },
      ...tokens,
    };
  }

  async refresh(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, avatar: true },
    });
    if (!user) throw new UnauthorizedException();

    return this.generateTokens(user.id, user.email);
  }

  // NEW — reset request: token banao, email bhejo
  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // SECURITY: jaan bujh kar same message dono cases mein (user mila ya nahi) —
    // warna koi bhi is endpoint se pata laga sakta hai "yeh email registered hai ya nahi"
    if (!user) {
      return { message: 'If that email exists, a reset link has been sent.' };
    }

    const reset = await this.prisma.passwordReset.create({
      data: {
        userId: user.id,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 ghanta valid
      },
    });

    const frontendUrl =
      this.config.get<string>('FRONTEND_URL') ||
      'https://open-desk-support-platform.vercel.app';
    const cleanUrl = frontendUrl.replace(/\/$/, '');
    const resetLink = `${cleanUrl}/reset-password/${reset.token}`;

    await this.mailService.sendPasswordResetEmail({
      to: user.email,
      resetLink,
    });

    return { message: 'If that email exists, a reset link has been sent.' };
  }

  // NEW — naya password set karo, token verify karke
  async resetPassword(dto: ResetPasswordDto) {
    const reset = await this.prisma.passwordReset.findUnique({
      where: { token: dto.token },
    });

    if (!reset) throw new NotFoundException('Invalid or expired reset link');
    if (reset.usedAt)
      throw new BadRequestException('This reset link was already used');
    if (reset.expiresAt < new Date())
      throw new BadRequestException('This reset link has expired');

    const hash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: reset.userId },
        data: { password: hash },
      });
      await tx.passwordReset.update({
        where: { id: reset.id },
        data: { usedAt: new Date() },
      });
    });

    return { message: 'Password updated successfully' };
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('JWT_ACCESS_EXPIRATION'),
    });

    const refreshToken = this.jwt.sign(payload, {
      secret: this.config.get('JWT_REFRESH_SECRET'),
      expiresIn: this.config.get('JWT_REFRESH_EXPIRATION'),
    });

    return { accessToken, refreshToken };
  }
}
