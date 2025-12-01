import { DriverDashboardShell } from "@/src/components/DriverDashboardShell";

export default function SupportPage() {
  return (
    <DriverDashboardShell>
      <div className="space-y-2">
        <h1 className="text-sm font-semibold text-slate-100">Support</h1>
        <p className="text-xs text-slate-400">
          Help articles and contact options for support will appear here.
        </p>
      </div>
    </DriverDashboardShell>
  );
}
