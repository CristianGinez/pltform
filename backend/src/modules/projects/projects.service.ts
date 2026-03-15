import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ProjectStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { paginate } from '../../common/types/paginated';

@Injectable()
export class ProjectsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateProjectDto) {
    const company = await this.prisma.company.findUnique({ where: { userId } });
    if (!company) throw new ForbiddenException('Solo empresas pueden crear proyectos');

    return this.prisma.project.create({
      data: {
        ...dto,
        budget: dto.budget,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        skills: dto.skills ?? [],
        companyId: company.id,
        status: 'DRAFT',
      },
    });
  }

  async findAll(
    status: ProjectStatus = 'OPEN',
    options: { limit?: number; cursor?: string; search?: string } = {},
  ) {
    const { limit = 20, cursor, search } = options;

    const where: Record<string, unknown> = { status };
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const items = await this.prisma.project.findMany({
      where,
      include: {
        company: { select: { id: true, name: true, logoUrl: true, verified: true, location: true, clientRating: true, clientReviewCount: true } },
        _count: { select: { proposals: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor
        ? { cursor: { id: cursor }, skip: 1 }
        : {}),
    });

    return paginate(items, limit);
  }

  async findById(id: string) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        company: true,
        proposals: {
          include: { developer: { include: { user: { select: { id: true } } } } },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { proposals: true } },
      },
    });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    return project;
  }

  async findByCompany(userId: string) {
    const company = await this.prisma.company.findUnique({ where: { userId } });
    if (!company) return [];

    return this.prisma.project.findMany({
      where: { companyId: company.id },
      include: {
        _count: { select: { proposals: true } },
        contract: {
          select: {
            id: true,
            status: true,
            milestones: { orderBy: { order: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async update(id: string, userId: string, dto: UpdateProjectDto) {
    const project = await this.findById(id);
    const company = await this.prisma.company.findUnique({ where: { userId } });
    if (project.companyId !== company?.id) throw new ForbiddenException();
    if (project.status !== 'DRAFT') throw new BadRequestException('Solo se pueden editar proyectos en borrador');

    return this.prisma.project.update({
      where: { id },
      data: {
        ...dto,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
      },
    });
  }

  async publish(id: string, userId: string) {
    const project = await this.findById(id);
    const company = await this.prisma.company.findUnique({ where: { userId } });
    if (project.companyId !== company?.id) throw new ForbiddenException();

    return this.prisma.project.update({
      where: { id },
      data: { status: 'OPEN' },
    });
  }

  async cancel(id: string, userId: string) {
    const project = await this.findById(id);
    const company = await this.prisma.company.findUnique({ where: { userId } });
    if (project.companyId !== company?.id) throw new ForbiddenException();

    return this.prisma.project.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
  }

  async republish(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id }, include: { company: true } });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    if (project.company.userId !== userId) throw new ForbiddenException();
    if (project.status !== 'CANCELLED') throw new BadRequestException('Solo se pueden republicar proyectos cancelados');
    return this.prisma.project.update({
      where: { id },
      data: { status: 'OPEN' },
    });
  }

  async revertToDraft(id: string, userId: string) {
    const project = await this.prisma.project.findUnique({ where: { id }, include: { company: true } });
    if (!project) throw new NotFoundException('Proyecto no encontrado');
    if (project.company.userId !== userId) throw new ForbiddenException();
    if (!['CANCELLED', 'OPEN'].includes(project.status)) throw new BadRequestException('No se puede convertir este proyecto a borrador');
    return this.prisma.project.update({
      where: { id },
      data: { status: 'DRAFT' },
    });
  }
}
