"use client";

import { Check, Clock, Copy, Download, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/useAuth";
import { cn } from "@/lib/utils";

/** Branding line shown on every payment result/receipt. */
function payByLine(userCode?: string | null): string {
  return userCode
    ? `Pay by emoney by RT Code - ${userCode}`
    : "Pay by emoney";
}

export type TxnResult = {
  refId: string;
  service: string;
  amount: number;
  customer?: string;
  meta?: Record<string, string | number>;
  /** Defaults to SUCCESS. PENDING = provider accepted but not yet confirmed.
   *  FAILED = provider declined (optional; callers may keep using SUCCESS/PENDING). */
  status?: "SUCCESS" | "PENDING" | "FAILED";
} | null;

function buildReceiptHtml(r: NonNullable<TxnResult>, userCode?: string | null): string {
  const pending = r.status === "PENDING";
  const failed = r.status === "FAILED";
  const headStyle = failed
    ? "background:linear-gradient(135deg,#e11d48,#be123c)"
    : pending
      ? "background:linear-gradient(135deg,#d97706,#b45309)"
      : "background:linear-gradient(135deg,#059669,#047857)";
  const headTitle = failed
    ? "Transaction Failed"
    : pending
      ? "Transaction Pending"
      : "Transaction Successful";
  const date = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const metaRows = r.meta
    ? Object.entries(r.meta)
        .map(
          ([k, v]) =>
            `<tr><td style="padding:6px 0;color:#666;font-size:13px">${k}</td><td style="padding:6px 0;text-align:right;font-weight:600;font-size:13px">${v}</td></tr>`
        )
        .join("")
    : "";
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Receipt — ${r.refId}</title>
<style>@media print{body{-webkit-print-color-adjust:exact;print-color-adjust:exact}}.r{max-width:400px;margin:24px auto;font-family:system-ui,sans-serif;border:1px solid #e5e7eb;border-radius:16px;overflow:hidden}.hdr{${headStyle};color:#fff;padding:32px 24px;text-align:center}.hdr h2{margin:0 0 4px;font-size:18px;font-weight:600}.hdr .amt{font-size:28px;font-weight:700;margin:8px 0 2px}.hdr .svc{font-size:12px;opacity:.8}.body{padding:20px 24px}table{width:100%;border-collapse:collapse}tr+tr{border-top:1px solid #f3f4f6}.foot{text-align:center;padding:16px 24px;font-size:11px;color:#999;border-top:1px dashed #e5e7eb}</style></head>
<body><div class="r"><div class="hdr"><h2>${headTitle}</h2><div class="amt">₹${r.amount.toLocaleString("en-IN")}</div><div class="svc">${r.service}</div></div>
<div class="body"><table><tr><td style="padding:6px 0;color:#666;font-size:13px">Reference ID</td><td style="padding:6px 0;text-align:right;font-weight:600;font-size:13px;font-family:monospace">${r.refId}</td></tr>
${r.customer ? `<tr><td style="padding:6px 0;color:#666;font-size:13px">Customer</td><td style="padding:6px 0;text-align:right;font-weight:600;font-size:13px">${r.customer}</td></tr>` : ""}
${metaRows}
<tr><td style="padding:6px 0;color:#666;font-size:13px">Date</td><td style="padding:6px 0;text-align:right;font-weight:600;font-size:13px">${date}</td></tr></table></div>
<div class="foot"><div style="font-weight:600;color:#059669;margin-bottom:4px">${payByLine(userCode)}</div>eMoney — Powered by BBPS</div></div></body></html>`;
}

/* ────────────────────────────────────────────────────────────────────
   Decorative bits
   ──────────────────────────────────────────────────────────────────── */

/** 10 tiny gradient squares bursting outward once (skipped under reduced motion). */
const CONFETTI = Array.from({ length: 10 }, (_, i) => {
  const angle = (i / 10) * Math.PI * 2 + 0.35;
  const dist = 58 + (i % 3) * 14;
  return {
    x: Math.cos(angle) * dist,
    y: Math.sin(angle) * dist,
    rotate: 90 + i * 37,
    delay: 0.18 + (i % 4) * 0.03,
    size: i % 3 === 0 ? 8 : 6,
  };
});

function ConfettiBurst() {
  return (
    <span aria-hidden className="pointer-events-none absolute inset-0 grid place-items-center">
      {CONFETTI.map((c, i) => (
        <motion.span
          key={i}
          className={cn(
            "absolute rounded-[2px]",
            i % 2 === 0 ? "bg-energy-gradient" : "bg-gradient-to-br from-accent-400 to-brand-500"
          )}
          style={{ width: c.size, height: c.size }}
          initial={{ x: 0, y: 0, scale: 0.4, opacity: 0, rotate: 0 }}
          animate={{ x: c.x, y: c.y, scale: 1, opacity: [0, 1, 1, 0], rotate: c.rotate }}
          transition={{ duration: 0.9, delay: c.delay, ease: [0.16, 1, 0.3, 1] }}
        />
      ))}
    </span>
  );
}

function StatusTile({ status }: { status: "SUCCESS" | "PENDING" | "FAILED" }) {
  const reduce = useReducedMotion();

  if (status === "FAILED") {
    return (
      <motion.span
        className="relative grid h-20 w-20 place-items-center rounded-[1.75rem] bg-gradient-to-br from-coral-500 to-coral-600 text-white shadow-glow-coral ring-1 ring-inset ring-white/30"
        initial={reduce ? false : { x: 0, scale: 0.8, opacity: 0 }}
        animate={
          reduce
            ? { opacity: 1, scale: 1 }
            : { x: [0, -10, 10, -7, 7, -3, 3, 0], scale: 1, opacity: 1 }
        }
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <X className="h-10 w-10" strokeWidth={2.5} aria-hidden />
      </motion.span>
    );
  }

  if (status === "PENDING") {
    return (
      <span className="relative grid h-20 w-20 place-items-center">
        <span
          aria-hidden
          className="absolute inset-0 rounded-[1.75rem] bg-amber-400/40 animate-ping-soft motion-reduce:animate-none"
        />
        <motion.span
          className="relative grid h-20 w-20 place-items-center rounded-[1.75rem] bg-gradient-to-br from-amber-400 to-amber-600 text-white shadow-soft ring-1 ring-inset ring-white/30"
          initial={reduce ? false : { scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
        >
          <Clock className="h-10 w-10" strokeWidth={2.25} aria-hidden />
        </motion.span>
      </span>
    );
  }

  return (
    <span className="relative grid h-20 w-20 place-items-center">
      {!reduce && <ConfettiBurst />}
      <motion.span
        className="relative grid h-20 w-20 place-items-center rounded-[1.75rem] bg-gradient-to-br from-accent-500 to-accent-600 text-white shadow-[0_20px_50px_-12px_rgba(34,197,94,0.55)] ring-1 ring-inset ring-white/30"
        initial={reduce ? false : { scale: 0.6, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 280, damping: 18 }}
      >
        <svg viewBox="0 0 24 24" className="h-11 w-11" fill="none" aria-hidden>
          <motion.path
            d="M5 12.5l4.5 4.5L19 7.5"
            stroke="currentColor"
            strokeWidth={2.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduce ? false : { pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.15, ease: "easeOut" }}
          />
        </svg>
      </motion.span>
    </span>
  );
}

const COPY: Record<
  "SUCCESS" | "PENDING" | "FAILED",
  { title: string; band: string; amount: string }
> = {
  SUCCESS: {
    title: "Payment successful",
    band: "from-accent-50 via-white to-brand-50/50",
    amount: "text-ink-950",
  },
  PENDING: {
    title: "Payment pending",
    band: "from-amber-50 via-white to-amber-50/30",
    amount: "text-ink-950",
  },
  FAILED: {
    title: "Payment failed",
    band: "from-coral-50 via-white to-coral-50/30",
    amount: "text-ink-700 line-through decoration-coral-400/70",
  },
};

export function TransactionResult({
  result,
  onClose
}: {
  result: TxnResult;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);
  const { session } = useAuth();
  const userCode = session?.userCode;
  const reduce = useReducedMotion();

  useEffect(() => {
    if (!result) setCopied(false);
  }, [result]);

  const receiptRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const downloadReceipt = useCallback(async () => {
    if (!result || !receiptRef.current) return;
    setDownloading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      await html2pdf()
        .set({
          margin: 0,
          filename: `Receipt-${result.refId}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: [100, 160], orientation: "portrait" },
        })
        .from(receiptRef.current)
        .save();
    } catch {
      const w = window.open("", "_blank", "width=460,height=650");
      if (!w) return;
      w.document.write(buildReceiptHtml(result, userCode));
      w.document.close();
      setTimeout(() => w.print(), 300);
    } finally {
      setDownloading(false);
    }
  }, [result, userCode]);

  if (!result) return null;

  const status = result.status ?? "SUCCESS";
  const pending = status === "PENDING";
  const copy = COPY[status];

  function copyRef() {
    if (!result) return;
    navigator.clipboard.writeText(result.refId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center overflow-y-auto px-4 py-8"
      role="dialog"
      aria-modal
      aria-labelledby="txn-result-title"
    >
      <motion.div
        aria-hidden
        className="grain fixed inset-0 bg-ink-950/60 backdrop-blur-md"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      />

      <motion.div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-[2rem] bg-white shadow-energy"
        initial={reduce ? false : { opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={
          reduce ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 24, mass: 0.9 }
        }
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-xl bg-white/70 text-ink-600 shadow-sm backdrop-blur transition hover:bg-white hover:text-ink-950"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Hero band */}
        <div
          className={cn(
            "relative overflow-hidden bg-gradient-to-br px-6 pb-7 pt-10 text-center",
            copy.band
          )}
        >
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-energy-gradient opacity-10 blur-3xl"
          />
          <div className="relative mx-auto flex w-fit justify-center">
            <StatusTile status={status} />
          </div>
          <p
            id="txn-result-title"
            className="mt-5 flex items-center justify-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-ink-500"
          >
            <span className="brand-dot" aria-hidden />
            {copy.title}
          </p>
          <p
            className={cn(
              "mt-2 font-display font-semibold leading-none tracking-[-0.03em] tabular-nums",
              copy.amount
            )}
          >
            <span className="align-top text-2xl md:text-3xl">₹</span>
            <span className="text-5xl md:text-[3.5rem]">{result.amount.toLocaleString("en-IN")}</span>
          </p>
          <p className="mt-2 text-sm font-medium text-ink-600">{result.service}</p>
        </div>

        {/* Receipt card */}
        <div className="px-5 pb-5 pt-1">
          <div className="relative rounded-3xl border border-ink-100 bg-ink-50/50">
            {/* Reference block */}
            <div className="flex items-center justify-between gap-3 px-5 py-4">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-500">
                  Reference ID
                </p>
                <p className="mt-0.5 truncate font-mono text-sm font-semibold text-ink-950">
                  {result.refId}
                </p>
              </div>
              <button
                type="button"
                onClick={copyRef}
                className={cn(
                  "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  copied
                    ? "border-accent-200 bg-accent-50 text-accent-700"
                    : "border-ink-200 bg-white text-ink-700 hover:border-brand-200 hover:text-brand-700"
                )}
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {/* Perforated divider */}
            <div className="relative flex items-center" aria-hidden>
              <span className="absolute -left-[13px] h-6 w-6 rounded-full border border-ink-100 bg-white" />
              <span className="mx-5 flex-1 border-t-2 border-dashed border-ink-200" />
              <span className="absolute -right-[13px] h-6 w-6 rounded-full border border-ink-100 bg-white" />
            </div>

            {/* Details */}
            <dl className="divide-y divide-ink-100/80 px-5">
              {result.customer && (
                <div className="flex items-start justify-between gap-4 py-3">
                  <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
                    Customer
                  </dt>
                  <dd className="text-right text-sm font-medium text-ink-950">{result.customer}</dd>
                </div>
              )}
              {result.meta &&
                Object.entries(result.meta).map(([k, v]) => (
                  <div key={k} className="flex items-start justify-between gap-4 py-3">
                    <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-500">
                      {k}
                    </dt>
                    <dd className="text-right text-sm font-medium tabular-nums text-ink-950">{v}</dd>
                  </div>
                ))}
              <div className="py-3 text-center">
                <p className="text-xs font-semibold text-accent-700">{payByLine(userCode)}</p>
                <p className="mt-0.5 text-[10px] text-ink-400">eMoney — Powered by BBPS</p>
              </div>
            </dl>
          </div>

          {pending && (
            <div className="mt-3 flex items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-800">
              <Clock className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
              <span>
                We&rsquo;re confirming this with the operator. Check Transaction History before
                retrying to avoid a duplicate charge.
              </span>
            </div>
          )}

          <div className="mt-4 flex gap-2">
            <Button type="button" variant="outline" className="flex-1" onClick={downloadReceipt} disabled={downloading} isLoading={downloading}>
              <Download className="h-4 w-4" />
              Receipt
            </Button>
            <Button onClick={onClose} className="flex-1">
              Done
            </Button>
          </div>
        </div>

        {/* Hidden receipt container for PDF rendering */}
        <div aria-hidden className="fixed -left-[9999px] top-0 w-[400px]">
          <ReceiptCard ref={receiptRef} result={result} userCode={userCode} />
        </div>
      </motion.div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────
   Static receipt card rendered off-screen for html2pdf capture.
   Uses inline styles exclusively (no Tailwind) so html2pdf picks them up.
   ──────────────────────────────────────────────────────────────────── */

import { forwardRef } from "react";

const ReceiptCard = forwardRef<
  HTMLDivElement,
  { result: NonNullable<TxnResult>; userCode?: string | null }
>(function ReceiptCard({ result, userCode }, ref) {
  const failed = result.status === "FAILED";
  const pending = result.status === "PENDING";
  const bgGrad = failed
    ? "linear-gradient(135deg,#e11d48,#be123c)"
    : pending
      ? "linear-gradient(135deg,#d97706,#b45309)"
      : "linear-gradient(135deg,#059669,#047857)";
  const headTitle = failed
    ? "Transaction Failed"
    : pending
      ? "Transaction Pending"
      : "Transaction Successful";
  const date = new Date().toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div
      ref={ref}
      style={{
        width: 400,
        fontFamily: "system-ui, -apple-system, sans-serif",
        background: "#fff",
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid #e5e7eb",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: bgGrad,
          color: "#fff",
          padding: "32px 24px",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: 18, fontWeight: 600, margin: "0 0 4px" }}>{headTitle}</div>
        <div style={{ fontSize: 32, fontWeight: 700, margin: "8px 0 2px" }}>
          ₹{result.amount.toLocaleString("en-IN")}
        </div>
        <div style={{ fontSize: 12, opacity: 0.85 }}>{result.service}</div>
      </div>

      {/* Body */}
      <div style={{ padding: "20px 24px" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <tbody>
            <tr>
              <td style={{ padding: "6px 0", color: "#666", fontSize: 13 }}>Reference ID</td>
              <td
                style={{
                  padding: "6px 0",
                  textAlign: "right",
                  fontWeight: 600,
                  fontSize: 13,
                  fontFamily: "monospace",
                }}
              >
                {result.refId}
              </td>
            </tr>
            {result.customer && (
              <tr style={{ borderTop: "1px solid #f3f4f6" }}>
                <td style={{ padding: "6px 0", color: "#666", fontSize: 13 }}>Customer</td>
                <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600, fontSize: 13 }}>
                  {result.customer}
                </td>
              </tr>
            )}
            {result.meta &&
              Object.entries(result.meta).map(([k, v]) => (
                <tr key={k} style={{ borderTop: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "6px 0", color: "#666", fontSize: 13 }}>{k}</td>
                  <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600, fontSize: 13 }}>
                    {v}
                  </td>
                </tr>
              ))}
            <tr style={{ borderTop: "1px solid #f3f4f6" }}>
              <td style={{ padding: "6px 0", color: "#666", fontSize: 13 }}>Date</td>
              <td style={{ padding: "6px 0", textAlign: "right", fontWeight: 600, fontSize: 13 }}>
                {date}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div
        style={{
          textAlign: "center",
          padding: "16px 24px",
          fontSize: 11,
          color: "#999",
          borderTop: "1px dashed #e5e7eb",
        }}
      >
        <div style={{ fontWeight: 600, color: "#059669", marginBottom: 4 }}>
          {payByLine(userCode)}
        </div>
        eMoney — Powered by BBPS
      </div>
    </div>
  );
});
