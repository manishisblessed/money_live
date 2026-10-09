"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  QrCode,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  Download,
} from "lucide-react";
import { ShieldCheck, Key, DeviceMobile } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { FloatingInput } from "@/components/ui/Input";
import { IconTile } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { FadeIn, SectionCard } from "@/components/dashboard/patterns";
import { cn } from "@/lib/utils";

type SetupStep = "start" | "scan" | "verify" | "backup" | "done";

const STEPS: { id: SetupStep; label: string }[] = [
  { id: "start", label: "Start" },
  { id: "scan", label: "Scan" },
  { id: "verify", label: "Verify" },
  { id: "backup", label: "Backup" },
];

function StepRail({ step }: { step: SetupStep }) {
  const idx = STEPS.findIndex((s) => s.id === step);
  const current = step === "done" ? STEPS.length : idx;
  return (
    <ol className="flex items-center gap-2" aria-label="Setup progress">
      {STEPS.map((s, i) => {
        const done = i < current;
        const active = i === current;
        return (
          <li key={s.id} className="flex items-center gap-2">
            <span
              className={cn(
                "grid h-7 w-7 place-items-center rounded-full text-xs font-bold ring-1 ring-inset transition-colors",
                done && "bg-accent-500 text-ink-900 ring-accent-500",
                active && "bg-energy-gradient text-white ring-transparent shadow-energy-sm",
                !done && !active && "bg-white text-ink-400 ring-ink-200"
              )}
              aria-current={active ? "step" : undefined}
            >
              {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
            </span>
            <span className={cn("hidden text-xs font-semibold sm:inline", active ? "text-ink-900" : "text-ink-400")}>
              {s.label}
            </span>
            {i < STEPS.length - 1 && <span className="h-px w-6 bg-ink-200" aria-hidden />}
          </li>
        );
      })}
    </ol>
  );
}

export default function SecuritySettingsPage() {
  const { data: session } = useSession({ required: true });
  const router = useRouter();
  const [step, setStep] = useState<SetupStep>("start");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (session?.user && !session.user.twoFactorEnabled) {
      router.replace("/dashboard");
    }
  }, [session, router]);

  async function startSetup() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Setup failed");
        setLoading(false);
        return;
      }
      setQrCode(data.qrCode);
      setSecret(data.secret);
      setBackupCodes(data.backupCodes);
      setStep("scan");
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  async function confirmSetup() {
    if (code.length !== 6) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/2fa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Verification failed");
        setLoading(false);
        return;
      }
      setStep("backup");
    } catch {
      setError("Network error");
    }
    setLoading(false);
  }

  function copySecret() {
    navigator.clipboard.writeText(secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function downloadBackupCodes() {
    const text = [
      "eMoney — 2FA Backup Codes",
      `Account: ${session?.user?.email}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      "",
      "Keep these codes safe. Each can only be used once.",
      "",
      ...backupCodes.map((c, i) => `${i + 1}. ${c}`),
    ].join("\n");

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eMoney-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  }

  const errorBox = error ? (
    <div className="flex items-start gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{error}</span>
    </div>
  ) : null;

  if (step === "done") {
    return (
      <div className="mx-auto max-w-lg">
        <FadeIn>
          <SectionCard tone="accent" padding="lg" className="text-center">
            <IconTile icon={ShieldCheck} tone="accent" size="xl" className="mx-auto" />
            <h1 className="mt-5 font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900 md:text-3xl">
              You&apos;re all set
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-600">
              Two-factor authentication is active. You&apos;ll need your authenticator app
              every time you sign in.
            </p>
            <Button
              onClick={() => (window.location.href = "/dashboard")}
              size="lg"
              className="mx-auto mt-6"
            >
              Go to dashboard <ArrowRight className="h-4 w-4" />
            </Button>
          </SectionCard>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <PageHeader
        eyebrow="Account · Security"
        title="Two-factor authentication"
        description="Protect your account and your customers with an authenticator app."
      />

      <StepRail step={step} />

      {step === "start" && (
        <FadeIn className="space-y-4">
          <SectionCard tone="amber">
            <div className="flex items-start gap-3">
              <IconTile tone="amber" size="sm">
                <AlertTriangle className="h-4 w-4" />
              </IconTile>
              <div>
                <p className="font-semibold text-ink-900">2FA is mandatory</p>
                <p className="mt-1 text-sm text-ink-600">
                  You must set up two-factor authentication before you can access
                  the dashboard. It takes about two minutes.
                </p>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="You'll need">
            <ul className="space-y-3 text-sm text-ink-700">
              <li className="flex items-center gap-3">
                <IconTile icon={DeviceMobile} tone="brand" size="sm" />
                An authenticator app (Google Authenticator, Authy, Microsoft Authenticator)
              </li>
              <li className="flex items-center gap-3">
                <IconTile icon={Key} tone="royal" size="sm" />
                A safe place to store backup codes
              </li>
            </ul>
          </SectionCard>

          {errorBox}

          <Button onClick={startSetup} size="lg" className="w-full" isLoading={loading} disabled={loading}>
            {loading ? "Setting up…" : <>Begin setup <ArrowRight className="h-4 w-4" /></>}
          </Button>
        </FadeIn>
      )}

      {step === "scan" && (
        <FadeIn className="space-y-4">
          <SectionCard
            title="Scan the QR code"
            description="Open your authenticator app and scan this code."
          >
            <div className="grid place-items-center rounded-3xl bg-ink-50/70 p-6 ring-1 ring-inset ring-ink-100">
              {qrCode && (
                <img src={qrCode} alt="2FA QR Code" className="h-56 w-56 rounded-2xl bg-white p-2 shadow-sm" />
              )}
            </div>

            <div className="mt-4 rounded-2xl bg-ink-50/70 p-3 ring-1 ring-inset ring-ink-100">
              <p className="mb-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">
                Can&apos;t scan? Enter this key manually
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 break-all rounded-xl bg-white px-3 py-2 font-mono text-sm text-ink-900 ring-1 ring-inset ring-ink-100">
                  {secret}
                </code>
                <Button variant="outline" size="icon" onClick={copySecret} aria-label="Copy secret key">
                  {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </SectionCard>

          <Button onClick={() => setStep("verify")} size="lg" className="w-full">
            I&apos;ve scanned it <ArrowRight className="h-4 w-4" />
          </Button>
        </FadeIn>
      )}

      {step === "verify" && (
        <FadeIn className="space-y-4">
          <SectionCard
            title="Verify your setup"
            description="Enter the 6-digit code shown in your authenticator app."
          >
            <div className="space-y-4">
              {errorBox}
              <FloatingInput
                id="verify-code"
                label="Verification code"
                inputMode="numeric"
                maxLength={6}
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                autoFocus
                className="[&_input]:font-mono [&_input]:text-lg [&_input]:tracking-[0.4em]"
              />
            </div>
          </SectionCard>

          <Button
            onClick={confirmSetup}
            size="lg"
            className="w-full"
            isLoading={loading}
            disabled={loading || code.length !== 6}
          >
            {loading ? "Verifying…" : <>Verify &amp; activate <ArrowRight className="h-4 w-4" /></>}
          </Button>

          <button
            onClick={() => setStep("scan")}
            className="mx-auto block text-sm font-semibold text-brand-700 hover:underline"
          >
            Back to QR code
          </button>
        </FadeIn>
      )}

      {step === "backup" && (
        <FadeIn className="space-y-4">
          <SectionCard
            icon={<IconTile icon={ShieldCheck} tone="accent" size="sm" />}
            title="2FA is now active"
            description="Save these backup codes somewhere safe. Each can only be used once."
            action={<Badge variant="success" dot>Active</Badge>}
          >
            <div className="grid grid-cols-2 gap-2">
              {backupCodes.map((c, i) => (
                <div
                  key={i}
                  className="rounded-xl bg-ink-50/70 px-3 py-2.5 text-center font-mono text-sm font-medium text-ink-900 ring-1 ring-inset ring-ink-100"
                >
                  {c}
                </div>
              ))}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <strong>Important:</strong> if you lose your phone and don&apos;t have these codes,
                you&apos;ll be locked out of your account.
              </span>
            </div>
          </SectionCard>

          <div className="flex gap-3">
            <Button onClick={downloadBackupCodes} variant="outline" className="flex-1">
              <Download className="h-4 w-4" /> Download
            </Button>
            <Button onClick={() => setStep("done")} className="flex-1">
              I&apos;ve saved them <Check className="h-4 w-4" />
            </Button>
          </div>
        </FadeIn>
      )}

      {step === "scan" || step === "verify" ? null : (
        <p className="flex items-center justify-center gap-1.5 text-xs text-ink-400">
          <QrCode className="h-3.5 w-3.5" /> Works with any TOTP authenticator app.
        </p>
      )}
    </div>
  );
}
