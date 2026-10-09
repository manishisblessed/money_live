"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowRight, Check, Password, X } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { FloatingInput } from "@/components/ui/Input";
import { IconTile } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import {
  AuthAlert,
  AuthCard,
  AuthCardHeader,
  AuthLinksRow,
  PasswordToggle,
} from "@/components/auth/AuthCard";
import { cn } from "@/lib/utils";

type Rule = { label: string; ok: boolean };

function evaluate(pwd: string): Rule[] {
  return [
    { label: "At least 10 characters", ok: pwd.length >= 10 },
    { label: "One uppercase letter", ok: /[A-Z]/.test(pwd) },
    { label: "One lowercase letter", ok: /[a-z]/.test(pwd) },
    { label: "One number", ok: /\d/.test(pwd) },
    {
      label: "One special character (@ # $ % & * etc.)",
      ok: /[^A-Za-z0-9]/.test(pwd),
    },
  ];
}

export default function SubAdminChangePasswordPage() {
  const router = useRouter();
  const { data: session, status } = useSession({ required: true });
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const rules = useMemo(() => evaluate(next), [next]);
  const allValid = rules.every((r) => r.ok);
  const matches = next.length > 0 && next === confirm;

  const name = session?.user?.name ?? "";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!allValid) {
      setError("Please satisfy every password requirement below.");
      return;
    }
    if (!matches) {
      setError("Confirmation does not match the new password.");
      return;
    }
    if (next === current) {
      setError("Your new password must be different from the temporary one.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not change password.");
        setSubmitting(false);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (status === "loading") {
    return (
      <AuthCard className="grid min-h-[16rem] place-items-center" aria-busy>
        <div className="flex items-center gap-3 text-sm text-ink-500">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-energy-gradient" />
          Loading your account…
        </div>
      </AuthCard>
    );
  }

  const satisfied = rules.filter((r) => r.ok).length + (matches ? 1 : 0);
  const total = rules.length + 1;

  return (
    <AuthCard>
      <AuthCardHeader
        tone="staff"
        eyebrow="First-time login"
        title="Set a password only you know"
        description={
          <>
            Welcome{name ? <>, <strong className="text-ink-900">{name}</strong></> : null}.
            Replace the temporary password issued by your Admin before continuing to the console.
          </>
        }
        icon={<IconTile icon={Password} tone="energy" size="lg" />}
        badge={<Badge variant="royal" dot>Staff access</Badge>}
      />

      <form className="mt-6 space-y-4" onSubmit={onSubmit}>
        <div className="relative">
          <FloatingInput
            id="cur"
            label="Temporary password"
            type={showCurrent ? "text" : "password"}
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
            required
            autoComplete="current-password"
            className="[&>input]:pr-14"
          />
          <PasswordToggle shown={showCurrent} onToggle={() => setShowCurrent((s) => !s)} />
        </div>

        <div className="relative">
          <FloatingInput
            id="new"
            label="New password"
            type={showNew ? "text" : "password"}
            value={next}
            onChange={(e) => setNext(e.target.value)}
            required
            autoComplete="new-password"
            className="[&>input]:pr-14"
          />
          <PasswordToggle shown={showNew} onToggle={() => setShowNew((s) => !s)} />
        </div>

        <FloatingInput
          id="confirm"
          label="Confirm new password"
          type={showNew ? "text" : "password"}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          autoComplete="new-password"
          error={confirm.length > 0 && !matches ? "Passwords don't match yet" : undefined}
        />

        <div className="rounded-2xl bg-[#f6f7fb] p-4 ring-1 ring-inset ring-ink-100">
          <div className="flex items-center justify-between text-xs">
            <p className="font-bold uppercase tracking-[0.16em] text-ink-500">Password strength</p>
            <p className="font-semibold tabular-nums text-ink-700">
              {satisfied}/{total}
            </p>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100" aria-hidden>
            <div
              className="h-full rounded-full bg-energy-gradient-x transition-[width] duration-300 ease-out"
              style={{ width: `${(satisfied / total) * 100}%` }}
            />
          </div>
          <ul className="mt-3 grid grid-cols-1 gap-1.5 text-xs sm:grid-cols-2">
            {rules.map((r) => (
              <li
                key={r.label}
                className={cn(
                  "flex items-center gap-2 transition-colors",
                  r.ok ? "text-accent-700" : "text-ink-500"
                )}
              >
                <span
                  className={cn(
                    "grid h-4 w-4 shrink-0 place-items-center rounded-full",
                    r.ok ? "bg-accent-100" : "bg-ink-100"
                  )}
                >
                  {r.ok ? <Check size={10} weight="bold" aria-hidden /> : <X size={10} weight="bold" aria-hidden />}
                </span>
                {r.label}
              </li>
            ))}
            <li
              className={cn(
                "flex items-center gap-2 transition-colors sm:col-span-2",
                matches ? "text-accent-700" : "text-ink-500"
              )}
            >
              <span
                className={cn(
                  "grid h-4 w-4 shrink-0 place-items-center rounded-full",
                  matches ? "bg-accent-100" : "bg-ink-100"
                )}
              >
                {matches ? <Check size={10} weight="bold" aria-hidden /> : <X size={10} weight="bold" aria-hidden />}
              </span>
              Confirmation matches
            </li>
          </ul>
        </div>

        <AuthAlert message={error} />

        <Button
          type="submit"
          size="lg"
          className="w-full"
          isLoading={submitting}
          disabled={submitting || !allValid || !matches}
        >
          {submitting ? (
            "Saving…"
          ) : (
            <>
              Set password &amp; continue <ArrowRight size={16} weight="bold" aria-hidden />
            </>
          )}
        </Button>
      </form>

      <AuthLinksRow className="mt-6 border-t border-ink-100 pt-5">
        <span className="text-ink-400">Never reuse a password from another service.</span>
        <span className="text-ink-400">Rotates every 90 days</span>
      </AuthLinksRow>
    </AuthCard>
  );
}
