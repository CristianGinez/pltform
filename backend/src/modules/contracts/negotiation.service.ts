import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ContractAccessService } from './contract-access.service';
import { MilestonesService } from './milestones.service';
import { EventsGateway } from '../websockets/events.gateway';
import { SENDER_SELECT, ProposalAction, ProposalStatus, ProposalMetadata } from './contracts.types';

@Injectable()
export class NegotiationService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private access: ContractAccessService,
    private milestones: MilestonesService,
    private events: EventsGateway,
  ) {}

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
    const { contract, isCompany } = await this.access.getContractWithAccess(contractId, userId);

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

      this.events.sendContractMessage(contractId, { senderId: userId });

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

    this.events.sendContractMessage(contractId, { senderId: userId });

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

    const meta = message.metadata as unknown as ProposalMetadata;

    if (meta.proposalStatus !== 'PENDING')
      throw new BadRequestException('Esta propuesta ya fue respondida');

    const { contract, isCompany } = await this.access.getContractWithAccess(contractId, userId);

    // Validate who responds to what
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
      switch (meta.action) {
        case 'PROPOSE_START':
          await this.milestones.doStartMilestone(contractId, meta.milestoneId, message.senderId);
          break;
        case 'PROPOSE_SUBMIT':
          await this.milestones.doSubmitMilestone(contractId, meta.milestoneId, message.senderId, {
            deliveryNote: meta.deliveryNote,
            deliveryLink: meta.deliveryLink,
          });
          break;
        case 'PROPOSE_REVISION':
          await this.milestones.doRequestRevision(contractId, meta.milestoneId, message.senderId, meta.reason);
          break;
        case 'PROPOSE_APPROVE':
          await this.milestones.doApproveMilestone(contractId, meta.milestoneId, message.senderId);
          break;
        case 'PROPOSE_CANCEL': {
          await this.prisma.$transaction(async (tx) => {
            await tx.contract.update({ where: { id: contractId }, data: { status: 'CANCELLED' } });
            await tx.project.update({ where: { id: contract.projectId }, data: { status: 'CANCELLED' } });
          });

          await this.access.postEvent(contractId, userId, 'Contrato cancelado por acuerdo mutuo', {
            action: 'CONTRACT_CANCELLED_MUTUAL',
          });
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
            await this.prisma.$transaction(async (tx) => {
              await tx.milestone.createMany({
                data: meta.milestones!.map((m: { title: string; description?: string; amount: number; order: number }) => ({
                  contractId,
                  title: m.title,
                  description: m.description,
                  amount: m.amount,
                  order: m.order,
                  status: 'PENDING',
                })),
              });
              await tx.contractMessage.update({
                where: { id: messageId },
                data: { metadata: { ...meta, proposalStatus: 'ACCEPTED' } },
              });
            });
            return { ok: true };
          }
          break;
        }
      }

      // Signal contract state change to all room members
      this.events.sendContractUpdate(contractId, { action: meta.action });

    } else if (dto.counter) {
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

  async proposeMilestonePlan(
    contractId: string,
    userId: string,
    milestones: Array<{ title: string; description?: string; amount: number; order: number }>,
  ) {
    const { contract, isCompany } = await this.access.getContractWithAccess(contractId, userId);
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
}
