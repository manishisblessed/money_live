"use client";

import { useState, useEffect, useCallback, useRef, Fragment } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  Menu,
  Search,
  LogOut,
  Activity,
  Landmark,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronRight,
  ChevronDown,
  User as UserIcon,
  BellOff,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { CommandPalette } from "@/components/dashboard/shell/CommandPalette";
import { formatINR, cn } from "@/lib/utils";
import { toDisplayRole } from "@/lib/auth";

type NotifItem = { id: string; title: string; body: string; href: string | null; read: boolean; createdAt: string };

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

/** "bill-pay" → "Bill Pay"; short acronyms stay upper-case. */
function titleCase(segment: string): string {
  const ACRONYMS = new Set(["aeps", "pos", "qr", "pg", "bbps", "upi", "kyc", "aml", "api", "cc", "id"]);
  return decodeURIComponent(segment)
    .split("-")
    .filter(Boolean)
    .map((w) => (ACRONYMS.has(w.toLowerCase()) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function Topbar({ onOpenSidebar, collapsed, onToggleCollapse }: { onOpenSidebar: () => void; collapsed?: boolean; onToggleCollapse?: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [liveBalance, setLiveBalance] = useState<number | null>(null);
  const [payinToday, setPayinToday] = useState<number | null>(null);
  const [revenueBalance, setRevenueBalance] = useState<number | null>(null);

  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<NotifItem[]>([]);
  const [unread, setUnread] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);

  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const lastFetchedAt = useRef(0);

  const fetchNotifs = useCallback(async () => {
    if (document.hidden) return;
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const d = await res.json();
      setNotifs(Array.isArray(d.notifications) ? d.notifications : []);
      setUnread(typeof d.unread === "number" ? d.unread : 0);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30_000);
    const onFocus = () => fetchNotifs();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [fetchNotifs]);

  useEffect(() => {
    if (!notifOpen) return;
    const onDown = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [notifOpen]);

  // Close the user menu on outside click / Escape.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Transparent → glass once the page scrolls.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onClickNotif = useCallback(async (n: NotifItem) => {
    setNotifOpen(false);
    if (!n.read) {
      setUnread((u) => Math.max(0, u - 1));
      setNotifs((prev) => prev.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: n.id }),
        });
      } catch {}
    }
    if (n.href) router.push(n.href);
  }, [router]);

  const markAllRead = useCallback(async () => {
    setUnread(0);
    setNotifs((prev) => prev.map((x) => ({ ...x, read: true })));
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ all: true }),
      });
    } catch {}
  }, []);

  const fetchBalance = useCallback(async (force = false) => {
    // Background tabs skip polling entirely; focus refetches are throttled so
    // rapid alt-tabbing doesn't hammer the API.
    if (!force && document.hidden) return;
    if (Date.now() - lastFetchedAt.current < 15_000) return;
    lastFetchedAt.current = Date.now();
    try {
      const res = await fetch("/api/wallet?balanceOnly=1");
      if (res.ok) {
        const data = await res.json();
        setLiveBalance(data.balance ?? null);
      }
    } catch {}
  }, []);

  useEffect(() => {
    // Only poll the personal wallet for users who actually see the Wallet pill.
    // Master admin + admin staff (ADMIN/SUPPORT/FINANCE) don't display it.
    const role = (session?.user as { role?: string } | undefined)?.role;
    if (role === "MASTER_ADMIN" || role === "ADMIN" || role === "SUPPORT" || role === "FINANCE") return;
    fetchBalance(true);
    const interval = setInterval(() => fetchBalance(), 60_000);
    const onFocus = () => fetchBalance();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [fetchBalance, session]);

  // Live company PAYIN (today) — master-admin only. Read straight from the rail
  // sources so it mirrors the operational feeds and resets to ₹0 at IST midnight.
  const sessionRole = (session?.user as { role?: string } | undefined)?.role;
  const isMaster = sessionRole === "MASTER_ADMIN";
  // Admin staff (non-master) don't hold a personal/operational wallet, so hide the
  // generic Wallet pill for them. Payin + Revenue wallets stay master-admin only.
  const isAdminStaff = sessionRole === "ADMIN" || sessionRole === "SUPPORT" || sessionRole === "FINANCE";
  useEffect(() => {
    if (!isMaster) return;
    let active = true;
    const load = async () => {
      if (document.hidden) return;
      try {
        const [payinRes, revenueRes] = await Promise.all([
          fetch("/api/admin/wallet/aggregates?view=payin-today"),
          fetch("/api/admin/wallet/aggregates?view=revenue"),
        ]);
        if (!active) return;
        if (payinRes.ok) {
          const data = await payinRes.json();
          setPayinToday(typeof data.totalAmount === "number" ? data.totalAmount : null);
        }
        if (revenueRes.ok) {
          const data = await revenueRes.json();
          setRevenueBalance(typeof data.balance === "number" ? data.balance : null);
        }
      } catch {}
    };
    load();
    const id = setInterval(load, 30_000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    return () => {
      active = false;
      clearInterval(id);
      window.removeEventListener("focus", onFocus);
    };
  }, [isMaster]);

  async function logout() {
    await signOut({ redirect: false });
    router.push("/login");
  }

  const user = session?.user;
  const userCode = (user as { userCode?: string | null } | undefined)?.userCode ?? null;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
    : "??";

  const displayRole = user?.role ? toDisplayRole(user.role as any) : "agent";

  // Breadcrumb from the current route: skip "dashboard", Title-Case the rest.
  const crumbs = (pathname ?? "")
    .split("/")
    .filter(Boolean)
    .filter((s) => s !== "dashboard")
    .map((seg, i, arr) => ({
      label: titleCase(seg),
      href: "/dashboard/" + arr.slice(0, i + 1).join("/"),
    }));

  const dropdownMotion = {
    initial: reduce ? false : { opacity: 0, y: -6, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1 },
    exit: reduce ? undefined : { opacity: 0, y: -4, scale: 0.98 },
    transition: { duration: reduce ? 0 : 0.18, ease: EASE },
  } as const;

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 flex h-16 items-center justify-between gap-3 px-4 transition-[background-color,box-shadow,border-color] duration-300 md:h-[72px] md:px-8",
          scrolled
            ? "glass border-b border-ink-900/[0.06] shadow-[0_1px_0_0_rgba(255,255,255,0.6)_inset]"
            : "border-b border-transparent bg-transparent"
        )}
      >
        {/* ── Left: menu / collapse / breadcrumb ────────────────────── */}
        <div className="flex min-w-0 items-center gap-2">
          <button
            type="button"
            onClick={onOpenSidebar}
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-ink-200 bg-white text-ink-700 transition hover:border-ink-300 hover:text-ink-900 focus-energy lg:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          {onToggleCollapse && (
            <button
              type="button"
              onClick={onToggleCollapse}
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl text-ink-500 transition hover:bg-ink-900/[0.05] hover:text-ink-900 focus-energy lg:inline-flex"
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {collapsed ? <PanelLeftOpen className="h-[18px] w-[18px]" /> : <PanelLeftClose className="h-[18px] w-[18px]" />}
            </button>
          )}

          <nav aria-label="Breadcrumb" className="hidden min-w-0 md:block">
            <ol className="flex min-w-0 items-center gap-1 text-sm">
              <li className="shrink-0">
                <Link
                  href="/dashboard"
                  className={cn(
                    "rounded-lg px-1.5 py-0.5 transition hover:text-ink-900",
                    crumbs.length === 0 ? "font-display font-semibold tracking-[-0.01em] text-ink-900" : "text-ink-500"
                  )}
                  aria-current={crumbs.length === 0 ? "page" : undefined}
                >
                  {crumbs.length === 0 ? "Overview" : "Home"}
                </Link>
              </li>
              {crumbs.map((c, i) => {
                const last = i === crumbs.length - 1;
                return (
                  <Fragment key={c.href}>
                    <li aria-hidden className="shrink-0 text-ink-300">
                      <ChevronRight className="h-3.5 w-3.5" />
                    </li>
                    <li className="min-w-0">
                      {last ? (
                        <span
                          className="block truncate rounded-lg px-1.5 py-0.5 font-display font-semibold tracking-[-0.01em] text-ink-900"
                          aria-current="page"
                        >
                          {c.label}
                        </span>
                      ) : (
                        <Link
                          href={c.href}
                          className="block truncate rounded-lg px-1.5 py-0.5 text-ink-500 transition hover:text-ink-900"
                        >
                          {c.label}
                        </Link>
                      )}
                    </li>
                  </Fragment>
                );
              })}
            </ol>
          </nav>
        </div>

        {/* ── Center: search button → command palette ───────────────── */}
        <button
          type="button"
          onClick={() => setPaletteOpen(true)}
          className="group hidden h-10 w-full max-w-sm items-center gap-2.5 rounded-2xl border border-ink-200/80 bg-white/80 px-3.5 text-left text-sm text-ink-500 shadow-sm transition hover:border-ink-300 hover:bg-white hover:text-ink-700 focus-energy md:flex"
          aria-label="Search pages (Ctrl K)"
          aria-keyshortcuts="Control+K Meta+K"
        >
          <Search className="h-4 w-4 shrink-0 text-ink-400 transition group-hover:text-brand-600" />
          <span className="flex-1 truncate">Search pages, services…</span>
          <kbd className="hidden shrink-0 items-center gap-0.5 rounded-lg border border-ink-200 bg-ink-50 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-ink-500 lg:inline-flex">
            ⌘K
          </kbd>
        </button>

        {/* ── Right: pills, bell, user ──────────────────────────────── */}
        <div className="flex shrink-0 items-center gap-2 md:gap-2.5">
          <button
            type="button"
            onClick={() => setPaletteOpen(true)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-ink-200 bg-white text-ink-700 transition hover:border-ink-300 focus-energy md:hidden"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>

          {isMaster && (
            <Link
              href="/dashboard/admin/wallet-ops?tab=payin"
              className="group hidden items-center gap-2.5 rounded-2xl border border-emerald-200/70 bg-white/80 py-1.5 pl-2 pr-3.5 shadow-sm transition hover:border-emerald-300 hover:shadow-energy-sm focus-energy xl:flex"
              title="Live company payin today (all rails) — resets to ₹0 at midnight. Opens Wallet Operations → Live payin."
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-100">
                <Activity className="h-3.5 w-3.5" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-700/80">
                  Payin · Today
                </span>
                <span className="font-display text-sm font-semibold tabular-nums tracking-[-0.01em] text-ink-900">
                  {formatINR(payinToday ?? 0)}
                </span>
              </span>
            </Link>
          )}

          {isMaster ? (
            <Link
              href="/dashboard/admin/revenue"
              className="group hidden items-center gap-2.5 rounded-2xl border border-royal-200/70 bg-white/80 py-1.5 pl-2 pr-3.5 shadow-sm transition hover:border-royal-300 hover:shadow-energy-sm focus-energy xl:flex"
              title="Revenue Wallet — company earnings (MDR margin in − commission out). Opens Company Earnings."
            >
              <span className="grid h-7 w-7 place-items-center rounded-lg bg-royal-50 text-royal-700 ring-1 ring-inset ring-royal-100">
                <Landmark className="h-3.5 w-3.5" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-royal-700/80">
                  Revenue Wallet
                </span>
                <span className="font-display text-sm font-semibold tabular-nums tracking-[-0.01em] text-ink-900">
                  {formatINR(revenueBalance ?? 0)}
                </span>
              </span>
            </Link>
          ) : isAdminStaff ? null : (
            <div
              className="hidden items-center gap-2.5 rounded-2xl bg-ink-950 py-1.5 pl-3 pr-3.5 text-white shadow-[0_10px_30px_-12px_rgba(7,11,20,0.6)] md:flex"
              title="Wallet balance"
            >
              <span className="relative flex h-2 w-2" aria-hidden>
                <span className="absolute inline-flex h-full w-full rounded-full bg-energy-gradient opacity-70 animate-ping-soft" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-energy-gradient" />
              </span>
              <span className="flex flex-col leading-tight">
                <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-ink-400">
                  Wallet
                </span>
                <span className="font-display text-sm font-semibold tabular-nums tracking-[-0.01em]">
                  {formatINR(liveBalance ?? user?.walletBalance ?? 0)}
                </span>
              </span>
            </div>
          )}

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
              aria-expanded={notifOpen}
              aria-haspopup="dialog"
              onClick={() => { setNotifOpen((o) => !o); if (!notifOpen) fetchNotifs(); }}
              className={cn(
                "relative inline-flex h-10 w-10 items-center justify-center rounded-2xl border bg-white text-ink-700 transition focus-energy",
                notifOpen ? "border-royal-300 text-royal-700" : "border-ink-200 hover:border-ink-300 hover:text-ink-900"
              )}
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-coral-400 opacity-60 animate-ping-soft" aria-hidden />
                  <span className="relative grid h-[18px] min-w-[18px] place-items-center rounded-full bg-energy-gradient px-1 text-[10px] font-bold text-white ring-2 ring-white">
                    {unread > 9 ? "9+" : unread}
                  </span>
                </span>
              )}
            </button>

            <AnimatePresence>
              {notifOpen && (
                <motion.div
                  key="notifs"
                  {...dropdownMotion}
                  className="absolute right-0 top-full z-50 mt-2 w-[22rem] max-w-[calc(100vw-2rem)] origin-top-right overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-energy"
                  role="dialog"
                  aria-label="Notifications"
                >
                  <div className="flex items-center justify-between border-b border-ink-100 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <p className="font-display text-sm font-semibold tracking-[-0.01em] text-ink-900">Notifications</p>
                      {unread > 0 && <Badge size="sm" variant="coral">{unread} new</Badge>}
                    </div>
                    {unread > 0 && (
                      <button type="button" onClick={markAllRead} className="text-xs font-semibold text-brand-600 transition hover:text-brand-800">
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifs.length === 0 ? (
                      <div className="flex flex-col items-center px-4 py-10 text-center">
                        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-ink-50 text-ink-400 ring-1 ring-inset ring-ink-100">
                          <BellOff className="h-5 w-5" />
                        </span>
                        <p className="mt-3 text-sm font-semibold text-ink-800">You&apos;re all caught up.</p>
                        <p className="mt-0.5 text-xs text-ink-500">New alerts will land here.</p>
                      </div>
                    ) : (
                      <ul className="divide-y divide-ink-50">
                        {notifs.map((n) => (
                          <li key={n.id}>
                            <button
                              type="button"
                              onClick={() => onClickNotif(n)}
                              className={cn(
                                "flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-ink-50",
                                !n.read && "bg-royal-50/40"
                              )}
                            >
                              <span className="mt-1.5 flex h-2 w-2 shrink-0">
                                {!n.read && (
                                  <span className="relative inline-flex h-2 w-2 rounded-full bg-energy-gradient" />
                                )}
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-center justify-between gap-2">
                                  <span className={cn("truncate text-sm", n.read ? "font-medium text-ink-700" : "font-semibold text-ink-900")}>{n.title}</span>
                                  <span className="shrink-0 text-[10px] text-ink-400">{timeAgo(n.createdAt)}</span>
                                </span>
                                <span className="mt-0.5 line-clamp-2 block text-xs text-ink-500">{n.body}</span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* User menu */}
          <div className="relative" ref={userRef}>
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-haspopup="menu"
              className={cn(
                "flex h-10 items-center gap-2.5 rounded-2xl border bg-white pl-1 pr-1.5 transition focus-energy md:pr-3",
                open ? "border-royal-300" : "border-ink-200 hover:border-ink-300"
              )}
            >
              <span className="grid h-8 w-8 place-items-center rounded-xl bg-energy-gradient font-display text-[11px] font-semibold text-white shadow-energy-sm">
                {initials}
              </span>
              <span className="hidden flex-col text-left leading-tight md:flex">
                <span className="max-w-[9rem] truncate text-sm font-semibold text-ink-900">
                  {user?.name ?? "Guest"}
                </span>
                <span className="text-[10px] uppercase tracking-[0.14em] text-ink-500">
                  {displayRole}{userCode ? ` · ${userCode}` : ""}
                </span>
              </span>
              <ChevronDown className={cn("hidden h-3.5 w-3.5 text-ink-400 transition-transform md:block", open && "rotate-180")} />
            </button>
            <AnimatePresence>
              {open && (
                <motion.div
                  key="user-menu"
                  {...dropdownMotion}
                  className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right overflow-hidden rounded-3xl border border-ink-100 bg-white shadow-energy"
                  role="menu"
                >
                  <div className="grain relative bg-ink-950 p-4 text-white">
                    <div className="relative z-10 flex items-center gap-3">
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-energy-gradient font-display text-xs font-semibold text-white">
                        {initials}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">{user?.name}</p>
                        <p className="truncate text-xs text-ink-400">{user?.email}</p>
                      </div>
                    </div>
                    <div className="relative z-10 mt-3 flex flex-wrap items-center gap-1.5">
                      <span className="rounded-md bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-200">
                        {displayRole}
                      </span>
                      {userCode && (
                        <span className="rounded-md bg-white/[0.08] px-1.5 py-0.5 font-mono text-[10px] text-ink-200">
                          {userCode}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="p-1.5">
                    <Link
                      href="/dashboard/profile"
                      role="menuitem"
                      onClick={() => setOpen(false)}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-ink-700 transition hover:bg-ink-50 hover:text-ink-900"
                    >
                      <UserIcon className="h-4 w-4 text-ink-400" />
                      My profile
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={logout}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2 text-sm text-coral-700 transition hover:bg-coral-50"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign out
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <CommandPalette open={paletteOpen} onOpenChange={setPaletteOpen} />
    </>
  );
}
