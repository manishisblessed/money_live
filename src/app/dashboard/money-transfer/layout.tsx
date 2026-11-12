"use client";

import { ComingSoonOverlay } from "@/components/dashboard/ComingSoonOverlay";

export default function MoneyTransferLayout({ children }: { children: React.ReactNode }) {
  return (
    <ComingSoonOverlay
      title="Domestic Money Transfer — Coming Soon"
      description="IMPS, NEFT & RTGS transfers aren't live yet. We're integrating the DMT rail and it will be available to all retailers very soon."
    >
      {children}
    </ComingSoonOverlay>
  );
}
