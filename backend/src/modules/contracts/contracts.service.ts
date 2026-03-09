import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

const SENDER_SELECT = {
  id: true,
  role: true,
  company: { select: { name: true } },
  developer: { select: { name: true } },
};

type ProposalAction = 'PROPOSE_START' | 'PROPOSE_SUBMIT' | 'PROPOSE_REVISION' | 'PROPOSE_APPROVE';
type ProposalStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'COUNTERED';

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private async postEvent(contractId: string, senderId: string, content: string, metadata: object) {
    return this.prisma.contractMessage.create({
      data: { contractId, senderId, content, type: 'EVENT', metadata },
    });
  }

  private async getContractWithAccess(contractId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { project: { include: { company: true } } },
    });
    if (!contract) throw new NotFoundException();

    const isCompany = contract.project.company.userId === userId;
    const devProposal = await this.prisma.proposal.findFirst({
      where: { projectId: contract.projectId, status: 'ACCEPTED', developer: { userId } },
    });
    if (!isCompany && !devProposal) throw new ForbiddenException();
    return { contract, isCompany, devProposal };
  }

  // ─── findById ─────────────────────────────────────────────────────────────

  async findById(id: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        milestones: { orderBy: { order: 'asc' } },
        project: {
          include: {
            company: { select: { name: true, userId: true, logoUrl: true, industry: true, location: true } },
            proposals: {
              where: { status: 'ACCEPTED' },
              include: {
                developer: {
                  select: { name: true, userId: true, avatarUrl: true, skills: true, rating: true, trustPoints: true },
                },
              },
              take: 1,
            },
          },
        },
      },
    });
    if (!contract) throw new NotFoundException('Contrato no encontrado');
    return contract;
  }

  // ─── Milestone: direct actions (now internal, called by proposal accept) ──

  private async doStartMilestone(contractId: string, milestoneId: string, userId: string) {
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
      await this.postEvent(contractId, userId, `Comenzó a trabajar en "${milestone.title}"`, {
        action: 'MILESTONE_STARTED',
        milestoneId,
        milestoneTitle: milestone.title,
      });
    }
    return updated;
  }

  private async doSubmitMilestone(
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

  private async doRequestRevision(
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
    await this.postEvent(contractId, userId, `Solicitó revisión de "${milestone.title}"${reason ? `: ${reason}` : ''}`, {
      action: 'MILESTONE_REVISION_REQUESTED',
      milestoneId,
      milestoneTitle: milestone.title,
      reason,
    });
    return updated;
  }

  private async doApproveMilestone(contractId: string, milestoneId: string, userId: string) {
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

    const updated = await this.prisma.milestone.update({ where: { id: milestoneId }, data: { status: 'PAID' } });

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

    await this.postEvent(contractId, userId, `Aprobó y liberó el pago de "${milestone.title}" · S/ ${milestone.amount}`, {
      action: 'MILESTONE_PAID',
      milestoneId,
      milestoneTitle: milestone.title,
      amount: milestone.amount.toString(),
    });

    const allMilestones = contract.milestones.map((m) =>
      m.id === milestoneId ? { ...m, status: 'PAID' as const } : m,
    );
    if (allMilestones.every((m) => m.status === 'PAID')) {
      await this.prisma.contract.update({ where: { id: contractId }, data: { status: 'COMPLETED' } });
      await this.prisma.project.update({ where: { id: contract.projectId }, data: { status: 'COMPLETED' } });
      await this.postEvent(contractId, userId, '🎉 ¡Proyecto completado! Todos los milestones fueron aprobados.', {
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

  // ─── Proposals (negotiation flow) ─────────────────────────────────────────

  async proposeAction(
    contractId: string,
    milestoneId: string,
    userId: string,
    dto: {
      action: ProposalAction;
      deliveryNote?: string;
      deliveryLink?: string;
      reason?: string;
    },
  ) {
    const { contract, isCompany } = await this.getContractWithAccess(contractId, userId);

    const milestone = await this.prisma.milestone.findFirst({ where: { id: milestoneId, contractId } });
    if (!milestone) throw new NotFoundException('Milestone no encontrado');

    // Validate who can propose what
    if ((dto.action === 'PROPOSE_START' || dto.action === 'PROPOSE_SUBMIT') && isCompany)
      throw new ForbiddenException('Solo el developer puede proponer esta acción');
    if ((dto.action === 'PROPOSE_REVISION' || dto.action === 'PROPOSE_APPROVE') && !isCompany)
      throw new ForbiddenException('Solo la empresa puede proponer esta acción');

    // Validate milestone state
    const validStates: Record<ProposalAction, string[]> = {
      PROPOSE_START: ['PENDING'],
      PROPOSE_SUBMIT: ['IN_PROGRESS', 'REVISION_REQUESTED'],
      PROPOSE_REVISION: ['SUBMITTED'],
      PROPOSE_APPROVE: ['SUBMITTED'],
    };
    if (!validStates[dto.action].includes(milestone.status))
      throw new BadRequestException(`El milestone no está en un estado válido para esta acción`);

    const labels: Record<ProposalAction, string> = {
      PROPOSE_START:    `Propone iniciar "${milestone.title}"`,
      PROPOSE_SUBMIT:   `Propone entregar "${milestone.title}"`,
      PROPOSE_REVISION: `Propone revisión de "${milestone.title}"${dto.reason ? `: ${dto.reason}` : ''}`,
      PROPOSE_APPROVE:  `Propone aprobar y pagar "${milestone.title}"`,
    };

    return this.prisma.contractMessage.create({
      data: {
        contractId,
        senderId: userId,
        content: labels[dto.action],
        type: 'PROPOSAL',
        metadata: {
          action: dto.action,
          proposalStatus: 'PENDING' as ProposalStatus,
          milestoneId,
          milestoneTitle: milestone.title,
          deliveryNote: dto.deliveryNote,
          deliveryLink: dto.deliveryLink,
          reason: dto.reason,
        },
      },
      include: { sender: { select: SENDER_SELECT } },
    });
  }

  async respondToProposal(
    contractId: string,
    messageId: string,
    userId: string,
    dto: { response: 'accept' | 'reject' | 'counter'; counter?: string },
  ) {
    const message = await this.prisma.contractMessage.findFirst({
      where: { id: messageId, contractId, type: 'PROPOSAL' },
    });
    if (!message) throw new NotFoundException('Propuesta no encontrada');

    const meta = message.metadata as {
      action: ProposalAction;
      proposalStatus: ProposalStatus;
      milestoneId: string;
      milestoneTitle: string;
      deliveryNote?: string;
      deliveryLink?: string;
      reason?: string;
    };

    if (meta.proposalStatus !== 'PENDING')
      throw new BadRequestException('Esta propuesta ya fue respondida');

    const { isCompany } = await this.getContractWithAccess(contractId, userId);

    // Validate who responds to what
    const responderShouldBeCompany =
      meta.action === 'PROPOSE_START' || meta.action === 'PROPOSE_SUBMIT';
    if (responderShouldBeCompany && !isCompany)
      throw new ForbiddenException('Solo la empresa puede responder esta propuesta');
    if (!responderShouldBeCompany && isCompany)
      throw new ForbiddenException('Solo el developer puede responder esta propuesta');

    // Can't respond to your own proposal
    if (message.senderId === userId)
      throw new ForbiddenException('No puedes responder tu propia propuesta');

    const newStatus: ProposalStatus =
      dto.response === 'accept' ? 'ACCEPTED' : dto.response === 'reject' ? 'REJECTED' : 'COUNTERED';

    // Update proposal status
    await this.prisma.contractMessage.update({
      where: { id: messageId },
      data: { metadata: { ...meta, proposalStatus: newStatus } },
    });

    if (dto.response === 'accept') {
      // Execute the actual action
      switch (meta.action) {
        case 'PROPOSE_START':
          await this.doStartMilestone(contractId, meta.milestoneId, message.senderId);
          break;
        case 'PROPOSE_SUBMIT':
          await this.doSubmitMilestone(contractId, meta.milestoneId, message.senderId, {
            deliveryNote: meta.deliveryNote,
            deliveryLink: meta.deliveryLink,
          });
          break;
        case 'PROPOSE_REVISION':
          await this.doRequestRevision(contractId, meta.milestoneId, message.senderId, meta.reason);
          break;
        case 'PROPOSE_APPROVE':
          await this.doApproveMilestone(contractId, meta.milestoneId, message.senderId);
          break;
      }
    } else if (dto.counter) {
      // Post counter as TEXT with metadata so frontend can style it
      await this.prisma.contractMessage.create({
        data: {
          contractId,
          senderId: userId,
          content: dto.counter,
          type: 'TEXT',
          metadata: {
            isCounter: true,
            replyTo: messageId,
            milestoneTitle: meta.milestoneTitle,
          },
        },
      });
    }

    return { success: true, status: newStatus };
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  async getMessages(contractId: string, userId: string) {
    await this.getContractWithAccess(contractId, userId);
    return this.prisma.contractMessage.findMany({
      where: { contractId },
      orderBy: { createdAt: 'asc' },
      take: 200,
      include: { sender: { select: SENDER_SELECT } },
    });
  }

  async sendMessage(contractId: string, userId: string, content: string) {
    await this.getContractWithAccess(contractId, userId);
    if (!content?.trim()) throw new BadRequestException('El mensaje no puede estar vacío');
    return this.prisma.contractMessage.create({
      data: { contractId, senderId: userId, content: content.trim() },
      include: { sender: { select: SENDER_SELECT } },
    });
  }

  // ─── Legacy direct milestone endpoints (kept for compat) ──────────────────

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
