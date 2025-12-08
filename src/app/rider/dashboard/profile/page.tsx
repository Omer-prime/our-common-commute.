"use client";

import React, { useState, type ReactNode } from "react";
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
/*  TYPES & MOCK DATA                                                         */
/* -------------------------------------------------------------------------- */

type ProfileSection =
  | "personalInfo"
  | "identity"
  | "location"
  | "payment"
  | "security"
  | "settings";

type IdentityView = "main" | "governmentId";
type SettingsView = "main" | "language" | "notifications";
type LocationTarget = "home" | "work";
type LanguageOption = "English" | "Spanish";

type RiderProfile = {
  name: string;
  email: string;
  location: string;
  phone: string;
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
};

const MOCK_RIDER: RiderProfile = {
  name: "John Doe",
  email: "adexco@gentr.gmail",
  location: "Illinois, US",
  phone: "+143685355",
};

const MOCK_LOCATIONS: LocationInfo = {
  homeAddress: "Transcorp, Ill, US",
  workAddress: "1537 Avenue, County, US",
};

const MOCK_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "apple",
    label: "Apple pay",
    secondary: "adexco@gentr.gmail",
    isDefault: true,
  },
  {
    id: "paypal",
    label: "Paypal",
    secondary: "adexco@gentr.gmail",
  },
  {
    id: "visa",
    label: "Visa",
    secondary: "James Rodri",
  },
  {
    id: "gpay",
    label: "G pay",
    secondary: "adexco@gentr.gmail",
  },
  {
    id: "cashapp",
    label: "Cashapp",
    secondary: "adexco@gentr.gmail",
  },
];

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

/* -------------------------------------------------------------------------- */
/*  PAGE                                                                      */
/* -------------------------------------------------------------------------- */

