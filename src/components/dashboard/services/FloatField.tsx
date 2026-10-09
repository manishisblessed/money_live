"use client";

import * as React from "react";
import { FloatingInput, type FloatingInputProps } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

/**
 * FloatField — `FloatingInput` for controlled service forms.
 *
 * The primitive floats its label from `onChange`, so a value set
 * programmatically (quick-amount chips, post-payment resets, auto-filled IFSC)
 * would leave the label sitting on top of the text. These CSS-only sibling
 * selectors key the float state off the real `:placeholder-shown` state of the
 * input (the primitive renders `placeholder=" "`), so both directions stay in
 * sync without touching the shared component.
 */
const FLOAT_SYNC = [
  // value present → floated
  "[&>input:not(:placeholder-shown)+label]:top-1.5",
  "[&>input:not(:placeholder-shown)+label]:translate-y-0",
  "[&>input:not(:placeholder-shown)+label]:scale-[0.78]",
  "[&>input:not(:placeholder-shown)+label]:text-[11px]",
  "[&>input:not(:placeholder-shown)+label]:font-semibold",
  "[&>input:not(:placeholder-shown)+label]:uppercase",
  "[&>input:not(:placeholder-shown)+label]:tracking-wide",
  // empty + unfocused → resting
  "[&>input:placeholder-shown:not(:focus)+label]:top-1/2",
  "[&>input:placeholder-shown:not(:focus)+label]:-translate-y-1/2",
  "[&>input:placeholder-shown:not(:focus)+label]:scale-100",
  "[&>input:placeholder-shown:not(:focus)+label]:text-sm",
  "[&>input:placeholder-shown:not(:focus)+label]:font-normal",
  "[&>input:placeholder-shown:not(:focus)+label]:normal-case",
  "[&>input:placeholder-shown:not(:focus)+label]:tracking-normal",
].join(" ");

export interface FloatFieldProps extends FloatingInputProps {
  /** Big Clash Display numerals — use for amount fields. */
  display?: boolean;
  /** Monospace value — ids, account numbers, IFSC, UTR. */
  mono?: boolean;
}

export const FloatField = React.forwardRef<HTMLInputElement, FloatFieldProps>(
  ({ className, display, mono, ...props }, ref) => (
    <FloatingInput
      ref={ref}
      className={cn(
        FLOAT_SYNC,
        display && "[&>input]:font-display [&>input]:text-lg [&>input]:font-semibold [&>input]:tabular-nums",
        mono && "[&>input]:font-mono [&>input]:tracking-wide",
        className
      )}
      {...props}
    />
  )
);
FloatField.displayName = "FloatField";
