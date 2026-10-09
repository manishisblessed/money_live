"use client";

import { Suspense, useState, useEffect, useCallback, useRef } from "react";
import { useSession } from "next-auth/react";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Topbar } from "@/components/dashboard/Topbar";
import { TwoFactorSetupModal } from "@/components/dashboard/TwoFactorSetupModal";
import { ReKycGate } from "@/components/dashboard/ReKycGate";
import { SliderSurface } from "@/components/dashboard/sliders/SliderSurface";
import { SchemeGateBanner } from "@/components/dashboard/SchemeGateBanner";
import { NavigationProgress } from "@/components/dashboard/NavigationProgress";
import { PageTransition } from "@/components/motion/PageTransition";
import { DashboardShellSkeleton } from "@/components/ui/Skeleton";
import { StepUpProvider } from "@/components/security/StepUpProvider";
import { AdminActivityTracker } from "@/components/security/AdminActivityTracker";
import { cn } from "@/lib/utils";

const SIDEBAR_KEY = "ngp-sidebar-collapsed";

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { data: session, status, update } = useSession({ required: true });
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  // Whether we've re-validated a "2FA appears off" session against the server.
  const [twoFAChecked, setTwoFAChecked] = useState(false);
  const revalidatingRef = useRef(false);

  useEffect(() => {
    const stored = localStorage.getItem(SIDEBAR_KEY);
    if (stored === "true") setCollapsed(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(SIDEBAR_KEY, String(next));
      return next;
    });
  }, []);

  const twoFactorEnabled = session?.user?.twoFactorEnabled === true;
  // A master-admin may exempt an account from the mandatory-2FA gate and let it
  // log in with a transaction PIN instead. Such users must never see the setup modal.
  const twoFactorExempt = session?.user?.twoFactorExempt === true;

  // A stale JWT (e.g. minted before the user enabled 2FA, or a session cookie
  // that hasn't picked up the current DB value yet) can report
  // twoFactorEnabled=false even though 2FA is actually active. Before forcing
  // the *mandatory* setup modal, refresh the session from the server once so we
  // never nag a user who has already completed 2FA. Only after this re-check
  // still reports it off do we treat setup as required.
  useEffect(() => {
    if (status !== "authenticated") return;
    if (twoFactorEnabled || twoFactorExempt) {
      setTwoFAChecked(true);
      return;
    }
    if (!twoFAChecked && !revalidatingRef.current) {
      revalidatingRef.current = true;
      Promise.resolve(update()).finally(() => {
        revalidatingRef.current = false;
        setTwoFAChecked(true);
      });
    }
  }, [status, twoFactorEnabled, twoFAChecked, update]);

  const needs2FASetup =
    status === "authenticated" && twoFAChecked && !twoFactorEnabled && !twoFactorExempt;

  if (status === "loading") {
    return <DashboardShellSkeleton />;
  }

  return (
    <StepUpProvider>
    <AdminActivityTracker />
    <div className="min-h-screen bg-[#f6f7fb] text-ink-900">
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          className: "font-sans",
          duration: 4500,
        }}
      />
      <Suspense fallback={null}>
        <NavigationProgress />
      </Suspense>
      <Sidebar open={open} onClose={() => setOpen(false)} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
      {/* Sidebar is fixed on desktop — this wrapper carries the matching left
          offset and eases it alongside the rail's width animation. */}
      <div
        className={cn(
          "flex min-h-screen min-w-0 flex-col transition-[padding-left] duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none",
          collapsed ? "lg:pl-[76px]" : "lg:pl-[272px]"
        )}
      >
        <Topbar onOpenSidebar={() => setOpen(true)} collapsed={collapsed} onToggleCollapse={toggleCollapsed} />
        <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
          <div className="mx-auto w-full min-w-0 max-w-[1440px]">
            <SliderSurface />
            <SchemeGateBanner />
            <PageTransition>{children}</PageTransition>
          </div>
        </main>
      </div>

      {needs2FASetup && <TwoFactorSetupModal />}
      {twoFactorEnabled && <ReKycGate />}
    </div>
    </StepUpProvider>
  );
}
