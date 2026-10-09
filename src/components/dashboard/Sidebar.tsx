"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useMemo, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X, ChevronsLeft, ChevronsRight, ChevronDown } from "lucide-react";
import { Logo } from "@/components/layout/Logo";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { toDisplayRole, type Role } from "@/lib/auth";
import { navByRole, type NavGroup, type NavItem } from "@/lib/roles";
import { hrefToServiceKey } from "@/lib/services/catalog";
import { useEffectiveServices } from "@/hooks/useEffectiveServices";

export const SIDEBAR_WIDTH = 272;
export const SIDEBAR_WIDTH_COLLAPSED = 76;

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Recursively filter nav items by a predicate applied to leaf links. Parent
 *  items (with children) are kept only if at least one child survives, so a
 *  collapsible tab disappears entirely once all of its sub-links are hidden. */
function filterNavItems(items: NavItem[], keep: (item: NavItem) => boolean): NavItem[] {
  return items
    .map((item) => {
      if (item.children && item.children.length > 0) {
        const children = filterNavItems(item.children, keep);
        return children.length > 0 ? { ...item, children } : null;
      }
      return keep(item) ? item : null;
    })
    .filter((x): x is NavItem => x !== null);
}

const ROLE_LABEL: Record<Role, string> = {
  "master-admin": "Master Admin",
  admin: "Admin",
  "sub-admin": "Sub-Admin",
  finance: "Finance",
  "super-distributor": "Super Distributor",
  "master-distributor": "Master Distributor",
  distributor: "Distributor",
  retailer: "Retailer",
};

