'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { trackEvent } from "@/lib/analytics/trackEvent";

/** NJ market: WhatsApp temporarily unavailable — hide widget on these paths */
const NJ_WHATSAPP_HIDDEN_PREFIXES = [
  '/new-jersey',
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
    trackEvent('whatsapp_clicked', {
      location: 'whatsapp_button_component',
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
        <div className="absolute bottom-full mb-2 right-0 bg-vm-navy text-white px-3 py-2 rounded-lg text-sm whitespace-nowrap animate-fadeIn">
          <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-vm-navy"></div>
          Chat with us on WhatsApp!
        </div>
      )}

      {/* WhatsApp Button */}
      <button
        onClick={handleClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className="bg-vm-cyan hover:bg-vm-cyan-dark text-vm-navy p-4 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 group"
        aria-label="Chat on WhatsApp"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6" aria-hidden="true" fill="currentColor">
          <path d="M20.5 3.5A11 11 0 0 0 2.1 17.2L1 23l6-1.6A11 11 0 0 0 20.5 3.5Zm-8.5 17a9.1 9.1 0 0 1-4.6-1.3l-.3-.2-3.6.9.9-3.5-.2-.3A9.1 9.1 0 1 1 12 20.5Zm5-6.8c-.3-.1-1.6-.8-1.8-.9s-.4-.1-.6.1-.7.9-.8 1-.3.2-.6.1a7.4 7.4 0 0 1-2.2-1.4 8.2 8.2 0 0 1-1.5-1.9c-.2-.3 0-.4.1-.6l.4-.5.2-.3a.5.5 0 0 0 0-.5c0-.1-.6-1.4-.8-1.9s-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.8 12 12 0 0 0 4.5 4 15 15 0 0 0 1.5.6 3.6 3.6 0 0 0 1.7.1 2.7 2.7 0 0 0 1.8-1.3 2.2 2.2 0 0 0 .2-1.3c-.1-.1-.3-.2-.6-.3Z" />
        </svg>
        <div className="absolute inset-0 rounded-full bg-vm-cyan animate-ping opacity-20"></div>
      </button>
    </div>
  );
}



