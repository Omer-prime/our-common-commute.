"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { apiFetch, type ApiFail } from "@/src/lib/api";

type Role = "DRIVER" | "RIDER" | "ADMIN";

type MeRes = {
  user: { id: string; email: string; fullName: string; role: Role } | null;
};

type OnboardingStatusRes = {
  step: number;
  completed: boolean;
  nextPath: string;
};

export function DriverProtected({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const me = await apiFetch<MeRes>("/me", { method: "GET" });

        if (!alive) return;

        if (!me.user) {
          router.replace(`/driver/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        if (me.user.role !== "DRIVER") {
          router.replace("/");
          return;
        }

        // Block dashboard until onboarding completed
        const status = await apiFetch<OnboardingStatusRes>("/driver/onboarding/status", {
          method: "GET",
        });

        if (!alive) return;

        const isOnboardingRoute = pathname.startsWith("/driver/onboarding");

        if (!status.completed && !isOnboardingRoute) {
          router.replace(status.nextPath);
          return;
        }

        setReady(true);
      } catch (e) {
        const err = e as ApiFail;
        if (err.status === 401) {
          router.replace(`/driver/login?next=${encodeURIComponent(pathname)}`);
          return;
        }
        router.replace("/driver/login");
      }
    })();

    return () => {
      alive = false;
    };
  }, [router, pathname]);

  if (!ready) return null;
  return <>{children}</>;
}
