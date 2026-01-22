"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import clsx from "clsx";
import { AuthShell } from "@/src/components/AuthShell";
import { Button } from "@/src/components/ui";

type Role = "driver" | "rider";

export default function HomePage() {
  const [role, setRole] = useState<Role>("driver");

  // You can tweak these later if you want different copy per role
  const subtitle =
    role === "driver"
      ? "Collect loyalty points, referral bonuses, and unlock ride discounts every time you share your commute."
      : "Book safe, affordable rides in seconds and earn rewards on every trip.";

  // When you create real routes, just change these hrefs
  const createHref = role === "driver" ? "/driver/signup" : "/rider/signup";
  const loginHref = role === "driver" ? "/driver/login" : "/rider/login";

  return (
    <AuthShell>
      <div className="flex flex-col items-center text-center">
        {/* ROLE TABS (Driver / Rider) */}
        <div className="mt-6 flex w-full max-w-xs items-center justify-center">
          <div className="flex w-full justify-center gap-14 border-b border-slate-200 pb-2 text-sm font-medium text-slate-400">
            <button
              type="button"
              onClick={() => setRole("driver")}
              className={clsx(
                "relative pb-2 transition-colors",
                role === "driver" && "text-slate-900"
              )}
            >
              Driver
              <span
                className={clsx(
                  "pointer-events-none absolute inset-x-0 -bottom-1 mx-auto h-0.5 w-10 rounded-full bg-blue-600 transition-opacity",
                  role === "driver" ? "opacity-100" : "opacity-0"
                )}
              />
            </button>

            <button
              type="button"
              onClick={() => setRole("rider")}
              className={clsx(
                "relative pb-2 transition-colors",
                role === "rider" && "text-slate-900"
              )}
            >
              Rider
              <span
                className={clsx(
                  "pointer-events-none absolute inset-x-0 -bottom-1 mx-auto h-0.5 w-10 rounded-full bg-blue-600 transition-opacity",
                  role === "rider" ? "opacity-100" : "opacity-0"
                )}
              />
            </button>
          </div>
        </div>

        {/* PHONE HERO */}
        <div className="flex w-full max-w-md flex-col items-center pt-6">
          <div className="relative flex h-40 w-full items-end justify-center">
            {/* soft glow behind phone */}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute bottom-2 h-32 w-32 rounded-full bg-slate-100/90 blur-3xl"
            />
            <Image
              src="/phone2.png"
              alt="Our Common Commute app preview"
              width={260}
              height={260}
              className="relative h-[150px] w-auto drop-shadow-[0_18px_40px_rgba(15,23,42,0.45)]"
              priority
            />
          </div>

          {/* HEADING + SUBTITLE */}
          <div className="mt-6 flex flex-col items-center gap-3">
            <h1 className="text-[22px] font-semibold text-slate-900 sm:text-2xl">
              Drive together. Thrive together
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-slate-500">
              {subtitle}
            </p>
          </div>

          {/* PRIMARY ACTIONS */}
          <div className="mt-5 flex w-full max-w-md flex-col gap-3">
            <Link href={createHref} className="w-full">
              <Button className="w-full py-2.5 text-sm">
                Create an account
              </Button>
            </Link>
            <Link href={loginHref} className="w-full">
              <Button variant="secondary" className="w-full py-2.5 text-sm">
                Login
              </Button>
            </Link>
          </div>
        </div>

        {/* TERMS TEXT */}
        <p className="mt-3 max-w-md text-[11px] leading-relaxed text-slate-400">
          By continuing, you agree to Our Common Commute{" "}
          <Link
            href="/terms"
            className="text-blue-600 underline hover:text-blue-700"
          >
            Terms &amp; Conditions
          </Link>{" "}
          and{" "}
          <Link
            href="/privacy"
            className="text-blue-600 underline hover:text-blue-700"
          >
            Privacy Policy
          </Link>
          .
        </p>
      </div>
    </AuthShell>
  );
}
