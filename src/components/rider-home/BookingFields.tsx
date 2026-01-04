// src/components/rider-home/BookingFields.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import clsx from "clsx";
import { Crosshair, MapPin, Calendar, RefreshCcw, X, Check } from "lucide-react";
import type { TripType } from "./types";

type LatLng = { lat: number; lng: number };

type PlaceState = {
  label: string;
  coords?: LatLng;
};

type BookingFieldsProps = {
  tripType: TripType;
  recurring: boolean;
  toggleRecurring: () => void;

  pickup: PlaceState | null;
  dropoff: PlaceState | null;
  leaveAt: Date | null;
  arriveAt: Date | null;

  onPickupChange: (p: { label: string; coords?: LatLng }) => void | Promise<void>;
  onDropoffChange: (p: { label: string; coords?: LatLng }) => void | Promise<void>;
  onLeaveAtChange: (d: Date | null) => void;
  onArriveAtChange: (d: Date | null) => void;
};

type OpenKey = null | "pickup" | "dropoff" | "leaveAt" | "arriveAt";

function fmtDateTime(d: Date | null) {
  if (!d) return "Now";
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function toDatetimeLocalValue(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function fromDatetimeLocalValue(v: string): Date | null {
  // v = "YYYY-MM-DDTHH:mm"
  if (!v || !v.includes("T")) return null;
  const [datePart, timePart] = v.split("T");
  const [y, m, d] = datePart.split("-").map(Number);
  const [hh, mm] = timePart.split(":").map(Number);
  if (!y || !m || !d) return null;
  const dt = new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function hasPlacesApi(): boolean {
  const g = (globalThis as any).google;
  return Boolean(g?.maps?.places?.AutocompleteService);
}

async function getPlacePredictions(input: string): Promise<Array<{ description: string; place_id: string }>> {
  return new Promise((resolve) => {
    const g = (globalThis as any).google;
    if (!g?.maps?.places?.AutocompleteService) return resolve([]);

    const service = new g.maps.places.AutocompleteService();
    service.getPlacePredictions(
      {
        input,
        // optional: keep it PK focused; remove if you want global
        componentRestrictions: { country: "pk" },
      },
      (preds: any[] | null, status: string) => {
        if (status !== "OK" || !preds) return resolve([]);
        resolve(
          preds.map((p) => ({
            description: p.description,
            place_id: p.place_id,
          }))
        );
      }
    );
  });
}

async function getPlaceDetails(placeId: string): Promise<{ label: string; coords?: LatLng } | null> {
  return new Promise((resolve) => {
    const g = (globalThis as any).google;
    if (!g?.maps?.places?.PlacesService) return resolve(null);

    const el = document.createElement("div");
    const service = new g.maps.places.PlacesService(el);

    service.getDetails(
      { placeId, fields: ["formatted_address", "name", "geometry"] },
      (place: any, status: string) => {
        if (status !== "OK" || !place) return resolve(null);
        const loc = place.geometry?.location;
        const coords = loc ? { lat: loc.lat(), lng: loc.lng() } : undefined;
        const label = place.formatted_address || place.name || "";
        resolve({ label, coords });
      }
    );
  });
}

export function BookingFields({
  tripType,
  recurring,
  toggleRecurring,
  pickup,
  dropoff,
  leaveAt,
  arriveAt,
  onPickupChange,
  onDropoffChange,
  onLeaveAtChange,
  onArriveAtChange,
}: BookingFieldsProps) {
  const [open, setOpen] = useState<OpenKey>(null);

  // editor states for popovers
  const [addrInput, setAddrInput] = useState("");
  const [preds, setPreds] = useState<Array<{ description: string; place_id: string }>>([]);
  const [dtValue, setDtValue] = useState<string>("");

  const pickupValue = pickup?.label?.trim() || "Select pickup location";
  const dropoffValue = dropoff?.label?.trim() || "Select destination";

  const leaveValue = useMemo(() => fmtDateTime(leaveAt), [leaveAt]);
  const arriveValue = useMemo(() => (arriveAt ? fmtDateTime(arriveAt) : "Optional"), [arriveAt]);

  // when opening a popover, seed inputs
  useEffect(() => {
    if (open === "pickup") {
      setAddrInput(pickup?.label ?? "");
      setPreds([]);
    }
    if (open === "dropoff") {
      setAddrInput(dropoff?.label ?? "");
      setPreds([]);
    }
    if (open === "leaveAt") {
      const d = leaveAt ?? new Date(Date.now() + 10 * 60_000);
      setDtValue(toDatetimeLocalValue(d));
    }
    if (open === "arriveAt") {
      const d = arriveAt ?? new Date(Date.now() + 30 * 60_000);
      setDtValue(toDatetimeLocalValue(d));
    }
  }, [open, pickup?.label, dropoff?.label, leaveAt, arriveAt]);

  // live predictions (only if Places library present)
  useEffect(() => {
    let alive = true;

    (async () => {
      if (open !== "pickup" && open !== "dropoff") return;
      const q = addrInput.trim();
      if (!q || q.length < 3) {
        setPreds([]);
        return;
      }
      if (!hasPlacesApi()) {
        setPreds([]);
        return;
      }
      const list = await getPlacePredictions(q);
      if (!alive) return;
      setPreds(list.slice(0, 6));
    })();

    return () => {
      alive = false;
    };
  }, [open, addrInput]);

  const close = () => setOpen(null);

  const saveManualAddress = async () => {
    const label = addrInput.trim();
    if (!label) return;

    if (open === "pickup") await onPickupChange({ label });
    if (open === "dropoff") await onDropoffChange({ label });

    close();
  };

  const onPickPrediction = async (place_id: string) => {
    const details = await getPlaceDetails(place_id);
    if (!details?.label) return;

    if (open === "pickup") await onPickupChange({ label: details.label, coords: details.coords });
    if (open === "dropoff") await onDropoffChange({ label: details.label, coords: details.coords });

    close();
  };

  const saveDatetime = () => {
    const dt = fromDatetimeLocalValue(dtValue);
    if (!dt) return;

    if (open === "leaveAt") onLeaveAtChange(dt);
    if (open === "arriveAt") onArriveAtChange(dt);

    close();
  };

  const clearField = async () => {
    if (open === "pickup") await onPickupChange({ label: "" });
    if (open === "dropoff") await onDropoffChange({ label: "" });
    if (open === "leaveAt") onLeaveAtChange(null);
    if (open === "arriveAt") onArriveAtChange(null);
    close();
  };

  return (
    <div className="space-y-3 text-xs">
      {/* Pickup */}
      <RowWithPopover
        icon={<Crosshair className="h-4 w-4 text-slate-100" />}
        label="Pickup location"
        value={pickupValue}
        isOpen={open === "pickup"}
        onOpen={() => setOpen((v) => (v === "pickup" ? null : "pickup"))}
      >
        <PopoverShell title="Pickup address" onClose={close} onClear={clearField}>
          <AddressEditor
            value={addrInput}
            setValue={setAddrInput}
            preds={preds}
            onPickPrediction={onPickPrediction}
            onSaveManual={saveManualAddress}
            placesEnabled={hasPlacesApi()}
          />
        </PopoverShell>
      </RowWithPopover>

      {/* Destination */}
      <RowWithPopover
        icon={<MapPin className="h-4 w-4 text-slate-100" />}
        label="Destination"
        value={dropoffValue}
        isOpen={open === "dropoff"}
        onOpen={() => setOpen((v) => (v === "dropoff" ? null : "dropoff"))}
      >
        <PopoverShell title="Destination address" onClose={close} onClear={clearField}>
          <AddressEditor
            value={addrInput}
            setValue={setAddrInput}
            preds={preds}
            onPickPrediction={onPickPrediction}
            onSaveManual={saveManualAddress}
            placesEnabled={hasPlacesApi()}
          />
        </PopoverShell>
      </RowWithPopover>

      {/* Leave at / Arrive at */}
      {tripType === "one-way" ? (
        <RowWithPopover
          icon={<Calendar className="h-4 w-4 text-slate-100" />}
          label="Leave at"
          value={leaveValue}
          isOpen={open === "leaveAt"}
          onOpen={() => setOpen((v) => (v === "leaveAt" ? null : "leaveAt"))}
        >
          <PopoverShell title="Leave at" onClose={close} onClear={clearField}>
            <DateTimeEditor dtValue={dtValue} setDtValue={setDtValue} onSave={saveDatetime} />
          </PopoverShell>
        </RowWithPopover>
      ) : (
        <div className="space-y-3">
          <RowWithPopover
            icon={<Calendar className="h-4 w-4 text-slate-100" />}
            label="Leave at"
            value={leaveValue}
            isOpen={open === "leaveAt"}
            onOpen={() => setOpen((v) => (v === "leaveAt" ? null : "leaveAt"))}
          >
            <PopoverShell title="Leave at" onClose={close} onClear={clearField}>
              <DateTimeEditor dtValue={dtValue} setDtValue={setDtValue} onSave={saveDatetime} />
            </PopoverShell>
          </RowWithPopover>

          <RowWithPopover
            icon={<Calendar className="h-4 w-4 text-slate-100" />}
            label="Arrive at"
            value={arriveValue}
            isOpen={open === "arriveAt"}
            onOpen={() => setOpen((v) => (v === "arriveAt" ? null : "arriveAt"))}
          >
            <PopoverShell title="Arrive at (optional)" onClose={close} onClear={clearField}>
              <DateTimeEditor dtValue={dtValue} setDtValue={setDtValue} onSave={saveDatetime} />
            </PopoverShell>
          </RowWithPopover>
        </div>
      )}

      {/* Recurring toggle */}
      <button
        type="button"
        onClick={toggleRecurring}
        className="flex items-center justify-between rounded-xl border border-[#233358] bg-[#1a2d51] px-4 py-2.5"
      >
        <div className="flex items-center gap-3 text-xs text-slate-100">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111e3c]">
            <RefreshCcw className="h-4 w-4 text-slate-100" />
          </div>
          <span>Make this recurring</span>
        </div>

        <span
          className={clsx(
            "flex h-5 w-9 items-center rounded-full bg-[#27385d] p-0.5 transition-colors",
            recurring && "bg-[#0B63F4]"
          )}
        >
          <span
            className={clsx(
              "h-4 w-4 rounded-full bg-white shadow-sm transition-transform",
              recurring ? "translate-x-4" : "translate-x-0"
            )}
          />
        </span>
      </button>
    </div>
  );
}

/* ---------- UI Pieces ---------- */

function RowWithPopover({
  icon,
  label,
  value,
  isOpen,
  onOpen,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  isOpen: boolean;
  onOpen: () => void;
  children?: React.ReactNode;
}) {
  return (
    <div className="relative">
      <div className="flex items-center gap-3 rounded-xl border border-[#233358] bg-[#1a2d51] px-3 py-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#111e3c]">
          {icon}
        </div>
        <div className="flex-1 text-xs">
          <div className="text-[11px] text-slate-300">{label}</div>
          <div className="mt-0.5 text-slate-100">{value}</div>
        </div>
        <button
          type="button"
          onClick={onOpen}
          className="inline-flex items-center gap-1 rounded-md border border-[#233358] bg-[#101a33] px-3 py-[6px] text-[11px] text-slate-200 hover:bg-[#0b1735]"
        >
          Select
        </button>
      </div>

      {isOpen ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-[320px] rounded-xl border border-[#233358] bg-[#0b1735] p-3 shadow-xl">
          {children}
        </div>
      ) : null}
    </div>
  );
}

function PopoverShell({
  title,
  onClose,
  onClear,
  children,
}: {
  title: string;
  onClose: () => void;
  onClear: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-semibold text-slate-100">{title}</div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex items-center gap-1 rounded-md border border-[#233358] bg-[#101a33] px-2 py-1 text-[11px] text-slate-200 hover:bg-[#111e3c]"
          >
            <X className="h-3 w-3" />
            Clear
          </button>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-md border border-[#233358] bg-[#101a33] p-1 text-slate-200 hover:bg-[#111e3c]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {children}
    </div>
  );
}

function AddressEditor({
  value,
  setValue,
  preds,
  onPickPrediction,
  onSaveManual,
  placesEnabled,
}: {
  value: string;
  setValue: (v: string) => void;
  preds: Array<{ description: string; place_id: string }>;
  onPickPrediction: (place_id: string) => void;
  onSaveManual: () => void;
  placesEnabled: boolean;
}) {
  return (
    <div className="space-y-2">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Type address..."
        className="w-full rounded-lg border border-[#233358] bg-[#101a33] px-3 py-2 text-[12px] text-slate-100 placeholder:text-slate-500 outline-none focus:border-[#1d4ed8]"
      />

      {placesEnabled && preds.length > 0 ? (
        <div className="max-h-[180px] overflow-auto rounded-lg border border-[#233358] bg-[#050f25]">
          {preds.map((p) => (
            <button
              key={p.place_id}
              type="button"
              onClick={() => onPickPrediction(p.place_id)}
              className="block w-full px-3 py-2 text-left text-[12px] text-slate-200 hover:bg-[#101a33]"
            >
              {p.description}
            </button>
          ))}
        </div>
      ) : (
        <div className="text-[11px] text-slate-400">
          {placesEnabled ? "Type 3+ chars for suggestions." : "Suggestions unavailable (places library not loaded)."}
        </div>
      )}

      <button
        type="button"
        onClick={onSaveManual}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1d4ed8] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#2563eb]"
      >
        <Check className="h-4 w-4" />
        Set address
      </button>
    </div>
  );
}

function DateTimeEditor({
  dtValue,
  setDtValue,
  onSave,
}: {
  dtValue: string;
  setDtValue: (v: string) => void;
  onSave: () => void;
}) {
  return (
    <div className="space-y-2">
      <input
        type="datetime-local"
        value={dtValue}
        onChange={(e) => setDtValue(e.target.value)}
        className="w-full rounded-lg border border-[#233358] bg-[#101a33] px-3 py-2 text-[12px] text-slate-100 outline-none focus:border-[#1d4ed8]"
      />

      <button
        type="button"
        onClick={onSave}
        className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#1d4ed8] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#2563eb]"
      >
        <Check className="h-4 w-4" />
        Save time
      </button>
    </div>
  );
}
