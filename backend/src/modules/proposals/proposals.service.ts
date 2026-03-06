import {
  Injectable,
  ForbiddenException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProposalDto } from './dto/create-proposal.dto';

@Injectable()
export class ProposalsService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, userId: string, dto: CreateProposalDto) {
    const developer = await this.prisma.developer.findUnique({ where: { userId } });
    if (!developer) throw new ForbiddenException('Solo developers pueden postular');

    const existing = await this.prisma.proposal.findFirst({
      where: { projectId, developerId: developer.id },
    });
    if (existing) throw new ConflictException('Ya enviaste una propuesta para este proyecto');

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project || project.status !== 'OPEN') {
      throw new ForbiddenException('El proyecto no está disponible para postulaciones');
    }

    return this.prisma.proposal.create({
      data: {
        coverLetter: dto.coverLetter,
        budget: dto.budget,
        timeline: dto.timeline,
        projectId,
        developerId: developer.id,
      },
    });
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
      include: { project: { include: { company: true } } },
    });
    if (!proposal) throw new NotFoundException();

    const company = await this.prisma.company.findUnique({ where: { userId } });
    if (proposal.project.companyId !== company?.id) throw new ForbiddenException();

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
    await this.prisma.contract.create({
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

    return accepted;
  }

  async withdraw(id: string, userId: string) {
    const developer = await this.prisma.developer.findUnique({ where: { userId } });
    const proposal = await this.prisma.proposal.findUnique({ where: { id } });
    if (!proposal || proposal.developerId !== developer?.id) throw new ForbiddenException();
    if (proposal.status !== 'PENDING') {
      throw new ForbiddenException('Solo se pueden retirar propuestas pendientes');
    }

    return this.prisma.proposal.update({
      where: { id },
      data: { status: 'WITHDRAWN' },
    });
  }
}
