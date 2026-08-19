import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { FormsService } from './forms.service';
import { CreateFormDto } from './dto/create-form.dto';
import { UpdateFormDto } from './dto/update-form.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from '../auth/guards/workspace-member.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

// Route pattern tumhare tickets/team controllers jaisa hi hai — consistency ke liye
@Controller('workspaces/:workspaceId/forms')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class FormsController {
  constructor(private formsService: FormsService) {}

  // Sab members form dekh sakte hain — koi role restriction nahi yahan
  @Get()
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.formsService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.formsService.findOne(workspaceId, id);
  }

  // Sirf Owner/Admin form bana sakte hain — Agent nahi
  // (yeh document ke us pattern jaisa hai jo humne Team invite mein follow kiya tha)
  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateFormDto,
  ) {
    return this.formsService.create(workspaceId, dto);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateFormDto,
  ) {
    return this.formsService.update(workspaceId, id, dto);
  }

  @Patch(':id/publish')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  togglePublish(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body('isPublished') isPublished: boolean,
  ) {
    return this.formsService.togglePublish(workspaceId, id, isPublished);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.OWNER, Role.ADMIN)
  remove(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.formsService.remove(workspaceId, id);
  }
}