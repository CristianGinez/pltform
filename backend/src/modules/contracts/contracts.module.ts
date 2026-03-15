import { Module } from '@nestjs/common';
import { ContractsController } from './contracts.controller';
import { ContractsService } from './contracts.service';
import { ContractAccessService } from './contract-access.service';
import { MilestonesService } from './milestones.service';
import { NegotiationService } from './negotiation.service';
import { ContractMessagesService } from './contract-messages.service';
import { DisputesService } from './disputes.service';
import { ReviewsService } from './reviews.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [ContractsController],
  providers: [
    ContractsService,
    ContractAccessService,
    MilestonesService,
    NegotiationService,
    ContractMessagesService,
    DisputesService,
    ReviewsService,
  ],
})
export class ContractsModule {}
