"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Save,
  BadgeCheck,
  ShieldCheck,
  Upload,
  FileCheck,
  Clock,
  AlertTriangle,
  Loader2,
  Mail,
  Phone,
} from "lucide-react";
import { IdentificationCard, UserCircle, ShieldCheck as ShieldCheckPh } from "@phosphor-icons/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { FloatingInput, Input, Label } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IconTile } from "@/components/ui/Icon";
import {
  KeyValueList,
  MetaItem,
  ProfileHero,
  SectionCard,
  StatusChip,
} from "@/components/dashboard/patterns";
import { type Session } from "@/lib/auth";
import { useAuth } from "@/lib/useAuth";
import { cn } from "@/lib/utils";

type KycData = {
  id: string;
  status: "NOT_STARTED" | "PENDING_REVIEW" | "APPROVED" | "REJECTED";
  panNumber: string | null;
  aadhaarLast4: string | null;
  gstin: string | null;
  dob: string | null;
  rejectedReason: string | null;
  submittedAt: string | null;
  reviewedAt: string | null;
} | null;

type DocRecord = {
  id: string;
  type: string;
  publicId: string;
  url: string;
  format: string | null;
  uploadedAt: string;
};

const DOC_TYPES = [
  { key: "PAN", label: "PAN Card" },
  { key: "AADHAAR_FRONT", label: "Aadhaar (Front)" },
  { key: "AADHAAR_BACK", label: "Aadhaar (Back)" },
  { key: "SHOP_PHOTO", label: "Shop Photo" },
  { key: "BANK_PROOF", label: "Bank Proof" },
] as const;

const KYC_LABEL: Record<NonNullable<KycData>["status"], string> = {
  APPROVED: "KYC verified",
  PENDING_REVIEW: "KYC under review",
  REJECTED: "KYC rejected",
  NOT_STARTED: "KYC not submitted",
};

