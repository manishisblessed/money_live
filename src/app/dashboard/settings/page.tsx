"use client";

import Link from "next/link";
import { ChevronRight, KeyRound } from "lucide-react";
import { Bell, Envelope, Fingerprint, Lock, ShieldCheck } from "@phosphor-icons/react";
import type { Icon as PhosphorIcon } from "@phosphor-icons/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card } from "@/components/ui/Card";
import { IconTile, type IconTone } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { SectionCard, Stagger, StaggerItem } from "@/components/dashboard/patterns";

const groups: {
  title: string;
  description: string;
  icon: PhosphorIcon;
  tone: IconTone;
  items: { label: string; on: boolean }[];
}[] = [
  {
    title: "Notifications",
    description: "What we ping you about and where.",
    icon: Bell,
    tone: "brand",
    items: [
      { label: "Transaction alerts (SMS)", on: true },
      { label: "Daily summary email", on: true },
      { label: "Marketing & offers", on: false },
      { label: "Commission credit alerts", on: true }
    ]
  },
  {
    title: "Security",
    description: "Keep your account locked down.",
    icon: ShieldCheck,
    tone: "accent",
    items: [
      { label: "Two-factor authentication (2FA)", on: true },
      { label: "Login alerts to email", on: true },
      { label: "Trusted devices remembered", on: true },
      { label: "Auto-logout after 15 min idle", on: false }
    ]
  },
  {
    title: "Communication",
    description: "How you'd like to hear from us.",
    icon: Envelope,
    tone: "royal",
    items: [
      { label: "WhatsApp updates", on: true },
      { label: "Voice call OTP fallback", on: false }
    ]
  }
];

const quickLinks: {
  href: string;
  title: string;
  description: string;
  icon: PhosphorIcon;
  tone: IconTone;
  badge?: string;
}[] = [
  {
    href: "/dashboard/settings/txn-pin",
    title: "Transaction PIN",
    description: "The 4-digit PIN that confirms every payment — bill pay, recharge, transfers and payouts.",
    icon: Lock,
    tone: "coral",
    badge: "Required",
  },
  {
    href: "/dashboard/settings/login-method",
    title: "Login method",
    description: "Sign in with your authenticator app or your transaction PIN. Choose your default.",
    icon: Fingerprint,
    tone: "royal",
  },
  {
    href: "/dashboard/settings/security",
    title: "Two-factor authentication",
    description: "Set up an authenticator app and download backup codes.",
    icon: ShieldCheck,
    tone: "accent",
  },
];

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Settings"
        description="Notifications, security and sign-in preferences — all in one place."
      />

      <Stagger className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {quickLinks.map((l) => (
          <StaggerItem key={l.href}>
            <Link href={l.href} className="block h-full focus-energy rounded-3xl">
              <Card interactive className="group flex h-full flex-col p-5">
                <div className="flex items-start justify-between gap-3">
                  <IconTile icon={l.icon} tone={l.tone} size="lg" />
                  {l.badge && <Badge variant="coral" size="sm">{l.badge}</Badge>}
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold tracking-[-0.02em] text-ink-900">
                  {l.title}
                </h3>
                <p className="mt-1 flex-1 text-sm text-ink-500">{l.description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-brand-700">
                  Open
                  <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Card>
            </Link>
          </StaggerItem>
        ))}
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-2">
        {groups.map((g) => (
          <SectionCard
            key={g.title}
            icon={<IconTile icon={g.icon} tone={g.tone} size="sm" />}
            title={g.title}
            description={g.description}
            padding="none"
          >
            <ul className="divide-y divide-ink-100">
              {g.items.map((it) => (
                <li
                  key={it.label}
                  className="flex items-center justify-between gap-4 px-5 py-3.5 text-sm md:px-6"
                >
                  <span className="text-ink-700">{it.label}</span>
                  <Toggle defaultOn={it.on} label={it.label} />
                </li>
              ))}
            </ul>
          </SectionCard>
        ))}

        <SectionCard
          icon={<IconTile tone="ink" size="sm"><KeyRound className="h-4 w-4" /></IconTile>}
          title="Change password"
          description="Use a strong password you don't reuse anywhere else."
        >
          <button className="text-sm font-semibold text-brand-700 hover:underline focus-energy rounded-lg">
            Send reset link to my email
          </button>
        </SectionCard>
      </div>
    </div>
  );
}

function Toggle({ defaultOn, label }: { defaultOn: boolean; label: string }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        defaultChecked={defaultOn}
        className="peer sr-only"
        aria-label={label}
      />
      <div className="h-6 w-11 rounded-full bg-ink-200 transition-colors peer-checked:bg-energy-gradient peer-focus-visible:ring-2 peer-focus-visible:ring-royal-400 peer-focus-visible:ring-offset-2" />
      <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
    </label>
  );
}
