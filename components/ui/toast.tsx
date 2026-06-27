"use client";

import React from 'react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  visible: boolean;
  onClose: () => void;
}

export default function Toast({ message, type = 'info', visible, onClose }: ToastProps) {
  if (!visible) return null;

  // DS Toast: navy surface with a left accent bar colored by type.
  const accent = {
    success: 'border-vm-success',
    error: 'border-vm-danger',
    warning: 'border-vm-warning',
    info: 'border-vm-cyan',
  }[type];

  return (
    <div className={`fixed top-4 right-4 bg-vm-navy text-white border-l-4 ${accent} px-6 py-3 rounded-lg shadow-lg z-50`}>
      <div className="flex items-center justify-between">
        <span>{message}</span>
        <button onClick={onClose} className="ml-4 text-white hover:text-vm-muted">
          ×
        </button>
      </div>
    </div>
  );
}



