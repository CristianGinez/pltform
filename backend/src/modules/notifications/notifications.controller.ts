import { Controller, Get, Patch, Param, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly svc: NotificationsService) {}

  @SkipThrottle()
  @Get()
  findMine(@CurrentUser() u: { id: string }) {
    return this.svc.findForUser(u.id);
  }

  @Patch('read-all')
  markAll(@CurrentUser() u: { id: string }) {
    return this.svc.markAllRead(u.id);
  }

  @Patch(':id/read')
  markOne(@Param('id') id: string, @CurrentUser() u: { id: string }) {
    return this.svc.markRead(id, u.id);
  }

  @SkipThrottle()
  @Get('admin')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  findAll() {
    return this.svc.findAll();
  }
}
