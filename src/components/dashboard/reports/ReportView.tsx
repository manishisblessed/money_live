"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toDisplayRole } from "@/lib/auth";
import {
  Search,
  RefreshCw,
  AlertTriangle,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Info,
  SlidersHorizontal,
} from "lucide-react";
import { LifeBuoy } from "lucide-react";
import { Tray } from "@phosphor-icons/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Sparkline } from "@/components/dashboard/Sparkline";
import { ReportActions } from "@/components/dashboard/ReportActions";
import { RaiseTicketModal, type RaiseTicketPayload } from "@/components/dashboard/reports/RaiseTicketModal";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/Icon";
import { Input, Select, Label } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { REPORTS } from "@/lib/reports/registry";
import { brandLogoUrl, brandBadge, brandLocalLogos } from "@/lib/brand/logos";
import { bankLogoPath } from "@/lib/bank-logos";
import type { ReportColumnDef, Accent, ReportConfig } from "@/lib/reports/registry";
import type { ReportType, ReportResult } from "@/lib/reports/types";
import type { ReportColumn } from "@/lib/reports";
import { cn } from "@/lib/utils";

type Row = Record<string, unknown>;

/** Registry accent → v2 tone treatments. */
const ACCENT_TEXT: Record<Accent, string> = {
  brand: "text-brand-700",
  accent: "text-accent-700",
  emerald: "text-accent-700",
  violet: "text-royal-700",
};
const ACCENT_GLOW: Record<Accent, string> = {
  brand: "bg-brand-400",
  accent: "bg-accent-400",
  emerald: "bg-accent-400",
  violet: "bg-royal-400",
};
const ACCENT_DOT: Record<Accent, string> = {
  brand: "from-brand-500 to-brand-700",
  accent: "from-accent-500 to-accent-600",
  emerald: "from-accent-500 to-accent-700",
  violet: "from-royal-500 to-royal-700",
};
const ACCENT_HEX: Record<Accent, string> = {
  brand: "#2563eb",
  accent: "#16a34a",
  emerald: "#16a34a",
  violet: "#7c3aed",
};

/** Column colour → Tailwind text classes for header and body cells. */
const COL_COLOR_HEADER: Record<string, string> = {
  green:  "text-accent-600",
  red:    "text-coral-600",
  orange: "text-orange-600",
  yellow: "text-amber-600",
};
const COL_COLOR_CELL: Record<string, string> = {
  green:  "text-accent-700",
  red:    "text-coral-600",
  orange: "text-orange-600",
  yellow: "text-amber-600",
};

const ACRONYMS = new Set(["AEPS", "DMT", "UPI", "DTH", "PAN", "GST", "IMPS", "NEFT", "RTGS", "POS", "QR", "PG", "BBPS", "ID"]);
function humanize(code: string): string {
  return String(code)
    .split("_")
    .map((w) => (ACRONYMS.has(w) ? w : w.charAt(0) + w.slice(1).toLowerCase()))
    .join(" ");
}

