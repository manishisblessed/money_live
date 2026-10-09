"use client";

import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  Bank,
  ChartLineUp,
  Coins,
  Crown,
  Fingerprint,
  Headset,
  Monitor,
  QrCode,
  SealCheck,
  Target,
  TreeStructure,
  UsersThree,
  type Icon
} from "@phosphor-icons/react";
import { Badge } from "@/components/ui/Badge";
import { IconTile, type IconTone } from "@/components/ui/Icon";
import { Reveal } from "@/components/motion";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./_shared/ButtonLink";
import { SectionHeading } from "./_shared/SectionHeading";

type Bullet = { icon: Icon; tone: IconTone; title: string; copy: string };
type MockRow = { label: string; value: string; pct: number };
type Role = {
  key: string;
  label: string;
  headline: string;
  sub: string;
  bullets: Bullet[];
  mock: { title: string; value: string; sub: string; rows: MockRow[] };
  cta: { label: string; href: string };
};

const ROLES: Role[] = [
  {
    key: "retailer",
    label: "Retailer",
    headline: "Your counter, now a bank branch.",
    sub: "Serve cash, transfers and bills to the customers already walking in.",
    bullets: [
      {
        icon: Fingerprint,
        tone: "brand",
        title: "Cash withdrawal with a thumb",
        copy: "AePS pays up to ₹6 per withdrawal. Customers come back daily."
      },
      {
        icon: Coins,
        tone: "accent",
        title: "Commission in seconds",
        copy: "Every success credits your wallet instantly. Withdraw 24x7."
      },
      {
        icon: Headset,
        tone: "royal",
        title: "Help in your language",
        copy: "Priority WhatsApp support in 9 languages, 7 days a week."
      }
    ],
    mock: {
      title: "Today at Yadav Mobile",
      value: "₹2,184",
      sub: "commission · 63 transactions",
      rows: [
        { label: "AePS withdrawals", value: "₹1,120 · 24", pct: 86 },
        { label: "Send Money", value: "₹640 · 18", pct: 52 },
        { label: "Bills & recharges", value: "₹424 · 21", pct: 34 }
      ]
    },
    cta: { label: "Become a retailer", href: "/register" }
  },
  {
    key: "distributor",
    label: "Distributor",
    headline: "Earn on every shop you bring on.",
    sub: "Onboard the retailers around you. Their transactions pay you a slice — every day.",
    bullets: [
      {
        icon: UsersThree,
        tone: "brand",
        title: "Onboard from your phone",
        copy: "Add a retailer in minutes. KYC and activation handled for you."
      },
      {
        icon: TreeStructure,
        tone: "royal",
        title: "Override commissions",
        copy: "Set slabs per retailer. You earn the difference automatically."
      },
      {
        icon: ChartLineUp,
        tone: "accent",
        title: "Network dashboard",
        copy: "See who's active, who's slowing down, and where to push."
      }
    ],
    mock: {
      title: "Your network · this month",
      value: "₹48,600",
      sub: "override earnings · 42 retailers",
      rows: [
        { label: "Active retailers", value: "38 of 42", pct: 90 },
        { label: "New this month", value: "6", pct: 30 },
        { label: "Top shop · Pillai Super Store", value: "₹6,200", pct: 64 }
      ]
    },
    cta: { label: "Talk to sales", href: "/contact" }
  },
  {
    key: "master",
    label: "Master Distributor",
    headline: "Run a district, not a shop.",
    sub: "Appoint distributors, set their slabs, and earn on every rupee flowing beneath you.",
    bullets: [
      {
        icon: Crown,
        tone: "amber",
        title: "Three-tier earnings",
        copy: "Retailer → distributor → you. Every level pays upward."
      },
      {
        icon: Target,
        tone: "coral",
        title: "Launch schemes",
        copy: "Commission schemes by region or service, live in one click."
      },
      {
        icon: SealCheck,
        tone: "royal",
        title: "White-label ready",
        copy: "Your brand on the app, your name on every receipt."
      }
    ],
    mock: {
      title: "Region · Uttar Pradesh West",
      value: "₹3.4 L",
      sub: "network commission · September",
      rows: [
        { label: "Distributors", value: "12", pct: 48 },
        { label: "Retailers", value: "480", pct: 80 },
        { label: "Monthly volume", value: "₹8.1 Cr", pct: 72 }
      ]
    },
    cta: { label: "Apply as master distributor", href: "/contact" }
  },
  {
    key: "merchant",
    label: "Merchant",
    headline: "Get paid any way they want to pay.",
    sub: "QR, POS, payment links — money settles into your bank the next morning.",
    bullets: [
      {
        icon: QrCode,
        tone: "brand",
        title: "Your own QR",
        copy: "Static or dynamic. Every payment pings your phone."
      },
      {
        icon: Monitor,
        tone: "royal",
        title: "POS on rent",
        copy: "₹499 a month. Cards, tap, UPI — nothing to buy."
      },
      {
        icon: Bank,
        tone: "accent",
        title: "Next-day settlement",
        copy: "T+1 to your bank. Reports you can hand straight to your CA."
      }
    ],
    mock: {
      title: "Settlement · Patel Jewellers",
      value: "₹1,45,000",
      sub: "settles tomorrow, 9:00 AM",
      rows: [
        { label: "Card", value: "₹86,500", pct: 60 },
        { label: "UPI", value: "₹52,600", pct: 36 },
        { label: "EMI", value: "₹5,900", pct: 8 }
      ]
    },
    cta: { label: "Get a QR or POS", href: "/register" }
  }
];

