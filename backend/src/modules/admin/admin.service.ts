import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async getPendingVerifications() {
    const [developers, companies] = await Promise.all([
      this.prisma.developer.findMany({
        where: { verificationStatus: 'PENDING' },
        select: {
          id: true, name: true, avatarUrl: true,
          verificationDocUrl: true, verificationDocType: true,
          verificationNotes: true, ruc: true, userId: true,
          createdAt: true,
        },
        orderBy: { updatedAt: 'asc' },
      }),
      this.prisma.company.findMany({
        where: { verificationStatus: 'PENDING' },
        select: {
          id: true, name: true, logoUrl: true,
          verificationDocUrl: true, verificationNotes: true,
          ruc: true, userId: true, createdAt: true,
        },
        orderBy: { updatedAt: 'asc' },
      }),
    ]);
    return {
      developers: developers.map((d) => ({ ...d, type: 'developer' as const })),
      companies: companies.map((c) => ({ ...c, type: 'company' as const })),
    };
  }

  async approveDeveloper(id: string) {
    const dev = await this.prisma.developer.findUnique({ where: { id } });
    if (!dev) throw new NotFoundException('Developer not found');
    await this.prisma.developer.update({
      where: { id },
      data: { verificationStatus: 'APPROVED', verified: true, verificationNotes: null },
    });
    await this.notifications.create({
      userId: dev.userId,
      type: 'VERIFICATION_APPROVED',
      title: '¡Tu identidad fue verificada!',
      body: 'Tu solicitud de verificación fue aprobada. Tu perfil ahora muestra el sello de verificación.',
    });
    return { ok: true };
  }

  async rejectDeveloper(id: string, reason: string) {
    const dev = await this.prisma.developer.findUnique({ where: { id } });
    if (!dev) throw new NotFoundException('Developer not found');
    await this.prisma.developer.update({
      where: { id },
      data: { verificationStatus: 'REJECTED', verified: false, verificationNotes: reason },
    });
    await this.notifications.create({
      userId: dev.userId,
      type: 'VERIFICATION_REJECTED',
      title: 'Solicitud de verificación rechazada',
      body: `Tu solicitud fue rechazada. Motivo: ${reason}`,
    });
    return { ok: true };
  }

  async approveCompany(id: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    await this.prisma.company.update({
      where: { id },
      data: { verificationStatus: 'APPROVED', verified: true, verificationNotes: null },
    });
    await this.notifications.create({
      userId: company.userId,
      type: 'VERIFICATION_APPROVED',
      title: '¡Tu empresa fue verificada!',
      body: 'Tu solicitud de verificación fue aprobada. Tu empresa ahora muestra el sello de verificación.',
    });
    return { ok: true };
  }

  async rejectCompany(id: string, reason: string) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    await this.prisma.company.update({
      where: { id },
      data: { verificationStatus: 'REJECTED', verified: false, verificationNotes: reason },
    });
    await this.notifications.create({
      userId: company.userId,
      type: 'VERIFICATION_REJECTED',
      title: 'Solicitud de verificación rechazada',
      body: `Tu solicitud fue rechazada. Motivo: ${reason}`,
    });
    return { ok: true };
  }
}
