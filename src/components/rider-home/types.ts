// src/components/rider-home/types.ts

export type TripType = "one-way" | "round-trip";

export type LatLng = { lat: number; lng: number };

export type PlaceState = {
  label: string;
  coords?: LatLng;
};

export type TopSectionProps = {
  tripType: TripType;
  setTripType: (t: TripType) => void;

  recurring: boolean;
  toggleRecurring: () => void;

  openFareModal: () => void;

  // ✅ real-time booking states
  pickup: PlaceState | null;
  dropoff: PlaceState | null;
  leaveAt: Date | null;
  arriveAt: Date | null;

  // ✅ handlers coming from RiderHome (where state + backend logic lives)
  onPickupChange: (p: { label: string; coords?: LatLng }) => void | Promise<void>;
  onDropoffChange: (p: { label: string; coords?: LatLng }) => void | Promise<void>;
  onLeaveAtChange: (d: Date | null) => void;
  onArriveAtChange: (d: Date | null) => void;
};
