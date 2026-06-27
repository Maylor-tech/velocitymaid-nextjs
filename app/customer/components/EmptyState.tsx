'use client';

import { Calendar, History, Inbox } from 'lucide-react';

interface EmptyStateProps {
  type: 'upcoming' | 'history' | 'general';
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ type, message, actionLabel, onAction }: EmptyStateProps) {
  const getIcon = () => {
    switch (type) {
      case 'upcoming':
        return <Calendar className="w-12 h-12 text-vm-muted" />;
      case 'history':
        return <History className="w-12 h-12 text-vm-muted" />;
      default:
        return <Inbox className="w-12 h-12 text-vm-muted" />;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'upcoming':
        return "You don't have any upcoming bookings";
      case 'history':
        return "You don't have any booking history yet";
      default:
        return 'No items found';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-12 text-center">
      {getIcon()}
      <p className="mt-4 text-vm-muted font-medium">{message || getDefaultMessage()}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-6 px-6 py-2 bg-vm-navy text-white rounded-lg hover:bg-vm-navy transition-colors font-medium"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}




