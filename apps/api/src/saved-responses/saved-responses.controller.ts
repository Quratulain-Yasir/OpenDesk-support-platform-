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

interface ReqWithUser {
  user?: { userId?: string; id?: string; sub?: string };
}

@Controller('workspaces/:workspaceId/saved-responses')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class SavedResponsesController {
  constructor(private service: SavedResponsesService) {}

  @Get()
  findAll(@Param('workspaceId') wsId: string) {
    return this.service.findAll(wsId);
  }

  @Post()
  create(
    @Param('workspaceId') wsId: string,
    @Request() req: ReqWithUser,
    @Body() dto: CreateSavedResponseDto,
  ) {
    const userId = req.user?.userId || req.user?.id || req.user?.sub;
    if (!userId) throw new Error('Unauthorized');
    return this.service.create(wsId, userId, dto);
  }

  @Patch(':id')
  update(
    @Param('workspaceId') wsId: string,
    @Param('id') id: string,
    @Body() dto: CreateSavedResponseDto,
  ) {
    return this.service.update(wsId, id, dto);
  }

  @Delete(':id')
  delete(@Param('workspaceId') wsId: string, @Param('id') id: string) {
    return this.service.delete(wsId, id);
  }
}
