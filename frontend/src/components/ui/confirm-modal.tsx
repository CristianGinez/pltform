'use client';

import { motion } from 'framer-motion';
import type { ReactNode } from 'react';

interface ConfirmModalProps {
  title: string;
  message: ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  icon?: ReactNode;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

const VARIANT_STYLES = {
  danger:  'bg-red-600 hover:bg-red-700',
  warning: 'bg-orange-500 hover:bg-orange-600',
  primary: 'bg-primary-600 hover:bg-primary-700',
};

export function ConfirmModal({
  title,
  message,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  variant = 'danger',
  icon,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center"
      >
        {icon && <div className="mb-3 flex justify-center">{icon}</div>}
        <h3 className="font-semibold text-gray-900 text-base mb-1">{title}</h3>
        <div className="text-sm text-gray-500 mb-5">{message}</div>
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 py-2.5 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 text-sm font-semibold text-white rounded-xl transition-colors cursor-pointer disabled:opacity-50 ${VARIANT_STYLES[variant]}`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-1.5">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando...
              </span>
            ) : confirmText}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
