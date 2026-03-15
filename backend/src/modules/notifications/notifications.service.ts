import { Injectable } from '@nestjs/common';
import { NotificationType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { paginate } from '../../common/types/paginated';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    entityId?: string;
    entityType?: string;
  }) {
    return this.prisma.notification.create({ data });
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
