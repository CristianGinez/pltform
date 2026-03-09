import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
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
}
