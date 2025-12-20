/**
 * Demo Mode Banner Component
 * 
 * Displays a prominent yellow banner when DEMO_MODE is enabled.
 * Only visible when DEMO_MODE=true.
 */

"use client";

import { DEMO_MODE } from "@/lib/demoMode";

export function DemoModeBanner() {
  if (!DEMO_MODE) return null;

  return (
    <div className="w-full bg-yellow-500 text-black text-center py-2 font-semibold">
      ⚠️ DEMO MODE — No real payments are being processed
    </div>
  );
}