const easeOut = [0.22, 1, 0.36, 1] as const;

export function ForEveryRole() {
  const reduce = useReducedMotion();
  const [active, setActive] = useState(ROLES[0].key);
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const role = ROLES.find((r) => r.key === active) ?? ROLES[0];

  const onKeyDown = (e: React.KeyboardEvent, i: number) => {
    const dir = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!dir) return;
    e.preventDefault();
    const next = (i + dir + ROLES.length) % ROLES.length;
    setActive(ROLES[next].key);
    tabRefs.current[next]?.focus();
  };

  return (
    <section className="bg-white py-20 md:py-28" aria-labelledby="roles-heading">
      <div className="container-x">
        <Reveal>
          <SectionHeading
            align="center"
            eyebrow="Built for every role"
            title={<span id="roles-heading">Whatever you run, eMoney pays you for it.</span>}
            sub="Pick your seat. The platform reshapes itself around how you earn."
          />
        </Reveal>

        <Reveal delay={0.1} className="mt-10 flex justify-center">
          <div
            role="tablist"
            aria-label="Choose your role"
            className="inline-flex max-w-full flex-wrap justify-center gap-1 rounded-full border border-ink-200 bg-white p-1.5 shadow-sm"
          >
            {ROLES.map((r, i) => {
              const on = r.key === active;
              return (
                <button
                  key={r.key}
                  ref={(el) => {
                    tabRefs.current[i] = el;
                  }}
                  type="button"
                  role="tab"
                  id={`role-tab-${r.key}`}
                  aria-selected={on}
                  aria-controls={`role-panel-${r.key}`}
                  tabIndex={on ? 0 : -1}
                  onClick={() => setActive(r.key)}
                  onKeyDown={(e) => onKeyDown(e, i)}
                  className={cn(
                    "focus-energy relative whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                    on ? "text-royal-900" : "text-ink-600 hover:text-ink-900"
                  )}
                >
                  {on && (
                    <motion.span
                      layoutId="role-tab-pill"
                      className="pill-active absolute inset-0 rounded-full"
                      transition={
                        reduce ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 34 }
                      }
                      aria-hidden
                    />
                  )}
                  <span className="relative z-10">{r.label}</span>
                </button>
              );
            })}
          </div>
        </Reveal>

        <div className="mt-12 md:mt-16">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={role.key}
              role="tabpanel"
              id={`role-panel-${role.key}`}
              aria-labelledby={`role-tab-${role.key}`}
              initial={reduce ? false : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduce ? undefined : { opacity: 0, y: -14 }}
              transition={{ duration: 0.32, ease: easeOut }}
              className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16"
            >
              <div>
                <h3 className="font-display text-3xl font-semibold leading-[1.05] tracking-[-0.02em] text-ink-950 md:text-4xl">
                  {role.headline}
                </h3>
                <p className="mt-4 max-w-lg text-base text-ink-600 md:text-lg">{role.sub}</p>

                <ul className="mt-8 space-y-5">
                  {role.bullets.map((b) => (
                    <li key={b.title} className="flex gap-4">
                      <IconTile icon={b.icon} tone={b.tone} size="lg" />
                      <div>
                        <p className="font-semibold text-ink-900">{b.title}</p>
                        <p className="mt-0.5 text-sm text-ink-500">{b.copy}</p>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="mt-9">
                  <ButtonLink href={role.cta.href} size="lg">
                    {role.cta.label}
                    <ArrowRight size={16} weight="bold" aria-hidden />
                  </ButtonLink>
                </div>
              </div>

              <div className="relative rounded-4xl bg-[#f6f7fb] p-5 sm:p-8 md:p-10">
                <div
                  aria-hidden
                  className="absolute inset-0 -z-0 rounded-4xl bg-gradient-to-br from-royal-100/60 via-transparent to-coral-100/60"
                />
                <MockCard mock={role.mock} reduce={!!reduce} />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}

function MockCard({ mock, reduce }: { mock: Role["mock"]; reduce: boolean }) {
  return (
    <div className="relative rounded-3xl border border-ink-100 bg-white p-5 shadow-energy-sm md:p-6">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-500">
          {mock.title}
        </p>
        <Badge variant="success" dot size="sm">
          Live
        </Badge>
      </div>
      <p className="mt-3 font-display text-4xl font-semibold tabular-nums tracking-[-0.02em] text-ink-950 md:text-5xl">
        {mock.value}
      </p>
      <p className="mt-1 text-sm text-ink-500">{mock.sub}</p>

      <ul className="mt-6 space-y-4">
        {mock.rows.map((r, i) => (
          <li key={r.label}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="text-ink-600">{r.label}</span>
              <span className="font-semibold tabular-nums text-ink-900">{r.value}</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink-100">
              <motion.div
                className="h-full rounded-full bg-energy-gradient-x"
                initial={{ width: reduce ? `${r.pct}%` : 0 }}
                animate={{ width: `${r.pct}%` }}
                transition={{ duration: 0.7, delay: 0.1 + i * 0.08, ease: easeOut }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
