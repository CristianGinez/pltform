import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshDto } from './dto/refresh.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @ApiOperation({ summary: 'Iniciar sesión' })
  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @ApiOperation({ summary: 'Renovar tokens con refresh token' })
  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('refresh')
  refresh(@Body() dto: RefreshDto) {
    return this.authService.refresh(dto.refresh_token);
  }

  @ApiOperation({ summary: 'Obtener usuario actual' })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @SkipThrottle()
  @Get('me')
  me(@CurrentUser() user: User) {
    return this.authService.me(user.id);
  }
}
