import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.company.findMany({
      where: { verified: true },
      select: { id: true, name: true, industry: true, logoUrl: true, location: true },
    });
  }

  findById(id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        projects: { where: { status: 'OPEN' }, orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async updateMyProfile(userId: string, dto: UpdateCompanyDto) {
    const company = await this.prisma.company.findUnique({ where: { userId } });
    if (!company) throw new NotFoundException('Company not found');
    return this.prisma.company.update({ where: { userId }, data: dto });
  }
}
