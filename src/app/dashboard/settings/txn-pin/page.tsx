"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Lock } from "lucide-react";
import { Key, ShieldCheck, CheckCircle } from "@phosphor-icons/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { FloatingInput } from "@/components/ui/Input";
import { IconTile } from "@/components/ui/Icon";
import { PinInput } from "@/components/security/PinInput";
import { FadeIn, SectionCard } from "@/components/dashboard/patterns";

type Status = { isSet: boolean; setAt: string | null; lockedUntil: string | null };

/**
 * Set or change the 4-digit transaction PIN required on every payment.
 * First-time set is confirmed with the account password; changing it is
 * confirmed with the current PIN.
 */
export default function TxnPinPage() {
  const router = useRouter();
  const [status, setStatus] = useState<Status | null>(null);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [forgotPin, setForgotPin] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/security/txn-pin");
      if (res.ok) setStatus(await res.json());
    } catch {
      /* the form still renders; the server enforces */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const isChange = Boolean(status?.isSet);
  const usePassword = !isChange || forgotPin;
  const locked = status?.lockedUntil && new Date(status.lockedUntil) > new Date();
  const pinsMatch = newPin.length === 4 && newPin === confirmPin;
  const canSubmit =
    pinsMatch && !saving && (usePassword ? password.length >= 8 : currentPin.length === 4);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/security/txn-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPin,
          ...(usePassword ? { password } : { currentPin }),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(typeof data.error === "string" ? data.error : "Could not save the PIN — check your details");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSaving(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-lg">
        <FadeIn>
          <SectionCard tone="accent" padding="lg" className="text-center">
            <IconTile icon={CheckCircle} tone="accent" size="xl" className="mx-auto" />
            <h1 className="mt-5 font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900 md:text-3xl">
              Transaction PIN {isChange ? "updated" : "activated"}
            </h1>
            <p className="mx-auto mt-2 max-w-sm text-sm text-ink-600">
              You&apos;ll be asked for this PIN every time you make a payment —
              bill pay, recharge, money transfer, AePS and payouts.
            </p>
            <Button size="lg" className="mt-6" onClick={() => router.back()}>
              Done
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
        title={isChange ? "Change transaction PIN" : "Set transaction PIN"}
        description="A 4-digit PIN confirmed on every payment. It's separate from your login password — never share it."
      />

      <SectionCard tone="brand">
        <div className="flex items-start gap-3">
          <IconTile icon={ShieldCheck} tone="brand" size="sm" />
          <div className="text-sm text-ink-700">
            <p className="font-semibold text-ink-900">Why a transaction PIN?</p>
            <p className="mt-1">
              Even if someone reaches your open dashboard, they cannot move money
              without this PIN. 5 wrong attempts lock payments for 15 minutes.
            </p>
          </div>
        </div>
      </SectionCard>

      {locked ? (
        <SectionCard tone="coral">
          <div className="flex items-start gap-3 text-sm text-rose-700">
            <IconTile tone="coral" size="sm"><Lock className="h-4 w-4" /></IconTile>
            <span>
              PIN entry is temporarily locked after too many wrong attempts. Try
              again after{" "}
              <strong>
                {new Date(status!.lockedUntil!).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
              </strong>
              .
            </span>
          </div>
        </SectionCard>
      ) : (
        <SectionCard
          icon={<IconTile icon={Key} tone="royal" size="sm" />}
          title={isChange ? "Enter your new PIN" : "Create your PIN"}
          description="Four digits. Avoid 0000, 1234 or your birth year."
        >
          <form onSubmit={submit} className="space-y-7">
            {isChange && !forgotPin && (
              <div>
                <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">
                  Current PIN
                </p>
                <PinInput id="current-pin" value={currentPin} onChange={setCurrentPin} autoFocus />
                <p className="mt-2 text-center text-[11px]">
                  <button
                    type="button"
                    onClick={() => setForgotPin(true)}
                    className="font-semibold text-brand-700 hover:underline"
                  >
                    Forgot your PIN? Verify with your password instead
                  </button>
                </p>
              </div>
            )}

            <div>
              <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">
                New 4-digit PIN
              </p>
              <PinInput id="new-pin" value={newPin} onChange={setNewPin} autoFocus={!isChange} />
              <p className="mt-2 text-center text-[11px] text-ink-400">
                Guessable PINs like 0000 or 1234 are rejected.
              </p>
            </div>

            <div>
              <p className="mb-3 text-center text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">
                Confirm new PIN
              </p>
              <PinInput id="confirm-pin" value={confirmPin} onChange={setConfirmPin} autoFocus={false} />
              {confirmPin.length === 4 && !pinsMatch && (
                <p className="mt-2 text-center text-xs text-rose-600">PINs don&apos;t match</p>
              )}
            </div>

            {usePassword && (
              <FloatingInput
                id="password"
                label="Account password"
                type="password"
                required
                autoComplete="current-password"
                hint="Confirm it's really you."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            )}

            {error && (
              <div className="flex items-start gap-2 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button type="submit" size="lg" className="w-full" isLoading={saving} disabled={!canSubmit}>
              {saving ? "Saving…" : isChange ? "Update PIN" : "Activate PIN"}
            </Button>
          </form>
        </SectionCard>
      )}
    </div>
  );
}
