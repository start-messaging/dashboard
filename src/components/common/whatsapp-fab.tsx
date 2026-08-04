import { MessageCircle } from 'lucide-react';
import { SUPPORT } from '@/lib/constants';

export function WhatsAppFab() {
  return (
    <a
      href={SUPPORT.whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contact Support on WhatsApp"
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-all duration-300 hover:bg-[#20BD5A] hover:scale-110 focus:outline-none focus:ring-4 focus:ring-[#25D366]/40"
    >
      <MessageCircle className="h-7 w-7" />
    </a>
  );
}
