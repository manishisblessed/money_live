"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  ShieldCheck,
  KeyRound,
  HelpCircle,
  Loader2,
  Check,
  ShieldAlert,
  Lock,
} from "lucide-react";
import { Key, ShieldWarning, Fingerprint } from "@phosphor-icons/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { IconTile } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { EmptyState, SectionCard, FadeIn } from "@/components/dashboard/patterns";
import { cn } from "@/lib/utils";

type Preferred = "authenticator" | "tpin" | null;

type State = {
  selfManageable: boolean;
  twoFactorEnabled: boolean;
  hasTxnPin: boolean;
  pinLoginEnabled: boolean;
  riskAccepted: boolean;
  canChoose: boolean;
  preferred: Preferred;
};

const OPTIONS: {
  id: Exclude<Preferred, null> | "ask";
  label: string;
  desc: string;
  icon: typeof ShieldCheck;
  accent: string;
}[] = [
  {
    id: "ask",
    label: "Ask me every time",
    desc: "Show the chooser at each login so you can pick on the spot.",
    icon: HelpCircle,
    accent: "bg-ink-100 text-ink-600",
  },
  {
    id: "authenticator",
    label: "Authenticator app",
    desc: "Skip the chooser and go straight to your 6-digit TOTP code. Most secure.",
    icon: ShieldCheck,
    accent: "bg-accent-50 text-accent-700",
  },
  {
    id: "tpin",
    label: "Transaction PIN",
    desc: "Skip the chooser and sign in with your TPIN. Quick and convenient.",
    icon: KeyRound,
    accent: "bg-brand-50 text-brand-700",
  },
];

