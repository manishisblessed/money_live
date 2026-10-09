"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, ExternalLink } from "lucide-react";
import { SealCheck } from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/Icon";
import { Label } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";

export type RaiseTicketPayload = {
  /** Real Transaction.refId this ticket is about (validated server-side). */
  txnRefId: string;
  /** Auto-generated subject line. */
  subject: string;
  /** Human-readable transaction details, auto-filled from the report row. */
  detailsText: string;
  /** Dispute category — transaction reports use TRANSACTION. */
  category?: string;
};

type Props = {
  payload: RaiseTicketPayload | null;
  onClose: () => void;
};

/**
 * Raise-a-ticket modal launched from a report row. The transaction details are
 * pre-collected from the row (read-only preview) so the user only writes a short
 * remark. On submit it POSTs to /api/disputes with the details + remark stitched
 * into the description and the transaction linked via txnRefId.
 */
export function RaiseTicketModal({ payload, onClose }: Props) {
  const [remark, setRemark] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ ticketNo: string; id: string } | null>(null);

  // Reset local state whenever a new transaction is targeted.
  useEffect(() => {
    setRemark("");
    setError(null);
    setDone(null);
    setSubmitting(false);
  }, [payload?.txnRefId]);

  // Close on Escape.
  useEffect(() => {
    if (!payload) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [payload, onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!payload) return;
    const note = remark.trim();
    if (!note) {
      setError("Add a short remark describing the problem.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const description = `${payload.detailsText}\n\nCustomer remark:\n${note}`;
      const res = await fetch("/api/disputes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: payload.category ?? "TRANSACTION",
          subject: payload.subject.slice(0, 140),
          description: description.slice(0, 4000),
          txnRefId: payload.txnRefId,
        }),
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(typeof d.error === "string" ? d.error : "Could not raise the ticket — try again.");
        return;
      }
      setDone({ ticketNo: d.ticketNo, id: d.id });
    } catch {
      setError("Network error — try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Modal
      open={!!payload}
      onClose={onClose}
      size="md"
      eyebrow="Support"
      title="Raise a ticket"
      subtitle={
        payload ? (
          <>
            For transaction{" "}
            <span className="rounded-md bg-white/80 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-ink-800 ring-1 ring-inset ring-ink-200/70">
              {payload.txnRefId}
            </span>
          </>
        ) : undefined
      }
    >
      {payload &&
        (done ? (
          <div className="py-4 text-center">
            <span className="relative mx-auto inline-flex">
              <span
                aria-hidden
                className="absolute inset-0 rounded-2xl bg-accent-300 opacity-40 blur-xl"
              />
              <IconTile icon={SealCheck} tone="accent" size="xl" className="relative" />
            </span>
            <p className="mt-4 font-display text-xl font-semibold tracking-[-0.02em] text-ink-950">
              Ticket raised
            </p>
            <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-ink-600">
              Your ticket{" "}
              <span className="font-mono font-semibold text-ink-900">{done.ticketNo}</span> is
              with our support team. You can track replies from Support Tickets.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <Link href="/dashboard/disputes">
                <Button variant="outline">
                  <ExternalLink className="h-4 w-4" /> View my tickets
                </Button>
              </Link>
              <Button onClick={onClose}>Done</Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            {error && (
              <div className="mb-4 flex items-start gap-2 rounded-2xl border border-coral-200 bg-coral-50 p-3 text-sm text-coral-700">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Auto-filled transaction details */}
            <div>
              <Label className="flex items-center justify-between">
                <span>Transaction details</span>
                <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
                  Auto-filled
                </span>
              </Label>
              <pre className="max-h-52 overflow-y-auto whitespace-pre-wrap rounded-2xl border border-ink-100 bg-ink-50/60 p-3.5 font-sans text-xs leading-relaxed text-ink-700">
                {payload.detailsText}
              </pre>
              <p className="mt-1.5 text-[11px] text-ink-400">
                These details are attached automatically — you don&apos;t need to type them again.
              </p>
            </div>

            {/* User remark */}
            <div className="mt-4">
              <Label htmlFor="remark">Your remark</Label>
              <textarea
                id="remark"
                required
                minLength={3}
                maxLength={2000}
                rows={4}
                autoFocus
                className="w-full rounded-2xl border border-ink-200 bg-white px-4 py-3 text-sm text-ink-900 shadow-sm outline-none transition-[border-color,box-shadow] duration-200 placeholder:text-ink-400 focus:border-brand-400 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.14),0_8px_24px_-10px_rgba(244,63,94,0.25)]"
                placeholder="Tell us what went wrong (e.g. amount debited but payment failed, no confirmation received)…"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
              />
              <p className="mt-1 text-right text-[11px] tabular-nums text-ink-400">
                {remark.length}/2000
              </p>
            </div>

            <div className="mt-4 flex items-center justify-end gap-2">
              <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
                Cancel
              </Button>
              <Button type="submit" isLoading={submitting} disabled={submitting || !remark.trim()}>
                {submitting ? "Raising…" : "Raise ticket"}
              </Button>
            </div>
          </form>
        ))}
    </Modal>
  );
}
