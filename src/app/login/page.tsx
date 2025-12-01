import Image from "next/image";
import Link from "next/link";
import { AuthShell } from "@/src/components/AuthShell";
import { Button, TextInput } from "@/src/components/ui";

export default function LoginPage() {
  return (
    <AuthShell>
      <div className="flex flex-col gap-6">
        <header className="text-center space-y-1">
          <h1 className="text-2xl font-semibold text-slate-900">
            Welcome Back
          </h1>
          <p className="text-xs text-slate-500">
            Sign in to continue your smooth and secure ride experience.
          </p>
        </header>

        {/* Social logins */}
        <div className="flex items-center justify-center gap-4">
          <SocialIconButton src="/icons/devicon_google.png" alt="Sign in with Google" />
          <SocialIconButton
            src="/icons/logos_facebook.png"
            alt="Sign in with Facebook"
          />
          <SocialIconButton src="/icons/ic_twotone-apple.png" alt="Sign in with Apple" />
        </div>

        {/* For now, just navigate on click instead of real auth */}
        <div className="flex flex-col gap-4">
          <TextInput
            label="Email Address"
            type="email"
            placeholder="Enter your email address"
            required
          />
          <TextInput
            label="Password"
            type="password"
            placeholder="Enter your password"
            required
          />
          <Link
            href="/driver/onboarding/basic-details"
            className="mt-2 block w-full"
          >
            <Button type="button">Sign in</Button>
          </Link>
        </div>

        <div className="flex flex-col items-center gap-2 text-xs text-slate-500">
          <Link href="/reset-password" className="hover:underline">
            Forgot password
          </Link>
          <p>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-medium text-blue-600">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </AuthShell>
  );
}

type SocialIconProps = {
  src: string;
  alt: string;
};

function SocialIconButton({ src, alt }: SocialIconProps) {
  return (
    <button
      type="button"
      className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white hover:bg-slate-50"
    >
      <Image src={src} alt={alt} width={20} height={20} />
    </button>
  );
}
