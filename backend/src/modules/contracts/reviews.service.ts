import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContractAccessService } from './contract-access.service';

@Injectable()
export class ReviewsService {
  constructor(
    private prisma: PrismaService,
    private access: ContractAccessService,
  ) {}

  async createReview(contractId: string, userId: string, rating: number, comment?: string) {
    const { contract, isCompany } = await this.access.getContractWithAccess(contractId, userId);
    if (contract.status !== 'COMPLETED')
      throw new BadRequestException('Solo puedes calificar contratos completados');
    if (rating < 1 || rating > 5)
      throw new BadRequestException('El rating debe ser entre 1 y 5');

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

    if (isCompany) {
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
