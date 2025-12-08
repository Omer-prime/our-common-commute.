// src/components/rider-home/PrimaryCTAs.tsx
"use client";

import React from "react";
import { Button } from "../ui";

type PrimaryCTAsProps = {
  onOpenFareModal: () => void;
};

export function PrimaryCTAs({ onOpenFareModal }: PrimaryCTAsProps) {
  return (
    <div className="mt-1 space-y-2">
      <Button
        type="button"
        onClick={onOpenFareModal}
        className="h-11 w-full rounded-lg bg-[#0B63F4] text-sm font-semibold shadow-[0_18px_40px_rgba(0,0,0,0.5)] hover:bg-[#1a74ff]"
      >
        Get estimate
      </Button>
      <Button
        type="button"
        className="h-11 w-full rounded-lg border border-[#233358] bg-[#121d38] text-sm font-semibold text-slate-200 hover:bg-[#172444]"
      >
        Schedule ride
      </Button>
    </div>
  );
}
