"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { AuthShell } from "@/src/components/AuthShell";
import { Button, TextInput } from "@/src/components/ui";
import { login } from "@/src/lib/authClient";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

 async function onSubmit(e: React.FormEvent) {
  e.preventDefault();
  setError(null);
  setLoading(true);

  try {
    const res = await login({ email, password, role: "DRIVER" });

    // ✅ go where backend says (dashboard if completed, otherwise correct step)
    router.replace(res.nextPath ?? "/driver/dashboard");
  } catch (err: any) {
    setError(err?.error ?? err?.message ?? "Login failed");
  } finally {
    setLoading(false);
  }
}

  return (
    <AuthShell layout="wide">
      <div className="flex w-full min-h-[540px]">
        <div className="flex w-full flex-col items-center justify-center px-8 py-10 sm:px-12 md:w-[52%] lg:w-[45%]">
          <div className="w-full max-w-sm space-y-8">
            <header className="space-y-6 text-center">
              <div className="flex justify-center">
                <Image src="/occlogo.jpg" alt="Our Common Commute" width={36} height={36} />
              </div>
              <p className="text-sm font-medium text-slate-700">Built for speed, safety, and simplicity.</p>
            </header>

            <div className="space-y-3">
              <SocialButton iconSrc="/icons/devicon_google.png" iconAlt="Google" label="Continue with Google" />
              <SocialButton iconSrc="/icons/logos_facebook.png" iconAlt="Facebook" label="Continue with Facebook" />
            </div>

            <div className="relative mt-2 text-center text-[11px] text-slate-400">
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200" />
              <span className="relative bg-white px-3">Or</span>
            </div>

            <form className="mt-2 space-y-4" onSubmit={onSubmit}>
              <TextInput
                label="Enter your email address"
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e: any) => setEmail(e.target.value)}
              />
              <TextInput
                label="Password"
                type="password"
                placeholder="Password"
                required
                value={password}
                onChange={(e: any) => setPassword(e.target.value)}
              />

              {error ? <p className="text-xs text-red-600">{error}</p> : null}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Continue"}
              </Button>
            </form>

            <div className="space-y-3 pt-1 text-center text-xs text-slate-500">
              <Link href="/reset-password" className="hover:underline">
                Forgot password?
              </Link>
              <p>
                Don&apos;t have an account?{" "}
                <Link href="/driver/sign-up" className="font-medium text-blue-600 hover:underline">
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="relative hidden flex-1 border-l border-slate-200 md:block">
          <Image
            src="/women using phone.jpg"
            alt="Passenger using phone in the car"
            fill
            priority
            className="object-cover"
          />
        </div>
      </div>
    </AuthShell>
  );
}

type SocialButtonProps = { iconSrc: string; iconAlt: string; label: string };

function SocialButton({ iconSrc, iconAlt, label }: SocialButtonProps) {
  return (
    <button
      type="button"
      className="flex w-full items-center justify-center gap-2 rounded-md border border-slate-200 bg-slate-50 py-2.5 text-xs font-medium text-slate-700 hover:bg-slate-100"
    >
      <Image src={iconSrc} alt={iconAlt} width={16} height={16} />
      <span>{label}</span>
    </button>
  );
}
