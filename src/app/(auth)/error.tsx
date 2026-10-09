"use client";

import { useEffect } from "react";
import { WarningCircle, ArrowCounterClockwise } from "@phosphor-icons/react";
import * as Sentry from "@sentry/nextjs";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/Icon";
import { AuthCard } from "@/components/auth/AuthCard";

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <AuthCard className="text-center">
      <IconTile icon={WarningCircle} tone="coral" size="xl" className="mx-auto rounded-3xl" />
      <p className="mt-6 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500">
        <span className="brand-dot" aria-hidden />
        Something went wrong
      </p>
      <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900">
        We hit a snag
      </h2>
      <p className="mt-2 text-sm leading-relaxed text-ink-500" aria-live="polite">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <Button size="lg" className="mt-6 w-full" onClick={reset}>
        <ArrowCounterClockwise size={16} weight="bold" aria-hidden />
        Try again
      </Button>
    </AuthCard>
  );
}
