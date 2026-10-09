import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type UplineChainNode = {
  role: string;
  name: string;
  userCode?: string | null;
};

const ROLE_ABBR: Record<string, string> = {
  RETAILER: "RT",
  DISTRIBUTOR: "DT",
  MASTER_DISTRIBUTOR: "MD",
  SUPER_DISTRIBUTOR: "SD",
};

/** v2 tone per role — duotone chip (tinted fill + bold hue text + inset ring). */
const ROLE_TONE: Record<string, { chip: string; abbr: string }> = {
  DISTRIBUTOR: {
    chip: "bg-brand-50 text-brand-800 ring-brand-100",
    abbr: "bg-brand-600 text-white",
  },
  MASTER_DISTRIBUTOR: {
    chip: "bg-royal-50 text-royal-800 ring-royal-100",
    abbr: "bg-royal-600 text-white",
  },
  SUPER_DISTRIBUTOR: {
    chip: "bg-amber-50 text-amber-800 ring-amber-100",
    abbr: "bg-amber-500 text-white",
  },
  RETAILER: {
    chip: "bg-ink-100 text-ink-700 ring-ink-200/70",
    abbr: "bg-ink-700 text-white",
  },
};
const DEFAULT_TONE = ROLE_TONE.RETAILER;

/**
 * Renders a user's upline as breadcrumb chips, nearest parent first
 * (e.g. DT · Kiran › MD · Suresh › SD · Ramesh). Falls back to an em-dash
 * when the user has no upline (e.g. a top-level Super Distributor).
 */
export function UplineChain({ nodes }: { nodes: UplineChainNode[] }) {
  if (!nodes || nodes.length === 0) {
    return <span className="text-ink-400">—</span>;
  }

  return (
    <div className="flex flex-wrap items-center gap-1 text-xs">
      {nodes.map((n, i) => {
        const tone = ROLE_TONE[n.role] ?? DEFAULT_TONE;
        return (
          <span key={n.userCode ?? `${n.role}-${i}`} className="inline-flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3 w-3 text-ink-300" aria-hidden />}
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-lg py-0.5 pl-0.5 pr-2 font-medium ring-1 ring-inset",
                tone.chip
              )}
              title={n.userCode ? `${n.name} (${n.userCode})` : n.name}
            >
              <span
                className={cn(
                  "inline-flex h-4 min-w-[1.5rem] items-center justify-center rounded-md px-1 text-[9px] font-bold tracking-wide",
                  tone.abbr
                )}
              >
                {ROLE_ABBR[n.role] ?? n.role}
              </span>
              <span className="max-w-[120px] truncate">{n.name}</span>
            </span>
          </span>
        );
      })}
    </div>
  );
}
