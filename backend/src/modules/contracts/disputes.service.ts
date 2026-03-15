import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ContractAccessService } from './contract-access.service';
import { MilestonesService } from './milestones.service';

@Injectable()
export class DisputesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private access: ContractAccessService,
    private milestones: MilestonesService,
  ) {}

  async openDispute(contractId: string, userId: string, reason: string) {
    const { contract, isCompany } = await this.access.getContractWithAccess(contractId, userId);
    if (contract.status !== 'ACTIVE')
      throw new BadRequestException('Solo puedes abrir una disputa en un contrato ACTIVE');
    if (!reason?.trim() || reason.trim().length < 10)
      throw new BadRequestException('El motivo debe tener al menos 10 caracteres');

    await this.prisma.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id: contractId },
        data: { status: 'DISPUTED', disputeReason: reason.trim(), disputeOpenedById: userId },
      });
      await tx.contractMessage.create({
        data: {
          contractId,
          senderId: userId,
          content: `Disputa abierta: "${reason.trim()}"`,
          type: 'EVENT',
          metadata: { action: 'DISPUTE_OPENED', reason: reason.trim() },
        },
      });
    });

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

  async resolveDispute(
    contractId: string,
    adminId: string,
    outcome: 'dev_wins' | 'company_wins' | 'mutual',
    adminComment?: string,
  ) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { project: { include: { company: true } }, milestones: true },
    });
    if (!contract) throw new NotFoundException('Contrato no encontrado');
    if (contract.status !== 'DISPUTED')
      throw new BadRequestException('El contrato no está en disputa');

    const acceptedProposal = await this.prisma.proposal.findFirst({
      where: { projectId: contract.projectId, status: 'ACCEPTED' },
      include: { developer: true },
    });

    await this.prisma.$transaction(async (tx) => {
      await tx.contract.update({
        where: { id: contractId },
        data: { disputeResolvedComment: adminComment ?? null, disputeOutcome: outcome },
      });

      if (outcome === 'dev_wins') {
        const submittedMilestones = contract.milestones.filter((m) => m.status === 'SUBMITTED');
        for (const m of submittedMilestones) {
          await tx.milestone.update({ where: { id: m.id }, data: { status: 'PAID' } });
        }

        const allMilestones = contract.milestones.map((m) =>
          submittedMilestones.find((s) => s.id === m.id) ? { ...m, status: 'PAID' as const } : m,
        );
        const allPaid = allMilestones.every((m) => m.status === 'PAID');

        await tx.contract.update({
          where: { id: contractId },
          data: { status: allPaid ? 'COMPLETED' : 'ACTIVE' },
        });
        if (allPaid) {
          await tx.project.update({ where: { id: contract.projectId }, data: { status: 'COMPLETED' } });
        }
      } else if (outcome === 'company_wins') {
        await tx.contract.update({ where: { id: contractId }, data: { status: 'CANCELLED' } });
        await tx.project.update({ where: { id: contract.projectId }, data: { status: 'CANCELLED' } });

        if (acceptedProposal) {
          const dev = await tx.developer.findUnique({
            where: { id: acceptedProposal.developerId },
          });
          if (dev) {
            await tx.developer.update({
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
        await tx.contract.update({ where: { id: contractId }, data: { status: 'CANCELLED' } });
        await tx.project.update({ where: { id: contract.projectId }, data: { status: 'CANCELLED' } });
      }
    });

    await this.access.postEvent(
      contractId,
      adminId,
      `Disputa resuelta: ${outcome === 'dev_wins' ? 'a favor del developer' : outcome === 'company_wins' ? 'a favor de la empresa' : 'cancelación mutua'}${adminComment ? ` — "${adminComment}"` : ''}`,
      {
        action: 'DISPUTE_RESOLVED',
        outcome,
        adminComment: adminComment ?? null,
      },
    );

    const baseDevBody =
      outcome === 'dev_wins'
        ? 'La disputa fue resuelta a favor del developer. Los milestones entregados han sido pagados.'
        : outcome === 'company_wins'
        ? 'La disputa fue resuelta a favor de la empresa. El contrato ha sido cancelado.'
        : 'La disputa fue resuelta por cancelación mutua.';

    const devNotifBody = adminComment ? `${baseDevBody} Comentario del admin: ${adminComment}` : baseDevBody;
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

  async forceApprove(contractId: string, milestoneId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { project: { include: { company: true } } },
    });
    if (!contract) throw new NotFoundException('Contrato no encontrado');

    const devProposal = await this.prisma.proposal.findFirst({
      where: { projectId: contract.projectId, status: 'ACCEPTED', developer: { userId } },
    });
    if (!devProposal) throw new BadRequestException('Solo el developer del contrato puede forzar la aprobación');

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
    return this.milestones.doApproveMilestone(contractId, milestoneId, companyUserId);
  }
}
