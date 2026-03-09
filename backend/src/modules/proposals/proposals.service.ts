import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { CreateProposalDto } from './dto/create-proposal.dto';
import type { Developer, Proposal } from '@prisma/client';

@Injectable()
export class ProposalsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(projectId: string, userId: string, dto: CreateProposalDto) {
    const developer = await this.prisma.developer.findUnique({ where: { userId } });
    if (!developer) throw new ForbiddenException('Solo developers pueden postular');

    const existing = await this.prisma.proposal.findFirst({
      where: { projectId, developerId: developer.id },
    });
    if (existing) throw new ConflictException('Ya enviaste una propuesta para este proyecto');

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { company: true },
    });
    if (!project || project.status !== 'OPEN') {
      throw new ForbiddenException('El proyecto no está disponible para postulaciones');
    }

    const proposal = await this.prisma.proposal.create({
      data: {
        coverLetter: dto.coverLetter,
        budget: dto.budget,
        timeline: dto.timeline,
        projectId,
        developerId: developer.id,
      },
    });

    await this.notifications.create({
      userId: project.company.userId,
      type: 'PROPOSAL_RECEIVED',
      title: 'Nueva propuesta recibida',
      body: `${developer.name} postuló a tu proyecto ${project.title}`,
      entityId: projectId,
      entityType: 'project',
    });

    return proposal;
  }

  async findByDeveloper(userId: string) {
    const developer = await this.prisma.developer.findUnique({ where: { userId } });
    if (!developer) return [];

    return this.prisma.proposal.findMany({
      where: { developerId: developer.id },
      include: {
        project: { include: { company: { select: { name: true, logoUrl: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async accept(id: string, userId: string) {
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: { project: { include: { company: true } }, developer: true },
    });
    if (!proposal) throw new NotFoundException();

    const company = await this.prisma.company.findUnique({ where: { userId } });
    if (proposal.project.companyId !== company?.id) throw new ForbiddenException();

    // Find other pending proposals to notify them of rejection
    const otherProposals = await this.prisma.proposal.findMany({
      where: { projectId: proposal.projectId, id: { not: id }, status: 'PENDING' },
      include: { developer: true },
    });

    // Reject all other proposals for this project
    await this.prisma.proposal.updateMany({
      where: { projectId: proposal.projectId, id: { not: id } },
      data: { status: 'REJECTED' },
    });

    const accepted = await this.prisma.proposal.update({
      where: { id },
      data: { status: 'ACCEPTED' },
    });

    // Move project to IN_PROGRESS
    await this.prisma.project.update({
      where: { id: proposal.projectId },
      data: { status: 'IN_PROGRESS' },
    });

    // Create contract with a default milestone
    const contract = await this.prisma.contract.create({
      data: {
        projectId: proposal.projectId,
        milestones: {
          create: [
            {
              title: 'Entrega completa del proyecto',
              amount: proposal.budget,
              order: 1,
            },
          ],
        },
      },
    });

    // Notify accepted developer → link directly to the new contract
    await this.notifications.create({
      userId: proposal.developer.userId,
      type: 'PROPOSAL_ACCEPTED',
      title: '¡Propuesta aceptada!',
      body: `Tu propuesta para ${proposal.project.title} fue aceptada`,
      entityId: contract.id,
      entityType: 'contract',
    });

    // Notify rejected developers → link to the project so they can see what happened
    await Promise.all(
      otherProposals.map((p: Proposal & { developer: Developer }) =>
        this.notifications.create({
          userId: p.developer.userId,
          type: 'PROPOSAL_REJECTED',
          title: 'Propuesta no seleccionada',
          body: `Tu propuesta para ${proposal.project.title} no fue seleccionada`,
          entityId: proposal.projectId,
          entityType: 'project',
        }),
      ),
    );

    return accepted;
  }

  async withdraw(id: string, userId: string) {
    const developer = await this.prisma.developer.findUnique({ where: { userId } });
    const proposal = await this.prisma.proposal.findUnique({
      where: { id },
      include: { project: { include: { company: true } } },
    });
    if (!proposal || proposal.developerId !== developer?.id) throw new ForbiddenException();
    if (proposal.status !== 'PENDING') {
      throw new ForbiddenException('Solo se pueden retirar propuestas pendientes');
    }

    const result = await this.prisma.proposal.update({
      where: { id },
      data: { status: 'WITHDRAWN' },
    });

    await this.notifications.create({
      userId: proposal.project.company.userId,
      type: 'PROPOSAL_WITHDRAWN',
      title: 'Propuesta retirada',
      body: `${developer.name} retiró su propuesta de ${proposal.project.title}`,
      entityId: proposal.projectId,
      entityType: 'project',
    });

    return result;
  }
}
