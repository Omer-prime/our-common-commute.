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

  async function submit(withFile: boolean) {
    const auth = getAuth();
    if (!auth?.accessToken) {
      setError("Your session expired. Please login again.");
      router.push("/driver/login");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const fd = new FormData();
      if (withFile && file) {
        fd.append("file", file); // backend expects "file"
      }
      // If skipping: send empty FormData (backend will treat as skipped)

      const res = await fetch(`${API_URL}/driver/onboarding/identity-id`, {
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
        setError("Session expired. Please login again.");
        router.push("/driver/login");
        return;
      }

      if (!res.ok) {
        setError(data?.message || data?.error || `Request failed (${res.status})`);
        return;
      }

      const nextPath = data?.nextPath;
      if (!nextPath || typeof nextPath !== "string") {
        setError("Done, but next step was not returned. Please try again.");
        return;
      }

      router.push(nextPath);
    } catch (e: any) {
      setError(
        e?.message?.includes("Failed to fetch")
          ? "Network error: could not reach the server. Please check internet / API URL / CORS."
          : e?.message || "Network error: request failed. Please try again."
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
      subtitle="Upload your government ID (you can skip and upload later)."
    >
      <div className="flex flex-col gap-5">
        <p className="text-xs text-slate-500 text-center">
          Upload your government-issued ID (image or PDF)
        </p>

        <label className="flex h-12 w-full max-w-sm cursor-pointer items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 text-sm font-medium text-slate-700 hover:bg-slate-100">
          <span>{file ? file.name : "Upload ID"}</span>
          <input
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error ? <p className="text-xs text-red-600 text-center">{error}</p> : null}

        <div className="flex w-full flex-col gap-3">
          <Button
            type="button"
            className="w-full"
            disabled={loading || !file}
            onClick={() => submit(true)}
          >
            {loading ? "Please wait..." : "Proceed"}
          </Button>

          <button
            type="button"
            className="text-xs font-medium text-slate-600 underline underline-offset-4 disabled:opacity-50"
            disabled={loading}
            onClick={() => submit(false)}
          >
            Skip for now
          </button>
        </div>
      </div>
    </DriverOnboardingStep>
  );
}
