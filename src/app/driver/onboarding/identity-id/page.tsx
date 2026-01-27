"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DriverOnboardingStep } from "@/src/components/DriverOnboardingStep";
import { Button } from "@/src/components/ui";
import { getAuth } from "@/src/lib/authStorage";
import { API_URL } from "@/src/lib/api";

export default function IdentityIdPage() {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onProceed() {
    if (!file) return;

    const auth = getAuth();
    if (!auth?.accessToken) {
      setError("Your session expired. Please login again.");
      router.push("/driver/login"); // adjust route if different
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      fd.append("file", file); // MUST be "file"

      const res = await fetch(`${API_URL}/driver/onboarding/identity-id`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.accessToken}` },
        body: fd,
      });

      // Read as text first to avoid JSON parse crashing
      const text = await res.text();
      let data: any = {};
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      // Handle auth expiry clearly
      if (res.status === 401) {
        setError("Session expired. Please login again.");
        router.push("/driver/login"); // adjust route if different
        return;
      }

      // If later you add rate-limit / temp lock
      if (res.status === 429) {
        setError(data?.message || "Too many failed attempts. Please try again later.");
        return;
      }

      if (!res.ok) {
        setError(data?.message || data?.error || `Upload failed (${res.status})`);
        return;
      }

      const nextPath = data?.nextPath;
      if (!nextPath || typeof nextPath !== "string") {
        setError("Upload succeeded but next step was not returned. Please try again.");
        return;
      }

      router.push(nextPath);
    } catch (e: any) {
      // This is the big missing part: fetch() network/CORS errors
      setError(
        e?.message?.includes("Failed to fetch")
          ? "Network error: could not upload. Please check internet / API URL / CORS."
          : e?.message || "Network error: upload failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <DriverOnboardingStep
      step={2}
      totalSteps={9}
      title="Identity & Security"
      subtitle="This is required for identity verification and safety."
    >
      <div className="flex flex-col gap-5">
        <p className="text-xs text-slate-500 text-center">
          Upload your government-issued ID
        </p>

        <label className="flex h-12 w-full max-w-sm cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100">
          <span>{file ? file.name : "Upload ID"}</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error ? (
          <p className="text-xs text-red-600 text-center">{error}</p>
        ) : null}

        <Button
          type="button"
          className="w-full"
          disabled={!file || loading}
          onClick={onProceed}
        >
          {loading ? "Uploading..." : "Proceed"}
        </Button>
      </div>
    </DriverOnboardingStep>
  );
}
