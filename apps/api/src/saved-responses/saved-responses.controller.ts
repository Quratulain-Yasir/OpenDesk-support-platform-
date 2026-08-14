import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { SavedResponsesService } from './saved-responses.service';
import { CreateSavedResponseDto } from './dto/create-saved-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from '../workspaces/guards/workspace-member.guard';

@Controller('workspaces/:workspaceId/saved-responses')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class SavedResponsesController {
  constructor(private service: SavedResponsesService) {}

  @Get()
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.service.findAll(workspaceId);
  }

  @Post()
  create(
    @Param('workspaceId') workspaceId: string,
    @Request() req,
    @Body() dto: CreateSavedResponseDto,
  ) {
    return this.service.create(workspaceId, req.user.userId, dto);
  }

  @Patch(':id')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: CreateSavedResponseDto,
  ) {
    return this.service.update(workspaceId, id, req.user.userId, dto);
  }

  @Delete(':id')
  delete(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.service.delete(workspaceId, id);
  }
}
