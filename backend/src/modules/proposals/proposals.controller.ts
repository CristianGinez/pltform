import { Controller, Post, Get, Param, Body, UseGuards, Patch } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { ProposalsService } from './proposals.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('proposals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('proposals')
export class ProposalsController {
  constructor(private proposalsService: ProposalsService) {}

  @Get('my')
  @UseGuards(RolesGuard)
  @Roles('DEVELOPER')
  findMine(@CurrentUser() user: User) {
    return this.proposalsService.findByDeveloper(user.id);
  }

  @Post('project/:projectId')
  @UseGuards(RolesGuard)
  @Roles('DEVELOPER')
  create(
    @Param('projectId') projectId: string,
    @CurrentUser() user: User,
    @Body() dto: CreateProposalDto,
  ) {
    return this.proposalsService.create(projectId, user.id, dto);
  }

  @Patch(':id/accept')
  @UseGuards(RolesGuard)
  @Roles('COMPANY')
  accept(@Param('id') id: string, @CurrentUser() user: User) {
    return this.proposalsService.accept(id, user.id);
  }

  @Patch(':id/withdraw')
  @UseGuards(RolesGuard)
  @Roles('DEVELOPER')
  withdraw(@Param('id') id: string, @CurrentUser() user: User) {
    return this.proposalsService.withdraw(id, user.id);
  }
}
