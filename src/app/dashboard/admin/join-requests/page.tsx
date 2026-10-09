"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import {
  Loader2,
  Search,
  Eye,
  X,
  Copy,
  UserPlus,
  Phone,
  Mail,
  Store,
  MapPin,
  MessageSquare,
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select } from "@/components/ui/Input";
import { EmptyState, FilterBar, SectionCard, StatusChip } from "@/components/dashboard/patterns";
import { UserPlus as UserPlusPh } from "@phosphor-icons/react";
import {
  CreateInviteForm,
  type CreateInviteResult,
} from "@/components/admin/CreateInviteForm";

type JoinRequest = {
  id: string;
  name: string;
  phone: string;
  email: string;
  shopName: string | null;
  city: string | null;
  state: string | null;
  role: string;
  message: string | null;
  status: string;
  notes: string | null;
  inviteId: string | null;
  handledById: string | null;
  handledAt: string | null;
  createdAt: string;
};

const STATUS_OPTIONS = ["NEW", "CONTACTED", "INVITED", "CLOSED", "REJECTED"];

const STATUS_VARIANT: Record<string, "warning" | "brand" | "royal" | "default" | "danger"> = {
  NEW: "warning",
  CONTACTED: "brand",
  INVITED: "royal",
  CLOSED: "default",
  REJECTED: "danger",
};

