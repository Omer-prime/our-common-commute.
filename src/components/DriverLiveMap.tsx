"use client";

import { useEffect, useMemo, useState } from "react";
import {
  GoogleMap,
  MarkerF,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";

type LatLng = { lat: number; lng: number };

type Props = {
  pickup?: LatLng | null;
  dropoff?: LatLng | null;
  showRoute?: boolean;
};

export function DriverLiveMap({ pickup, dropoff, showRoute = true }: Props) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-maps",
    googleMapsApiKey: apiKey,
  });

  const [pos, setPos] = useState<LatLng | null>(null);
  const [geoErr, setGeoErr] = useState<string | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);

  const center = useMemo<LatLng>(() => {
    if (pickup) return pickup;
    if (pos) return pos;
    return { lat: 31.5204, lng: 74.3587 };
  }, [pickup, pos]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setGeoErr("Geolocation not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (p) => setPos({ lat: p.coords.latitude, lng: p.coords.longitude }),
      (e) => setGeoErr(e.message || "Location permission denied."),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  }, []);

  useEffect(() => {
    // Reset if we don't have route inputs
    if (!isLoaded || !showRoute || !pickup || !dropoff) {
      setDirections(null);
      return;
    }
    if (typeof google === "undefined") return;

    const svc = new google.maps.DirectionsService();
    svc.route(
      {
        origin: pickup,
        destination: dropoff,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      (res, status) => {
        if (status === "OK" && res) setDirections(res);
        else setDirections(null);
      }
    );
  }, [isLoaded, showRoute, pickup?.lat, pickup?.lng, dropoff?.lat, dropoff?.lng]);

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
      <div className="h-full w-full rounded-2xl border border-slate-800 bg-[#050f25] map-skeleton p-4 text-sm text-slate-300">
        Loading map...
      </div>
    );
  }

  return (
    <div className="relative h-full w-full overflow-hidden rounded-2xl border border-slate-800 bg-[#050f25]">
      <GoogleMap
        mapContainerClassName="h-full w-full"
        center={center}
        zoom={pickup ? 14 : pos ? 15 : 12}
        options={{
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
        }}
      >
        {pickup ? <MarkerF position={pickup} /> : null}
        {dropoff ? <MarkerF position={dropoff} /> : null}
        {directions ? <DirectionsRenderer directions={directions} /> : null}
      </GoogleMap>

      {geoErr ? (
        <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-3 py-2 text-[11px] text-white">
          {geoErr}
        </div>
      ) : null}
    </div>
  );
}
