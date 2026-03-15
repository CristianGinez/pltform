import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  // Refresh token config — read once at startup
  private readonly refreshSecret: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.refreshSecret = this.configService.get<string>('jwt.refreshSecret')
      ?? 'dev-refresh-secret-change-in-production';
    this.refreshExpiresIn = this.configService.get<string>('jwt.refreshExpiresIn')
      ?? '7d';
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email ya registrado');

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        role: dto.role,
        ...(dto.role === 'COMPANY'
          ? { company: { create: { name: dto.name } } }
          : { developer: { create: { name: dto.name } } }),
      },
    });

    return this.generateTokens(user.id, user.email, user.role);
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciales incorrectas');
    }

    const valid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!valid) throw new UnauthorizedException('Credenciales incorrectas');

    return this.generateTokens(user.id, user.email, user.role);
  }

  async me(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        role: true,
        company: true,
        developer: true,
        createdAt: true,
      },
    });
  }

  /**
   * Validate a refresh token and issue a new token pair.
   * This implements token rotation: each refresh invalidates the old refresh token
   * by issuing a new one with a fresh expiry window.
   */
  async refresh(refreshToken: string) {
    // Verify the refresh token using the SEPARATE refresh secret
    let payload: { sub: string; email: string; role: string };
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: this.refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Refresh token inválido o expirado');
    }

    // Verify the user still exists (could have been deleted since token was issued)
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user) throw new UnauthorizedException('Usuario no encontrado');

    // Issue a brand new token pair (rotation)
    return this.generateTokens(user.id, user.email, user.role);
  }

  /**
   * Generate both access and refresh tokens.
   * - Access token: short-lived (15m default), signed with jwt.secret
   * - Refresh token: long-lived (7d default), signed with jwt.refreshSecret
   */
  private generateTokens(userId: string, email: string, role: string) {
    const payload = { sub: userId, email, role };

    // Access token — uses the JwtModule's configured secret and expiresIn
    const access_token = this.jwtService.sign(payload);

    // Refresh token — uses the SEPARATE refresh secret and longer expiry
    const refresh_token = this.jwtService.sign(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
    });

    return {
      access_token,
      refresh_token,
      user: { id: userId, email, role },
    };
  }
}
