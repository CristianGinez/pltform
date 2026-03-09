import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const MSG_SELECT = {
  id: true,
  role: true,
  company: { select: { name: true } },
  developer: { select: { name: true } },
};

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ─── Helper: post an EVENT message to the contract chat ───────────────────
  private async postEvent(
    contractId: string,
    senderId: string,
    content: string,
    metadata: object,
  ) {
    return this.prisma.contractMessage.create({
      data: { contractId, senderId, content, type: 'EVENT', metadata },
    });
  }

  async findById(id: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        milestones: { orderBy: { order: 'asc' } },
        project: {
          include: {
            company: { select: { name: true, userId: true, logoUrl: true } },
          },
        },
      },
    });
    if (!contract) throw new NotFoundException('Contrato no encontrado');
    return contract;
  }

  async startMilestone(contractId: string, milestoneId: string, userId: string) {
    const milestone = await this.prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        contractId,
        contract: {
          project: { proposals: { some: { status: 'ACCEPTED', developer: { userId } } } },
        },
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
      await this.postEvent(contractId, userId, `Comenzó a trabajar en "${milestone.title}"`, {
        action: 'MILESTONE_STARTED',
        milestoneId,
        milestoneTitle: milestone.title,
      });
    }

    return updated;
  }

  async submitMilestone(
    contractId: string,
    milestoneId: string,
    userId: string,
    dto: { deliveryNote?: string; deliveryLink?: string },
  ) {
    const milestone = await this.prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        contractId,
        contract: {
          project: { proposals: { some: { status: 'ACCEPTED', developer: { userId } } } },
        },
      },
    });
    if (!milestone) throw new ForbiddenException();
    if (!['IN_PROGRESS', 'REVISION_REQUESTED'].includes(milestone.status)) {
      throw new BadRequestException('El milestone debe estar IN_PROGRESS o REVISION_REQUESTED para entregar');
    }

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: {
        status: 'SUBMITTED',
        deliveryNote: dto.deliveryNote,
        deliveryLink: dto.deliveryLink,
        submittedAt: new Date(),
      },
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
      await this.postEvent(contractId, userId, `Entregó "${milestone.title}" para revisión`, {
        action: 'MILESTONE_SUBMITTED',
        milestoneId,
        milestoneTitle: milestone.title,
        deliveryNote: dto.deliveryNote,
        deliveryLink: dto.deliveryLink,
      });
    }

    return updated;
  }

  async requestRevision(
    contractId: string,
    milestoneId: string,
    userId: string,
    dto: { reason?: string },
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { project: { include: { company: true } } },
    });
    if (!contract) throw new NotFoundException();

    const company = await this.prisma.company.findUnique({ where: { userId } });
    if (contract.project.company.id !== company?.id) throw new ForbiddenException();

    const milestone = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, contractId },
    });
    if (!milestone) throw new NotFoundException('Milestone no encontrado');
    if (milestone.status !== 'SUBMITTED') {
      throw new BadRequestException('Solo puedes pedir revisión de un milestone SUBMITTED');
    }

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
        body: dto.reason
          ? `"${milestone.title}": ${dto.reason}`
          : `La empresa solicitó revisión de "${milestone.title}"`,
        entityId: contractId,
        entityType: 'contract',
      });
    }
    await this.postEvent(contractId, userId, `Solicitó revisión de "${milestone.title}"${dto.reason ? `: ${dto.reason}` : ''}`, {
      action: 'MILESTONE_REVISION_REQUESTED',
      milestoneId,
      milestoneTitle: milestone.title,
      reason: dto.reason,
    });

    return updated;
  }

  async getMessages(contractId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { project: { include: { company: true } } },
    });
    if (!contract) throw new NotFoundException();

    const isCompany = contract.project.company.userId === userId;
    const isDeveloper = await this.prisma.proposal.findFirst({
      where: { projectId: contract.projectId, status: 'ACCEPTED', developer: { userId } },
    });
    if (!isCompany && !isDeveloper) throw new ForbiddenException();

    return this.prisma.contractMessage.findMany({
      where: { contractId },
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: { sender: { select: MSG_SELECT } },
    });
  }

  async sendMessage(contractId: string, userId: string, content: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { project: { include: { company: true } } },
    });
    if (!contract) throw new NotFoundException();

    const isCompany = contract.project.company.userId === userId;
    const isDeveloper = await this.prisma.proposal.findFirst({
      where: { projectId: contract.projectId, status: 'ACCEPTED', developer: { userId } },
    });
    if (!isCompany && !isDeveloper) throw new ForbiddenException();
    if (!content?.trim()) throw new BadRequestException('El mensaje no puede estar vacío');

    return this.prisma.contractMessage.create({
      data: { contractId, senderId: userId, content: content.trim() },
      include: { sender: { select: MSG_SELECT } },
    });
  }

  async approveMilestone(contractId: string, milestoneId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { project: { include: { company: true } }, milestones: true },
    });
    if (!contract) throw new NotFoundException();

    const company = await this.prisma.company.findUnique({ where: { userId } });
    if (contract.project.company.id !== company?.id) throw new ForbiddenException();

    const milestone = await this.prisma.milestone.findFirst({
      where: { id: milestoneId, contractId },
    });
    if (!milestone) throw new NotFoundException('Milestone no encontrado');
    if (milestone.status !== 'SUBMITTED') {
      throw new BadRequestException('Solo puedes aprobar un milestone SUBMITTED');
    }

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: 'PAID' },
    });

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

    await this.postEvent(contractId, userId, `Aprobó y liberó el pago de "${milestone.title}"`, {
      action: 'MILESTONE_PAID',
      milestoneId,
      milestoneTitle: milestone.title,
      amount: milestone.amount.toString(),
    });

    // Check if all milestones are now PAID → complete contract
    const allMilestones = contract.milestones.map((m) =>
      m.id === milestoneId ? { ...m, status: 'PAID' as const } : m,
    );
    const allPaid = allMilestones.every((m) => m.status === 'PAID');

    if (allPaid) {
      await this.prisma.contract.update({ where: { id: contractId }, data: { status: 'COMPLETED' } });
      await this.prisma.project.update({ where: { id: contract.projectId }, data: { status: 'COMPLETED' } });

      await this.postEvent(contractId, userId, '🎉 ¡Proyecto completado! Todos los milestones han sido aprobados y pagados.', {
        action: 'CONTRACT_COMPLETED',
      });

      await this.notifications.create({
        userId: contract.project.company.userId,
        type: 'CONTRACT_COMPLETED',
        title: '¡Proyecto completado!',
        body: `El proyecto "${contract.project.title}" ha sido completado exitosamente.`,
        entityId: contractId,
        entityType: 'contract',
      });
      if (acceptedProposal) {
        await this.notifications.create({
          userId: acceptedProposal.developer.userId,
          type: 'CONTRACT_COMPLETED',
          title: '¡Proyecto completado!',
          body: `El proyecto "${contract.project.title}" ha sido completado exitosamente.`,
          entityId: contractId,
          entityType: 'contract',
        });
      }
    }

    return updated;
  }
}
