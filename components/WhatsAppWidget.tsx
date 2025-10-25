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
    // Show widget after a short delay
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
      {/* Chat Widget */}
      {isOpen && (
        <div className="absolute bottom-full mb-4 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 animate-slideInUp">
          {/* Header */}
          <div className="bg-green-500 text-white p-4 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">{businessName}</h3>
                  <p className="text-green-100 text-sm">Online now</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Chat Body */}
          <div className="p-4">
            <div className="bg-gray-100 rounded-lg p-3 mb-4">
              <p className="text-gray-700 text-sm whitespace-pre-line">{greeting}</p>
            </div>

            {showBusinessHours && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span className="text-blue-800 font-semibold text-sm">Business Hours</span>
                </div>
                <p className="text-blue-700 text-xs whitespace-pre-line">{businessHours}</p>
              </div>
            )}

            <div className="space-y-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                rows={3}
              />
              
              <button
                onClick={handleSendMessage}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Send on WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
        aria-label="Open WhatsApp chat"
      >
        <MessageCircle className="w-6 h-6" />
        
        {/* Pulse animation */}
        <div className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-20"></div>
      </button>
    </div>
  );
}
