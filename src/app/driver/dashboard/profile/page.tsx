// src/app/driver/dashboard/profile/page.tsx
"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import Image from "next/image";
import { DriverDashboardShell } from "@/src/components/DriverDashboardShell";
import { apiFetch, API_URL, type ApiFail } from "@/src/lib/api";
import {
  User,
  FileText,
  MapPin,
  Car,
  Shield,
  SlidersHorizontal,
  HelpCircle,
  LogOut,
  CheckCircle2,
  Lock,
  ChevronRight,
  ArrowLeft,
  X,
  Send,
  UploadCloud,
  Pencil,
  Loader2,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  TYPES                                                                     */
/* -------------------------------------------------------------------------- */

type ProfileSection =
  | "driverInfo"
  | "documents"
  | "workLocation"
  | "vehicleDetails"
  | "security"
  | "preference"
  | "support";

type DriverProfile = {
  name: string;
  email: string;
  location: string;
  phone: string;
  rating: number;
  trips: number;
  totalEarned: number;
  avatarUrl?: string | null;
};

type DriverDocument = {
  id: string;
  title: string;
  status: "verified" | "pending";
  url?: string | null;
};

type WorkLocation = {
  siteName: string;
  address: string;
};

type VehicleDetailItem = {
  id: string;
  label: string;
  value: string;
};

type SupportChannel = "chat" | "email";

type SupportMessage = {
  id: string;
  author: "driver" | "agent";
  text: string;
  time: string;
};

type SupportConversation = {
  id: string;
  name: string;
  tagLine: string;
  lastTime: string;
  unread?: boolean;
  messages: SupportMessage[];
};

type MobileSupportView = "list" | "chat";

type ProfileApiResponse = {
  ok: true;
  driver: DriverProfile;
  documents: DriverDocument[];
  workLocation: WorkLocation;
  vehicle: { imageUrl: string | null; details: VehicleDetailItem[] };
  security: { faceRecognition: boolean; twoFactorAuth: boolean };
  preference: {
    language: string;
    notifications: {
      rideUpdates: boolean;
      paymentAlerts: boolean;
      shiftReminders: boolean;
      serviceAlerts: boolean;
    };
  };
  supportConversations: SupportConversation[];
};

type PatchSecurityRes = {
  ok: true;
  security: { faceRecognition: boolean; twoFactorAuth: boolean };
};

type PatchPrefsRes = {
  ok: true;
  preference: {
    language: string;
    notifications: {
      rideUpdates: boolean;
      paymentAlerts: boolean;
      shiftReminders: boolean;
      serviceAlerts: boolean;
    };
  };
};

type WorkLocationRes = { ok: true; workLocation: WorkLocation };

type SendMessageRes = {
  ok: true;
  message: SupportMessage;
};

type UploadVehicleImageRes = {
  ok: true;
  imageUrl: string;
  vehicle?: unknown;
};

/* -------------------------------------------------------------------------- */
/*  HELPERS                                                                   */
/* -------------------------------------------------------------------------- */

function getSectionTitle(section: ProfileSection): string {
  switch (section) {
    case "driverInfo":
      return "Driver info";
    case "documents":
      return "Documents";
    case "workLocation":
      return "Work location";
    case "vehicleDetails":
      return "Vehicle details";
    case "security":
      return "Security";
    case "preference":
      return "Preference";
    case "support":
      return "Support";
  }
}

function apiErrorToText(e: unknown) {
  const err = e as Partial<ApiFail>;
  if (err?.status === 401) return "Unauthorized. Please login again.";
  if (err?.error) return `${err.error}${err.status ? ` (HTTP ${err.status})` : ""}`;
  return "Something went wrong.";
}

function assetUrl(u?: string | null) {
  if (!u) return null;
  if (u.startsWith("http://") || u.startsWith("https://")) return u;
  // backend returns "/uploads/xxx"
  if (u.startsWith("/")) return `${API_URL}${u}`;
  return `${API_URL}/${u}`;
}

function fmtMoney(x: number) {
  return `$${Number.isFinite(x) ? x : 0}`;
}

function pickAuthTokenFromStorage(): string | null {
  if (typeof window === "undefined") return null;
  // try common keys (in case your apiFetch uses one of these)
  const keys = ["accessToken", "token", "authToken", "jwt", "ACCESS_TOKEN"];
  for (const k of keys) {
    const v = window.localStorage.getItem(k);
    if (v && v.trim()) return v;
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/*  PAGE                                                                      */
/* -------------------------------------------------------------------------- */

const FALLBACK_DRIVER: DriverProfile = {
  name: "—",
  email: "—",
  location: "—",
  phone: "—",
  rating: 0,
  trips: 0,
  totalEarned: 0,
  avatarUrl: null,
};

const FALLBACK_WORK_LOCATION: WorkLocation = { siteName: "—", address: "—" };

export default function DriverProfilePage() {
  // Desktop section
  const [section, setSection] = useState<ProfileSection>("driverInfo");

  const [avatarUploading, setAvatarUploading] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Mobile section (null = show only sidebar)
  const [mobileSection, setMobileSection] = useState<ProfileSection | null>(null);

  const [preferenceView, setPreferenceView] = useState<"main" | "notifications">("main");
  const [showEditVehicle, setShowEditVehicle] = useState(false);
  // Data states (real backend)
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const [driver, setDriver] = useState<DriverProfile>(FALLBACK_DRIVER);
  const [documents, setDocuments] = useState<DriverDocument[]>([]);
  const [workLocation, setWorkLocation] = useState<WorkLocation>(FALLBACK_WORK_LOCATION);
  const [vehicle, setVehicle] = useState<{ imageUrl: string | null; details: VehicleDetailItem[] }>({
    imageUrl: null,
    details: [],
  });

  const [vehicleImageUploading, setVehicleImageUploading] = useState(false);

  const [securityState, setSecurityState] = useState({
    faceRecognition: true,
    twoFactorAuth: false,
  });

  const [preference, setPreference] = useState<ProfileApiResponse["preference"]>({
    language: "English",
    notifications: {
      rideUpdates: true,
      paymentAlerts: true,
      shiftReminders: true,
      serviceAlerts: true,
    },
  });

  const [showChangeLocation, setShowChangeLocation] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);

  // Support state (shared between desktop + mobile)
  const [supportTab, setSupportTab] = useState<SupportChannel>("chat");
  const [supportConversations, setSupportConversations] = useState<SupportConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>("");
  const [mobileSupportView, setMobileSupportView] = useState<MobileSupportView>("list");

  const activeConversation = useMemo(() => {
    const found = supportConversations.find((c) => c.id === activeConversationId);
    return found ?? supportConversations[0];
  }, [supportConversations, activeConversationId]);

  async function loadProfile() {
    setActionError(null);
    setPageError(null);
    setLoading(true);
    try {
      // ✅ IMPORTANT: backend route is /driver/profile (NOT /api/driver/profile)
      const data = await apiFetch<ProfileApiResponse>("/driver/profile", {
        method: "GET",
        noStore: true,
      });

      setDriver(data.driver);
      setDocuments(data.documents ?? []);
      setWorkLocation(data.workLocation ?? FALLBACK_WORK_LOCATION);
      setVehicle(data.vehicle ?? { imageUrl: null, details: [] });
      setSecurityState({
        faceRecognition: !!data.security?.faceRecognition,
        twoFactorAuth: !!data.security?.twoFactorAuth,
      });
      setPreference(data.preference ?? preference);
      setSupportConversations(data.supportConversations ?? []);
      const firstId = data.supportConversations?.[0]?.id ?? "";
      setActiveConversationId(firstId);
    } catch (e) {
      setPageError(apiErrorToText(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSidebarClick = (next: ProfileSection) => {
    setSection(next);
    setPreferenceView("main");
    setMobileSection(next);
    if (next === "support") setMobileSupportView("list");
  };

  const closeMobileSection = () => {
    setMobileSection(null);
    setPreferenceView("main");
  };

  async function patchSecurity(partial: Partial<{ faceRecognition: boolean; twoFactorAuth: boolean }>) {
    setActionError(null);

    // optimistic update
    setSecurityState((prev) => ({ ...prev, ...partial }));

    try {
      const res = await apiFetch<PatchSecurityRes>("/driver/profile/security", {
        method: "PATCH",
        json: partial,
      });

      setSecurityState({
        faceRecognition: res.security.faceRecognition,
        twoFactorAuth: res.security.twoFactorAuth,
      });
    } catch (e) {
      setActionError(apiErrorToText(e));
      void loadProfile();
    }
  }

  async function patchPrefs(
    partial:
      | ({ language: string } & Partial<ProfileApiResponse["preference"]["notifications"]>)
      | Partial<ProfileApiResponse["preference"]["notifications"]>
  ) {
    setActionError(null);

    // optimistic
    setPreference((prev) => ({
      ...prev,
      ...(typeof (partial as any).language === "string" ? { language: (partial as any).language } : {}),
      notifications: { ...prev.notifications, ...(partial as any) },
    }));

    try {
      const res = await apiFetch<PatchPrefsRes>("/driver/profile/preferences", {
        method: "PATCH",
        json: partial,
      });
      setPreference(res.preference);
    } catch (e) {
      setActionError(apiErrorToText(e));
      void loadProfile();
    }
  }

  async function submitWorkLocation(values: WorkLocation) {
    setActionError(null);
    try {
      const res = await apiFetch<WorkLocationRes>("/driver/profile/work-location/request", {
        method: "POST",
        json: values,
      });
      setWorkLocation(res.workLocation);
      setShowChangeLocation(false);
    } catch (e) {
      setActionError(apiErrorToText(e));
    }
  }

  async function changePassword(oldPassword: string, newPassword: string) {
    setActionError(null);
    try {
      await apiFetch<{ ok: true }>("/driver/profile/change-password", {
        method: "POST",
        json: { oldPassword, newPassword },
      });
      setShowChangePassword(false);
    } catch (e) {
      setActionError(apiErrorToText(e));
    }
  }

  async function sendSupportMessage(conversationId: string, text: string) {
    setActionError(null);
    try {
      const res = await apiFetch<SendMessageRes>(
        `/driver/profile/support/conversations/${conversationId}/messages`,
        { method: "POST", json: { text } }
      );

      setSupportConversations((prev) =>
        prev.map((c) => {
          if (c.id !== conversationId) return c;
          const messages = [...(c.messages ?? []), res.message];
          return {
            ...c,
            messages,
            tagLine: res.message.text.slice(0, 80),
            lastTime: "just now",
            unread: false,
          };
        })
      );
    } catch (e) {
      setActionError(apiErrorToText(e));
    }
  }

  // ✅ NEW: upload vehicle image (multipart/form-data) -> POST /driver/profile/vehicle/image
  async function uploadVehicleImage(file: File) {
    setActionError(null);

    // basic client validation
    if (!file.type.startsWith("image/")) {
      setActionError("Please select an image file.");
      return;
    }
    if (file.size > 7 * 1024 * 1024) {
      setActionError("Image is too large. Max 7MB.");
      return;
    }

    setVehicleImageUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const token = pickAuthTokenFromStorage();

      const resp = await fetch(`${API_URL}/driver/profile/vehicle/image`, {
        method: "POST",
        body: form,
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const raw = await resp.text();
      let parsed: any = {};
      try {
        parsed = raw ? JSON.parse(raw) : {};
      } catch {
        parsed = {};
      }

      if (!resp.ok) {
        const err: ApiFail = {
          status: resp.status,
          error: parsed?.error || `HTTP_${resp.status}`,
          details: parsed,
        };
        throw err;
      }

      const data = parsed as UploadVehicleImageRes;
      if (!data?.ok || !data?.imageUrl) {
        const err: ApiFail = { status: 500, error: "UPLOAD_FAILED", details: data };
        throw err;
      }

      // update UI instantly
      setVehicle((prev) => ({ ...prev, imageUrl: data.imageUrl }));

      // optional: reload to keep everything synced
      void loadProfile();
    } catch (e) {
      setActionError(apiErrorToText(e));
    } finally {
      setVehicleImageUploading(false);
    }
  }
  function clearAuthStorage() {
    if (typeof window === "undefined") return;

    const keys = [
      "accessToken",
      "token",
      "authToken",
      "jwt",
      "ACCESS_TOKEN",
      "refreshToken",
    ];

    for (const k of keys) {
      window.localStorage.removeItem(k);
      window.sessionStorage.removeItem(k);
    }
  }

  async function uploadAvatarImage(file: File) {
    setActionError(null);

    if (!file.type.startsWith("image/")) {
      setActionError("Please select an image file.");
      return;
    }
    if (file.size > 7 * 1024 * 1024) {
      setActionError("Image is too large. Max 7MB.");
      return;
    }

    setAvatarUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);

      const token = pickAuthTokenFromStorage();

      const resp = await fetch(`${API_URL}/driver/profile/avatar/image`, {
        method: "POST",
        body: form,
        credentials: "include",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      const raw = await resp.text();
      let parsed: any = {};
      try {
        parsed = raw ? JSON.parse(raw) : {};
      } catch {
        parsed = {};
      }

      if (!resp.ok) {
        const err: ApiFail = {
          status: resp.status,
          error: parsed?.error || `HTTP_${resp.status}`,
          details: parsed,
        };
        throw err;
      }

      if (!parsed?.ok || !parsed?.avatarUrl) {
        const err: ApiFail = { status: 500, error: "UPLOAD_FAILED", details: parsed };
        throw err;
      }

      // update UI instantly
      setDriver((prev) => ({ ...prev, avatarUrl: parsed.avatarUrl }));

      // keep everything synced
      void loadProfile();
    } catch (e) {
      setActionError(apiErrorToText(e));
    } finally {
      setAvatarUploading(false);
    }
  }

  async function handleLogout() {
    setActionError(null);
    setLoggingOut(true);

    try {
      // attempt backend cookie/session logout
      await apiFetch<{ ok: true }>("/driver/profile/logout", { method: "POST" });
    } catch {
      // ignore (still clear local tokens)
    } finally {
      clearAuthStorage();
      // hard redirect is most reliable
      window.location.href = "/driver/login";
    }
  }

  const avatar = assetUrl(driver.avatarUrl) ?? "/driver-selfie.jpg";
  const vehicleImg = assetUrl(vehicle.imageUrl);

  return (
    <DriverDashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-100">Profile</h1>
        </div>

        {/* Errors / Loading */}
        {pageError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            {pageError}
          </div>
        )}
        {actionError && (
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-xs text-amber-200">
            {actionError}
          </div>
        )}

        {/* DESKTOP LAYOUT (sidebar + content) */}
        <div className="hidden items-start gap-6 lg:grid lg:grid-cols-3">
          {/* LEFT COLUMN (1/3) */}
          <div className="lg:col-span-1">
            <ProfileSidebar
              driver={driver}
              avatarSrc={avatar}
              loading={loading}
              activeSection={section}
              onSectionChange={handleSidebarClick}
              avatarUploading={avatarUploading}
              onUploadAvatar={(f) => void uploadAvatarImage(f)}
              loggingOut={loggingOut}
              onLogout={() => void handleLogout()}
            />
          </div>

          {/* RIGHT COLUMN (2/3) */}
          <section className="lg:col-span-2 rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-xs text-slate-200 sm:p-6">
            {section === "driverInfo" && <DriverInfoPanel driver={driver} />}

            {section === "documents" && <DocumentsPanel documents={documents} />}

            {section === "workLocation" && (
              <WorkLocationPanel
                workLocation={workLocation}
                onRequestChange={() => setShowChangeLocation(true)}
              />
            )}

            {section === "vehicleDetails" && (
              <VehicleDetailsPanel
                vehicleImageUrl={vehicleImg}
                vehicleDetails={vehicle.details}
                uploading={vehicleImageUploading}
                onUploadImage={(f) => void uploadVehicleImage(f)}
                onEditDetails={() => setShowEditVehicle(true)}
              />
            )}

            {section === "security" && (
              <SecurityPanel
                state={securityState}
                onOpenChangePassword={() => setShowChangePassword(true)}
                onToggleFace={() => void patchSecurity({ faceRecognition: !securityState.faceRecognition })}
                onToggleTwoFactor={() => void patchSecurity({ twoFactorAuth: !securityState.twoFactorAuth })}
              />
            )}

            {section === "preference" && (
              <PreferencePanel
                view={preferenceView}
                preference={preference}
                onOpenNotifications={() => setPreferenceView("notifications")}
                onBackToMain={() => setPreferenceView("main")}
                onToggleNotification={(key) =>
                  void patchPrefs({ [key]: !preference.notifications[key] } as Partial<
                    ProfileApiResponse["preference"]["notifications"]
                  >)
                }
              />
            )}

            {section === "support" && activeConversation && (
              <SupportPanelDesktop
                tab={supportTab}
                onTabChange={setSupportTab}
                conversations={supportConversations}
                activeConversation={activeConversation}
                onSelectConversation={setActiveConversationId}
                onSend={(text) => void sendSupportMessage(activeConversation.id, text)}
              />
            )}
          </section>
        </div>

        {/* MOBILE LAYOUT */}
        <div className="space-y-4 lg:hidden">
          {mobileSection === null ? (
            <ProfileSidebar
              driver={driver}
              avatarSrc={avatar}
              loading={loading}
              activeSection={section}
              onSectionChange={handleSidebarClick}
            />
          ) : mobileSection === "support" ? (
            <SupportPanelMobile
              tab={supportTab}
              onTabChange={setSupportTab}
              conversations={supportConversations}
              activeConversation={activeConversation}
              onSelectConversation={setActiveConversationId}
              view={mobileSupportView}
              onChangeView={setMobileSupportView}
              onBackFromSection={closeMobileSection}
              onSend={(text) =>
                activeConversation ? void sendSupportMessage(activeConversation.id, text) : undefined
              }
            />
          ) : (
            <MobileSectionContainer title={getSectionTitle(mobileSection)} onBack={closeMobileSection}>
              {mobileSection === "driverInfo" && <DriverInfoPanel driver={driver} />}

              {mobileSection === "documents" && <DocumentsPanel documents={documents} />}

              {mobileSection === "workLocation" && (
                <WorkLocationPanel
                  workLocation={workLocation}
                  onRequestChange={() => setShowChangeLocation(true)}
                />
              )}

              {mobileSection === "vehicleDetails" && (
                <VehicleDetailsPanel
                  vehicleImageUrl={vehicleImg}
                  vehicleDetails={vehicle.details}
                  uploading={vehicleImageUploading}
                  onUploadImage={(f) => void uploadVehicleImage(f)}
                />
              )}

              {mobileSection === "security" && (
                <SecurityPanel
                  state={securityState}
                  onOpenChangePassword={() => setShowChangePassword(true)}
                  onToggleFace={() => void patchSecurity({ faceRecognition: !securityState.faceRecognition })}
                  onToggleTwoFactor={() => void patchSecurity({ twoFactorAuth: !securityState.twoFactorAuth })}
                />
              )}

              {mobileSection === "preference" && (
                <PreferencePanel
                  view={preferenceView}
                  preference={preference}
                  onOpenNotifications={() => setPreferenceView("notifications")}
                  onBackToMain={() => setPreferenceView("main")}
                  onToggleNotification={(key) =>
                    void patchPrefs({ [key]: !preference.notifications[key] } as Partial<
                      ProfileApiResponse["preference"]["notifications"]
                    >)
                  }
                />
              )}
            </MobileSectionContainer>
          )}
        </div>

        {/* CHANGE LOCATION OVERLAY */}
        {showChangeLocation && (
          <ChangeLocationOverlay
            initialValues={workLocation}
            onClose={() => setShowChangeLocation(false)}
            onSave={(values) => void submitWorkLocation(values)}
          />
        )}
        {showEditVehicle && (
          <EditVehicleOverlay
            initialDetails={vehicle.details}
            onClose={() => setShowEditVehicle(false)}
            onSave={(updated) => {
              // call backend PATCH here
              setVehicle((prev) => ({ ...prev, details: updated }));
              setShowEditVehicle(false);
            }}
          />
        )}

        {/* CHANGE PASSWORD OVERLAY */}
        {showChangePassword && (
          <ChangePasswordOverlay
            onClose={() => setShowChangePassword(false)}
            onSave={(oldPassword, newPassword) => void changePassword(oldPassword, newPassword)}
          />
        )}
      </div>
    </DriverDashboardShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  LEFT SIDEBAR                                                              */
/* -------------------------------------------------------------------------- */
function ProfileSidebar({
  driver,
  avatarSrc,
  loading,
  activeSection,
  onSectionChange,
  avatarUploading,
  onUploadAvatar,
  loggingOut,
  onLogout,
}: {
  driver: DriverProfile;
  avatarSrc: string;
  loading: boolean;
  activeSection: ProfileSection;
  onSectionChange: (s: ProfileSection) => void;
  avatarUploading?: boolean;
  onUploadAvatar?: (file: File) => void;
  loggingOut?: boolean;
  onLogout?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  return (
    <aside className="space-y-4">
      {/* Driver summary card */}
      <div className="rounded-2xl border border-slate-800 bg-[#050f25] px-5 py-6 text-xs text-slate-200">
        <div className="flex flex-col items-center gap-3">
  <div className="relative">
    <input
      ref={fileRef}
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const f = e.target.files?.[0];
        e.target.value = "";
        if (!f) return;
        onUploadAvatar?.(f);
      }}
    />

    <button
      type="button"
      onClick={() => fileRef.current?.click()}
      disabled={!!avatarUploading}
      className="relative h-16 w-16 overflow-hidden rounded-full border border-slate-600"
      title="Change profile photo"
    >
      <img src={avatarSrc} alt={driver.name} className="h-full w-full object-cover" />

      {/* dark overlay on hover */}
      <span className="absolute inset-0 bg-black/0 transition hover:bg-black/20" />

      {/* pencil icon */}
      <span className="absolute bottom-1 right-1 inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#020818] border border-slate-700">
        {avatarUploading ? (
          <Loader2 className="h-4 w-4 animate-spin text-slate-200" />
        ) : (
          <Pencil className="h-4 w-4 text-slate-200" />
        )}
      </span>
    </button>
  </div>

          <div className="space-y-0.5 text-center">
            <div className="text-sm font-semibold text-slate-50">{loading ? "Loading..." : driver.name}</div>
            <div className="text-[11px] text-slate-400">{driver.email}</div>
            <div className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
              <CheckCircle2 className="h-3 w-3" />
              <span>Verified</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <SidebarStat label="Ratings" value={driver.rating.toFixed(1)} />
          <SidebarStat label="Trips" value={driver.trips.toString()} />
          <SidebarStat label="Total Earned" value={fmtMoney(driver.totalEarned)} />
        </div>
      </div>

      {/* Menu */}
      <nav className="rounded-2xl border border-slate-800 bg-[#050f25] p-2 text-xs text-slate-200">
        <ProfileNavItem
          icon={<User className="h-3.5 w-3.5" />}
          title="Driver info"
          description="Update your personal details & contact information"
          active={activeSection === "driverInfo"}
          onClick={() => onSectionChange("driverInfo")}
        />
        <ProfileNavItem
          icon={<FileText className="h-3.5 w-3.5" />}
          title="Documents"
          description="Upload and manage your required documents"
          active={activeSection === "documents"}
          onClick={() => onSectionChange("documents")}
        />
        <ProfileNavItem
          icon={<MapPin className="h-3.5 w-3.5" />}
          title="Work location"
          description="Your primary worksite"
          active={activeSection === "workLocation"}
          onClick={() => onSectionChange("workLocation")}
        />
        <ProfileNavItem
          icon={<Car className="h-3.5 w-3.5" />}
          title="Vehicle details"
          description="Keep your vehicle information up to date"
          active={activeSection === "vehicleDetails"}
          onClick={() => onSectionChange("vehicleDetails")}
        />
        <ProfileNavItem
          icon={<Shield className="h-3.5 w-3.5" />}
          title="Security"
          description="Protect your account with password controls"
          active={activeSection === "security"}
          onClick={() => onSectionChange("security")}
        />
        <ProfileNavItem
          icon={<SlidersHorizontal className="h-3.5 w-3.5" />}
          title="Preference"
          description="Customize your app experience"
          active={activeSection === "preference"}
          onClick={() => onSectionChange("preference")}
        />
        <ProfileNavItem
          icon={<HelpCircle className="h-3.5 w-3.5" />}
          title="Support"
          description="Access help articles, contact support"
          active={activeSection === "support"}
          onClick={() => onSectionChange("support")}
        />
      </nav>

      {/* Switch to rider + logout */}
      <div className="space-y-2">
        <div className="flex items-center justify-between rounded-2xl border border-slate-800 bg-[#050f25] px-4 py-3 text-xs">
          <div className="space-y-0.5">
            <div className="font-medium text-slate-100">Switch to a rider</div>
            <div className="text-[11px] text-slate-500">Use app as a rider</div>
          </div>

          <Toggle
            checked
            onChange={() => {
              // later: route to rider dashboard
            }}
          />
        </div>

<button
  type="button"
  onClick={onLogout}
  disabled={!!loggingOut}
  className={`flex w-full items-center justify-center gap-2 rounded-full px-4 py-2 text-xs font-medium
    ${loggingOut ? "cursor-not-allowed bg-red-500/10 text-red-300" : "bg-red-500/10 text-red-400 hover:bg-red-500/15"}`}
>
  <LogOut className="h-3.5 w-3.5" />
  <span>{loggingOut ? "Logging out..." : "Logout"}</span>
</button>
      </div>
    </aside>
  );
}

function SidebarStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col items-center rounded-xl bg-[#07152f] px-2 py-3">
      <div className="text-sm font-semibold text-slate-50">{value}</div>
      <div className="mt-0.5 text-[11px] text-slate-400">{label}</div>
    </div>
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
      className={`flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${active ? "bg-[#0b1735] text-slate-50" : "bg-transparent text-slate-200 hover:bg-[#060f24]"
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
/*  MOBILE SECTION CONTAINER                                                  */
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
/*  RIGHT-SIDE PANELS                                                         */
/* -------------------------------------------------------------------------- */

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <header className="mb-4 space-y-1">
      <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
      <p className="text-[11px] text-slate-400">{subtitle}</p>
    </header>
  );
}

/* -- Driver Info ----------------------------------------------------------- */

function DriverInfoPanel({ driver }: { driver: DriverProfile }) {
  return (
    <div className="space-y-4">
      <SectionHeader title="Driver info" subtitle="Update your personal details & contact information." />

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#07152f] text-[11px]">
        <InfoRow label="Name" value={driver.name} badge="Default" />
        <InfoRow label="Email address" value={driver.email} />
        <InfoRow label="Location" value={driver.location} />
        <InfoRow label="Phone number" value={driver.phone} />
      </div>
    </div>
  );
}

function InfoRow({ label, value, badge }: { label: string; value: string; badge?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/70 px-4 py-3 last:border-b-0">
      <div>
        <div className="text-[11px] text-slate-400">{label}</div>
        <div className="text-[11px] font-medium text-slate-100">{value}</div>
      </div>
      {badge && <span className="rounded-full bg-slate-800 px-3 py-1 text-[10px] text-slate-300">{badge}</span>}
    </div>
  );
}

/* -- Documents ------------------------------------------------------------- */

function DocumentsPanel({ documents }: { documents: DriverDocument[] }) {
  return (
    <div className="space-y-4">
      <SectionHeader title="Documents" subtitle="Upload and manage your required documents." />

      <div className="space-y-3">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="space-y-2 rounded-2xl border border-slate-800 bg-[#07152f] px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-900">
                  <FileText className="h-4 w-4 text-slate-200" />
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-slate-100">{doc.title}</div>
                  <div className="text-[10px] text-slate-500">Uploaded document</div>
                </div>
              </div>

              {doc.status === "verified" && (
                <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-[10px] font-medium text-emerald-400">
                  Verified
                </span>
              )}
              {doc.status === "pending" && (
                <span className="rounded-full bg-amber-500/10 px-3 py-1 text-[10px] font-medium text-amber-300">
                  Pending
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                className="w-full rounded-lg border border-slate-700 bg-transparent px-3 py-2 text-[11px] font-medium text-slate-200 hover:bg-slate-900"
              >
                Change document
              </button>
              <button
                type="button"
                className="w-full rounded-lg bg-blue-600 px-3 py-2 text-[11px] font-medium text-white hover:bg-blue-700"
                onClick={() => {
                  if (doc.url) window.open(assetUrl(doc.url) ?? undefined, "_blank");
                }}
              >
                View document
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -- Work location --------------------------------------------------------- */

function WorkLocationPanel({
  workLocation,
  onRequestChange,
}: {
  workLocation: WorkLocation;
  onRequestChange: () => void;
}) {
  return (
    <div className="space-y-4">
      <SectionHeader title="Work location" subtitle="Your primary worksite." />

      <div className="space-y-3 rounded-2xl border border-slate-800 bg-[#07152f] px-4 py-3 text-[11px]">
        <LocationRow label="Current site name" value={workLocation.siteName} />
        <LocationRow label="Work address" value={workLocation.address} />
      </div>

      <button
        type="button"
        onClick={onRequestChange}
        className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
      >
        Request change of address
      </button>
    </div>
  );
}

function LocationRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-slate-800/70 py-3 last:border-b-0">
      <div>
        <div className="text-[11px] text-slate-400">{label}</div>
        <div className="text-[11px] font-medium text-slate-100">{value}</div>
      </div>
      <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1 text-[10px] text-slate-300">
        <Lock className="h-3 w-3" />
      </span>
    </div>
  );
}

/* -- Vehicle details ------------------------------------------------------- */

function VehicleDetailsPanel({
  vehicleImageUrl,
  vehicleDetails,
  uploading,
  onUploadImage,
  onEditDetails,
}: {
  vehicleImageUrl: string | null;
  vehicleDetails: VehicleDetailItem[];
  uploading?: boolean;
  onUploadImage?: (file: File) => void;
  onEditDetails?: () => void;
}) {
  const fileRef = useRef<HTMLInputElement | null>(null);

  const details = vehicleDetails?.length
    ? vehicleDetails
    : [
      { id: "make", label: "Vehicle make", value: "—" },
      { id: "color", label: "Car color", value: "—" },
      { id: "seats", label: "Number of seats", value: "—" },
      { id: "model", label: "Model", value: "—" },
      { id: "year", label: "Year of production", value: "—" },
      { id: "plate", label: "License plate", value: "—" },
    ];

  return (
    <div className="space-y-6">
      <SectionHeader title="Vehicle details" subtitle="Keep your vehicle info up to date." />

      {/* Car image card + upload */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-br from-[#07152f] via-[#050f25] to-[#020818] px-6 py-5">
        <div className="mb-3 flex items-center justify-between text-[11px] text-slate-300">
          <span className="font-medium text-slate-100">Active vehicle</span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-black/30"
            >
              <ChevronRight className="h-4 w-4 rotate-180 text-slate-200" />
            </button>
            <button
              type="button"
              className="flex h-8 w-8 items-center justify-center rounded-full border border-slate-700 bg-black/30"
            >
              <ChevronRight className="h-4 w-4 text-slate-200" />
            </button>
          </div>
        </div>

        <div className="relative mx-auto flex w-full max-w-md justify-center">
          <div className="relative h-40 w-full max-w-sm">
            {vehicleImageUrl ? (
              <img src={vehicleImageUrl} alt="Vehicle" className="h-full w-full object-contain" />
            ) : (
              <Image src="/car.png" alt="Vehicle" fill className="object-contain" />
            )}
          </div>
        </div>

        {/* Upload controls */}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[10px] text-slate-400">
            Upload a new vehicle photo (max 7MB).
          </div>

          <div className="flex items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                e.target.value = ""; // allow re-select same file
                if (!f) return;
                onUploadImage?.(f);
              }}
            />

            <button
              type="button"
              disabled={!!uploading}
              onClick={() => fileRef.current?.click()}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium ${uploading
                ? "cursor-not-allowed bg-slate-700/50 text-slate-300"
                : "bg-blue-600 text-white hover:bg-blue-700"
                }`}
            >
              <UploadCloud className="h-4 w-4" />
              {uploading ? "Uploading..." : "Upload vehicle image"}
            </button>
          </div>
        </div>
      </div>

      {/* Car details grid */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-[12px] font-semibold text-slate-100">Car details</h3>
          <button
            type="button"
            onClick={onEditDetails}
            className="text-[11px] font-medium text-blue-400 hover:underline"
          >
            Edit details
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {details.map((item) => (
            <div
              key={item.id}
              className="flex items-start gap-3 rounded-2xl border border-slate-800 bg-[#07152f] px-4 py-3"
            >
              <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-600/15 text-blue-400">
                <Car className="h-3.5 w-3.5" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-100">{item.value}</div>
                <div className="text-[10px] text-slate-400">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* -- Security -------------------------------------------------------------- */

function SecurityPanel({
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
      <SectionHeader title="Security" subtitle="Protect your account with password control." />

      <div className="rounded-2xl border border-slate-800 bg-[#07152f] text-[11px]">
        <SecurityRow title="Change password" description="Update your login password." onClick={onOpenChangePassword} />
        <SecurityRow
          title="Face recognition"
          description="Sign in securely using your face."
          trailing={<Toggle checked={state.faceRecognition} onChange={onToggleFace} />}
        />
        <SecurityRow
          title="Two-Factor Authentication"
          description="Add an extra layer of security with SMS."
          trailing={<Toggle checked={state.twoFactorAuth} onChange={onToggleTwoFactor} />}
        />
      </div>
    </div>
  );
}

function SecurityRow({
  title,
  description,
  trailing,
  onClick,
}: {
  title: string;
  description: string;
  trailing?: ReactNode;
  onClick?: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between border-b border-slate-800/70 px-4 py-3 last:border-b-0 ${onClick ? "cursor-pointer hover:bg-[#050f25]" : ""
        }`}
      onClick={onClick}
    >
      <div>
        <div className="text-[11px] font-semibold text-slate-100">{title}</div>
        <div className="text-[10px] text-slate-400">{description}</div>
      </div>
      {trailing}
    </div>
  );
}

/* -- Preference + Notification preference ---------------------------------- */

function PreferencePanel({
  view,
  preference,
  onOpenNotifications,
  onBackToMain,
  onToggleNotification,
}: {
  view: "main" | "notifications";
  preference: ProfileApiResponse["preference"];
  onOpenNotifications: () => void;
  onBackToMain: () => void;
  onToggleNotification: (key: keyof ProfileApiResponse["preference"]["notifications"]) => void;
}) {
  if (view === "notifications") {
    return (
      <NotificationPreferencePanel
        prefs={preference.notifications}
        onBackToMain={onBackToMain}
        onToggle={onToggleNotification}
      />
    );
  }

  return (
    <div className="space-y-4">
      <SectionHeader title="Preference" subtitle="Customize your app experience." />

      <div className="rounded-2xl border border-slate-800 bg-[#07152f] text-[11px]">
        <PreferenceRow
          title="Language preference"
          description="Switch between English and Spanish."
          value={preference.language ?? "English"}
          onClick={() => {
            // Later: open language selector + call PATCH /driver/profile/preferences { language }
          }}
        />
        <PreferenceRow
          title="Notifications preference"
          description="Choose which updates you receive, including ride alerts."
          onClick={onOpenNotifications}
        />
      </div>
    </div>
  );
}

function PreferenceRow({
  title,
  description,
  value,
  onClick,
}: {
  title: string;
  description: string;
  value?: string;
  onClick?: () => void;
}) {
  return (
    <div
      className={`flex items-center justify-between border-b border-slate-800/70 px-4 py-3 last:border-b-0 ${onClick ? "cursor-pointer hover:bg-[#050f25]" : ""
        }`}
      onClick={onClick}
    >
      <div>
        <div className="text-[11px] font-semibold text-slate-100">{title}</div>
        <div className="text-[10px] text-slate-400">{description}</div>
      </div>
      <div className="ml-4 flex items-center gap-2 text-[10px] text-slate-400">
        {value && <span className="text-[11px] text-slate-200">{value}</span>}
        <ChevronRight className="h-3 w-3 text-slate-500" />
      </div>
    </div>
  );
}

function NotificationPreferencePanel({
  prefs,
  onBackToMain,
  onToggle,
}: {
  prefs: ProfileApiResponse["preference"]["notifications"];
  onBackToMain: () => void;
  onToggle: (key: keyof ProfileApiResponse["preference"]["notifications"]) => void;
}) {
  return (
    <div className="space-y-4">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">Notification preference</h2>
          <p className="text-[11px] text-slate-400">Choose which updates you receive, including ride alerts.</p>
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
        <SecurityRow
          title="Ride Updates"
          description="Get alerts for driver assignment, pickup arrival, route changes."
          trailing={<Toggle checked={prefs.rideUpdates} onChange={() => onToggle("rideUpdates")} />}
        />
        <SecurityRow
          title="Payment & Billing Alerts"
          description="Receive confirmations for successful payments, refunds, and payouts."
          trailing={<Toggle checked={prefs.paymentAlerts} onChange={() => onToggle("paymentAlerts")} />}
        />
        <SecurityRow
          title="Shift & Schedule Reminders"
          description="Get reminders for upcoming scheduled rides and waiting time."
          trailing={<Toggle checked={prefs.shiftReminders} onChange={() => onToggle("shiftReminders")} />}
        />
        <SecurityRow
          title="Service Alerts & Safety Notices"
          description="Be notified about system maintenance and important safety updates."
          trailing={<Toggle checked={prefs.serviceAlerts} onChange={() => onToggle("serviceAlerts")} />}
        />
      </div>
    </div>
  );
}

/* -- SUPPORT DESKTOP ------------------------------------------------------- */

function SupportPanelDesktop({
  tab,
  onTabChange,
  conversations,
  activeConversation,
  onSelectConversation,
  onSend,
}: {
  tab: SupportChannel;
  onTabChange: (t: SupportChannel) => void;
  conversations: SupportConversation[];
  activeConversation: SupportConversation;
  onSelectConversation: (id: string) => void;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="flex h-full flex-col space-y-4">
      <SectionHeader title="Support" subtitle="Chat with support or contact via email." />

      {/* Tabs */}
      <div className="flex max-w-md rounded-xl border border-slate-800 bg-[#07152f] p-1 text-[11px]">
        <button
          type="button"
          onClick={() => onTabChange("chat")}
          className={`flex-1 rounded-lg px-4 py-2 font-medium ${tab === "chat" ? "bg-blue-600 text-white" : "bg-transparent text-slate-300 hover:bg-[#050f25]"
            }`}
        >
          Chat
        </button>
        <button
          type="button"
          onClick={() => onTabChange("email")}
          className={`flex-1 rounded-lg px-4 py-2 font-medium ${tab === "email" ? "bg-blue-600 text-white" : "bg-transparent text-slate-300 hover:bg-[#050f25]"
            }`}
        >
          Email
        </button>
      </div>

      {tab === "email" ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-[#07152f]/60 px-4 py-6 text-[11px] text-slate-300">
          Email support can plug into a ticket system later.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[260px,minmax(0,1fr)]">
          {/* Conversation list */}
          <div className="rounded-2xl border border-slate-800 bg-[#07152f] text-[11px]">
            <div className="border-b border-slate-800 px-4 py-3 font-medium text-slate-200">Conversations</div>
            <div className="divide-y divide-slate-800">
              {conversations.map((conv) => (
                <button
                  key={conv.id}
                  type="button"
                  onClick={() => onSelectConversation(conv.id)}
                  className={`flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors ${conv.id === activeConversation.id ? "bg-[#050f25]" : "hover:bg-[#050f25]"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-8 w-8 overflow-hidden rounded-full bg-slate-600">
                      <Image src="/driver-selfie.jpg" alt={conv.name} fill className="object-cover" />
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[11px] font-semibold text-slate-100">{conv.name}</div>
                      <div className="line-clamp-1 text-[10px] text-slate-400">{conv.tagLine}</div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <span className="text-[10px] text-slate-500">{conv.lastTime}</span>
                    {conv.unread && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Chat window */}
          <div className="flex min-h-[360px] flex-col rounded-2xl border border-slate-800 bg-[#07152f]">
            {/* Header */}
            <div className="flex items-center gap-3 border-b border-slate-800 px-4 py-3 text-[11px]">
              <div className="relative h-8 w-8 overflow-hidden rounded-full bg-slate-600">
                <Image src="/driver-selfie.jpg" alt={activeConversation.name} fill className="object-cover" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-slate-100">{activeConversation.name}</div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                  <span>Online</span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
              {activeConversation.messages.map((msg) => {
                const isAgent = msg.author === "agent";
                return (
                  <div key={msg.id} className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
                    <div
                      className={`max-w-xs rounded-2xl px-3 py-2 text-[11px] ${isAgent ? "bg-blue-600 text-white" : "bg-[#050f25] text-slate-100"
                        }`}
                    >
                      <p>{msg.text}</p>
                      <div className="mt-1 text-[9px] text-slate-200/70">{msg.time}</div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Composer */}
            <div className="border-t border-slate-800 px-4 py-3">
              <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-[#020818] px-3 py-2">
                <input
                  type="text"
                  placeholder="Type your message"
                  className="w-full bg-transparent text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <button
                  type="button"
                  className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white"
                  onClick={() => {
                    const t = draft.trim();
                    if (!t) return;
                    onSend(t);
                    setDraft("");
                  }}
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* -- SUPPORT MOBILE -------------------------------------------------------- */

function SupportPanelMobile({
  tab,
  onTabChange,
  conversations,
  activeConversation,
  onSelectConversation,
  view,
  onChangeView,
  onBackFromSection,
  onSend,
}: {
  tab: SupportChannel;
  onTabChange: (t: SupportChannel) => void;
  conversations: SupportConversation[];
  activeConversation: SupportConversation | undefined;
  onSelectConversation: (id: string) => void;
  view: MobileSupportView;
  onChangeView: (v: MobileSupportView) => void;
  onBackFromSection: () => void;
  onSend: (text: string) => void;
}) {
  const [draft, setDraft] = useState("");

  if (!activeConversation) return null;

  const handleBack = () => {
    if (view === "chat") onChangeView("list");
    else onBackFromSection();
  };

  if (view === "chat" && tab === "chat") {
    return (
      <section className="rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-xs text-slate-200">
        <div className="mb-4 flex items-center gap-3">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
          >
            <ArrowLeft className="h-4 w-4 text-slate-200" />
          </button>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-slate-100">{activeConversation.name}</span>
            <span className="flex items-center gap-1 text-[10px] text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              <span>Online</span>
            </span>
          </div>
        </div>

        <div className="mb-3 space-y-3">
          {activeConversation.messages.map((msg) => {
            const isAgent = msg.author === "agent";
            return (
              <div key={msg.id} className={`flex ${isAgent ? "justify-start" : "justify-end"}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-[11px] ${isAgent ? "bg-blue-600 text-white" : "bg-[#050f25] text-slate-100"
                    }`}
                >
                  <p>{msg.text}</p>
                  <div className="mt-1 text-[9px] text-slate-200/70">{msg.time}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="border-t border-slate-800 pt-3">
          <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-[#020818] px-3 py-2">
            <input
              type="text"
              placeholder="Type your message"
              className="w-full bg-transparent text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
            />
            <button
              type="button"
              className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-white"
              onClick={() => {
                const t = draft.trim();
                if (!t) return;
                onSend(t);
                setDraft("");
              }}
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-xs text-slate-200">
      <div className="mb-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
        >
          <ArrowLeft className="h-4 w-4 text-slate-200" />
        </button>
        <span className="text-sm font-semibold text-slate-100">Support</span>
      </div>

      <div className="mb-4 flex rounded-xl border border-slate-800 bg-[#07152f] p-1 text-[11px]">
        <button
          type="button"
          onClick={() => {
            onTabChange("chat");
            onChangeView("list");
          }}
          className={`flex-1 rounded-lg px-4 py-2 font-medium ${tab === "chat" ? "bg-blue-600 text-white" : "bg-transparent text-slate-300 hover:bg-[#050f25]"
            }`}
        >
          Chat
        </button>
        <button
          type="button"
          onClick={() => {
            onTabChange("email");
            onChangeView("list");
          }}
          className={`flex-1 rounded-lg px-4 py-2 font-medium ${tab === "email" ? "bg-blue-600 text-white" : "bg-transparent text-slate-300 hover:bg-[#050f25]"
            }`}
        >
          Email
        </button>
      </div>

      {tab === "email" ? (
        <div className="rounded-2xl border border-dashed border-slate-700 bg-[#07152f]/60 px-4 py-6 text-[11px] text-slate-300">
          Email support can plug into a ticket system later.
        </div>
      ) : (
        <>
          <div className="mb-2 text-[11px] font-medium text-slate-200">Conversations</div>
          <div className="space-y-2">
            {conversations.map((conv) => (
              <button
                key={conv.id}
                type="button"
                onClick={() => {
                  onSelectConversation(conv.id);
                  onChangeView("chat");
                }}
                className={`flex w-full items-center justify-between gap-2 rounded-2xl border border-slate-800 px-4 py-3 text-left text-[11px] transition-colors ${conv.id === activeConversation.id ? "bg-[#050f25]" : "bg-[#07152f] hover:bg-[#050f25]"
                  }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-8 w-8 overflow-hidden rounded-full bg-slate-600">
                    <Image src="/driver-selfie.jpg" alt={conv.name} fill className="object-cover" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[11px] font-semibold text-slate-100">{conv.name}</div>
                    <div className="line-clamp-1 text-[10px] text-slate-400">{conv.tagLine}</div>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-[10px] text-slate-500">{conv.lastTime}</span>
                  {conv.unread && <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />}
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*  CHANGE LOCATION OVERLAY                                                   */
/* -------------------------------------------------------------------------- */

function ChangeLocationOverlay({
  initialValues,
  onClose,
  onSave,
}: {
  initialValues: WorkLocation;
  onClose: () => void;
  onSave: (values: WorkLocation) => void;
}) {
  const [siteName, setSiteName] = useState(initialValues.siteName);
  const [address, setAddress] = useState(initialValues.address);

  const handleSave = () => onSave({ siteName, address });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-[#050f25] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3 text-xs text-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] font-medium">Change location</span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-6 text-xs text-slate-200">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-50">Change location</div>
            <p className="text-[11px] text-slate-400">
              Update your work site details. Requests can be reviewed by the admin team later.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Work site name</label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="Write"
                className="w-full rounded-lg border border-slate-700 bg-[#020818] px-3 py-2 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[11px] text-slate-400">Address</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Write"
                className="w-full rounded-lg border border-slate-700 bg-[#020818] px-3 py-2 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  CHANGE PASSWORD OVERLAY                                                   */
/* -------------------------------------------------------------------------- */

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
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3 text-xs text-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] font-medium">Change password</span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-6 text-xs text-slate-200">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-50">Change password</div>
            <p className="text-[11px] text-slate-400">Enter your old password and create a new one.</p>
          </div>

          <div className="space-y-3">
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

/* -------------------------------------------------------------------------- */
/*  EDIT VEHICLE OVERLAY                                                      */
/* -------------------------------------------------------------------------- */

function EditVehicleOverlay({
  initialDetails,
  onClose,
  onSave,
}: {
  initialDetails: VehicleDetailItem[];
  onClose: () => void;
  onSave: (updated: VehicleDetailItem[]) => void;
}) {
  const [details, setDetails] = useState<VehicleDetailItem[]>(initialDetails);

  const handleSave = () => onSave(details);

  const handleDetailChange = (id: string, newValue: string) => {
    setDetails((prev) =>
      prev.map((item) => (item.id === id ? { ...item, value: newValue } : item))
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-[#050f25] shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3 text-xs text-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
          </button>
          <span className="text-[11px] font-medium">Edit vehicle details</span>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="space-y-4 px-6 py-6 text-xs text-slate-200">
          <div className="space-y-1">
            <div className="text-sm font-semibold text-slate-50">Edit vehicle details</div>
            <p className="text-[11px] text-slate-400">Update your vehicle information.</p>
          </div>

          <div className="space-y-3">
            {details.map((detail) => (
              <div key={detail.id} className="space-y-1">
                <label className="text-[11px] text-slate-400">{detail.label}</label>
                <input
                  type="text"
                  value={detail.value}
                  onChange={(e) => handleDetailChange(detail.id, e.target.value)}
                  placeholder="Write"
                  className="w-full rounded-lg border border-slate-700 bg-[#020818] px-3 py-2 text-[11px] text-slate-100 placeholder:text-slate-500 focus:outline-none"
                />
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={handleSave}
            className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  SMALL TOGGLE                                                              */
/* -------------------------------------------------------------------------- */

function Toggle({ checked, onChange }: { checked: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-4 w-7 items-center rounded-full border border-slate-600 transition-colors ${checked ? "bg-blue-500 border-blue-500" : "bg-slate-700"
        }`}
      aria-pressed={checked}
    >
      <span
        className={`inline-block h-3 w-3 transform rounded-full bg-white shadow-sm transition-transform duration-150 ${checked ? "translate-x-3" : "translate-x-0"
          }`}
      />
    </button>
  );
}
