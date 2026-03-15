import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '@prisma/client';

interface NotifyPayload {
  type: NotificationType;
  title: string;
  body: string;
  entityId?: string;
  entityType?: string;
}

/**
 * Helper to send notifications to one or both parties of a contract.
 * Eliminates the repeated pattern of:
 *   1. Finding the accepted developer for the contract
 *   2. Finding the company userId
 *   3. Sending notifications to one or both
 */
export class ContractNotifyHelper {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  /**
   * Find the accepted developer's userId for a contract's project.
   * Returns null if no accepted developer (shouldn't happen for active contracts).
   */
  async getAcceptedDevUserId(projectId: string): Promise<string | null> {
    const proposal = await this.prisma.proposal.findFirst({
      where: { projectId, status: 'ACCEPTED' },
      include: { developer: { select: { userId: true } } },
    });
    return proposal?.developer.userId ?? null;
  }

  /**
   * Notify a specific user.
   */
  async notifyUser(userId: string, payload: NotifyPayload): Promise<void> {
    await this.notifications.create({ userId, ...payload });
  }

  /**
   * Notify the "other party" of a contract.
   * If the caller is the company, notifies the developer; if the caller is the developer,
   * notifies the company.
   */
  async notifyOtherParty(
    contractProjectId: string,
    companyUserId: string,
    callerIsCompany: boolean,
    payload: NotifyPayload,
  ): Promise<void> {
    if (callerIsCompany) {
      const devUserId = await this.getAcceptedDevUserId(contractProjectId);
      if (devUserId) await this.notifyUser(devUserId, payload);
    } else {
      await this.notifyUser(companyUserId, payload);
    }
  }

  /**
   * Notify both parties of a contract.
   */
  async notifyBothParties(
    contractProjectId: string,
    companyUserId: string,
    payload: NotifyPayload,
  ): Promise<void> {
    await this.notifyUser(companyUserId, payload);
    const devUserId = await this.getAcceptedDevUserId(contractProjectId);
    if (devUserId) await this.notifyUser(devUserId, payload);
  }

  /**
   * Notify all admin users.
   */
  async notifyAdmins(payload: NotifyPayload): Promise<void> {
    const admins = await this.prisma.user.findMany({ where: { role: 'ADMIN' } });
    await Promise.all(admins.map((admin) => this.notifyUser(admin.id, payload)));
  }
}
