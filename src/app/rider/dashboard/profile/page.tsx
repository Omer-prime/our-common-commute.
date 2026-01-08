"use client";

import React, { useEffect, useMemo, useState, type ReactNode, FormEvent } from "react";
import Image from "next/image";
import {
  User,
  IdCard,
  MapPin,
  CreditCard,
  Shield,
  Settings as SettingsIcon,
  ChevronRight,
  ArrowLeft,
  ChevronDown,
} from "lucide-react";
import { RiderDashboardShell } from "@/src/components/RiderDashboardShell";

/* -------------------------------------------------------------------------- */
/*  API HELPERS                                                               */
/* -------------------------------------------------------------------------- */

function getBackendBaseUrl() {
  let base = (process.env.NEXT_PUBLIC_API_URL ?? "").trim();
  base = base.replace(/\/+$/, "");
  if (!base) return "http://localhost:4000";
  if (base.endsWith("/api")) base = base.slice(0, -4);
  return base;
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  const keys = ["accessToken", "token", "access_token", "jwt", "authToken"];
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v && v.trim()) return v.trim();
  }
  return null;
}

function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  const v = localStorage.getItem("refreshToken");
  return v && v.trim() ? v.trim() : null;
}

async function postJsonFirstWorking(base: string, paths: string[], body: any): Promise<Response> {
  for (const path of paths) {
    const res = await fetch(`${base}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.status === 404) continue;
    return res;
  }
  // last try returns 404
  return fetch(`${base}${paths[0]}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function refreshAccessToken(): Promise<string | null> {
  const base = getBackendBaseUrl();
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  const res = await postJsonFirstWorking(base, ["/api/auth/refresh", "/auth/refresh", "/api/refresh"], { refreshToken });
  if (!res.ok) return null;

  const data = (await res.json()) as { accessToken?: string };
  if (!data?.accessToken) return null;

  localStorage.setItem("accessToken", data.accessToken);
  return data.accessToken;
}

async function apiFetch<T>(path: string, init?: RequestInit, retried = false): Promise<T> {
  const base = getBackendBaseUrl();
  const token = getAccessToken();

  const headers: Record<string, string> = {
    ...(init?.method && init.method !== "GET" ? { "Content-Type": "application/json" } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  const res = await fetch(`${base}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...(init?.headers ?? {}),
    } as any,
  });

  if (res.status === 401 && !retried) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryRes = await fetch(`${base}${path}`, {
        ...init,
        headers: {
          ...(init?.method && init.method !== "GET" ? { "Content-Type": "application/json" } : {}),
          Authorization: `Bearer ${newToken}`,
          ...(init?.headers ?? {}),
        } as any,
      });

      const data2 = (await retryRes.json()) as any;
      if (!retryRes.ok) {
        throw new Error(retryRes.status === 401 ? "UNAUTHORIZED — Please login again." : (data2?.error || "Request failed"));
      }
      return data2 as T;
    }

    throw new Error("UNAUTHORIZED — Please login again.");
  }

  const data = (await res.json()) as any;
  if (!res.ok) {
    throw new Error(res.status === 401 ? "UNAUTHORIZED — Please login again." : (data?.error || "Request failed"));
  }
  return data as T;
}

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */

type ProfileSection = "personalInfo" | "identity" | "location" | "payment" | "security" | "settings";
type IdentityView = "main" | "governmentId";
type SettingsView = "main" | "language" | "notifications";
type LocationTarget = "home" | "work";
type LanguageOption = "English" | "Spanish";

type VerificationStatus = "PENDING" | "VERIFIED" | "REJECTED";

type RiderProfile = {
  name: string;
  email: string;
  location: string;
  phone: string;
  homeAddress: string;
  workAddress: string;
  avatarUrl: string;
};

type LocationInfo = {
  homeAddress: string;
  workAddress: string;
};

type PaymentMethod = {
  id: string;
  label: string;
  secondary: string;
  isDefault?: boolean;
  type?: string;
};

type ApiRes = {
  ok: boolean;
  error?: string;
};

type ProfileRes = ApiRes & {
  profile: RiderProfile;
  identity: {
    governmentId: { status: VerificationStatus; url: string };
    selfie: { status: VerificationStatus; url: string };
  };
  paymentMethods: PaymentMethod[];
  security: {
    faceRecognitionEnabled: boolean;
    twoFactorEnabled: boolean;
  };
  settings: {
    language: LanguageOption;
    rideUpdates: boolean;
    paymentAlerts: boolean;
    shiftReminders: boolean;
    serviceAlerts: boolean;
  };
};

/* -------------------------------------------------------------------------- */
/*  HELPERS                                                                   */
/* -------------------------------------------------------------------------- */

function getSectionTitle(section: ProfileSection): string {
  switch (section) {
    case "personalInfo":
      return "Personal information";
    case "identity":
      return "Identity verification";
    case "location":
      return "My location";
    case "payment":
      return "Payment method";
    case "security":
      return "Security";
    case "settings":
      return "Settings";
  }
}

function prettyStatus(s: VerificationStatus) {
  if (s === "VERIFIED") return { label: "Verified", variant: "success" as const };
  if (s === "REJECTED") return { label: "Rejected", variant: "danger" as const };
  return { label: "Pending", variant: "neutral" as const };
}

/* -------------------------------------------------------------------------- */
/*  PAGE                                                                      */
/* -------------------------------------------------------------------------- */

export default function RiderProfilePage() {
  const [section, setSection] = useState<ProfileSection>("personalInfo");
  const [mobileSection, setMobileSection] = useState<ProfileSection | null>(null);

  const [identityView, setIdentityView] = useState<IdentityView>("main");
  const [settingsView, setSettingsView] = useState<SettingsView>("main");

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [identity, setIdentity] = useState<ProfileRes["identity"] | null>(null);
  const [locations, setLocations] = useState<LocationInfo | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [securityState, setSecurityState] = useState<{ faceRecognition: boolean; twoFactorAuth: boolean }>({
    faceRecognition: true,
    twoFactorAuth: false,
  });
  const [prefs, setPrefs] = useState<ProfileRes["settings"] | null>(null);

  const [locationChangeTarget, setLocationChangeTarget] = useState<LocationTarget | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const isVerified = useMemo(() => {
    if (!identity) return false;
    return identity.governmentId.status === "VERIFIED" && identity.selfie.status === "VERIFIED";
  }, [identity]);

  const load = async () => {
    try {
      setErr(null);
      setLoading(true);
      const data = await apiFetch<ProfileRes>("/api/rider/profile");
      if (!data.ok) throw new Error(data.error || "Failed to load profile");

      setRider(data.profile);
      setIdentity(data.identity);
      setLocations({ homeAddress: data.profile.homeAddress, workAddress: data.profile.workAddress });
      setPaymentMethods(data.paymentMethods || []);
      setSecurityState({
        faceRecognition: data.security.faceRecognitionEnabled,
        twoFactorAuth: data.security.twoFactorEnabled,
      });
      setPrefs(data.settings);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSidebarClick = (next: ProfileSection) => {
    setSection(next);
    setMobileSection(next);
    setIdentityView("main");
    setSettingsView("main");
  };

  const closeMobileSection = () => {
    setMobileSection(null);
    setIdentityView("main");
    setSettingsView("main");
  };

  const requestLocationChange = async (target: LocationTarget, value: string) => {
    try {
      setSaving(true);
      await apiFetch<ApiRes>("/api/rider/profile/locations/request", {
        method: "POST",
        body: JSON.stringify({
          target: target === "home" ? "HOME" : "WORK",
          requestedAddress: value,
        }),
      });
      // addresses remain approved values; request goes to admin
      setLocationChangeTarget(null);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to request change");
    } finally {
      setSaving(false);
    }
  };

  const changePassword = async (oldPassword: string, newPassword: string) => {
    try {
      setSaving(true);
      await apiFetch<ApiRes>("/api/rider/profile/change-password", {
        method: "POST",
        body: JSON.stringify({ oldPassword, newPassword }),
      });
      setShowChangePassword(false);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to change password");
    } finally {
      setSaving(false);
    }
  };

  const updateSecurity = async (patch: Partial<{ faceRecognitionEnabled: boolean; twoFactorEnabled: boolean }>) => {
    try {
      await apiFetch<ApiRes>("/api/rider/profile/security", {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update security");
      await load();
    }
  };

  const updateSettings = async (patch: Partial<ProfileRes["settings"]>) => {
    try {
      const res = await apiFetch<{ ok: boolean; settings?: ProfileRes["settings"]; error?: string }>("/api/rider/profile/settings", {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      if (!res.ok) throw new Error(res.error || "Failed to update settings");
      if (res.settings) setPrefs(res.settings);
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update settings");
      await load();
    }
  };

  const updateIdentityUrl = async (type: "government-id" | "selfie", url: string) => {
    try {
      setSaving(true);
      const res = await apiFetch<{ ok: boolean; doc?: { type: string; status: VerificationStatus; url: string }; error?: string }>(
        `/api/rider/profile/identity/${type}`,
        { method: "PATCH", body: JSON.stringify({ url }) }
      );
      if (!res.ok || !res.doc) throw new Error(res.error || "Failed to update identity");

      setIdentity((prev) => {
        if (!prev) return prev;
        if (type === "government-id") {
          return { ...prev, governmentId: { status: res.doc!.status, url: res.doc!.url } };
        }
        return { ...prev, selfie: { status: res.doc!.status, url: res.doc!.url } };
      });
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update identity");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <RiderDashboardShell>
        <div className="rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-sm text-slate-200">
          Loading profile…
        </div>
      </RiderDashboardShell>
    );
  }

  if (err && !rider) {
    return (
      <RiderDashboardShell>
        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-200">
          {err}
          <button
            type="button"
            onClick={load}
            className="mt-3 rounded-lg bg-[#07152f] px-3 py-2 text-xs text-slate-200 hover:bg-[#0b1b3a]"
          >
            Retry
          </button>
        </div>
      </RiderDashboardShell>
    );
  }

  if (!rider || !locations || !identity || !prefs) {
    return (
      <RiderDashboardShell>
        <div className="rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-sm text-slate-200">
          Profile data missing.
        </div>
      </RiderDashboardShell>
    );
  }

  return (
    <RiderDashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-100">Profile</h1>
          {saving ? <span className="text-[11px] text-slate-400">Saving…</span> : null}
        </div>

        {err ? (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-[11px] text-amber-200">
            {err}
          </div>
        ) : null}

        {/* DESKTOP LAYOUT */}
        <div className="hidden items-start gap-6 lg:grid lg:grid-cols-3">
          <div className="lg:col-span-1">
            <ProfileSidebar rider={rider} verified={isVerified} activeSection={section} onSectionChange={handleSidebarClick} />
          </div>

          <section className="lg:col-span-2 rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-xs text-slate-200 sm:p-6">
            {section === "personalInfo" && <PersonalInfoPanel rider={rider} />}

            {section === "identity" && (
              <IdentityPanel
                view={identityView}
                identity={identity}
                onOpenGovernmentId={() => setIdentityView("governmentId")}
                onBackToMain={() => setIdentityView("main")}
                onSetGovernmentIdUrl={(url) => updateIdentityUrl("government-id", url)}
                onSetSelfieUrl={(url) => updateIdentityUrl("selfie", url)}
              />
            )}

            {section === "location" && <LocationPanel locations={locations} onRequestChange={(t) => setLocationChangeTarget(t)} />}

            {section === "payment" && <PaymentMethodsPanel methods={paymentMethods} />}

            {section === "security" && (
              <RiderSecurityPanel
                state={securityState}
                onOpenChangePassword={() => setShowChangePassword(true)}
                onToggleFace={() => {
                  setSecurityState((p) => ({ ...p, faceRecognition: !p.faceRecognition }));
                  updateSecurity({ faceRecognitionEnabled: !securityState.faceRecognition });
                }}
                onToggleTwoFactor={() => {
                  setSecurityState((p) => ({ ...p, twoFactorAuth: !p.twoFactorAuth }));
                  updateSecurity({ twoFactorEnabled: !securityState.twoFactorAuth });
                }}
              />
            )}

            {section === "settings" && (
              <SettingsPanel
                view={settingsView}
                language={prefs.language}
                prefs={prefs}
                onOpenLanguage={() => setSettingsView("language")}
                onOpenNotifications={() => setSettingsView("notifications")}
                onBackToMain={() => setSettingsView("main")}
                onChangeLanguage={(lang) => updateSettings({ language: lang })}
                onChangePrefs={(patch) => updateSettings(patch)}
              />
            )}
          </section>
        </div>

        {/* MOBILE LAYOUT */}
        <div className="space-y-4 lg:hidden">
          {mobileSection === null ? (
            <ProfileSidebar rider={rider} verified={isVerified} activeSection={section} onSectionChange={handleSidebarClick} />
          ) : (
            <MobileSectionContainer title={getSectionTitle(mobileSection)} onBack={closeMobileSection}>
              {mobileSection === "personalInfo" && <PersonalInfoPanel rider={rider} />}

              {mobileSection === "identity" && (
                <IdentityPanel
                  view={identityView}
                  identity={identity}
                  onOpenGovernmentId={() => setIdentityView("governmentId")}
                  onBackToMain={() => setIdentityView("main")}
                  onSetGovernmentIdUrl={(url) => updateIdentityUrl("government-id", url)}
                  onSetSelfieUrl={(url) => updateIdentityUrl("selfie", url)}
                />
              )}

              {mobileSection === "location" && <LocationPanel locations={locations} onRequestChange={(t) => setLocationChangeTarget(t)} />}

              {mobileSection === "payment" && <PaymentMethodsPanel methods={paymentMethods} />}

              {mobileSection === "security" && (
                <RiderSecurityPanel
                  state={securityState}
                  onOpenChangePassword={() => setShowChangePassword(true)}
                  onToggleFace={() => {
                    setSecurityState((p) => ({ ...p, faceRecognition: !p.faceRecognition }));
                    updateSecurity({ faceRecognitionEnabled: !securityState.faceRecognition });
                  }}
                  onToggleTwoFactor={() => {
                    setSecurityState((p) => ({ ...p, twoFactorAuth: !p.twoFactorAuth }));
                    updateSecurity({ twoFactorEnabled: !securityState.twoFactorAuth });
                  }}
                />
              )}

              {mobileSection === "settings" && (
                <SettingsPanel
                  view={settingsView}
                  language={prefs.language}
                  prefs={prefs}
                  onOpenLanguage={() => setSettingsView("language")}
                  onOpenNotifications={() => setSettingsView("notifications")}
                  onBackToMain={() => setSettingsView("main")}
                  onChangeLanguage={(lang) => updateSettings({ language: lang })}
                  onChangePrefs={(patch) => updateSettings(patch)}
                />
              )}
            </MobileSectionContainer>
          )}
        </div>
      </div>

      {/* LOCATION REQUEST OVERLAY */}
      {locationChangeTarget && (
        <ChangeLocationOverlay
          target={locationChangeTarget}
          initialValue={locationChangeTarget === "home" ? locations.homeAddress : locations.workAddress}
          onClose={() => setLocationChangeTarget(null)}
          onSave={(value) => requestLocationChange(locationChangeTarget, value)}
        />
      )}

      {/* CHANGE PASSWORD OVERLAY */}
      {showChangePassword && (
        <ChangePasswordOverlay
          onClose={() => setShowChangePassword(false)}
          onSave={(oldPassword, newPassword) => changePassword(oldPassword, newPassword)}
        />
      )}
    </RiderDashboardShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  SIDEBAR                                                                   */
/* -------------------------------------------------------------------------- */

function ProfileSidebar({
  rider,
  verified,
  activeSection,
  onSectionChange,
}: {
  rider: RiderProfile;
  verified: boolean;
  activeSection: ProfileSection;
  onSectionChange: (s: ProfileSection) => void;
}) {
  return (
    <aside className="space-y-4">
      <div className="rounded-2xl border border-slate-800 bg-[#050f25] px-5 py-5 text-xs text-slate-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-600">
              <Image src={rider.avatarUrl || "/maxwell.png"} alt={rider.name} fill className="object-cover" />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-slate-50">{rider.name || "-"}</div>
              <div className="text-[11px] text-slate-400">{rider.email || "-"}</div>
            </div>
          </div>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-medium ${
              verified ? "bg-emerald-500/10 text-emerald-400" : "bg-slate-500/10 text-slate-300"
            }`}
          >
            {verified ? "Verified" : "Not verified"}
          </span>
        </div>
      </div>

      <nav className="rounded-2xl border border-slate-800 bg-[#050f25] p-2 text-xs text-slate-200">
        <ProfileNavItem
          icon={<User className="h-3.5 w-3.5" />}
          title="Personal information"
          description="Account information"
          active={activeSection === "personalInfo"}
          onClick={() => onSectionChange("personalInfo")}
        />
        <ProfileNavItem
          icon={<IdCard className="h-3.5 w-3.5" />}
          title="Identity verification"
          description="Verify your identity with a government ID"
          active={activeSection === "identity"}
          onClick={() => onSectionChange("identity")}
        />
        <ProfileNavItem
          icon={<MapPin className="h-3.5 w-3.5" />}
          title="My location"
          description="Your approved home and work addresses"
          active={activeSection === "location"}
          onClick={() => onSectionChange("location")}
        />
        <ProfileNavItem
          icon={<CreditCard className="h-3.5 w-3.5" />}
          title="Payment method"
          description="Manage your saved payment options"
          active={activeSection === "payment"}
          onClick={() => onSectionChange("payment")}
        />
        <ProfileNavItem
          icon={<Shield className="h-3.5 w-3.5" />}
          title="Security"
          description="Protect your account"
          active={activeSection === "security"}
          onClick={() => onSectionChange("security")}
        />
        <ProfileNavItem
          icon={<SettingsIcon className="h-3.5 w-3.5" />}
          title="Settings"
          description="Preference"
          active={activeSection === "settings"}
          onClick={() => onSectionChange("settings")}
        />
      </nav>
    </aside>
  );
}

function ProfileNavItem({
  icon,
  title,
  description,
  active,
  onClick,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${
        active ? "bg-[#0b1735] text-slate-50" : "bg-transparent text-slate-200 hover:bg-[#060f24]"
      }`}
    >
      <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600/15 text-blue-400">
        {icon}
      </span>
      <div className="flex-1 space-y-0.5">
        <div className="text-[11px] font-semibold">{title}</div>
        <div className="text-[10px] text-slate-400">{description}</div>
      </div>
      <ChevronRight className="mt-1 h-3 w-3 text-slate-500" />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  MOBILE CONTAINER                                                          */
/* -------------------------------------------------------------------------- */

function MobileSectionContainer({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-xs text-slate-200">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
        >
          <ArrowLeft className="h-4 w-4 text-slate-200" />
        </button>
        <span className="text-sm font-semibold text-slate-100">{title}</span>
      </div>
      {children}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  SHARED                                                                    */
/* -------------------------------------------------------------------------- */

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-4 space-y-1">
      <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
      <p className="text-[11px] text-slate-400">{subtitle}</p>
    </header>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/70 px-4 py-3 last:border-b-0">
      <div>
        <div className="text-[11px] text-slate-400">{label}</div>
        <div className="text-[11px] font-medium text-slate-100">{value || "-"}</div>
      </div>
      <ChevronRight className="h-3 w-3 text-slate-500" />
    </div>
  );
}

function StatusPill({
  label,
  variant = "neutral",
}: {
  label: string;
  variant?: "success" | "danger" | "neutral";
}) {
  const base = "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium";
  const color =
    variant === "success"
      ? "bg-emerald-500/15 text-emerald-400"
      : variant === "danger"
      ? "bg-red-500/15 text-red-400"
      : "bg-slate-500/15 text-slate-300";

  return <span className={`${base} ${color}`}>{label}</span>;
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-4 w-7 items-center rounded-full border border-slate-600 transition-colors ${
        checked ? "bg-blue-500 border-blue-500" : "bg-slate-700"
      }`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-150 ${
          checked ? "translate-x-3" : "translate-x-0"
        }`}
      />
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/*  PANELS                                                                    */
/* -------------------------------------------------------------------------- */

function PersonalInfoPanel({ rider }: { rider: RiderProfile }) {
  return (
    <div className="space-y-4">
      <SectionHeader title="Personal information" subtitle="Your current account details." />

      <div className="flex flex-col items-center gap-3 pb-2">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-600">
          <Image src={rider.avatarUrl || "/maxwell.png"} alt={rider.name} fill className="object-cover" />
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-slate-100">{rider.name || "-"}</div>
          <div className="text-[11px] text-slate-400">{rider.email || "-"}</div>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#07152f] text-[11px]">
        <InfoRow label="Name" value={rider.name} />
        <InfoRow label="Email address" value={rider.email} />
        <InfoRow label="Location" value={rider.location} />
        <InfoRow label="Phone number" value={rider.phone} />
      </div>
    </div>
  );
}

function IdentityPanel({
  view,
  identity,
  onOpenGovernmentId,
  onBackToMain,
  onSetGovernmentIdUrl,
  onSetSelfieUrl,
}: {
  view: IdentityView;
  identity: {
    governmentId: { status: VerificationStatus; url: string };
    selfie: { status: VerificationStatus; url: string };
  };
  onOpenGovernmentId: () => void;
  onBackToMain: () => void;
  onSetGovernmentIdUrl: (url: string) => void;
  onSetSelfieUrl: (url: string) => void;
}) {
  if (view === "governmentId") {
    return (
      <GovernmentIdPanel
        onBackToMain={onBackToMain}
        currentUrl={identity.governmentId.url}
        status={identity.governmentId.status}
        onSaveUrl={onSetGovernmentIdUrl}
      />
    );
  }

  const gov = prettyStatus(identity.governmentId.status);
  const sf = prettyStatus(identity.selfie.status);

  return (
    <div className="space-y-4">
      <SectionHeader title="Identity verification" subtitle="Verify your identity with your government issued ID." />

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#07152f] text-[11px]">
        <button
          type="button"
          onClick={onOpenGovernmentId}
          className="flex w-full items-center justify-between border-b border-slate-800/70 px-4 py-3 text-left"
        >
          <div>
            <div className="text-[11px] font-semibold text-slate-100">Government ID</div>
            <div className="text-[10px] text-slate-400">Provide your official identification document.</div>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill label={gov.label} variant={gov.variant} />
            <ChevronRight className="h-3 w-3 text-slate-500" />
          </div>
        </button>

        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-[11px] font-semibold text-slate-100">Selfie</div>
            <div className="text-[10px] text-slate-400">Paste selfie URL for now (can be replaced with upload later).</div>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill label={sf.label} variant={sf.variant} />
            <button
              type="button"
              onClick={() => {
                const url = window.prompt("Paste selfie image URL:");
                if (url && url.trim()) onSetSelfieUrl(url.trim());
              }}
              className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-medium text-white hover:bg-blue-700"
            >
              Set URL
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function GovernmentIdPanel({
  onBackToMain,
  currentUrl,
  status,
  onSaveUrl,
}: {
  onBackToMain: () => void;
  currentUrl: string;
  status: VerificationStatus;
  onSaveUrl: (url: string) => void;
}) {
  const [docType] = useState("Government ID");
  const [url, setUrl] = useState(currentUrl || "");

  const st = prettyStatus(status);

  const handleSave = (e: FormEvent) => {
    e.preventDefault();
    const v = url.trim();
    if (!v) return;
    onSaveUrl(v);
  };

  return (
    <div className="space-y-4">
      <div className="mb-1 flex items-center gap-3">
        <button
          type="button"
          onClick={onBackToMain}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
        >
          <ArrowLeft className="h-4 w-4 text-slate-200" />
        </button>
        <span className="text-sm font-semibold text-slate-100">Government ID</span>
        <StatusPill label={st.label} variant={st.variant} />
      </div>

      <div className="space-y-4 rounded-2xl border border-slate-800 bg-[#07152f] p-4 text-[11px]">
        <div className="space-y-1">
          <label className="text-[11px] text-slate-400">Document type</label>
          <button type="button" className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-[#020818] px-3 py-2">
            <span className="text-[11px] text-slate-100">{docType}</span>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        <div className="flex justify-center pt-2">
          <div className="relative h-48 w-40 overflow-hidden rounded-2xl border-2 border-blue-500/60 bg-[#020818]">
            <img
              src={url || "/id-sample.png"}
              alt="Government ID preview"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        <form onSubmit={handleSave} className="space-y-2">
          <label className="text-[11px] text-slate-400">Government ID image URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-[#020818] px-3 py-2 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
            placeholder="https://..."
          />
          <button
            type="submit"
            className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save
          </button>
        </form>
      </div>
    </div>
  );
}

function LocationPanel({
  locations,
  onRequestChange,
}: {
  locations: LocationInfo;
  onRequestChange: (target: LocationTarget) => void;
}) {
  return (
    <div className="space-y-4">
      <SectionHeader title="My location" subtitle="Your approved home and work addresses." />

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#07152f] text-[11px]">
        <div className="flex items-center justify-between border-b border-slate-800/70 px-4 py-3">
          <div>
            <div className="text-[11px] font-semibold text-slate-100">{locations.homeAddress || "-"}</div>
            <div className="text-[10px] text-slate-400">Home address</div>
          </div>
          <button
            type="button"
            onClick={() => onRequestChange("home")}
            className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-medium text-white hover:bg-blue-700"
          >
            Request change
          </button>
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-[11px] font-semibold text-slate-100">{locations.workAddress || "-"}</div>
            <div className="text-[10px] text-slate-400">Work address</div>
          </div>
          <button
            type="button"
            onClick={() => onRequestChange("work")}
            className="rounded-full bg-blue-600 px-3 py-1 text-[10px] font-medium text-white hover:bg-blue-700"
          >
            Request change
          </button>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodsPanel({ methods }: { methods: PaymentMethod[] }) {
  return (
    <div className="space-y-4">
      <SectionHeader title="Payment method" subtitle="Your saved payment options." />

      {methods.length === 0 ? (
        <div className="rounded-2xl border border-slate-800 bg-[#07152f] p-4 text-[11px] text-slate-300">
          No payment methods added yet.
        </div>
      ) : (
        <div className="space-y-3 text-[11px]">
          {methods.map((m) => (
            <div
              key={m.id}
              className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#07152f] px-4 py-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#101a33] text-sm font-semibold text-slate-100">
                  {(m.label || "P")[0]}
                </div>
                <div>
                  <div className="text-[11px] font-medium text-slate-100">{m.label}</div>
                  <div className="mt-0.5 text-[10px] text-slate-400">{m.secondary || "-"}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {m.isDefault && <StatusPill label="Default" variant="neutral" />}
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#101a33] text-slate-300 hover:bg-[#131d3a]"
                >
                  <span className="text-[18px] leading-none">⋮</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RiderSecurityPanel({
  state,
  onOpenChangePassword,
  onToggleFace,
  onToggleTwoFactor,
}: {
  state: { faceRecognition: boolean; twoFactorAuth: boolean };
  onOpenChangePassword: () => void;
  onToggleFace: () => void;
  onToggleTwoFactor: () => void;
}) {
  return (
    <div className="space-y-4">
      <SectionHeader title="Security" subtitle="Protect your account settings." />

      <div className="rounded-2xl border border-slate-800 bg-[#07152f] text-[11px]">
        <button
          type="button"
          onClick={onOpenChangePassword}
          className="flex w-full items-center justify-between border-b border-slate-800/70 px-4 py-3 text-left"
        >
          <div>
            <div className="text-[11px] font-semibold text-slate-100">Change password</div>
            <div className="text-[10px] text-slate-400">Update your login password.</div>
          </div>
          <ChevronRight className="h-3 w-3 text-slate-500" />
        </button>

        <div className="flex items-center justify-between border-b border-slate-800/70 px-4 py-3">
          <div>
            <div className="text-[11px] font-semibold text-slate-100">Face recognition</div>
            <div className="text-[10px] text-slate-400">Sign in securely using your face.</div>
          </div>
          <Toggle checked={state.faceRecognition} onChange={onToggleFace} />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-[11px] font-semibold text-slate-100">Two-Factor Authentication</div>
            <div className="text-[10px] text-slate-400">Add an extra layer of security.</div>
          </div>
          <Toggle checked={state.twoFactorAuth} onChange={onToggleTwoFactor} />
        </div>
      </div>
    </div>
  );
}

function SettingsPanel({
  view,
  language,
  prefs,
  onOpenLanguage,
  onOpenNotifications,
  onBackToMain,
  onChangeLanguage,
  onChangePrefs,
}: {
  view: SettingsView;
  language: LanguageOption;
  prefs: { rideUpdates: boolean; paymentAlerts: boolean; shiftReminders: boolean; serviceAlerts: boolean; language: LanguageOption };
  onOpenLanguage: () => void;
  onOpenNotifications: () => void;
  onBackToMain: () => void;
  onChangeLanguage: (value: LanguageOption) => void;
  onChangePrefs: (patch: Partial<typeof prefs>) => void;
}) {
  if (view === "language") {
    return (
      <LanguagePreferencePanel selected={language} onSelectLanguage={onChangeLanguage} onBackToMain={onBackToMain} />
    );
  }

  if (view === "notifications") {
    return (
      <NotificationPreferencePanel
        prefs={prefs}
        onBackToMain={onBackToMain}
        onChange={(patch) => onChangePrefs(patch)}
      />
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Settings" subtitle="Manage your language and notification preferences." />

      <div className="rounded-2xl border border-slate-800 bg-[#07152f] text-[11px]">
        <button
          type="button"
          onClick={onOpenLanguage}
          className="flex w-full items-center justify-between border-b border-slate-800/70 px-4 py-3 text-left"
        >
          <div>
            <div className="text-[11px] font-semibold text-slate-100">Language preference</div>
            <div className="text-[10px] text-slate-400">Switch between English and Spanish.</div>
          </div>
          <div className="ml-4 flex items-center gap-2 text-[10px] text-slate-400">
            <span className="text-[11px] text-slate-200">{language}</span>
            <ChevronRight className="h-3 w-3 text-slate-500" />
          </div>
        </button>

        <button
          type="button"
          onClick={onOpenNotifications}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <div>
            <div className="text-[11px] font-semibold text-slate-100">Notifications preference</div>
            <div className="text-[10px] text-slate-400">Choose which updates you receive.</div>
          </div>
          <ChevronRight className="h-3 w-3 text-slate-500" />
        </button>
      </div>
    </div>
  );
}

function LanguagePreferencePanel({
  selected,
  onSelectLanguage,
  onBackToMain,
}: {
  selected: LanguageOption;
  onSelectLanguage: (value: LanguageOption) => void;
  onBackToMain: () => void;
}) {
  const languages: LanguageOption[] = ["English", "Spanish"];

  return (
    <div className="space-y-4">
      <div className="mb-1 flex items-center gap-3">
        <button
          type="button"
          onClick={onBackToMain}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
        >
          <ArrowLeft className="h-4 w-4 text-slate-200" />
        </button>
        <span className="text-sm font-semibold text-slate-100">Language</span>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#07152f] text-[11px]">
        {languages.map((lang, idx) => (
          <button
            key={lang}
            type="button"
            onClick={() => onSelectLanguage(lang)}
            className={`flex w-full items-center justify-between px-4 py-3 text-left ${
              idx !== languages.length - 1 ? "border-b border-slate-800/70" : ""
            }`}
          >
            <span className="text-[11px] text-slate-100">{lang}</span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-600">
              {selected === lang && <span className="h-2 w-2 rounded-full bg-blue-500" />}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function NotificationPreferencePanel({
  prefs,
  onBackToMain,
  onChange,
}: {
  prefs: { rideUpdates: boolean; paymentAlerts: boolean; shiftReminders: boolean; serviceAlerts: boolean };
  onBackToMain: () => void;
  onChange: (patch: Partial<typeof prefs>) => void;
}) {
  const toggle = (key: keyof typeof prefs) => onChange({ [key]: !prefs[key] } as any);

  return (
    <div className="space-y-4">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Notification preference</h2>
          <p className="text-[11px] text-slate-400">Choose which updates you receive.</p>
        </div>
        <button
          type="button"
          onClick={onBackToMain}
          className="rounded-full border border-slate-700 bg-transparent px-3 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
        >
          Back
        </button>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-[#07152f] text-[11px]">
        <NotificationRow
          title="Ride Updates"
          description="Get alerts for ride changes."
          trailing={<Toggle checked={prefs.rideUpdates} onChange={() => toggle("rideUpdates")} />}
        />
        <NotificationRow
          title="Payment & Billing Alerts"
          description="Receive confirmations for payments."
          trailing={<Toggle checked={prefs.paymentAlerts} onChange={() => toggle("paymentAlerts")} />}
        />
        <NotificationRow
          title="Shift & Schedule Reminders"
          description="Get reminders for scheduled rides."
          trailing={<Toggle checked={prefs.shiftReminders} onChange={() => toggle("shiftReminders")} />}
        />
        <NotificationRow
          title="Service Alerts & Safety Notices"
          description="Be notified about system maintenance."
          trailing={<Toggle checked={prefs.serviceAlerts} onChange={() => toggle("serviceAlerts")} />}
        />
      </div>
    </div>
  );
}

function NotificationRow({
  title,
  description,
  trailing,
}: {
  title: string;
  description: string;
  trailing: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/70 px-4 py-3 last:border-b-0">
      <div>
        <div className="text-[11px] font-semibold text-slate-100">{title}</div>
        <div className="text-[10px] text-slate-400">{description}</div>
      </div>
      {trailing}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  OVERLAYS                                                                  */
/* -------------------------------------------------------------------------- */

function ChangeLocationOverlay({
  target,
  initialValue,
  onClose,
  onSave,
}: {
  target: LocationTarget;
  initialValue: string;
  onClose: () => void;
  onSave: (value: string) => void;
}) {
  const [address, setAddress] = useState(initialValue);

  const label = target === "home" ? "Home address" : "Work address";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-[#050f25] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-3 text-xs text-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] font-medium">Change location</span>
        </div>

        <div className="space-y-4 px-6 py-6 text-xs text-slate-200">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">{label}</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Write"
              className="w-full rounded-lg border border-slate-700 bg-[#020818] px-3 py-2 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => onSave(address)}
            className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Send request
          </button>
        </div>
      </div>
    </div>
  );
}

function ChangePasswordOverlay({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (oldPassword: string, newPassword: string) => void;
}) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-[#050f25] shadow-2xl">
        <div className="flex items-center gap-3 border-b border-slate-800 px-5 py-3 text-xs text-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] font-medium">Change password</span>
        </div>

        <div className="space-y-4 px-6 py-6 text-xs text-slate-200">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">Old password</label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              placeholder="Write"
              className="w-full rounded-lg border border-slate-700 bg-[#020818] px-3 py-2 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400">New password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Write"
              className="w-full rounded-lg border border-slate-700 bg-[#020818] px-3 py-2 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => onSave(oldPassword, newPassword)}
            className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}
