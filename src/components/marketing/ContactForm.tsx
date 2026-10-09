"use client";

import * as React from "react";
import { ArrowRight, Check, PaperPlaneTilt } from "@phosphor-icons/react";
import { FloatingInput, Label, Select } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { company } from "@/lib/data";
import { cn } from "@/lib/utils";

const topics = [
  "Become an agent",
  "Distributor partnership",
  "Help with a transaction",
  "Payment gateway, POS or QR",
  "Press & media",
  "Something else"
];

type FormState = {
  name: string;
  phone: string;
  email: string;
  topic: string;
  message: string;
};

const initial: FormState = {
  name: "",
  phone: "",
  email: "",
  topic: topics[0],
  message: ""
};

/**
 * ContactForm — no backend exists for this form yet, so submission opens the
 * visitor's mail client with a pre-filled message to support (mailto fallback).
 */
export function ContactForm({ className }: { className?: string }) {
  const [form, setForm] = React.useState<FormState>(initial);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});
  const [sent, setSent] = React.useState(false);

  const update =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      setForm((f) => ({ ...f, [key]: e.target.value }));
      if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }));
    };

  function validate(): boolean {
    const next: typeof errors = {};
    if (form.name.trim().length < 2) next.name = "Tell us your name.";
    const phone = form.phone.replace(/\s|-/g, "");
    if (!/^(\+91)?[6-9]\d{9}$/.test(phone)) next.phone = "Enter a 10-digit Indian mobile number.";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      next.email = "That email doesn't look right.";
    }
    if (form.message.trim().length < 10) next.message = "A line or two helps us route this to the right person.";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!validate()) return;
    const subject = encodeURIComponent(`[${form.topic}] ${form.name}`);
    const body = encodeURIComponent(
      `${form.message.trim()}\n\n— ${form.name}\nPhone: ${form.phone}${form.email ? `\nEmail: ${form.email}` : ""}`
    );
    window.location.href = `mailto:${company.email}?subject=${subject}&body=${body}`;
    setSent(true);
  }

  if (sent) {
    return (
      <div
        role="status"
        className={cn(
          "flex h-full flex-col items-start justify-center gap-4 rounded-3xl border border-accent-200 bg-accent-50/60 p-8",
          className
        )}
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-500 text-white shadow-energy-sm">
          <Check size={22} weight="bold" aria-hidden />
        </span>
        <p className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink-950">
          Your mail app should be open.
        </p>
        <p className="text-sm text-ink-600">
          If it didn&rsquo;t open, write to{" "}
          <a href={`mailto:${company.email}`} className="font-semibold text-royal-700 hover:underline">
            {company.email}
          </a>{" "}
          or call +91 {company.phone}. We reply within one working day.
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setForm(initial);
            setSent(false);
          }}
        >
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className={cn("rounded-3xl border border-ink-100 bg-white p-6 shadow-sm md:p-8", className)}
    >
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-royal-50 text-royal-700 ring-1 ring-inset ring-royal-100">
          <PaperPlaneTilt size={20} weight="duotone" aria-hidden />
        </span>
        <div>
          <h2 className="font-display text-xl font-semibold tracking-[-0.02em] text-ink-950">
            Send us a message
          </h2>
          <p className="text-xs text-ink-500">We reply within one working day.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <FloatingInput
          label="Your name"
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={update("name")}
          error={errors.name}
          required
        />
        <FloatingInput
          label="Mobile number"
          name="phone"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          value={form.phone}
          onChange={update("phone")}
          error={errors.phone}
          required
        />
        <FloatingInput
          label="Email (optional)"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          value={form.email}
          onChange={update("email")}
          error={errors.email}
          className="sm:col-span-2"
        />
        <div className="sm:col-span-2">
          <Label htmlFor="contact-topic">What is this about?</Label>
          <div className="relative">
            <Select
              id="contact-topic"
              name="topic"
              value={form.topic}
              onChange={update("topic")}
              className="h-14 pr-10"
            >
              {topics.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
            <span
              aria-hidden
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-ink-400"
            >
              ▾
            </span>
          </div>
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="contact-message">Your message</Label>
          <textarea
            id="contact-message"
            name="message"
            rows={5}
            value={form.message}
            onChange={update("message")}
            placeholder="Tell us about your shop, your question or the transaction you need help with."
            aria-invalid={Boolean(errors.message) || undefined}
            aria-describedby={errors.message ? "contact-message-error" : undefined}
            className={cn(
              "flex w-full rounded-2xl border bg-white px-4 py-3 text-sm text-ink-900 shadow-sm placeholder:text-ink-400",
              "transition-[border-color,box-shadow] duration-200 ease-out focus:outline-none",
              errors.message
                ? "border-coral-300 focus:border-coral-500 focus:shadow-[0_0_0_4px_rgba(244,63,94,0.15)]"
                : "border-ink-200 focus:border-brand-400 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.14),0_8px_24px_-10px_rgba(244,63,94,0.25)]"
            )}
          />
          {errors.message && (
            <p id="contact-message-error" className="mt-1.5 text-xs text-coral-600">
              {errors.message}
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-[11px] leading-relaxed text-ink-500">
          By sending, you agree to our{" "}
          <a href="/legal/privacy" className="underline-offset-2 hover:text-ink-900 hover:underline">
            privacy policy
          </a>
          . We never share your number.
        </p>
        <Button type="submit" size="lg" className="shrink-0">
          Send message
          <ArrowRight size={16} weight="bold" aria-hidden />
        </Button>
      </div>
    </form>
  );
}