function fmtRole(role: string) {
  return role
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function AdminJoinRequestsPage() {
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [statusCounts, setStatusCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selected, setSelected] = useState<JoinRequest | null>(null);
  const [converting, setConverting] = useState<JoinRequest | null>(null);
  const { data: session } = useSession();
  const sessionRole =
    (session?.user as { role?: string } | undefined)?.role ?? "";
  const canConvert = sessionRole === "MASTER_ADMIN" || sessionRole === "ADMIN";

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    const qs = new URLSearchParams();
    if (filter) qs.set("status", filter);
    if (debouncedSearch) qs.set("q", debouncedSearch);
    const res = await fetch(`/api/admin/join-requests?${qs.toString()}`);
    if (res.ok) {
      const data = await res.json();
      setRequests(data.requests);
      setTotal(data.total);
      setStatusCounts(data.statusCounts ?? {});
    } else {
      toast.error("Could not load join requests");
    }
    setLoading(false);
  }, [filter, debouncedSearch]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  async function updateRequest(
    id: string,
    body: { status?: string; notes?: string; inviteId?: string }
  ) {
    const res = await fetch(`/api/admin/join-requests/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      toast.success("Updated");
      setRequests((rs) => rs.map((r) => (r.id === id ? data.request : r)));
      setSelected((s) => (s && s.id === id ? data.request : s));
      fetchRequests();
    } else {
      toast.error(typeof data.error === "string" ? data.error : "Update failed");
    }
  }

  async function handleConverted(lead: JoinRequest, result: CreateInviteResult) {
    await updateRequest(lead.id, {
      status: "INVITED",
      inviteId: result.invite.id,
    });
    setConverting(null);
    setSelected(null);
    toast.success("Invite created — lead marked as Invited");
  }

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Admin · People"
        title="Join requests"
        description="Leads from the public Join Form. Connect with each applicant and convert them into an onboarding invite."
      />

      <FilterBar title="Leads" count={total}>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="h-10 w-44"
          aria-label="Filter by status"
        >
          <option value="">All statuses</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {fmtRole(s)}
              {statusCounts[s] != null ? ` (${statusCounts[s]})` : ""}
            </option>
          ))}
        </Select>
        <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, phone, email, shop…"
            className="h-10 pl-9"
            aria-label="Search join requests"
          />
        </div>
      </FilterBar>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-600" />
        </div>
      ) : requests.length === 0 ? (
        <EmptyState
          bordered
          icon={UserPlusPh}
          title="No join requests yet"
          description="New leads from the public Join Form will show up here."
        />
      ) : (
        <SectionCard padding="none">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-sm">
              <thead className="border-b border-ink-100 bg-ink-50/60 text-left text-[11px] uppercase tracking-[0.14em] text-ink-500">
                <tr>
                  <th className="px-5 py-3 font-semibold">Applicant</th>
                  <th className="px-5 py-3 font-semibold">Interested as</th>
                  <th className="px-5 py-3 font-semibold">Business</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Submitted</th>
                  <th className="px-5 py-3 text-right font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {requests.map((r) => (
                  <tr key={r.id} className="transition-colors hover:bg-ink-50/40">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-ink-900">{r.name}</div>
                      <div className="text-xs text-ink-500">{r.phone}</div>
                      <div className="text-xs text-ink-500">{r.email}</div>
                    </td>
                    <td className="px-5 py-3 text-ink-700">{fmtRole(r.role)}</td>
                    <td className="px-5 py-3 text-ink-700">
                      <div>{r.shopName || "—"}</div>
                      <div className="text-xs text-ink-500">
                        {[r.city, r.state].filter(Boolean).join(", ") || "—"}
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <StatusChip status={r.status} variant={STATUS_VARIANT[r.status]} label={fmtRole(r.status)} size="sm" />
                    </td>
                    <td className="px-5 py-3 text-ink-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Select
                          value={r.status}
                          onChange={(e) =>
                            updateRequest(r.id, { status: e.target.value })
                          }
                          className="h-9 w-36"
                          aria-label={`Status for ${r.name}`}
                        >
                          {STATUS_OPTIONS.map((s) => (
                            <option key={s} value={s}>
                              {fmtRole(s)}
                            </option>
                          ))}
                        </Select>
                        <button
                          onClick={() => setSelected(r)}
                          title="View details"
                          aria-label={`View ${r.name}`}
                          className="grid h-9 w-9 place-items-center rounded-xl text-ink-500 ring-1 ring-inset ring-ink-100 transition hover:bg-ink-50 hover:text-ink-900 focus-energy"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {selected && (
        <JoinRequestDetail
          request={selected}
          canConvert={canConvert}
          onConvert={() => {
            setConverting(selected);
            setSelected(null);
          }}
          onClose={() => setSelected(null)}
          onSave={updateRequest}
        />
      )}

      {converting && (
        <div className="fixed inset-0 z-[60] overflow-y-auto bg-ink-900/50 p-4 backdrop-blur-sm">
          <div className="mx-auto my-8 max-w-2xl">
            <CreateInviteForm
              userRole={sessionRole}
              title={`Create invite — ${converting.name}`}
              submitLabel="Create invite & mark invited"
              initial={{
                phone: converting.phone,
                email: converting.email,
                name: converting.name,
                role: converting.role,
              }}
              onClose={() => setConverting(null)}
              onCreated={(result) => handleConverted(converting, result)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function JoinRequestDetail({
  request,
  canConvert,
  onConvert,
  onClose,
  onSave,
}: {
  request: JoinRequest;
  canConvert: boolean;
  onConvert: () => void;
  onClose: () => void;
  onSave: (id: string, body: { status?: string; notes?: string }) => Promise<void>;
}) {
  const [status, setStatus] = useState(request.status);
  const [notes, setNotes] = useState(request.notes ?? "");
  const [saving, setSaving] = useState(false);

  async function copyDetails() {
    const text = [
      `Name: ${request.name}`,
      `Phone: ${request.phone}`,
      `Email: ${request.email}`,
      `Role: ${fmtRole(request.role)}`,
      request.shopName ? `Shop: ${request.shopName}` : null,
      [request.city, request.state].filter(Boolean).length
        ? `Location: ${[request.city, request.state].filter(Boolean).join(", ")}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Details copied");
    } catch {
      toast.error("Could not copy");
    }
  }

  async function save() {
    setSaving(true);
    try {
      await onSave(request.id, { status, notes });
    } finally {
      setSaving(false);
    }
  }

  const rows: { icon: typeof Phone; label: string; value: string | null }[] = [
    { icon: Phone, label: "Mobile", value: request.phone },
    { icon: Mail, label: "Email", value: request.email },
    { icon: Store, label: "Shop / Business", value: request.shopName },
    {
      icon: MapPin,
      label: "Location",
      value: [request.city, request.state].filter(Boolean).join(", ") || null,
    },
    { icon: MessageSquare, label: "Message", value: request.message },
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink-900/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg overflow-hidden rounded-3xl bg-white shadow-2xl ring-1 ring-ink-100">
        <div className="flex items-center justify-between border-b border-ink-100 px-6 py-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">Join request</p>
            <h3 className="font-display text-lg font-semibold tracking-[-0.02em] text-ink-900">
              {request.name}
            </h3>
            <p className="text-xs text-ink-500">
              Interested as {fmtRole(request.role)} · Submitted{" "}
              {new Date(request.createdAt).toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-xl text-ink-500 ring-1 ring-inset ring-ink-100 transition hover:bg-ink-50 focus-energy"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-5">
          <div className="space-y-2">
            {rows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3 text-sm">
                <Icon className="mt-0.5 h-4 w-4 shrink-0 text-ink-400" />
                <span className="w-28 shrink-0 text-ink-500">{label}</span>
                <span className="min-w-0 flex-1 font-medium text-ink-800">
                  {value || "—"}
                </span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="detail-status">Status</Label>
              <Select
                id="detail-status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {fmtRole(s)}
                  </option>
                ))}
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="detail-notes">Internal notes</Label>
            <textarea
              id="detail-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              maxLength={2000}
              placeholder="Add a note for your team..."
              className="flex w-full rounded-3xl bg-white ring-1 ring-ink-100 shadow-sm px-4 py-2.5 text-sm text-ink-900 shadow-sm transition placeholder:text-ink-400 focus:border-brand-400 focus:outline-none focus:ring-4 focus:ring-brand-100"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/40 px-6 py-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={copyDetails}>
              <Copy className="h-4 w-4" /> Copy details
            </Button>
            {request.status === "INVITED" && request.inviteId ? (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-700">
                <UserPlus className="h-4 w-4" /> Invite created
              </span>
            ) : canConvert ? (
              <Button variant="outline" size="sm" onClick={onConvert}>
                <UserPlus className="h-4 w-4" /> Create invite
              </Button>
            ) : (
              <Link href="/dashboard/admin/invites">
                <Button variant="outline" size="sm">
                  <UserPlus className="h-4 w-4" /> Create invite
                </Button>
              </Link>
            )}
          </div>
          <Button onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Save changes
          </Button>
        </div>
      </div>
    </div>
  );
}
