import { DriverDashboardShell } from "@/src/components/DriverDashboardShell";

export default function MyRidesPage() {
  return (
    <DriverDashboardShell>
      <div className="space-y-2">
        <h1 className="text-sm font-semibold text-slate-100">My rides</h1>
        <p className="text-xs text-slate-400">
          Ride history and upcoming rides will appear here.
        </p>
      </div>
    </DriverDashboardShell>
  );
}
