import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "eMoney — Payment Gateway, POS & QR Payments";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 80,
          // eMoney gradient — blue → teal → green
          background:
            "radial-gradient(60% 80% at 20% 20%, rgba(30,136,229,0.45) 0%, rgba(30,136,229,0) 60%), radial-gradient(50% 60% at 100% 100%, rgba(34,197,94,0.4) 0%, rgba(34,197,94,0) 60%), linear-gradient(135deg, #0b1f52 0%, #0f3a63 50%, #0b3b2a 100%)",
          color: "white",
          fontFamily: "system-ui, sans-serif"
        }}
      >
        {/* Top: logo lockup — gradient "e" mark + wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <svg width="86" height="86" viewBox="0 0 48 48" fill="none">
            <defs>
              <linearGradient id="og-mark" x1="4" y1="4" x2="44" y2="44" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="55%" stopColor="#2DD4BF" />
                <stop offset="100%" stopColor="#4ADE80" />
              </linearGradient>
            </defs>
            <circle cx="24" cy="24" r="22" fill="url(#og-mark)" />
            <path
              d="M34 29c-2 3.2-5.6 5.3-9.7 5.3-6.3 0-11.3-5-11.3-11.3s5-11.3 11.3-11.3c6.2 0 11.2 4.9 11.3 11 0 .7-.6 1.3-1.3 1.3H17.5"
              fill="none"
              stroke="#ffffff"
              strokeWidth="3.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <div style={{ fontSize: 56, fontWeight: 800, letterSpacing: -1 }}>
            eMoney
          </div>
        </div>

        {/* Middle headline */}
        <div style={{ display: "flex", flexDirection: "column", maxWidth: 920 }}>
          <div
            style={{
              fontSize: 80,
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: -2
            }}
          >
            Powering Payments for a{" "}
            <span
              style={{
                background:
                  "linear-gradient(90deg, #38BDF8 0%, #4ADE80 100%)",
                backgroundClip: "text",
                color: "transparent"
              }}
            >
              Digital Bharat
            </span>
          </div>
          <div
            style={{
              marginTop: 24,
              fontSize: 26,
              color: "rgba(255,255,255,0.82)",
              maxWidth: 880,
              lineHeight: 1.4
            }}
          >
            Payment gateway, POS machines, QR collections, AePS, money
            transfer, recharges and bill payments — in one dashboard.
          </div>
        </div>

        {/* Bottom strip */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: 28,
            borderTop: "1px solid rgba(255,255,255,0.15)",
            color: "rgba(255,255,255,0.75)",
            fontSize: 20
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontWeight: 600 }}>emoney.today</span>
            <span>·</span>
            <span>support@emoney.today</span>
          </div>
          <div style={{ display: "flex", gap: 18 }}>
            {["PG", "POS", "QR", "AePS", "DMT", "BBPS"].map((tag) => (
              <span
                key={tag}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  background: "rgba(255,255,255,0.14)",
                  border: "1px solid rgba(255,255,255,0.22)",
                  fontSize: 18,
                  fontWeight: 600
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
