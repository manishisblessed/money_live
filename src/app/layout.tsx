import type { Metadata } from "next";
import { AuthProvider } from "@/components/providers/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "eMoney — Payment Gateway, POS & QR Payments",
    template: "%s · eMoney"
  },
  description:
    "eMoney is a next-generation fintech distribution platform offering payment gateway, POS machines, QR collections, AePS, money transfer, recharges and bill payments for retailers and merchants across India.",
  keywords: [
    "eMoney",
    "emoney.today",
    "payment gateway",
    "POS machine",
    "QR payments",
    "UPI",
    "AePS",
    "money transfer",
    "DMT",
    "recharge",
    "bill payment",
    "fintech India",
    "agent banking"
  ],
  metadataBase: new URL("https://emoney.today"),
  openGraph: {
    title: "eMoney — Payment Gateway, POS & QR Payments",
    description:
      "Payment gateway, POS machines, QR collections and 60+ digital services for retailers, distributors and merchants.",
    url: "https://emoney.today",
    siteName: "eMoney",
    type: "website"
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/eMoney_logo.png" }]
  }
};

export default function RootLayout({
  children
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      {/*
        eMoney brand typography:
        · Clash Display → display / headlines (--font-display)
        · Satoshi       → body / UI (--font-sans)
        Loaded from Fontshare CDN (OFL, no self-hosting required).
        Keep `preconnect` first for fastest LCP.
      */}
      <head>
        <link rel="preconnect" href="https://api.fontshare.com" crossOrigin="" />
        <link rel="preconnect" href="https://cdn.fontshare.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://api.fontshare.com/v2/css?f[]=clash-display@600,700,500&f[]=satoshi@400,500,700,900&display=swap"
        />
      </head>
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
