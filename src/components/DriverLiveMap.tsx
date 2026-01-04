"use client";

import { useEffect, useMemo, useState } from "react";
import { GoogleMap, MarkerF, useJsApiLoader } from "@react-google-maps/api";

type LatLng = { lat: number; lng: number };

export function DriverLiveMap() {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-maps",
    googleMapsApiKey: apiKey,
  });

  const [pos, setPos] = useState<LatLng | null>(null);
  const [geoErr, setGeoErr] = useState<string | null>(null);

  // Default center (use any city you want as fallback)
  const center = useMemo<LatLng>(() => pos ?? { lat: 31.5204, lng: 74.3587 }, [pos]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoErr("Geolocation not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (p) => {
        setPos({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      (e) => {
        setGeoErr(e.message || "Location permission denied.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  if (!apiKey) {
    return (
      <div className="h-full w-full rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-sm text-slate-300">
        Missing <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="h-full w-full rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-sm text-slate-300">
        Failed to load Google Maps: {String(loadError)}
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="h-full w-full rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-sm text-slate-300">
        Loading map...
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#050f25]">
      <GoogleMap
        mapContainerClassName="h-full w-full"
        center={center}
        zoom={pos ? 15 : 12}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        }}
      >
        <MarkerF position={center} />
      </GoogleMap>

      {/* small message if geolocation denied */}
      {geoErr ? (
        <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-3 py-2 text-[11px] text-white">
          {geoErr}
        </div>
      ) : null}
    </div>
  );
}
