"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  ArrowDown,
  CheckCircle,
  FileText,
  ShieldCheck,
  UploadSimple,
  XCircle,
  CircleNotch,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { GpsPhotoCapture } from "@/components/kyc/GpsPhotoCapture";
import { SelfieCapture } from "@/components/kyc/SelfieCapture";
import { LivenessVideoCapture } from "@/components/kyc/LivenessVideoCapture";
import { InAppBrowserWarning } from "@/components/kyc/InAppBrowserWarning";
import { AuthAlert, AuthCard, AuthCardHeader } from "@/components/auth/AuthCard";
import { StepPanels, StepRail } from "@/components/auth/StepRail";
import { cn } from "@/lib/utils";

type ResubmitDoc = { type: string; label: string; reason: string | null; done?: boolean };

type InviteData = {
  id: string;
  name: string | null;
  role: string;
  status: string;
  email: string;
  phone: string;
  expiresAt: string;
};

const GPS_TYPES = new Set([
  "GPS_PHOTO_OUTSIDE",
  "GPS_PHOTO_INSIDE",
  "GPS_SELFIE_DISTRIBUTOR",
]);

const IMAGE_ONLY = new Set([
  "SIGNATURE",
  "GPS_PHOTO_OUTSIDE",
  "GPS_PHOTO_INSIDE",
  "GPS_SELFIE_DISTRIBUTOR",
  "SELFIE",
]);

function acceptFor(type: string): string {
  return IMAGE_ONLY.has(type) ? "image/*" : "image/*,.pdf";
}

/**
 * Document types that ship a prefilled PDF the applicant must download, sign,
 * and upload back. The path is the onboarding download endpoint for that form.
 */
const PREFILLED_FORMS: Record<string, { path: string; label: string }> = {
  SELF_DECLARATION: { path: "declaration/download", label: "Download Prefilled Self-Declaration" },
  PG_FORM: { path: "pg-form/download", label: "Download Prefilled PG Form" },
};

const RESUBMIT_STEPS = [
  { label: "Re-upload" },
  { label: "Submit for review" },
  { label: "Back under review" },
] as const;

function LoadingCard() {
  return (
    <AuthCard size="lg" className="grid min-h-[16rem] place-items-center" aria-busy>
      <div className="flex items-center gap-3 text-sm text-ink-500">
        <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-energy-gradient" />
        Loading your re-upload request…
      </div>
    </AuthCard>
  );
}

export default function ResubmitPage() {
  return (
    <Suspense fallback={<LoadingCard />}>
      <ResubmitInner />
    </Suspense>
  );
}

function ResubmitInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteData | null>(null);
  const [docs, setDocs] = useState<ResubmitDoc[]>([]);
  const [done, setDone] = useState<Record<string, boolean>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const load = useCallback(async () => {
    if (!token) {
      setError("Invalid link. No token found.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/onboard/${token}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "This link is not valid.");
        setLoading(false);
        return;
      }
      if (data.invite?.status !== "RESUBMIT") {
        setError(
          "This link is not open for document re-upload. It may have already been submitted."
        );
        setLoading(false);
        return;
      }
      const resubmitDocs: ResubmitDoc[] = data.resubmit?.documents ?? [];
      setInvite(data.invite);
      setDocs(resubmitDocs);
      // Hydrate completion state so a mid-session reload keeps re-uploaded
      // documents marked as done.
      const initialDone: Record<string, boolean> = {};
      for (const d of resubmitDocs) if (d.done) initialDone[d.type] = true;
      setDone(initialDone);
    } catch {
      setError("Could not load your re-upload request. Please try again.");
    }
    setLoading(false);
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  const markDone = useCallback((type: string) => {
    setDone((prev) => ({ ...prev, [type]: true }));
  }, []);

  // ── Cloudinary document upload (file docs + GPS photos) ──
  const uploadDocument = useCallback(
    async (
      type: string,
      file: File,
      opts?: { gps?: { latitude: number; longitude: number; accuracy?: number; capturedAt?: string; source?: string } }
    ) => {
      setUploading(type);
      setUploadError(null);
      try {
        const signRes = await fetch(`/api/onboard/${token}/documents/sign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
        if (!signRes.ok) throw new Error("Failed to get upload signature");
        const params = await signRes.json();

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
        if (!uploadRes.ok) throw new Error("Upload failed");
        const cloudResult = await uploadRes.json();

        const docRes = await fetch(`/api/onboard/${token}/documents`, {
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
            gpsLatitude: opts?.gps?.latitude,
            gpsLongitude: opts?.gps?.longitude,
            gpsAccuracy: opts?.gps?.accuracy,
            gpsCapturedAt: opts?.gps?.capturedAt,
            gpsSource: opts?.gps?.source,
          }),
        });
        if (!docRes.ok) {
          const j = await docRes.json().catch(() => ({}));
          throw new Error(j.error ?? "Failed to save document");
        }
        markDone(type);
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
      }
      setUploading(null);
    },
    [token, markDone]
  );

  // ── Selfie upload (private S3, with Cloudinary fallback) ──
  const uploadSelfie = useCallback(
    async (file: File) => {
      setUploading("SELFIE");
      setUploadError(null);
      try {
        const contentType = file.type || "image/jpeg";
        const presignRes = await fetch(`/api/onboard/${token}/selfie/presign`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contentType }),
        });
        if (!presignRes.ok) {
          await uploadDocument("SELFIE", file);
          return;
        }
        const presign = await presignRes.json();

        const putRes = await fetch(presign.uploadUrl, {
          method: "PUT",
          headers: { "Content-Type": contentType },
          body: file,
        });
        if (!putRes.ok) throw new Error("Upload to storage failed");

        const completeRes = await fetch(`/api/onboard/${token}/selfie/complete`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: presign.key,
            uploadToken: presign.uploadToken,
            contentType,
          }),
        });
        if (!completeRes.ok) throw new Error("Failed to confirm selfie upload");
        markDone("SELFIE");
      } catch {
        await uploadDocument("SELFIE", file);
      }
      setUploading(null);
    },
    [token, uploadDocument, markDone]
  );

  const allDone = docs.length > 0 && docs.every((d) => done[d.type]);

  async function submit() {
    setSubmitting(true);
    setUploadError(null);
    try {
      const res = await fetch(`/api/onboard/${token}/resubmit`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(
          data.error ??
            "Could not submit. Please make sure every requested document is re-uploaded."
        );
        setSubmitting(false);
        return;
      }
      setSubmitted(true);
    } catch {
      setUploadError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  if (loading) {
    return <LoadingCard />;
  }

  if (error) {
    return (
      <AuthCard className="text-center">
        <IconTile icon={XCircle} tone="coral" size="xl" className="mx-auto rounded-3xl" />
        <p className="mt-6 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500">
          <span className="brand-dot" aria-hidden />
          Document re-upload
        </p>
        <h1 className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900">
          Link unavailable
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-ink-500" aria-live="polite">
          {error}
        </p>
      </AuthCard>
    );
  }

  const firstName = invite?.name?.split(" ")[0] ?? "there";
  const doneCount = docs.filter((d) => done[d.type]).length;
  const stepIndex = submitted ? 2 : allDone ? 1 : 0;

  return (
    <AuthCard size="lg">
      <StepRail steps={RESUBMIT_STEPS} current={stepIndex} surface="card" className="mb-6" />

      <StepPanels step={submitted ? "done" : "upload"}>
        {submitted ? (
          <div className="flex flex-col items-center py-4 text-center">
            <IconTile icon={CheckCircle} tone="accent" size="xl" className="rounded-3xl" />
            <p className="mt-6 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500">
              <span className="brand-dot" aria-hidden />
              All done
            </p>
            <h1 className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900 md:text-3xl">
              Your documents are back under review
            </h1>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
              Thanks, {firstName}. We&apos;ll email you the moment your application is
              approved. No further action is needed.
            </p>
          </div>
        ) : (
          <>
            <InAppBrowserWarning />

            <AuthCardHeader
              eyebrow="Document re-upload"
              title={<>Hi {firstName}, a quick re-upload is needed</>}
              description={
                <>
                  Our team reviewed your submission and a few documents need to be replaced.
                  Nothing else to redo — just re-upload the {docs.length}{" "}
                  document{docs.length === 1 ? "" : "s"} below and submit.
                </>
              }
              icon={<IconTile icon={ShieldCheck} tone="energy" size="lg" />}
            />

            <AuthAlert className="mt-5" message={uploadError} />

            {/* Document cards */}
            <div className="mt-6 space-y-4">
              {docs.map((doc) => {
                const isDone = !!done[doc.type];
                return (
                  <div
                    key={doc.type}
                    className={cn(
                      "rounded-3xl p-5 ring-1 ring-inset transition",
                      isDone ? "bg-accent-50/50 ring-accent-200" : "bg-[#f6f7fb] ring-ink-100"
                    )}
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-start gap-3">
                        <IconTile
                          icon={isDone ? CheckCircle : FileText}
                          tone={isDone ? "accent" : "brand"}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <p className="font-semibold text-ink-900">{doc.label}</p>
                          {doc.reason && (
                            <div className="mt-2 rounded-2xl bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-inset ring-amber-200">
                              <span className="font-semibold">Reason for re-upload:</span> {doc.reason}
                            </div>
                          )}
                        </div>
                      </div>
                      {isDone && (
                        <Badge variant="accent" size="sm" className="shrink-0">
                          Re-uploaded
                        </Badge>
                      )}
                    </div>

                    <DocInput
                      doc={doc}
                      uploading={uploading === doc.type}
                      done={isDone}
                      onFile={(file) => uploadDocument(doc.type, file)}
                      onSelfie={(file) => uploadSelfie(file)}
                      onGps={(file, gps) => uploadDocument(doc.type, file, { gps })}
                      onVideoComplete={() => markDone(doc.type)}
                      token={token!}
                    />
                  </div>
                );
              })}
            </div>

            {/* Submit */}
            <div className="sticky bottom-4 mt-6">
              <div className="glass rounded-3xl p-4 shadow-energy-sm ring-1 ring-ink-100">
                <div className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ink-900">
                      {allDone ? "Everything's re-uploaded" : `${doneCount} of ${docs.length} re-uploaded`}
                    </p>
                    <p className="text-[11px] text-ink-500">
                      {allDone ? "You can submit for review now." : "Finish the remaining documents to submit."}
                    </p>
                  </div>
                  <Button
                    size="lg"
                    onClick={submit}
                    isLoading={submitting}
                    disabled={!allDone || submitting}
                  >
                    {submitting ? (
                      "Submitting…"
                    ) : (
                      <>
                        <UploadSimple size={16} weight="bold" aria-hidden /> Submit for review
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </StepPanels>
    </AuthCard>
  );
}

/* ─── Per-document input switcher ────────────────────────────────────── */

function DocInput({
  doc,
  uploading,
  done,
  onFile,
  onSelfie,
  onGps,
  onVideoComplete,
  token,
}: {
  doc: ResubmitDoc;
  uploading: boolean;
  done: boolean;
  onFile: (file: File) => void;
  onSelfie: (file: File) => void;
  onGps: (file: File, gps: { latitude: number; longitude: number; accuracy?: number; capturedAt?: string; source?: string }) => void;
  onVideoComplete: () => void;
  token: string;
}) {
  if (GPS_TYPES.has(doc.type)) {
    return (
      <GpsPhotoCapture
        label={doc.label}
        required
        uploaded={done}
        uploading={uploading}
        facing={doc.type === "GPS_SELFIE_DISTRIBUTOR" ? "user" : "environment"}
        onCapture={(file, gps) => onGps(file, gps)}
      />
    );
  }

  if (doc.type === "SELFIE") {
    return (
      <SelfieCapture
        uploaded={done}
        uploading={uploading}
        onCapture={(file) => onSelfie(file)}
      />
    );
  }

  if (doc.type === "ONBOARD_VIDEO") {
    if (done) {
      return (
        <p className="flex items-center gap-2 text-sm font-medium text-accent-700">
          <CheckCircle size={16} weight="duotone" aria-hidden />
          Liveness video recorded successfully.
        </p>
      );
    }
    return (
      <LivenessVideoCapture onComplete={onVideoComplete} apiPrefix={`/api/onboard/${token}`} />
    );
  }

  return <FileUploader doc={doc} uploading={uploading} done={done} onFile={onFile} token={token} />;
}

/* ─── Plain file uploader ────────────────────────────────────────────── */

function FileUploader({
  doc,
  uploading,
  done,
  onFile,
  token,
}: {
  doc: ResubmitDoc;
  uploading: boolean;
  done: boolean;
  onFile: (file: File) => void;
  token: string;
}) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const prefilled = PREFILLED_FORMS[doc.type];

  return (
    <div>
      {prefilled && (
        <div className="mb-3 rounded-2xl bg-brand-50/60 p-3 ring-1 ring-inset ring-brand-100">
          <a
            href={`/api/onboard/${token}/${prefilled.path}`}
            target="_blank"
            rel="noopener noreferrer"
            className="focus-energy inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-brand-700 ring-1 ring-inset ring-brand-200 transition hover:bg-brand-50"
          >
            <ArrowDown size={16} weight="bold" aria-hidden /> {prefilled.label}
          </a>
          <p className="mt-2 text-xs text-ink-500">
            Download the prefilled form, print &amp; sign it, then upload the signed copy below.
          </p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={acceptFor(doc.type)}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className={cn(
          "focus-energy flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-4 py-3.5 text-sm font-semibold transition disabled:opacity-60",
          done
            ? "border-accent-300 bg-accent-50 text-accent-700 hover:bg-accent-100"
            : "border-brand-200 bg-white text-brand-700 hover:border-brand-300 hover:bg-brand-50/60"
        )}
      >
        {uploading ? (
          <>
            <CircleNotch size={16} weight="bold" className="animate-spin" aria-hidden /> Uploading…
          </>
        ) : done ? (
          <>
            <UploadSimple size={16} weight="bold" aria-hidden /> Replace file
          </>
        ) : (
          <>
            <UploadSimple size={16} weight="bold" aria-hidden /> Choose file to upload
          </>
        )}
      </button>
      <p className="mt-1.5 text-[11px] text-ink-400">
        {IMAGE_ONLY.has(doc.type) ? "Image files only" : "Image or PDF"}
      </p>
    </div>
  );
}
