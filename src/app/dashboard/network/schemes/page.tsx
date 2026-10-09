"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowsClockwise } from "@phosphor-icons/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { EmptyState } from "@/components/dashboard/patterns";

/**
 * Network Schemes page has been deprecated. Schemes are now assigned by admin only.
 * Redirects to the dashboard after a brief message.
 */
export default function NetworkSchemesDeprecated() {
  const router = useRouter();

  useEffect(() => {
    const t = setTimeout(() => router.replace("/dashboard"), 3000);
    return () => clearTimeout(t);
  }, [router]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Network · Notice"
        title="Scheme management has moved"
        description="Schemes are now managed and assigned by admin only. Taking you back to your dashboard."
      />
      <EmptyState
        bordered
        tone="amber"
        icon={ArrowsClockwise}
        title="This workspace has been retired"
        description="Your scheme is assigned directly by admin. Contact your admin if you need scheme changes — you'll be redirected in a moment."
      />
    </div>
  );
}
