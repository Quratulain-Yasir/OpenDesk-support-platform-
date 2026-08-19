import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from '../auth/guards/workspace-member.guard';

@Controller('workspaces/:workspaceId/leads')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class LeadsController {
  constructor(private leadsService: LeadsService) {}

  @Get()
  findAll(@Param('workspaceId') workspaceId: string) {
    return this.leadsService.findAll(workspaceId);
  }

  @Get(':id')
  findOne(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.leadsService.findOne(workspaceId, id);
  }

  @Patch(':id')
  updateStatus(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateLeadDto,
  ) {
    return this.leadsService.updateStatus(workspaceId, id, dto);
  }
}
