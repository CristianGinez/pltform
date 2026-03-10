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

type ProposalAction = 'PROPOSE_START' | 'PROPOSE_SUBMIT' | 'PROPOSE_REVISION' | 'PROPOSE_APPROVE' | 'PROPOSE_CANCEL' | 'PROPOSE_MILESTONE_PLAN';
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
        reviews: { where: { reviewerId: userId } },
        project: {
          include: {
            company: { select: { id: true, name: true, userId: true, logoUrl: true, industry: true, location: true } },
            proposals: {
              where: { status: 'ACCEPTED' },
              include: {
                developer: {
                  select: { id: true, name: true, userId: true, avatarUrl: true, skills: true, rating: true, trustPoints: true },
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
    milestoneId: string | undefined,
    userId: string,
    dto: {
      action: ProposalAction;
      deliveryNote?: string;
      deliveryLink?: string;
      reason?: string;
    },
  ) {
    const { contract, isCompany } = await this.getContractWithAccess(contractId, userId);

    // PROPOSE_CANCEL doesn't require a milestone
    if (dto.action === 'PROPOSE_CANCEL') {
      if (contract.status !== 'ACTIVE')
        throw new BadRequestException('Solo puedes proponer cancelar un contrato ACTIVE');

      const message = await this.prisma.contractMessage.create({
        data: {
          contractId,
          senderId: userId,
          content: 'Propone cancelar el contrato por mutuo acuerdo',
          type: 'PROPOSAL',
          metadata: {
            action: 'PROPOSE_CANCEL',
            proposalStatus: 'PENDING' as ProposalStatus,
            milestoneId: '',
            milestoneTitle: '',
          },
        },
        include: { sender: { select: SENDER_SELECT } },
      });

      const notifBody = 'Se propone cancelar el contrato por mutuo acuerdo';
      if (isCompany) {
        const acceptedDev = await this.prisma.proposal.findFirst({
          where: { projectId: contract.projectId, status: 'ACCEPTED' },
          include: { developer: { select: { userId: true } } },
        });
        if (acceptedDev) {
          await this.notifications.create({
            userId: acceptedDev.developer.userId,
            type: 'PROPOSAL_RECEIVED',
            title: 'Propuesta de cancelación',
            body: notifBody,
            entityId: contractId,
            entityType: 'contract',
          });
        }
      } else {
        await this.notifications.create({
          userId: contract.project.company.userId,
          type: 'PROPOSAL_RECEIVED',
          title: 'Propuesta de cancelación',
          body: notifBody,
          entityId: contractId,
          entityType: 'contract',
        });
      }

      return message;
    }

    const milestone = await this.prisma.milestone.findFirst({ where: { id: milestoneId, contractId } });
    if (!milestone) throw new NotFoundException('Milestone no encontrado');

    // Validate who can propose what
    if ((dto.action === 'PROPOSE_START' || dto.action === 'PROPOSE_SUBMIT') && isCompany)
      throw new ForbiddenException('Solo el developer puede proponer esta acción');
    if ((dto.action === 'PROPOSE_REVISION' || dto.action === 'PROPOSE_APPROVE') && !isCompany)
      throw new ForbiddenException('Solo la empresa puede proponer esta acción');

    // Validate milestone state
    const validStates: Record<Exclude<ProposalAction, 'PROPOSE_CANCEL'>, string[]> = {
      PROPOSE_MILESTONE_PLAN: ['PENDING'],
      PROPOSE_START: ['PENDING'],
      PROPOSE_SUBMIT: ['IN_PROGRESS', 'REVISION_REQUESTED'],
      PROPOSE_REVISION: ['SUBMITTED'],
      PROPOSE_APPROVE: ['SUBMITTED'],
    };
    if (!(validStates as Record<string, string[]>)[dto.action]?.includes(milestone.status))
      throw new BadRequestException(`El milestone no está en un estado válido para esta acción`);

    const labels: Record<Exclude<ProposalAction, 'PROPOSE_CANCEL'>, string> = {
      PROPOSE_MILESTONE_PLAN: `Propone plan de milestones`,
      PROPOSE_START:    `Propone iniciar "${milestone.title}"`,
      PROPOSE_SUBMIT:   `Propone entregar "${milestone.title}"`,
      PROPOSE_REVISION: `Propone revisión de "${milestone.title}"${dto.reason ? `: ${dto.reason}` : ''}`,
      PROPOSE_APPROVE:  `Propone aprobar y pagar "${milestone.title}"`,
    };

    const message = await this.prisma.contractMessage.create({
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

    // Notify the other party
    const notifTitle = isCompany ? 'Nueva propuesta del cliente' : 'Nueva propuesta del developer';
    if (isCompany) {
      const acceptedDev = await this.prisma.proposal.findFirst({
        where: { projectId: contract.projectId, status: 'ACCEPTED' },
        include: { developer: { select: { userId: true } } },
      });
      if (acceptedDev) {
        await this.notifications.create({
          userId: acceptedDev.developer.userId,
          type: 'PROPOSAL_RECEIVED',
          title: notifTitle,
          body: labels[dto.action],
          entityId: contractId,
          entityType: 'contract',
        });
      }
    } else {
      await this.notifications.create({
        userId: contract.project.company.userId,
        type: 'PROPOSAL_RECEIVED',
        title: notifTitle,
        body: labels[dto.action],
        entityId: contractId,
        entityType: 'contract',
      });
    }

    return message;
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
      milestones?: Array<{ title: string; description?: string; amount: number; order: number }>;
    };

    if (meta.proposalStatus !== 'PENDING')
      throw new BadRequestException('Esta propuesta ya fue respondida');

    const { contract, isCompany } = await this.getContractWithAccess(contractId, userId);

    // Validate who responds to what
    // For PROPOSE_CANCEL: either party can respond (the one who didn't send it)
    if (meta.action !== 'PROPOSE_CANCEL') {
      const responderShouldBeCompany =
        meta.action === 'PROPOSE_START' || meta.action === 'PROPOSE_SUBMIT' || meta.action === 'PROPOSE_MILESTONE_PLAN';
      if (responderShouldBeCompany && !isCompany)
        throw new ForbiddenException('Solo la empresa puede responder esta propuesta');
      if (!responderShouldBeCompany && isCompany)
        throw new ForbiddenException('Solo el developer puede responder esta propuesta');
    }

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
        case 'PROPOSE_CANCEL': {
          await this.prisma.contract.update({ where: { id: contractId }, data: { status: 'CANCELLED' } });
          await this.postEvent(contractId, userId, 'Contrato cancelado por acuerdo mutuo', {
            action: 'CONTRACT_CANCELLED_MUTUAL',
          });
          // Notify both parties
          const devProposalCancel = await this.prisma.proposal.findFirst({
            where: { projectId: contract.projectId, status: 'ACCEPTED' },
            include: { developer: { select: { userId: true } } },
          });
          const notifPayloadCancel = {
            type: 'CONTRACT_COMPLETED' as const,
            title: 'Contrato cancelado',
            body: 'El contrato fue cancelado por acuerdo mutuo.',
            entityId: contractId,
            entityType: 'contract',
          };
          await this.notifications.create({ userId: contract.project.company.userId, ...notifPayloadCancel });
          if (devProposalCancel)
            await this.notifications.create({ userId: devProposalCancel.developer.userId, ...notifPayloadCancel });
          break;
        }
        case 'PROPOSE_MILESTONE_PLAN': {
          if (meta.milestones) {
            await this.prisma.milestone.createMany({
              data: meta.milestones.map((m: { title: string; description?: string; amount: number; order: number }) => ({
                contractId,
                title: m.title,
                description: m.description,
                amount: m.amount,
                order: m.order,
                status: 'PENDING',
              })),
            });
            await this.prisma.contractMessage.update({
              where: { id: messageId },
              data: { metadata: { ...meta, proposalStatus: 'ACCEPTED' } },
            });
            return { ok: true };
          }
          break;
        }
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
    const { contract, isCompany } = await this.getContractWithAccess(contractId, userId);
    if (!content?.trim()) throw new BadRequestException('El mensaje no puede estar vacío');

    const message = await this.prisma.contractMessage.create({
      data: { contractId, senderId: userId, content: content.trim() },
      include: { sender: { select: SENDER_SELECT } },
    });

    // Notify the other party
    const senderName = message.sender.company?.name ?? message.sender.developer?.name ?? 'Alguien';
    const preview = content.trim().length > 80 ? content.trim().slice(0, 80) + '...' : content.trim();

    if (isCompany) {
      const devProposal = await this.prisma.proposal.findFirst({
        where: { projectId: contract.projectId, status: 'ACCEPTED' },
        include: { developer: { select: { userId: true } } },
      });
      if (devProposal) {
        await this.notifications.create({
          userId: devProposal.developer.userId,
          type: 'MESSAGE_RECEIVED',
          title: 'Nuevo mensaje',
          body: `${senderName}: ${preview}`,
          entityId: contractId,
          entityType: 'contract',
        });
      }
    } else {
      await this.notifications.create({
        userId: contract.project.company.userId,
        type: 'MESSAGE_RECEIVED',
        title: 'Nuevo mensaje',
        body: `${senderName}: ${preview}`,
        entityId: contractId,
        entityType: 'contract',
      });
    }

    return message;
  }

  async sendProgressUpdate(contractId: string, milestoneId: string, userId: string, note: string) {
    const { isCompany } = await this.getContractWithAccess(contractId, userId);
    if (isCompany) throw new ForbiddenException('Solo el developer puede enviar actualizaciones');

    const milestone = await this.prisma.milestone.findFirst({ where: { id: milestoneId, contractId } });
    if (!milestone) throw new NotFoundException('Milestone no encontrado');
    if (!['IN_PROGRESS', 'REVISION_REQUESTED'].includes(milestone.status))
      throw new BadRequestException('El milestone debe estar en progreso');

    return this.postEvent(contractId, userId, note?.trim() || `Actualización en "${milestone.title}"`, {
      action: 'PROGRESS_UPDATE',
      milestoneId,
      milestoneTitle: milestone.title,
    });
  }

  async markReadyForTesting(contractId: string, milestoneId: string, userId: string) {
    const { isCompany } = await this.getContractWithAccess(contractId, userId);
    if (isCompany) throw new ForbiddenException('Solo el developer puede marcar listo para testing');

    const milestone = await this.prisma.milestone.findFirst({ where: { id: milestoneId, contractId } });
    if (!milestone) throw new NotFoundException('Milestone no encontrado');
    if (!['IN_PROGRESS', 'REVISION_REQUESTED'].includes(milestone.status))
      throw new BadRequestException('El milestone debe estar en progreso');

    return this.postEvent(contractId, userId, `"${milestone.title}" está listo para testing / revisión parcial`, {
      action: 'READY_FOR_TESTING',
      milestoneId,
      milestoneTitle: milestone.title,
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

  // ─── Dispute system ───────────────────────────────────────────────────────

  async openDispute(contractId: string, userId: string, reason: string) {
    const { contract, isCompany } = await this.getContractWithAccess(contractId, userId);
    if (contract.status !== 'ACTIVE')
      throw new BadRequestException('Solo puedes abrir una disputa en un contrato ACTIVE');
    if (!reason?.trim() || reason.trim().length < 10)
      throw new BadRequestException('El motivo debe tener al menos 10 caracteres');

    await this.prisma.contract.update({
      where: { id: contractId },
      data: { status: 'DISPUTED', disputeReason: reason.trim(), disputeOpenedById: userId },
    });

    await this.postEvent(contractId, userId, `Disputa abierta: "${reason.trim()}"`, {
      action: 'DISPUTE_OPENED',
      reason: reason.trim(),
    });

    // Notify the other party
    if (isCompany) {
      const devProposal = await this.prisma.proposal.findFirst({
        where: { projectId: contract.projectId, status: 'ACCEPTED' },
        include: { developer: { select: { userId: true } } },
      });
      if (devProposal) {
        await this.notifications.create({
          userId: devProposal.developer.userId,
          type: 'DISPUTE_OPENED',
          title: 'Disputa abierta',
          body: `La empresa abrió una disputa: "${reason.trim()}"`,
          entityId: contractId,
          entityType: 'contract',
        });
      }
    } else {
      await this.notifications.create({
        userId: contract.project.company.userId,
        type: 'DISPUTE_OPENED',
        title: 'Disputa abierta',
        body: `El developer abrió una disputa: "${reason.trim()}"`,
        entityId: contractId,
        entityType: 'contract',
      });
    }

    // Notify all admins
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
    await Promise.all(
      admins.map((admin) =>
        this.notifications.create({
          userId: admin.id,
          type: 'DISPUTE_OPENED',
          title: 'Nueva disputa',
          body: `Disputa en contrato ${contractId}: "${reason.trim()}"`,
          entityId: contractId,
          entityType: 'contract',
        }),
      ),
    );

    return { success: true };
  }

  async resolveDispute(contractId: string, adminId: string, outcome: 'dev_wins' | 'company_wins' | 'mutual', adminComment?: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { project: { include: { company: true } }, milestones: true },
    });
    if (!contract) throw new NotFoundException('Contrato no encontrado');
    if (contract.status !== 'DISPUTED')
      throw new BadRequestException('El contrato no está en disputa');

    // Store the admin comment on the contract
    await this.prisma.contract.update({
      where: { id: contractId },
      data: { disputeResolvedComment: adminComment ?? null },
    });

    const acceptedProposal = await this.prisma.proposal.findFirst({
      where: { projectId: contract.projectId, status: 'ACCEPTED' },
      include: { developer: true },
    });

    if (outcome === 'dev_wins') {
      // Approve all SUBMITTED milestones
      const submittedMilestones = contract.milestones.filter((m) => m.status === 'SUBMITTED');
      await Promise.all(
        submittedMilestones.map((m) =>
          this.prisma.milestone.update({ where: { id: m.id }, data: { status: 'PAID' } }),
        ),
      );
      // Reload milestones to check completion
      const allMilestones = contract.milestones.map((m) =>
        submittedMilestones.find((s) => s.id === m.id) ? { ...m, status: 'PAID' as const } : m,
      );
      const allPaid = allMilestones.every((m) => m.status === 'PAID');
      await this.prisma.contract.update({
        where: { id: contractId },
        data: { status: allPaid ? 'COMPLETED' : 'ACTIVE' },
      });
      if (allPaid) {
        await this.prisma.project.update({ where: { id: contract.projectId }, data: { status: 'COMPLETED' } });
      }
    } else if (outcome === 'company_wins') {
      await this.prisma.contract.update({ where: { id: contractId }, data: { status: 'CANCELLED' } });
      // Deduct 30 trustPoints from developer and increment disputeLosses
      if (acceptedProposal) {
        const dev = await this.prisma.developer.findUnique({
          where: { id: acceptedProposal.developerId },
        });
        if (dev) {
          await this.prisma.developer.update({
            where: { id: acceptedProposal.developerId },
            data: {
              trustPoints: Math.max(0, dev.trustPoints - 30),
              disputeLosses: { increment: 1 },
            },
          });
        }
      }
    } else {
      // mutual
      await this.prisma.contract.update({ where: { id: contractId }, data: { status: 'CANCELLED' } });
    }

    await this.postEvent(contractId, adminId, `Disputa resuelta: ${outcome === 'dev_wins' ? 'a favor del developer' : outcome === 'company_wins' ? 'a favor de la empresa' : 'cancelación mutua'}`, {
      action: 'DISPUTE_RESOLVED',
      outcome,
    });

    // Notify both parties
    const baseDevBody = outcome === 'dev_wins'
      ? 'La disputa fue resuelta a favor del developer. Los milestones entregados han sido pagados.'
      : outcome === 'company_wins'
      ? 'La disputa fue resuelta a favor de la empresa. El contrato ha sido cancelado.'
      : 'La disputa fue resuelta por cancelación mutua.';

    const devNotifBody = adminComment
      ? `${baseDevBody} Comentario del admin: ${adminComment}`
      : baseDevBody;

    const companyNotifBody = adminComment
      ? `La disputa se resolvió a tu favor. Comentario del admin: ${adminComment}`
      : baseDevBody;

    await this.notifications.create({
      userId: contract.project.company.userId,
      type: 'DISPUTE_RESOLVED',
      title: 'Disputa resuelta',
      body: companyNotifBody,
      entityId: contractId,
      entityType: 'contract',
    });
    if (acceptedProposal) {
      await this.notifications.create({
        userId: acceptedProposal.developer.userId,
        type: 'DISPUTE_RESOLVED',
        title: 'Disputa resuelta',
        body: devNotifBody,
        entityId: contractId,
        entityType: 'contract',
      });
    }

    return { success: true, outcome };
  }

  async proposeMilestonePlan(contractId: string, userId: string, milestones: Array<{ title: string; description?: string; amount: number; order: number }>) {
    const { contract, isCompany } = await this.getContractWithAccess(contractId, userId);
    if (isCompany) throw new ForbiddenException('Solo el developer puede proponer un plan de milestones');
    if (contract.status !== 'ACTIVE') throw new BadRequestException('El contrato debe estar activo');

    const existingMilestones = await this.prisma.milestone.count({ where: { contractId } });
    if (existingMilestones > 0) throw new BadRequestException('El contrato ya tiene milestones definidos');

    const metadata = {
      action: 'PROPOSE_MILESTONE_PLAN',
      proposalStatus: 'PENDING',
      milestones: milestones,
    };
    await this.prisma.contractMessage.create({
      data: {
        contractId,
        senderId: userId,
        content: `Plan propuesto: ${milestones.length} milestones · S/ ${milestones.reduce((s, m) => s + m.amount, 0).toLocaleString()} total`,
        type: 'PROPOSAL',
        metadata,
      },
    });
    const companyUserId = contract.project.company.userId;
    await this.notifications.create({
      userId: companyUserId,
      type: 'PROPOSAL_RECEIVED',
      title: 'Plan de milestones propuesto',
      body: `El developer propuso un plan con ${milestones.length} milestones para tu proyecto`,
      entityId: contractId,
      entityType: 'contract',
    });
    return { ok: true };
  }

  async forceApprove(contractId: string, milestoneId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { project: { include: { company: true } } },
    });
    if (!contract) throw new NotFoundException('Contrato no encontrado');

    // Only the developer of the contract
    const devProposal = await this.prisma.proposal.findFirst({
      where: { projectId: contract.projectId, status: 'ACCEPTED', developer: { userId } },
    });
    if (!devProposal) throw new ForbiddenException('Solo el developer del contrato puede forzar la aprobación');

    const milestone = await this.prisma.milestone.findFirst({ where: { id: milestoneId, contractId } });
    if (!milestone) throw new NotFoundException('Milestone no encontrado');
    if (milestone.status !== 'SUBMITTED')
      throw new BadRequestException('Solo puedes forzar la aprobación de un milestone SUBMITTED');

    if (!milestone.submittedAt)
      throw new BadRequestException('El milestone no tiene fecha de entrega registrada');

    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    if (Date.now() - new Date(milestone.submittedAt).getTime() < sevenDaysMs)
      throw new BadRequestException('El milestone aún está dentro del plazo de respuesta (7 días)');

    const companyUserId = contract.project.company.userId;
    return this.doApproveMilestone(contractId, milestoneId, companyUserId);
  }

  async getDisputedContracts() {
    return this.prisma.contract.findMany({
      where: { status: 'DISPUTED' },
      include: {
        project: { include: { company: { select: { name: true } } } },
        milestones: { select: { status: true, amount: true } },
      },
      orderBy: { updatedAt: 'asc' },
    });
  }

  async createReview(contractId: string, userId: string, rating: number, comment?: string) {
    const { contract, isCompany } = await this.getContractWithAccess(contractId, userId);
    if (contract.status !== 'COMPLETED')
      throw new BadRequestException('Solo puedes calificar contratos completados');
    if (rating < 1 || rating > 5)
      throw new BadRequestException('El rating debe ser entre 1 y 5');

    // Find the other party (reviewed)
    let reviewedUserId: string;
    if (isCompany) {
      const devProposal = await this.prisma.proposal.findFirst({
        where: { projectId: contract.projectId, status: 'ACCEPTED' },
        include: { developer: { select: { userId: true } } },
      });
      if (!devProposal) throw new NotFoundException('Developer no encontrado');
      reviewedUserId = devProposal.developer.userId;
    } else {
      reviewedUserId = contract.project.company.userId;
    }

    const review = await this.prisma.review.create({
      data: { contractId, reviewerId: userId, reviewedId: reviewedUserId, rating, comment },
    });

    // Update stats
    if (isCompany) {
      // Update developer rating and trustPoints
      const dev = await this.prisma.developer.findUnique({ where: { userId: reviewedUserId } });
      if (dev) {
        const allReviews = await this.prisma.review.findMany({
          where: { reviewed: { developer: { userId: reviewedUserId } } },
        });
        const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
        await this.prisma.developer.update({
          where: { userId: reviewedUserId },
          data: {
            rating: Math.round(avg * 10) / 10,
            reviewCount: allReviews.length,
            trustPoints: { increment: rating * 5 },
          },
        });
      }
    } else {
      // Update company clientRating
      const allReviews = await this.prisma.review.findMany({
        where: { reviewed: { company: { userId: reviewedUserId } } },
      });
      const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
      await this.prisma.company.update({
        where: { userId: reviewedUserId },
        data: {
          clientRating: Math.round(avg * 10) / 10,
          clientReviewCount: allReviews.length,
        },
      });
    }

    return review;
  }
}
