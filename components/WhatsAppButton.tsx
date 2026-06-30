'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { MessageCircle, X } from 'lucide-react';
import { sendGAEvent } from '@next/third-parties/google';

/** NJ market: WhatsApp temporarily unavailable — hide widget on these paths */
const NJ_WHATSAPP_HIDDEN_PREFIXES = [
  '/locations/new-jersey',
  '/lead/new-jersey',
  '/review-us/new-jersey',
];

interface WhatsAppButtonProps {
  phoneNumber: string;
  message?: string;
  position?: 'left' | 'right';
  showPopup?: boolean;
  className?: string;
}

export default function WhatsAppButton({
  phoneNumber,
  message = "Hi! I'd like to book a cleaning service.",
  position = 'right',
  showPopup = true,
  className = ''
}: WhatsAppButtonProps) {
  const pathname = usePathname();
  const [isVisible, setIsVisible] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  const hiddenForNj =
    pathname != null &&
    NJ_WHATSAPP_HIDDEN_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  const isAdmin = pathname != null && pathname.startsWith('/admin');
  const isMapPage = pathname === '/admin/map';

  useEffect(() => {
    // Show button after a short delay for better UX
    const timer = setTimeout(() => setIsVisible(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleClick = () => {
    // Track WhatsApp click event
    sendGAEvent('event', 'whatsapp_clicked', {
      location: 'whatsapp_button_component'
    });
    
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  if (hiddenForNj || isAdmin || isMapPage || !isVisible) return null;

  const horizontalPosition =
    position === 'left'
      ? 'left-4 sm:left-6'
      : 'right-4 sm:right-6';

  return (
    <div
      className={`fixed bottom-20 sm:bottom-6 ${horizontalPosition} z-50 ${className}`}
    >
      {/* Tooltip */}
      {showPopup && showTooltip && (
        <div className="absolute bottom-full mb-2 right-0 bg-gray-900 text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap animate-fadeIn">
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          Chat with us on WhatsApp!
        </div>
      )}

      {/* WhatsApp Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="bg-vm-success hover:bg-vm-success text-white p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
        aria-label="Chat on WhatsApp"
      >
        <MessageCircle className="w-6 h-6" />
        
        {/* Pulse animation */}
        <div className="absolute inset-0 rounded-full bg-vm-success animate-ping opacity-20"></div>
      </button>
    </div>
  );
}



