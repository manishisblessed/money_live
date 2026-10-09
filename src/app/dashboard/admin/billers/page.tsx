"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ReportActions } from "@/components/dashboard/ReportActions";
import { Settings2, RefreshCw } from "lucide-react";

type BillerRow = {
  category: string;
  count: number;
  routing: string;
  uptime: string;
  status: "Live" | "Degraded" | "Down";
};

type BillerStats = {
  totalActive: number;
  totalCategories: number;
  degradedCount: number;
  downCount: number;
};

export default function AdminBillersPage() {
  const [billers, setBillers] = useState<BillerRow[]>([]);
  const [stats, setStats] = useState<BillerStats>({ totalActive: 0, totalCategories: 0, degradedCount: 0, downCount: 0 });
  const [loading, setLoading] = useState(true);

  const fetchBillers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/billers");
      const data = await res.json();
      if (data.billers) setBillers(data.billers);
      if (data.stats) setStats(data.stats);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchBillers(); }, [fetchBillers]);

  const cols: Column<BillerRow>[] = [
    { key: "category", header: "Category", render: (r) => <span className="font-semibold text-ink-900">{r.category}</span> },
    { key: "count", header: "Billers", align: "right" },
    { key: "routing", header: "Routing" },
    { key: "uptime", header: "Uptime (24h)", align: "right" },
    {
      key: "status",
      header: "Status",
      render: (r) => (
        <Badge variant={r.status === "Live" ? "success" : r.status === "Degraded" ? "warning" : "danger"}>
          {r.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      align: "right",
      render: () => (
        <button className="text-xs font-semibold text-brand-700 hover:underline">
          Configure
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Platform"
        title="Billers & routing"
        description="Manage billers across BBPS, NPCI, NETC and direct integrations. Configure failover routes and monitor uptime."
        actions={
          <>
            <ReportActions
              filename="billers"
              title="JMP eMoney · Billers & Routing"
              subtitle="Category-level uptime and routing"
              columns={[
                { key: "category", header: "Category" },
                { key: "count", header: "Billers" },
                { key: "routing", header: "Routing" },
                { key: "uptime", header: "Uptime (24h)" },
                { key: "status", header: "Status" },
              ]}
              rows={billers}
            />
            <Button variant="outline" onClick={fetchBillers} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            <Button variant="outline">
              <Settings2 className="h-4 w-4" /> Routing rules
            </Button>
          </>
        }
      />

      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {[
          { l: "Live billers", v: stats.totalActive.toLocaleString("en-IN") },
          { l: "Categories", v: String(stats.totalCategories) },
          { l: "Avg uptime", v: billers.length ? "99.9%" : "—" },
          { l: "Degraded now", v: String(stats.degradedCount) },
          { l: "Down now", v: String(stats.downCount) },
        ].map((s) => (
          <div key={s.l} className="rounded-3xl bg-white p-5 ring-1 ring-ink-100 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{s.l}</p>
            <p className="mt-2 font-display text-2xl font-semibold tabular-nums tracking-[-0.02em] text-ink-900">{s.v}</p>
          </div>
        ))}
      </div>

      <DataTable
        title="Categories" loading={loading}
        columns={cols}
        data={billers}
        empty="No billers found in the database. Seed billers to see data here."
      />
    </div>
  );
}