function inr2(n: number): string {
  return `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function badgeVariant(raw: string): "success" | "warning" | "danger" | "brand" | "accent" | "default" {
  const v = String(raw).toUpperCase().trim();
  if (["SUCCESS", "APPROVED", "CREDIT", "ACTIVE", "SETTLED", "RECEIVED", "COMMISSION", "TOPUP", "REFUNDED"].includes(v)) return "success";
  if (["FAILED", "REJECTED", "REVERSED", "DEBIT", "DECOMMISSIONED", "CANCELLED", "PENALTY"].includes(v)) return "danger";
  if (["PENDING", "PENDING_APPROVAL", "PROCESSING", "INITIATED", "HOLD", "RECONCILING", "MAINTENANCE", "IN BANK", "INACTIVE"].includes(v)) return "warning";
  if (["FUND_TRANSFER_IN", "DRAFT", "TRANSACTION"].includes(v)) return "brand";
  if (["WITHDRAW", "FUND_TRANSFER_OUT", "FEE", "ADJUSTMENT", "PAYOUT"].includes(v)) return "accent";
  return "default";
}

/** Statuses that are still in flight — rendered with the live dot badge. */
const LIVE_STATUS = new Set(["PENDING", "PENDING_APPROVAL", "PROCESSING", "INITIATED", "RECONCILING"]);

/** Coloured wordmark/monogram tile used when no logo image is available. */
function BrandBadge({ name }: { name: string }) {
  const badge = brandBadge(name);
  const label = badge.label.length > 6 ? badge.label.slice(0, 6) : badge.label;
  return (
    <span
      title={name || undefined}
      style={{ backgroundColor: badge.bg, color: badge.fg }}
      className="mx-auto inline-flex h-7 min-w-[2.5rem] items-center justify-center rounded-lg px-1.5 text-[9px] font-bold tracking-wide ring-1 ring-inset ring-black/5"
    >
      {label}
    </span>
  );
}

/**
 * Bank / operator logo cell. Resolves an image through a cascade and gracefully
 * degrades on each failure:
 *   self-hosted asset (/banks/<slug>.svg|png)  →  CDN logo  →  coloured monogram
 * When the value is an explicit URL (e.g. a stored Operator.logoUrl) it is used
 * directly, falling back to a neutral placeholder if it fails to load.
 */
function AvatarCell({ value }: { value: string }) {
  const [attempt, setAttempt] = useState(0);
  const s = String(value ?? "").trim();
  if (!s || s === "—") return <span className="text-ink-400">—</span>;

  const isUrl = /^https?:\/\//i.test(s) || s.startsWith("/");
  // Prefer the curated credit-card issuer logo (same assets shown in the payment
  // operator picker) so a paid card's real logo appears in the report/ledger.
  const sources = isUrl
    ? [s]
    : [bankLogoPath(s), ...brandLocalLogos(s), brandLogoUrl(s)].filter(
        (u): u is string => !!u
      );

  if (attempt < sources.length) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={sources[attempt]}
        alt=""
        onError={() => setAttempt((a) => a + 1)}
        className="mx-auto h-7 w-7 rounded-lg bg-white object-contain p-0.5 ring-1 ring-inset ring-ink-100"
      />
    );
  }
  // Everything failed: branded monogram for a name, neutral dash for a bare URL.
  return isUrl ? <span className="text-ink-400">—</span> : <BrandBadge name={s} />;
}

/** Display node for the on-screen table. */
function displayCell(value: unknown, format?: ReportColumnDef["format"]) {
  if (format === "avatar") return <AvatarCell value={String(value ?? "")} />;
  if (value === null || value === undefined || value === "") return <span className="text-ink-400">—</span>;
  switch (format) {
    case "money":
      return typeof value === "number" ? <span className="font-semibold tabular-nums text-ink-950">{inr2(value)}</span> : <span>{String(value)}</span>;
    case "int":
      return typeof value === "number" ? <span className="tabular-nums">{value.toLocaleString("en-IN")}</span> : <span>{String(value)}</span>;
    case "percent":
      return typeof value === "number" ? <span className="tabular-nums">{value.toFixed(1)}%</span> : <span>{String(value)}</span>;
    case "date":
      return <span className="whitespace-nowrap text-ink-600">{toDateStr(value)}</span>;
    case "datetime":
      return <span className="whitespace-nowrap text-ink-600">{toDateTimeStr(value)}</span>;
    case "badge": {
      const raw = String(value);
      return (
        <Badge
          variant={badgeVariant(raw)}
          size="sm"
          dot={LIVE_STATUS.has(raw.toUpperCase().trim())}
        >
          {humanize(raw)}
        </Badge>
      );
    }
    case "mono":
      return <span className="font-mono text-xs text-ink-700">{String(value)}</span>;
    default:
      return <span>{String(value)}</span>;
  }
}

function toDateStr(value: unknown): string {
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}
function toDateTimeStr(value: unknown): string {
  const d = new Date(String(value));
  if (Number.isNaN(d.getTime())) return String(value);
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

/** String for CSV/PDF export cells (numeric XLSX cells use the raw value). */
function exportString(value: unknown, format?: ReportColumnDef["format"]): string {
  if (value === null || value === undefined) return "";
  switch (format) {
    case "avatar":
      return "";
    case "money":
      return typeof value === "number" ? inr2(value) : String(value);
    case "percent":
      return typeof value === "number" ? `${value.toFixed(1)}%` : String(value);
    case "date":
      return toDateStr(value);
    case "datetime":
      return toDateTimeStr(value);
    case "badge":
      return humanize(String(value));
    default:
      return String(value);
  }
}

function toColFormat(f?: ReportColumnDef["format"]): ReportColumn<Row>["format"] {
  if (f === "money" || f === "int" || f === "date" || f === "datetime") return f;
  return "text";
}

/**
 * Statuses for which a "Raise ticket" action is offered — pending / in-flight or
 * failed transactions. Clean successes (SUCCESS, SETTLED, REFUNDED…) don't need
 * a dispute, so no button is shown for them.
 */
const TICKETABLE_STATUS = new Set([
  "INITIATED", "PROCESSING", "HOLD", "PENDING", "PENDING_APPROVAL", "FAILED",
]);

function isTicketable(row: Row): boolean {
  const refId = row["refId"];
  if (!refId || String(refId).trim() === "" || String(refId).trim() === "—") return false;
  return TICKETABLE_STATUS.has(String(row["status"] ?? "").toUpperCase().trim());
}

/** Auto-compile the report row into a readable details block for the ticket. */
function buildTicketDetails(row: Row, columns: ReportColumnDef[], reportTitle: string): string {
  const lines = columns
    .filter((c) => c.format !== "avatar")
    .map((c) => {
      const v = exportString(row[c.key], c.format).trim();
      return v && v !== "—" ? `• ${c.header}: ${v}` : null;
    })
    .filter((l): l is string => !!l);
  return `Transaction details (auto-filled from ${reportTitle}):\n${lines.join("\n")}`;
}

/** Short subject line derived from the transaction. Capped to the API's 140 chars. */
function buildTicketSubject(row: Row, reportTitle: string): string {
  const refId = String(row["refId"] ?? "").trim();
  const status = humanize(String(row["status"] ?? "").trim());
  return `${reportTitle}: ${refId}${status ? ` (${status})` : ""}`.slice(0, 140);
}

/* v2 table cell classes (shared with DataTable's look). */
const TH =
  "whitespace-nowrap border-y border-ink-100 bg-ink-50/60 px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500";
const TD = "whitespace-nowrap border-b border-ink-100 px-5 py-3";
const FIRST_TD =
  "relative before:absolute before:inset-y-0 before:left-0 before:w-0.5 before:rounded-r-full before:bg-energy-gradient before:opacity-0 before:transition-opacity before:duration-200 before:content-[''] group-hover:before:opacity-100";
const PAGE_BTN =
  "inline-flex h-9 items-center justify-center gap-1 rounded-2xl border border-ink-200 bg-white px-3 text-sm font-semibold text-ink-700 transition hover:border-ink-300 hover:bg-ink-50 focus-energy disabled:pointer-events-none disabled:opacity-40";

export function ReportView({ type }: { type: ReportType }) {
  const { data: session } = useSession();
  const isRetailer =
    !!session?.user?.role &&
    toDisplayRole(session.user.role as string) === "retailer";

  // Retailers don't need the raw "Operator / Provider" code (e.g. "4004") — the
  // Bank column + logo already identify the issuer. Drop it from their view
  // (table + exports); admins/distributors keep it for reconciliation.
  const base = REPORTS[type];
  const config = useMemo<ReportConfig>(
    () =>
      isRetailer
        ? { ...base, columns: base.columns.filter((c) => c.key !== "operator") }
        : base,
    [base, isRetailer]
  );
  const f = config.filters;

  const today = useMemo(() => new Date(), []);
  const monthAgo = useMemo(() => new Date(today.getTime() - 30 * 86_400_000), [today]);
  const ymd = (d: Date) => d.toISOString().slice(0, 10);

  // Honor ?from=YYYY-MM-DD&to=YYYY-MM-DD so callers (e.g. the dashboard
  // "Today's Business Overview" cards) can deep-link a pre-filtered range that
  // matches the figure the user just clicked. Falls back to the default window.
  const sp = useSearchParams();
  const isYmd = (s: string | null): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
  const spFrom = sp.get("from");
  const spTo = sp.get("to");

  const [from, setFrom] = useState(
    f.dateRange ? (isYmd(spFrom) ? spFrom : ymd(monthAgo)) : ""
  );
  const [to, setTo] = useState(f.dateRange ? (isYmd(spTo) ? spTo : ymd(today)) : "");
  const [qInput, setQInput] = useState("");
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [service, setService] = useState("");
  const [mode, setMode] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const [data, setData] = useState<ReportResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Raise-ticket modal (reports are the only place users open a support ticket).
  const canRaiseTicket = !!config.raiseTicket;
  const [ticket, setTicket] = useState<RaiseTicketPayload | null>(null);
  const openTicket = useCallback(
    (row: Row) => {
      setTicket({
        txnRefId: String(row["refId"] ?? "").trim(),
        subject: buildTicketSubject(row, config.title),
        detailsText: buildTicketDetails(row, config.columns, config.title),
        category: "TRANSACTION",
      });
    },
    [config.columns, config.title]
  );

  // Debounce free-text search.
  useEffect(() => {
    const t = setTimeout(() => {
      setQ(qInput.trim());
      setPage(1);
    }, 350);
    return () => clearTimeout(t);
  }, [qInput]);

  const baseQuery = useCallback(() => {
    const p = new URLSearchParams();
    if (f.dateRange) {
      if (from) p.set("from", from);
      if (to) p.set("to", to);
    }
    if (q) p.set("q", q);
    if (status) p.set("status", status);
    if (service) p.set("service", service);
    if (mode) p.set("mode", mode);
    return p;
  }, [f.dateRange, from, to, q, status, service, mode]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const p = baseQuery();
      p.set("page", String(page));
      p.set("pageSize", String(pageSize));
      const res = await fetch(`/api/reports/${type}?${p.toString()}`);
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(typeof j.error === "string" ? j.error : "Failed to load report");
      }
      setData((await res.json()) as ReportResult);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load report");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [baseQuery, page, pageSize, type]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Full filtered dataset for exports (capped server-side), with a totals row.
  const fetchAllRows = useCallback(async (): Promise<Row[]> => {
    const p = baseQuery();
    p.set("export", "1");
    const res = await fetch(`/api/reports/${type}?${p.toString()}`);
    if (!res.ok) return data?.rows ?? [];
    const json = (await res.json()) as ReportResult;
    const rows = [...json.rows];
    if (json.totals && Object.keys(json.totals).length > 0) rows.push(json.totals as Row);
    return rows;
  }, [baseQuery, type, data]);

  const exportColumns: ReportColumn<Row>[] = useMemo(
    () =>
      config.columns.map((c) => ({
        key: c.key,
        header: c.header,
        format: toColFormat(c.format),
        render: (row: Row) => exportString(row[c.key], c.format),
      })),
    [config.columns]
  );

  const rows = data?.rows ?? [];
  const totals = data?.totals ?? {};
  const hasTotals = Object.keys(totals).length > 0;
  const totalRecords = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));
  const startIdx = totalRecords === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, totalRecords);

  const resetFilters = () => {
    setFrom(f.dateRange ? ymd(monthAgo) : "");
    setTo(f.dateRange ? ymd(today) : "");
    setQInput("");
    setQ("");
    setStatus("");
    setService("");
    setMode("");
    setPage(1);
  };

  const colSpan = config.columns.length + (canRaiseTicket ? 1 : 0);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/reports"
        className="inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-white px-3 py-1.5 text-xs font-semibold text-ink-600 shadow-sm transition hover:border-brand-200 hover:text-brand-700"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Back to reports
      </Link>

      <PageHeader
        eyebrow="Reports"
        title={config.title}
        description={config.description}
        actions={
          <>
            <ReportActions
              filename={`${type}-report`}
              title={`JMP eMoney · ${config.title}`}
              subtitle={
                f.dateRange && from && to ? `${toDateStr(from)} – ${toDateStr(to)}` : "All records"
              }
              columns={exportColumns}
              rows={rows}
              fetchRows={fetchAllRows}
            />
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </>
        }
      />

      {/* KPI cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {(data?.summary ?? []).map((s) => {
          const a = s.accent ?? config.accent;
          return (
            <div
              key={s.label}
              className="relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-5 shadow-sm shadow-inner-ring"
            >
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute -right-10 -top-12 h-32 w-32 rounded-full opacity-[0.10] blur-2xl",
                  ACCENT_GLOW[a]
                )}
              />
              <p className="relative text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                {s.label}
              </p>
              {loading && !data ? (
                <Skeleton className="relative mt-2 h-8 w-28" />
              ) : (
                <p
                  className={cn(
                    "relative mt-1.5 font-display text-2xl font-semibold leading-none tracking-[-0.02em] tabular-nums md:text-3xl",
                    ACCENT_TEXT[a]
                  )}
                >
                  {s.value}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Trend sparkline */}
      {data?.trend && data.trend.values.length > 1 && (
        <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
              <span className={cn("h-2 w-2 rounded-full bg-gradient-to-br", ACCENT_DOT[config.accent])} />
              {data.trend.label}
            </p>
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-ink-500">
              {data.trend.values.length} points
            </span>
          </div>
          <div className="mt-3">
            <Sparkline values={data.trend.values} color={data.trend.color || ACCENT_HEX[config.accent]} height={70} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="rounded-3xl border border-ink-100 bg-white p-4 shadow-sm md:p-5">
        <div className="mb-3 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
          Filters
        </div>
        <div className="flex flex-wrap items-end gap-3">
          {f.dateRange && (
            <>
              <div>
                <Label htmlFor="from">From</Label>
                <Input id="from" type="date" value={from} max={to || undefined} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className="w-44" />
              </div>
              <div>
                <Label htmlFor="to">To</Label>
                <Input id="to" type="date" value={to} min={from || undefined} onChange={(e) => { setTo(e.target.value); setPage(1); }} className="w-44" />
              </div>
            </>
          )}

          {f.status && (
            <div>
              <Label htmlFor="status">{f.status.label}</Label>
              <Select id="status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} className="w-44">
                <option value="">All</option>
                {f.status.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
          )}

          {f.service && (
            <div>
              <Label htmlFor="service">{f.service.label}</Label>
              <Select id="service" value={service} onChange={(e) => { setService(e.target.value); setPage(1); }} className="w-48">
                <option value="">All</option>
                {f.service.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
          )}

          {f.mode && (
            <div>
              <Label htmlFor="mode">{f.mode.label}</Label>
              <Select id="mode" value={mode} onChange={(e) => { setMode(e.target.value); setPage(1); }} className="w-40">
                <option value="">All</option>
                {f.mode.options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </div>
          )}

          {f.search && (
            <div className="min-w-[220px] flex-1">
              <Label htmlFor="q">Search</Label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
                <Input id="q" value={qInput} onChange={(e) => setQInput(e.target.value)} placeholder={f.search} className="pl-10" />
              </div>
            </div>
          )}

          <Button variant="ghost" onClick={resetFilters}>Reset</Button>
        </div>
      </div>

      {/* Note / errors */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-coral-200 bg-coral-50 px-4 py-3 text-sm text-coral-700">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}
      {data?.note && !error && (
        <div className="flex items-center gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <Info className="h-4 w-4 shrink-0" />
          {data.note}
        </div>
      )}

      {/* Table */}
      <div className="min-w-0 overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <h3 className="font-display text-base font-semibold tracking-[-0.02em] text-ink-950 md:text-lg">
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Skeleton className="h-5 w-32" />
              </span>
            ) : (
              <>
                <span className="tabular-nums">{totalRecords.toLocaleString("en-IN")}</span>{" "}
                record{totalRecords === 1 ? "" : "s"}
              </>
            )}
          </h3>
          <div className="flex items-center gap-2">
            <Label htmlFor="pageSize" className="mb-0 text-xs text-ink-500">Rows</Label>
            <Select id="pageSize" value={String(pageSize)} onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} className="h-9 w-20 rounded-xl px-3">
              {[20, 50, 100].map((n) => <option key={n} value={n}>{n}</option>)}
            </Select>
          </div>
        </div>

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-max border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-[1]">
              <tr>
                {config.columns.map((c) => (
                  <th
                    key={c.key}
                    scope="col"
                    className={cn(
                      TH,
                      "backdrop-blur",
                      c.align === "right" && "text-right",
                      c.color ? COL_COLOR_HEADER[c.color] ?? "" : ""
                    )}
                  >
                    {c.header}
                  </th>
                ))}
                {canRaiseTicket && (
                  <th scope="col" className={cn(TH, "text-right backdrop-blur")}>Action</th>
                )}
              </tr>
            </thead>
            <tbody className="text-ink-800">
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {config.columns.map((c) => (
                      <td key={c.key} className={cn(TD, "py-3.5")}>
                        <Skeleton className={cn("h-3 w-20", c.align === "right" && "ml-auto")} />
                      </td>
                    ))}
                    {canRaiseTicket && (
                      <td className={cn(TD, "py-3.5")}>
                        <Skeleton className="ml-auto h-3 w-16" />
                      </td>
                    )}
                  </tr>
                ))
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-5 py-14">
                    <div className="mx-auto flex max-w-sm flex-col items-center text-center">
                      <span className="relative">
                        <span aria-hidden className="absolute inset-0 rounded-2xl bg-brand-200 opacity-40 blur-xl" />
                        <IconTile icon={Tray} tone="brand" size="xl" className="relative" />
                      </span>
                      <p className="mt-4 font-display text-base font-semibold tracking-[-0.01em] text-ink-900">
                        No records match your filters
                      </p>
                      <p className="mt-1 text-sm leading-relaxed text-ink-500">
                        Try widening the date range or clearing a filter.
                      </p>
                      <Button variant="outline" size="sm" className="mt-4" onClick={resetFilters}>
                        Reset filters
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr key={i} className="group transition-colors hover:bg-brand-50/30">
                    {config.columns.map((c, ci) => (
                      <td
                        key={c.key}
                        className={cn(
                          TD,
                          ci === 0 && FIRST_TD,
                          c.align === "right" && "text-right",
                          c.color ? COL_COLOR_CELL[c.color] ?? "" : ""
                        )}
                      >
                        {displayCell(row[c.key], c.format)}
                      </td>
                    ))}
                    {canRaiseTicket && (
                      <td className={cn(TD, "text-right")}>
                        {isTicketable(row) ? (
                          <button
                            type="button"
                            onClick={() => openTicket(row)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-700 transition hover:border-brand-300 hover:bg-brand-100 hover:shadow-sm focus-energy"
                          >
                            <LifeBuoy className="h-3.5 w-3.5" /> Raise ticket
                          </button>
                        ) : (
                          <span className="text-ink-300">—</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
            {!loading && rows.length > 0 && hasTotals && (
              <tfoot>
                <tr className="bg-ink-50/70 font-semibold text-ink-950">
                  {config.columns.map((c, idx) => {
                    const tv = totals[c.key];
                    return (
                      <td
                        key={c.key}
                        className={cn(
                          "whitespace-nowrap border-t-2 border-ink-200 px-5 py-3",
                          c.align === "right" && "text-right",
                          c.color ? COL_COLOR_CELL[c.color] ?? "" : ""
                        )}
                      >
                        {tv === undefined
                          ? idx === 0 && !("service" in totals || "date" in totals || "tid" in totals)
                            ? <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500">Total</span>
                            : ""
                          : c.format === "money" || c.format === "int" || c.format === "percent"
                            ? displayCell(tv, c.format)
                            : <span className="text-ink-700">{String(tv)}</span>}
                      </td>
                    );
                  })}
                  {canRaiseTicket && <td className="border-t-2 border-ink-200 px-5 py-3" />}
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* Pagination */}
        {!loading && totalRecords > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 bg-ink-50/40 px-5 py-3 text-sm text-ink-600">
            <span className="text-xs sm:text-sm">
              Showing{" "}
              <span className="font-semibold tabular-nums text-ink-900">{startIdx.toLocaleString("en-IN")}</span>–
              <span className="font-semibold tabular-nums text-ink-900">{endIdx.toLocaleString("en-IN")}</span> of{" "}
              <span className="font-semibold tabular-nums text-ink-900">{totalRecords.toLocaleString("en-IN")}</span>
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                className={PAGE_BTN}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" /> <span className="hidden sm:inline">Prev</span>
              </button>
              <span className="rounded-2xl bg-ink-950 px-3 py-1.5 text-xs font-semibold tabular-nums text-white">
                {page} / {totalPages}
              </span>
              <button
                type="button"
                className={PAGE_BTN}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                aria-label="Next page"
              >
                <span className="hidden sm:inline">Next</span> <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {canRaiseTicket && <RaiseTicketModal payload={ticket} onClose={() => setTicket(null)} />}
    </div>
  );
}
