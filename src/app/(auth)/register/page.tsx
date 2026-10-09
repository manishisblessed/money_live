"use client";

import { useState } from "react";
import Link from "next/link";
import {
  CheckCircle,
  PhoneCall,
  Storefront,
  UsersThree,
  TreeStructure,
  ArrowRight,
  type Icon as PhosphorIcon,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { FloatingInput, Label, Select } from "@/components/ui/Input";
import { IconTile } from "@/components/ui/Icon";
import { Turnstile, captchaConfigured } from "@/components/security/Turnstile";
import { AuthAlert, AuthCard, AuthCardHeader, AuthLinksRow } from "@/components/auth/AuthCard";
import { StepPanels, StepRail } from "@/components/auth/StepRail";
import { cn } from "@/lib/utils";

const roleMap = {
  retailer: "RETAILER",
  distributor: "DISTRIBUTOR",
  "master-distributor": "MASTER_DISTRIBUTOR",
} as const;

const STATES = [
  "Delhi",
  "Uttar Pradesh",
  "Bihar",
  "Maharashtra",
  "Karnataka",
  "Tamil Nadu",
  "West Bengal",
  "Punjab",
  "Rajasthan",
  "Gujarat",
  "Other",
];

const JOIN_STEPS = [{ label: "Your details" }, { label: "We call you back" }] as const;

const ROLE_TILES: { id: keyof typeof roleMap; label: string; icon: PhosphorIcon; hint: string }[] = [
  { id: "retailer", label: "Retailer", icon: Storefront, hint: "One shop" },
  { id: "distributor", label: "Distributor", icon: UsersThree, hint: "Manage retailers" },
  { id: "master-distributor", label: "Master Dist.", icon: TreeStructure, hint: "Regional network" },
];

export default function JoinPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    shopName: "",
    city: "",
    state: "Delhi",
    message: "",
    role: "retailer" as keyof typeof roleMap,
  });

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/join", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone.replace(/\s/g, ""),
          shopName: form.shopName || undefined,
          city: form.city || undefined,
          state: form.state || undefined,
          role: roleMap[form.role],
          message: form.message || undefined,
          captchaToken,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(
          typeof data.error === "string"
            ? data.error
            : "Could not submit your request. Please try again."
        );
        setLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  const stepIndex = submitted ? 1 : 0;

  return (
    <AuthCard size="lg">
      <StepRail steps={JOIN_STEPS} current={stepIndex} surface="card" className="mb-6" />

      <StepPanels step={stepIndex}>
        {submitted ? (
          <div className="flex flex-col items-center py-4 text-center">
            <IconTile icon={CheckCircle} tone="accent" size="xl" className="rounded-3xl" />
            <p className="mt-6 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500">
              <span className="brand-dot" aria-hidden />
              Request received
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900 md:text-3xl">
              Thanks{form.name ? `, ${form.name.split(" ")[0]}` : ""} — you&apos;re on the list.
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
              Our onboarding team will call you on{" "}
              <span className="font-semibold text-ink-700">{form.phone}</span> to verify
              your KYC and switch on your services.
            </p>
            <div className="mt-6 flex w-full max-w-sm flex-col gap-3">
              <div className="flex items-start gap-3 rounded-2xl bg-[#f6f7fb] p-4 text-left text-sm text-ink-600 ring-1 ring-inset ring-ink-100">
                <IconTile icon={PhoneCall} tone="brand" size="sm" />
                <span>
                  Keep your <span className="font-semibold text-ink-900">Aadhaar, PAN and bank details</span>{" "}
                  handy for eKYC. The call takes about 10 minutes.
                </span>
              </div>
              <Link href="/">
                <Button variant="outline" size="lg" className="w-full">
                  Back to home
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <AuthCardHeader
              eyebrow="Join eMoney"
              title="Start earning from your first transaction"
              description={
                <>
                  Share a few details and our team will reach out to finish your onboarding.
                  Already a member?{" "}
                  <Link href="/login" className="font-semibold text-brand-700 hover:underline">
                    Sign in
                  </Link>
                </>
              }
            />

            <AuthAlert className="mt-5" message={error || null} />

            <form className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
              <FloatingInput
                id="name"
                label="Full name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                hint="Exactly as printed on your Aadhaar"
                autoComplete="name"
                required
                className="sm:col-span-2"
              />
              <FloatingInput
                id="phone"
                label="Mobile number"
                type="tel"
                inputMode="numeric"
                value={form.phone}
                onChange={(e) => update("phone", e.target.value)}
                hint="10-digit, we'll call this number"
                autoComplete="tel"
                required
              />
              <FloatingInput
                id="email"
                label="Email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                autoComplete="email"
                required
              />
              <FloatingInput
                id="shopName"
                label="Shop / business name"
                value={form.shopName}
                onChange={(e) => update("shopName", e.target.value)}
                hint="Optional · e.g. Sharma Mobile World"
                autoComplete="organization"
              />
              <FloatingInput
                id="city"
                label="City"
                value={form.city}
                onChange={(e) => update("city", e.target.value)}
                hint="Optional"
                autoComplete="address-level2"
              />

              <div className="sm:col-span-2">
                <Label htmlFor="state">State</Label>
                <Select
                  id="state"
                  value={form.state}
                  onChange={(e) => update("state", e.target.value)}
                  className="h-14"
                >
                  {STATES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>

              <fieldset className="sm:col-span-2">
                <legend className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500">
                  I want to join as
                </legend>
                <div className="grid grid-cols-3 gap-2">
                  {ROLE_TILES.map((r) => {
                    const active = form.role === r.id;
                    return (
                      <button
                        type="button"
                        key={r.id}
                        onClick={() => update("role", r.id)}
                        aria-pressed={active}
                        className={cn(
                          "focus-energy flex flex-col items-start gap-2 rounded-2xl p-3 text-left transition sm:flex-row sm:items-center sm:gap-3",
                          active
                            ? "bg-white shadow-energy-sm ring-2 ring-brand-500"
                            : "bg-[#f6f7fb] ring-1 ring-ink-100 hover:bg-white hover:ring-ink-200"
                        )}
                      >
                        <IconTile icon={r.icon} tone={active ? "energy" : "ink"} size="sm" />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-ink-900">{r.label}</span>
                          <span className="block truncate text-[11px] text-ink-500">{r.hint}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <div className="sm:col-span-2">
                <Label htmlFor="message">Anything else? (optional)</Label>
                <textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => update("message", e.target.value)}
                  placeholder="Tell us anything that helps us onboard you faster."
                  rows={3}
                  maxLength={1000}
                  className="flex w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm transition-[border-color,box-shadow] duration-200 ease-out placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:shadow-[0_0_0_4px_rgba(124,58,237,0.14),0_8px_24px_-10px_rgba(244,63,94,0.25)]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="flex cursor-pointer items-start gap-3 rounded-2xl bg-[#f6f7fb] p-3.5 text-xs leading-relaxed text-ink-600 ring-1 ring-inset ring-ink-100">
                  <input
                    type="checkbox"
                    defaultChecked
                    required
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-ink-300 text-brand-600 focus:ring-brand-500"
                  />
                  <span>
                    I agree to be contacted by eMoney and accept the{" "}
                    <Link href="/legal/terms" className="font-semibold text-brand-700 hover:underline">
                      Terms
                    </Link>{" "}
                    &amp;{" "}
                    <Link href="/legal/privacy" className="font-semibold text-brand-700 hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </span>
                </label>
              </div>

              <div className="sm:col-span-2 space-y-3">
                <Turnstile onToken={setCaptchaToken} />
                <Button
                  type="submit"
                  size="lg"
                  className="w-full"
                  isLoading={loading}
                  disabled={loading || (captchaConfigured && !captchaToken)}
                >
                  {loading ? (
                    "Submitting…"
                  ) : (
                    <>
                      Submit join request <ArrowRight size={16} weight="bold" aria-hidden />
                    </>
                  )}
                </Button>
              </div>
            </form>

            <AuthLinksRow className="mt-6 border-t border-ink-100 pt-5">
              <span className="text-ink-400">Zero joining fee · no hidden charges</span>
              <span className="text-ink-400">Callback within one working day</span>
            </AuthLinksRow>
          </>
        )}
      </StepPanels>
    </AuthCard>
  );
}
