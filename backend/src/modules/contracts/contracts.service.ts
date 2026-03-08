import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async findById(id: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        milestones: { orderBy: { order: 'asc' } },
        project: {
          include: {
            company: { select: { name: true, userId: true } },
          },
        },
      },
    });
    if (!contract) throw new NotFoundException('Contrato no encontrado');
    return contract;
  }

  async approveMilestone(contractId: string, milestoneId: string, userId: string) {
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

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: 'APPROVED' },
    });

    // Notify the developer
    const acceptedProposal = await this.prisma.proposal.findFirst({
      where: { projectId: contract.projectId, status: 'ACCEPTED' },
      include: { developer: true },
    });
    if (acceptedProposal) {
      await this.notifications.create({
        userId: acceptedProposal.developer.userId,
        type: 'MILESTONE_APPROVED',
        title: 'Milestone aprobado',
        body: `${milestone.title} fue aprobado`,
        entityId: contractId,
        entityType: 'contract',
      });
    }

    return updated;
  }

  async submitMilestone(contractId: string, milestoneId: string, userId: string) {
    const milestone = await this.prisma.milestone.findFirst({
      where: {
        id: milestoneId,
        contractId,
        contract: {
          project: {
            proposals: {
              some: {
                status: 'ACCEPTED',
                developer: { userId },
              },
            },
          },
        },
      },
    });
    if (!milestone) throw new ForbiddenException();

    const updated = await this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: 'SUBMITTED' },
    });

    // Notify the company
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { project: { include: { company: true } } },
    });
    if (contract) {
      await this.notifications.create({
        userId: contract.project.company.userId,
        type: 'MILESTONE_SUBMITTED',
        title: 'Milestone entregado',
        body: `El developer entregó ${milestone.title}`,
        entityId: contractId,
        entityType: 'contract',
      });
    }

    return updated;
  }
}
