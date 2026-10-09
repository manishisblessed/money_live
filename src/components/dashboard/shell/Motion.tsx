"use client";

import * as React from "react";
import { motion, useReducedMotion, type Variants } from "framer-motion";

/**
 * Stagger-in primitives for dashboard overview cards.
 *
 * `<Stagger>` is the parent container; every direct `<StaggerItem>` fades and
 * lifts in with a small cascading delay. Respects `prefers-reduced-motion` —
 * when reduced motion is requested nothing animates and children render in
 * their final position immediately.
 */
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.06, delayChildren: 0.04 },
  },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 14, scale: 0.985 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.45, ease: EASE },
  },
};

const ReducedContext = React.createContext(false);

export function Stagger({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "section" | "ul";
}) {
  const reduce = useReducedMotion() ?? false;
  const Comp = as === "ul" ? motion.ul : as === "section" ? motion.section : motion.div;
  return (
    <ReducedContext.Provider value={reduce}>
      <Comp
        className={className}
        variants={reduce ? undefined : containerVariants}
        initial={reduce ? false : "hidden"}
        animate="show"
      >
        {children}
      </Comp>
    </ReducedContext.Provider>
  );
}

export function StaggerItem({
  children,
  className,
  as = "div",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "div" | "li";
}) {
  const reduce = React.useContext(ReducedContext);
  const Comp = as === "li" ? motion.li : motion.div;
  return (
    <Comp className={className} variants={reduce ? undefined : itemVariants}>
      {children}
    </Comp>
  );
}

/** Single element fade/lift — for one-off blocks outside a Stagger. */
export function FadeIn({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? 0 : 0.45, ease: EASE, delay: reduce ? 0 : delay }}
    >
      {children}
    </motion.div>
  );
}
