import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CompaniesController } from './companies.controller';
import { CompaniesService } from './companies.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [CompaniesController],
  providers: [CompaniesService, RolesGuard, Reflector],
})
export class CompaniesModule {}
