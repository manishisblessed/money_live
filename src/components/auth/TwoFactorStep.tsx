"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  ShieldCheck,
  ArrowRight,
  Key,
  ArrowCounterClockwise,
  DeviceMobile,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { FloatingInput } from "@/components/ui/Input";
import { IconTile } from "@/components/ui/Icon";
import { PinInput } from "@/components/security/PinInput";
import { AuthAlert, AuthCardHeader, AuthLinksRow } from "@/components/auth/AuthCard";

interface TwoFactorStepProps {
  tempToken: string;
  userName: string;
  userEmail: string;
  onBack: () => void;
}

export function TwoFactorStep({ tempToken, userName, userEmail, onBack }: TwoFactorStepProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [useBackup, setUseBackup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const verifyingRef = useRef(false);

  useEffect(() => {
    inputRef.current?.focus();
  }, [useBackup]);

  const verify = useCallback(async (verifyCode?: string) => {
    const toVerify = (verifyCode ?? code).trim();
    if (!toVerify || verifyingRef.current) return;
    verifyingRef.current = true;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/2fa/verify-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tempToken,
          code: toVerify,
          type: useBackup ? "backup" : "totp",
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Verification failed");
        if (data.remainingAttempts !== undefined) {
          setRemaining(data.remainingAttempts);
        }
        setLoading(false);
        setCode("");
        verifyingRef.current = false;
        return;
      }

      const result = await signIn("token-login", {
        grant: data.grant,
        redirect: false,
      });

      if (result?.error) {
        setError("Session creation failed. Please try again.");
        setLoading(false);
        verifyingRef.current = false;
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
      setCode("");
      verifyingRef.current = false;
    }
  }, [code, tempToken, useBackup, router]);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    verify();
  }

  return (
    <div className="space-y-6">
      <AuthCardHeader
        as="h2"
        eyebrow="Verify it's you"
        title="Two-factor check"
        description={
          <>
            Hi {userName || "there"} —{" "}
            {useBackup
              ? "enter one of your saved backup codes."
              : "enter the 6-digit code from your authenticator app."}
            {userEmail ? (
              <>
                {" "}
                Signing in as <span className="font-semibold text-ink-700">{userEmail}</span>.
              </>
            ) : null}
          </>
        }
        icon={<IconTile icon={ShieldCheck} tone="accent" size="lg" />}
      />

      <AuthAlert
        message={error || null}
        aside={
          remaining !== null && remaining > 0
            ? `${remaining} attempt${remaining !== 1 ? "s" : ""} left`
            : undefined
        }
      />

      <AuthAlert
        tone="warning"
        message={
          remaining === 0 ? (
            <>
              Too many failed attempts. Please start over.{" "}
              <button
                type="button"
                onClick={onBack}
                className="font-semibold underline underline-offset-2"
              >
                Back to login
              </button>
            </>
          ) : null
        }
      />

      <form className="space-y-5" onSubmit={onSubmit}>
        {useBackup ? (
          <div className="relative">
            <FloatingInput
              ref={inputRef}
              id="2fa-code"
              label="Backup code"
              inputMode="text"
              maxLength={9}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              disabled={loading}
              autoComplete="one-time-code"
              hint="Format: xxxx-xxxx · each code works once"
              required
            />
            <Key
              size={18}
              weight="duotone"
              className="pointer-events-none absolute right-4 top-7 -translate-y-1/2 text-ink-300"
              aria-hidden
            />
          </div>
        ) : (
          <div>
            <label
              htmlFor="2fa-code"
              className="mb-3 block text-center text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500"
            >
              6-digit code
            </label>
            <PinInput
              id="2fa-code"
              length={6}
              masked={false}
              value={code}
              disabled={loading}
              error={Boolean(error)}
              onChange={(val) => {
                setCode(val);
                if (val.length === 6) verify(val);
              }}
            />
            {!loading && (
              <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-ink-400">
                <DeviceMobile size={14} weight="duotone" aria-hidden />
                Google Authenticator, Authy or Microsoft Authenticator
              </p>
            )}
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={loading}
          disabled={remaining === 0 || (!useBackup && code.length !== 6)}
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

      <AuthLinksRow>
        <button
          type="button"
          onClick={() => {
            setUseBackup(!useBackup);
            setCode("");
            setError("");
          }}
          disabled={loading}
          className="focus-energy rounded-lg font-semibold text-brand-700 transition hover:underline disabled:opacity-50"
        >
          {useBackup ? "Use authenticator app" : "Use a backup code"}
        </button>

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
