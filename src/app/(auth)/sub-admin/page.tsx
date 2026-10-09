"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { ArrowRight, UserGear } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { FloatingInput } from "@/components/ui/Input";
import { IconTile } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { TwoFactorStep } from "@/components/auth/TwoFactorStep";
import { PinLoginStep } from "@/components/auth/PinLoginStep";
import { LoginMethodChoice } from "@/components/auth/LoginMethodChoice";
import { LocationGate, type LocationData } from "@/components/auth/LocationGate";
import {
  AuthAlert,
  AuthCard,
  AuthCardHeader,
  AuthLinksRow,
  PasswordToggle,
  formatCooldown,
} from "@/components/auth/AuthCard";
import { StepPanels } from "@/components/auth/StepRail";

export default function SubAdminLoginPage() {
  return (
    <LocationGate>
      {(location) => <SubAdminLoginForm location={location} />}
    </LocationGate>
  );
}

function SubAdminLoginForm({ location }: { location: LocationData }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [cooldownSec, setCooldownSec] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback((seconds: number) => {
    setCooldownSec(seconds);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setCooldownSec((prev) => {
        if (prev <= 1) { clearInterval(cooldownRef.current!); cooldownRef.current = null; return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => { return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); }; }, []);

  const rateLimited = cooldownSec > 0;

  const [step, setStep] = useState<"credentials" | "choose" | "2fa" | "pinlogin">("credentials");
  const [tempToken, setTempToken] = useState("");
  const [userName, setUserName] = useState("");
  const [pinRiskAccepted, setPinRiskAccepted] = useState(false);
  const [canChoose, setCanChoose] = useState(false);

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
          identifier: email.trim(),
          password,
          portal: "staff",
          location: { lat: location.latitude, lng: location.longitude, accuracy: location.accuracy },
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) {
          const retrySec = data.retryAfterSec ?? Math.ceil(parseInt(res.headers.get("Retry-After") || "60", 10));
          startCooldown(retrySec);
        }
        setError(data.error || "Invalid credentials.");
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
        router.push("/dashboard");
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
        userEmail={email}
        onBack={backFromFactorStep}
      />
    );
  } else {
    content = (
      <>
        <AuthCardHeader
          tone="staff"
          eyebrow="Operations"
          title="Sub-Admin sign in"
          description="Use the credentials issued by your Admin. Every action is attributed to your sub-admin ID."
          icon={<IconTile icon={UserGear} tone="energy" size="lg" />}
          badge={<Badge variant="royal" dot>Staff access</Badge>}
        />

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
            id="email"
            label="Sub-admin email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
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

          <div className="flex justify-end">
            <Link href="#" className="text-xs font-semibold text-brand-700 hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            size="lg"
            className="w-full"
            isLoading={loading}
            disabled={loading || rateLimited}
          >
            {loading
              ? "Verifying…"
              : rateLimited
                ? `Wait ${formatCooldown(cooldownSec)}`
                : <>Sign in as Sub-Admin <ArrowRight size={16} weight="bold" aria-hidden /></>}
          </Button>
        </form>

        <AuthLinksRow className="mt-6 border-t border-ink-100 pt-5">
          <span>
            Admin?{" "}
            <Link href="/admin" className="font-semibold text-brand-700 hover:underline">
              Use the admin login
            </Link>
          </span>
          <span className="text-ink-400">2FA enforced · actions audited</span>
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