export default function ProfilePage() {
  const { session: authSession } = useAuth();
  const [session, setSession] = useState<Session | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // KYC state
  const [kyc, setKyc] = useState<KycData>(null);
  const [docs, setDocs] = useState<DocRecord[]>([]);
  const [kycLoading, setKycLoading] = useState(true);
  const [pan, setPan] = useState("");
  const [aadhaar4, setAadhaar4] = useState("");
  const [gstin, setGstin] = useState("");
  const [dob, setDob] = useState("");
  const [kycSubmitting, setKycSubmitting] = useState(false);
  const [kycError, setKycError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);

  useEffect(() => {
    if (authSession && !session) {
      setSession({ ...authSession });
    }
  }, [authSession, session]);

  const fetchKyc = useCallback(async () => {
    try {
      setKycLoading(true);
      const res = await fetch("/api/kyc");
      if (res.ok) {
        const json = await res.json();
        setKyc(json.kyc);
        setDocs(json.documents);
        if (json.kyc) {
          setPan(json.kyc.panNumber ?? "");
          setAadhaar4(json.kyc.aadhaarLast4 ?? "");
          setGstin(json.kyc.gstin ?? "");
          setDob(json.kyc.dob ? json.kyc.dob.slice(0, 10) : "");
        }
      }
    } finally {
      setKycLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchKyc();
  }, [fetchKyc]);

  if (!session) return null;

  function update<K extends keyof Session>(k: K, v: Session[K]) {
    if (!session) return;
    setSession({ ...session, [k]: v });
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!session) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function uploadDoc(type: string, file: File) {
    setUploading(type);
    try {
      // 1. Get signed params
      const signRes = await fetch("/api/uploads/sign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, isSensitive: true }),
      });
      if (!signRes.ok) throw new Error("Failed to get upload signature");
      const params = await signRes.json();

      // 2. Upload to Cloudinary
      const formData = new FormData();
      formData.append("file", file);
      formData.append("api_key", params.apiKey);
      formData.append("timestamp", String(params.timestamp));
      formData.append("signature", params.signature);
      formData.append("folder", params.folder);
      formData.append("type", params.type);

      const uploadRes = await fetch(
        `https://api.cloudinary.com/v1_1/${params.cloudName}/auto/upload`,
        { method: "POST", body: formData }
      );
      if (!uploadRes.ok) throw new Error("Cloudinary upload failed");
      const cloudResult = await uploadRes.json();

      // 3. Persist document record
      const docRes = await fetch("/api/documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          publicId: cloudResult.public_id,
          url: cloudResult.secure_url,
          resourceType: cloudResult.resource_type,
          format: cloudResult.format,
          bytes: cloudResult.bytes,
          width: cloudResult.width,
          height: cloudResult.height,
        }),
      });
      if (!docRes.ok) throw new Error("Failed to save document");

      await fetchKyc();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(null);
    }
  }

  async function submitKyc(e: React.FormEvent) {
    e.preventDefault();
    setKycError(null);
    setKycSubmitting(true);
    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          panNumber: pan.toUpperCase(),
          aadhaarLast4: aadhaar4,
          gstin: gstin || undefined,
          dob: dob || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(
          typeof json.error === "string"
            ? json.error
            : JSON.stringify(json.error)
        );
      }
      await fetchKyc();
    } catch (err) {
      setKycError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setKycSubmitting(false);
    }
  }

  const kycStatus = kyc?.status ?? "NOT_STARTED";
  const canSubmitKyc =
    kycStatus === "NOT_STARTED" || kycStatus === "REJECTED";
  const uploadedTypes = new Set(docs.map((d) => d.type));

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Profile"
        description="Your details, KYC status and account identity in one place."
      />

      <ProfileHero
        name={session.name}
        subtitle={session.email}
        chips={
          <>
            <Badge variant="brand" className="capitalize">
              {session.role}
            </Badge>
            {session.userCode && (
              <Badge variant="default" className="font-mono">
                {session.userCode}
              </Badge>
            )}
            {kycLoading ? (
              <Badge variant="default">Checking KYC…</Badge>
            ) : (
              <StatusChip status={kycStatus} label={KYC_LABEL[kycStatus]} />
            )}
          </>
        }
        meta={
          <>
            <MetaItem icon={<Mail className="h-3.5 w-3.5" />}>{session.email}</MetaItem>
            {session.phone && (
              <MetaItem icon={<Phone className="h-3.5 w-3.5" />}>{session.phone}</MetaItem>
            )}
          </>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Sidebar */}
        <aside className="space-y-6">
          <SectionCard
            icon={<IconTile icon={ShieldCheckPh} tone={kycStatus === "APPROVED" ? "accent" : kycStatus === "REJECTED" ? "coral" : "amber"} size="sm" />}
            title="KYC status"
            padding="md"
          >
            {kycLoading ? (
              <p className="text-sm text-ink-500">Checking your KYC…</p>
            ) : (
              <div className="space-y-4">
                <StatusChip status={kycStatus} label={KYC_LABEL[kycStatus]} size="lg" />

                {kycStatus === "REJECTED" && kyc?.rejectedReason && (
                  <p className="rounded-2xl bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-inset ring-rose-100">
                    {kyc.rejectedReason}
                  </p>
                )}

                {kycStatus === "APPROVED" && (
                  <KeyValueList
                    dense
                    items={[
                      ...(kyc?.panNumber
                        ? [{ label: "PAN", value: kyc.panNumber, mono: true }]
                        : []),
                      ...(kyc?.aadhaarLast4
                        ? [{ label: "Aadhaar", value: `XXXX-XXXX-${kyc.aadhaarLast4}`, mono: true }]
                        : []),
                      {
                        label: "Account",
                        value: (
                          <span className="inline-flex items-center gap-1 text-emerald-700">
                            <BadgeCheck className="h-3.5 w-3.5" /> Active
                          </span>
                        ),
                      },
                    ]}
                  />
                )}

                {kycStatus === "NOT_STARTED" && (
                  <p className="text-xs text-ink-500">
                    Submit your PAN and Aadhaar details below to activate payments.
                  </p>
                )}
              </div>
            )}
          </SectionCard>
        </aside>

        {/* Main content */}
        <div className="space-y-6 lg:col-span-2">
          {/* Profile form */}
          <SectionCard
            icon={<IconTile icon={UserCircle} tone="brand" size="sm" />}
            title="Personal details"
            description="Keep your contact details current so OTPs and alerts reach you."
          >
            <form onSubmit={save} className="grid gap-4 sm:grid-cols-2">
              <FloatingInput
                id="name"
                label="Full name"
                className="sm:col-span-2"
                value={session.name}
                onChange={(e) => update("name", e.target.value)}
              />
              <FloatingInput
                id="email"
                label="Email"
                type="email"
                value={session.email}
                onChange={(e) => update("email", e.target.value)}
              />
              <FloatingInput
                id="phone"
                label="Phone"
                value={session.phone}
                onChange={(e) => update("phone", e.target.value)}
              />
              <div className="sm:col-span-2">
                <Button type="submit" isLoading={saving} disabled={saving}>
                  <Save className="h-4 w-4" />
                  {saving ? "Saving…" : saved ? "Saved!" : "Save changes"}
                </Button>
              </div>
            </form>
          </SectionCard>

          {/* KYC Section */}
          {canSubmitKyc && (
            <SectionCard
              icon={<IconTile icon={IdentificationCard} tone="royal" size="sm" />}
              title="Complete your KYC"
              description="Upload the documents and fill in your details to activate your account."
            >
              {kycStatus === "REJECTED" && kyc?.rejectedReason && (
                <div className="mb-5 flex items-start gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    <strong>Previous submission rejected:</strong>{" "}
                    {kyc.rejectedReason}. Fix the issue and re-submit.
                  </span>
                </div>
              )}

              {/* Document uploads */}
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">Documents</p>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {DOC_TYPES.map((dt) => {
                  const uploaded = uploadedTypes.has(dt.key);
                  const busy = uploading === dt.key;
                  const required = dt.key === "PAN" || dt.key === "AADHAAR_FRONT";
                  return (
                    <div
                      key={dt.key}
                      className={cn(
                        "flex items-center justify-between gap-3 rounded-2xl px-4 py-3 ring-1 ring-inset transition-colors",
                        uploaded
                          ? "bg-emerald-50 ring-emerald-200"
                          : "bg-ink-50/60 ring-ink-100"
                      )}
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={cn(
                            "grid h-8 w-8 shrink-0 place-items-center rounded-xl",
                            uploaded ? "bg-white text-emerald-600" : "bg-white text-ink-400"
                          )}
                        >
                          {uploaded ? <FileCheck className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
                        </span>
                        <span
                          className={cn(
                            "truncate text-sm font-medium",
                            uploaded ? "text-emerald-800" : "text-ink-700"
                          )}
                        >
                          {dt.label}
                          {required && <span className="text-coral-500"> *</span>}
                        </span>
                      </div>
                      {uploaded ? (
                        <Badge variant="success" size="sm">Uploaded</Badge>
                      ) : (
                        <label className="cursor-pointer">
                          <input
                            type="file"
                            accept="image/*,.pdf"
                            className="hidden"
                            disabled={busy}
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) uploadDoc(dt.key, f);
                            }}
                          />
                          <span className="inline-flex h-8 items-center rounded-xl bg-white px-3 text-xs font-semibold text-ink-700 ring-1 ring-inset ring-ink-200 transition-colors hover:text-brand-700 hover:ring-brand-300">
                            {busy ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              "Upload"
                            )}
                          </span>
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* KYC details form */}
              <form onSubmit={submitKyc} className="mt-6 space-y-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-ink-500">Identity details</p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FloatingInput
                    id="pan"
                    label="PAN number *"
                    required
                    maxLength={10}
                    className="[&_input]:uppercase"
                    value={pan}
                    onChange={(e) => setPan(e.target.value)}
                  />
                  <FloatingInput
                    id="aadhaar4"
                    label="Aadhaar last 4 digits *"
                    required
                    maxLength={4}
                    inputMode="numeric"
                    value={aadhaar4}
                    onChange={(e) =>
                      setAadhaar4(e.target.value.replace(/\D/g, ""))
                    }
                  />
                  <FloatingInput
                    id="gstin"
                    label="GSTIN (optional)"
                    maxLength={15}
                    className="[&_input]:uppercase"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value)}
                  />
                  <div>
                    <Label htmlFor="dob" className="text-xs">Date of birth (optional)</Label>
                    <Input
                      id="dob"
                      type="date"
                      className="h-14"
                      value={dob}
                      onChange={(e) => setDob(e.target.value)}
                    />
                  </div>
                </div>

                {kycError && (
                  <div className="flex items-start gap-2 rounded-2xl bg-rose-50 px-3 py-2 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{kycError}</span>
                  </div>
                )}

                <Button type="submit" isLoading={kycSubmitting} disabled={kycSubmitting}>
                  <ShieldCheck className="h-4 w-4" />
                  {kycSubmitting ? "Submitting…" : "Submit KYC for review"}
                </Button>
              </form>
            </SectionCard>
          )}

          {kycStatus === "PENDING_REVIEW" && (
            <SectionCard tone="amber" padding="lg" className="text-center">
              <IconTile icon={ShieldCheckPh} tone="amber" size="xl" className="mx-auto" />
              <h3 className="mt-4 font-display text-xl font-semibold tracking-[-0.02em] text-ink-900">
                KYC under review
              </h3>
              <p className="mx-auto mt-1 max-w-md text-sm text-ink-600">
                Your documents are with our team. This usually takes 1–2 business days —
                we&apos;ll notify you the moment your account is activated.
              </p>
              {kyc?.submittedAt && (
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-ink-500">
                  <Clock className="h-3.5 w-3.5" />
                  Submitted on{" "}
                  {new Date(kyc.submittedAt).toLocaleDateString("en-IN", {
                    dateStyle: "long",
                  })}
                </p>
              )}
            </SectionCard>
          )}
        </div>
      </div>
    </div>
  );
}
