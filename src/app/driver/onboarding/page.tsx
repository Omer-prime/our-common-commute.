"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { apiFetch, type ApiFail } from "@/src/lib/api";

type OnboardingStatusRes = {
  step: number;
  completed: boolean;
  nextPath: string;
};

export default function DriverOnboardingIndexPage() {
  const router = useRouter();

  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const res = await apiFetch<OnboardingStatusRes>("/driver/onboarding/status", {
          method: "GET",
        });

        if (!alive) return;
        router.replace(res.nextPath);
      } catch (e) {
        const err = e as ApiFail;
        // not logged in / token expired
        if (err.status === 401) router.replace("/driver/login");
        else router.replace("/driver/login");
      }
    })();

    return () => {
      alive = false;
    };
  }, [router]);

  return null;
}
