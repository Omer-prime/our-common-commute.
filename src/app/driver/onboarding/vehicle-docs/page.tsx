"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DriverOnboardingStep } from "@/src/components/DriverOnboardingStep";
import { Button } from "@/src/components/ui";
import { getAuth } from "@/src/lib/authStorage";
import { API_URL } from "@/src/lib/api";

function UploadRow({
  label,
  file,
  onPick
}: {
  label: string;
  file: File | null;
  onPick: (f: File | null) => void;
}) {
  return (
    <label className="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100">
      <span className="px-3 text-center">
        {file ? file.name : label}
      </span>
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onPick(e.target.files?.[0] ?? null)}
      />
    </label>
  );
}

export default function VehicleDocsPage() {
  const router = useRouter();
  const [license, setLicense] = useState<File | null>(null);
  const [insurance, setInsurance] = useState<File | null>(null);
  const [vehicleImage, setVehicleImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

  async function onProceed() {
    setErr("");
    const auth = getAuth();
    if (!auth?.accessToken) return setErr("You are not logged in.");

    if (!license || !insurance || !vehicleImage) {
      return setErr("Please upload all three vehicle documents.");
    }

    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("license", license);
      fd.append("insurance", insurance);
      fd.append("vehicleImage", vehicleImage);

      const res = await fetch(`${API_URL}/driver/onboarding/vehicle-docs`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.accessToken}` },
        body: fd
      });

      const data = await res.json();
      if (!res.ok) throw data;

      router.push(data.nextPath);
    } catch (e: any) {
      setErr(e?.message || e?.error || "Upload failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DriverOnboardingStep
      step={4}
      totalSteps={9}
      title="Vehicle Documents"
      subtitle="A clear, valid license and docs are required to drive on this platform. Make sure all text and dates are visible."
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs text-slate-500">
          Upload your driver&apos;s license and vehicle insurance
        </p>

        <UploadRow label="Upload driver's license" file={license} onPick={setLicense} />
        <UploadRow label="Upload vehicle insurance" file={insurance} onPick={setInsurance} />
        <UploadRow label="Upload vehicle image" file={vehicleImage} onPick={setVehicleImage} />

        {err ? <p className="text-xs text-red-600">{err}</p> : null}

        <div className="mt-3 flex flex-col gap-3">
          <Button
            type="button"
            className="w-full"
            disabled={loading || !license || !insurance || !vehicleImage}
            onClick={onProceed}
          >
            {loading ? "Uploading..." : "Proceed"}
          </Button>
        </div>
      </div>
    </DriverOnboardingStep>
  );
}
