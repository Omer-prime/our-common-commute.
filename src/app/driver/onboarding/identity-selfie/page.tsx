"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DriverOnboardingStep } from "@/src/components/DriverOnboardingStep";
import { Button } from "@/src/components/ui";
import { getAuth } from "@/src/lib/authStorage";
import { API_URL } from "@/src/lib/api";

type Quality = { ok: boolean; reason?: string };

function checkQualityFromCanvas(canvas: HTMLCanvasElement): Quality {
  // Simple client-side check (not strict): brightness + contrast
  const ctx = canvas.getContext("2d");
  if (!ctx) return { ok: true };

  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);

  // sample every N pixels for speed
  const step = 16;
  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let i = 0; i < data.length; i += 4 * step) {
    const r = data[i]!;
    const g = data[i + 1]!;
    const b = data[i + 2]!;
    const y = 0.2126 * r + 0.7152 * g + 0.0722 * b; // luminance
    sum += y;
    sumSq += y * y;
    count++;
  }

  const mean = sum / Math.max(1, count);
  const variance = sumSq / Math.max(1, count) - mean * mean;

  // Very wide thresholds (so it won’t reject normal selfies)
  if (mean < 40) return { ok: false, reason: "Selfie looks too dark. Please move to better light." };
  if (mean > 235) return { ok: false, reason: "Selfie looks overexposed. Please reduce light." };
  if (variance < 150) return { ok: false, reason: "Selfie looks low-contrast / blurry. Clean lens and retake." };

  return { ok: true };
}

export default function IdentitySelfiePage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [streamOn, setStreamOn] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [quality, setQuality] = useState<Quality>({ ok: true });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function start() {
      setError(null);
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
          setStreamOn(true);
        }
      } catch (e: any) {
        setError(e?.message || "Camera permission denied");
      }
    }

    start();

    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, []);

  async function capture() {
    setError(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const w = video.videoWidth || 640;
    const h = video.videoHeight || 480;
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, w, h);

    const q = checkQualityFromCanvas(canvas);
    setQuality(q);

    const newBlob: Blob | null = await new Promise((resolve) =>
      canvas.toBlob((b) => resolve(b), "image/jpeg", 0.92)
    );

    if (!newBlob) {
      setError("Failed to capture image.");
      return;
    }

    setBlob(newBlob);

    const url = URL.createObjectURL(newBlob);
    setPreviewUrl(url);
  }

  function retake() {
    setBlob(null);
    setPreviewUrl(null);
    setQuality({ ok: true });
    setError(null);
  }

  async function onProceed() {
    if (!blob) {
      setError("Please take a selfie first.");
      return;
    }
    if (!quality.ok) return; // keep button disabled anyway

    const auth = getAuth();
    if (!auth?.accessToken) {
      setError("Please login again.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const file = new File([blob], "selfie.jpg", { type: "image/jpeg" });

      const fd = new FormData();
      fd.append("file", file); // MUST be "file"

      const res = await fetch(`${API_URL}/driver/onboarding/identity-selfie`, {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.accessToken}` },
        body: fd
      });

      const text = await res.text();
      let data: any;
      try {
        data = text ? JSON.parse(text) : {};
      } catch {
        data = { raw: text };
      }

      if (!res.ok) {
        setError(data?.message || data?.error || "Upload failed");
        return;
      }

      router.push(data.nextPath);
    } finally {
      setLoading(false);
    }
  }

  return (
    <DriverOnboardingStep
      step={3}
      totalSteps={9}
      title="Identity & Security"
      subtitle="This is required for identity verification and safety."
    >
      <div className="flex flex-col items-center gap-4">
        <p className="text-xs text-slate-500">Take a selfie for verification</p>

        <div className="w-[320px] overflow-hidden rounded-2xl border border-slate-200 shadow-md bg-black">
          {!previewUrl ? (
            <video ref={videoRef} className="h-[240px] w-[320px] object-cover" playsInline muted />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={previewUrl} alt="Selfie preview" className="h-[240px] w-[320px] object-cover" />
          )}
        </div>

        <canvas ref={canvasRef} className="hidden" />

        {!quality.ok ? (
          <p className="text-xs text-red-600 text-center">{quality.reason}</p>
        ) : null}

        {error ? <p className="text-xs text-red-600 text-center">{error}</p> : null}

        <div className="mt-1 w-full max-w-sm flex flex-col gap-3">
          {!previewUrl ? (
            <Button type="button" className="w-full" onClick={capture} disabled={!streamOn}>
              {streamOn ? "Capture" : "Starting camera..."}
            </Button>
          ) : (
            <>
              <Button type="button" className="w-full" onClick={onProceed} disabled={loading || !quality.ok}>
                {loading ? "Uploading..." : "Proceed"}
              </Button>
              <Button type="button" className="w-full" variant="secondary" onClick={retake} disabled={loading}>
                Retake
              </Button>
            </>
          )}
        </div>
      </div>
    </DriverOnboardingStep>
  );
}
