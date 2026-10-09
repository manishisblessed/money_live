"use client";

import { ShieldCheck, Key, CaretRight, ArrowCounterClockwise } from "@phosphor-icons/react";
import { IconTile } from "@/components/ui/Icon";
import { AuthCardHeader, AuthLinksRow } from "@/components/auth/AuthCard";

export type LoginMethod = "2fa" | "pinlogin";

interface LoginMethodChoiceProps {
  userName: string;
  /** Called with the factor the user picked. */
  onChoose: (method: LoginMethod) => void;
  onBack: () => void;
}

/**
 * Second-factor chooser — shown when a master-admin has allowed TPIN login for
 * an account that ALSO has an authenticator app set up. The user decides, on
 * every sign-in, whether to verify with their authenticator or their
 * transaction PIN. Neither option is forced.
 */
export function LoginMethodChoice({ userName, onChoose, onBack }: LoginMethodChoiceProps) {
  return (
    <div className="space-y-6">
      <AuthCardHeader
        as="h2"
        eyebrow="Step 2 of 2"
        title="How do you want to verify?"
        description={
          <>
            Hi {userName || "there"} — pick the second factor you&apos;d like to use
            today. You can switch any time.
          </>
        }
        icon={<IconTile icon={ShieldCheck} tone="energy" size="lg" />}
      />

      <div className="space-y-3">
        <button
          type="button"
          onClick={() => onChoose("2fa")}
          className="gradient-ring focus-energy group flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left ring-1 ring-ink-100 transition hover:-translate-y-0.5 hover:shadow-energy-sm"
        >
          <IconTile icon={ShieldCheck} tone="accent" size="lg" />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="block text-sm font-semibold text-ink-900">Authenticator app</span>
              <span className="rounded-full bg-accent-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-accent-700 ring-1 ring-inset ring-accent-200">
                Most secure
              </span>
            </span>
            <span className="mt-0.5 block text-xs text-ink-500">
              Enter the 6-digit code from Google Authenticator, Authy, etc.
            </span>
          </span>
          <CaretRight
            size={18}
            weight="bold"
            className="shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-accent-600"
            aria-hidden
          />
        </button>

        <button
          type="button"
          onClick={() => onChoose("pinlogin")}
          className="gradient-ring focus-energy group flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left ring-1 ring-ink-100 transition hover:-translate-y-0.5 hover:shadow-energy-sm"
        >
          <IconTile icon={Key} tone="brand" size="lg" />
          <span className="min-w-0 flex-1">
            <span className="flex items-center gap-2">
              <span className="block text-sm font-semibold text-ink-900">Transaction PIN</span>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-brand-700 ring-1 ring-inset ring-brand-200">
                Quick
              </span>
            </span>
            <span className="mt-0.5 block text-xs text-ink-500">
              Sign in with your TPIN instead of the authenticator.
            </span>
          </span>
          <CaretRight
            size={18}
            weight="bold"
            className="shrink-0 text-ink-300 transition group-hover:translate-x-0.5 group-hover:text-brand-600"
            aria-hidden
          />
        </button>
      </div>

      <AuthLinksRow className="justify-end">
        <button
          type="button"
          onClick={onBack}
          className="focus-energy inline-flex items-center gap-1.5 rounded-lg font-medium text-ink-500 transition hover:text-ink-900"
        >
          <ArrowCounterClockwise size={13} weight="bold" aria-hidden />
          Start over
        </button>
      </AuthLinksRow>
    </div>
  );
}
