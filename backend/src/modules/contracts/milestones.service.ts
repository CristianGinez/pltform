import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ContractAccessService } from './contract-access.service';

@Injectable()
export class MilestonesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private access: ContractAccessService,
  ) {}

  async doStartMilestone(contractId: string, milestoneId: string, userId: string) {
    const milestone = await this.prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        contractId,
        contract: { project: { proposals: { some: { status: 'ACCEPTED', developer: { userId } } } } },
      },
    });
    if (!milestone) throw new ForbiddenException();
    if (milestone.status !== 'PENDING') throw new BadRequestException('El milestone no está en estado PENDING');

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: 'IN_PROGRESS', startedAt: new Date() },
    });

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { project: { include: { company: true } } },
    });
    if (contract) {
      await this.notifications.create({
        userId: contract.project.company.userId,
        type: 'MILESTONE_STARTED',
        title: 'Milestone iniciado',
        body: `El developer comenzó a trabajar en "${milestone.title}"`,
        entityId: contractId,
        entityType: 'contract',
      });
      await this.access.postEvent(contractId, userId, `Comenzó a trabajar en "${milestone.title}"`, {
        action: 'MILESTONE_STARTED',
        milestoneId,
        milestoneTitle: milestone.title,
      });
    }
    return updated;
  }

  async doSubmitMilestone(
    contractId: string,
    milestoneId: string,
    userId: string,
    dto: { deliveryNote?: string; deliveryLink?: string },
  ) {
    const milestone = await this.prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        contractId,
        contract: { project: { proposals: { some: { status: 'ACCEPTED', developer: { userId } } } } },
      },
    });
    if (!milestone) throw new ForbiddenException();
    if (!['IN_PROGRESS', 'REVISION_REQUESTED'].includes(milestone.status))
      throw new BadRequestException('El milestone debe estar IN_PROGRESS o REVISION_REQUESTED');

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: 'SUBMITTED', deliveryNote: dto.deliveryNote, deliveryLink: dto.deliveryLink, submittedAt: new Date() },
    });

    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { project: { include: { company: true } } },
    });
    if (contract) {
      await this.notifications.create({
        userId: contract.project.company.userId,
        type: 'MILESTONE_SUBMITTED',
        title: 'Milestone entregado',
        body: `El developer entregó "${milestone.title}"`,
        entityId: contractId,
        entityType: 'contract',
      });
      await this.access.postEvent(contractId, userId, `Entregó "${milestone.title}" para revisión`, {
        action: 'MILESTONE_SUBMITTED',
        milestoneId,
        milestoneTitle: milestone.title,
        deliveryNote: dto.deliveryNote,
        deliveryLink: dto.deliveryLink,
      });
    }
    return updated;
  }

  async doRequestRevision(
    contractId: string,
    milestoneId: string,
    userId: string,
    reason?: string,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { project: { include: { company: true } } },
    });
    if (!contract) throw new NotFoundException();

    const company = await this.prisma.company.findUnique({ where: { userId } });
    if (contract.project.company.id !== company?.id) throw new ForbiddenException();

    const milestone = await this.prisma.milestone.findFirst({ where: { id: milestoneId, contractId } });
    if (!milestone) throw new NotFoundException('Milestone no encontrado');
    if (milestone.status !== 'SUBMITTED')
      throw new BadRequestException('Solo puedes pedir revisión de un milestone SUBMITTED');

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: 'REVISION_REQUESTED' },
    });

    const acceptedProposal = await this.prisma.proposal.findFirst({
      where: { projectId: contract.projectId, status: 'ACCEPTED' },
      include: { developer: true },
    });
    if (acceptedProposal) {
      await this.notifications.create({
        userId: acceptedProposal.developer.userId,
        type: 'MILESTONE_REVISION_REQUESTED',
        title: 'Se solicitó una revisión',
        body: reason ? `"${milestone.title}": ${reason}` : `La empresa solicitó revisión de "${milestone.title}"`,
        entityId: contractId,
        entityType: 'contract',
      });
    }
    await this.access.postEvent(contractId, userId, `Solicitó revisión de "${milestone.title}"${reason ? `: ${reason}` : ''}`, {
      action: 'MILESTONE_REVISION_REQUESTED',
      milestoneId,
      milestoneTitle: milestone.title,
      reason,
    });
    return updated;
  }

  async doApproveMilestone(contractId: string, milestoneId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { project: { include: { company: true } }, milestones: true },
    });
    if (!contract) throw new NotFoundException();

    const company = await this.prisma.company.findUnique({ where: { userId } });
    if (contract.project.company.id !== company?.id) throw new ForbiddenException();

    const milestone = await this.prisma.milestone.findFirst({ where: { id: milestoneId, contractId } });
    if (!milestone) throw new NotFoundException('Milestone no encontrado');
    if (milestone.status !== 'SUBMITTED')
      throw new BadRequestException('Solo puedes aprobar un milestone SUBMITTED');

    // Precalcular si este es el último milestone
    const allMilestones = contract.milestones.map((m) =>
      m.id === milestoneId ? { ...m, status: 'PAID' as const } : m,
    );
    const isContractComplete = allMilestones.every((m) => m.status === 'PAID');

    // ── Transacción atómica ──
    const updated = await this.prisma.$transaction(async (tx) => {
      // 1. Marcar milestone como PAID
      const updated = await tx.milestone.update({
        where: { id: milestoneId },
        data: { status: 'PAID' },
      });

      // 2. Si todos los milestones están pagados, completar contrato Y proyecto
      if (isContractComplete) {
        await tx.contract.update({ where: { id: contractId }, data: { status: 'COMPLETED' } });
        await tx.project.update({ where: { id: contract.projectId }, data: { status: 'COMPLETED' } });
      }

      return updated;
    });

    // ── Efectos secundarios (fuera de la transacción) ──
    const acceptedProposal = await this.prisma.proposal.findFirst({
      where: { projectId: contract.projectId, status: 'ACCEPTED' },
      include: { developer: true },
    });

    if (acceptedProposal) {
      await this.notifications.create({
        userId: acceptedProposal.developer.userId,
        type: 'MILESTONE_PAID',
        title: 'Milestone aprobado y pagado',
        body: `"${milestone.title}" fue aprobado. El pago ha sido liberado.`,
        entityId: contractId,
        entityType: 'contract',
      });
    }

    await this.access.postEvent(contractId, userId, `Aprobó y liberó el pago de "${milestone.title}" · S/ ${milestone.amount}`, {
      action: 'MILESTONE_PAID',
      milestoneId,
      milestoneTitle: milestone.title,
      amount: milestone.amount.toString(),
    });

    if (isContractComplete) {
      await this.access.postEvent(contractId, userId, '🎉 ¡Proyecto completado! Todos los milestones fueron aprobados.', {
        action: 'CONTRACT_COMPLETED',
      });
      const notifPayload = {
        type: 'CONTRACT_COMPLETED' as const,
        title: '¡Proyecto completado!',
        body: `El proyecto "${contract.project.title}" ha sido completado exitosamente.`,
        entityId: contractId,
        entityType: 'contract',
      };
      await this.notifications.create({ userId: contract.project.company.userId, ...notifPayload });
      if (acceptedProposal)
        await this.notifications.create({ userId: acceptedProposal.developer.userId, ...notifPayload });
    }

    return updated;
  }

  // ─── Public facade methods (legacy direct endpoints) ─────────────────────

  async startMilestone(contractId: string, milestoneId: string, userId: string) {
    return this.doStartMilestone(contractId, milestoneId, userId);
  }

  async submitMilestone(contractId: string, milestoneId: string, userId: string, dto: { deliveryNote?: string; deliveryLink?: string }) {
    return this.doSubmitMilestone(contractId, milestoneId, userId, dto);
  }

  async requestRevision(contractId: string, milestoneId: string, userId: string, dto: { reason?: string }) {
    return this.doRequestRevision(contractId, milestoneId, userId, dto.reason);
  }

  async approveMilestone(contractId: string, milestoneId: string, userId: string) {
    return this.doApproveMilestone(contractId, milestoneId, userId);
  }
}
