"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  RefreshCw,
  Send,
  AlertCircle,
  ChevronLeft,
  Clock,
  ArrowRight,
  MessageSquare,
} from "lucide-react";
import { Lifebuoy, FileText, ChatCircleDots } from "@phosphor-icons/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/Icon";
import {
  EmptyState,
  FadeIn,
  KeyValueList,
  SectionCard,
  StatusChip,
} from "@/components/dashboard/patterns";
import { cn } from "@/lib/utils";

type DisputeRow = {
  id: string;
  ticketNo: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  txnRefId: string | null;
  slaDueAt: string;
  resolvedAt: string | null;
  messageCount: number;
  createdAt: string;
};

type DisputeDetail = DisputeRow & {
  description: string;
  resolution: string | null;
  resolvedByName: string | null;
  messages: Array<{
    id: string;
    body: string;
    fromSupport: boolean;
    authorName: string;
    createdAt: string;
  }>;
};

const STATUS_LABELS: Record<string, string> = {
  OPEN: "Open",
  UNDER_REVIEW: "Under review",
  AWAITING_USER: "Needs your reply",
  RESOLVED: "Resolved",
  REJECTED: "Closed",
};

const CATEGORIES = [
  { id: "TRANSACTION", label: "Transaction issue" },
  { id: "WALLET", label: "Wallet / balance" },
  { id: "COMMISSION", label: "Commission" },
  { id: "SETTLEMENT", label: "Settlement" },
  { id: "KYC", label: "KYC / onboarding" },
  { id: "OTHER", label: "Other" },
];

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<DisputeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"list" | "detail">("list");
  const [detail, setDetail] = useState<DisputeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reply box
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/disputes");
      const d = await res.json();
      if (res.ok) setDisputes(d.disputes ?? []);
    } catch {
      /* keep last data */
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  async function openDetail(id: string) {
    setError(null);
    const res = await fetch(`/api/disputes/${id}`);
    const d = await res.json();
    if (res.ok) {
      setDetail(d.dispute);
      setView("detail");
    } else {
      setError(typeof d.error === "string" ? d.error : "Could not open the ticket");
    }
  }

  async function sendReply(e: React.FormEvent) {
    e.preventDefault();
    if (!detail || !reply.trim()) return;
    setReplying(true);
    setError(null);
    try {
      const res = await fetch(`/api/disputes/${detail.id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: reply.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setError(typeof d.error === "string" ? d.error : "Could not send the reply");
        return;
      }
      setReply("");
      await openDetail(detail.id);
      fetchList();
    } catch {
      setError("Network error — try again");
    } finally {
      setReplying(false);
    }
  }

  const isClosed = (s: string) => s === "RESOLVED" || s === "REJECTED";

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Support tickets"
        description="Track and reply to your tickets. To raise a new one, open the transaction in Reports and click “Raise ticket” — the details fill in for you."
        actions={
          view === "list" ? (
            <Button variant="outline" onClick={fetchList} disabled={loading} aria-label="Refresh tickets">
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
          ) : undefined
        }
      />

      {error && (
        <div className="flex items-start gap-2 rounded-2xl bg-rose-50 p-3 text-sm text-rose-700 ring-1 ring-inset ring-rose-200">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {view === "list" && (
        <FadeIn className="space-y-4">
          {/* Raising a ticket lives in Reports — deep-link users there. */}
          <Link
            href="/dashboard/reports"
            className="group flex items-center justify-between gap-3 rounded-3xl bg-gradient-to-r from-brand-50/80 to-white px-5 py-4 ring-1 ring-brand-100 transition-[box-shadow,transform] hover:-translate-y-0.5 hover:shadow-energy-sm focus-energy"
          >
            <div className="flex items-center gap-3">
              <IconTile icon={FileText} tone="brand" size="md" />
              <div>
                <p className="text-sm font-semibold text-ink-900">Need to raise a ticket?</p>
                <p className="text-xs text-ink-500">
                  Open the transaction in Reports and click “Raise ticket” — details fill in automatically.
                </p>
              </div>
            </div>
            <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-brand-700">
              Go to Reports <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>

          <SectionCard
            icon={<IconTile icon={Lifebuoy} tone="royal" size="sm" />}
            title="Your tickets"
            description={
              loading
                ? "Loading…"
                : `${disputes.length} ticket(s) · Urgent tickets are answered within 4 hours, normal within 48 hours.`
            }
            padding="none"
          >
            {disputes.length === 0 ? (
              loading ? (
                <div className="p-12 text-center text-sm text-ink-500">Loading…</div>
              ) : (
                <EmptyState
                  icon={ChatCircleDots}
                  tone="royal"
                  title="No tickets yet"
                  description="If something went wrong with a transaction, raise a ticket from Reports and we'll pick it up."
                  action={
                    <Link href="/dashboard/reports">
                      <Button variant="outline" size="sm">
                        Open Reports <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  }
                />
              )
            ) : (
              <ul className="divide-y divide-ink-100">
                {disputes.map((d) => (
                  <li key={d.id}>
                    <button
                      type="button"
                      onClick={() => openDetail(d.id)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-brand-50/30 focus-energy md:px-6"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs text-ink-500">{d.ticketNo}</span>
                          <StatusChip status={d.status} label={STATUS_LABELS[d.status] ?? d.status} size="sm" />
                          {d.priority && d.priority !== "NORMAL" && (
                            <StatusChip status={d.priority} size="sm" />
                          )}
                        </div>
                        <p className="mt-1 truncate text-sm font-semibold text-ink-900">{d.subject}</p>
                        <p className="text-xs text-ink-500">
                          {CATEGORIES.find((c) => c.id === d.category)?.label ?? d.category}
                          {d.txnRefId && <> · <span className="font-mono">{d.txnRefId}</span></>}
                        </p>
                      </div>
                      <div className="shrink-0 text-right text-xs text-ink-500">
                        <div>{new Date(d.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}</div>
                        <div className="mt-1 inline-flex items-center gap-1 text-ink-400">
                          <MessageSquare className="h-3 w-3" /> {d.messageCount}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
        </FadeIn>
      )}

      {view === "detail" && detail && (
        <FadeIn className="space-y-4">
          <button
            type="button"
            onClick={() => {
              setView("list");
              setDetail(null);
            }}
            className="inline-flex items-center gap-1 text-xs font-semibold text-ink-500 hover:text-ink-900"
          >
            <ChevronLeft className="h-3.5 w-3.5" /> Back to tickets
          </button>

          <SectionCard
            eyebrow={detail.ticketNo}
            title={detail.subject}
            action={
              <div className="flex flex-wrap items-center gap-2">
                <StatusChip status={detail.status} label={STATUS_LABELS[detail.status] ?? detail.status} />
                {!isClosed(detail.status) && (
                  <span className="inline-flex items-center gap-1 text-xs text-ink-500">
                    <Clock className="h-3 w-3" />
                    Due {new Date(detail.slaDueAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                )}
              </div>
            }
          >
            <p className="whitespace-pre-wrap text-sm text-ink-700">{detail.description}</p>

            <KeyValueList
              className="mt-4"
              layout="grid"
              items={[
                {
                  label: "Category",
                  value: CATEGORIES.find((c) => c.id === detail.category)?.label ?? detail.category,
                },
                { label: "Priority", value: <StatusChip status={detail.priority} size="sm" /> },
                ...(detail.txnRefId
                  ? [{ label: "Linked transaction", value: detail.txnRefId, mono: true }]
                  : []),
                {
                  label: "Raised on",
                  value: new Date(detail.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }),
                },
              ]}
            />

            {detail.resolution && (
              <div
                className={cn(
                  "mt-4 rounded-2xl p-4 text-sm ring-1 ring-inset",
                  detail.status === "RESOLVED"
                    ? "bg-emerald-50 text-emerald-800 ring-emerald-200"
                    : "bg-rose-50 text-rose-800 ring-rose-200"
                )}
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.16em]">
                  {detail.status === "RESOLVED" ? "Resolution" : "Closure note"}
                </p>
                <p className="mt-1 whitespace-pre-wrap">{detail.resolution}</p>
              </div>
            )}
          </SectionCard>

          <SectionCard
            icon={<IconTile icon={ChatCircleDots} tone="brand" size="sm" />}
            title="Conversation"
            description={`${detail.messages.length} message(s)`}
          >
            <ul className="space-y-3">
              {detail.messages.length === 0 && (
                <li className="rounded-2xl bg-ink-50/70 px-4 py-3 text-xs text-ink-500">
                  No replies yet — support will respond within the SLA.
                </li>
              )}
              {detail.messages.map((m) => (
                <li
                  key={m.id}
                  className={cn(
                    "max-w-[85%] rounded-2xl px-4 py-3 text-sm",
                    m.fromSupport
                      ? "bg-brand-50 text-ink-800 ring-1 ring-inset ring-brand-100"
                      : "ml-auto bg-ink-900 text-white"
                  )}
                >
                  <p
                    className={cn(
                      "text-[10px] font-bold uppercase tracking-[0.16em]",
                      m.fromSupport ? "text-brand-700" : "text-white/60"
                    )}
                  >
                    {m.fromSupport ? "Support" : m.authorName} ·{" "}
                    {new Date(m.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap">{m.body}</p>
                </li>
              ))}
            </ul>

            <form onSubmit={sendReply} className="mt-5 flex gap-2">
              <Input
                placeholder={isClosed(detail.status) ? "Reply to reopen this ticket…" : "Write a reply…"}
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                aria-label="Reply"
              />
              <Button type="submit" disabled={replying || !reply.trim()}>
                <Send className="h-4 w-4" />
                {replying ? "Sending…" : "Send"}
              </Button>
            </form>
          </SectionCard>
        </FadeIn>
      )}
    </div>
  );
}
