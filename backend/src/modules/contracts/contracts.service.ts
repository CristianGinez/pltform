import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

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

    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: 'APPROVED' },
    });
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

    return this.prisma.milestone.update({
      where: { id: milestoneId },
      data: { status: 'SUBMITTED' },
    });
  }
}
