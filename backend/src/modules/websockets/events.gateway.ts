import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: [
      'http://localhost:3000',
      /\.vercel\.app$/,
    ],
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  // Map: userId → Set of socket IDs (a user can have multiple tabs open)
  private userSockets = new Map<string, Set<string>>();

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // ─── Connection lifecycle ──────────────────────────────────────────────────

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ??
        client.handshake.headers?.authorization?.replace('Bearer ', '') ??
        (client.handshake.query?.token as string);

      if (!token) {
        client.disconnect();
        return;
      }

      const secret = this.configService.get<string>('jwt.secret');
      const payload = this.jwtService.verify(token, { secret });
      const userId = payload.sub as string;

      (client as Socket & { userId?: string }).userId = userId;

      client.join(`user:${userId}`);

      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(client.id);

    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = (client as Socket & { userId?: string }).userId;
    if (userId) {
      const sockets = this.userSockets.get(userId);
      if (sockets) {
        sockets.delete(client.id);
        if (sockets.size === 0) this.userSockets.delete(userId);
      }
    }
  }

  // ─── Server-to-client emitters ────────────────────────────────────────────

  sendNotification(userId: string, data: { type: string; entityId?: string; entityType?: string }) {
    this.server.to(`user:${userId}`).emit('notification:new', data);
  }

  sendContractMessage(contractId: string, data: { senderId: string }) {
    this.server.to(`contract:${contractId}`).emit('contract:message', data);
  }

  sendContractUpdate(contractId: string, data: { action: string }) {
    this.server.to(`contract:${contractId}`).emit('contract:updated', data);
  }

  // ─── Client-to-server events ──────────────────────────────────────────────

  @SubscribeMessage('contract:join')
  handleJoinContract(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { contractId: string },
  ) {
    if (data?.contractId) {
      client.join(`contract:${data.contractId}`);
    }
  }

  @SubscribeMessage('contract:leave')
  handleLeaveContract(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { contractId: string },
  ) {
    if (data?.contractId) {
      client.leave(`contract:${data.contractId}`);
    }
  }
}
