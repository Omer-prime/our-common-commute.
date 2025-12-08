"use client";

import Image from "next/image";
import { ReactNode } from "react";
import clsx from "clsx";

type AuthShellProps = {
  children: ReactNode;
  /**
   * car  = street + blue car background
   * pattern = purple scribble pattern background
   */
  variant?: "car" | "pattern";
  /** 
   * default = old small card (for signup etc.)
   * wide    = big, wide card (for new login layout)
   */
  layout?: "default" | "wide";
};

export function AuthShell({
  children,
  variant = "car",
  layout = "default",
}: AuthShellProps) {
  const bgSrc = variant === "car" ? "/loginbg.jpg" : "/Rectangle.png";
  const overlayClass =
    variant === "car" ? "bg-black/55" : "bg-slate-900/60";

  const cardClass = clsx(
    "relative z-10 w-full rounded-3xl bg-white shadow-2xl",
    layout === "wide"
      ? "max-w-5xl overflow-hidden" // NEW wide card for login
      : "max-w-xl px-10 py-10" // old behavior (signup, etc.)
  );

  return (
    <div className="relative flex min-h-screen items-center justify-center">
      {/* Background image */}
      <Image
        src={bgSrc}
        alt="Background"
        fill
        priority
        className="object-cover"
      />

      {/* Slight dark overlay */}
      <div className={clsx("absolute inset-0", overlayClass)} />

      {/* Center card (size depends on layout) */}
      <div className={cardClass}>{children}</div>
    </div>
  );
}
