"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, CornerDownLeft, ArrowUp, ArrowDown } from "lucide-react";
import { MagnifyingGlass } from "@phosphor-icons/react";
import { IconTile } from "@/components/ui/Icon";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils";
import { toDisplayRole, type Role } from "@/lib/auth";
import { navByRole, type NavItem } from "@/lib/roles";

/**
 * CommandPalette — ⌘K / Ctrl+K global navigator.
 *
 * Results are the user's own navigation (`navByRole[role]`), children flattened
 * into their group heading, with the same `allowedTabs` prefix scoping the
 * Sidebar applies for admin / sub-admin accounts.
 */
type PaletteEntry = {
  href: string;
  label: string;
  heading: string;
  icon: NavItem["icon"];
  badge?: string;
  /** Parent label when the entry came from a collapsible group. */
  parent?: string;
};

const TAB_PREFIXES = ["/dashboard/admin/", "/dashboard/master-admin/", "/dashboard/sub-admin/"];

function flatten(items: NavItem[], heading: string, parent?: string): PaletteEntry[] {
  return items.flatMap((item) =>
    item.children && item.children.length > 0
      ? flatten(item.children, heading, item.label)
      : [{ href: item.href, label: item.label, heading, icon: item.icon, badge: item.badge, parent }]
  );
}

