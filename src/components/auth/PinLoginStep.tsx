"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Key, ArrowRight, ArrowCounterClockwise, ShieldWarning } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconTile } from "@/components/ui/Icon";
import { AuthAlert, AuthCardHeader, AuthLinksRow } from "@/components/auth/AuthCard";
import { cn } from "@/lib/utils";

interface PinLoginStepProps {
  tempToken: string;
  userName: string;
  /** Whether the user has already accepted the no-2FA liability before. */
  riskAlreadyAccepted: boolean;
  onBack: () => void;
}

/**
 * TPIN login step — shown when a master-admin has waived mandatory 2FA for the
 * account and enabled PIN login. The user enters their transaction PIN and, the
 * first time, must accept that they carry all account risk without 2FA.
 */
export function PinLoginStep({ tempToken, userName, riskAlreadyAccepted, onBack }: PinLoginStepProps) {
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [riskAccepted, setRiskAccepted] = useState(riskAlreadyAccepted);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const verify = useCallback(async () => {
    const toVerify = pin.trim();
    if (toVerify.length < 4 || submittingRef.current) return;
    if (!riskAlreadyAccepted && !riskAccepted) {
      setError("Please accept the risk acknowledgement to continue.");
      return;
    }
    submittingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/pin-login/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tempToken, pin: toVerify, riskAccepted }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        setLoading(false);
        setPin("");
        submittingRef.current = false;
        return;
      }

      const result = await signIn("token-login", { grant: data.grant, redirect: false });
      if (result?.error) {
        setError("Session creation failed. Please try again.");
        setLoading(false);
        submittingRef.current = false;
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
      setPin("");
      submittingRef.current = false;
    }
  }, [pin, tempToken, riskAccepted, riskAlreadyAccepted, router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    verify();
  }

  return (
    <div className="space-y-6">
      <AuthCardHeader
        as="h2"
        eyebrow="Verify it's you"
        title="Sign in with your PIN"
        description={
          <>
            Hi {userName || "there"} — enter your transaction PIN to finish signing in.
          </>
        }
        icon={<IconTile icon={Key} tone="brand" size="lg" />}
      />

      <AuthAlert message={error || null} />

      <form className="space-y-5" onSubmit={onSubmit}>
        <div>
          <label
            htmlFor="pin-login-pin"
            className="mb-2 block text-center text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500"
          >
            Transaction PIN
          </label>
          <Input
            ref={inputRef}
            id="pin-login-pin"
            type="password"
            inputMode="numeric"
            maxLength={6}
            placeholder="••••••"
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
            disabled={loading}
            autoComplete="off"
            className={cn(
              "h-14 text-center font-display text-2xl font-semibold tracking-[0.5em] placeholder:tracking-[0.5em]",
              error && "border-coral-300"
            )}
            required
          />
          <p className="mt-2 text-center text-xs text-ink-400">4–6 digits · the same PIN you use to confirm payments</p>
        </div>

        {!riskAlreadyAccepted && (
          <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-amber-50 p-4 text-xs leading-relaxed text-amber-900 ring-1 ring-inset ring-amber-200">
            <input
              type="checkbox"
              checked={riskAccepted}
              onChange={(e) => setRiskAccepted(e.target.checked)}
              disabled={loading}
              className="mt-0.5 h-4 w-4 shrink-0 rounded accent-amber-600"
            />
            <span className="flex items-start gap-2">
              <ShieldWarning size={16} weight="duotone" className="mt-px shrink-0" aria-hidden />
              <span>
                I understand that logging in without two-factor authentication is
                less secure. I accept that all risk for any suspicious or
                unauthorised activity on my account is mine, and the company bears
                no responsibility.
              </span>
            </span>
          </label>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={loading}
          disabled={pin.length < 4 || (!riskAlreadyAccepted && !riskAccepted)}
        >
          {loading ? (
            "Verifying…"
          ) : (
            <>
              Verify &amp; sign in <ArrowRight size={16} weight="bold" aria-hidden />
            </>
          )}
        </Button>
      </form>

      <AuthLinksRow className="justify-end">
        <button
          type="button"
          onClick={onBack}
          disabled={loading}
          className="focus-energy inline-flex items-center gap-1.5 rounded-lg font-medium text-ink-500 transition hover:text-ink-900 disabled:opacity-50"
        >
          <ArrowCounterClockwise size={13} weight="bold" aria-hidden />
          Start over
        </button>
      </AuthLinksRow>
    </div>
  );
}
