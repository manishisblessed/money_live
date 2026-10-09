"use client";

import { useState } from "react";
import { Eye, FileText, FileSpreadsheet, FolderArchive, X, Loader2 } from "lucide-react";
import { Files } from "@phosphor-icons/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/Icon";
import { useAuth } from "@/lib/useAuth";
import {
  downloadCSV,
  downloadPDF,
  downloadZIP,
  type ReportColumn,
  cellValue
} from "@/lib/reports";

type Props<T> = {
  /** Used as the file name + on-screen title for the report. */
  filename: string;
  /** Document title for the PDF + preview header. */
  title: string;
  columns: ReportColumn<T>[];
  rows: T[];
  /** Optional secondary line under the report title in PDF / preview. */
  subtitle?: string;
  /**
   * Optional async provider for the FULL filtered dataset. When supplied, the
   * CSV/PDF/XLSX buttons export every matching row (server-side, ownership
   * scoped) instead of only the current page. The on-screen preview still uses
   * `rows` for a fast peek.
   */
  fetchRows?: () => Promise<T[]>;
};

/**
 * Four-button toolbar — View, CSV, PDF, ZIP — that any report-style page can
 * drop into its `<PageHeader actions>` slot.
 *
 * Access is implicit: a user can only see this component if they were
 * already allowed onto the page hosting it, so the data always reflects
 * the role-scoped rows the page chose to render.
 */
