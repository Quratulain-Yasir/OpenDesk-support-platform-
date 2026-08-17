import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { WorkspacesService } from './workspaces.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from '../auth/guards/workspace-member.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorator';
import { Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { Public } from '../auth/decorators/public.decorator';

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(
    private workspacesService: WorkspacesService,
    private prisma: PrismaService,
  ) {}

  @Get('public')
  @Public()
  async findAllPublic() {
    return this.prisma.workspace.findMany({
      select: { id: true, name: true, slug: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Post()
  create(@Body() dto: CreateWorkspaceDto, @GetUser() user: { userId: string }) {
    return this.workspacesService.create(user.userId, dto);
  }

  @Get()
  findMine(@GetUser() user: { userId: string }) {
    return this.workspacesService.findMyWorkspaces(user.userId);
  }

  @Get(':id')
  @UseGuards(WorkspaceMemberGuard)
  findOne(@Param('id') id: string) {
    return this.workspacesService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(WorkspaceMemberGuard)
  update(@Param('id') id: string, @Body('name') name: string) {
    return this.workspacesService.update(id, name);
  }

  // NEW — /team route TeamController mein already hai, isliye yahan sirf invites
  @Get(':id/invites')
  @UseGuards(WorkspaceMemberGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  getInvites(@Param('id') id: string) {
    return this.workspacesService.getPendingInvites(id);
  }

  @Post(':id/invite')
  @UseGuards(WorkspaceMemberGuard, RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  invite(@Param('id') id: string, @Body() dto: InviteMemberDto) {
    return this.workspacesService.inviteToWorkspace(id, dto);
  }

  @Post('accept/:token')
  @UseGuards(JwtAuthGuard)
  accept(@Param('token') token: string, @GetUser() user: { userId: string }) {
    return this.workspacesService.acceptInvite(token, user.userId);
  }
}