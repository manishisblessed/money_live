"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import * as React from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Airplane,
  ArrowRight,
  ArrowUpRight,
  CaretDown,
  Fingerprint,
  List,
  PaperPlaneTilt,
  QrCode,
  Receipt,
  SquaresFour,
  X,
  type Icon as PhosphorIcon
} from "@phosphor-icons/react";
import { Logo } from "./Logo";
import { Button } from "@/components/ui/Button";
import { IconTile, type IconTone } from "@/components/ui/Icon";
import { mainNav, type NavLink } from "@/lib/data";
import { cn } from "@/lib/utils";

const easeOut = [0.22, 1, 0.36, 1] as const;

/** Routes whose first section is dark & full-bleed (the home hero is owned by
 *  another builder, so we list it here as a fallback; every PageHero with
 *  `variant="dark"` also emits `data-nav-theme="dark"`). */
const DARK_ROUTES = new Set(["/"]);

/** Mega-menu metadata for the "Services" children (keyed by href). */
const serviceMeta: Record<
  string,
  { icon: PhosphorIcon; tone: IconTone; desc: string }
> = {
  "/services#aadhaar-pay": {
    icon: Fingerprint,
    tone: "brand",
    desc: "Cash out, balance check and mini statement on a fingerprint."
  },
  "/services#money-transfer": {
    icon: PaperPlaneTilt,
    tone: "accent",
    desc: "Send money to any bank account, 24x7, settled in seconds."
  },
  "/services#upi": {
    icon: QrCode,
    tone: "royal",
    desc: "Collect on UPI and pay from your wallet without a POS."
  },
  "/services#bills": {
    icon: Receipt,
    tone: "coral",
    desc: "Recharges plus 1,200+ billers on BBPS, with commission on each."
  },
  "/services#travel": {
    icon: Airplane,
    tone: "amber",
    desc: "Flights, buses and hotels at agent rates from your counter."
  }
};

function useIsActive(pathname: string) {
  return React.useCallback(
    (href: string) =>
      pathname === href || (href !== "/" && pathname.startsWith(href)),
    [pathname]
  );
}

