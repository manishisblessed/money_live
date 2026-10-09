"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Loader2,
  FileSignature,
  FileText,
  Camera,
  MapPin,
  RefreshCw,
  AlertTriangle,
  PenTool,
} from "lucide-react";
import { CheckCircle, GitBranch as GitBranchPh, SealCheck } from "@phosphor-icons/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { IconTile } from "@/components/ui/Icon";
import {
  EmptyState,
  FadeIn,
  KeyValueList,
  SectionCard,
  Stagger,
  StaggerItem,
  StatusChip,
} from "@/components/dashboard/patterns";

type Approval = {
  id: string;
  status: string;
  onboardeeRole: string;
  onboardeeName: string;
  onboardeePhone: string;
  onboardeeEmail: string;
  inviteStatus: string;
  sentAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
};

type TransferRequest = {
  id: string;
  status: string;
  reason: string | null;
  user: { id: string; userCode: string | null; name: string; role: string; phone: string; email: string; shopName: string | null };
  oldParent: { id: string; name: string; role: string };
  initiatedBy: { id: string; name: string };
  approvedAt: string | null;
  rejectedAt: string | null;
  rejectedReason: string | null;
  expiresAt: string;
  createdAt: string;
};

type ApprovalPhase = "list" | "reviewing" | "reviewingTransfer";

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [transfers, setTransfers] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [phase, setPhase] = useState<ApprovalPhase>("list");
  const [selected, setSelected] = useState<Approval | null>(null);
  const [selectedTransfer, setSelectedTransfer] = useState<TransferRequest | null>(null);

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const [declRes, transferRes] = await Promise.all([
        fetch("/api/declarations/pending"),
        fetch("/api/declarations/transfer/pending"),
      ]);
      if (declRes.ok) {
        const data = await declRes.json();
        setApprovals(data.approvals);
      }
      if (transferRes.ok) {
        const data = await transferRes.json();
        setTransfers(data.transfers);
      }
    } catch {
      setError("Failed to load approvals");
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchApprovals(); }, [fetchApprovals]);

  const pending = approvals.filter((a) => a.status === "PENDING");
  const completed = approvals.filter((a) => a.status !== "PENDING");
  const pendingTransfers = transfers.filter((t) => t.status === "PENDING_DECLARATION");
  const completedTransfers = transfers.filter((t) => t.status !== "PENDING_DECLARATION");

  function startReview(approval: Approval) {
    setSelected(approval);
    setPhase("reviewing");
  }

  function startTransferReview(transfer: TransferRequest) {
    setSelectedTransfer(transfer);
    setPhase("reviewingTransfer");
  }

  if (phase === "reviewing" && selected) {
    return (
      <ApprovalReviewPage
        approval={selected}
        onBack={() => { setPhase("list"); fetchApprovals(); }}
      />
    );
  }

  if (phase === "reviewingTransfer" && selectedTransfer) {
    return (
      <TransferReviewPage
        transfer={selectedTransfer}
        onBack={() => { setPhase("list"); fetchApprovals(); }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Network · Approvals"
        title="Declaration approvals"
        description="Review and sign onboarding declarations and transfer requests from your network."
        actions={
          <Button variant="outline" onClick={fetchApprovals} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
        </div>
      ) : (
        <FadeIn className="space-y-8">
          {/* Pending Approvals */}
          {pending.length > 0 && (
            <section className="space-y-3">
              <SectionTitle icon={<IconTile icon={SealCheck} tone="amber" size="sm" />} title="Pending approvals" count={pending.length} />
              <Stagger className="grid gap-4 md:grid-cols-2">
                {pending.map((a) => (
                  <StaggerItem key={a.id}>
                    <ApprovalCard approval={a} onReview={() => startReview(a)} />
                  </StaggerItem>
                ))}
              </Stagger>
            </section>
          )}

          {pending.length === 0 && (
            <EmptyState
              bordered
              tone="accent"
              icon={CheckCircle}
              title="All caught up"
              description="No pending declaration approvals right now."
            />
          )}

          {/* Pending Transfer Approvals */}
          {pendingTransfers.length > 0 && (
            <section className="space-y-3">
              <SectionTitle icon={<IconTile icon={GitBranchPh} tone="brand" size="sm" />} title="Transfer requests" count={pendingTransfers.length} />
              <Stagger className="grid gap-4 md:grid-cols-2">
                {pendingTransfers.map((t) => (
                  <StaggerItem key={t.id}>
                    <TransferCard transfer={t} onReview={() => startTransferReview(t)} />
                  </StaggerItem>
                ))}
              </Stagger>
            </section>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <section className="space-y-3">
              <SectionTitle icon={<IconTile icon={SealCheck} tone="ink" size="sm" />} title="History" count={completed.length} />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {completed.map((a) => (
                  <ApprovalCard key={a.id} approval={a} />
                ))}
              </div>
            </section>
          )}

          {/* Completed Transfers */}
          {completedTransfers.length > 0 && (
            <section className="space-y-3">
              <SectionTitle icon={<IconTile icon={GitBranchPh} tone="ink" size="sm" />} title="Transfer history" count={completedTransfers.length} />
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {completedTransfers.map((t) => (
                  <TransferCard key={t.id} transfer={t} />
                ))}
              </div>
            </section>
          )}
        </FadeIn>
      )}
    </div>
  );
}

