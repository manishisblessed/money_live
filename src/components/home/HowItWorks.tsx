"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import {
  ArrowRight,
  Coins,
  IdentificationCard,
  Timer,
  UserPlus,
  Wallet,
  type Icon
} from "@phosphor-icons/react";
import { Reveal } from "@/components/motion";
import { cn } from "@/lib/utils";
import { ButtonLink } from "./_shared/ButtonLink";
import { SectionHeading } from "./_shared/SectionHeading";

type Step = {
  n: string;
  title: string;
  copy: string;
  icon: Icon;
  grad: string;
};

const STEPS: Step[] = [
  {
    n: "01",
    title: "Sign up in 5 minutes",
    copy: "Your mobile number, PAN and shop name. Nothing to print, nothing to courier.",
    icon: UserPlus,
    grad: "from-royal-500 to-brand-600"
  },
  {
    n: "02",
    title: "Finish KYC",
    copy: "Aadhaar OTP plus a selfie. Verified the same day — usually within the hour.",
    icon: IdentificationCard,
    grad: "from-brand-500 to-accent-500"
  },
  {
    n: "03",
    title: "Add funds",
    copy: "Top up your wallet by UPI or IMPS. Start with ₹2,000 — your float, your pace.",
    icon: Wallet,
    grad: "from-accent-500 to-brand-500"
  },
  {
    n: "04",
    title: "Start earning",
    copy: "First AePS withdrawal, first commission. Paisa lands in your wallet instantly.",
    icon: Coins,
    grad: "from-coral-500 to-royal-600"
  }
];

export function HowItWorks() {
  const reduce = useReducedMotion();
  const trackRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: trackRef,
    offset: ["start 0.75", "end 0.55"]
  });
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.4 });

  return (
    <section
      id="how-it-works"
      className="scroll-mt-20 bg-[#f6f7fb] py-20 md:py-28"
      aria-labelledby="hiw-heading"
    >
      <div className="container-x grid gap-12 lg:grid-cols-12 lg:gap-16">
        {/* Sticky intro */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <Reveal>
              <SectionHeading
                eyebrow="How it works"
                title={<span id="hiw-heading">Signup to first commission. Same day.</span>}
                sub="Four steps. No office visit. No file of photocopies. Most shops take their first payment before closing time."
              />
            </Reveal>

            <Reveal delay={0.1}>
              <div className="mt-8 flex items-center gap-4 rounded-3xl border border-ink-100 bg-white p-5 shadow-sm">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-energy-gradient text-white shadow-energy-sm">
                  <Timer size={24} weight="duotone" aria-hidden />
                </span>
                <div>
                  <p className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink-950">
                    4h 12m
                  </p>
                  <p className="text-sm text-ink-500">average time from signup to first transaction</p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="mt-6">
                <ButtonLink href="/register" size="lg">
                  Open your counter
                  <ArrowRight size={16} weight="bold" aria-hidden />
                </ButtonLink>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Timeline */}
        <div ref={trackRef} className="relative lg:col-span-7">
          <div
            aria-hidden
            className="absolute bottom-8 left-[27px] top-8 w-0.5 rounded-full bg-ink-200 md:left-[31px]"
          />
          <motion.div
            aria-hidden
            style={{ scaleY: reduce ? 1 : progress, transformOrigin: "top" }}
            className="absolute bottom-8 left-[27px] top-8 w-0.5 rounded-full bg-energy-gradient md:left-[31px]"
          />

          <ol className="space-y-8 md:space-y-10">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.05} amount={0.4} as="li">
                <div className="grid grid-cols-[56px_1fr] gap-5 md:grid-cols-[64px_1fr] md:gap-7">
                  <span
                    className={cn(
                      "relative z-10 grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br text-white shadow-energy-sm ring-4 ring-[#f6f7fb] md:h-16 md:w-16",
                      step.grad
                    )}
                  >
                    <step.icon size={26} weight="duotone" aria-hidden />
                  </span>

                  <div className="relative overflow-hidden rounded-3xl border border-ink-100 bg-white p-6 shadow-sm md:p-7">
                    <span
                      aria-hidden
                      className="pointer-events-none absolute -right-2 -top-4 font-display text-7xl font-semibold leading-none tracking-[-0.04em] text-ink-100 md:text-8xl"
                    >
                      {step.n}
                    </span>
                    <p className="relative text-xs font-semibold uppercase tracking-[0.14em] text-royal-600">
                      Step {step.n}
                    </p>
                    <h3 className="relative mt-2 font-display text-2xl font-semibold tracking-[-0.02em] text-ink-950 md:text-3xl">
                      {step.title}
                    </h3>
                    <p className="relative mt-2 max-w-md text-base leading-relaxed text-ink-600">
                      {step.copy}
                    </p>
                  </div>
                </div>
              </Reveal>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