export function Sidebar({
  open,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: {
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const reduce = useReducedMotion();

  const role: Role = useMemo(() => {
    if (!session?.user?.role) return "retailer";
    return toDisplayRole(session.user.role as any);
  }, [session]);

  const allowedTabs: string[] = useMemo(
    () => (session?.user as any)?.allowedTabs ?? [],
    [session]
  );

  const isStaff =
    role === "master-admin" || role === "admin" || role === "sub-admin" || role === "finance";

  // Effective services (globally enabled AND enabled per-user). Null while
  // loading — service links stay hidden until the allowlist is known.
  const effectiveServices = useEffectiveServices();

  const groups: NavGroup[] = useMemo(() => {
    let base = navByRole[role];

    // Admin/sub-admin: filter workspace tabs by allowedTabs. Tab links may sit
    // under /dashboard/admin/, /dashboard/master-admin/ or /dashboard/sub-admin/
    // depending on the nav — match by slug regardless of prefix.
    // Master-admins always have full access and are never scoped.
    if ((role === "admin" || role === "sub-admin") && allowedTabs.length > 0) {
      const prefixes = [
        "/dashboard/admin/",
        "/dashboard/master-admin/",
        "/dashboard/sub-admin/",
      ];
      const matchTab = (item: NavItem) => {
        const prefix = prefixes.find((p) => item.href.startsWith(p));
        if (!prefix) return true;
        const slug = item.href.slice(prefix.length).split("/")[0];
        return allowedTabs.includes(slug);
      };
      base = base
        .map((group) => ({ ...group, items: filterNavItems(group.items, matchTab) }))
        .filter((group) => group.items.length > 0);
    }

    // Network roles (RT/DT/MD/SD): show only services that are enabled both
    // globally and for this user (default-disabled allowlist).
    if (!isStaff) {
      const allowed = effectiveServices ?? new Set<string>();
      const matchService = (item: NavItem) => {
        const key = hrefToServiceKey(item.href);
        if (!key) return true;
        return allowed.has(key);
      };
      base = base
        .map((group) => ({ ...group, items: filterNavItems(group.items, matchService) }))
        .filter((group) => group.items.length > 0);
    }

    return base;
  }, [role, allowedTabs, isStaff, effectiveServices]);

  // Mobile drawer: close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const user = session?.user;
  const userCode = (user as { userCode?: string | null } | undefined)?.userCode ?? null;
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .slice(0, 2)
        .join("")
        .toUpperCase()
    : "??";

  const content = (variant: "desktop" | "mobile") => (
    <SidebarContent
      variant={variant}
      groups={groups}
      pathname={pathname}
      collapsed={variant === "desktop" ? collapsed : false}
      onClose={onClose}
      onToggleCollapse={onToggleCollapse}
      userName={user?.name ?? "Guest"}
      userCode={userCode}
      initials={initials}
      roleLabel={ROLE_LABEL[role]}
    />
  );

  return (
    <>
      {/* ── Desktop: fixed rail with animated width ───────────────────── */}
      <motion.aside
        className="fixed inset-y-0 left-0 z-40 hidden flex-col overflow-hidden bg-ink-950 text-ink-200 lg:flex"
        initial={false}
        animate={{ width: collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH }}
        transition={{ duration: reduce ? 0 : 0.32, ease: EASE }}
        aria-label="Primary"
      >
        <GrainLayer />
        {content("desktop")}
      </motion.aside>

      {/* ── Mobile: drawer ───────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              className="fixed inset-0 z-40 bg-ink-950/60 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              aria-hidden
            />
            <motion.aside
              key="drawer"
              className="fixed inset-y-0 left-0 z-50 flex w-[288px] max-w-[88vw] flex-col overflow-hidden bg-ink-950 text-ink-200 shadow-2xl lg:hidden"
              initial={reduce ? { x: 0 } : { x: "-100%" }}
              animate={{ x: 0 }}
              exit={reduce ? undefined : { x: "-100%" }}
              transition={{ duration: 0.3, ease: EASE }}
              role="dialog"
              aria-modal="true"
              aria-label="Navigation menu"
            >
              <GrainLayer />
              {content("mobile")}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

/** Film-grain + soft top glow layered under the rail content. `.grain` sets
 *  `position: relative`, so it lives on an inner full-size div rather than the
 *  fixed <aside> itself. */
function GrainLayer() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <div className="grain h-full w-full" />
      <div className="absolute -left-20 -top-24 h-64 w-64 rounded-full bg-royal-500/15 blur-3xl" />
      <div className="absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-brand-500/10 blur-3xl" />
    </div>
  );
}

/* ── Inner content shared by both rails ───────────────────────────── */

function SidebarContent({
  variant,
  groups,
  pathname,
  collapsed,
  onClose,
  onToggleCollapse,
  userName,
  userCode,
  initials,
  roleLabel,
}: {
  variant: "desktop" | "mobile";
  groups: NavGroup[];
  pathname: string;
  collapsed: boolean;
  onClose: () => void;
  onToggleCollapse?: () => void;
  userName: string;
  userCode: string | null;
  initials: string;
  roleLabel: string;
}) {
  const layoutId = variant === "desktop" ? "sidebar-active" : "sidebar-active-mobile";

  return (
    <div className="relative z-10 flex h-full min-h-0 flex-col">
      {/* Brand */}
      <div
        className={cn(
          "flex h-16 shrink-0 items-center md:h-20",
          collapsed ? "justify-center px-2" : "justify-between px-5"
        )}
      >
        {collapsed ? (
          <Logo iconOnly />
        ) : (
          <Logo variant="light" size="sm" />
        )}
        {variant === "mobile" && (
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-ink-300 transition hover:bg-white/[0.06] hover:text-white focus-energy"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav
        className={cn(
          "scrollbar-none min-h-0 flex-1 overflow-y-auto pb-4 pt-1",
          collapsed ? "px-2" : "px-3"
        )}
        aria-label="Sections"
      >
        {groups.map((group, gi) => (
          <div key={group.heading} className="mb-4 last:mb-0">
            {collapsed ? (
              gi > 0 && <div className="mx-auto mb-3 h-px w-8 bg-white/[0.08]" />
            ) : (
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-500">
                {group.heading}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) =>
                item.children && item.children.length > 0 ? (
                  <CollapsibleNavItem
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    collapsed={collapsed}
                    onClose={onClose}
                    layoutId={layoutId}
                  />
                ) : (
                  <NavLeaf
                    key={item.href}
                    item={item}
                    pathname={pathname}
                    collapsed={collapsed}
                    onClose={onClose}
                    layoutId={layoutId}
                  />
                )
              )}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer: user card + collapse toggle */}
      <div
        className={cn(
          "shrink-0 border-t border-white/[0.06]",
          collapsed ? "flex flex-col items-center gap-2 p-2 py-3" : "p-3"
        )}
      >
        {collapsed ? (
          <>
            <span
              className="grid h-10 w-10 place-items-center rounded-xl bg-energy-gradient font-display text-xs font-semibold text-white shadow-energy-sm"
              title={`${userName} · ${roleLabel}`}
            >
              {initials}
            </span>
            {onToggleCollapse && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-ink-400 transition hover:bg-white/[0.06] hover:text-white focus-energy"
                aria-label="Expand sidebar"
                title="Expand sidebar"
              >
                <ChevronsRight className="h-4 w-4" />
              </button>
            )}
          </>
        ) : (
          <div className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-2.5 ring-1 ring-inset ring-white/[0.06]">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-energy-gradient font-display text-xs font-semibold text-white shadow-energy-sm">
              {initials}
            </span>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-sm font-semibold text-white">{userName}</p>
              <p className="mt-0.5 flex items-center gap-1.5">
                <span className="truncate rounded-md bg-white/[0.08] px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-ink-200">
                  {roleLabel}
                </span>
                {userCode && (
                  <span className="truncate font-mono text-[10px] text-ink-400">{userCode}</span>
                )}
              </p>
            </div>
            {onToggleCollapse && variant === "desktop" && (
              <button
                type="button"
                onClick={onToggleCollapse}
                className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-ink-400 transition hover:bg-white/[0.08] hover:text-white focus-energy"
                aria-label="Collapse sidebar"
                title="Collapse sidebar"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function isItemActive(item: NavItem, pathname: string): boolean {
  return (
    pathname === item.href ||
    (item.href !== "/dashboard" && pathname.startsWith(item.href))
  );
}

function NavBadge({ badge, active }: { badge: string; active: boolean }) {
  const numeric = /^\d+$/.test(badge);
  return (
    <Badge
      size="sm"
      variant={numeric ? "coral" : "energy"}
      className={cn("ml-auto shrink-0", active && !numeric && "ring-white/40")}
    >
      {badge}
    </Badge>
  );
}

/** A single leaf link row in the sidebar. */
function NavLeaf({
  item,
  pathname,
  collapsed,
  onClose,
  layoutId,
  nested = false,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onClose: () => void;
  layoutId: string;
  nested?: boolean;
}) {
  const Icon = item.icon;
  const active = isItemActive(item, pathname);
  return (
    <li className="relative">
      <Link
        href={item.href}
        onClick={onClose}
        title={collapsed ? item.label : undefined}
        aria-current={active ? "page" : undefined}
        className={cn(
          "group relative isolate flex items-center rounded-xl text-sm font-medium transition-colors duration-200 focus-energy",
          collapsed ? "mx-auto h-11 w-11 justify-center" : nested ? "gap-3 px-3 py-2" : "gap-3 px-3 py-2.5",
          active ? "text-white" : "text-ink-300 hover:bg-white/[0.04] hover:text-white"
        )}
      >
        {active && (
          <motion.span
            layoutId={layoutId}
            className="absolute inset-0 -z-10 rounded-xl bg-white/[0.06]"
            transition={{ type: "spring", stiffness: 420, damping: 38, mass: 0.8 }}
            aria-hidden
          >
            <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-energy-gradient" />
          </motion.span>
        )}
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            active ? "text-white" : "text-ink-400 group-hover:text-ink-100"
          )}
        />
        {!collapsed && <span className="truncate">{item.label}</span>}
        {!collapsed && item.badge && <NavBadge badge={item.badge} active={active} />}
        {collapsed && item.badge && (
          <span
            className={cn(
              "absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full",
              /^\d+$/.test(item.badge) ? "bg-coral-400" : "bg-energy-gradient"
            )}
            aria-hidden
          />
        )}
      </Link>
    </li>
  );
}

/** A collapsible parent tab whose children are individual leaf links. When the
 *  sidebar is collapsed to icons, children are flattened to individual icon
 *  rows so every service stays reachable with a single click. */
function CollapsibleNavItem({
  item,
  pathname,
  collapsed,
  onClose,
  layoutId,
}: {
  item: NavItem;
  pathname: string;
  collapsed: boolean;
  onClose: () => void;
  layoutId: string;
}) {
  const children = item.children ?? [];
  const childActive = children.some((c) => isItemActive(c, pathname));
  const [open, setOpen] = useState(childActive);
  const reduce = useReducedMotion();

  // Auto-expand when navigating into one of the children.
  useEffect(() => {
    if (childActive) setOpen(true);
  }, [childActive]);

  const Icon = item.icon;

  if (collapsed) {
    return (
      <>
        {children.map((child) => (
          <NavLeaf
            key={child.href}
            item={child}
            pathname={pathname}
            collapsed={collapsed}
            onClose={onClose}
            layoutId={layoutId}
          />
        ))}
      </>
    );
  }

  const panelId = `nav-group-${item.href.replace(/\W+/g, "-")}`;

  return (
    <li>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className={cn(
          "group relative flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 focus-energy",
          childActive ? "text-white" : "text-ink-300 hover:bg-white/[0.04] hover:text-white"
        )}
      >
        <Icon
          className={cn(
            "h-[18px] w-[18px] shrink-0 transition-colors",
            childActive ? "text-white" : "text-ink-400 group-hover:text-ink-100"
          )}
        />
        <span className="truncate">{item.label}</span>
        <motion.span
          className="ml-auto inline-flex shrink-0 text-ink-500"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: reduce ? 0 : 0.22, ease: EASE }}
        >
          <ChevronDown className="h-4 w-4" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="children"
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.26, ease: EASE }}
            className="overflow-hidden"
          >
            <ul className="ml-[22px] mt-1 space-y-0.5 border-l border-white/[0.08] pl-2">
              {children.map((child) => (
                <NavLeaf
                  key={child.href}
                  item={child}
                  pathname={pathname}
                  collapsed={collapsed}
                  onClose={onClose}
                  layoutId={layoutId}
                  nested
                />
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}
