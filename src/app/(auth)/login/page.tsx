"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Storefront,
  UsersThree,
  TreeStructure,
  Crown,
  ArrowRight,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { FloatingInput } from "@/components/ui/Input";
import { IconTile } from "@/components/ui/Icon";
import { TwoFactorStep } from "@/components/auth/TwoFactorStep";
import { PinLoginStep } from "@/components/auth/PinLoginStep";
import { LoginMethodChoice } from "@/components/auth/LoginMethodChoice";
import { LocationGate, type LocationData } from "@/components/auth/LocationGate";
import { Turnstile, captchaConfigured } from "@/components/security/Turnstile";
import {
  AuthAlert,
  AuthCard,
  AuthCardHeader,
  AuthLinksRow,
  PasswordToggle,
  formatCooldown,
} from "@/components/auth/AuthCard";
import { StepPanels } from "@/components/auth/StepRail";
import { cn } from "@/lib/utils";

type PublicRole = "retailer" | "distributor" | "master-distributor" | "super-distributor";

const roleOptions: { id: PublicRole; label: string; icon: PhosphorIcon; tagline: string }[] = [
  { id: "retailer", label: "Retailer", icon: Storefront, tagline: "Run a single shop" },
  { id: "distributor", label: "Distributor", icon: UsersThree, tagline: "Manage retailers" },
  { id: "master-distributor", label: "Master Dist.", icon: TreeStructure, tagline: "White-label & API" },
  { id: "super-distributor", label: "Super Dist.", icon: Crown, tagline: "Multi-state network" },
];

export default function LoginPage() {
  return (
    <LocationGate>
      {(location) => <LoginForm location={location} />}
    </LocationGate>
  );
}

