import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('admin')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.ADMIN)
@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  @Get('verifications')
  getPendingVerifications() {
    return this.adminService.getPendingVerifications();
  }

  @Patch('verifications/developer/:id/approve')
  approveDeveloper(@Param('id') id: string) {
    return this.adminService.approveDeveloper(id);
  }

  @Patch('verifications/developer/:id/reject')
  rejectDeveloper(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.adminService.rejectDeveloper(id, body.reason);
  }

  @Patch('verifications/company/:id/approve')
  approveCompany(@Param('id') id: string) {
    return this.adminService.approveCompany(id);
  }

  @Patch('verifications/company/:id/reject')
  rejectCompany(@Param('id') id: string, @Body() body: { reason: string }) {
    return this.adminService.rejectCompany(id, body.reason);
  }
}
