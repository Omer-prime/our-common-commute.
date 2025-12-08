// src/components/rider-home/types.ts

export type TripType = "one-way" | "round-trip";

export type TopSectionProps = {
  tripType: TripType;
  setTripType: (t: TripType) => void;
  recurring: boolean;
  toggleRecurring: () => void;
  openFareModal: () => void;
};