function LoginForm({ location }: { location: LocationData }) {
  const router = useRouter();
  const [role, setRole] = useState<PublicRole>("retailer");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");

  // Rate-limit cooldown state
  const [cooldownSec, setCooldownSec] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback((seconds: number) => {
    setCooldownSec(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldownSec((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current!);
          cooldownRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  const rateLimited = cooldownSec > 0;

  // 2FA state
  const [step, setStep] = useState<"credentials" | "choose" | "2fa" | "pinlogin">("credentials");
  const [tempToken, setTempToken] = useState("");
  const [userName, setUserName] = useState("");
  const [pinRiskAccepted, setPinRiskAccepted] = useState(false);
  // True when the account has BOTH factors available, so "Start over" from a
  // factor step returns to the chooser instead of the password form.
  const [canChoose, setCanChoose] = useState(false);

  function pickRole(r: PublicRole) {
    setRole(r);
  }

  function resetToCredentials() {
    setStep("credentials");
    setTempToken("");
    setPassword("");
    setError("");
    setCanChoose(false);
  }

  function backFromFactorStep() {
    if (canChoose) {
      setStep("choose");
      setError("");
    } else {
      resetToCredentials();
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rateLimited) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          role,
          portal: "network",
          location: { lat: location.latitude, lng: location.longitude, accuracy: location.accuracy },
          captchaToken,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          const retrySec = data.retryAfterSec ?? Math.ceil(
            parseInt(res.headers.get("Retry-After") || "60", 10)
          );
          startCooldown(retrySec);
        }
        setError(data.error || "Invalid email/phone or password.");
        setLoading(false);
        return;
      }

      if (data.needsMethodChoice) {
        setTempToken(data.tempToken);
        setUserName(data.user?.name || "");
        setPinRiskAccepted(Boolean(data.riskAccepted));
        setCanChoose(true);
        setStep(
          data.preferredMethod === "2fa" || data.preferredMethod === "pinlogin"
            ? data.preferredMethod
            : "choose"
        );
        setLoading(false);
        return;
      }

      if (data.needsPinLogin) {
        setTempToken(data.tempToken);
        setUserName(data.user?.name || "");
        setPinRiskAccepted(Boolean(data.riskAccepted));
        setStep("pinlogin");
        setLoading(false);
        return;
      }

      if (data.needs2FA) {
        setTempToken(data.tempToken);
        setUserName(data.user?.name || "");
        setStep("2fa");
        setLoading(false);
        return;
      }

      if (data.needsSetup) {
        const result = await signIn("token-login", {
          grant: data.grant,
          redirect: false,
        });
        if (result?.error) {
          setError("Login failed.");
          setLoading(false);
          return;
        }
        router.push("/dashboard/settings/security");
        router.refresh();
        return;
      }
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  let content: React.ReactNode;

  if (step === "choose") {
    content = (
      <LoginMethodChoice
        userName={userName}
        onChoose={(method) => setStep(method)}
        onBack={resetToCredentials}
      />
    );
  } else if (step === "pinlogin") {
    content = (
      <PinLoginStep
        tempToken={tempToken}
        userName={userName}
        riskAlreadyAccepted={pinRiskAccepted}
        onBack={backFromFactorStep}
      />
    );
  } else if (step === "2fa") {
    content = (
      <TwoFactorStep
        tempToken={tempToken}
        userName={userName}
        userEmail={identifier}
        onBack={backFromFactorStep}
      />
    );
  } else {
    content = (
      <>
        <AuthCardHeader
          eyebrow="Welcome back"
          title="Sign in to your shop"
          description={
            <>
              New to eMoney?{" "}
              <Link href="/register" className="font-semibold text-brand-700 hover:underline">
                Request to join
              </Link>{" "}
              — we&apos;ll call you back the same day.
            </>
          }
        />

        <fieldset className="mt-6">
          <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500">
            I am a
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {roleOptions.map((r) => {
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => pickRole(r.id)}
                  aria-pressed={active}
                  className={cn(
                    "focus-energy group flex items-center gap-3 rounded-2xl p-3 text-left transition",
                    active
                      ? "bg-white shadow-energy-sm ring-2 ring-brand-500"
                      : "bg-[#f6f7fb] ring-1 ring-ink-100 hover:bg-white hover:ring-ink-200"
                  )}
                >
                  <IconTile icon={r.icon} tone={active ? "energy" : "ink"} size="md" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-ink-900">{r.label}</span>
                    <span className="block truncate text-xs text-ink-500">{r.tagline}</span>
                  </span>
                </button>
              );
            })}
          </div>
        </fieldset>

        <AuthAlert className="mt-5" message={error || null} />
        <AuthAlert
          className="mt-3"
          tone="warning"
          message={
            rateLimited ? (
              <>
                Too many attempts. Try again in{" "}
                <span className="font-bold tabular-nums">{formatCooldown(cooldownSec)}</span>
              </>
            ) : null
          }
        />

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          <FloatingInput
            id="identifier"
            label="Email or mobile number"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            required
          />

          <div className="relative">
            <FloatingInput
              id="password"
              label="Password"
              type={showPwd ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              className="[&>input]:pr-14"
              required
            />
            <PasswordToggle shown={showPwd} onToggle={() => setShowPwd((s) => !s)} />
          </div>

          <div className="flex items-center justify-between gap-4 text-sm">
            <label className="flex cursor-pointer items-center gap-2 text-ink-700">
              <input
                type="checkbox"
                defaultChecked
                className="h-4 w-4 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
              />
              Keep me signed in
            </label>
            <Link
              href="#"
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Turnstile onToken={setCaptchaToken} />

          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={loading}
            disabled={loading || rateLimited || (captchaConfigured && !captchaToken)}
          >
            {loading
              ? "Verifying…"
              : rateLimited
                ? `Wait ${formatCooldown(cooldownSec)}`
                : <>Continue <ArrowRight size={16} weight="bold" aria-hidden /></>}
          </Button>
        </form>

        <AuthLinksRow className="mt-6 border-t border-ink-100 pt-5">
          <span>
            Trouble signing in?{" "}
            <Link href="/contact" className="font-semibold text-brand-700 hover:underline">
              Talk to support
            </Link>
          </span>
          <span className="text-ink-400">Protected by 2-factor &amp; location checks</span>
        </AuthLinksRow>
      </>
    );
  }

  return (
    <AuthCard>
      <StepPanels step={step}>{content}</StepPanels>
    </AuthCard>
  );
}