/** Case-insensitive, order-preserving substring match on every query token. */
function matches(entry: PaletteEntry, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const hay = `${entry.label} ${entry.parent ?? ""} ${entry.heading}`.toLowerCase();
  return q.split(/\s+/).every((token) => hay.includes(token));
}

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { data: session } = useSession();
  const reduce = useReducedMotion();
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const restoreRef = useRef<HTMLElement | null>(null);

  const role: Role = useMemo(() => {
    if (!session?.user?.role) return "retailer";
    return toDisplayRole(session.user.role as any);
  }, [session]);

  const allowedTabs: string[] = useMemo(
    () => (session?.user as any)?.allowedTabs ?? [],
    [session]
  );

  const entries: PaletteEntry[] = useMemo(() => {
    const groups = navByRole[role];
    const scoped = (role === "admin" || role === "sub-admin") && allowedTabs.length > 0;
    const matchTab = (href: string) => {
      const prefix = TAB_PREFIXES.find((p) => href.startsWith(p));
      if (!prefix) return true;
      const slug = href.slice(prefix.length).split("/")[0];
      return allowedTabs.includes(slug);
    };
    const all = groups.flatMap((g) => flatten(g.items, g.heading));
    const seen = new Set<string>();
    return all.filter((e) => {
      if (seen.has(e.href)) return false;
      seen.add(e.href);
      return scoped ? matchTab(e.href) : true;
    });
  }, [role, allowedTabs]);

  const results = useMemo(() => entries.filter((e) => matches(e, query)), [entries, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, PaletteEntry[]>();
    for (const r of results) {
      const list = map.get(r.heading) ?? [];
      list.push(r);
      map.set(r.heading, list);
    }
    return Array.from(map.entries());
  }, [results]);

  // ⌘K / Ctrl+K global shortcut.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  // Focus trap-lite: focus the input on open, restore focus on close.
  useEffect(() => {
    if (open) {
      restoreRef.current = (document.activeElement as HTMLElement | null) ?? null;
      setQuery("");
      setActive(0);
      const id = requestAnimationFrame(() => inputRef.current?.focus());
      document.body.style.overflow = "hidden";
      return () => {
        cancelAnimationFrame(id);
        document.body.style.overflow = "";
      };
    }
    restoreRef.current?.focus?.();
    restoreRef.current = null;
  }, [open]);

  // Keep the active row in view.
  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${active}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [active, results.length]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const go = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router]
  );

  const onKeyDown = (e: ReactKeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (results.length ? (i + 1) % results.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (results.length ? (i - 1 + results.length) % results.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const r = results[active];
      if (r) go(r.href);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    }
  };

  const activeId = results[active] ? `cmdk-opt-${active}` : undefined;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="cmdk"
          className="fixed inset-0 z-[120] flex items-start justify-center px-4 pt-[12vh]"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduce ? undefined : { opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          <button
            type="button"
            aria-label="Close search"
            className="absolute inset-0 bg-ink-950/50 backdrop-blur-sm"
            onClick={() => onOpenChange(false)}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Search and jump to a page"
            className="grain relative w-full max-w-xl overflow-hidden rounded-3xl bg-white shadow-energy ring-1 ring-ink-100"
            initial={reduce ? false : { opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={reduce ? undefined : { opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: reduce ? 0 : 0.22, ease: [0.22, 1, 0.36, 1] }}
            onKeyDown={onKeyDown}
          >
            <div className="relative z-10 flex items-center gap-3 border-b border-ink-100 px-4 py-3">
              <IconTile icon={MagnifyingGlass} tone="energy" size="sm" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Jump to a page… try “payout” or “kyc”"
                className="h-10 flex-1 bg-transparent font-sans text-[15px] text-ink-900 outline-none placeholder:text-ink-400"
                role="combobox"
                aria-expanded="true"
                aria-controls="cmdk-list"
                aria-activedescendant={activeId}
                aria-autocomplete="list"
                autoComplete="off"
                spellCheck={false}
              />
              <kbd className="hidden items-center gap-1 rounded-lg border border-ink-200 bg-ink-50 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-ink-500 sm:inline-flex">
                ESC
              </kbd>
            </div>

            <ul
              id="cmdk-list"
              ref={listRef}
              role="listbox"
              aria-label="Results"
              className="relative z-10 max-h-[52vh] overflow-y-auto p-2"
            >
              {results.length === 0 ? (
                <li className="flex flex-col items-center gap-2 px-4 py-12 text-center">
                  <Search className="h-5 w-5 text-ink-300" />
                  <p className="text-sm font-semibold text-ink-700">No matches for “{query}”</p>
                  <p className="text-xs text-ink-500">Try a shorter word — like “wallet” or “report”.</p>
                </li>
              ) : (
                grouped.map(([heading, items]) => (
                  <li key={heading} role="presentation" className="mb-1 last:mb-0">
                    <p className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-ink-400">
                      {heading}
                    </p>
                    <ul role="group" aria-label={heading}>
                      {items.map((item) => {
                        const index = results.indexOf(item);
                        const isActive = index === active;
                        const Icon = item.icon;
                        return (
                          <li
                            key={item.href}
                            id={`cmdk-opt-${index}`}
                            data-index={index}
                            role="option"
                            aria-selected={isActive}
                            onMouseEnter={() => setActive(index)}
                            onClick={() => go(item.href)}
                            className={cn(
                              "flex cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                              isActive ? "pill-active" : "text-ink-700 hover:bg-ink-50"
                            )}
                          >
                            <span
                              className={cn(
                                "grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                                isActive ? "bg-white/70 text-royal-700" : "bg-ink-50 text-ink-500"
                              )}
                            >
                              <Icon className="h-4 w-4" />
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className={cn("block truncate font-medium", isActive && "text-ink-900")}>
                                {item.label}
                              </span>
                              {item.parent && (
                                <span className="block truncate text-[11px] text-ink-400">{item.parent}</span>
                              )}
                            </span>
                            {item.badge && (
                              <Badge
                                size="sm"
                                variant={/^\d+$/.test(item.badge) ? "coral" : "energy"}
                              >
                                {item.badge}
                              </Badge>
                            )}
                            {isActive && (
                              <CornerDownLeft className="h-3.5 w-3.5 shrink-0 text-royal-600" aria-hidden />
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                ))
              )}
            </ul>

            <div className="relative z-10 flex items-center justify-between gap-3 border-t border-ink-100 bg-ink-50/60 px-4 py-2 text-[11px] text-ink-500">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded-md border border-ink-200 bg-white px-1 py-0.5"><ArrowUp className="h-3 w-3" /></kbd>
                  <kbd className="rounded-md border border-ink-200 bg-white px-1 py-0.5"><ArrowDown className="h-3 w-3" /></kbd>
                  navigate
                </span>
                <span className="inline-flex items-center gap-1">
                  <kbd className="rounded-md border border-ink-200 bg-white px-1 py-0.5"><CornerDownLeft className="h-3 w-3" /></kbd>
                  open
                </span>
              </div>
              <span className="inline-flex items-center gap-1 font-semibold">
                <kbd className="rounded-md border border-ink-200 bg-white px-1.5 py-0.5 font-sans">⌘K</kbd>
                <span className="text-ink-400">/ Ctrl K</span>
              </span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
