"use client";

import { useEffect, useMemo, useState } from "react";
import useSWR from "swr";
import { Search, Check, UserPlus } from "lucide-react";
import { UsersThree } from "@phosphor-icons/react";
import { IconTile } from "@/components/ui/Icon";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import {
  ROLE_TABS,
  ROLE_SHORT_LABEL,
  type RoleTabValue,
} from "@/lib/hierarchy";

/**
 * Canonical user shape returned by `GET /api/admin/users` (the fields the
 * picker relies on). Consumers can accept this directly or map from it.
 */
export type PickerUser = {
  id: string;
  userCode: string;
  name: string;
  email?: string;
  shop: string;
  role: string; // kebab-case display role (retailer, distributor, …)
  parentId?: string | null;
  city: string;
  state: string;
  status: string;
  walletBalance: number;
  monthlyTurnover: number;
  retailers: number;
};

async function pickerFetcher(url: string): Promise<{ users: PickerUser[] }> {
  const r = await fetch(url);
  if (!r.ok) throw new Error("Failed to load users");
  return r.json();
}

export type AssignUserPickerProps = {
  /** Called when the admin picks a user from the list. */
  onSelect: (user: PickerUser) => void;
  /** User id that is already the current assignee — shown with a "Current" tag and not selectable. */
  currentUserId?: string | null;
  /** User ids to hide from the list entirely (e.g. already-assigned users). */
  excludeUserIds?: string[];
  /** Which role tabs to show. Defaults to All / SD / MD / DT / RT. */
  roles?: readonly { value: RoleTabValue; label: string }[];
  /** Role tab selected on mount. Defaults to "all". */
  defaultRole?: RoleTabValue;
  /** Restrict the list to a specific parent's direct children (cascade scoping). */
  parentId?: string | null;
  /** Autofocus the search box on mount. */
  autoFocus?: boolean;
  /** Page size for each fetch. Defaults to 25. */
  pageSize?: number;
  /** Tailwind class controlling the list height. Defaults to "max-h-72". */
  listMaxHeightClass?: string;
  /** Message shown when no users match. */
  emptyLabel?: string;
  /** Fires whenever the visible (selectable) list changes — enables bulk "assign all". */
  onVisibleUsersChange?: (users: PickerUser[]) => void;
  className?: string;
};

/** Role → avatar tint, keyed by the kebab-case display role. */
const ROLE_AVATAR: Record<string, string> = {
  retailer: "bg-ink-100 text-ink-700",
  distributor: "bg-brand-50 text-brand-700",
  "master-distributor": "bg-royal-50 text-royal-700",
  "super-distributor": "bg-amber-50 text-amber-700",
};

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Role-first user picker. The primary way to choose a user is by selecting a
 * role tab (SD / MD / DT / RT) and picking from the list — no typing required.
 * An optional search box narrows within the active role. Backed by
 * `GET /api/admin/users`, shared across every "assign to a user" flow.
 */
export function AssignUserPicker({
  onSelect,
  currentUserId,
  excludeUserIds,
  roles = ROLE_TABS,
  defaultRole = "all",
  parentId,
  autoFocus = false,
  pageSize = 25,
  listMaxHeightClass = "max-h-72",
  emptyLabel = "No users found.",
  onVisibleUsersChange,
  className,
}: AssignUserPickerProps) {
  const [role, setRole] = useState<RoleTabValue>(defaultRole);
  const [rawQuery, setRawQuery] = useState("");
  const [q, setQ] = useState("");

  // Debounce the search box so we don't fire a request per keystroke.
  useEffect(() => {
    const t = setTimeout(() => setQ(rawQuery.trim()), 250);
    return () => clearTimeout(t);
  }, [rawQuery]);

  const { data, isLoading } = useSWR<{ users: PickerUser[] }>(
    `/api/admin/users?role=${role}&q=${encodeURIComponent(q)}&pageSize=${pageSize}${
      parentId ? `&parentId=${encodeURIComponent(parentId)}` : ""
    }`,
    pickerFetcher,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  const excluded = useMemo(
    () => new Set(excludeUserIds ?? []),
    [excludeUserIds]
  );

  const users = useMemo(
    () => (data?.users ?? []).filter((u) => !excluded.has(u.id)),
    [data, excluded]
  );

  useEffect(() => {
    onVisibleUsersChange?.(users);
  }, [users, onVisibleUsersChange]);

  return (
    <div className={cn("space-y-3", className)}>
      {/* Role tabs — the primary selector */}
      <div
        role="tablist"
        aria-label="Filter by role"
        className="inline-flex max-w-full flex-wrap gap-1 rounded-2xl bg-ink-100/70 p-1"
      >
        {roles.map((t) => {
          const active = role === t.value;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setRole(t.value)}
              className={cn(
                "rounded-xl px-3 py-1.5 text-xs font-semibold transition-[background-color,color,box-shadow] duration-200 focus-energy",
                active
                  ? "bg-ink-950 text-white shadow-soft"
                  : "text-ink-600 hover:bg-white/70 hover:text-ink-900"
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Optional search — narrows within the selected role */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
        <Input
          autoFocus={autoFocus}
          type="text"
          placeholder={
            role === "all"
              ? "Search by name, shop, city, code… (optional)"
              : "Search within this role… (optional)"
          }
          value={rawQuery}
          onChange={(e) => setRawQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Options list */}
      <div
        className={cn(
          "overflow-y-auto rounded-2xl border border-ink-100 bg-white",
          listMaxHeightClass
        )}
      >
        {isLoading && users.length === 0 ? (
          <div className="divide-y divide-ink-100">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-4 py-3">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
            <IconTile icon={UsersThree} tone="brand" size="lg" />
            <p className="text-sm text-ink-500">{emptyLabel}</p>
          </div>
        ) : (
          <div className="divide-y divide-ink-100">
            {users.map((u) => {
              const isCurrent = currentUserId != null && u.id === currentUserId;
              return (
                <button
                  key={u.id}
                  type="button"
                  disabled={isCurrent}
                  onClick={() => onSelect(u)}
                  className="group flex w-full items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-brand-50/40 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-transparent"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <span
                      className={cn(
                        "grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs font-bold ring-1 ring-inset ring-black/5",
                        ROLE_AVATAR[u.role] ?? "bg-ink-100 text-ink-700"
                      )}
                      aria-hidden
                    >
                      {initials(u.name)}
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate text-sm font-semibold text-ink-950">{u.name}</span>
                        {u.userCode && u.userCode !== "—" && (
                          <span className="shrink-0 font-mono text-[11px] font-medium text-brand-600">
                            {u.userCode}
                          </span>
                        )}
                        <span className="shrink-0 rounded-md bg-ink-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-ink-600">
                          {ROLE_SHORT_LABEL[u.role] ?? u.role}
                        </span>
                      </div>
                      <div className="truncate text-xs text-ink-500">
                        {u.shop && u.shop !== "—" ? u.shop : u.city}
                      </div>
                    </div>
                  </div>
                  {isCurrent ? (
                    <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-50 px-2 py-0.5 text-[11px] font-semibold text-accent-700 ring-1 ring-inset ring-accent-200">
                      <Check className="h-3 w-3" /> Current
                    </span>
                  ) : (
                    <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-ink-50 text-brand-600 transition-colors group-hover:bg-brand-600 group-hover:text-white">
                      <UserPlus className="h-3.5 w-3.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