export function ReportActions<T>({
  filename,
  title,
  columns,
  rows,
  subtitle,
  fetchRows
}: Props<T>) {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState<null | "csv" | "zip" | "pdf">(null);

  const generatedFor = session
    ? `${session.name} (${session.role}${session.userCode ? " · " + session.userCode : ""})`
    : undefined;

  async function resolveRows(): Promise<T[]> {
    if (!fetchRows) return rows;
    return await fetchRows();
  }

  async function doExport(kind: "csv" | "zip" | "pdf") {
    try {
      setBusy(kind);
      const data = await resolveRows();
      if (kind === "csv") downloadCSV(filename, data, columns);
      else if (kind === "zip") await downloadZIP(filename, data, columns);
      else downloadPDF(title, data, columns, { generatedFor, subtitle });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-ink-200 bg-white p-1 shadow-sm">
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl"
          onClick={() => setOpen(true)}
          title="Preview the report"
        >
          <Eye className="h-4 w-4" />
          View
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl"
          onClick={() => doExport("csv")}
          disabled={busy !== null}
          title="Download as CSV"
        >
          {busy === "csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />}
          CSV
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-xl"
          onClick={() => doExport("pdf")}
          disabled={busy !== null}
          title="Open print-ready PDF"
        >
          {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
          PDF
        </Button>
      </div>
      <Button size="md" onClick={() => doExport("zip")} disabled={busy !== null} title="Download as ZIP archive">
        {busy === "zip" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderArchive className="h-4 w-4" />}
        ZIP
      </Button>

      <AnimatePresence>
        {open && (
          <PreviewDialog
            title={title}
            subtitle={subtitle}
            generatedFor={generatedFor}
            columns={columns}
            rows={rows}
            onClose={() => setOpen(false)}
            onDownloadCsv={() => doExport("csv")}
            onDownloadPdf={() => doExport("pdf")}
            onDownloadZip={() => doExport("zip")}
            busy={busy}
          />
        )}
      </AnimatePresence>
    </>
  );
}

const th =
  "whitespace-nowrap border-b border-ink-100 bg-ink-50/80 px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-ink-500 backdrop-blur";

function PreviewDialog<T>({
  title,
  subtitle,
  generatedFor,
  columns,
  rows,
  onClose,
  onDownloadCsv,
  onDownloadPdf,
  onDownloadZip,
  busy
}: {
  title: string;
  subtitle?: string;
  generatedFor?: string;
  columns: ReportColumn<T>[];
  rows: T[];
  onClose: () => void;
  onDownloadCsv: () => void;
  onDownloadPdf: () => void;
  onDownloadZip: () => void;
  busy: null | "csv" | "zip" | "pdf";
}) {
  const reduce = useReducedMotion();

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center px-4 py-8"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-preview-title"
      onClick={onClose}
    >
      <motion.div
        aria-hidden
        className="grain fixed inset-0 bg-ink-950/55 backdrop-blur-md"
        initial={reduce ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reduce ? undefined : { opacity: 0 }}
        transition={{ duration: 0.2 }}
      />
      <motion.div
        className="relative z-10 flex max-h-[88vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-energy"
        initial={reduce ? false : { opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={reduce ? undefined : { opacity: 0, y: 10, scale: 0.98 }}
        transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 240, damping: 24 }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header slab */}
        <div className="relative flex shrink-0 items-start justify-between gap-4 overflow-hidden border-b border-ink-100 bg-gradient-to-br from-brand-50 via-white to-coral-50/40 px-6 py-5">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full bg-energy-gradient opacity-20 blur-3xl"
          />
          <div className="relative flex min-w-0 items-start gap-4">
            <IconTile icon={Files} tone="energy" size="lg" className="hidden sm:inline-flex" />
            <div className="min-w-0">
              <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.2em] text-brand-700">
                <span className="brand-dot" aria-hidden />
                Report preview
              </p>
              <h3
                id="report-preview-title"
                className="mt-1 truncate font-display text-xl font-semibold tracking-[-0.02em] text-ink-950"
              >
                {title}
              </h3>
              {subtitle && (
                <p className="mt-0.5 truncate text-xs text-ink-600">{subtitle}</p>
              )}
              <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[11px] text-ink-500">
                <span className="rounded-full bg-ink-950 px-2 py-0.5 font-semibold tabular-nums text-white">
                  {rows.length.toLocaleString("en-IN")} record{rows.length === 1 ? "" : "s"}
                </span>
                {generatedFor && (
                  <span className="rounded-full border border-ink-200 bg-white px-2 py-0.5">
                    for {generatedFor}
                  </span>
                )}
                <span className="rounded-full border border-ink-200 bg-white px-2 py-0.5 tabular-nums">
                  {new Date().toLocaleString("en-IN")}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl text-ink-500 transition hover:bg-white/80 hover:text-ink-950 hover:shadow-sm"
            aria-label="Close preview"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full min-w-max border-separate border-spacing-0 text-sm">
            <thead className="sticky top-0 z-[1]">
              <tr>
                {columns.map((c) => (
                  <th key={String(c.key)} scope="col" className={th}>
                    {c.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="text-ink-800">
              {rows.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="px-5 py-14">
                    <div className="mx-auto flex max-w-sm flex-col items-center text-center">
                      <IconTile icon={Files} tone="brand" size="xl" />
                      <p className="mt-4 text-sm font-medium text-ink-600">
                        Nothing to preview yet — widen your filters to see rows here.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                rows.map((row, i) => (
                  <tr
                    key={
                      ((row as { id?: string | number }).id as string | number) ?? i
                    }
                    className="transition-colors hover:bg-brand-50/30"
                  >
                    {columns.map((c) => (
                      <td
                        key={String(c.key)}
                        className="whitespace-nowrap border-b border-ink-100 px-5 py-3"
                      >
                        {cellValue(c, row)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-ink-100 bg-ink-50/40 px-6 py-3">
          <Button variant="outline" size="sm" onClick={onDownloadCsv} disabled={busy !== null}>
            {busy === "csv" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} CSV
          </Button>
          <Button variant="outline" size="sm" onClick={onDownloadPdf} disabled={busy !== null}>
            {busy === "pdf" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />} PDF
          </Button>
          <Button size="sm" onClick={onDownloadZip} disabled={busy !== null}>
            {busy === "zip" ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderArchive className="h-4 w-4" />} ZIP
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
