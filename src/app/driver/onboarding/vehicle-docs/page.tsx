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
  onPick,
}: {
  label: string;
  file: File | null;
  onPick: (f: File | null) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      <label className="flex h-11 w-full cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100">
        <span className="px-3 text-center">{file ? file.name : label}</span>
        <input
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0] ?? null)}
        />
      </label>

      {file ? (
        <button
          type="button"
          className="shrink-0 text-xs font-semibold text-slate-600 underline underline-offset-4"
          onClick={() => onPick(null)}
        >
          Remove
        </button>
      ) : null}
    </div>
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
    if (!auth?.accessToken) {
      setErr("Your session expired. Please login again.");
      router.push("/driver/login");
      return;
    }

    setLoading(true);
    try {
      const fd = new FormData();
      // Optional uploads now
      if (license) fd.append("license", license);
      if (insurance) fd.append("insurance", insurance);
      if (vehicleImage) fd.append("vehicleImage", vehicleImage);

      const res = await fetch(`${API_URL}/driver/onboarding/vehicle-docs`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.accessToken}` },
        body: fd,
      });

      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      if (res.status === 401) {
        setErr("Session expired. Please login again.");
        router.push("/driver/login");
        return;
      }

      if (!res.ok) {
        setErr(data?.message || data?.error || `Upload failed (${res.status})`);
        return;
      }

      const nextPath = data?.nextPath;
      if (!nextPath || typeof nextPath !== "string") {
        setErr("Done, but next step was not returned. Please try again.");
        return;
      }

      router.push(nextPath);
    } catch (e: any) {
      setErr(
        e?.message?.includes("Failed to fetch")
          ? "Network error: could not reach the server. Please check internet / API URL / CORS."
          : e?.message || "Upload failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  const hasAny = !!(license || insurance || vehicleImage);

  return (
    <DriverOnboardingStep
      step={4}
      totalSteps={9}
      title="Vehicle Documents"
      subtitle="Upload any documents you have (you can also skip and upload later)."
    >
      <div className="flex flex-col gap-3">
        <p className="text-xs text-slate-500">
          You can upload images or PDFs. These are optional for now.
        </p>

        <UploadRow label="Upload driver's license (optional)" file={license} onPick={setLicense} />
        <UploadRow label="Upload vehicle insurance (optional)" file={insurance} onPick={setInsurance} />
        <UploadRow label="Upload vehicle image (optional)" file={vehicleImage} onPick={setVehicleImage} />

        {err ? <p className="text-xs text-red-600">{err}</p> : null}

        <div className="mt-3 flex flex-col gap-3">
          <Button type="button" className="w-full" disabled={loading} onClick={onProceed}>
            {loading ? "Please wait..." : hasAny ? "Proceed" : "Skip & Proceed"}
          </Button>
        </div>
      </div>
    </DriverOnboardingStep>
  );
}
