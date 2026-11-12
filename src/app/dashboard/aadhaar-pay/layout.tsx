"use client";

import { ComingSoonOverlay } from "@/components/dashboard/ComingSoonOverlay";

export default function AadhaarPayLayout({ children }: { children: React.ReactNode }) {
  return (
    <ComingSoonOverlay
      title="Aadhaar Pay (AePS) — Coming Soon"
      description="Cash withdrawal, balance enquiry & mini statement via Aadhaar + fingerprint aren't live yet. We're integrating the AePS rail and it will be available soon."
    >
      {children}
    </ComingSoonOverlay>
  );
}