export default function RiderProfilePage() {
  const [section, setSection] = useState<ProfileSection>("personalInfo");
  const [mobileSection, setMobileSection] = useState<ProfileSection | null>(
    null,
  );

  const [identityView, setIdentityView] = useState<IdentityView>("main");
  const [settingsView, setSettingsView] = useState<SettingsView>("main");

  const [language, setLanguage] = useState<LanguageOption>("English");

  const [rider] = useState<RiderProfile>(MOCK_RIDER);
  const [locations, setLocations] = useState<LocationInfo>(MOCK_LOCATIONS);
  const [paymentMethods] = useState<PaymentMethod[]>(MOCK_PAYMENT_METHODS);

  const [securityState, setSecurityState] = useState({
    faceRecognition: true,
    twoFactorAuth: false,
  });

  const [locationChangeTarget, setLocationChangeTarget] =
    useState<LocationTarget | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);

  const handleSidebarClick = (next: ProfileSection) => {
    setSection(next);
    setMobileSection(next);
    // reset nested views when switching main section
    setIdentityView("main");
    setSettingsView("main");
  };

  const closeMobileSection = () => {
    setMobileSection(null);
    setIdentityView("main");
    setSettingsView("main");
  };

  const handleSaveLocation = (target: LocationTarget, value: string) => {
    setLocations((prev) =>
      target === "home"
        ? { ...prev, homeAddress: value }
        : { ...prev, workAddress: value },
    );
  };

  return (
    <RiderDashboardShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold text-slate-100">Profile</h1>
        </div>

        {/* DESKTOP LAYOUT */}
        <div className="hidden items-start gap-6 lg:grid lg:grid-cols-3">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-1">
            <ProfileSidebar
              rider={rider}
              activeSection={section}
              onSectionChange={handleSidebarClick}
            />
          </div>

          {/* RIGHT COLUMN */}
          <section className="lg:col-span-2 rounded-2xl border border-slate-800 bg-[#050f25] p-4 text-xs text-slate-200 sm:p-6">
            {section === "personalInfo" && <PersonalInfoPanel rider={rider} />}

            {section === "identity" && (
              <IdentityPanel
                view={identityView}
                onOpenGovernmentId={() => setIdentityView("governmentId")}
                onBackToMain={() => setIdentityView("main")}
              />
            )}

            {section === "location" && (
              <LocationPanel
                locations={locations}
                onRequestChange={(target) => setLocationChangeTarget(target)}
              />
            )}

            {section === "payment" && (
              <PaymentMethodsPanel methods={paymentMethods} />
            )}

            {section === "security" && (
              <RiderSecurityPanel
                state={securityState}
                onOpenChangePassword={() => setShowChangePassword(true)}
                onToggleFace={() =>
                  setSecurityState((prev) => ({
                    ...prev,
                    faceRecognition: !prev.faceRecognition,
                  }))
                }
                onToggleTwoFactor={() =>
                  setSecurityState((prev) => ({
                    ...prev,
                    twoFactorAuth: !prev.twoFactorAuth,
                  }))
                }
              />
            )}

            {section === "settings" && (
              <SettingsPanel
                view={settingsView}
                language={language}
                onOpenLanguage={() => setSettingsView("language")}
                onOpenNotifications={() => setSettingsView("notifications")}
                onBackToMain={() => setSettingsView("main")}
                onChangeLanguage={setLanguage}
              />
            )}
          </section>
        </div>

        {/* MOBILE LAYOUT */}
        <div className="space-y-4 lg:hidden">
          {mobileSection === null ? (
            <ProfileSidebar
              rider={rider}
              activeSection={section}
              onSectionChange={handleSidebarClick}
            />
          ) : (
            <MobileSectionContainer
              title={getSectionTitle(mobileSection)}
              onBack={closeMobileSection}
            >
              {mobileSection === "personalInfo" && (
                <PersonalInfoPanel rider={rider} />
              )}

              {mobileSection === "identity" && (
                <IdentityPanel
                  view={identityView}
                  onOpenGovernmentId={() => setIdentityView("governmentId")}
                  onBackToMain={() => setIdentityView("main")}
                />
              )}

              {mobileSection === "location" && (
                <LocationPanel
                  locations={locations}
                  onRequestChange={(target) => setLocationChangeTarget(target)}
                />
              )}

              {mobileSection === "payment" && (
                <PaymentMethodsPanel methods={paymentMethods} />
              )}

              {mobileSection === "security" && (
                <RiderSecurityPanel
                  state={securityState}
                  onOpenChangePassword={() => setShowChangePassword(true)}
                  onToggleFace={() =>
                    setSecurityState((prev) => ({
                      ...prev,
                      faceRecognition: !prev.faceRecognition,
                    }))
                  }
                  onToggleTwoFactor={() =>
                    setSecurityState((prev) => ({
                      ...prev,
                      twoFactorAuth: !prev.twoFactorAuth,
                    }))
                  }
                />
              )}

              {mobileSection === "settings" && (
                <SettingsPanel
                  view={settingsView}
                  language={language}
                  onOpenLanguage={() => setSettingsView("language")}
                  onOpenNotifications={() =>
                    setSettingsView("notifications")
                  }
                  onBackToMain={() => setSettingsView("main")}
                  onChangeLanguage={setLanguage}
                />
              )}
            </MobileSectionContainer>
          )}
        </div>
      </div>

      {/* CHANGE LOCATION OVERLAY (My location -> Request change) */}
      {locationChangeTarget && (
        <ChangeLocationOverlay
          target={locationChangeTarget}
          initialValue={
            locationChangeTarget === "home"
              ? locations.homeAddress
              : locations.workAddress
          }
          onClose={() => setLocationChangeTarget(null)}
          onSave={(value) => {
            handleSaveLocation(locationChangeTarget, value);
            setLocationChangeTarget(null);
          }}
        />
      )}

      {/* CHANGE PASSWORD OVERLAY (Security -> Change password) */}
      {showChangePassword && (
        <ChangePasswordOverlay
          onClose={() => setShowChangePassword(false)}
          onSave={(oldPassword, newPassword) => {
            // later: hook real API
            console.log("Rider change password", { oldPassword, newPassword });
            setShowChangePassword(false);
          }}
        />
      )}
    </RiderDashboardShell>
  );
}

/* -------------------------------------------------------------------------- */
/*  LEFT SIDEBAR                                                              */
/* -------------------------------------------------------------------------- */

