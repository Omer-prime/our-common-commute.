// src/components/Navbar.tsx
import Link from "next/link";
import Image from "next/image";
import { Button } from "./ui";

export default function Navbar() {
  return (
    <header className="bg-[#eaf1ff] py-6">
      <div className="mx-auto max-w-6xl px-6 lg:px-8">
        <div className="flex items-center justify-between rounded-full bg-white px-8 py-4 shadow-[0_22px_55px_rgba(15,23,42,0.16)] ring-1 ring-slate-100">
          {/* Logo + name */}
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="/occlogo.jpg"
              alt="Our Common Commute logo"
              width={40}
              height={40}
              className="rounded-md"
            />
            <span className="hidden text-[15px] font-semibold tracking-tight sm:inline-block">
              Our Common Commute
            </span>
          </Link>

          {/* Center nav */}
          <nav className="hidden items-center gap-12 text-[15px] font-medium text-slate-600 sm:flex">
            <Link href="#about" className="hover:text-slate-900">
              About us
            </Link>
            <Link href="#support" className="hover:text-slate-900">
              Support
            </Link>
            <Link href="#career" className="hover:text-slate-900">
              Career
            </Link>
          </nav>

          {/* Sign in */}
          <Link href="/auth">
            <Button
              variant="primary"
              className="h-10 rounded-full px-6 text-[14px] font-semibold"
            >
              Sign in
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
