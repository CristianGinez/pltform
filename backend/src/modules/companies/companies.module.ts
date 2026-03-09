import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { RolesGuard } from '../../common/guards/roles.guard';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [CompaniesController],
  providers: [CompaniesService, RolesGuard, Reflector],
})
export class CompaniesModule {}
