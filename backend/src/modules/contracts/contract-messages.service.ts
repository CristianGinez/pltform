import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ContractAccessService } from './contract-access.service';
import { SENDER_SELECT } from './contracts.types';
import { paginate } from '../../common/types/paginated';

@Injectable()
export class ContractMessagesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
    private access: ContractAccessService,
  ) {}

  async getMessages(contractId: string, userId: string, options: { limit?: number; cursor?: string } = {}) {
    await this.access.getContractWithAccess(contractId, userId);
    const { limit = 50, cursor } = options;

    const items = await this.prisma.contractMessage.findMany({
      where: { contractId },
      orderBy: { createdAt: 'asc' },
      take: limit + 1,
      include: { sender: { select: SENDER_SELECT } },
      ...(cursor
        ? { cursor: { id: cursor }, skip: 1 }
        : {}),
    });

    return paginate(items, limit);
  }

  async sendMessage(contractId: string, userId: string, content: string) {
    const { contract, isCompany } = await this.access.getContractWithAccess(contractId, userId);
    if (!content?.trim()) throw new BadRequestException('El mensaje no puede estar vacío');

    const message = await this.prisma.contractMessage.create({
      data: { contractId, senderId: userId, content: content.trim() },
      include: { sender: { select: SENDER_SELECT } },
    });

    // Notify the other party
    const senderName = message.sender.company?.name ?? message.sender.developer?.name ?? 'Alguien';
    const preview = content.trim().length > 80 ? content.trim().slice(0, 80) + '...' : content.trim();

    if (isCompany) {
      const devProposal = await this.prisma.proposal.findFirst({
        where: { projectId: contract.projectId, status: 'ACCEPTED' },
        include: { developer: { select: { userId: true } } },
      });
      if (devProposal) {
        await this.notifications.create({
          userId: devProposal.developer.userId,
          type: 'MESSAGE_RECEIVED',
          title: 'Nuevo mensaje',
          body: `${senderName}: ${preview}`,
          entityId: contractId,
          entityType: 'contract',
        });
      }
    } else {
      await this.notifications.create({
        userId: contract.project.company.userId,
        type: 'MESSAGE_RECEIVED',
        title: 'Nuevo mensaje',
        body: `${senderName}: ${preview}`,
        entityId: contractId,
        entityType: 'contract',
      });
    }

    return message;
  }

  async sendProgressUpdate(contractId: string, milestoneId: string, userId: string, note: string) {
    const { isCompany } = await this.access.getContractWithAccess(contractId, userId);
    if (isCompany) throw new ForbiddenException('Solo el developer puede enviar actualizaciones');

    const milestone = await this.prisma.milestone.findFirst({ where: { id: milestoneId, contractId } });
    if (!milestone) throw new NotFoundException('Milestone no encontrado');
    if (!['IN_PROGRESS', 'REVISION_REQUESTED'].includes(milestone.status))
      throw new BadRequestException('El milestone debe estar en progreso');

    return this.access.postEvent(contractId, userId, note?.trim() || `Actualización en "${milestone.title}"`, {
      action: 'PROGRESS_UPDATE',
      milestoneId,
      milestoneTitle: milestone.title,
    });
  }

  async markReadyForTesting(contractId: string, milestoneId: string, userId: string) {
    const { isCompany } = await this.access.getContractWithAccess(contractId, userId);
    if (isCompany) throw new ForbiddenException('Solo el developer puede marcar listo para testing');

    const milestone = await this.prisma.milestone.findFirst({ where: { id: milestoneId, contractId } });
    if (!milestone) throw new NotFoundException('Milestone no encontrado');
    if (!['IN_PROGRESS', 'REVISION_REQUESTED'].includes(milestone.status))
      throw new BadRequestException('El milestone debe estar en progreso');

    return this.access.postEvent(contractId, userId, `"${milestone.title}" está listo para testing / revisión parcial`, {
      action: 'READY_FOR_TESTING',
      milestoneId,
      milestoneTitle: milestone.title,
    });
  }

  async getMessagesAdmin(contractId: string, options: { limit?: number; cursor?: string } = {}) {
    const contract = await this.prisma.contract.findUnique({ where: { id: contractId } });
    if (!contract) throw new NotFoundException('Contrato no encontrado');
    const { limit = 50, cursor } = options;

    const items = await this.prisma.contractMessage.findMany({
      where: { contractId },
      orderBy: { createdAt: 'asc' },
      take: limit + 1,
      include: { sender: { select: SENDER_SELECT } },
      ...(cursor
        ? { cursor: { id: cursor }, skip: 1 }
        : {}),
    });

    return paginate(items, limit);
  }
}
