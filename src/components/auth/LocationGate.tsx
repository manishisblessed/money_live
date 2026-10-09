"use client";

import { useState, useEffect, useCallback, useRef, type ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  MapPin,
  MapPinArea,
  GpsFix,
  ArrowCounterClockwise,
  ShieldCheck,
  Globe,
} from "@phosphor-icons/react";
import { Button } from "@/components/ui/Button";
import { IconTile } from "@/components/ui/Icon";
import { AuthCard } from "@/components/auth/AuthCard";

export type LocationData = {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
};

type LocationGateProps = {
  children: (location: LocationData) => ReactNode;
};

type GateState =
  | { status: "idle" }
  | { status: "requesting" }
  | { status: "granted"; location: LocationData }
  | { status: "denied"; reason: string }
  | { status: "unavailable" };

const BROWSER_TIMEOUT_MS = 10_000;
const SAFETY_TIMEOUT_MS = 12_000;

async function fetchIpLocation(): Promise<LocationData | null> {
  try {
    const res = await fetch("/api/geo/ip", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    if (typeof data.latitude === "number" && typeof data.longitude === "number") {
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        accuracy: data.accuracy ?? 100_000,
        timestamp: Date.now(),
      };
    }
  } catch { /* swallow */ }
  return null;
}

const ENABLE_STEPS = [
  { title: "Look for the location prompt", body: "It appears near the address bar — tap Allow." },
  { title: "Blocked earlier?", body: "Open your browser's site settings for this page and set Location to Allow." },
  { title: "Try again", body: "Come back here and hit the button below. We only check once per sign-in." },
];

export function LocationGate({ children }: LocationGateProps) {
  const [state, setState] = useState<GateState>({ status: "idle" });
  const resolved = useRef(false);
  const reduce = useReducedMotion();

  const requestLocation = useCallback(() => {
    resolved.current = false;

    if (!navigator.geolocation) {
      // No browser support — go straight to IP fallback
      setState({ status: "requesting" });
      fetchIpLocation().then((loc) => {
        if (loc) {
          resolved.current = true;
          setState({ status: "granted", location: loc });
        } else {
          setState({ status: "unavailable" });
        }
      });
      return;
    }

    setState({ status: "requesting" });

    // Safety-net timer: if the browser API never calls back, use IP fallback
    const safetyTimer = setTimeout(() => {
      if (resolved.current) return;
      fetchIpLocation().then((loc) => {
        if (resolved.current) return;
        resolved.current = true;
        if (loc) {
          setState({ status: "granted", location: loc });
        } else {
          setState({
            status: "denied",
            reason: "Location request timed out. Please try again.",
          });
        }
      });
    }, SAFETY_TIMEOUT_MS);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (resolved.current) return;
        resolved.current = true;
        clearTimeout(safetyTimer);
        setState({
          status: "granted",
          location: {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: position.timestamp,
          },
        });
      },
      (error) => {
        if (resolved.current) return;
        clearTimeout(safetyTimer);

        // On denial/timeout, try IP fallback before giving up
        fetchIpLocation().then((loc) => {
          if (resolved.current) return;
          resolved.current = true;
          if (loc) {
            setState({ status: "granted", location: loc });
          } else {
            let reason = "Location access was denied.";
            if (error.code === error.POSITION_UNAVAILABLE) {
              reason = "Location information is unavailable on this device.";
            } else if (error.code === error.TIMEOUT) {
              reason = "Location request timed out. Please try again.";
            }
            setState({ status: "denied", reason });
          }
        });
      },
      {
        enableHighAccuracy: false,
        timeout: BROWSER_TIMEOUT_MS,
        maximumAge: 120_000,
      },
    );
  }, []);

  useEffect(() => {
    requestLocation();
  }, [requestLocation]);

  if (state.status === "granted") {
    return <>{children(state.location)}</>;
  }

  const pending = state.status === "idle" || state.status === "requesting";

  return (
    <AuthCard className="text-center" aria-busy={pending || undefined}>
      {pending ? (
        <>
          <div className="relative mx-auto grid h-20 w-20 place-items-center">
            {!reduce && (
              <>
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-brand-500/15"
                  animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                />
                <motion.span
                  aria-hidden
                  className="absolute inset-0 rounded-full bg-royal-500/15"
                  animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut", delay: 0.6 }}
                />
              </>
            )}
            <IconTile icon={GpsFix} tone="energy" size="xl" className="relative rounded-3xl" />
          </div>
          <p className="mt-6 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500">
            <span className="brand-dot" aria-hidden />
            Quick security check
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900">
            Confirming your location
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-500">
            Tap <span className="font-semibold text-ink-700">Allow</span> when your browser asks.
            This keeps your shop&apos;s account safe from logins in unexpected places.
          </p>
        </>
      ) : state.status === "unavailable" ? (
        <>
          <IconTile icon={Globe} tone="coral" size="xl" className="mx-auto rounded-3xl" />
          <p className="mt-6 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500">
            <span className="brand-dot" aria-hidden />
            Browser not supported
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900">
            Location isn&apos;t available here
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-500">
            Your browser doesn&apos;t support geolocation. Please open eMoney in a
            modern browser like Chrome, Edge or Safari to sign in.
          </p>
          <Button size="lg" className="mt-6 w-full" onClick={requestLocation}>
            <ArrowCounterClockwise size={16} weight="bold" aria-hidden />
            Try again
          </Button>
        </>
      ) : (
        <>
          <IconTile icon={MapPin} tone="amber" size="xl" className="mx-auto rounded-3xl" />
          <p className="mt-6 flex items-center justify-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-ink-500">
            <span className="brand-dot" aria-hidden />
            One small step
          </p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-[-0.02em] text-ink-900">
            We need your location to continue
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-ink-500" aria-live="polite">
            {state.reason}
          </p>

          <ol className="mt-6 space-y-3 text-left">
            {ENABLE_STEPS.map((s, i) => (
              <li
                key={s.title}
                className="flex items-start gap-3 rounded-2xl bg-[#f6f7fb] p-3.5 ring-1 ring-inset ring-ink-100"
              >
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-energy-gradient font-display text-xs font-semibold text-white shadow-energy-sm">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-ink-900">{s.title}</span>
                  <span className="block text-xs leading-relaxed text-ink-500">{s.body}</span>
                </span>
              </li>
            ))}
          </ol>

          <Button size="lg" className="mt-6 w-full" onClick={requestLocation}>
            <MapPinArea size={16} weight="duotone" aria-hidden />
            I&apos;ve enabled it — try again
          </Button>
        </>
      )}

      <p className="mt-6 flex items-center justify-center gap-2 text-xs text-ink-400">
        <ShieldCheck size={14} weight="duotone" className="text-accent-600" aria-hidden />
        Location verification is mandatory for every sign-in.
      </p>
    </AuthCard>
  );
}
