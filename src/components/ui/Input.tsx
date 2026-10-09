"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Emoney Input — Phase 1 redesign.
 *
 * Shape language that differentiates from Nextgen:
 *  · Larger corners (`rounded-2xl`) and a slightly taller resting height.
 *  · Replaces the hard blue focus ring with the signature purple-coral energy
 *    glow + an animated gradient underline that draws in from the left.
 *  · Fully backward-compatible: the default `<Input />` call keeps the same
 *    `h-11 rounded-xl`-equivalent footprint and continues to accept native
 *    input props.
 *  · For greenfield forms, use the new `<FloatingInput />` which pairs a
 *    label that smoothly rises above the field on focus / when filled —
 *    this is the single biggest "Emoney vs Nextgen" tell on data entry.
 */
export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type = "text", ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-ink-200 bg-white px-4 py-2 text-sm text-ink-900 shadow-sm",
        "transition-[border-color,box-shadow] duration-200 ease-out",
        "placeholder:text-ink-400",
        "focus:border-brand-400 focus:outline-none",
        "focus:shadow-[0_0_0_4px_rgba(124,58,237,0.14),0_8px_24px_-10px_rgba(244,63,94,0.25)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Label = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className, ...props }, ref) => (
  <label
    ref={ref}
    className={cn(
      "mb-1.5 block text-sm font-medium text-ink-800",
      className
    )}
    {...props}
  />
));
Label.displayName = "Label";

export const Select = React.forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, children, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "flex h-11 w-full appearance-none truncate rounded-2xl border border-ink-200 bg-white px-4 py-2 text-sm text-ink-900 shadow-sm",
      "transition-[border-color,box-shadow] duration-200 ease-out",
      "focus:border-brand-400 focus:outline-none",
      "focus:shadow-[0_0_0_4px_rgba(124,58,237,0.14),0_8px_24px_-10px_rgba(244,63,94,0.25)]",
      className
    )}
    {...props}
  >
    {children}
  </select>
));
Select.displayName = "Select";

/* ──────────────────────────────────────────────────────────────────────
   FloatingInput — Emoney's signature labelled input.
   Label floats up on focus or when the field has a value, and a gradient
   underline draws in from the left. Use for marketing/auth forms where
   polish matters more than density.
   ────────────────────────────────────────────────────────────────────── */
export interface FloatingInputProps extends InputProps {
  label: string;
  /** Optional helper text under the field. */
  hint?: string;
  /** Error message replaces the hint and tints the field coral. */
  error?: string;
}

export const FloatingInput = React.forwardRef<
  HTMLInputElement,
  FloatingInputProps
>(({ className, label, hint, error, id, onFocus, onBlur, onChange, value, defaultValue, ...props }, ref) => {
  const reactId = React.useId();
  const inputId = id ?? `fi-${reactId}`;
  const [focused, setFocused] = React.useState(false);
  const [hasValue, setHasValue] = React.useState(
    () => Boolean(value) || Boolean(defaultValue)
  );

  const floated = focused || hasValue;

  return (
    <div className={cn("group relative", className)}>
      <input
        ref={ref}
        id={inputId}
        placeholder=" " /* keep placeholder empty so :placeholder-shown works */
        value={value}
        defaultValue={defaultValue}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        onChange={(e) => {
          setHasValue(e.target.value.length > 0);
          onChange?.(e);
        }}
        className={cn(
          "peer flex h-14 w-full rounded-2xl border bg-white px-4 pt-5 pb-1.5 text-sm text-ink-900 shadow-sm",
          "transition-[border-color,box-shadow] duration-200 ease-out",
          "focus:outline-none",
          error
            ? "border-coral-300 focus:border-coral-500 focus:shadow-[0_0_0_4px_rgba(244,63,94,0.15)]"
            : "border-ink-200 focus:border-brand-400 focus:shadow-[0_0_0_4px_rgba(124,58,237,0.14),0_8px_24px_-10px_rgba(244,63,94,0.25)]",
          "disabled:cursor-not-allowed disabled:opacity-50"
        )}
        {...props}
      />
      <label
        htmlFor={inputId}
        className={cn(
          "pointer-events-none absolute left-4 origin-left select-none text-ink-500",
          "transition-[transform,color,font-size] duration-200 ease-out",
          floated
            ? "top-1.5 scale-[0.78] font-semibold tracking-wide uppercase text-[11px]"
            : "top-1/2 -translate-y-1/2 text-sm",
          error ? "text-coral-600" : floated && "text-brand-700"
        )}
      >
        {label}
      </label>
      {/* Gradient underline — draws in from left on focus */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-x-4 bottom-[7px] h-0.5 origin-left rounded-full",
          "bg-energy-gradient-x",
          "transition-transform duration-300 ease-out",
          focused ? "scale-x-100" : "scale-x-0"
        )}
      />
      {(hint || error) && (
        <p
          className={cn(
            "mt-1.5 text-xs",
            error ? "text-coral-600" : "text-ink-500"
          )}
        >
          {error ?? hint}
        </p>
      )}
    </div>
  );
});
FloatingInput.displayName = "FloatingInput";
