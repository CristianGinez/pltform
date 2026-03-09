import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateDeveloperDto } from './dto/update-developer.dto';

@Injectable()
export class DevelopersService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  findAll(skill?: string) {
    return this.prisma.developer.findMany({
      where: {
        available: true,
        ...(skill ? { skills: { has: skill } } : {}),
      },
      select: {
        id: true,
        name: true,
        bio: true,
        skills: true,
        hourlyRate: true,
        location: true,
        avatarUrl: true,
        rating: true,
        reviewCount: true,
        available: true,
        verified: true,
        trustPoints: true,
        specialtyBadges: true,
        university: true,
        warrantyDays: true,
      },
      orderBy: { rating: 'desc' },
    });
  }

  async findById(id: string) {
    const dev = await this.prisma.developer.findUnique({
      where: { id },
      include: {
        user: { select: { email: true } },
        proposals: {
          where: { status: 'ACCEPTED' },
          include: {
            project: {
              select: {
                id: true, title: true, description: true,
                budget: true, skills: true, category: true,
                company: { select: { name: true, verified: true } },
                createdAt: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    if (!dev) throw new NotFoundException('Developer no encontrado');
    return dev;
  }

  async updateMyProfile(userId: string, dto: UpdateDeveloperDto) {
    const developer = await this.prisma.developer.findUnique({ where: { userId } });
    if (!developer) throw new NotFoundException('Developer not found');
    return this.prisma.developer.update({ where: { userId }, data: dto });
  }

  async submitVerification(userId: string, docUrl: string, docType: string) {
    const developer = await this.prisma.developer.findUnique({ where: { userId } });
    if (!developer) throw new NotFoundException('Developer not found');
    if (developer.verificationStatus === 'PENDING') {
      throw new BadRequestException('Ya tienes una solicitud de verificación pendiente');
    }
    if (developer.verified) {
      throw new BadRequestException('Tu cuenta ya está verificada');
    }
    await this.prisma.developer.update({
      where: { userId },
      data: { verificationStatus: 'PENDING', verificationDocUrl: docUrl, verificationDocType: docType, verificationNotes: null },
    });
    // Notify admins
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
    await Promise.all(admins.map((admin) =>
      this.notifications.create({
        userId: admin.id,
        type: 'VERIFICATION_SUBMITTED',
        title: 'Nueva solicitud de verificación',
        body: `El developer ${developer.name} ha solicitado verificación de identidad`,
        entityId: developer.id,
        entityType: 'developer',
      }),
    ));
    return { ok: true };
  }
}