export function Navbar() {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const isActive = useIsActive(pathname);

  const [scrolled, setScrolled] = React.useState(false);
  const [darkHero, setDarkHero] = React.useState(DARK_ROUTES.has(pathname));
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [megaOpen, setMegaOpen] = React.useState(false);
  const [hovered, setHovered] = React.useState<string | null>(null);

  const closeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const headerRef = React.useRef<HTMLElement>(null);

  /* Scroll state */
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Detect whether the page under the (transparent) island is dark.
     PageTransition mounts the new page after its exit animation, so we probe
     a few times after a route change. */
  React.useEffect(() => {
    let cancelled = false;
    const probe = () => {
      if (cancelled) return;
      const el = document.querySelector('[data-nav-theme="dark"]');
      setDarkHero(Boolean(el) || DARK_ROUTES.has(pathname));
    };
    probe();
    const timers = [120, 450, 900].map((ms) => setTimeout(probe, ms));
    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, [pathname]);

  /* Close everything on route change */
  React.useEffect(() => {
    setMobileOpen(false);
    setMegaOpen(false);
    setHovered(null);
  }, [pathname]);

  /* Escape closes overlays; lock body scroll while the mobile sheet is open */
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setMobileOpen(false);
        setMegaOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  React.useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  /* Close the mega-menu when focus leaves the header */
  React.useEffect(() => {
    if (!megaOpen) return;
    const onFocus = (e: FocusEvent) => {
      if (
        headerRef.current &&
        e.target instanceof Node &&
        !headerRef.current.contains(e.target)
      ) {
        setMegaOpen(false);
      }
    };
    document.addEventListener("focusin", onFocus);
    return () => document.removeEventListener("focusin", onFocus);
  }, [megaOpen]);

  const openMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setMegaOpen(true);
  };
  const scheduleCloseMega = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setMegaOpen(false), 140);
  };

  /* The island turns solid when scrolled OR while the mega-menu is open, so
     the panel never floats under a transparent, unreadable pill. */
  const solid = scrolled || megaOpen;
  const onDark = darkHero && !solid;
  const servicesItem = mainNav.find((i) => i.children);

  return (
    <>
      <header
        ref={headerRef}
        className="fixed inset-x-0 top-3 z-50 px-3 sm:px-4"
        onMouseLeave={() => {
          setHovered(null);
          scheduleCloseMega();
        }}
      >
        <div className="relative mx-auto max-w-6xl">
          <motion.div
            initial={false}
            animate={{
              backgroundColor: solid
                ? "rgba(255,255,255,0.72)"
                : "rgba(255,255,255,0)",
              boxShadow: solid
                ? "0 10px 30px -12px rgba(15,23,42,0.18), 0 0 0 1px rgba(15,23,42,0.06)"
                : "0 0 0 0 rgba(15,23,42,0), 0 0 0 1px rgba(15,23,42,0)",
              backdropFilter: solid
                ? "saturate(180%) blur(18px)"
                : "saturate(100%) blur(0px)"
            }}
            transition={{ duration: reduce ? 0 : 0.35, ease: easeOut }}
            style={{
              WebkitBackdropFilter: solid
                ? "saturate(180%) blur(18px)"
                : undefined
            }}
            className="flex h-16 items-center justify-between gap-4 rounded-full pl-4 pr-2.5 sm:pl-5"
          >
            <Logo
              size="md"
              variant={onDark ? "light" : "dark"}
              className="shrink-0"
            />

            {/* Center links (lg+) */}
            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="flex items-center gap-0.5">
                {mainNav.map((item) => {
                  const active = isActive(item.href);
                  const pill = hovered ? hovered === item.label : active;
                  const hasChildren = Boolean(item.children);
                  return (
                    <li
                      key={item.label}
                      className="relative"
                      onMouseEnter={() => {
                        setHovered(item.label);
                        if (hasChildren) openMega();
                        else scheduleCloseMega();
                      }}
                    >
                      {pill && (
                        <motion.span
                          layoutId="nav-pill"
                          aria-hidden
                          className={cn(
                            "absolute inset-0 rounded-full",
                            onDark ? "bg-white/15" : "pill-active"
                          )}
                          transition={{
                            type: "spring",
                            stiffness: 420,
                            damping: 34,
                            mass: 0.6
                          }}
                        />
                      )}
                      <Link
                        href={item.href}
                        aria-current={active ? "page" : undefined}
                        aria-haspopup={hasChildren ? "menu" : undefined}
                        aria-expanded={hasChildren ? megaOpen : undefined}
                        aria-controls={
                          hasChildren ? "services-mega-menu" : undefined
                        }
                        onFocus={() => {
                          setHovered(item.label);
                          if (hasChildren) openMega();
                        }}
                        onKeyDown={(e) => {
                          if (hasChildren && e.key === "ArrowDown") {
                            e.preventDefault();
                            openMega();
                            requestAnimationFrame(() => {
                              document
                                .querySelector<HTMLAnchorElement>(
                                  "#services-mega-menu a"
                                )
                                ?.focus();
                            });
                          }
                        }}
                        className={cn(
                          "relative z-10 inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-full px-3.5 text-sm font-medium transition-colors focus-energy",
                          onDark
                            ? "text-white/80 hover:text-white"
                            : active
                              ? "text-royal-900"
                              : "text-ink-700 hover:text-ink-950"
                        )}
                      >
                        {item.label}
                        {hasChildren && (
                          <CaretDown
                            size={12}
                            weight="bold"
                            aria-hidden
                            className={cn(
                              "transition-transform duration-300",
                              megaOpen && "rotate-180"
                            )}
                          />
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Right CTAs (lg+) */}
            <div className="hidden items-center gap-1.5 lg:flex">
              <Link href="/login" className="rounded-2xl focus-energy">
                <Button
                  variant="ghost"
                  size="sm"
                  tabIndex={-1}
                  className={cn(
                    onDark && "text-white/85 hover:bg-white/10 hover:text-white"
                  )}
                >
                  Login
                </Button>
              </Link>
              <Link href="/register" className="rounded-2xl focus-energy">
                <Button size="sm" tabIndex={-1} className="rounded-full px-5">
                  Start earning
                  <ArrowRight size={14} weight="bold" aria-hidden />
                </Button>
              </Link>
            </div>

            {/* Hamburger (mobile) */}
            <button
              type="button"
              aria-label="Open menu"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileOpen(true)}
              className={cn(
                "inline-flex h-11 w-11 items-center justify-center rounded-full transition focus-energy active:scale-95 lg:hidden",
                onDark
                  ? "bg-white/10 text-white hover:bg-white/20"
                  : "bg-ink-900 text-white hover:bg-ink-800"
              )}
            >
              <List size={20} weight="bold" aria-hidden />
            </button>
          </motion.div>

          {/* Mega menu */}
          <AnimatePresence>
            {megaOpen && servicesItem?.children && (
              <MegaMenu
                item={servicesItem}
                reduce={Boolean(reduce)}
                onEnter={openMega}
                onLeave={scheduleCloseMega}
                isActive={isActive}
              />
            )}
          </AnimatePresence>
        </div>
      </header>

      {/* Mobile overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <MobileMenu
            reduce={Boolean(reduce)}
            onClose={() => setMobileOpen(false)}
            isActive={isActive}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Mega menu
   ────────────────────────────────────────────────────────────────────────── */
function MegaMenu({
  item,
  reduce,
  onEnter,
  onLeave,
  isActive
}: {
  item: NavLink;
  reduce: boolean;
  onEnter: () => void;
  onLeave: () => void;
  isActive: (href: string) => boolean;
}) {
  return (
    <motion.div
      id="services-mega-menu"
      role="menu"
      aria-label="Services"
      initial={{ opacity: 0, y: reduce ? 0 : -8, scale: reduce ? 1 : 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: reduce ? 0 : -6, scale: reduce ? 1 : 0.985 }}
      transition={{ duration: reduce ? 0 : 0.22, ease: easeOut }}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      className="absolute left-1/2 top-full mt-3 hidden w-[min(760px,calc(100vw-2rem))] -translate-x-1/2 origin-top lg:block"
    >
      <div className="glass overflow-hidden rounded-3xl p-2 shadow-soft ring-1 ring-ink-900/[0.06]">
        <div className="grid gap-2 lg:grid-cols-[1fr_240px]">
          <div className="grid gap-1 sm:grid-cols-2">
            {item.children!.map((child) => {
              const meta = serviceMeta[child.href];
              return (
                <Link
                  key={child.href}
                  href={child.href}
                  role="menuitem"
                  className="group flex items-start gap-3 rounded-2xl p-3 transition hover:bg-white/80 focus-energy"
                >
                  <IconTile
                    icon={meta?.icon ?? SquaresFour}
                    tone={meta?.tone ?? "brand"}
                    size="md"
                  />
                  <span className="min-w-0">
                    <span className="flex items-center gap-1.5 font-display text-[15px] font-semibold tracking-[-0.01em] text-ink-950">
                      {child.label}
                      <ArrowUpRight
                        size={12}
                        weight="bold"
                        aria-hidden
                        className="-translate-x-1 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-60"
                      />
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-ink-500">
                      {meta?.desc ?? "Open this service."}
                    </span>
                  </span>
                </Link>
              );
            })}
            <Link
              href={item.href}
              role="menuitem"
              className={cn(
                "col-span-full mt-1 inline-flex items-center justify-between rounded-2xl border border-dashed border-ink-200 px-4 py-2.5 text-xs font-semibold text-ink-600 transition hover:border-royal-300 hover:text-royal-800 focus-energy",
                isActive(item.href) && "text-royal-800"
              )}
            >
              See all 60+ services
              <ArrowRight size={14} weight="bold" aria-hidden />
            </Link>
          </div>

          {/* CTA card */}
          <Link
            href="/dashboard"
            role="menuitem"
            className="grain group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-ink-950 p-5 text-white transition hover:shadow-energy focus-energy"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-energy-gradient opacity-60 blur-2xl transition group-hover:opacity-90"
            />
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/60">
                <span className="brand-dot" aria-hidden /> Already a partner?
              </span>
              <p className="mt-3 font-display text-xl font-semibold leading-tight tracking-[-0.02em]">
                Open the dashboard
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-white/60">
                Wallet, settlements and every service in one place.
              </p>
            </div>
            <span className="relative z-10 mt-6 inline-flex h-9 w-9 items-center justify-center rounded-full bg-white text-ink-950 transition group-hover:bg-accent-400">
              <ArrowUpRight size={16} weight="bold" aria-hidden />
            </span>
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

/* ──────────────────────────────────────────────────────────────────────────
   Mobile full-screen overlay
   ────────────────────────────────────────────────────────────────────────── */
function MobileMenu({
  reduce,
  onClose,
  isActive
}: {
  reduce: boolean;
  onClose: () => void;
  isActive: (href: string) => boolean;
}) {
  const closeRef = React.useRef<HTMLButtonElement>(null);
  React.useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const listVariants = {
    hidden: {},
    show: { transition: { staggerChildren: reduce ? 0 : 0.06, delayChildren: reduce ? 0 : 0.08 } }
  };
  const itemVariants = {
    hidden: { opacity: 0, y: reduce ? 0 : 18 },
    show: { opacity: 1, y: 0, transition: { duration: reduce ? 0 : 0.45, ease: easeOut } }
  };

  return (
    <motion.div
      id="mobile-menu"
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduce ? 0 : 0.25, ease: easeOut }}
      className="grain fixed inset-0 z-[60] flex flex-col overflow-y-auto bg-ink-950 text-white lg:hidden"
    >
      <div
        aria-hidden
        className="aurora-glow pointer-events-none absolute -right-40 -top-40 h-[420px] w-[420px] rounded-full"
      />

      <div className="relative z-10 flex h-16 items-center justify-between px-5 pt-3">
        <Logo size="md" variant="light" />
        <button
          ref={closeRef}
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20 focus-energy active:scale-95"
        >
          <X size={20} weight="bold" aria-hidden />
        </button>
      </div>

      <motion.nav
        aria-label="Primary"
        variants={listVariants}
        initial="hidden"
        animate="show"
        className="relative z-10 flex flex-1 flex-col justify-center px-5 py-10"
      >
        <ul className="space-y-1">
          {mainNav.map((item, i) => {
            const active = isActive(item.href);
            return (
              <motion.li key={item.label} variants={itemVariants}>
                <Link
                  href={item.href}
                  onClick={onClose}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "group flex items-baseline gap-4 rounded-2xl py-2 font-display text-4xl font-semibold tracking-[-0.02em] transition focus-energy sm:text-5xl",
                    active ? "text-white" : "text-white/75 hover:text-white"
                  )}
                >
                  <span className="font-sans text-xs font-semibold tabular-nums text-white/35">
                    0{i + 1}
                  </span>
                  <span className="flex items-center gap-3">
                    {item.label}
                    {active && <span className="brand-dot" aria-hidden />}
                  </span>
                </Link>
                {item.children && (
                  <ul className="mb-3 ml-9 mt-2 flex flex-wrap gap-2">
                    {item.children.map((c) => (
                      <li key={c.href}>
                        <Link
                          href={c.href}
                          onClick={onClose}
                          className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:border-white/40 hover:text-white focus-energy"
                        >
                          {c.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </motion.li>
            );
          })}
        </ul>
      </motion.nav>

      <motion.div
        initial={{ opacity: 0, y: reduce ? 0 : 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: reduce ? 0 : 0.35, duration: reduce ? 0 : 0.4, ease: easeOut }}
        className="relative z-10 border-t border-white/10 px-5 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-5"
      >
        <div className="grid grid-cols-2 gap-2">
          <Link href="/login" onClick={onClose} className="rounded-2xl focus-energy">
            <Button
              variant="outline"
              size="lg"
              tabIndex={-1}
              className="w-full border-white/20 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            >
              Login
            </Button>
          </Link>
          <Link href="/register" onClick={onClose} className="rounded-2xl focus-energy">
            <Button size="lg" tabIndex={-1} className="w-full">
              Start earning
              <ArrowRight size={16} weight="bold" aria-hidden />
            </Button>
          </Link>
        </div>
        <p className="mt-4 text-center text-[11px] text-white/40">
          Free to join · KYC in under five minutes
        </p>
      </motion.div>
    </motion.div>
  );
}
