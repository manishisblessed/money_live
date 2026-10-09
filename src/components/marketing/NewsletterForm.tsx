"use client";

import * as React from "react";
import { ArrowRight, Check } from "@phosphor-icons/react";
import { FloatingInput } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/**
 * Footer newsletter capture. UI only — there is no mailing backend yet, so a
 * valid entry flips into a confirmation state locally.
 */
export function NewsletterForm({ className }: { className?: string }) {
  const [value, setValue] = React.useState("");
  const [error, setError] = React.useState<string | undefined>();
  const [done, setDone] = React.useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const v = value.trim();
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    const isPhone = /^(\+91[\s-]?)?[6-9]\d{9}$/.test(v.replace(/\s/g, ""));
    if (!isEmail && !isPhone) {
      setError("Enter a 10-digit WhatsApp number or an email.");
      return;
    }
    setError(undefined);
    setDone(true);
  }

  if (done) {
    return (
      <div
        role="status"
        className={cn(
          "flex items-center gap-3 rounded-2xl border border-accent-400/30 bg-accent-500/10 px-4 py-3 text-sm text-accent-200",
          className
        )}
      >
        <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-500 text-ink-950">
          <Check size={14} weight="bold" aria-hidden />
        </span>
        Noted. The next briefing lands in your inbox or WhatsApp.
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn("flex w-full flex-col gap-2 sm:flex-row sm:items-start", className)}
    >
      <FloatingInput
        label="Your WhatsApp or email"
        name="contact"
        autoComplete="email"
        inputMode="email"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          if (error) setError(undefined);
        }}
        error={error}
        className="flex-1 [&_input]:border-white/10 [&_input]:bg-white/[0.06] [&_input]:text-white [&_input]:shadow-none [&_input:focus]:border-white/30 [&_label]:text-white/50 [&_p]:text-coral-300"
      />
      <Button type="submit" size="lg" className="h-14 shrink-0 sm:px-6">
        Get the briefing
        <ArrowRight size={16} weight="bold" aria-hidden />
      </Button>
    </form>
  );
}
