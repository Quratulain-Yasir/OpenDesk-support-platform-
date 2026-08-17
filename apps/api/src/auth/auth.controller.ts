import {
  Controller,
  Post,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  Res,
  UseGuards,
  Get,
} from '@nestjs/common';
import type { Response } from 'express';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GetUser } from './decorators/get-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private prisma: PrismaService,
  ) {}

  @Post('signup')
  async signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(dto);

    res.cookie('refresh_token', result.refreshToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return { user: result.user, accessToken: result.accessToken };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Res({ passthrough: true }) res: Response) {
    return { message: 'Refresh endpoint ready' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMe(@GetUser() user: { userId: string }) {
    return this.prisma.user.findUnique({
      where: { id: user.userId },
      select: { id: true, name: true, email: true, avatar: true },
    });
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  async updateMe(
    @GetUser() user: { userId: string; email: string },
    @Body() body: { name?: string; password?: string; avatar?: string },
  ) {
    const data: any = {};
    if (body.name) data.name = body.name;
    if (body.password) data.password = await bcrypt.hash(body.password, 10);
    if (body.avatar) data.avatar = body.avatar;

    return this.prisma.user.update({
      where: { id: user.userId },
      data,
      select: { id: true, name: true, email: true, avatar: true },
    });
  }
}
