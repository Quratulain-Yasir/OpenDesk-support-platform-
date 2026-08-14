import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { SavedResponsesService } from './saved-responses.service';
import { CreateSavedResponseDto } from './dto/create-saved-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';

@Controller('workspaces/:workspaceId/saved-responses')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class SavedResponsesController {
  constructor(private service: SavedResponsesService) {}

  @Get() findAll(@Param('workspaceId') wsId: string) {
    return this.service.findAll(wsId);
  }

  @Post() create(@Param('workspaceId') wsId: string, @Request() req, @Body() dto: CreateSavedResponseDto) {
    return this.service.create(wsId, req.user.userId, dto);
  }

  @Patch(':id') update(@Param('workspaceId') wsId: string, @Param('id') id: string, @Body() dto: CreateSavedResponseDto) {
    return this.service.update(wsId, id, dto);
  }

  @Delete(':id') delete(@Param('workspaceId') wsId: string, @Param('id') id: string) {
    return this.service.delete(wsId, id);
  }
}