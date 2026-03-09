import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  findAll() {
    return this.prisma.company.findMany({
      where: { verified: true },
      select: { id: true, name: true, industry: true, logoUrl: true, location: true },
    });
  }

  findById(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        projects: {
          where: { status: { in: ['OPEN', 'COMPLETED', 'IN_PROGRESS'] } },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true, title: true, description: true, budget: true,
            status: true, category: true, skills: true, createdAt: true,
            _count: { select: { proposals: true } },
          },
        },
        user: {
          select: {
            reviewsReceived: {
              take: 20,
              orderBy: { createdAt: 'desc' },
              include: {
                reviewer: {
                  select: {
                    developer: { select: { name: true, avatarUrl: true } },
                  },
                },
              },
            },
          },
        },
      },
    });
  }

  async updateMyProfile(userId: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({ where: { userId } });
    if (!company) throw new NotFoundException('Company not found');
    return this.prisma.company.update({ where: { userId }, data: dto });
  }

  async validateRuc(ruc: string): Promise<{ valid: boolean; razonSocial?: string; estado?: string; condicion?: string }> {
    if (!ruc || !/^\d{11}$/.test(ruc)) {
      return { valid: false };
    }
    try {
      const res = await fetch(`https://api.apis.net.pe/v2/sunat/ruc?numero=${ruc}`, {
        headers: { Accept: 'application/json' },
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return { valid: false };
      const data = await res.json() as { ruc?: string; razonSocial?: string; estado?: string; condicion?: string };
      if (!data.ruc) return { valid: false };
      return { valid: true, razonSocial: data.razonSocial, estado: data.estado, condicion: data.condicion };
    } catch {
      return { valid: false };
    }
  }

  async submitVerification(userId: string, docUrl?: string, ruc?: string) {
    const company = await this.prisma.company.findUnique({ where: { userId } });
    if (!company) throw new NotFoundException('Company not found');
    if (company.verificationStatus === 'PENDING') {
      throw new BadRequestException('Ya tienes una solicitud de verificación pendiente');
    }
    if (company.verified) {
      throw new BadRequestException('Tu empresa ya está verificada');
    }
    if (!docUrl && !ruc) {
      throw new BadRequestException('Debes proporcionar un documento o RUC');
    }
    const updateData: Record<string, unknown> = { verificationStatus: 'PENDING', verificationNotes: null };
    if (docUrl) updateData.verificationDocUrl = docUrl;
    if (ruc) updateData.ruc = ruc;
    await this.prisma.company.update({ where: { userId }, data: updateData });
    // Notify admins
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
    await Promise.all(admins.map((admin) =>
      this.notifications.create({
        userId: admin.id,
        type: 'VERIFICATION_SUBMITTED',
        title: 'Nueva solicitud de verificación',
        body: `La empresa ${company.name} ha solicitado verificación${ruc ? ` (RUC: ${ruc})` : ''}`,
        entityId: company.id,
        entityType: 'company',
      }),
    ));
    return { ok: true };
  }
}