function SectionTitle({ icon, title, count }: { icon: React.ReactNode; title: string; count?: number }) {
  return (
    <div className="flex items-center gap-3">
      {icon}
      <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink-900">{title}</h2>
      {count !== undefined && (
        <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-ink-600">{count}</span>
      )}
    </div>
  );
}

function ApprovalCard({ approval, onReview }: { approval: Approval; onReview?: () => void }) {
  const isPending = approval.status === "PENDING";
  return (
    <div
      className={`flex h-full flex-col rounded-3xl bg-white p-5 ring-1 shadow-sm ${
        isPending ? "ring-amber-200" : "ring-ink-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate font-display text-base font-semibold tracking-[-0.01em] text-ink-900">{approval.onboardeeName}</p>
          <p className="text-xs capitalize text-ink-500">{approval.onboardeeRole.replace(/_/g, " ").toLowerCase()}</p>
        </div>
        <StatusChip status={approval.status} size="sm" />
      </div>
      <KeyValueList
        className="mt-4"
        layout="grid"
        items={[
          { label: "Phone", value: approval.onboardeePhone },
          { label: "Email", value: approval.onboardeeEmail },
          { label: "Sent", value: new Date(approval.sentAt).toLocaleDateString() },
          ...(approval.approvedAt
            ? [{ label: "Approved", value: new Date(approval.approvedAt).toLocaleDateString() }]
            : []),
        ]}
      />
      {approval.rejectedReason && (
        <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-inset ring-rose-100">
          Reason: {approval.rejectedReason}
        </p>
      )}
      <div className="mt-auto pt-4">
        {onReview && isPending && (
          <Button className="w-full" onClick={onReview}>
            <FileSignature className="h-4 w-4" /> Review &amp; approve
          </Button>
        )}
        {approval.status === "APPROVED" && (
          <a
            href={`/api/declarations/${approval.id}/document`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-ink-700 ring-1 ring-inset ring-ink-200 transition-colors hover:bg-ink-50 focus-energy"
          >
            <FileText className="h-4 w-4" /> View signed declaration
          </a>
        )}
      </div>
    </div>
  );
}

function ApprovalReviewPage({ approval, onBack }: { approval: Approval; onBack: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  // Signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const isDrawingRef = useRef(false);
  const [hasSigned, setHasSigned] = useState(false);

  // Selfie
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);

  // GPS
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  // Canvas drawing — DPR-aware so that pointer coordinates line up 1:1
  // with the drawing surface (fixes the "signs from the middle" bug that
  // happens when internal canvas resolution differs from CSS display size).
  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    setupCanvas();
    const onResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      // Preserve current strokes across resizes.
      const snapshot = canvas.toDataURL("image/png");
      setupCanvas();
      const img = new window.Image();
      img.onload = () => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = snapshot;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setupCanvas]);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    isDrawingRef.current = true;
    lastPointRef.current = pos;
    // A small dot so a single tap still leaves a visible mark.
    ctx.beginPath();
    ctx.fillStyle = "#0f172a";
    ctx.arc(pos.x, pos.y, ctx.lineWidth / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawingRef.current) return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext("2d");
    const last = lastPointRef.current;
    if (!ctx || !last) return;
    const pos = getPos(e);
    // Quadratic curve through the midpoint of last->current gives a smooth,
    // organic-looking signature stroke instead of jagged straight segments.
    const midX = (last.x + pos.x) / 2;
    const midY = (last.y + pos.y) / 2;
    ctx.quadraticCurveTo(last.x, last.y, midX, midY);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    lastPointRef.current = pos;
    if (!hasSigned) setHasSigned(true);
  }

  function endDraw() {
    if (!isDrawingRef.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    const last = lastPointRef.current;
    if (ctx && last) {
      ctx.lineTo(last.x, last.y);
      ctx.stroke();
    }
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }

  function clearSignature() {
    setHasSigned(false);
    setupCanvas();
  }

  // Attach the stream to the <video> only AFTER it has been mounted (the
  // element lives inside a `{cameraOpen && ...}` block). Doing this in an
  // effect keyed on `cameraOpen` fixes the "empty camera box" bug where the
  // stream was assigned before the element existed.
  useEffect(() => {
    if (!cameraOpen) return;
    const video = videoRef.current;
    const stream = streamRef.current;
    if (video && stream) {
      video.srcObject = stream;
      video.muted = true;
      video.play().catch(() => {});
    }
  }, [cameraOpen]);

  // Camera
  async function openCamera() {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("This browser can't access the camera. Please use Chrome or Safari, or use your phone's camera app below.");
      return;
    }
    setCameraStarting(true);
    try {
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "user" } },
          audio: false,
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }
      streamRef.current = stream;
      setCameraOpen(true);
    } catch (err) {
      const name = (err as DOMException)?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setError("Camera permission is blocked. Please allow camera access in your browser settings, or use your phone's camera app below.");
      } else if (name === "NotFoundError" || name === "OverconstrainedError") {
        setError("No camera was found on this device. Use your phone's camera app below.");
      } else if (name === "NotReadableError") {
        setError("Your camera is being used by another app. Close it and try again.");
      } else {
        setError("Couldn't open the camera. Please try again or use your phone's camera app below.");
      }
    } finally {
      setCameraStarting(false);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    // Mirror so the saved selfie matches the preview the user sees.
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setSelfieDataUrl(dataUrl);
    stopCamera();
    setCameraOpen(false);
  }

  function retakeSelfie() {
    setSelfieDataUrl(null);
    openCamera();
  }

  // Native camera-app fallback — works even when getUserMedia is blocked or
  // unavailable (e.g. inside a WebView).
  function handleNativeSelfie(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setSelfieDataUrl(reader.result as string);
      stopCamera();
      setCameraOpen(false);
    };
    reader.readAsDataURL(file);
  }

  // GPS
  async function getLocation() {
    setGpsLoading(true);
    setGpsError("");
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 15000,
        });
      });
      setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
    } catch {
      setGpsError("Could not get your location. Please enable location services.");
    }
    setGpsLoading(false);
  }

  // Upload signature as data URL to Cloudinary via the server
  async function uploadDataUrl(dataUrl: string, type: string): Promise<string> {
    const res = await fetch("/api/declarations/upload-evidence", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dataUrl, type }),
    });
    if (!res.ok) throw new Error("Upload failed");
    const data = await res.json();
    return data.url;
  }

  async function handleApprove() {
    if (!hasSigned || !selfieDataUrl || !gps) {
      setError("Please complete signature, selfie, and location before approving.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const signatureDataUrl = canvasRef.current!.toDataURL("image/png");
      const [signatureUrl, selfieUrl] = await Promise.all([
        uploadDataUrl(signatureDataUrl, "approval_signature"),
        uploadDataUrl(selfieDataUrl, "approval_selfie"),
      ]);

      const res = await fetch(`/api/declarations/${approval.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureUrl,
          selfieUrl,
          latitude: gps.lat,
          longitude: gps.lng,
          signatureDataUrl,
          selfieDataUrl,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSuccess(true);
      } else {
        setError(data.error ?? "Approval failed");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  async function handleReject() {
    if (!rejectReason || rejectReason.length < 5) {
      setError("Please provide a reason for rejection (min 5 characters).");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/declarations/${approval.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (data.ok) {
        setRejected(true);
      } else {
        setError(data.error ?? "Rejection failed");
      }
    } catch {
      setError("Network error. Please try again.");
    }
    setSubmitting(false);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg">
        <FadeIn>
          <SectionCard tone="accent" padding="lg" className="text-center">
            <IconTile icon={CheckCircle} tone="accent" size="xl" className="mx-auto" />
            <h2 className="mt-5 font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900">Declaration approved</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
              You have approved <strong>{approval.onboardeeName}</strong>&apos;s onboarding as a{" "}
              <strong className="capitalize">{approval.onboardeeRole.replace(/_/g, " ").toLowerCase()}</strong>.
              They can now complete their registration.
            </p>
            <Button className="mt-6" onClick={onBack}>Back to approvals</Button>
          </SectionCard>
        </FadeIn>
      </div>
    );
  }

  if (rejected) {
    return (
      <div className="mx-auto max-w-lg">
        <FadeIn>
          <SectionCard tone="coral" padding="lg" className="text-center">
            <IconTile tone="coral" size="xl" className="mx-auto"><XCircle className="h-7 w-7" /></IconTile>
            <h2 className="mt-5 font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900">Declaration rejected</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
              You have rejected <strong>{approval.onboardeeName}</strong>&apos;s onboarding declaration.
            </p>
            <Button className="mt-6" onClick={onBack}>Back to approvals</Button>
          </SectionCard>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Network · Approvals"
        title={`Review: ${approval.onboardeeName}`}
        description={`${approval.onboardeeRole.replace(/_/g, " ").toLowerCase()} onboarding declaration approval`}
        actions={
          <Button variant="outline" onClick={onBack}>Back</Button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Applicant Info */}
      <SectionCard title="Applicant details">
        <KeyValueList
          layout="grid"
          items={[
            { label: "Name", value: approval.onboardeeName },
            { label: "Role", value: <span className="capitalize">{approval.onboardeeRole.replace(/_/g, " ").toLowerCase()}</span> },
            { label: "Phone", value: approval.onboardeePhone },
            { label: "Email", value: approval.onboardeeEmail },
            { label: "Requested", value: new Date(approval.sentAt).toLocaleString() },
          ]}
        />
      </SectionCard>

      {/* Declaration Warning + document view */}
      <SectionCard tone="amber">
        <div className="flex items-start gap-3">
          <IconTile tone="amber" size="sm"><AlertTriangle className="h-4 w-4" /></IconTile>
          <div className="text-sm text-ink-800">
            <p className="mb-2 font-semibold text-ink-900">Important: responsibility declaration</p>
            <p className="text-ink-700">
              By approving this declaration, you accept full responsibility for all activities,
              transactions, and obligations of this {approval.onboardeeRole.replace(/_/g, " ").toLowerCase()}.
              This includes liability for chargebacks, fraud, disputes, and any financial
              losses as outlined in the declaration form.
            </p>
            <a
              href={`/api/declarations/${approval.id}/document`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-amber-800 ring-1 ring-inset ring-amber-300 transition-colors hover:bg-amber-100 focus-energy"
            >
              <FileText className="h-4 w-4" /> View / download the responsibility declaration
            </a>
          </div>
        </div>
      </SectionCard>

      {/* Signature */}
      <SectionCard
        icon={<IconTile tone="brand" size="sm"><FileSignature className="h-4 w-4" /></IconTile>}
        title="Your signature"
        description="Draw with mouse or touch — captured exactly as drawn."
        action={
          <>
            {hasSigned && <Badge variant="success" dot>Signed</Badge>}
            {hasSigned && (
              <Button type="button" variant="outline" size="sm" onClick={clearSignature}>
                <RefreshCw className="h-3.5 w-3.5" /> Clear
              </Button>
            )}
          </>
        }
      >
        <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-ink-200 bg-white">
          <canvas
            ref={canvasRef}
            className="block w-full touch-none cursor-crosshair"
            style={{ height: 200 }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={endDraw}
            onMouseLeave={endDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={endDraw}
          />
          {!hasSigned && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="flex items-center gap-2 rounded-full bg-ink-50 px-4 py-2 text-sm font-medium text-ink-400 shadow-sm">
                <PenTool className="h-4 w-4" />
                <span>Sign here</span>
              </div>
            </div>
          )}
          <div className="pointer-events-none absolute right-3 top-3 rounded-full bg-brand-50 p-1.5 text-brand-600">
            <PenTool className="h-3.5 w-3.5" />
          </div>
        </div>
      </SectionCard>

      {/* Selfie */}
      <SectionCard
        icon={<IconTile tone="royal" size="sm"><Camera className="h-4 w-4" /></IconTile>}
        title="Approval selfie"
        description="A quick photo of you, taken now."
        action={selfieDataUrl ? <Badge variant="success" dot>Captured</Badge> : undefined}
      >
        {/* Native camera-app input (front-camera hint via capture="user"). */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="user"
          className="hidden"
          onChange={handleNativeSelfie}
        />

        {!selfieDataUrl && !cameraOpen && (
          <div className="space-y-2">
            <Button variant="outline" onClick={openCamera} disabled={cameraStarting}>
              {cameraStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {cameraStarting ? "Starting camera…" : "Open Camera"}
            </Button>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
            >
              <Camera className="h-3.5 w-3.5" /> Camera not opening? Use your phone&apos;s camera app
            </button>
          </div>
        )}

        {cameraOpen && (
          <div className="space-y-3">
            <div className="relative mx-auto max-w-sm overflow-hidden rounded-2xl border border-ink-200 bg-ink-900/90">
              <video ref={videoRef} className="w-full -scale-x-100" muted playsInline autoPlay />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button className="w-full max-w-sm" onClick={capturePhoto}>
                <Camera className="h-4 w-4" /> Capture Photo
              </Button>
              <button
                type="button"
                onClick={() => { stopCamera(); setCameraOpen(false); }}
                className="text-xs text-ink-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {selfieDataUrl && (
          <div className="space-y-3">
            <div className="mx-auto max-w-sm overflow-hidden rounded-2xl ring-2 ring-emerald-200">
              <img src={selfieDataUrl} alt="Approval selfie" className="w-full" />
            </div>
            <button type="button" onClick={retakeSelfie} className="text-xs font-semibold text-brand-600 hover:underline">
              Retake selfie
            </button>
          </div>
        )}
      </SectionCard>

      {/* GPS Location */}
      <SectionCard
        icon={<IconTile tone="accent" size="sm"><MapPin className="h-4 w-4" /></IconTile>}
        title="Location verification"
        description="We record where you approved from."
        action={gps ? <Badge variant="success" dot>Captured</Badge> : undefined}
      >
        {!gps && (
          <div className="space-y-2">
            <Button variant="outline" onClick={getLocation} disabled={gpsLoading}>
              {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              {gpsLoading ? "Getting location…" : "Capture my location"}
            </Button>
            {gpsError && <p className="text-xs text-rose-600">{gpsError}</p>}
          </div>
        )}

        {gps && (
          <div className="rounded-2xl bg-emerald-50 p-3 text-sm ring-1 ring-inset ring-emerald-200">
            <p className="font-medium text-emerald-800">
              Location captured: {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
            </p>
            <p className="mt-1 text-xs text-emerald-600">
              {new Date().toLocaleString()}
            </p>
          </div>
        )}
      </SectionCard>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-start gap-3 rounded-3xl bg-white p-4 ring-1 ring-ink-100 shadow-sm">
        <Button
          onClick={handleApprove}
          isLoading={submitting}
          disabled={!hasSigned || !selfieDataUrl || !gps}
          className="flex-1"
          size="lg"
        >
          <CheckCircle2 className="h-4 w-4" />
          Approve declaration
        </Button>
        {!showReject ? (
          <Button variant="outline" size="lg" onClick={() => setShowReject(true)} className="border-rose-200 text-rose-600 hover:bg-rose-50">
            <XCircle className="h-4 w-4" /> Reject
          </Button>
        ) : (
          <div className="flex-1 basis-full space-y-2 sm:basis-auto">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (min 5 characters)…"
              className="w-full rounded-2xl border border-rose-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReject}
                isLoading={submitting}
                disabled={rejectReason.length < 5}
                className="border-rose-200 text-rose-600"
              >
                <XCircle className="h-4 w-4" />
                Confirm reject
              </Button>
              <Button variant="outline" onClick={() => setShowReject(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Transfer Approval Card ─────────────────────────────────────────────── */

const TRANSFER_STATUS_LABEL: Record<string, string> = {
  PENDING_DECLARATION: "Pending approval",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  EXPIRED: "Expired",
  CANCELLED: "Cancelled",
};

function TransferCard({ transfer, onReview }: { transfer: TransferRequest; onReview?: () => void }) {
  const isPending = transfer.status === "PENDING_DECLARATION";
  return (
    <div
      className={`flex h-full flex-col rounded-3xl bg-white p-5 ring-1 shadow-sm ${
        isPending ? "ring-brand-200" : "ring-ink-100"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <IconTile icon={GitBranchPh} tone="brand" size="sm" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-display text-base font-semibold tracking-[-0.01em] text-ink-900">{transfer.user.name}</p>
              {transfer.user.userCode && <Badge variant="brand" size="sm" className="font-mono">{transfer.user.userCode}</Badge>}
            </div>
            <p className="text-xs capitalize text-ink-500">{transfer.user.role.replace(/_/g, " ").toLowerCase()} · transfer request</p>
          </div>
        </div>
        <StatusChip
          status={isPending ? "PENDING" : transfer.status}
          label={TRANSFER_STATUS_LABEL[transfer.status] ?? transfer.status}
          size="sm"
        />
      </div>
      <KeyValueList
        className="mt-4"
        layout="grid"
        items={[
          { label: "Phone", value: transfer.user.phone },
          { label: "Shop", value: transfer.user.shopName ?? "—" },
          { label: "From (old parent)", value: transfer.oldParent.name },
          { label: "Initiated by", value: transfer.initiatedBy.name },
          { label: "Requested", value: new Date(transfer.createdAt).toLocaleDateString("en-IN") },
          { label: "Expires", value: new Date(transfer.expiresAt).toLocaleDateString("en-IN") },
        ]}
      />
      {transfer.reason && (
        <p className="mt-3 text-xs text-ink-500">Reason: {transfer.reason}</p>
      )}
      {transfer.rejectedReason && (
        <p className="mt-3 rounded-2xl bg-rose-50 px-3 py-2 text-xs text-rose-700 ring-1 ring-inset ring-rose-100">
          Rejected: {transfer.rejectedReason}
        </p>
      )}
      {onReview && isPending && (
        <div className="mt-auto pt-4">
          <Button className="w-full" onClick={onReview}>
            <FileSignature className="h-4 w-4" /> Review &amp; accept transfer
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Transfer Review Page ────────────────────────────────────────────────── */

function TransferReviewPage({ transfer, onBack }: { transfer: TransferRequest; onBack: () => void }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [rejected, setRejected] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [showReject, setShowReject] = useState(false);

  // Signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const isDrawingRef = useRef(false);
  const [hasSigned, setHasSigned] = useState(false);

  // Selfie
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selfieDataUrl, setSelfieDataUrl] = useState<string | null>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStarting, setCameraStarting] = useState(false);

  // GPS
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState("");

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(rect.width * dpr);
    canvas.height = Math.floor(rect.height * dpr);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, rect.width, rect.height);
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  }, []);

  useEffect(() => {
    setupCanvas();
    const onResize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const snapshot = canvas.toDataURL("image/png");
      setupCanvas();
      const img = new window.Image();
      img.onload = () => {
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        const rect = canvas.getBoundingClientRect();
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
      };
      img.src = snapshot;
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [setupCanvas]);

  function getPos(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0];
      return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
    }
    return { x: (e as React.MouseEvent).clientX - rect.left, y: (e as React.MouseEvent).clientY - rect.top };
  }

  function startDraw(e: React.MouseEvent | React.TouchEvent) {
    isDrawingRef.current = true;
    lastPointRef.current = getPos(e);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!ctx) return;
    const pos = getPos(e);
    const last = lastPointRef.current ?? pos;
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    lastPointRef.current = pos;
    setHasSigned(true);
  }

  function stopDraw() {
    isDrawingRef.current = false;
    lastPointRef.current = null;
  }

  function clearSignature() {
    setupCanvas();
    setHasSigned(false);
  }

  async function uploadSignature(): Promise<string | null> {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const blob = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/png"));
    if (!blob) return null;
    const fd = new FormData();
    fd.append("file", blob, "transfer-signature.png");
    fd.append("folder", "eMoney/declarations/transfer");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url ?? data.secure_url ?? null;
  }

  async function uploadSelfie(): Promise<string | null> {
    if (!selfieDataUrl) return null;
    const blob = await fetch(selfieDataUrl).then((r) => r.blob());
    const fd = new FormData();
    fd.append("file", blob, "transfer-selfie.jpg");
    fd.append("folder", "eMoney/declarations/transfer");
    const res = await fetch("/api/upload", { method: "POST", body: fd });
    if (!res.ok) return null;
    const data = await res.json();
    return data.url ?? data.secure_url ?? null;
  }

  async function startCamera() {
    setCameraStarting(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraOpen(true);
    } catch {
      setError("Camera access denied. Please allow camera permissions.");
    } finally {
      setCameraStarting(false);
    }
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0);
    setSelfieDataUrl(canvas.toDataURL("image/jpeg", 0.85));
    stopCamera();
    setCameraOpen(false);
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setSelfieDataUrl(reader.result as string);
    reader.readAsDataURL(file);
  }

  function retakeSelfie() {
    setSelfieDataUrl(null);
  }

  function getLocation() {
    setGpsLoading(true);
    setGpsError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGpsLoading(false);
      },
      (err) => {
        setGpsError(err.message || "Failed to get location");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function handleApprove() {
    if (!hasSigned || !selfieDataUrl || !gps) return;
    setSubmitting(true);
    setError("");
    try {
      const [signatureUrl, selfieUrl] = await Promise.all([uploadSignature(), uploadSelfie()]);
      if (!signatureUrl || !selfieUrl) throw new Error("Failed to upload evidence");

      const res = await fetch(`/api/declarations/transfer/${transfer.id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          signatureUrl,
          selfieUrl,
          latitude: gps.lat,
          longitude: gps.lng,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Approval failed");
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Approval failed");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReject() {
    if (rejectReason.length < 5) return;
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch(`/api/declarations/transfer/${transfer.id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: rejectReason }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Rejection failed");
      setRejected(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Rejection failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="mx-auto max-w-lg">
        <FadeIn>
          <SectionCard tone="accent" padding="lg" className="text-center">
            <IconTile icon={CheckCircle} tone="accent" size="xl" className="mx-auto" />
            <h2 className="mt-5 font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900">Transfer approved</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
              {transfer.user.name} has been transferred under your account.
              Their previous scheme has been cleared — you can now assign them a new one.
            </p>
            <Button className="mt-6" onClick={onBack}>
              Back to approvals
            </Button>
          </SectionCard>
        </FadeIn>
      </div>
    );
  }

  if (rejected) {
    return (
      <div className="mx-auto max-w-lg">
        <FadeIn>
          <SectionCard tone="coral" padding="lg" className="text-center">
            <IconTile tone="coral" size="xl" className="mx-auto"><XCircle className="h-7 w-7" /></IconTile>
            <h2 className="mt-5 font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900">Transfer rejected</h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-ink-600">
              You have rejected the transfer of {transfer.user.name}. The Master Admin has been notified.
            </p>
            <Button className="mt-6" onClick={onBack}>
              Back to approvals
            </Button>
          </SectionCard>
        </FadeIn>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Network · Transfer approval"
        title={`Accept ${transfer.user.name}?`}
        description={`Master Admin wants to transfer this ${transfer.user.role.replace(/_/g, " ").toLowerCase()} under your account.`}
        actions={
          <Button variant="outline" onClick={onBack}>
            Back to list
          </Button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* Transfer Details */}
      <SectionCard
        icon={<IconTile icon={GitBranchPh} tone="brand" size="sm" />}
        title="Transfer details"
      >
        <KeyValueList
          layout="grid"
          items={[
            {
              label: "User being transferred",
              value: (
                <span className="inline-flex flex-wrap items-center gap-2">
                  {transfer.user.name}
                  {transfer.user.userCode && <Badge variant="brand" size="sm" className="font-mono">{transfer.user.userCode}</Badge>}
                </span>
              ),
            },
            { label: "Role", value: <span className="capitalize">{transfer.user.role.replace(/_/g, " ").toLowerCase()}</span> },
            { label: "Phone", value: transfer.user.phone },
            { label: "Email", value: transfer.user.email },
            { label: "Shop", value: transfer.user.shopName ?? "—" },
            {
              label: "Previous parent",
              value: `${transfer.oldParent.name} (${transfer.oldParent.role.replace(/_/g, " ").toLowerCase()})`,
            },
            ...(transfer.reason ? [{ label: "Reason for transfer", value: transfer.reason, wide: true }] : []),
          ]}
        />
        <div className="mt-4 rounded-2xl bg-amber-50 p-3 text-xs text-amber-800 ring-1 ring-inset ring-amber-200">
          By approving, you accept responsibility for this user in your network. Their scheme
          will be cleared and you can assign a new one from your commission structure.
        </div>
      </SectionCard>

      {/* Signature */}
      <SectionCard
        icon={<IconTile tone="brand" size="sm"><PenTool className="h-4 w-4" /></IconTile>}
        title="Your signature"
        description="Draw with mouse or touch."
        action={hasSigned ? <Badge variant="success" dot>Signed</Badge> : undefined}
      >
        <div className="overflow-hidden rounded-2xl border-2 border-dashed border-ink-200 bg-ink-50">
          <canvas
            ref={canvasRef}
            className="w-full cursor-crosshair touch-none"
            style={{ height: 160 }}
            onMouseDown={startDraw}
            onMouseMove={draw}
            onMouseUp={stopDraw}
            onMouseLeave={stopDraw}
            onTouchStart={startDraw}
            onTouchMove={draw}
            onTouchEnd={stopDraw}
          />
        </div>
        <button type="button" onClick={clearSignature} className="mt-2 text-xs font-semibold text-brand-600 hover:underline">
          Clear signature
        </button>
      </SectionCard>

      {/* Selfie */}
      <SectionCard
        icon={<IconTile tone="royal" size="sm"><Camera className="h-4 w-4" /></IconTile>}
        title="Selfie verification"
        description="A quick photo of you, taken now."
        action={selfieDataUrl ? <Badge variant="success" dot>Captured</Badge> : undefined}
      >
        {!selfieDataUrl && !cameraOpen && (
          <div className="flex flex-col gap-2">
            <Button variant="outline" onClick={startCamera} disabled={cameraStarting}>
              {cameraStarting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {cameraStarting ? "Starting camera..." : "Take Selfie"}
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" capture="user" className="hidden" onChange={handleFileUpload} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:underline"
            >
              <Camera className="h-3.5 w-3.5" /> Upload from gallery
            </button>
          </div>
        )}

        {cameraOpen && (
          <div className="space-y-3">
            <div className="relative mx-auto max-w-sm overflow-hidden rounded-2xl border border-ink-200 bg-ink-900/90">
              <video ref={videoRef} className="w-full -scale-x-100" muted playsInline autoPlay />
            </div>
            <div className="flex flex-col items-center gap-2">
              <Button className="w-full max-w-sm" onClick={capturePhoto}>
                <Camera className="h-4 w-4" /> Capture Photo
              </Button>
              <button
                type="button"
                onClick={() => { stopCamera(); setCameraOpen(false); }}
                className="text-xs text-ink-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {selfieDataUrl && (
          <div className="space-y-3">
            <div className="mx-auto max-w-sm overflow-hidden rounded-2xl ring-2 ring-emerald-200">
              <img src={selfieDataUrl} alt="Approval selfie" className="w-full" />
            </div>
            <button type="button" onClick={retakeSelfie} className="text-xs font-semibold text-brand-600 hover:underline">
              Retake selfie
            </button>
          </div>
        )}
      </SectionCard>

      {/* GPS */}
      <SectionCard
        icon={<IconTile tone="accent" size="sm"><MapPin className="h-4 w-4" /></IconTile>}
        title="Location verification"
        description="We record where you approved from."
        action={gps ? <Badge variant="success" dot>Captured</Badge> : undefined}
      >
        {!gps && (
          <div className="space-y-2">
            <Button variant="outline" onClick={getLocation} disabled={gpsLoading}>
              {gpsLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
              {gpsLoading ? "Getting location…" : "Capture my location"}
            </Button>
            {gpsError && <p className="text-xs text-rose-600">{gpsError}</p>}
          </div>
        )}
        {gps && (
          <div className="rounded-2xl bg-emerald-50 p-3 text-sm ring-1 ring-inset ring-emerald-200">
            <p className="font-medium text-emerald-800">
              Location captured: {gps.lat.toFixed(6)}, {gps.lng.toFixed(6)}
            </p>
          </div>
        )}
      </SectionCard>

      {/* Actions */}
      <div className="flex flex-wrap items-start gap-3 rounded-3xl bg-white p-4 ring-1 ring-ink-100 shadow-sm">
        <Button
          onClick={handleApprove}
          isLoading={submitting}
          disabled={!hasSigned || !selfieDataUrl || !gps}
          className="flex-1"
          size="lg"
        >
          <CheckCircle2 className="h-4 w-4" />
          Accept transfer
        </Button>
        {!showReject ? (
          <Button variant="outline" size="lg" onClick={() => setShowReject(true)} className="border-rose-200 text-rose-600 hover:bg-rose-50">
            <XCircle className="h-4 w-4" /> Reject
          </Button>
        ) : (
          <div className="flex-1 basis-full space-y-2 sm:basis-auto">
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason for rejection (min 5 characters)…"
              className="w-full rounded-2xl border border-rose-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400"
              rows={2}
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleReject}
                isLoading={submitting}
                disabled={rejectReason.length < 5}
                className="border-rose-200 text-rose-600"
              >
                <XCircle className="h-4 w-4" />
                Confirm reject
              </Button>
              <Button variant="outline" onClick={() => setShowReject(false)}>Cancel</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
