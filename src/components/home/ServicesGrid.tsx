"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, LayoutGrid } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Container, Section } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Reveal } from "@/components/motion";
import { services, type ServiceItem } from "@/lib/data";
import { cn } from "@/lib/utils";

const easeOut = [0.22, 1, 0.36, 1] as const;

// Premium 4-color system: banking=blue, recharge=green, bills=coral, travel=purple
const categoryStyles: Record<string, { face: string; icon: string; text: string; dot: string }> = {
  banking: {
    face: "from-brand-500/10 to-brand-500/0",
    icon: "from-brand-500 to-brand-700",
    text: "text-brand-700",
    dot: "bg-brand-500"
  },
  recharge: {
    face: "from-accent-500/10 to-accent-500/0",
    icon: "from-accent-500 to-accent-700",
    text: "text-accent-700",
    dot: "bg-accent-500"
  },
  bills: {
    face: "from-coral-400/10 to-coral-400/0",
    icon: "from-coral-400 to-coral-600",
    text: "text-coral-600",
    dot: "bg-coral-500"
  },
  travel: {
    face: "from-royal-500/10 to-royal-500/0",
    icon: "from-royal-500 to-royal-700",
    text: "text-royal-700",
    dot: "bg-royal-500"
  },
  other: {
    face: "from-ink-500/10 to-ink-500/0",
    icon: "from-ink-500 to-ink-700",
    text: "text-ink-700",
    dot: "bg-ink-500"
  }
};

const filters = [
  { id: "all", label: "All services" },
  { id: "banking", label: "Banking" },
  { id: "recharge", label: "Recharges" },
  { id: "bills", label: "Bills & utilities" },
  { id: "travel", label: "Travel" }
] as const;

export function ServicesGrid() {
  const [filter, setFilter] = useState<string>("all");

  const visible = useMemo(
    () => (filter === "all" ? services : services.filter((s) => s.category === filter)),
    [filter]
  );

  return (
    <Section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="grid-bg mask-fade-y absolute inset-0 opacity-40" />
      </div>
      <Container>
        <Reveal>
          <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-xl">
              <span className="eyebrow mb-4">
                <LayoutGrid className="h-3.5 w-3.5" /> The service catalogue
              </span>
              <h2 className="heading-lg">
                Everything your customers need.{" "}
                <span className="gradient-text">Nothing you don&apos;t.</span>
              </h2>
              <p className="lead mt-4">
                Filter by what you want to sell. Each service is RBI-compliant, pre-integrated
                and ready to earn from the minute you switch it on.
              </p>
            </div>
            <p className="shrink-0 font-display text-sm font-semibold text-ink-500">
              <span className="text-3xl font-bold text-ink-900">{services.length}</span> live
              services
            </p>
          </div>
        </Reveal>

        {/* Filter chips */}
        <Reveal direction="up" delay={0.05} className="mt-8 flex flex-wrap gap-2">
          {filters.map((f) => {
            const a = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={cn(
                  "relative rounded-full px-4 py-2 text-sm font-semibold transition-colors duration-300",
                  a ? "text-white" : "text-ink-600 hover:text-ink-900"
                )}
              >
                {a && (
                  <motion.span
                    layoutId="serviceFilter"
                    transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-royal-600 via-brand-600 to-accent-500 shadow-soft"
                  />
                )}
                <span className={cn(!a && "rounded-full")}>{f.label}</span>
              </button>
            );
          })}
        </Reveal>

        {/* Bento grid */}
        <motion.div
          layout
          className="mt-8 grid auto-rows-[minmax(0,1fr)] grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4"
        >
          <AnimatePresence mode="popLayout">
            {visible.map((s) => (
              <ServiceCard key={s.slug} service={s} featured={!!s.badge} />
            ))}
          </AnimatePresence>
        </motion.div>

        <Reveal direction="up" delay={0.1} className="mt-10 flex justify-center">
          <Link href="/services">
            <Button variant="outline">
              Browse the full catalogue <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Reveal>
      </Container>
    </Section>
  );
}

function ServiceCard({ service: s, featured }: { service: ServiceItem; featured: boolean }) {
  const Icon = s.icon;
  const style = categoryStyles[s.category];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3, ease: easeOut }}
      className={cn(featured && "col-span-2 row-span-1")}
    >
      <Link
        href={s.href}
        className={cn(
          "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-ink-100 bg-white p-5 transition-all duration-300 ease-out hover:-translate-y-1.5 hover:border-royal-200 hover:shadow-soft",
          featured && "md:p-6"
        )}
      >
        <div
          className={cn(
            "absolute inset-0 -z-10 bg-gradient-to-br opacity-0 transition-opacity duration-500 group-hover:opacity-100",
            style.face
          )}
        />
        <div className="flex items-start justify-between">
          <span
            className={cn(
              "grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br text-white transition-transform duration-500 group-hover:scale-110 group-hover:-rotate-3",
              style.icon
            )}
          >
            <Icon className="h-5 w-5" />
          </span>
          {s.badge && (
            <span className="rounded-full bg-gradient-to-r from-royal-600 to-coral-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white shadow-sm">
              {s.badge}
            </span>
          )}
        </div>

        <h3
          className={cn(
            "mt-4 font-display font-semibold text-ink-900 transition-colors duration-300 group-hover:text-brand-700",
            featured ? "text-lg" : "text-base"
          )}
        >
          {s.title}
        </h3>
        <p className={cn("mt-1 text-sm text-ink-500", featured ? "line-clamp-3" : "line-clamp-2")}>
          {s.description}
        </p>

        <div className="mt-auto flex items-center justify-between pt-4">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-ink-400">
            <span className={cn("h-1.5 w-1.5 rounded-full", style.dot)} />
            {s.category}
          </span>
          <span
            className={cn(
              "inline-flex translate-x-[-4px] items-center gap-1 text-xs font-semibold opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100",
              style.text
            )}
          >
            Open <ArrowRight className="h-3 w-3" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
