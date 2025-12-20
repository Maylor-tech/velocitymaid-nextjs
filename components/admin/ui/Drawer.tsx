"use client";

import { X } from 'lucide-react';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export default function Drawer({ open, onClose, title, children }: DrawerProps) {
  return (
    <div
      className={`fixed inset-0 z-50 transition ${
        open ? 'pointer-events-auto' : 'pointer-events-none'
      }`}
    >
      {/* BACKDROP */}
      <div
        className={`absolute inset-0 bg-black/30 transition-opacity ${
          open ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={onClose}
      />

      {/* PANEL */}
      <div
        className={`absolute right-0 top-0 h-full w-[420px] bg-white shadow-xl transform transition-transform ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 border-b flex justify-between items-center bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            aria-label="Close drawer"
          >
            <X className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        <div className="overflow-y-auto h-[calc(100vh-73px)]">{children}</div>
      </div>
    </div>
  );
}

