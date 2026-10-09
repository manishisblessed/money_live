"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { Search, RefreshCw, Receipt, TrendingUp, HandCoins } from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { Input, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { TransactionsTable } from "@/components/dashboard/TransactionsTable";
import { ReportActions } from "@/components/dashboard/ReportActions";
import { FilterBar, Stagger, StaggerItem } from "@/components/dashboard/patterns";
import { toDisplayRole } from "@/lib/auth";
import type { Transaction } from "@/lib/data";

export default function TransactionsPage() {
  const { data: session } = useSession();
  // Retailers don't see commission here: on settlement rails the per-txn
  // commission is the upline's, not theirs. Their earnings live on My Earnings.
  const showCommission = toDisplayRole(session?.user?.role as any) !== "retailer";
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [rows, setRows] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: "200" });
      if (q) params.set("q", q);
      if (status !== "All") params.set("status", status);
      const res = await fetch(`/api/transactions?${params}`);
      const json = await res.json();
      if (Array.isArray(json.data)) setRows(json.data);
      else setRows([]);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [q, status]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  const totals = useMemo(() => {
    const total = rows.reduce((s, t) => s + t.amount, 0);
    const commission = rows.reduce((s, t) => s + t.commission, 0);
    return { total, commission, count: rows.length };
  }, [rows]);

  return (
    <div className="min-w-0 space-y-6">
      <PageHeader
        eyebrow="Account"
        title="Transactions"
        description="Every payment processed through your account — search, filter and export in one place."
      />

      <Stagger
        className={`grid gap-4 sm:grid-cols-2 ${showCommission ? "xl:grid-cols-3" : ""}`}
      >
        <StaggerItem>
          <StatCard
            label="Transactions"
            value={loading ? "…" : totals.count.toLocaleString("en-IN")}
            icon={Receipt}
            accent="brand"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Total volume"
            value={loading ? "…" : `₹ ${totals.total.toLocaleString("en-IN")}`}
            icon={TrendingUp}
            accent="violet"
          />
        </StaggerItem>
        {showCommission && (
          <StaggerItem>
            <StatCard
              label="Commission earned"
              value={loading ? "…" : `₹ ${totals.commission.toLocaleString("en-IN")}`}
              icon={HandCoins}
              accent="emerald"
            />
          </StaggerItem>
        )}
      </Stagger>

      <FilterBar
        title="Filter"
        count={loading ? undefined : rows.length}
        actions={
          <>
            <Button variant="outline" size="md" onClick={load} isLoading={loading} disabled={loading}>
              {loading ? "" : <RefreshCw className="h-4 w-4" />}
              Refresh
            </Button>
            <ReportActions
              filename="transactions"
              title="eMoney · Transactions"
              subtitle={`Live view · ${rows.length} records`}
              columns={[
                { key: "id", header: "Txn ID" },
                { key: "service", header: "Service" },
                { key: "customer", header: "Customer" },
                { key: "amount", header: "Amount (INR)" },
                ...(showCommission
                  ? [{ key: "commission" as const, header: "Commission (INR)" }]
                  : []),
                { key: "status", header: "Status" },
                { key: "date", header: "Date" },
              ]}
              rows={rows}
            />
          </>
        }
      >
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by ID, service or customer…"
            className="pl-10"
            aria-label="Search transactions"
          />
        </div>
        <Select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-40"
          aria-label="Filter by status"
        >
          {["All", "Success", "Pending", "Failed"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
      </FilterBar>

      <TransactionsTable data={rows} showHeader={false} loading={loading} showCommission={showCommission} />
    </div>
  );
}
