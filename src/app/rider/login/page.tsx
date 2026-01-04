import Image from "next/image";
import Link from "next/link";
import { AuthShell } from "@/src/components/AuthShell";
import LoginForm from "./LoginForm";

export default function LoginPage() {
  return (
    <AuthShell layout="wide">
      <div className="flex w-full min-h-[540px]">
        {/* LEFT: FORM COLUMN */}
        <div className="flex w-full flex-col items-center justify-center px-8 py-10 sm:px-12 md:w-[52%] lg:w-[45%]">
          <div className="w-full max-w-sm space-y-8">
            <header className="space-y-6 text-center">
              <div className="flex justify-center">
                <Image
                  src="/occlogo.jpg"
                  alt="Our Common Commute"
                  width={36}
                  height={36}
                />
              </div>
              <p className="text-sm font-medium text-slate-700">
                Built for speed, safety, and simplicity.
              </p>
            </header>

            {/* Social login buttons (UI only for now) */}
            <div className="space-y-3">
              <SocialButton
                iconSrc="/icons/devicon_google.png"
                iconAlt="Google"
                label="Continue with Google"
              />
              <SocialButton
                iconSrc="/icons/logos_facebook.png"
                iconAlt="Facebook"
                label="Continue with Facebook"
              />
            </div>

            <div className="relative mt-2 text-center text-[11px] text-slate-400">
              <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2 bg-slate-200" />
              <span className="relative bg-white px-3">Or</span>
            </div>

            <LoginForm />

            <div className="space-y-3 pt-1 text-center text-xs text-slate-500">
              <Link href="/reset-password" className="hover:underline">
                Forgot password?
              </Link>
              <p>
                Don&apos;t have an account?{" "}
                <Link
                  href="/rider/signup"
                  className="font-medium text-blue-600 hover:underline"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* RIGHT: IMAGE COLUMN */}
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

type SocialButtonProps = {
  iconSrc: string;
  iconAlt: string;
  label: string;
};

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
