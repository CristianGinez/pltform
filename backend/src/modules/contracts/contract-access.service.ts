import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../websockets/events.gateway';

@Injectable()
export class ContractAccessService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async postEvent(contractId: string, senderId: string, content: string, metadata: object) {
    const msg = await this.prisma.contractMessage.create({
      data: { contractId, senderId, content, type: 'EVENT', metadata },
    });

    this.events.sendContractMessage(contractId, { senderId });
    this.events.sendContractUpdate(contractId, { action: (metadata as Record<string, unknown>).action as string ?? 'EVENT' });

    return msg;
  }

  async getContractWithAccess(contractId: string, userId: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id: contractId },
      include: { project: { include: { company: true } } },
    });
    if (!contract) throw new NotFoundException();

    const isCompany = contract.project.company.userId === userId;
    const devProposal = await this.prisma.proposal.findFirst({
      where: { projectId: contract.projectId, status: 'ACCEPTED', developer: { userId } },
    });
    if (!isCompany && !devProposal) throw new ForbiddenException();
    return { contract, isCompany, devProposal };
  }
}
