import Image from "next/image";
import Link from "next/link";
import { Button } from "./ui";

export default function Footer() {
  const year = new Date().getFullYear();

  const socials = [
    { name: "Facebook", src: "/f.png" },
    { name: "Pinterest", src: "/p.png" },
    { name: "YouTube", src: "/yt.png" },
    { name: "Instagram", src: "/I.png" }, // or "/ig.png" if you named it differently
  ];

  return (
    <footer
      id="career"
      className="bg-gradient-to-b from-white to-[#e5efff] pt-12 pb-8 text-sm text-slate-700"
    >
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        {/* top: left content + right nav */}
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          {/* LEFT: logo, blurb, email form */}
          <div className="max-w-md space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-md bg-white shadow-sm ring-1 ring-slate-200">
                <Image
                  src="/occlogo.jpg"
                  alt="Our Common Commute"
                  width={24}
                  height={24}
                />
              </div>
            </div>

            <p className="text-[11px] font-medium leading-relaxed tracking-[0.14em] text-slate-700">
              FROM INSTANT MATCHING AND TRANSPARENT PRICING TO LIVE TRACKING
              AND SEAMLESS PAYMENTS, EVERY FEATURE IS DESIGNED TO GET YOU TO
              YOUR NEXT STOP — FASTER AND WITH TOTAL PEACE OF MIND.
            </p>

            {/* email subscribe */}
            <form className="mt-4 space-y-2">
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-xs uppercase tracking-wide text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                type="button"
                className="h-9 w-full max-w-[140px] rounded-md px-4 text-[11px] font-semibold uppercase tracking-wide"
              >
                Subscribe
              </Button>
            </form>
          </div>

          {/* RIGHT: features nav */}
          <div className="space-y-3 text-right md:text-left">
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">
              Features
            </h3>
            <ul className="space-y-2 text-[13px] font-medium text-slate-700">
              <li>
                <Link href="/about" className="hover:text-blue-600">
                  About us
                </Link>
              </li>
              <li>
                <Link href="/career" className="hover:text-blue-600">
                  Career
                </Link>
              </li>
              <li>
                <Link href="/support" className="hover:text-blue-600">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* bottom bar: copyright + socials */}
        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-4 text-[11px] text-slate-500 sm:flex-row">
          <span>© {year} Our Common Commute</span>

          <div className="flex gap-3">
            {socials.map((social) => (
              <button
                key={social.name}
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-full border border-slate-300 bg-white hover:border-blue-500"
                aria-label={social.name}
              >
                <Image
                  src={social.src}
                  alt={social.name}
                  width={14}
                  height={14}
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
