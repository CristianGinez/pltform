import { Module } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { DevelopersController } from './developers.controller';
import { DevelopersService } from './developers.service';
import { RolesGuard } from '../../common/guards/roles.guard';

@Module({
  controllers: [DevelopersController],
  providers: [DevelopersService, RolesGuard, Reflector],
})
export class DevelopersModule {}
