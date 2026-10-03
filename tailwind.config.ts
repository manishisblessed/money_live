import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx,js,jsx,mdx}"],
  darkMode: "class",
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
        xl: "2.5rem"
      },
      screens: {
        "2xl": "1280px"
      }
    },
    extend: {
      colors: {
        // Brand = eMoney primary blue (matches logo "e" mark)
        brand: {
          50: "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e40af",
          900: "#1e3a8a",
          950: "#0b1f52"
        },
        // Accent = eMoney growth green (matches rising arrow)
        accent: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
          800: "#166534",
          900: "#14532d",
          950: "#052e16"
        },
        // Royal = premium purple (innovation / white-label personas)
        royal: {
          50: "#f5f3ff",
          100: "#ede9fe",
          200: "#ddd6fe",
          300: "#c4b5fd",
          400: "#a78bfa",
          500: "#8b5cf6",
          600: "#7c3aed",
          700: "#6d28d9",
          800: "#5b21b6",
          900: "#4c1d95",
          950: "#2e1065"
        },
        // Coral = warm light-red (energy / highlights / alerts)
        coral: {
          50: "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          300: "#fda4af",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
          800: "#9f1239",
          900: "#881337",
          950: "#4c0519"
        },
        ink: {
          50: "#f5f7fa",
          100: "#eaeef4",
          200: "#cfd7e3",
          300: "#a4b3c8",
          400: "#7388a6",
          500: "#516a8c",
          600: "#3f5473",
          700: "#34445d",
          800: "#2e3a4f",
          900: "#0e1626",
          950: "#070b14"
        }
      },
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "sans-serif"
        ],
        display: [
          "var(--font-display)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ]
      },
      backgroundImage: {
        // eMoney premium mesh: purple → blue → green → coral
        "hero-radial":
          "radial-gradient(42% 55% at 18% 12%, rgba(124,58,237,0.20) 0%, rgba(124,58,237,0) 60%), radial-gradient(40% 50% at 82% 20%, rgba(37,99,235,0.18) 0%, rgba(37,99,235,0) 60%), radial-gradient(45% 55% at 25% 100%, rgba(34,197,94,0.16) 0%, rgba(34,197,94,0) 60%), radial-gradient(40% 50% at 90% 95%, rgba(251,113,133,0.14) 0%, rgba(251,113,133,0) 60%)",
        "grid-pattern":
          "linear-gradient(to right, rgba(15,23,42,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(15,23,42,0.06) 1px, transparent 1px)",
        // Primary premium gradient: purple → blue → green → coral
        "brand-gradient":
          "linear-gradient(120deg, #7c3aed 0%, #2563eb 38%, #22c55e 72%, #fb7185 100%)",
        "aurora-gradient":
          "conic-gradient(from 140deg at 50% 50%, #7c3aed 0deg, #2563eb 95deg, #22c55e 205deg, #fb7185 300deg, #7c3aed 360deg)"
      },
      boxShadow: {
        soft: "0 10px 30px -12px rgba(15,23,42,0.18)",
        glow: "0 20px 50px -12px rgba(124,58,237,0.40)",
        "glow-brand": "0 20px 50px -12px rgba(37,99,235,0.45)",
        "glow-coral": "0 20px 50px -12px rgba(244,63,94,0.40)"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        marquee: {
          "0%": { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" }
        },
        "float-slow": {
          "0%, 100%": { transform: "translate(0,0) rotate(0deg)" },
          "50%": { transform: "translate(20px,-30px) rotate(8deg)" }
        },
        spin3d: {
          "0%": { transform: "rotateY(0deg)" },
          "100%": { transform: "rotateY(360deg)" }
        },
        "pulse-ring": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(2.2)", opacity: "0" }
        },
        "gradient-x": {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" }
        },
        "scroll-y": {
          "0%": { transform: "translateY(0)" },
          "100%": { transform: "translateY(-50%)" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.6s ease-out both",
        marquee: "marquee 30s linear infinite",
        shimmer: "shimmer 2.4s linear infinite",
        float: "float 6s ease-in-out infinite",
        "float-slow": "float-slow 12s ease-in-out infinite",
        spin3d: "spin3d 20s linear infinite",
        "pulse-ring": "pulse-ring 2.4s ease-out infinite",
        "gradient-x": "gradient-x 8s ease infinite",
        "scroll-y": "scroll-y 40s linear infinite"
      }
    }
  },
  plugins: []
};

export default config;
