import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/types/paginated';
import { EventsGateway } from '../websockets/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private events: EventsGateway,
  ) {}

  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    entityId?: string;
    entityType?: string;
  }) {
    const notification = await this.prisma.notification.create({ data });

    this.events.sendNotification(data.userId, {
      type: data.type,
      entityId: data.entityId,
      entityType: data.entityType,
    });

    return notification;
  }

  async findForUser(userId: string, options: { limit?: number; cursor?: string } = {}) {
    const { limit = 30, cursor } = options;

    const items = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      ...(cursor
        ? { cursor: { id: cursor }, skip: 1 }
        : {}),
    });

    return paginate(items, limit);
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    return this.prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
  }

  async findAll(options: { limit?: number; cursor?: string } = {}) {
    const { limit = 50, cursor } = options;

    const items = await this.prisma.notification.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit + 1,
      include: { user: { select: { email: true, role: true } } },
      ...(cursor
        ? { cursor: { id: cursor }, skip: 1 }
        : {}),
    });

    return paginate(items, limit);
  }
}
