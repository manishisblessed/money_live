"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Phone, Plus, WhatsappLogo } from "@phosphor-icons/react";
import { Reveal } from "@/components/motion";
import { company, faqs } from "@/lib/data";
import { cn } from "@/lib/utils";
import { SectionHeading } from "./_shared/SectionHeading";

export function FaqSplit() {
  const [open, setOpen] = useState<number | null>(0);
  const baseId = useId();
  const reduce = useReducedMotion();

  const waHref = `https://wa.me/91${company.phone}`;
  const telHref = `tel:+91${company.phone}`;

  return (
    <section id="faq" className="scroll-mt-20 bg-white py-20 md:py-28" aria-labelledby="faq-heading">
      <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <SectionHeading
                eyebrow="Questions"
                title={<span id="faq-heading">Straight answers. No fine print.</span>}
                sub="What shopkeepers ask us before they sign up — answered the way we'd say it across the counter."
              />
            </Reveal>

            <Reveal delay={0.1}>
              <div className="grain relative mt-8 overflow-hidden rounded-3xl bg-ink-950 p-6 text-white md:p-7">
                <div
                  aria-hidden
                  className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-energy-gradient opacity-40 blur-3xl"
                />
                <div className="relative z-10">
                  <p className="font-display text-2xl font-semibold tracking-[-0.02em]">
                    Still stuck? WhatsApp us.
                  </p>
                  <p className="mt-2 text-sm text-white/65">
                    Real humans, 10 AM – 6 PM, Mon – Sat. Hindi, English and 7 more languages.
                  </p>
                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <a
                      href={waHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-shine focus-energy inline-flex h-11 items-center gap-2 rounded-2xl bg-gradient-to-r from-accent-500 to-accent-400 px-5 text-sm font-semibold text-ink-950 shadow-energy-sm transition hover:-translate-y-0.5 hover:shadow-energy"
                    >
                      <WhatsappLogo size={18} weight="duotone" aria-hidden />
                      Chat on WhatsApp
                    </a>
                    <a
                      href={telHref}
                      className="focus-energy inline-flex items-center gap-1.5 rounded-xl text-sm font-semibold text-white/80 hover:text-white"
                    >
                      <Phone size={16} weight="duotone" aria-hidden />
                      +91 {company.phone}
                    </a>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        <div className="lg:col-span-7">
          <ul className="divide-y divide-ink-100 border-y border-ink-100">
            {faqs.map((f, i) => {
              const isOpen = open === i;
              const btnId = `${baseId}-btn-${i}`;
              const panelId = `${baseId}-panel-${i}`;
              return (
                <li key={f.q}>
                  <h3>
                    <button
                      type="button"
                      id={btnId}
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpen(isOpen ? null : i)}
                      className="focus-energy flex w-full items-center justify-between gap-6 rounded-xl py-5 text-left"
                    >
                      <span
                        className={cn(
                          "font-display text-lg font-semibold tracking-[-0.01em] transition-colors md:text-xl",
                          isOpen ? "text-ink-950" : "text-ink-800"
                        )}
                      >
                        {f.q}
                      </span>
                      <motion.span
                        aria-hidden
                        animate={{ rotate: isOpen ? 45 : 0 }}
                        transition={
                          reduce ? { duration: 0 } : { type: "spring", stiffness: 380, damping: 26 }
                        }
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-full border transition-colors",
                          isOpen
                            ? "border-transparent bg-energy-gradient text-white"
                            : "border-ink-200 bg-white text-ink-700"
                        )}
                      >
                        <Plus size={16} weight="bold" />
                      </motion.span>
                    </button>
                  </h3>

                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        id={panelId}
                        role="region"
                        aria-labelledby={btnId}
                        initial={reduce ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={reduce ? undefined : { height: 0, opacity: 0 }}
                        transition={{
                          height: { type: "spring", stiffness: 320, damping: 34 },
                          opacity: { duration: 0.22 }
                        }}
                        className="overflow-hidden"
                      >
                        <p className="pb-6 pr-14 text-base leading-relaxed text-ink-600">{f.a}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