export default function LoginMethodSettingsPage() {
  const [state, setState] = useState<State | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [declaration, setDeclaration] = useState(false);
  const [confirmDisable, setConfirmDisable] = useState(false);

  async function load() {
    try {
      const res = await fetch("/api/security/login-method");
      const data = await res.json();
      if (res.ok) setState(data);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function post(payload: Record<string, unknown>, busyKey: string) {
    setBusy(busyKey);
    try {
      const res = await fetch("/api/security/login-method", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Something went wrong");
      setState(data);
      return true;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Something went wrong");
      return false;
    } finally {
      setBusy(null);
    }
  }

  async function enablePinLogin() {
    if (!declaration) return;
    const ok = await post({ action: "enablePinLogin", riskAccepted: true }, "enable");
    if (ok) {
      setDeclaration(false);
      toast.success("PIN login enabled. You can now sign in with your transaction PIN.");
    }
  }

  async function disablePinLogin() {
    const ok = await post({ action: "disablePinLogin" }, "disable");
    setConfirmDisable(false);
    if (ok) toast.success("PIN login disabled. Your authenticator app is required again.");
  }

  async function choose(id: (typeof OPTIONS)[number]["id"]) {
    const preferred: Preferred = id === "ask" ? null : id;
    const ok = await post({ action: "setPreference", preferred }, `pref-${id}`);
    if (ok) toast.success("Login preference saved.");
  }

  const current: (typeof OPTIONS)[number]["id"] = state?.preferred ?? "ask";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        eyebrow="Account · Security"
        title="Login method"
        description="Choose how you verify your identity when you sign in."
        actions={
          <Link href="/dashboard/settings" className="text-sm font-semibold text-ink-500 hover:text-ink-900">
            ← Back to settings
          </Link>
        }
      />

      {loading ? (
        <SectionCard className="grid place-items-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-brand-600" />
        </SectionCard>
      ) : !state ? (
        <EmptyState
          bordered
          tone="coral"
          icon={ShieldWarning}
          title="Couldn't load your login settings"
          description="Please refresh and try again."
        />
      ) : !state.selfManageable ? (
        <SectionCard tone="amber">
          <div className="flex items-start gap-3">
            <IconTile icon={ShieldWarning} tone="amber" size="sm" />
            <div>
              <p className="font-semibold text-ink-900">
                PIN login isn&apos;t available for this account
              </p>
              <p className="mt-1 text-sm text-ink-600">
                For security, admin and master-admin accounts must always sign in
                with an authenticator app.
              </p>
            </div>
          </div>
        </SectionCard>
      ) : (
        <FadeIn className="space-y-6">
          {/* ── Enable / disable TPIN login ─────────────────────────────── */}
          <SectionCard
            icon={<IconTile icon={Key} tone="brand" size="sm" />}
            title="Sign in with your transaction PIN"
            description="Use your TPIN as an alternative to the authenticator app."
            action={state.pinLoginEnabled ? <Badge variant="success" dot>Enabled</Badge> : <Badge>Off</Badge>}
          >
            <div className="space-y-4">
              {!state.hasTxnPin ? (
                <div className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 ring-1 ring-inset ring-amber-200">
                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <div className="text-sm text-amber-800">
                    You need a transaction PIN before you can turn this on.{" "}
                    <Link
                      href="/dashboard/settings/txn-pin"
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      Set a transaction PIN
                    </Link>
                    .
                  </div>
                </div>
              ) : state.pinLoginEnabled ? (
                <>
                  <p className="text-sm text-ink-600">
                    PIN login is on. At sign-in you can use either your
                    authenticator app or your transaction PIN.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmDisable(true)}
                    isLoading={busy === "disable"}
                    disabled={busy !== null}
                  >
                    Disable PIN login
                  </Button>
                </>
              ) : (
                <>
                  <label className="flex items-start gap-3 rounded-2xl bg-amber-50 p-4 text-sm text-amber-900 ring-1 ring-inset ring-amber-200">
                    <input
                      type="checkbox"
                      checked={declaration}
                      onChange={(e) => setDeclaration(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-amber-600"
                    />
                    <span className="flex items-start gap-1.5">
                      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>
                        <strong>Declaration.</strong> I understand that signing
                        in with a transaction PIN instead of an authenticator app
                        is less secure. I accept that all responsibility and risk
                        for any activity on my account — including any suspicious
                        or unauthorised activity — is entirely mine, and that the
                        company bears no responsibility whatsoever.
                      </span>
                    </span>
                  </label>
                  <Button
                    onClick={enablePinLogin}
                    isLoading={busy === "enable"}
                    disabled={!declaration || busy !== null}
                  >
                    Enable PIN login
                  </Button>
                </>
              )}
            </div>
          </SectionCard>

          {/* ── Preferred method ────────────────────────────────────────── */}
          {state.pinLoginEnabled && (
            <SectionCard
              icon={<IconTile icon={Fingerprint} tone="royal" size="sm" />}
              title="Preferred method at login"
              description={
                state.canChoose
                  ? "Pick a default — you can always switch during login."
                  : "You'll sign in with your transaction PIN. Set up an authenticator app to be able to choose between the two."
              }
            >
              {state.canChoose ? (
                <div className="space-y-3" role="radiogroup" aria-label="Preferred login method">
                  {OPTIONS.map((o) => {
                    const Icon = o.icon;
                    const active = current === o.id;
                    const isBusy = busy === `pref-${o.id}`;
                    return (
                      <button
                        key={o.id}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        disabled={busy !== null}
                        onClick={() => choose(o.id)}
                        className={cn(
                          "flex w-full items-center gap-4 rounded-2xl p-4 text-left ring-1 ring-inset transition-[box-shadow,background-color] focus-energy",
                          active
                            ? "pill-active ring-royal-200 shadow-energy-sm"
                            : "bg-white ring-ink-100 hover:ring-brand-300"
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-11 w-11 shrink-0 place-items-center rounded-xl",
                            o.accent
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-sm font-semibold text-ink-900">
                            {o.label}
                          </span>
                          <span className="block text-xs text-ink-500">{o.desc}</span>
                        </span>
                        {isBusy ? (
                          <Loader2 className="h-5 w-5 shrink-0 animate-spin text-brand-600" />
                        ) : active ? (
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-energy-gradient text-white">
                            <Check className="h-4 w-4" />
                          </span>
                        ) : (
                          <span className="h-6 w-6 shrink-0 rounded-full ring-1 ring-inset ring-ink-200" />
                        )}
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-start gap-3 rounded-2xl bg-ink-50/70 p-4 text-sm text-ink-600 ring-1 ring-inset ring-ink-100">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>
                    Want the choice at login?{" "}
                    <Link
                      href="/dashboard/settings/security"
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      Set up an authenticator app
                    </Link>{" "}
                    and you&apos;ll be able to pick either method.
                  </span>
                </div>
              )}
            </SectionCard>
          )}
        </FadeIn>
      )}

      <ConfirmDialog
        open={confirmDisable}
        busy={busy === "disable"}
        title="Disable PIN login?"
        description="You'll need your authenticator app to sign in again. If you don't have one set up, you'll be asked to set it up at your next login. Your saved preference will be cleared."
        confirmLabel="Disable PIN login"
        onConfirm={disablePinLogin}
        onClose={() => setConfirmDisable(false)}
      />
    </div>
  );
}
