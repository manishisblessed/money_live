"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Plus,
  Trash2,
  KeyRound,
  Webhook,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Power,
} from "lucide-react";
import { Key as KeyPh, LockKey, ShieldCheck, Plugs } from "@phosphor-icons/react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { IconTile } from "@/components/ui/Icon";
import { FloatingInput, Label } from "@/components/ui/Input";
import { EmptyState, FadeIn, SectionCard, StatusChip } from "@/components/dashboard/patterns";

type Scope = { id: string; label: string };
type ApiKeyRow = {
  id: string;
  label: string;
  keyId: string;
  scopes: string[];
  ipAllowlist: string[];
  lastUsedAt: string | null;
  revokedAt: string | null;
  createdAt: string;
};
type EndpointRow = { id: string; url: string; events: string[]; active: boolean; createdAt: string };
type DeliveryRow = {
  id: string;
  endpointId: string;
  event: string;
  status: string;
  attempts: number;
  responseCode: number | null;
  lastError: string | null;
  deliveredAt: string | null;
  createdAt: string;
};
type EventDef = { id: string; label: string };

function fmtDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        });
      }}
      className="rounded-lg p-1 text-ink-500 transition hover:bg-ink-100 focus-energy"
      title="Copy"
      aria-label="Copy"
    >
      {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}

