"use client";

import { useState } from "react";
import { Send, CheckCircle2, Copy } from "lucide-react";
import { LinkSimple, UserPlus, CheckCircle } from "@phosphor-icons/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { FloatingInput } from "@/components/ui/Input";
import { IconTile } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { FadeIn, SectionCard } from "@/components/dashboard/patterns";
import { type Role } from "@/lib/auth";
import { useAuth } from "@/lib/useAuth";

export default function OnboardInvitePage() {
  const { session } = useAuth();
  const role: Role = session?.role ?? "retailer";
  const [done, setDone] = useState(false);
  const [onboardingLink, setOnboardingLink] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
  });

  const childLabel =
    role === "super-distributor" ? "Master Distributor" :
    role === "master-distributor" ? "Distributor" :
    "Retailer";

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name || undefined,
          email: form.email,
          phone: form.phone.replace(/\s/g, ""),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to send invite");
        return;
      }

      setOnboardingLink(data.invite.onboardingLink);
      setDone(true);
    } catch {
      setError("Network error — please try again");
    } finally {
      setSubmitting(false);
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(onboardingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (done) {
    return (
      <div className="mx-auto max-w-xl">
        <FadeIn>
          <SectionCard tone="accent" padding="lg" className="text-center">
            <IconTile icon={CheckCircle} tone="accent" size="xl" className="mx-auto" />
            <h2 className="mt-5 font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900 md:text-3xl">
              Invite sent
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
              An onboarding link has gone to <strong>{form.email}</strong> and <strong>{form.phone}</strong>.
              They&apos;ll get an email and SMS with the registration link.
            </p>

            <div className="mt-6 rounded-2xl bg-white p-4 text-left ring-1 ring-inset ring-ink-100">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.16em] text-ink-500">
                Onboarding link
              </p>
              <div className="flex items-center gap-2">
                <code className="flex-1 truncate rounded-xl bg-ink-50 px-3 py-2 font-mono text-xs text-ink-700">
                  {onboardingLink}
                </code>
                <Button variant="outline" size="icon" onClick={copyLink} title="Copy link" aria-label="Copy onboarding link">
                  {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="mt-2 text-xs text-ink-500">
                You can also share this link manually before it expires.
              </p>
            </div>

            <div className="mt-6">
              <Button onClick={() => { setDone(false); setForm({ name: "", phone: "", email: "" }); }}>
                <Send className="h-4 w-4" /> Send another invite
              </Button>
            </div>
          </SectionCard>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Network · Invite"
        title={`Invite a ${childLabel}`}
        description={`Send an onboarding link via email and SMS. The ${childLabel.toLowerCase()} completes their own registration and KYC.`}
      />

      <div className="mx-auto grid max-w-4xl gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <SectionCard
            icon={<IconTile icon={UserPlus} tone="brand" size="sm" />}
            title="Invitee details"
            description="Just a name and how to reach them — they fill in the rest."
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
                  {error}
                </div>
              )}

              <FloatingInput
                label="Name (optional)"
                value={form.name}
                onChange={(e) => updateForm("name", e.target.value)}
              />
              <FloatingInput
                label="Mobile number *"
                required
                inputMode="tel"
                value={form.phone}
                onChange={(e) => updateForm("phone", e.target.value)}
                hint="10-digit mobile, e.g. 98765 43210"
              />
              <FloatingInput
                label="Email *"
                required
                type="email"
                value={form.email}
                onChange={(e) => updateForm("email", e.target.value)}
              />

              <Button type="submit" isLoading={submitting} className="w-full" size="lg">
                <Send className="h-4 w-4" />
                Send onboarding invite
              </Button>
            </form>
          </SectionCard>
        </div>

        <div className="space-y-4 lg:col-span-2">
          <SectionCard tone="brand">
            <div className="flex items-start gap-3">
              <IconTile icon={LinkSimple} tone="brand" size="sm" />
              <p className="text-sm text-ink-700">
                An onboarding link is sent to the invitee. They register themselves — you don&apos;t
                need to enter their personal details.
              </p>
            </div>
          </SectionCard>

          <SectionCard title="Inviting as" padding="md">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="font-display text-lg font-semibold tracking-[-0.02em] text-ink-900">{childLabel}</p>
                <p className="text-xs text-ink-500">This person will be mapped under your network.</p>
              </div>
              <Badge variant="energy">Direct child</Badge>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  );
}
