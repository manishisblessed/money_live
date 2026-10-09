"use client";

import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { DataTable, type Column } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/Icon";
import { RefreshCw } from "lucide-react";
import { Database, Flask, PlugsConnected, type Icon as PhosphorIcon } from "@phosphor-icons/react";
import { Stagger, StaggerItem, StatusChip } from "@/components/dashboard/patterns";

type ServiceRow = {
  service: string;
  live: boolean;
  provider: string;
};

export default function AdminSystemPage() {
  const [services, setServices] = useState<ServiceRow[]>([]);
  const [dbStatus, setDbStatus] = useState("—");
  const [loading, setLoading] = useState(true);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/healthz");
      const data = await res.json();
      setDbStatus(data.db ?? "unknown");
      if (data.partners) {
        setServices(
          Object.entries(data.partners as Record<string, { live: boolean; provider: string }>).map(
            ([key, val]) => ({ service: key.toUpperCase(), live: val.live, provider: val.provider })
          )
        );
      }
    } catch {
      setDbStatus("unreachable");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchHealth(); }, [fetchHealth]);

  const cols: Column<ServiceRow>[] = [
    { key: "service", header: "Service", render: (r) => <span className="font-semibold text-ink-900">{r.service}</span> },
    { key: "provider", header: "Provider", render: (r) => <span className="font-mono text-xs text-ink-600">{r.provider}</span> },
    {
      key: "live",
      header: "Status",
      render: (r) => <StatusChip status={r.live ? "LIVE" : "PENDING"} label={r.live ? "Live" : "Mock"} size="sm" />,
    },
  ];

  const liveCount = services.filter((s) => s.live).length;
  const mockCount = services.length - liveCount;
  const dbUp = dbStatus === "up";

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · Platform"
        title="System health"
        description="Live status of database, partner integrations, and all payment switches."
        actions={
          <Button variant="outline" onClick={fetchHealth} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        }
      />

      <Stagger className="grid gap-4 md:grid-cols-3">
        <StaggerItem>
          <HealthTile
            icon={Database}
            title="Database"
            value={loading && dbStatus === "—" ? "—" : dbUp ? "Healthy" : dbStatus === "unreachable" ? "Unreachable" : "Down"}
            state={loading && dbStatus === "—" ? "idle" : dbUp ? "good" : "bad"}
            hint={dbUp ? "Primary connection responding" : "Check the database connection"}
          />
        </StaggerItem>
        <StaggerItem>
          <HealthTile
            icon={PlugsConnected}
            title="Live partners"
            value={`${liveCount} of ${services.length}`}
            state={services.length === 0 ? "idle" : liveCount === services.length ? "good" : liveCount > 0 ? "warn" : "bad"}
            hint="Integrations hitting real providers"
          />
        </StaggerItem>
        <StaggerItem>
          <HealthTile
            icon={Flask}
            title="Mock partners"
            value={`${mockCount}`}
            state={mockCount === 0 ? "good" : "idle"}
            hint={mockCount === 0 ? "Everything is live" : "Running on simulated responses"}
          />
        </StaggerItem>
      </Stagger>

      <DataTable
        title="Partner integrations"
        description="Every switch the platform talks to, and whether it's live."
        loading={loading}
        columns={cols}
        data={services}
        empty="No partner integrations reported."
      />
    </div>
  );
}

type HealthState = "good" | "warn" | "bad" | "idle";

const STATE_STYLES: Record<HealthState, { ring: string; dot: string; text: string; tone: "accent" | "amber" | "coral" | "ink" }> = {
  good: { ring: "ring-emerald-200", dot: "bg-emerald-500", text: "text-emerald-700", tone: "accent" },
  warn: { ring: "ring-amber-200", dot: "bg-amber-500", text: "text-amber-700", tone: "amber" },
  bad: { ring: "ring-rose-200", dot: "bg-rose-500", text: "text-rose-700", tone: "coral" },
  idle: { ring: "ring-ink-100", dot: "bg-ink-300", text: "text-ink-900", tone: "ink" },
};

function HealthTile({
  icon,
  title,
  value,
  hint,
  state,
}: {
  icon: PhosphorIcon;
  title: string;
  value: string;
  hint?: string;
  state: HealthState;
}) {
  const s = STATE_STYLES[state];
  return (
    <div className={`relative overflow-hidden rounded-3xl bg-white p-5 ring-1 shadow-sm ${s.ring}`}>
      <div className="flex items-start justify-between gap-3">
        <IconTile icon={icon} tone={s.tone} size="md" />
        <span className="relative mt-1 flex h-2.5 w-2.5" aria-hidden>
          {state !== "idle" && <span className={`absolute inline-flex h-full w-full rounded-full opacity-60 animate-ping-soft ${s.dot}`} />}
          <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${s.dot}`} />
        </span>
      </div>
      <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{title}</p>
      <p className={`mt-1 font-display text-2xl font-semibold tabular-nums tracking-[-0.02em] ${s.text}`}>{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-500">{hint}</p>}
    </div>
  );
}
