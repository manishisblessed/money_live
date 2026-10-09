import {
  ArrowDownLeft,
  Bank,
  Check,
  CreditCard,
  DeviceMobile,
  Lightning,
  QrCode,
  SealCheck
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

export type ProductMockVariant = "pg" | "pos" | "qr" | "va";

/**
 * ProductMock — CSS-only product illustrations for /products.
 * No images, no client JS. Each panel is a self-contained "device" or card.
 */
export function ProductMock({
  variant,
  className
}: {
  variant: ProductMockVariant;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={cn(
        "relative isolate flex min-h-[360px] items-center justify-center overflow-hidden rounded-4xl border border-ink-100 bg-ink-50/70 p-6 md:min-h-[440px] md:p-10",
        className
      )}
    >
      <div className="grid-bg pointer-events-none absolute inset-0 opacity-60 mask-fade-y" />
      <div
        className={cn(
          "pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full blur-3xl",
          {
            pg: "bg-brand-300/40",
            pos: "bg-royal-300/40",
            qr: "bg-accent-300/40",
            va: "bg-coral-300/40"
          }[variant]
        )}
      />
      {variant === "pg" && <PgMock />}
      {variant === "pos" && <PosMock />}
      {variant === "qr" && <QrMock />}
      {variant === "va" && <VaMock />}
    </div>
  );
}

/* ── Payment Gateway: hosted checkout ───────────────────────────────────── */
function PgMock() {
  return (
    <div className="relative w-full max-w-sm">
      <div className="rounded-3xl border border-ink-100 bg-white p-5 shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-ink-400">
              Desai Textiles
            </p>
            <p className="text-xs text-ink-500">Order #20312</p>
          </div>
          <p className="font-display text-2xl font-semibold tracking-[-0.02em] text-ink-950">
            ₹12,400
          </p>
        </div>
        <div className="mt-5 grid grid-cols-3 gap-1 rounded-2xl bg-ink-100/70 p-1 text-center text-xs font-semibold">
          <span className="rounded-xl bg-white py-2 text-ink-950 shadow-sm">UPI</span>
          <span className="py-2 text-ink-500">Card</span>
          <span className="py-2 text-ink-500">Net banking</span>
        </div>
        <div className="mt-4 flex items-center gap-3 rounded-2xl border border-ink-200 px-4 py-3">
          <DeviceMobile size={18} weight="duotone" className="text-brand-600" />
          <span className="text-sm text-ink-700">ramesh.k@oksbi</span>
          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-semibold text-accent-700">
            <Check size={12} weight="bold" /> Verified
          </span>
        </div>
        <div className="mt-4 flex h-12 items-center justify-center rounded-2xl bg-energy-gradient text-sm font-semibold text-white shadow-energy-sm">
          Pay ₹12,400
        </div>
        <p className="mt-3 text-center text-[11px] text-ink-400">
          0% MDR on UPI · Settles T+1 to your bank
        </p>
      </div>
      <div className="absolute -right-4 -top-5 flex items-center gap-2 rounded-2xl border border-ink-100 bg-white px-3 py-2 shadow-soft">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent-500 text-white">
          <Check size={14} weight="bold" />
        </span>
        <span className="text-xs">
          <span className="block font-semibold text-ink-950">Paid</span>
          <span className="text-ink-500">in 0.8s</span>
        </span>
      </div>
    </div>
  );
}

/* ── POS Terminal: Android device ───────────────────────────────────────── */
function PosMock() {
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "C", "0", "✓"];
  return (
    <div className="relative">
      <div className="w-60 rounded-[2.25rem] bg-ink-950 p-3 shadow-[0_30px_60px_-20px_rgba(7,11,20,0.5)] ring-1 ring-white/10">
        <div className="rounded-[1.6rem] bg-ink-900 p-4">
          <div className="flex items-center justify-between text-[10px] text-white/40">
            <span>eMoney POS</span>
            <span className="inline-flex items-center gap-1 text-accent-400">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" /> Online
            </span>
          </div>
          <p className="mt-5 text-[10px] uppercase tracking-wider text-white/40">Amount</p>
          <p className="font-display text-3xl font-semibold tracking-[-0.02em] text-white">
            ₹2,350
          </p>
          <p className="mt-1 text-[11px] text-white/50">Tap, insert or scan</p>
          <div className="mt-4 flex gap-1.5">
            {["Card", "UPI", "Tap"].map((m, i) => (
              <span
                key={m}
                className={cn(
                  "rounded-lg px-2 py-1 text-[10px] font-semibold",
                  i === 0 ? "bg-white text-ink-950" : "bg-white/10 text-white/70"
                )}
              >
                {m}
              </span>
            ))}
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-1.5">
          {keys.map((k) => (
            <span
              key={k}
              className={cn(
                "grid h-9 place-items-center rounded-xl text-sm font-semibold",
                k === "✓"
                  ? "bg-accent-500 text-ink-950"
                  : k === "C"
                    ? "bg-coral-500/90 text-white"
                    : "bg-white/10 text-white"
              )}
            >
              {k}
            </span>
          ))}
        </div>
        <div className="mx-auto mt-3 h-8 w-28 rounded-b-xl border-x border-b border-white/10" />
      </div>
      <div className="absolute -right-10 top-10 flex items-center gap-2 rounded-2xl border border-ink-100 bg-white px-3 py-2 shadow-soft">
        <span className="grid h-7 w-7 place-items-center rounded-full bg-royal-600 text-white">
          <CreditCard size={14} weight="duotone" />
        </span>
        <span className="text-xs">
          <span className="block font-semibold text-ink-950">Approved</span>
          <span className="text-ink-500">Visa ···· 4421</span>
        </span>
      </div>
    </div>
  );
}

