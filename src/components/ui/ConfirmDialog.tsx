"use client";

import { ReactNode, useEffect, useState } from "react";
import { Question, Warning } from "@phosphor-icons/react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { Input, Label } from "./Input";
import { IconTile } from "./Icon";
import { cn } from "@/lib/utils";

/**
 * Animated replacement for native `confirm()` / `prompt()` dialogs.
 * Pass `input` to collect an optional text value alongside the confirmation.
 *
 * v2 look: tone-tinted IconTile (coral for destructive, brand for info),
 * Clash Display title, and the destructive action uses `Button variant="danger"`.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "danger",
  busy = false,
  input,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: (inputValue: string) => void | Promise<void>;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "danger" | "default";
  busy?: boolean;
  input?: { label: string; placeholder?: string; required?: boolean };
}) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue("");
  }, [open]);

  const danger = tone === "danger";

  return (
    <Modal
      open={open}
      onClose={busy ? () => {} : onClose}
      size="sm"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={busy}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? "danger" : "primary"}
            size="sm"
            isLoading={busy}
            disabled={busy || (input?.required ? !value.trim() : false)}
            onClick={() => onConfirm(value.trim())}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="flex items-start gap-4">
        <span className="relative shrink-0">
          <span
            aria-hidden
            className={cn(
              "absolute inset-0 rounded-2xl blur-lg opacity-50",
              danger ? "bg-coral-200" : "bg-brand-200"
            )}
          />
          <IconTile
            icon={danger ? Warning : Question}
            tone={danger ? "coral" : "brand"}
            size="lg"
            className="relative"
          />
        </span>
        <div className="min-w-0 flex-1 pt-0.5">
          <h3 className="font-display text-lg font-semibold leading-tight tracking-[-0.02em] text-ink-950">
            {title}
          </h3>
          {description && (
            <div className="mt-1.5 text-sm leading-relaxed text-ink-600">{description}</div>
          )}
          {input && (
            <div className="mt-4">
              <Label htmlFor="confirm-dialog-input" className="text-xs font-semibold text-ink-600">
                {input.label}
                {input.required && <span className="ml-0.5 text-coral-500">*</span>}
              </Label>
              <Input
                id="confirm-dialog-input"
                autoFocus
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={input.placeholder}
                disabled={busy}
              />
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
