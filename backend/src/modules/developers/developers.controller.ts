import { Controller, Get, Patch, Post, Param, Query, Body, UseGuards, DefaultValuePipe, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DevelopersService } from './developers.service';
import { UpdateDeveloperDto } from './dto/update-developer.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('developers')
@Controller('developers')
export class DevelopersController {
  constructor(private developersService: DevelopersService) {}

  @Get()
  @ApiQuery({ name: 'skill', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'cursor', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  findAll(
    @Query('skill') skill?: string,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit?: number,
    @Query('cursor') cursor?: string,
    @Query('search') search?: string,
  ) {
    return this.developersService.findAll({
      skill,
      limit: Math.min(limit ?? 20, 100),
      cursor,
      search: search?.trim() || undefined,
    });
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DEVELOPER)
  @Patch('me')
  updateMyProfile(@CurrentUser() user: { id: string }, @Body() dto: UpdateDeveloperDto) {
    return this.developersService.updateMyProfile(user.id, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.DEVELOPER)
  @Post('me/verify')
  submitVerification(
    @CurrentUser() user: { id: string },
    @Body() body: { docUrl: string; docType: string },
  ) {
    return this.developersService.submitVerification(user.id, body.docUrl, body.docType);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.developersService.findById(id);
  }
}
