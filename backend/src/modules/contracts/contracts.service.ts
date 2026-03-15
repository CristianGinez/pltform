import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ContractAccessService } from './contract-access.service';
import { MilestonesService } from './milestones.service';
import { NegotiationService } from './negotiation.service';
import { ContractMessagesService } from './contract-messages.service';
import { DisputesService } from './disputes.service';
import { ReviewsService } from './reviews.service';
import { ProposalAction } from './contracts.types';

@Injectable()
export class ContractsService {
  constructor(
    private prisma: PrismaService,
    private access: ContractAccessService,
    private milestonesService: MilestonesService,
    private negotiation: NegotiationService,
    private messages: ContractMessagesService,
    private disputes: DisputesService,
    private reviews: ReviewsService,
  ) {}

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

  // ─── Milestones ───────────────────────────────────────────────────────────

  async startMilestone(contractId: string, milestoneId: string, userId: string) {
    return this.milestonesService.startMilestone(contractId, milestoneId, userId);
  }

  async submitMilestone(contractId: string, milestoneId: string, userId: string, dto: { deliveryNote?: string; deliveryLink?: string }) {
    return this.milestonesService.submitMilestone(contractId, milestoneId, userId, dto);
  }

  async requestRevision(contractId: string, milestoneId: string, userId: string, dto: { reason?: string }) {
    return this.milestonesService.requestRevision(contractId, milestoneId, userId, dto);
  }

  async approveMilestone(contractId: string, milestoneId: string, userId: string) {
    return this.milestonesService.approveMilestone(contractId, milestoneId, userId);
  }

  // ─── Negotiation ──────────────────────────────────────────────────────────

  async proposeAction(
    contractId: string,
    milestoneId: string | undefined,
    userId: string,
    dto: { action: ProposalAction; deliveryNote?: string; deliveryLink?: string; reason?: string },
  ) {
    return this.negotiation.proposeAction(contractId, milestoneId, userId, dto);
  }

  async respondToProposal(
    contractId: string,
    messageId: string,
    userId: string,
    dto: { response: 'accept' | 'reject' | 'counter'; counter?: string },
  ) {
    return this.negotiation.respondToProposal(contractId, messageId, userId, dto);
  }

  async proposeMilestonePlan(
    contractId: string,
    userId: string,
    milestones: Array<{ title: string; description?: string; amount: number; order: number }>,
  ) {
    return this.negotiation.proposeMilestonePlan(contractId, userId, milestones);
  }

  // ─── Messages ─────────────────────────────────────────────────────────────

  async getMessages(contractId: string, userId: string) {
    return this.messages.getMessages(contractId, userId);
  }

  async sendMessage(contractId: string, userId: string, content: string) {
    return this.messages.sendMessage(contractId, userId, content);
  }

  async sendProgressUpdate(contractId: string, milestoneId: string, userId: string, note: string) {
    return this.messages.sendProgressUpdate(contractId, milestoneId, userId, note);
  }

  async markReadyForTesting(contractId: string, milestoneId: string, userId: string) {
    return this.messages.markReadyForTesting(contractId, milestoneId, userId);
  }

  async getMessagesAdmin(contractId: string) {
    return this.messages.getMessagesAdmin(contractId);
  }

  // ─── Disputes ─────────────────────────────────────────────────────────────

  async openDispute(contractId: string, userId: string, reason: string) {
    return this.disputes.openDispute(contractId, userId, reason);
  }

  async resolveDispute(contractId: string, adminId: string, outcome: 'dev_wins' | 'company_wins' | 'mutual', adminComment?: string) {
    return this.disputes.resolveDispute(contractId, adminId, outcome, adminComment);
  }

  async getDisputedContracts() {
    return this.disputes.getDisputedContracts();
  }

  async forceApprove(contractId: string, milestoneId: string, userId: string) {
    return this.disputes.forceApprove(contractId, milestoneId, userId);
  }

  // ─── Reviews ──────────────────────────────────────────────────────────────

  async createReview(contractId: string, userId: string, rating: number, comment?: string) {
    return this.reviews.createReview(contractId, userId, rating, comment);
  }
}
