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
};

export function AuthShell({ children, variant = "car" }: AuthShellProps) {
  const bgSrc = variant === "car" ? "/loginbg.jpg" : "/Rectangle.png";
  const overlayClass =
    variant === "car" ? "bg-black/55" : "bg-slate-900/60";

  return (
    <div className="relative min-h-screen flex items-center justify-center">
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

      {/* Center card */}
      <div className="relative z-10 w-full max-w-xl rounded-3xl bg-white px-10 py-10 shadow-2xl">
        {children}
      </div>
    </div>
  );
}
