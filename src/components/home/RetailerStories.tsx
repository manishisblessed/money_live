"use client";

import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type PanInfo
} from "framer-motion";
import { CaretLeft, CaretRight, MapPin, Star, Storefront } from "@phosphor-icons/react";
import { Reveal } from "@/components/motion";
import { testimonials, type Testimonial } from "@/lib/data";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./_shared/SectionHeading";

/** Shop-type chip per storyteller (data.ts `Testimonial` has no such field). */
const SHOP_TYPE: Record<string, string> = {
  "Lakhan Yadav": "Mobile shop",
  "Suresh Pillai": "Kirana store",
  "Fatima Shaikh": "Aadhaar Seva Kendra",
  "Jatin Bhatia": "POS merchant",
  "Meenakshi Rao": "Travel agent"
};

function splitRole(role: string) {
  const i = role.lastIndexOf(",");
  if (i === -1) return { shop: role, city: "" };
  return { shop: role.slice(0, i).trim(), city: role.slice(i + 1).trim() };
}

export function RetailerStories() {
  const reduce = useReducedMotion();
  const viewportRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const [index, setIndex] = useState(0);
  const [bounds, setBounds] = useState({ max: 0, step: 1 });

  useEffect(() => {
    const vp = viewportRef.current;
    const tr = trackRef.current;
    if (!vp || !tr) return;

    const measure = () => {
      const first = tr.children[0] as HTMLElement | undefined;
      const second = tr.children[1] as HTMLElement | undefined;
      const step =
        first && second ? second.offsetLeft - first.offsetLeft : (first?.offsetWidth ?? 1);
      const max = Math.max(0, tr.scrollWidth - vp.clientWidth);
      setBounds({ max, step: Math.max(1, step) });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(vp);
    return () => ro.disconnect();
  }, []);

  const lastIndex = testimonials.length - 1;

  const goTo = (i: number) => {
    const clamped = Math.max(0, Math.min(i, lastIndex));
    const target = -Math.min(clamped * bounds.step, bounds.max);
    setIndex(clamped);
    animate(x, target, reduce ? { duration: 0 } : { type: "spring", stiffness: 260, damping: 32 });
  };

  const onDragEnd = (_: unknown, info: PanInfo) => {
    const projected = x.get() + info.velocity.x * 0.18;
    goTo(Math.round(-projected / bounds.step));
  };

  return (
    <section
      className="overflow-hidden bg-[#f6f7fb] py-20 md:py-28"
      aria-labelledby="stories-heading"
    >
      <div className="container-x">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <Reveal>
            <SectionHeading
              eyebrow="Retailer stories"
              title={<span id="stories-heading">Real counters. Real numbers.</span>}
              sub="No stock photos, no vague praise. Shopkeepers on what they earn and which service does it."
            />
          </Reveal>

          <Reveal delay={0.1} className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label="Previous story"
              className="focus-energy grid h-11 w-11 place-items-center rounded-full border border-ink-200 bg-white text-ink-700 transition hover:border-ink-300 hover:text-ink-950 disabled:opacity-40"
            >
              <CaretLeft size={18} weight="bold" aria-hidden />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index >= lastIndex}
              aria-label="Next story"
              className="focus-energy grid h-11 w-11 place-items-center rounded-full border border-ink-200 bg-white text-ink-700 transition hover:border-ink-300 hover:text-ink-950 disabled:opacity-40"
            >
              <CaretRight size={18} weight="bold" aria-hidden />
            </button>
          </Reveal>
        </div>

        <div ref={viewportRef} className="mt-10">
          <motion.div
            ref={trackRef}
            drag="x"
            dragConstraints={{ left: -bounds.max, right: 0 }}
            dragElastic={0.08}
            onDragEnd={onDragEnd}
            style={{ x }}
            className="flex cursor-grab gap-5 active:cursor-grabbing"
            aria-roledescription="carousel"
            aria-label="Retailer stories"
          >
            {testimonials.map((t, i) => (
              <StoryCard key={t.name} t={t} index={i} />
            ))}
          </motion.div>
        </div>

        <div className="mt-8 flex items-center gap-2" role="group" aria-label="Choose a story">
          {testimonials.map((t, i) => (
            <button
              key={t.name}
              type="button"
              aria-label={`Story ${i + 1}: ${t.name}`}
              aria-current={i === index || undefined}
              onClick={() => goTo(i)}
              className={cn(
                "focus-energy h-2 rounded-full transition-all",
                i === index ? "w-8 bg-energy-gradient-x" : "w-2 bg-ink-300 hover:bg-ink-400"
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function StoryCard({ t, index }: { t: Testimonial; index: number }) {
  const { shop, city } = splitRole(t.role);
  return (
    <article
      className="flex w-[85vw] max-w-[440px] shrink-0 select-none flex-col rounded-3xl border border-ink-100 bg-white p-7 shadow-sm transition-shadow hover:shadow-energy-sm sm:w-[440px]"
      aria-label={`Story ${index + 1} of ${testimonials.length}`}
    >
      <div className="flex items-start justify-between">
        <span
          aria-hidden
          className="gradient-text font-display text-7xl font-semibold leading-[0.7]"
        >
          “
        </span>
        <div className="flex items-center gap-0.5" aria-label={`${t.rating} out of 5 stars`}>
          {Array.from({ length: t.rating }).map((_, i) => (
            <Star key={i} size={14} weight="fill" className="text-amber-400" aria-hidden />
          ))}
        </div>
      </div>

      <blockquote className="mt-5 flex-1">
        <p className="font-display text-xl font-medium leading-snug tracking-[-0.01em] text-ink-900 md:text-2xl">
          {t.quote}
        </p>
      </blockquote>

      <footer className="mt-7">
        <p className="font-semibold text-ink-950">{t.name}</p>
        <p className="text-sm text-ink-500">{shop}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          {city && (
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700 ring-1 ring-inset ring-brand-100">
              <MapPin size={12} weight="duotone" aria-hidden />
              {city}
            </span>
          )}
          <span className="inline-flex items-center gap-1 rounded-full bg-royal-50 px-2.5 py-1 text-xs font-semibold text-royal-700 ring-1 ring-inset ring-royal-100">
            <Storefront size={12} weight="duotone" aria-hidden />
            {SHOP_TYPE[t.name] ?? "Retailer"}
          </span>
        </div>
      </footer>
    </article>
  );
}
