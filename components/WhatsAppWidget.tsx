'use client';

import { useState, useEffect } from 'react';
import { MessageCircle, X, Clock, Phone } from 'lucide-react';

interface WhatsAppWidgetProps {
  phoneNumber: string;
  businessName?: string;
  greeting?: string;
  showBusinessHours?: boolean;
  position?: 'left' | 'right';
  className?: string;
}

export default function WhatsAppWidget({
  phoneNumber,
  businessName = "VelocityMaid",
  greeting = "Hi there! 👋\nHow can we help?",
  showBusinessHours = true,
  position = 'right',
  className = ''
}: WhatsAppWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 3000);
    return () => clearTimeout(timer);
  }, []);

  const handleSendMessage = () => {
    const encodedMessage = encodeURIComponent(message || greeting);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
    setIsOpen(false);
    setMessage('');
  };

  const businessHours = "Mon-Fri: 8AM-6PM\nSat: 9AM-4PM\nSun: Closed";

  if (!isVisible) return null;

  return (
    <div className={`fixed ${position}-6 bottom-6 z-50 ${className}`}>
      {isOpen && (
        <div className="absolute bottom-full mb-4 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-vm-border animate-slideInUp">
          <div className="bg-vm-navy text-white p-4 rounded-t-2xl border-b-2 border-vm-cyan">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-vm-cyan/20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-vm-cyan" />
                </div>
                <div>
                  <h3 className="font-semibold">{businessName}</h3>
                  <p className="text-vm-white/70 text-sm">Online now</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-vm-muted transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-4">
            <div className="bg-vm-surface rounded-lg p-3 mb-4">
              <p className="text-vm-text text-sm whitespace-pre-line">{greeting}</p>
            </div>

            {showBusinessHours && (
              <div className="mb-4 p-3 bg-vm-surface rounded-lg border border-vm-border">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-vm-cyan" />
                  <span className="text-vm-navy font-semibold text-sm">Business Hours</span>
                </div>
                <p className="text-vm-muted text-xs whitespace-pre-line">{businessHours}</p>
              </div>
            )}

            <div className="space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full p-3 border border-vm-border rounded-lg resize-none focus:ring-2 focus:ring-vm-cyan focus:border-vm-cyan"
                rows={3}
              />
              
              <button
                onClick={handleSendMessage}
                className="w-full bg-vm-cyan hover:bg-vm-cyan-dark text-vm-navy py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative bg-vm-navy hover:bg-vm-navy/90 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group border-2 border-vm-cyan/40"
        aria-label="Open WhatsApp chat"
      >
        <MessageCircle className="w-6 h-6 text-vm-cyan" />
        <div className="absolute inset-0 rounded-full bg-vm-cyan animate-ping opacity-20"></div>
      </button>
    </div>
  );
}
