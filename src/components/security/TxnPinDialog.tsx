"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Key, LockKey, ShieldCheck, WarningCircle, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/Icon";
import { PinInput } from "./PinInput";
import { formatINR } from "@/lib/utils";

/**
 * Transaction-PIN confirmation sheet, shown at the moment of payment on
 * every money-moving action. The parent owns submission: `onConfirm(pin)`
 * performs the API call (sending the pin via the `x-txn-pin` header) and
 * throws / returns an error message when the server rejects it.
 *
 * Handles the three server states for you:
 *  - PIN not set   → setup call-to-action linking to /dashboard/settings/txn-pin
 *  - PIN locked    → cool-down message
 *  - wrong PIN     → inline error + cleared boxes
 */
export function TxnPinDialog({
  open,
  title = "Confirm payment",
  detail,
  amount,
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  detail?: string;
  amount?: number;
  busy?: boolean;
  /** Perform the payment. Return an error message to keep the dialog open, or null on success. */
  onConfirm: (pin: string) => Promise<string | null>;
  onCancel: () => void;
}) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pinState, setPinState] = useState<"unknown" | "ready" | "not-set" | "locked">("unknown");
  const [lockedUntil, setLockedUntil] = useState<string | null>(null);
  const reduce = useReducedMotion();

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/security/txn-pin");
      const data = await res.json();
      if (!res.ok) {
        setPinState("ready"); // fail open to the entry UI; the server still enforces
        return;
      }
      if (!data.isSet) setPinState("not-set");
      else if (data.lockedUntil && new Date(data.lockedUntil) > new Date()) {
        setLockedUntil(data.lockedUntil);
        setPinState("locked");
      } else setPinState("ready");
    } catch {
      setPinState("ready");
    }
  }, []);

  useEffect(() => {
    if (open) {
      setPin("");
      setError(null);
      setPinState("unknown");
      checkStatus();
    }
  }, [open, checkStatus]);

  async function submit(fullPin: string) {
    if (busy) return;
    setError(null);
    const err = await onConfirm(fullPin);
    if (err) {
      setError(err);
      setPin("");
      // Re-check: the failure may have locked the PIN.
      if (/locked/i.test(err)) checkStatus();
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-ink-950/60 px-4 py-8 backdrop-blur-sm"
      role="dialog"
      aria-modal
      aria-label={title}
    >
      <motion.div
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 16, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-sm overflow-hidden rounded-4xl bg-white shadow-energy ring-1 ring-ink-100"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel"
          disabled={busy}
          className="focus-energy absolute right-4 top-4 z-10 inline-flex h-9 w-9 items-center justify-center rounded-full bg-ink-100 text-ink-700 transition hover:bg-ink-200 disabled:opacity-50"
        >
          <X size={16} weight="bold" aria-hidden />
        </button>

        <div className="px-6 pb-6 pt-8 text-center">
          <IconTile icon={ShieldCheck} tone="energy" size="xl" className="mx-auto rounded-3xl" />
          <p className="mt-4 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500">
            <span className="brand-dot" aria-hidden />
            Secure confirmation
          </p>
          <h2 className="mt-1.5 font-display text-xl font-semibold tracking-[-0.02em] text-ink-900">
            {title}
          </h2>
          {amount !== undefined && (
            <p className="mt-1 font-display text-4xl font-semibold tracking-[-0.02em] text-ink-900">
              {formatINR(amount)}
            </p>
          )}
          {detail && <p className="mt-1.5 text-sm text-ink-500">{detail}</p>}
        </div>

        <div className="border-t border-ink-100 bg-[#f6f7fb] px-6 py-6">
          {pinState === "unknown" && (
            <p className="flex items-center justify-center gap-2 text-center text-sm text-ink-500">
              <span className="h-2 w-2 animate-pulse rounded-full bg-brand-500" />
              Checking PIN status…
            </p>
          )}

          {pinState === "not-set" && (
            <div className="space-y-4 text-center">
              <div className="flex items-start gap-2.5 rounded-2xl bg-amber-50 p-3.5 text-left text-sm text-amber-800 ring-1 ring-inset ring-amber-200">
                <Key size={18} weight="duotone" className="mt-px shrink-0" aria-hidden />
                <span>
                  You haven&apos;t set a transaction PIN yet. Every payment requires
                  one — set it once and use it for all transactions.
                </span>
              </div>
              <Link href="/dashboard/settings/txn-pin">
                <Button type="button" size="lg" className="w-full">
                  Set up transaction PIN
                </Button>
              </Link>
            </div>
          )}

          {pinState === "locked" && (
            <div className="flex items-start gap-2.5 rounded-2xl bg-coral-50 p-3.5 text-sm text-coral-700 ring-1 ring-inset ring-coral-200">
              <LockKey size={18} weight="duotone" className="mt-px shrink-0" aria-hidden />
              <span>
                PIN entry is locked after too many wrong attempts.
                {lockedUntil && (
                  <>
                    {" "}
                    Try again after{" "}
                    {new Date(lockedUntil).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    .
                  </>
                )}
              </span>
            </div>
          )}

          {pinState === "ready" && (
            <div className="space-y-4">
              <p className="text-center text-xs font-semibold uppercase tracking-widest text-ink-500">
                Enter your transaction PIN
              </p>
              <PinInput
                value={pin}
                onChange={setPin}
                onComplete={submit}
                disabled={busy}
                error={Boolean(error)}
              />
              <div aria-live="polite" role="status" className="empty:hidden">
                <AnimatePresence initial={false}>
                  {error && (
                    <motion.div
                      key="err"
                      initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-start gap-2.5 rounded-2xl bg-coral-50 p-3.5 text-sm text-coral-700 ring-1 ring-inset ring-coral-200"
                    >
                      <WarningCircle size={18} weight="duotone" className="mt-px shrink-0" aria-hidden />
                      <span>{error}</span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <Button
                type="button"
                className="w-full"
                size="lg"
                isLoading={busy}
                disabled={busy || pin.length < 4}
                onClick={() => submit(pin)}
              >
                {busy ? "Processing…" : "Confirm & pay"}
              </Button>
              <p className="text-center text-[11px] text-ink-400">
                Forgot your PIN?{" "}
                <Link
                  href="/dashboard/settings/txn-pin"
                  className="font-semibold text-brand-700 hover:underline"
                >
                  Reset it in Settings
                </Link>
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