function ProfileSidebar({
  rider,
  activeSection,
  onSectionChange,
}: {
  rider: RiderProfile;
  activeSection: ProfileSection;
  onSectionChange: (s: ProfileSection) => void;
}) {
  return (
    <aside className="space-y-4">
      {/* Rider summary card */}
      <div className="rounded-2xl border border-slate-800 bg-[#050f25] px-5 py-5 text-xs text-slate-200">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-full border border-slate-600">
              <Image
                src="/maxwell.png"
                alt={rider.name}
                fill
                className="object-cover"
              />
            </div>
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-slate-50">
                {rider.name}
              </div>
              <div className="text-[11px] text-slate-400">{rider.email}</div>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-medium text-emerald-400">
            Verified
          </span>
        </div>
      </div>

      {/* Menu */}
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
          description="Protect your account with Face Recognition sign-in"
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
        active
          ? "bg-[#0b1735] text-slate-50"
          : "bg-transparent text-slate-200 hover:bg-[#060f24]"
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
/*  SHARED SMALL HELPERS                                                      */
/* -------------------------------------------------------------------------- */

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
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
        <div className="text-[11px] font-medium text-slate-100">{value}</div>
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
  const base =
    "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-medium";
  const color =
    variant === "success"
      ? "bg-emerald-500/15 text-emerald-400"
      : variant === "danger"
      ? "bg-red-500/15 text-red-400"
      : "bg-slate-500/15 text-slate-300";

  return <span className={`${base} ${color}`}>{label}</span>;
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
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

/* -- Personal info --------------------------------------------------------- */

function PersonalInfoPanel({ rider }: { rider: RiderProfile }) {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Personal information"
        subtitle="Update your basic details like phone number, email."
      />

      <div className="flex flex-col items-center gap-3 pb-2">
        <div className="relative h-20 w-20 overflow-hidden rounded-full border border-slate-600">
          <Image
            src="/maxwell.png"
            alt={rider.name}
            fill
            className="object-cover"
          />
        </div>
        <div className="text-center">
          <div className="text-sm font-medium text-slate-100">
            {rider.name}
          </div>
          <div className="text-[11px] text-slate-400">{rider.email}</div>
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

/* -- Identity + Government ID --------------------------------------------- */

function IdentityPanel({
  view,
  onOpenGovernmentId,
  onBackToMain,
}: {
  view: IdentityView;
  onOpenGovernmentId: () => void;
  onBackToMain: () => void;
}) {
  if (view === "governmentId") {
    return <GovernmentIdPanel onBackToMain={onBackToMain} />;
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Identity verification"
        subtitle="Verify your identity with your government issued ID."
      />

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#07152f] text-[11px]">
        {/* Government ID row (click -> Figma-like page) */}
        <button
          type="button"
          onClick={onOpenGovernmentId}
          className="flex w-full items-center justify-between border-b border-slate-800/70 px-4 py-3 text-left"
        >
          <div>
            <div className="text-[11px] font-semibold text-slate-100">
              Government ID
            </div>
            <div className="text-[10px] text-slate-400">
              Provide your official identification document.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill label="Verified" variant="success" />
            <ChevronRight className="h-3 w-3 text-slate-500" />
          </div>
        </button>

        {/* Selfie row (still inline summary) */}
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-[11px] font-semibold text-slate-100">
              Selfie
            </div>
            <div className="text-[10px] text-slate-400">
              Upload a clear selfie photo for additional verification.
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusPill label="Not verified" variant="danger" />
            <ChevronRight className="h-3 w-3 text-slate-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

function GovernmentIdPanel({
  onBackToMain,
}: {
  onBackToMain: () => void;
}) {
  const [docType] = useState("Government ID");

  return (
    <div className="space-y-4">
      {/* Top row like Figma: back + title */}
      <div className="mb-1 flex items-center gap-3">
        <button
          type="button"
          onClick={onBackToMain}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[#07152f] hover:bg-[#0b1b3a]"
        >
          <ArrowLeft className="h-4 w-4 text-slate-200" />
        </button>
        <span className="text-sm font-semibold text-slate-100">
          Government ID
        </span>
      </div>

      {/* Content card */}
      <div className="space-y-4 rounded-2xl border border-slate-800 bg-[#07152f] p-4 text-[11px]">
        {/* Fake select (matches the top dropdown look) */}
        <div className="space-y-1">
          <label className="text-[11px] text-slate-400">Document type</label>
          <button
            type="button"
            className="flex w-full items-center justify-between rounded-lg border border-slate-700 bg-[#020818] px-3 py-2"
          >
            <span className="text-[11px] text-slate-100">{docType}</span>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </button>
        </div>

        {/* Image preview frame */}
        <div className="flex justify-center pt-2">
          <div className="relative h-48 w-40 overflow-hidden rounded-2xl border-2 border-blue-500/60 bg-[#020818]">
            {/* Put some placeholder ID image under /public/id-sample.png if you like */}
            <Image
              src="/id-sample.png"
              alt="Government ID preview"
              fill
              className="object-cover"
            />
          </div>
        </div>

        {/* Select from gallery button */}
        <button
          type="button"
          className="mt-2 w-full rounded-lg bg-blue-600 py-2.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Select from gallery
        </button>

        {/* Small bottom icon circle (like camera icon space) */}
        <div className="flex justify-center pt-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-700 bg-[#020818] text-[13px] text-slate-300">
            {/* You can replace with an actual camera icon later */}
            📷
          </div>
        </div>
      </div>
    </div>
  );
}

/* -- Location --------------------------------------------------------------- */

function LocationPanel({
  locations,
  onRequestChange,
}: {
  locations: LocationInfo;
  onRequestChange: (target: LocationTarget) => void;
}) {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="My location"
        subtitle="Your approved home and work addresses."
      />

      <div className="overflow-hidden rounded-2xl border border-slate-800 bg-[#07152f] text-[11px]">
        <div className="flex items-center justify-between border-b border-slate-800/70 px-4 py-3">
          <div>
            <div className="text-[11px] font-semibold text-slate-100">
              {locations.homeAddress}
            </div>
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
            <div className="text-[11px] font-semibold text-slate-100">
              {locations.workAddress}
            </div>
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

/* -- Payment methods -------------------------------------------------------- */

function PaymentMethodsPanel({ methods }: { methods: PaymentMethod[] }) {
  return (
    <div className="space-y-4">
      <SectionHeader
        title="Payment method"
        subtitle="Manage your saved payment options."
      />

      <div className="space-y-3 text-[11px]">
        {methods.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#07152f] px-4 py-3"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-[#101a33] text-sm font-semibold text-slate-100">
                {m.label[0]}
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-100">
                  {m.label}
                </div>
                <div className="mt-0.5 text-[10px] text-slate-400">
                  {m.secondary}
                </div>
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
    </div>
  );
}

/* -- Security --------------------------------------------------------------- */

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
      <SectionHeader
        title="Security"
        subtitle="Protect your account with Face Recognition sign-in."
      />

      <div className="rounded-2xl border border-slate-800 bg-[#07152f] text-[11px]">
        {/* Change password -> Figma change password page (overlay) */}
        <button
          type="button"
          onClick={onOpenChangePassword}
          className="flex w-full items-center justify-between border-b border-slate-800/70 px-4 py-3 text-left"
        >
          <div>
            <div className="text-[11px] font-semibold text-slate-100">
              Change password
            </div>
            <div className="text-[10px] text-slate-400">
              Update your login password.
            </div>
          </div>
          <ChevronRight className="h-3 w-3 text-slate-500" />
        </button>

        <div className="flex items-center justify-between border-b border-slate-800/70 px-4 py-3">
          <div>
            <div className="text-[11px] font-semibold text-slate-100">
              Face recognition
            </div>
            <div className="text-[10px] text-slate-400">
              Sign in securely using your face.
            </div>
          </div>
          <Toggle checked={state.faceRecognition} onChange={onToggleFace} />
        </div>

        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <div className="text-[11px] font-semibold text-slate-100">
              Two-Factor Authentication
            </div>
            <div className="text-[10px] text-slate-400">
              Add an extra layer of security with SMS.
            </div>
          </div>
          <Toggle
            checked={state.twoFactorAuth}
            onChange={onToggleTwoFactor}
          />
        </div>
      </div>
    </div>
  );
}

/* -- Settings / Language / Notifications ----------------------------------- */

function SettingsPanel({
  view,
  language,
  onOpenLanguage,
  onOpenNotifications,
  onBackToMain,
  onChangeLanguage,
}: {
  view: SettingsView;
  language: LanguageOption;
  onOpenLanguage: () => void;
  onOpenNotifications: () => void;
  onBackToMain: () => void;
  onChangeLanguage: (value: LanguageOption) => void;
}) {
  if (view === "language") {
    return (
      <LanguagePreferencePanel
        selected={language}
        onSelectLanguage={(lang) => onChangeLanguage(lang)}
        onBackToMain={onBackToMain}
      />
    );
  }

  if (view === "notifications") {
    return <NotificationPreferencePanel onBackToMain={onBackToMain} />;
  }

  return (
    <div className="space-y-4">
      <SectionHeader
        title="Settings"
        subtitle="Manage your language and notification preferences."
      />

      <div className="rounded-2xl border border-slate-800 bg-[#07152f] text-[11px]">
        <button
          type="button"
          onClick={onOpenLanguage}
          className="flex w-full items-center justify-between border-b border-slate-800/70 px-4 py-3 text-left"
        >
          <div>
            <div className="text-[11px] font-semibold text-slate-100">
              Language preference
            </div>
            <div className="text-[10px] text-slate-400">
              Switch between English and Spanish.
            </div>
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
            <div className="text-[11px] font-semibold text-slate-100">
              Notifications preference
            </div>
            <div className="text-[10px] text-slate-400">
              Choose which updates you receive, including ride alerts.
            </div>
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
              idx !== languages.length - 1
                ? "border-b border-slate-800/70"
                : ""
            }`}
          >
            <span className="text-[11px] text-slate-100">{lang}</span>
            <span className="flex h-4 w-4 items-center justify-center rounded-full border border-slate-600">
              {selected === lang && (
                <span className="h-2 w-2 rounded-full bg-blue-500" />
              )}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function NotificationPreferencePanel({
  onBackToMain,
}: {
  onBackToMain: () => void;
}) {
  const [prefs, setPrefs] = useState({
    rideUpdates: true,
    paymentAlerts: true,
    shiftReminders: true,
    serviceAlerts: true,
  });

  const toggle = (key: keyof typeof prefs) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="space-y-4">
      <div className="mb-1 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-100">
            Notification preference
          </h2>
          <p className="text-[11px] text-slate-400">
            Choose which updates you receive, including ride alerts.
          </p>
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
          description="Get alerts for driver assignment, pickup arrival, route changes."
          trailing={
            <Toggle
              checked={prefs.rideUpdates}
              onChange={() => toggle("rideUpdates")}
            />
          }
        />
        <NotificationRow
          title="Payment & Billing Alerts"
          description="Receive confirmations for successful payments, refunds, and payouts."
          trailing={
            <Toggle
              checked={prefs.paymentAlerts}
              onChange={() => toggle("paymentAlerts")}
            />
          }
        />
        <NotificationRow
          title="Shift & Schedule Reminders"
          description="Get reminders for upcoming scheduled rides and waiting time."
          trailing={
            <Toggle
              checked={prefs.shiftReminders}
              onChange={() => toggle("shiftReminders")}
            />
          }
        />
        <NotificationRow
          title="Service Alerts & Safety Notices"
          description="Be notified about system maintenance and important safety updates."
          trailing={
            <Toggle
              checked={prefs.serviceAlerts}
              onChange={() => toggle("serviceAlerts")}
            />
          }
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
        {/* Header */}
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

        {/* Content */}
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
            Save
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

  const handleSave = () => {
    onSave(oldPassword, newPassword);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-3 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-800 bg-[#050f25] shadow-2xl">
        {/* Header */}
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

        {/* Content */}
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
