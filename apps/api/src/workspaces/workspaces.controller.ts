import {
  Controller,
  Get,
  Post,
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

@Controller('workspaces')
@UseGuards(JwtAuthGuard)
export class WorkspacesController {
  constructor(private workspacesService: WorkspacesService) {}

  @Post()
  create(@Body() dto: CreateWorkspaceDto, @GetUser() user: { userId: string }) {
    return this.workspacesService.create(user.userId, dto);
  }

  @Get()
  findMine(@GetUser() user: { userId: string }) {
    return this.workspacesService.findMyWorkspaces(user.userId);
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
