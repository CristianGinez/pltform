'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare, Lock } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { useSendMessage } from '@/hooks/use-contracts';
import type { ContractMessage } from '@/types';
import { ChatMessage } from './ChatMessage';

interface ChatTabProps {
  contractId: string;
  messages: ContractMessage[];
  isLoadingMessages: boolean;
  onGoToMilestones?: () => void;
  locked?: boolean;
}

export function ChatTab({ contractId, messages, isLoadingMessages, onGoToMilestones, locked }: ChatTabProps) {
  const { user } = useAuthStore();
  const sendMessage = useSendMessage(contractId);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!text.trim() || sendMessage.isPending || locked) return;
    sendMessage.mutate(text, { onSuccess: () => setText('') });
  };

  return (
    <div className="bg-white rounded-xl border border-gray-100 flex flex-col" style={{ height: '500px' }}>
      <div className="flex flex-col gap-3 p-4 flex-1 overflow-y-auto">
        {isLoadingMessages && [...Array(4)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
            <div className="h-9 w-44 bg-gray-100 rounded-2xl animate-pulse" />
          </div>
        ))}
        {!isLoadingMessages && messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center gap-2 py-12">
            <MessageSquare size={30} className="text-gray-200" />
            <p className="text-sm text-gray-400">No hay mensajes aún.</p>
            <p className="text-xs text-gray-300">Las propuestas y eventos del contrato aparecerán aquí.</p>
          </div>
        )}
        {messages.map((msg) => (
          <ChatMessage key={msg.id} msg={msg} contractId={contractId} currentUserId={user?.id} onGoToMilestones={onGoToMilestones} />
        ))}
        <div ref={bottomRef} />
      </div>
      {locked ? (
        <div className="border-t border-gray-100 p-3 text-center">
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1.5">
            <Lock size={12} />Chat bloqueado — el contrato ya no está activo
          </p>
        </div>
      ) : (
        <div className="border-t border-gray-100 p-3 flex gap-2 items-end bg-white">
          <textarea
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 min-h-10 max-h-24"
            rows={1} placeholder="Escribe un mensaje... (Enter para enviar)"
            value={text} onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          />
          <button
            onClick={handleSend} disabled={!text.trim() || sendMessage.isPending}
            className="shrink-0 p-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 transition-colors cursor-pointer"
          >
            <Send size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
