import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.contractsService.findById(id, user.id);
  }

  @Patch(':id/milestones/:milestoneId/start')
  startMilestone(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user: User,
  ) {
    return this.contractsService.startMilestone(id, milestoneId, user.id);
  }

  @Patch(':id/milestones/:milestoneId/submit')
  submitMilestone(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user: User,
    @Body() body: { deliveryNote?: string; deliveryLink?: string },
  ) {
    return this.contractsService.submitMilestone(id, milestoneId, user.id, body);
  }

  @Patch(':id/milestones/:milestoneId/request-revision')
  requestRevision(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user: User,
    @Body() body: { reason?: string },
  ) {
    return this.contractsService.requestRevision(id, milestoneId, user.id, body);
  }

  @Patch(':id/milestones/:milestoneId/approve')
  approveMilestone(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user: User,
  ) {
    return this.contractsService.approveMilestone(id, milestoneId, user.id);
  }

  @Get(':id/messages')
  getMessages(@Param('id') id: string, @CurrentUser() user: User) {
    return this.contractsService.getMessages(id, user.id);
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: { content: string },
  ) {
    return this.contractsService.sendMessage(id, user.id, body.content);
  }

  @Post(':id/milestones/:milestoneId/propose')
  proposeAction(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user: User,
    @Body() body: { action: string; deliveryNote?: string; deliveryLink?: string; reason?: string },
  ) {
    return this.contractsService.proposeAction(id, milestoneId, user.id, body as any);
  }

  @Post(':id/proposals/:messageId/respond')
  respondToProposal(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: User,
    @Body() body: { response: 'accept' | 'reject' | 'counter'; counter?: string },
  ) {
    return this.contractsService.respondToProposal(id, messageId, user.id, body);
  }

  @Post(':id/milestones/:milestoneId/progress')
  sendProgressUpdate(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user: User,
    @Body() body: { note?: string },
  ) {
    return this.contractsService.sendProgressUpdate(id, milestoneId, user.id, body.note ?? '');
  }

  @Post(':id/milestones/:milestoneId/testing')
  markReadyForTesting(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user: User,
  ) {
    return this.contractsService.markReadyForTesting(id, milestoneId, user.id);
  }
}
