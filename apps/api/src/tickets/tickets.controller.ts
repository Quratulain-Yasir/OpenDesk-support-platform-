import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { WorkspaceMemberGuard } from '../auth/guards/workspace-member.guard';
import { GetUser } from '../auth/decorators/get-user.decorator';

@Controller('workspaces/:workspaceId/tickets')
@UseGuards(JwtAuthGuard, WorkspaceMemberGuard)
export class TicketsController {
  constructor(private ticketsService: TicketsService) {}

  @Post()
  create(
    @Param('workspaceId') workspaceId: string,
    @Body() dto: CreateTicketDto,
    @GetUser() user: { userId: string },
  ) {
    return this.ticketsService.create(workspaceId, dto);
  }

  @Get()
  findAll(
    @Param('workspaceId') workspaceId: string,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('search') search?: string,
    @Query('mine') mine?: string,
    @GetUser() user?: { userId: string },
  ) {
    return this.ticketsService.findAll(workspaceId, {
      status,
      priority,
      search,
      mine: mine === 'true',
      userId: user?.userId,
    });
  }

  @Get(':id')
  findOne(@Param('workspaceId') workspaceId: string, @Param('id') id: string) {
    return this.ticketsService.findOne(workspaceId, id);
  }

  @Patch(':id')
  update(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
    @Body() dto: UpdateTicketDto,
    @GetUser() user: { userId: string },
  ) {
    return this.ticketsService.update(workspaceId, id, dto, user.userId);
  }

  // NEW — AI Suggest
  @Post(':id/ai-suggest')
  aiSuggest(
    @Param('workspaceId') workspaceId: string,
    @Param('id') id: string,
  ) {
    return this.ticketsService.suggestReply(workspaceId, id);
  }
}