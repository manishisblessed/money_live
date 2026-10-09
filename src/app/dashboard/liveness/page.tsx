"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ShieldCheck, Loader2, ArrowRight, ScanFace } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/Icon";
import { Notice } from "@/components/dashboard/services/ServiceLayout";
import { LivenessVideoCapture } from "@/components/kyc/LivenessVideoCapture";
import { InAppBrowserWarning } from "@/components/kyc/InAppBrowserWarning";

type Status = {
  isNetworkTier: boolean;
  hasLivenessVideo: boolean;
  status: "UPLOADED" | "BASELINE_READY" | "FAILED" | null;
  required: boolean;
};

type Step = "loading" | "verified" | "capture" | "done";

export default function LivenessPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [step, setStep] = useState<Step>("loading");

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/kyc/video/status");
      const data: Status = await res.json();
      setStatus(data);
      if (!data.isNetworkTier) {
        router.replace("/dashboard");
        return;
      }
      setStep(data.required ? "capture" : "verified");
    } catch {
      setStep("capture");
    }
  }, [router]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Security"
        title="One-time liveness verification"
        description="Record a quick 10-second video so we can confirm it's really you. This sets up your secure face baseline and unlocks transactions on your account."
      />

      <div className="mx-auto w-full max-w-lg">
        {step === "loading" && (
          <div className="flex flex-col items-center gap-3 rounded-3xl bg-white p-10 text-center shadow-soft ring-1 ring-ink-100">
            <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
            <p className="text-sm text-ink-500">Checking your status…</p>
          </div>
        )}

        {step === "verified" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 rounded-3xl bg-white p-7 text-center shadow-sm ring-1 ring-accent-100"
          >
            <IconTile tone="accent" size="xl" className="mx-auto">
              <ShieldCheck className="h-7 w-7" />
            </IconTile>
            <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900">You&apos;re all set</h2>
            <p className="text-sm text-ink-500">
              {status?.status === "UPLOADED"
                ? "Your liveness video is uploaded and your face baseline is being prepared."
                : "Your liveness video and face baseline are in place."}
            </p>
            <Button className="mx-auto" onClick={() => router.push("/dashboard")}>
              Back to dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}

        {step === "capture" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative space-y-5 overflow-hidden rounded-3xl bg-white p-7 shadow-sm ring-1 ring-ink-100"
          >
            <div className="absolute inset-x-0 top-0 h-1.5 bg-energy-gradient-x" />
            <div className="flex flex-col items-center gap-3 text-center">
              <IconTile tone="energy" size="xl">
                <ScanFace className="h-7 w-7" />
              </IconTile>
              <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink-900">Record your liveness video</h2>
              {status?.status === "FAILED" && (
                <Notice tone="warning" className="text-left">
                  We couldn&apos;t detect a clear face last time. Please record
                  again in good lighting with your face centered.
                </Notice>
              )}
            </div>
            <InAppBrowserWarning />
            <LivenessVideoCapture onComplete={() => setStep("done")} />
          </motion.div>
        )}

        {step === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 rounded-3xl bg-white p-7 text-center shadow-sm ring-1 ring-accent-100"
          >
            <IconTile tone="accent" size="xl" className="mx-auto">
              <ShieldCheck className="h-7 w-7" />
            </IconTile>
            <h2 className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900">Verification submitted</h2>
            <p className="text-sm text-ink-500">
              Thanks! Your account is unlocked. We&apos;re finishing your secure
              face baseline in the background.
            </p>
            <Button className="mx-auto" onClick={() => router.push("/dashboard")}>
              Back to dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
