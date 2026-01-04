"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { DriverOnboardingStep } from "@/src/components/DriverOnboardingStep";
import { Button, TextInput } from "@/src/components/ui";
import { getAuth } from "@/src/lib/authStorage";
import { API_URL } from "@/src/lib/api";

type PayoutMethod = "BANK_ACCOUNT" | "MOBILE_WALLET";

export default function PayoutPage() {
  const router = useRouter();
  const [payoutMethod, setPayoutMethod] = useState<PayoutMethod>("BANK_ACCOUNT");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [swiftCode, setSwiftCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onProceed() {
    setErr("");
    const auth = getAuth();
    if (!auth?.accessToken) return setErr("You are not logged in.");

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/driver/onboarding/payout`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.accessToken}`
        },
        body: JSON.stringify({
          payoutMethod,
          accountNumber,
          accountName,
          bankName,
          swiftCode
        })
      });

      const data = await res.json();
      if (!res.ok) throw data;

      router.push(data.nextPath);
    } catch (e: any) {
      setErr(e?.message || e?.error || "Save failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <DriverOnboardingStep
      step={8}
      totalSteps={9}
      title="Payout & Earnings"
      subtitle="Select your preferred payout method."
    >
      <div className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-slate-700">Payout method</span>
          <select
            value={payoutMethod}
            onChange={(e) => setPayoutMethod(e.target.value as PayoutMethod)}
            className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="BANK_ACCOUNT">Bank account</option>
            <option value="MOBILE_WALLET">Mobile wallet</option>
          </select>
        </label>

        <TextInput label="Account number" placeholder="Account number" value={accountNumber} onChange={(e: any) => setAccountNumber(e.target.value)} />
        <TextInput label="Account name" placeholder="Account holder name" value={accountName} onChange={(e: any) => setAccountName(e.target.value)} />
        <TextInput label="Bank name" placeholder="Bank name" value={bankName} onChange={(e: any) => setBankName(e.target.value)} />
        <TextInput label="Swift code" placeholder="SWIFT / BIC" value={swiftCode} onChange={(e: any) => setSwiftCode(e.target.value)} />

        {err ? <p className="text-xs text-red-600">{err}</p> : null}

        <div className="mt-3 flex flex-col gap-3">
          <Button type="button" className="w-full" disabled={loading} onClick={onProceed}>
            {loading ? "Saving..." : "Proceed"}
          </Button>
        </div>
      </div>
    </DriverOnboardingStep>
  );
}
