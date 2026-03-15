import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '@/store/auth.store';

const SOCKET_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api').replace('/api', '');

let globalSocket: Socket | null = null;

function getSocket(token: string): Socket {
  if (globalSocket?.connected) return globalSocket;

  globalSocket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: Infinity,
  });

  return globalSocket;
}

/**
 * Connect to the WebSocket server and listen for notification/contract events.
 * Call once in the dashboard layout — invalidates React Query caches on events.
 */
export function useRealtimeEvents() {
  const token = useAuthStore((s) => s.token);
  const queryClient = useQueryClient();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!token) return;

    const socket = getSocket(token);
    socketRef.current = socket;

    const onNotification = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      queryClient.invalidateQueries({ queryKey: ['notifications-admin'] });
    };

    const onContractMessage = () => {
      queryClient.invalidateQueries({ queryKey: ['contract-messages'] });
    };

    const onContractUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['contract'] });
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
      queryClient.invalidateQueries({ queryKey: ['my-proposals'] });
    };

    socket.on('notification:new', onNotification);
    socket.on('contract:message', onContractMessage);
    socket.on('contract:updated', onContractUpdate);

    return () => {
      socket.off('notification:new', onNotification);
      socket.off('contract:message', onContractMessage);
      socket.off('contract:updated', onContractUpdate);
    };
  }, [token, queryClient]);

  return socketRef;
}

/**
 * Join/leave the contract room for real-time messages.
 * Call in the ContractDetailPage component.
 */
export function useContractRoom(contractId: string | undefined) {
  const token = useAuthStore((s) => s.token);

  useEffect(() => {
    if (!token || !contractId) return;

    const socket = getSocket(token);

    socket.emit('contract:join', { contractId });

    return () => {
      socket.emit('contract:leave', { contractId });
    };
  }, [token, contractId]);
}

/**
 * Disconnect the global socket. Call on logout.
 */
export function disconnectSocket() {
  if (globalSocket) {
    globalSocket.disconnect();
    globalSocket = null;
  }
}
