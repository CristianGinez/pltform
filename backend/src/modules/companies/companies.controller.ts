import { Controller, Get, Patch, Post, Query, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { CompaniesService } from './companies.service';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('companies')
@Controller('companies')
export class CompaniesController {
  constructor(private companiesService: CompaniesService) {}

  @Get()
  findAll() {
    return this.companiesService.findAll();
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY)
  @Patch('me')
  updateMyProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateCompanyDto) {
    return this.companiesService.updateMyProfile(user.id, dto);
  }

  @Get('validate-ruc')
  validateRuc(@Query('ruc') ruc: string) {
    return this.companiesService.validateRuc(ruc);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.COMPANY)
  @Post('me/verify')
  submitVerification(
    @CurrentUser() user: { id: string },
    @Body() body: { docUrl?: string; ruc?: string },
  ) {
    return this.companiesService.submitVerification(user.id, body.docUrl, body.ruc);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.companiesService.findById(id);
  }
}
