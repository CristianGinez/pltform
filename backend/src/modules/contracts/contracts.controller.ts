import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role, User } from '@prisma/client';
import { ContractsService } from './contracts.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubmitMilestoneDto } from './dto/submit-milestone.dto';
import { RequestRevisionDto } from './dto/request-revision.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ProposeActionDto } from './dto/propose-action.dto';
import { RespondProposalDto } from './dto/respond-proposal.dto';
import { OpenDisputeDto } from './dto/open-dispute.dto';
import { ResolveDisputeDto } from './dto/resolve-dispute.dto';

@ApiTags('contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contracts')
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Get('disputed')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getDisputed() {
    return this.contractsService.getDisputedContracts();
  }

  @SkipThrottle()
  @Get(':id/messages/admin')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  getMessagesAdmin(
    @Param('id') id: string,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.contractsService.getMessagesAdmin(id, { limit: Math.min(limit ?? 50, 200), cursor });
  }

  @SkipThrottle()
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
    @Body() dto: SubmitMilestoneDto,
  ) {
    return this.contractsService.submitMilestone(id, milestoneId, user.id, dto);
  }

  @Patch(':id/milestones/:milestoneId/request-revision')
  requestRevision(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user: User,
    @Body() dto: RequestRevisionDto,
  ) {
    return this.contractsService.requestRevision(id, milestoneId, user.id, dto);
  }

  @Patch(':id/milestones/:milestoneId/approve')
  approveMilestone(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user: User,
  ) {
    return this.contractsService.approveMilestone(id, milestoneId, user.id);
  }

  @SkipThrottle()
  @Get(':id/messages')
  getMessages(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
    @Query('cursor') cursor?: string,
  ) {
    return this.contractsService.getMessages(id, user.id, { limit: Math.min(limit ?? 50, 200), cursor });
  }

  @Post(':id/messages')
  sendMessage(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: SendMessageDto,
  ) {
    return this.contractsService.sendMessage(id, user.id, dto.content);
  }

  @Post(':id/milestones/:milestoneId/propose')
  proposeAction(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user: User,
    @Body() dto: ProposeActionDto,
  ) {
    return this.contractsService.proposeAction(id, milestoneId, user.id, dto as any);
  }

  @Post(':id/propose-cancel')
  proposeCancelContract(
    @Param('id') id: string,
    @CurrentUser() user: User,
  ) {
    return this.contractsService.proposeAction(id, undefined, user.id, { action: 'PROPOSE_CANCEL' });
  }

  @Post(':id/proposals/:messageId/respond')
  respondToProposal(
    @Param('id') id: string,
    @Param('messageId') messageId: string,
    @CurrentUser() user: User,
    @Body() dto: RespondProposalDto,
  ) {
    return this.contractsService.respondToProposal(id, messageId, user.id, dto);
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

  @Post(':id/dispute')
  openDispute(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: OpenDisputeDto,
  ) {
    return this.contractsService.openDispute(id, user.id, dto.reason);
  }

  @Patch(':id/resolve')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  resolveDispute(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.contractsService.resolveDispute(id, user.id, dto.outcome, dto.adminComment);
  }

  @Post(':id/milestone-plan')
  proposeMilestonePlan(
    @Param('id') id: string,
    @CurrentUser() user: { id: string },
    @Body() body: { milestones: Array<{ title: string; description?: string; amount: number; order: number }> },
  ) {
    return this.contractsService.proposeMilestonePlan(id, user.id, body.milestones);
  }

  @Post(':id/milestones/:milestoneId/force-approve')
  forceApprove(
    @Param('id') id: string,
    @Param('milestoneId') milestoneId: string,
    @CurrentUser() user: User,
  ) {
    return this.contractsService.forceApprove(id, milestoneId, user.id);
  }

  @Post(':id/review')
  createReview(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() body: { rating: number; comment?: string },
  ) {
    return this.contractsService.createReview(id, user.id, body.rating, body.comment);
  }
}
