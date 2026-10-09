import {
  Airplane,
  Bank,
  Bed,
  Bus,
  CreditCard,
  Drop,
  Fingerprint,
  Flame,
  GraduationCap,
  Lightbulb,
  Monitor,
  PaperPlaneTilt,
  QrCode,
  Receipt,
  ShieldCheck,
  DeviceMobile,
  Television,
  Wallet,
  WifiHigh,
  Scan,
  type Icon
} from "@phosphor-icons/react";
import type { IconTone } from "@/components/ui/Icon";

/**
 * Phosphor duotone glyph per service slug. `data.ts` stays on lucide for the
 * dashboard; the public home page maps slugs here so the silhouette is
 * unmistakably eMoney.
 */
export const serviceIconBySlug: Record<string, Icon> = {
  "payment-gateway": CreditCard,
  pos: Monitor,
  "qr-payments": QrCode,
  "aadhaar-pay": Fingerprint,
  "money-transfer": PaperPlaneTilt,
  upi: Scan,
  wallet: Wallet,
  "virtual-account": Bank,
  "credit-card": CreditCard,
  "mobile-recharge": DeviceMobile,
  dth: Television,
  broadband: WifiHigh,
  electricity: Lightbulb,
  water: Drop,
  gas: Flame,
  flight: Airplane,
  hotel: Bed,
  bus: Bus,
  education: GraduationCap,
  insurance: ShieldCheck,
  "broadband-bill": Receipt
};

export const serviceToneByCategory: Record<string, IconTone> = {
  banking: "brand",
  recharge: "royal",
  bills: "accent",
  travel: "coral",
  other: "ink"
};

export function iconForService(slug: string): Icon {
  return serviceIconBySlug[slug] ?? Receipt;
}