/* ── QR Collect: branded standee + live alerts ──────────────────────────── */
const QR_PATTERN = [
  "111111101011111111",
  "100000101001000001",
  "101110100101011101",
  "101110111011011101",
  "101110101101011101",
  "100000100111000001",
  "111111101010111111",
  "000000001100000000",
  "110101111010101101",
  "011010010111011010",
  "100110101011000111",
  "000000001101011010",
  "111111100110101001",
  "100000101011010110",
  "101110101110011101",
  "101110100101101010",
  "101110101011100110",
  "100000101100011011"
];

function QrMock() {
  const alerts = [
    { who: "arif.m@paytm", amt: "₹480", t: "now" },
    { who: "sunita@ybl", amt: "₹1,250", t: "2m" },
    { who: "jay.p@okaxis", amt: "₹2,200", t: "9m" }
  ];
  return (
    <div className="relative flex items-center gap-4">
      <div className="rounded-3xl border border-ink-100 bg-white p-4 shadow-soft">
        <div className="flex items-center gap-2">
          <QrCode size={16} weight="duotone" className="text-accent-600" />
          <span className="text-[11px] font-semibold uppercase tracking-wider text-ink-500">
            Scan to pay
          </span>
        </div>
        <div className="mt-3 grid grid-cols-[repeat(18,minmax(0,1fr))] gap-[2px] rounded-xl bg-white p-2 ring-1 ring-ink-100">
          {QR_PATTERN.flatMap((row, r) =>
            row.split("").map((cell, c) => (
              <span
                key={`${r}-${c}`}
                className={cn(
                  "aspect-square w-[7px] rounded-[1.5px] md:w-[9px]",
                  cell === "1" ? "bg-ink-950" : "bg-transparent"
                )}
              />
            ))
          )}
        </div>
        <p className="mt-3 text-center text-[11px] font-medium text-ink-700">
          eMoney.desai@icici
        </p>
        <p className="text-center text-[10px] text-ink-400">Desai Textiles · Counter 1</p>
      </div>
      <ul className="hidden w-48 space-y-2 sm:block">
        {alerts.map((a, i) => (
          <li
            key={a.who}
            className={cn(
              "flex items-center gap-2 rounded-2xl border border-ink-100 bg-white px-3 py-2 shadow-sm",
              i === 0 && "shadow-energy-sm ring-1 ring-accent-200"
            )}
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-accent-50 text-accent-700">
              <ArrowDownLeft size={14} weight="bold" />
            </span>
            <span className="min-w-0 text-xs">
              <span className="block truncate font-semibold text-ink-950">
                {a.amt} received
              </span>
              <span className="block truncate text-ink-500">
                {a.who} · {a.t}
              </span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Virtual Account: account card + credits ────────────────────────────── */
function VaMock() {
  const credits = [
    { from: "Verma Enterprises", mode: "IMPS", amt: "₹15,000" },
    { from: "Patil Traders", mode: "NEFT", amt: "₹8,400" },
    { from: "Khan Mobile Centre", mode: "UPI", amt: "₹2,999" }
  ];
  return (
    <div className="relative w-full max-w-sm">
      <div className="grain relative overflow-hidden rounded-3xl bg-ink-950 p-5 text-white shadow-[0_30px_60px_-20px_rgba(7,11,20,0.5)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-energy-gradient opacity-60 blur-2xl" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-white/50">
              <Bank size={14} weight="duotone" /> Virtual account
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-accent-300">
              <Lightning size={10} weight="fill" /> Instant credit
            </span>
          </div>
          <p className="mt-6 font-display text-xl font-semibold tracking-[0.12em] md:text-2xl">
            EMNY 0098 2231 4471
          </p>
          <div className="mt-4 flex items-end justify-between text-xs">
            <span>
              <span className="block text-white/40">IFSC</span>
              <span className="font-semibold">YESB0CMSNOC</span>
            </span>
            <span className="text-right">
              <span className="block text-white/40">Holder</span>
              <span className="font-semibold">Desai Textiles</span>
            </span>
          </div>
        </div>
      </div>
      <ul className="-mt-4 ml-4 mr-0 space-y-2 rounded-3xl border border-ink-100 bg-white p-3 shadow-soft">
        {credits.map((c, i) => (
          <li
            key={c.from}
            className="flex items-center gap-3 rounded-2xl px-2 py-1.5 text-xs"
          >
            <span
              className={cn(
                "grid h-7 w-7 shrink-0 place-items-center rounded-full",
                i === 0 ? "bg-accent-500 text-white" : "bg-ink-100 text-ink-600"
              )}
            >
              <ArrowDownLeft size={14} weight="bold" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate font-semibold text-ink-950">{c.from}</span>
              <span className="text-ink-500">{c.mode} · auto-reconciled</span>
            </span>
            <span className="font-display text-sm font-semibold text-ink-950">{c.amt}</span>
          </li>
        ))}
        <li className="flex items-center justify-center gap-1.5 pt-1 text-[11px] font-semibold text-accent-700">
          <SealCheck size={12} weight="duotone" /> Wallet updated the second money lands
        </li>
      </ul>
    </div>
  );
}
