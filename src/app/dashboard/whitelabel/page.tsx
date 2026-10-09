"use client";

import { useCallback, useEffect, useState } from "react";
import { Save, AlertCircle, CheckCircle2, Rocket } from "lucide-react";
import { Globe, Headset, LockKey, PaintBrush } from "@phosphor-icons/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { FloatingInput, Input, Label } from "@/components/ui/Input";
import { IconTile } from "@/components/ui/Icon";
import { EmptyState, FadeIn, SectionCard, StatusChip } from "@/components/dashboard/patterns";

type Profile = {
  brandName: string;
  tagline: string | null;
  logoUrl: string | null;
  faviconUrl: string | null;
  primaryColor: string;
  accentColor: string;
  supportEmail: string | null;
  supportPhone: string | null;
  subdomain: string | null;
  customDomain: string | null;
  status: string;
  updatedAt?: string;
};

const EMPTY: Profile = {
  brandName: "",
  tagline: "",
  logoUrl: "",
  faviconUrl: "",
  primaryColor: "#185df5",
  accentColor: "#f97606",
  supportEmail: "",
  supportPhone: "",
  subdomain: "",
  customDomain: "",
  status: "DRAFT",
};

export default function WhitelabelPage() {
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/platform/whitelabel");
      if (res.status === 403) {
        setForbidden(true);
        return;
      }
      const data = await res.json();
      if (res.ok && data.profile) setProfile({ ...EMPTY, ...data.profile });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function set<K extends keyof Profile>(key: K, value: Profile[K]) {
    setProfile((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  async function save(goLive?: boolean) {
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const body = {
        brandName: profile.brandName.trim(),
        tagline: profile.tagline?.trim() || null,
        logoUrl: profile.logoUrl?.trim() || null,
        faviconUrl: profile.faviconUrl?.trim() || null,
        primaryColor: profile.primaryColor,
        accentColor: profile.accentColor,
        supportEmail: profile.supportEmail?.trim() || null,
        supportPhone: profile.supportPhone?.trim() || null,
        subdomain: profile.subdomain?.trim().toLowerCase() || null,
        customDomain: profile.customDomain?.trim().toLowerCase() || null,
        ...(goLive ? { status: "LIVE" as const } : {}),
      };
      const res = await fetch("/api/platform/whitelabel", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(typeof data.error === "string" ? data.error : "Check the highlighted fields and try again");
      }
      setProfile({ ...EMPTY, ...data.profile });
      setSaved(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  if (forbidden) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Platform · Brand" title="White-label portal" description="Run the platform under your own brand." />
        <EmptyState
          bordered
          icon={LockKey}
          tone="amber"
          title="White-label is for Master & Super Distributors"
          description={
            <>
              This feature is available to <strong>Master Distributor</strong> and <strong>Super Distributor</strong> accounts.
              Contact your upline to upgrade.
            </>
          }
        />
      </div>
    );
  }

  const canSave = profile.brandName.trim().length >= 2 && !saving && !loading;
  const canGoLive = canSave && Boolean(profile.subdomain?.trim() || profile.customDomain?.trim());
  const previewHost =
    profile.customDomain?.trim() ||
    (profile.subdomain?.trim() ? `${profile.subdomain.trim()}.eMoney.in` : "your-brand.eMoney.in");

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform · Brand"
        title="White-label portal"
        description="Run eMoney under your own brand, domain and colors."
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <StatusChip
              status={profile.status}
              label={profile.status === "LIVE" ? "Live" : profile.status === "SUSPENDED" ? "Suspended" : "Draft"}
            />
            <Button variant="secondary" onClick={() => save()} disabled={!canSave}>
              <Save className="h-4 w-4" /> {saving ? "Saving…" : "Save draft"}
            </Button>
            {profile.status !== "LIVE" && (
              <Button onClick={() => save(true)} disabled={!canGoLive}>
                <Rocket className="h-4 w-4" /> Go live
              </Button>
            )}
          </div>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-inset ring-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}
      {saved && !error && (
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0" /> Profile saved.
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <SectionCard
            icon={<IconTile icon={PaintBrush} tone="royal" size="sm" />}
            title="Brand identity"
            description="Name, tagline, colours and logo your network will see."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FloatingInput label="Brand name *" value={profile.brandName} onChange={(e) => set("brandName", e.target.value)} placeholder="KapoorPay" />
              <FloatingInput label="Tagline" value={profile.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} placeholder="Bharat ka apna fintech" />
              <div>
                <Label htmlFor="wl-primary">Primary color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="wl-primary"
                    type="color"
                    value={profile.primaryColor}
                    onChange={(e) => set("primaryColor", e.target.value)}
                    className="h-11 w-12 cursor-pointer rounded-2xl border border-ink-200 p-1"
                  />
                  <Input value={profile.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className="font-mono uppercase" aria-label="Primary color hex" />
                </div>
              </div>
              <div>
                <Label htmlFor="wl-accent">Accent color</Label>
                <div className="flex items-center gap-2">
                  <input
                    id="wl-accent"
                    type="color"
                    value={profile.accentColor}
                    onChange={(e) => set("accentColor", e.target.value)}
                    className="h-11 w-12 cursor-pointer rounded-2xl border border-ink-200 p-1"
                  />
                  <Input value={profile.accentColor} onChange={(e) => set("accentColor", e.target.value)} className="font-mono uppercase" aria-label="Accent color hex" />
                </div>
              </div>
              <FloatingInput label="Logo URL" value={profile.logoUrl ?? ""} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://cdn.yourbrand.in/logo.svg" />
              <FloatingInput label="Favicon URL" value={profile.faviconUrl ?? ""} onChange={(e) => set("faviconUrl", e.target.value)} placeholder="https://cdn.yourbrand.in/favicon.svg" />
            </div>
          </SectionCard>

          <SectionCard
            icon={<IconTile icon={Globe} tone="brand" size="sm" />}
            title="Domain"
            description="Where your branded portal lives."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <div className="flex items-center gap-2">
                <FloatingInput
                  label="Subdomain"
                  className="flex-1"
                  value={profile.subdomain ?? ""}
                  onChange={(e) => set("subdomain", e.target.value)}
                  placeholder="kapoorpay"
                />
                <span className="whitespace-nowrap text-sm font-medium text-ink-500">.eMoney.in</span>
              </div>
              <FloatingInput
                label="Custom domain"
                hint="Point a CNAME at the platform before going live."
                value={profile.customDomain ?? ""}
                onChange={(e) => set("customDomain", e.target.value)}
                placeholder="kapoorpay.in"
              />
            </div>
          </SectionCard>

          <SectionCard
            icon={<IconTile icon={Headset} tone="accent" size="sm" />}
            title="Support contact"
            description="Shown in the portal footer and on receipts."
          >
            <div className="grid gap-5 md:grid-cols-2">
              <FloatingInput label="Support email" value={profile.supportEmail ?? ""} onChange={(e) => set("supportEmail", e.target.value)} placeholder="hello@kapoorpay.in" />
              <FloatingInput label="Support phone (10 digits)" value={profile.supportPhone ?? ""} onChange={(e) => set("supportPhone", e.target.value)} placeholder="9876543210" maxLength={10} />
            </div>
          </SectionCard>
        </div>

        <div className="space-y-4">
          <FadeIn>
            <SectionCard padding="none" eyebrow="Live preview" title={previewHost}>
              <div
                className="relative overflow-hidden p-6 text-white"
                style={{ background: `linear-gradient(135deg, ${profile.primaryColor}, ${profile.accentColor})` }}
              >
                <div className="grain pointer-events-none absolute inset-0 opacity-20" aria-hidden />
                <p className="relative text-[11px] font-bold uppercase tracking-[0.18em] opacity-80">{profile.brandName || "Your brand"}</p>
                <p className="relative mt-3 font-display text-2xl font-semibold tracking-[-0.02em]">{profile.tagline || "Your tagline here"}</p>
                <p className="relative mt-1 text-sm text-white/85">60+ services · Pan-India · Built on eMoney</p>
                <button type="button" className="relative mt-4 rounded-full bg-white px-4 py-1.5 text-sm font-semibold" style={{ color: profile.primaryColor }}>
                  Login
                </button>
              </div>
            </SectionCard>
          </FadeIn>

          <SectionCard tone="accent" padding="sm">
            <p className="text-sm text-ink-800">
              <strong className="font-semibold text-ink-900">Powered by eMoney.</strong> Footer attribution is required on all white-labels.
            </p>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