export default function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [scopes, setScopes] = useState<Scope[]>([]);
  const [endpoints, setEndpoints] = useState<EndpointRow[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryRow[]>([]);
  const [events, setEvents] = useState<EventDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Key creation
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [keyLabel, setKeyLabel] = useState("");
  const [keyScopes, setKeyScopes] = useState<string[]>([]);
  const [creatingKey, setCreatingKey] = useState(false);
  const [newSecret, setNewSecret] = useState<{ keyId: string; secret: string } | null>(null);

  // Endpoint creation
  const [showEpForm, setShowEpForm] = useState(false);
  const [epUrl, setEpUrl] = useState("");
  const [epEvents, setEpEvents] = useState<string[]>([]);
  const [creatingEp, setCreatingEp] = useState(false);
  const [newEpSecret, setNewEpSecret] = useState<string | null>(null);

  // Pending destructive actions (confirmed via dialog)
  const [revokeTarget, setRevokeTarget] = useState<ApiKeyRow | null>(null);
  const [revoking, setRevoking] = useState(false);
  const [removeEpTarget, setRemoveEpTarget] = useState<EndpointRow | null>(null);
  const [removingEp, setRemovingEp] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [kRes, wRes] = await Promise.all([fetch("/api/platform/keys"), fetch("/api/platform/webhooks")]);
      if (kRes.status === 403 || wRes.status === 403) {
        setForbidden(true);
        return;
      }
      const kData = await kRes.json();
      const wData = await wRes.json();
      if (!kRes.ok) throw new Error(kData.error || "Failed to load keys");
      if (!wRes.ok) throw new Error(wData.error || "Failed to load webhooks");
      setKeys(kData.keys ?? []);
      setScopes(kData.scopes ?? []);
      setEndpoints(wData.endpoints ?? []);
      setDeliveries(wData.deliveries ?? []);
      setEvents(wData.events ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function createKey() {
    if (keyLabel.trim().length < 3 || keyScopes.length === 0) return;
    setCreatingKey(true);
    setError(null);
    try {
      const res = await fetch("/api/platform/keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: keyLabel.trim(), scopes: keyScopes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to create key");
      setNewSecret({ keyId: data.key.keyId, secret: data.secret });
      setShowKeyForm(false);
      setKeyLabel("");
      setKeyScopes([]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create key");
    } finally {
      setCreatingKey(false);
    }
  }

  async function revokeKey(id: string) {
    setRevoking(true);
    try {
      const res = await fetch(`/api/platform/keys/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("API key revoked");
        await load();
      } else {
        toast.error("Failed to revoke key");
      }
    } finally {
      setRevoking(false);
    }
  }

  async function createEndpoint() {
    if (!epUrl.startsWith("https://") || epEvents.length === 0) return;
    setCreatingEp(true);
    setError(null);
    try {
      const res = await fetch("/api/platform/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: epUrl.trim(), events: epEvents }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : "Failed to add endpoint");
      setNewEpSecret(data.secret);
      setShowEpForm(false);
      setEpUrl("");
      setEpEvents([]);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add endpoint");
    } finally {
      setCreatingEp(false);
    }
  }

  async function toggleEndpoint(ep: EndpointRow) {
    const res = await fetch("/api/platform/webhooks", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: ep.id, active: !ep.active }),
    });
    if (res.ok) await load();
  }

  async function deleteEndpoint(id: string) {
    setRemovingEp(true);
    try {
      const res = await fetch(`/api/platform/webhooks?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Webhook endpoint removed");
        await load();
      } else {
        toast.error("Failed to remove endpoint");
      }
    } finally {
      setRemovingEp(false);
    }
  }

  if (forbidden) {
    return (
      <div className="space-y-6">
        <PageHeader eyebrow="Platform · Developers" title="API keys & webhooks" description="Programmatic access to the platform." />
        <EmptyState
          bordered
          icon={LockKey}
          tone="amber"
          title="API access is for Master & Super Distributors"
          description={
            <>
              API keys and webhooks are available to <strong>Master Distributor</strong> and <strong>Super Distributor</strong> accounts.
              Contact your upline to upgrade.
            </>
          }
        />
      </div>
    );
  }

  const chipClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold transition focus-energy ${
      active ? "pill-active" : "bg-white text-ink-600 ring-1 ring-inset ring-ink-200 hover:ring-ink-300"
    }`;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Platform · Developers"
        title="API keys & webhooks"
        description="Issue scoped keys for the partner API and receive signed event notifications on your servers."
        actions={
          <Button variant="outline" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
        }
      />

      {error && (
        <div className="flex items-center gap-2 rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-800 ring-1 ring-inset ring-rose-200">
          <AlertCircle className="h-4 w-4 shrink-0" /> {error}
        </div>
      )}

      {/* One-time secret banners */}
      {newSecret && (
        <FadeIn>
          <SectionCard tone="accent" title="Key created — copy the secret now" description="It will never be shown again.">
            <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 font-mono text-xs text-ink-800 ring-1 ring-inset ring-ink-100">
              <span className="truncate">Authorization: Bearer {newSecret.keyId}.{newSecret.secret}</span>
              <CopyButton text={`${newSecret.keyId}.${newSecret.secret}`} />
            </div>
            <Button variant="secondary" className="mt-3" onClick={() => setNewSecret(null)}>Done, I saved it</Button>
          </SectionCard>
        </FadeIn>
      )}
      {newEpSecret && (
        <FadeIn>
          <SectionCard
            tone="accent"
            title="Endpoint added — save this signing secret"
            description={
              <>
                Verify the <code className="font-mono">X-NGP-Signature</code> header (HMAC-SHA256 of the raw body) with it.
              </>
            }
          >
            <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-3 font-mono text-xs text-ink-800 ring-1 ring-inset ring-ink-100">
              <span className="truncate">{newEpSecret}</span>
              <CopyButton text={newEpSecret} />
            </div>
            <Button variant="secondary" className="mt-3" onClick={() => setNewEpSecret(null)}>Done, I saved it</Button>
          </SectionCard>
        </FadeIn>
      )}

      <SectionCard tone="brand" padding="sm">
        <div className="flex items-start gap-3">
          <IconTile icon={ShieldCheck} tone="energy" size="md" />
          <div>
            <h3 className="font-display text-base font-semibold tracking-[-0.01em] text-ink-900">How it works</h3>
            <p className="mt-1 text-sm text-ink-600">
              Authenticate with <code className="font-mono text-xs">Authorization: Bearer &lt;keyId&gt;.&lt;secret&gt;</code>.
              Secrets are hashed at rest and shown only once. Payouts created via API still pass maker-checker approval.
              Endpoints receive signed JSON with automatic retries (8 attempts, exponential backoff).
            </p>
          </div>
        </div>
      </SectionCard>

      {/* ── API keys ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IconTile icon={KeyPh} tone="brand" size="sm" />
            <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink-900">API keys</h2>
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-ink-600">{keys.length}</span>
          </div>
          <Button onClick={() => setShowKeyForm((v) => !v)}>
            <Plus className="h-4 w-4" /> New key
          </Button>
        </div>

        {showKeyForm && (
          <FadeIn>
            <SectionCard title="New API key" description="Give it a clear label and pick only the scopes it needs.">
              <div className="grid gap-4 md:grid-cols-2">
                <FloatingInput label="Label" value={keyLabel} onChange={(e) => setKeyLabel(e.target.value)} placeholder="e.g. Production backend" />
                <div>
                  <Label>Scopes</Label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {scopes.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        aria-pressed={keyScopes.includes(s.id)}
                        onClick={() =>
                          setKeyScopes((cur) => (cur.includes(s.id) ? cur.filter((x) => x !== s.id) : [...cur, s.id]))
                        }
                        className={chipClass(keyScopes.includes(s.id))}
                        title={s.label}
                      >
                        {s.id}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={createKey} disabled={creatingKey || keyLabel.trim().length < 3 || keyScopes.length === 0}>
                  {creatingKey ? "Creating…" : "Create key"}
                </Button>
                <Button variant="outline" onClick={() => setShowKeyForm(false)}>Cancel</Button>
              </div>
            </SectionCard>
          </FadeIn>
        )}

        <SectionCard padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/60 text-left text-[11px] uppercase tracking-[0.14em] text-ink-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Label</th>
                  <th className="px-5 py-3 font-semibold">Key ID</th>
                  <th className="px-5 py-3 font-semibold">Scopes</th>
                  <th className="px-5 py-3 font-semibold">Last used</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 text-ink-800">
                {keys.length === 0 && !loading && (
                  <tr>
                    <td colSpan={6} className="p-0">
                      <EmptyState
                        compact
                        icon={KeyPh}
                        title="No API keys yet"
                        description="Create one to start integrating."
                      />
                    </td>
                  </tr>
                )}
                {keys.map((k) => (
                  <tr key={k.id} className="transition-colors hover:bg-ink-50/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 font-semibold text-ink-900">
                        <KeyRound className="h-4 w-4 text-ink-400" /> {k.label}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 font-mono text-xs">
                        {k.keyId}
                        <CopyButton text={k.keyId} />
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {k.scopes.map((s) => (
                          <span key={s} className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[10px] text-ink-600">{s}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-ink-500">{fmtDate(k.lastUsedAt)}</td>
                    <td className="px-5 py-3">
                      <StatusChip status={k.revokedAt ? "REVOKED" : "ACTIVE"} size="sm" />
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!k.revokedAt && (
                        <button
                          onClick={() => setRevokeTarget(k)}
                          className="grid h-8 w-8 place-items-center rounded-xl text-rose-700 ring-1 ring-inset ring-rose-100 transition hover:bg-rose-50 focus-energy"
                          title="Revoke"
                          aria-label="Revoke key"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </section>

      {/* ── Webhooks ── */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <IconTile icon={Plugs} tone="royal" size="sm" />
            <h2 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink-900">Webhook endpoints</h2>
            <span className="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-ink-600">{endpoints.length}</span>
          </div>
          <Button onClick={() => setShowEpForm((v) => !v)}>
            <Plus className="h-4 w-4" /> Add endpoint
          </Button>
        </div>

        {showEpForm && (
          <FadeIn>
            <SectionCard title="New endpoint" description="HTTPS only. Pick the events you want delivered.">
              <div className="grid gap-4 md:grid-cols-2">
                <FloatingInput label="HTTPS URL" value={epUrl} onChange={(e) => setEpUrl(e.target.value)} placeholder="https://api.yourdomain.in/ngp/webhook" />
                <div>
                  <Label>Events</Label>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {events.map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        aria-pressed={epEvents.includes(ev.id)}
                        onClick={() =>
                          setEpEvents((cur) => (cur.includes(ev.id) ? cur.filter((x) => x !== ev.id) : [...cur, ev.id]))
                        }
                        className={chipClass(epEvents.includes(ev.id))}
                        title={ev.label}
                      >
                        {ev.id}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button onClick={createEndpoint} disabled={creatingEp || !epUrl.startsWith("https://") || epEvents.length === 0}>
                  {creatingEp ? "Adding…" : "Add endpoint"}
                </Button>
                <Button variant="outline" onClick={() => setShowEpForm(false)}>Cancel</Button>
              </div>
            </SectionCard>
          </FadeIn>
        )}

        <SectionCard padding="none">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-ink-50/60 text-left text-[11px] uppercase tracking-[0.14em] text-ink-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">URL</th>
                  <th className="px-5 py-3 font-semibold">Events</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100 text-ink-800">
                {endpoints.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="p-0">
                      <EmptyState
                        compact
                        icon={Plugs}
                        tone="royal"
                        title="No endpoints yet"
                        description="Add one to receive txn / payout / top-up events."
                      />
                    </td>
                  </tr>
                )}
                {endpoints.map((ep) => (
                  <tr key={ep.id} className="transition-colors hover:bg-ink-50/40">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 font-mono text-xs text-ink-900">
                        <Webhook className="h-4 w-4 shrink-0 text-ink-400" />
                        <span className="max-w-[320px] truncate">{ep.url}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap gap-1">
                        {ep.events.map((e) => (
                          <span key={e} className="rounded-full bg-ink-100 px-2 py-0.5 font-mono text-[10px] text-ink-600">{e}</span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusChip status={ep.active ? "ACTIVE" : "PAUSED"} size="sm" />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => toggleEndpoint(ep)}
                          className="grid h-8 w-8 place-items-center rounded-xl text-ink-600 ring-1 ring-inset ring-ink-100 transition hover:bg-ink-50 focus-energy"
                          title={ep.active ? "Pause" : "Resume"}
                          aria-label={ep.active ? "Pause endpoint" : "Resume endpoint"}
                        >
                          <Power className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setRemoveEpTarget(ep)}
                          className="grid h-8 w-8 place-items-center rounded-xl text-rose-700 ring-1 ring-inset ring-rose-100 transition hover:bg-rose-50 focus-energy"
                          title="Delete"
                          aria-label="Delete endpoint"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>

        {deliveries.length > 0 && (
          <SectionCard padding="none" title="Recent deliveries" description="Latest attempts across all endpoints.">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-ink-50/60 text-left text-[11px] uppercase tracking-[0.14em] text-ink-500">
                  <tr>
                    <th className="px-5 py-3 font-semibold">Event</th>
                    <th className="px-5 py-3 font-semibold">Status</th>
                    <th className="px-5 py-3 font-semibold">HTTP</th>
                    <th className="px-5 py-3 font-semibold">Attempts</th>
                    <th className="px-5 py-3 font-semibold">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-ink-100 text-ink-800">
                  {deliveries.map((d) => (
                    <tr key={d.id}>
                      <td className="px-5 py-3 font-mono text-xs">{d.event}</td>
                      <td className="px-5 py-3">
                        <StatusChip
                          status={d.status}
                          variant={d.status === "SUCCESS" ? "success" : d.status === "FAILED" ? "danger" : "warning"}
                          label={d.status}
                          size="sm"
                        />
                        {d.lastError && d.status !== "SUCCESS" && (
                          <span className="ml-2 text-xs text-ink-400">{d.lastError.slice(0, 60)}</span>
                        )}
                      </td>
                      <td className="px-5 py-3 tabular-nums text-ink-500">{d.responseCode ?? "—"}</td>
                      <td className="px-5 py-3 tabular-nums text-ink-500">{d.attempts}</td>
                      <td className="px-5 py-3 text-ink-500">{fmtDate(d.deliveredAt ?? d.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </SectionCard>
        )}
      </section>

      <div className="overflow-x-auto rounded-3xl bg-ink-950 p-6 font-mono text-xs text-ink-100 ring-1 ring-white/10">
        <div className="mb-2 text-ink-300"># Example: check wallet balance</div>
        <div className="text-emerald-300">curl {typeof window !== "undefined" ? window.location.origin : ""}/api/v1/wallet \</div>
        <div>  -H &quot;Authorization: Bearer ngp_live_xxxx.your_secret&quot;</div>
        <div className="mt-3 text-ink-300"># Example: create a payout (idempotent)</div>
        <div className="text-emerald-300">curl -X POST {typeof window !== "undefined" ? window.location.origin : ""}/api/v1/payouts \</div>
        <div>  -H &quot;Authorization: Bearer ngp_live_xxxx.your_secret&quot; \</div>
        <div>  -H &quot;Idempotency-Key: order-8412-payout&quot; \</div>
        <div>  -H &quot;Content-Type: application/json&quot; \</div>
        <div>  -d &apos;{"{"}&quot;mode&quot;:&quot;IMPS&quot;,&quot;amount&quot;:5000,&quot;beneficiaryName&quot;:&quot;Ramesh Kumar&quot;,&quot;accountNumber&quot;:&quot;123456789012&quot;,&quot;ifsc&quot;:&quot;SBIN0001234&quot;{"}"}&apos;</div>
      </div>

      <ConfirmDialog
        open={revokeTarget !== null}
        onClose={() => setRevokeTarget(null)}
        busy={revoking}
        title="Revoke this key?"
        description={
          revokeTarget && (
            <>
              <span className="font-semibold text-ink-900">{revokeTarget.label}</span>{" "}
              (<span className="font-mono text-xs">{revokeTarget.keyId}</span>) — integrations using
              it will stop working immediately.
            </>
          )
        }
        confirmLabel="Revoke"
        onConfirm={async () => {
          if (!revokeTarget) return;
          await revokeKey(revokeTarget.id);
          setRevokeTarget(null);
        }}
      />

      <ConfirmDialog
        open={removeEpTarget !== null}
        onClose={() => setRemoveEpTarget(null)}
        busy={removingEp}
        title="Remove this webhook endpoint?"
        description={
          removeEpTarget && (
            <>
              <span className="font-mono text-xs text-ink-900">{removeEpTarget.url}</span> will stop
              receiving events and pending deliveries will fail.
            </>
          )
        }
        confirmLabel="Remove"
        onConfirm={async () => {
          if (!removeEpTarget) return;
          await deleteEndpoint(removeEpTarget.id);
          setRemoveEpTarget(null);
        }}
      />
    </div>
  );
}
